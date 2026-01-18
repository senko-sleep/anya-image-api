/**
 * High-Performance LRU Cache Service
 * - TTL-based expiration
 * - Memory-efficient storage
 * - Stats tracking
 */

import { LRUCache } from 'lru-cache';

export class CacheService {
    constructor() {
        // Main image cache - stores search results
        this.imageCache = new LRUCache({
            max: 500,                    // Max 500 character searches
            ttl: 1000 * 60 * 60 * 2,    // 2 hour TTL
            updateAgeOnGet: true,
            allowStale: false
        });
        
        // Tag cache - stores discovered tags per source
        this.tagCache = new LRUCache({
            max: 1000,
            ttl: 1000 * 60 * 60 * 24,   // 24 hour TTL for tags
            updateAgeOnGet: true
        });
        
        // Stats
        this.stats = {
            hits: 0,
            misses: 0,
            tagHits: 0,
            tagMisses: 0
        };
    }
    
    // Image cache methods
    getImages(key) {
        const result = this.imageCache.get(key);
        if (result) {
            this.stats.hits++;
            return result;
        }
        this.stats.misses++;
        return null;
    }
    
    setImages(key, images) {
        this.imageCache.set(key, images);
    }
    
    hasImages(key) {
        return this.imageCache.has(key);
    }
    
    // Tag cache methods
    getTags(key) {
        const result = this.tagCache.get(key);
        if (result) {
            this.stats.tagHits++;
            return result;
        }
        this.stats.tagMisses++;
        return null;
    }
    
    setTags(key, tags) {
        this.tagCache.set(key, tags);
    }
    
    hasTags(key) {
        return this.tagCache.has(key);
    }
    
    // Stats
    getStats() {
        return {
            images: {
                size: this.imageCache.size,
                hits: this.stats.hits,
                misses: this.stats.misses,
                hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
            },
            tags: {
                size: this.tagCache.size,
                hits: this.stats.tagHits,
                misses: this.stats.tagMisses,
                hitRate: this.stats.tagHits / (this.stats.tagHits + this.stats.tagMisses) || 0
            }
        };
    }
    
    clear() {
        this.imageCache.clear();
        this.tagCache.clear();
        this.stats = { hits: 0, misses: 0, tagHits: 0, tagMisses: 0 };
    }
}
