/**
 * Smart Tag Discovery Service
 * Discovers correct tags for each booru source
 */
import fetch from 'node-fetch';

export class TagDiscoveryService {
    constructor(cache) {
        this.cache = cache;
        this.userAgent = 'AnyaImageAPI/1.0';
    }
    
    normalize(name) {
        return name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w_()'-]/g, '');
    }
    
    generateVariations(characterName, seriesName = null) {
        const variations = new Set();
        const base = this.normalize(characterName);
        const parts = base.split('_');
        
        // Priority 1: first_name_(series) - most common format
        if (seriesName && parts[0]) {
            const series = this.normalize(seriesName);
            variations.add(`${parts[0]}_(${series})`);
        }
        
        // Priority 2: first name only
        if (parts[0]) variations.add(parts[0]);
        
        // Priority 3: full name with series
        if (seriesName) {
            const series = this.normalize(seriesName);
            variations.add(`${base}_(${series})`);
        }
        
        // Priority 4: full name
        variations.add(base);
        
        // Priority 5: name combinations
        if (parts[1]) {
            variations.add(`${parts[0]}_${parts[1]}`);
            variations.add(parts[1]);
        }
        
        return Array.from(variations);
    }
    
    calculateSimilarity(str1, str2) {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        
        if (s1 === s2) return 1.0;
        if (s1.includes(s2) || s2.includes(s1)) return 0.8;
        
        // Simple character overlap
        const set1 = new Set(s1);
        const set2 = new Set(s2);
        const intersection = [...set1].filter(c => set2.has(c)).length;
        const union = new Set([...set1, ...set2]).size;
        
        return intersection / union;
    }
    
    scoreTag(tag, charName, seriesName, count = 0) {
        let score = 0;
        const charNorm = this.normalize(charName);
        const charFirst = charNorm.split('_')[0];
        const tagBase = tag.replace(/\([^)]+\)$/, '').replace(/_$/, '');
        const tagFirst = tagBase.split('_')[0];
        
        // Series matching (highest priority)
        if (seriesName) {
            const series = this.normalize(seriesName);
            const match = tag.match(/\(([^)]+)\)$/);
            if (match) {
                const tagSeries = match[1];
                const seriesSimilarity = this.calculateSimilarity(series, tagSeries);
                
                // Perfect series match
                if (seriesSimilarity >= 0.8) {
                    // first_name_(series) = best
                    if (tagFirst === charFirst) {
                        score += 2000;
                    }
                    // full_name_(series) = good
                    else if (tagBase === charNorm) {
                        score += 1500;
                    }
                    // any_name_(series) = okay
                    else {
                        score += 1000;
                    }
                }
            }
        }
        
        // Character name matching
        const charSimilarity = this.calculateSimilarity(tagBase, charNorm);
        const firstSimilarity = this.calculateSimilarity(tagFirst, charFirst);
        
        if (charSimilarity >= 0.9) score += 800;
        else if (charSimilarity >= 0.7) score += 500;
        else if (firstSimilarity >= 0.9) score += 600;
        else if (firstSimilarity >= 0.7) score += 400;
        
        // Post count bonus (popularity indicator)
        if (count > 5000) score += 150;
        else if (count > 2000) score += 100;
        else if (count > 1000) score += 75;
        else if (count > 500) score += 50;
        else if (count > 100) score += 25;
        
        return score;
    }
    
    async fetchTags(source, term) {
        const configs = {
            safebooru: { url: 'https://safebooru.org/index.php', params: { page: 'dapi', s: 'tag', q: 'index', json: '1', name_pattern: `${term}%`, limit: 100 } },
            danbooru: { url: 'https://danbooru.donmai.us/tags.json', params: { 'search[name_matches]': `${term}*`, 'search[category]': '4', limit: 100 } },
            gelbooru: { url: 'https://gelbooru.com/index.php', params: { page: 'dapi', s: 'tag', q: 'index', json: '1', name_pattern: `${term}%`, limit: 100 } },
            yandere: { url: 'https://yande.re/tag.json', params: { name: `${term}*`, limit: 100 } },
            konachan: { url: 'https://konachan.net/tag.json', params: { name: `${term}*`, limit: 100 } }
        };
        
        const cfg = configs[source];
        if (!cfg) return [];
        
        try {
            const url = new URL(cfg.url);
            Object.entries(cfg.params).forEach(([k, v]) => url.searchParams.set(k, v));
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 3000); // Faster timeout
            
            const res = await fetch(url, { 
                headers: { 
                    'User-Agent': this.userAgent,
                    'Connection': 'keep-alive'
                }, 
                signal: controller.signal 
            });
            clearTimeout(timeout);
            
            if (!res.ok) return [];
            const data = await res.json();
            
            if (source === 'gelbooru') return (data?.tag || data || []).map(t => ({ name: t.name, count: +t.count || 0 }));
            return (Array.isArray(data) ? data : []).map(t => ({ name: t.name, count: t.post_count || t.count || 0 }));
        } catch { return []; }
    }
    
    async discoverTags(characterName, seriesName = null) {
        const key = `tags:${this.normalize(characterName)}:${seriesName || 'none'}`;
        const cached = this.cache.getTags(key);
        if (cached) return cached;
        
        const variations = this.generateVariations(characterName, seriesName);
        const sources = ['safebooru', 'danbooru', 'gelbooru', 'yandere', 'konachan'];
        const result = {};
        
        console.log(`[TagDiscovery] Trying variations:`, variations);
        
        await Promise.all(sources.map(async (src) => {
            const allTags = new Map();
            
            // Try ALL variations, not just first 3
            for (const variation of variations) {
                const tags = await this.fetchTags(src, variation);
                for (const t of tags) {
                    if (!allTags.has(t.name) || allTags.get(t.name).count < t.count) {
                        allTags.set(t.name, t);
                    }
                }
            }
            
            // Score all tags and get top 3
            const scoredTags = [];
            for (const [name, data] of allTags) {
                const score = this.scoreTag(name, characterName, seriesName, data.count);
                if (score > 0) {
                    scoredTags.push({ name, score, count: data.count });
                }
            }
            
            // Sort by score descending
            scoredTags.sort((a, b) => b.score - a.score);
            
            // Return top tag, or top 3 if we want to combine results later
            if (scoredTags.length > 0) {
                result[src] = scoredTags[0].name;
                console.log(`[TagDiscovery] ${src}: ${scoredTags[0].name} (score: ${scoredTags[0].score}, count: ${scoredTags[0].count})`);
                
                // Log top 3 for debugging
                if (scoredTags.length > 1) {
                    const top3 = scoredTags.slice(0, 3).map(t => `${t.name}(${t.score})`).join(', ');
                    console.log(`[TagDiscovery] ${src} top 3:`, top3);
                }
            } else {
                result[src] = this.normalize(characterName);
                console.log(`[TagDiscovery] ${src}: No tags found, using fallback`);
            }
        }));
        
        result.tbib = result.safebooru;
        result.anime_pictures = result.safebooru;
        
        this.cache.setTags(key, result);
        console.log(`[TagDiscovery] Final tags:`, result);
        return result;
    }
}
