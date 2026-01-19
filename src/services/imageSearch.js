/**
 * Ultra-Fast Image Search Service - MASS PRODUCTION MODE
 * - NO timeouts, maximum speed
 * - Aggressive parallel fetching
 * - Deduplication across sources
 */
import fetch from 'node-fetch';
import PQueue from 'p-queue';
import { SOURCES, SOURCE_LIST } from './sources.js';

export class ImageSearchService {
    constructor(cache, tagDiscovery) {
        this.cache = cache;
        this.tagDiscovery = tagDiscovery;
        this.userAgent = 'AnyaImageAPI/1.0';
        
        // MASS PRODUCTION: Aggressive queues with higher concurrency
        this.queues = {};
        for (const [name, config] of Object.entries(SOURCES)) {
            this.queues[name] = new PQueue({
                concurrency: config.concurrent * 3, // 3x concurrency
                interval: 1000,
                intervalCap: config.rateLimit * 2 // 2x rate limit
            });
        }
    }
    
    /**
     * Fetch a single page from a source - NO TIMEOUT
     */
    async fetchPage(source, tag, page, limit = 100) {
        const config = SOURCES[source];
        if (!config) return [];
        
        try {
            const url = config.buildUrl(tag, page, limit);
            
            // NO TIMEOUT - let it run as fast as possible
            const res = await fetch(url, {
                headers: { 'User-Agent': this.userAgent, 'Accept': 'application/json' }
            });
            
            if (!res.ok) {
                // Don't wait on rate limits, just skip
                return [];
            }
            
            const data = await res.json();
            return config.parse(data);
        } catch (err) {
            // Silent fail, keep going
            return [];
        }
    }
    
    /**
     * Fetch all pages from a source - SMART MASS PRODUCTION
     */
    async fetchAllPages(source, tag) {
        const config = SOURCES[source];
        const queue = this.queues[source];
        const allImages = [];
        const limit = 100;
        
        // SMART: Fetch in aggressive waves, stop when pages are empty
        const waveSize = 20; // Fetch 20 pages at a time
        let page = 1;
        let consecutiveEmpty = 0;
        
        while (page <= config.maxPages && consecutiveEmpty < 3) {
            const wave = [];
            for (let i = 0; i < waveSize && page <= config.maxPages; i++, page++) {
                wave.push(queue.add(() => this.fetchPage(source, tag, page, limit)));
            }
            
            const results = await Promise.all(wave);
            let waveHadResults = false;
            
            for (const images of results) {
                if (images && images.length > 0) {
                    allImages.push(...images);
                    waveHadResults = true;
                }
            }
            
            // Stop if 3 consecutive waves are empty
            if (!waveHadResults) {
                consecutiveEmpty++;
            } else {
                consecutiveEmpty = 0;
            }
        }
        
        console.log(`[${source}] Fetched ${allImages.length} images (${page-1} pages checked)`);
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
