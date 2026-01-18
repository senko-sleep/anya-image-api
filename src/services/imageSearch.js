/**
 * ULTRA-FAST Image Search Service
 * - MAXIMUM parallel fetching
 * - Connection pooling with keep-alive
 * - Aggressive concurrency
 * - NO rate limits (YOLO mode)
 */
import fetch from 'node-fetch';
import PQueue from 'p-queue';
import { SOURCES, SOURCE_LIST } from './sources.js';
import http from 'http';
import https from 'https';

export class ImageSearchService {
    constructor(cache, tagDiscovery) {
        this.cache = cache;
        this.tagDiscovery = tagDiscovery;
        this.userAgent = 'AnyaImageAPI/1.0';
        
        // Connection pooling with keep-alive for SPEED
        this.httpAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: 100,
            maxFreeSockets: 20
        });
        
        this.httpsAgent = new https.Agent({
            keepAlive: true,
            keepAliveMsecs: 30000,
            maxSockets: 100,
            maxFreeSockets: 20
        });
        
        // AGGRESSIVE queues - max concurrency, minimal delays
        this.queues = {};
        for (const [name, config] of Object.entries(SOURCES)) {
            this.queues[name] = new PQueue({
                concurrency: 50,  // MAX CONCURRENT
                interval: 100,    // Minimal delay
                intervalCap: 50   // Max requests per interval
            });
        }
    }
    
    /**
     * Fetch a single page from a source - ULTRA FAST
     */
    async fetchPage(source, tag, page, limit = 100) {
        const config = SOURCES[source];
        if (!config) return [];
        
        try {
            const url = config.buildUrl(tag, page, limit);
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000); // Faster timeout
            
            const res = await fetch(url, {
                headers: { 
                    'User-Agent': this.userAgent, 
                    'Accept': 'application/json',
                    'Connection': 'keep-alive'
                },
                signal: controller.signal,
                agent: url.startsWith('https') ? this.httpsAgent : this.httpAgent
            });
            clearTimeout(timeout);
            
            if (!res.ok) {
                // Ignore rate limits, just skip and move on
                return [];
            }
            
            const data = await res.json();
            return config.parse(data);
        } catch (err) {
            // Silent fail - speed over perfection
            return [];
        }
    }
    
    /**
     * Fetch all pages from a source - MAXIMUM SPEED
     */
    async fetchAllPages(source, tag) {
        const config = SOURCES[source];
        const queue = this.queues[source];
        const allImages = [];
        const limit = 100;
        
        // AGGRESSIVE: Fire ALL requests at once, no batching
        const maxPages = Math.min(config.maxPages, 200);
        const promises = [];
        
        for (let page = 1; page <= maxPages; page++) {
            promises.push(
                queue.add(() => this.fetchPage(source, tag, page, limit))
                    .catch(() => []) // Silent fail
            );
        }
        
        // Wait for ALL at once
        const results = await Promise.allSettled(promises);
        
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                allImages.push(...result.value);
            }
        }
        
        console.log(`[${source}] Fetched ${allImages.length} images`);
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
