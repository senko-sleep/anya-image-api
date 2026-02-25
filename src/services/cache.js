/**
 * LRU Cache Service (Cloudflare Workers compatible)
 * - TTL-based expiration
 * - Map-based storage with max size eviction
 * - Stats tracking
 */

class TTLMap {
    constructor(max = 500, ttl = 7200000) {
        this.map = new Map();
        this.max = max;
        this.ttl = ttl;
    }

    get(key) {
        const entry = this.map.get(key);
        if (!entry) return undefined;
        if (Date.now() > entry.expires) {
            this.map.delete(key);
            return undefined;
        }
        // Move to end (most recently used)
        this.map.delete(key);
        entry.expires = Date.now() + this.ttl;
        this.map.set(key, entry);
        return entry.value;
    }

    set(key, value) {
        this.map.delete(key);
        if (this.map.size >= this.max) {
            // Evict oldest
            const oldest = this.map.keys().next().value;
            this.map.delete(oldest);
        }
        this.map.set(key, { value, expires: Date.now() + this.ttl });
    }

    has(key) {
        return this.get(key) !== undefined;
    }

    get size() { return this.map.size; }

    clear() { this.map.clear(); }
}

export class CacheService {
    constructor() {
        this.imageCache = new TTLMap(500, 1000 * 60 * 60 * 2);   // 2h TTL
        this.tagCache = new TTLMap(1000, 1000 * 60 * 60 * 24);   // 24h TTL
        this.stats = { hits: 0, misses: 0, tagHits: 0, tagMisses: 0 };
    }

    getImages(key) {
        const result = this.imageCache.get(key);
        if (result) { this.stats.hits++; return result; }
        this.stats.misses++;
        return null;
    }

    setImages(key, images) { this.imageCache.set(key, images); }
    hasImages(key) { return this.imageCache.has(key); }

    getTags(key) {
        const result = this.tagCache.get(key);
        if (result) { this.stats.tagHits++; return result; }
        this.stats.tagMisses++;
        return null;
    }

    setTags(key, tags) { this.tagCache.set(key, tags); }
    hasTags(key) { return this.tagCache.has(key); }

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
