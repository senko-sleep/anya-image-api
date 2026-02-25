/**
 * Ultra-Fast Image Search Service - MASS PRODUCTION MODE
 * - NO timeouts, maximum speed
 * - Aggressive parallel fetching
 * - Deduplication across sources
 */
import { SOURCES, SOURCE_LIST } from './sources.js';

export class ImageSearchService {
    constructor(cache, tagDiscovery) {
        this.cache = cache;
        this.tagDiscovery = tagDiscovery;
        this.userAgent = 'AnyaImageAPI/1.0';
    }
    
    /**
     * Fetch a single page from a source - NO TIMEOUT
     */
    async fetchPage(source, tag, page, limit = 100) {
        const config = SOURCES[source];
        if (!config) return [];
        
        try {
            const url = config.buildUrl(tag, page, limit);
            const isHtml = config.responseType === 'html';
            
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': isHtml 
                    ? 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
                    : 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            };
            
            // Add referer for sites that need it
            if (source === 'wallpapers_com') headers['Referer'] = 'https://wallpapers.com/';
            if (source === 'zerochan') headers['Referer'] = 'https://www.zerochan.net/';
            
            const res = await fetch(url, { headers });
            
            if (!res.ok) {
                if (res.status !== 429) console.log(`[${source}] HTTP ${res.status} for page ${page}`);
                return [];
            }
            
            if (isHtml) {
                const html = await res.text();
                return config.parseHtml(html);
            } else {
                const data = await res.json();
                return config.parse(data);
            }
        } catch (err) {
            console.log(`[${source}] Error page ${page}: ${err.message}`);
            return [];
        }
    }
    
    /**
     * Fetch pages from a source with smart batching
     */
    async fetchAllPages(source, tag) {
        const config = SOURCES[source];
        const allImages = [];
        const limit = 100;
        
        // Smaller waves to avoid rate limiting — tuned per source type
        const waveSize = config.concurrent || 3;
        const maxPages = Math.min(config.maxPages || 10, 15); // Cap at 15 pages per source
        let page = 1;
        let emptyWaves = 0;
        
        while (page <= maxPages && emptyWaves < 2) {
            const wave = [];
            for (let i = 0; i < waveSize && page <= maxPages; i++, page++) {
                wave.push(this.fetchPage(source, tag, page, limit));
            }
            
            const results = await Promise.all(wave);
            let waveHadResults = false;
            
            for (const images of results) {
                if (images && images.length > 0) {
                    allImages.push(...images);
                    waveHadResults = true;
                }
            }
            
            if (!waveHadResults) {
                emptyWaves++;
            } else {
                emptyWaves = 0;
            }
        }
        
        if (allImages.length > 0) {
            console.log(`[${source}] Fetched ${allImages.length} images (${page-1} pages)`);
        }
        return allImages;
    }
    
    /**
     * Search all sources in parallel
     */
    async searchAll(characterName, seriesName = null, page = 1, limit = 100) {
        const cacheKey = `search:${characterName.toLowerCase()}:${(seriesName || 'none').toLowerCase()}`;
        
        // Check cache first
        const cached = this.cache.getImages(cacheKey);
        if (cached) {
            console.log(`[Search] Cache hit for ${characterName}`);
            return this.paginateResults(cached, page, limit, true);
        }
        
        console.log(`[Search] Fetching ${characterName} from all sources...`);
        const startTime = Date.now();
        
        // Discover tags for each source
        const tags = await this.tagDiscovery.discoverTags(characterName, seriesName);
        
        // Fetch from all sources in parallel
        const sourcePromises = SOURCE_LIST.map(async (source) => {
            const tag = tags[source] || characterName.toLowerCase().replace(/\s+/g, '_');
            return { source, images: await this.fetchAllPages(source, tag) };
        });
        
        const results = await Promise.all(sourcePromises);
        
        // Deduplicate by URL
        const seen = new Set();
        const allImages = [];
        const sourceCounts = {};
        
        for (const { source, images } of results) {
            sourceCounts[source] = 0;
            for (const img of images) {
                if (img.url && !seen.has(img.url)) {
                    seen.add(img.url);
                    allImages.push(img);
                    sourceCounts[source]++;
                }
            }
        }
        
        // Sort by score
        allImages.sort((a, b) => (b.score || 0) - (a.score || 0));
        
        const elapsed = Date.now() - startTime;
        console.log(`[Search] Found ${allImages.length} unique images in ${elapsed}ms`);
        console.log(`[Search] Sources:`, sourceCounts);
        
        // Cache results
        this.cache.setImages(cacheKey, { images: allImages, sources: sourceCounts });
        
        return this.paginateResults({ images: allImages, sources: sourceCounts }, page, limit, false);
    }
    
    /**
     * Paginate cached results
     */
    paginateResults(data, page, limit, cached) {
        const { images, sources } = data;
        const totalImages = images.length;
        const maxPages = Math.max(1, Math.ceil(totalImages / limit));
        const start = (page - 1) * limit;
        const pageImages = images.slice(start, start + limit);
        
        return {
            images: pageImages,
            totalImages,
            maxPages,
            sources,
            cached
        };
    }
}
