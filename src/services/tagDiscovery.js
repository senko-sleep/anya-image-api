/**
 * Smart Tag Discovery Service
 * Discovers correct tags for each booru source
 */
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
        
        variations.add(base);
        if (parts[0]) variations.add(parts[0]);
        if (parts[1]) {
            variations.add(`${parts[0]}_${parts[1]}`);
            variations.add(parts[1]);
        }
        
        if (seriesName) {
            const series = this.normalize(seriesName);
            variations.add(`${parts[0]}_(${series})`);
            variations.add(`${base}_(${series})`);
        }
        
        return Array.from(variations);
    }
    
    scoreTag(tag, charName, seriesName, count = 0) {
        let score = 0;
        const charNorm = this.normalize(charName);
        const charFirst = charNorm.split('_')[0];
        const tagBase = tag.replace(/\([^)]+\)$/, '').replace(/_$/, '');
        
        if (seriesName) {
            const series = this.normalize(seriesName);
            const match = tag.match(/\(([^)]+)\)$/);
            if (match && (series.includes(match[1]) || match[1].includes(series))) {
                if (tagBase.split('_')[0] === charFirst) score += 1000;
                else score += 500;
            }
        }
        
        if (tag === charNorm) score += 500;
        else if (tagBase.split('_')[0] === charFirst) score += 300;
        if (count > 1000) score += 50;
        
        return score;
    }
    
    async fetchTags(source, term) {
        const configs = {
            safebooru: { url: 'https://safebooru.org/index.php', params: { page: 'dapi', s: 'tag', q: 'index', json: '1', name_pattern: `${term}%`, limit: 50 } },
            danbooru: { url: 'https://danbooru.donmai.us/tags.json', params: { 'search[name_matches]': `${term}*`, 'search[category]': '4', limit: 50 } },
            gelbooru: { url: 'https://gelbooru.com/index.php', params: { page: 'dapi', s: 'tag', q: 'index', json: '1', name_pattern: `${term}%`, limit: 50 } },
            yandere: { url: 'https://yande.re/tag.json', params: { name: `${term}*`, limit: 50 } },
            konachan: { url: 'https://konachan.net/tag.json', params: { name: `${term}*`, limit: 50 } }
        };
        
        const cfg = configs[source];
        if (!cfg) return [];
        
        try {
            const url = new URL(cfg.url);
            Object.entries(cfg.params).forEach(([k, v]) => url.searchParams.set(k, v));
            
            // NO TIMEOUT - mass production mode
            const res = await fetch(url, { headers: { 'User-Agent': this.userAgent } });
            
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
        const result = {};
        
        // Step 1: Use Danbooru autocomplete as primary — it has the best tag database
        // This finds qualified tags like anya_(spy_x_family)
        let primaryTag = null;
        const danbooruTags = new Map();
        
        for (const variation of variations.slice(0, 3)) {
            const tags = await this.fetchTags('danbooru', variation);
            for (const t of tags) {
                if (!danbooruTags.has(t.name) || danbooruTags.get(t.name).count < t.count) {
                    danbooruTags.set(t.name, t);
                }
            }
        }
        
        // Find best Danbooru tag (prefer qualified tags with series in parens)
        let bestScore = 0;
        for (const [name, data] of danbooruTags) {
            const score = this.scoreTag(name, characterName, seriesName, data.count);
            if (score > bestScore) {
                bestScore = score;
                primaryTag = name;
            }
        }
        
        if (!primaryTag) primaryTag = this.normalize(characterName);
        
        // Step 2: Share the best qualified tag across ALL booru sources
        const booruSources = ['safebooru', 'danbooru', 'yandere', 'konachan', 'tbib'];
        for (const src of booruSources) {
            result[src] = primaryTag;
        }
        
        // Step 3: Source-specific overrides ONLY if they find a qualified tag
        // (contains parentheses like "anya_(spy_x_family)")
        // This prevents wrong tags like "anya_forger" from overriding the correct one
        const sourceSpecific = ['safebooru', 'yandere', 'konachan'];
        await Promise.all(sourceSpecific.map(async (src) => {
            const allTags = new Map();
            for (const variation of variations.slice(0, 2)) {
                const tags = await this.fetchTags(src, variation);
                for (const t of tags) {
                    if (!allTags.has(t.name) || allTags.get(t.name).count < t.count) {
                        allTags.set(t.name, t);
                    }
                }
            }
            
            let srcBest = null, srcBestScore = 0;
            for (const [name, data] of allTags) {
                const score = this.scoreTag(name, characterName, seriesName, data.count);
                if (score > srcBestScore) {
                    srcBestScore = score;
                    srcBest = name;
                }
            }
            
            // Only override if source found a QUALIFIED tag (with series in parens)
            // or if Danbooru didn't find a qualified tag either
            if (srcBest && (srcBest.includes('_(') || !primaryTag.includes('_('))) {
                if (srcBestScore >= bestScore) {
                    result[src] = srcBest;
                }
            }
        }));
        
        // Step 4: Non-booru sources use character name directly
        const nameSpaced = characterName;
        result.wallhaven = nameSpaced;
        result.wallpapers_com = nameSpaced;
        
        this.cache.setTags(key, result);
        console.log(`[TagDiscovery] Discovered:`, result);
        return result;
    }
}
