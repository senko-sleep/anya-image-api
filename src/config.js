/**
 * ULTRA-FAST Configuration
 * Optimized for maximum speed
 */

export const SPEED_CONFIG = {
    // Connection pooling
    http: {
        keepAlive: true,
        keepAliveMsecs: 30000,
        maxSockets: 200,        // MASSIVE connection pool
        maxFreeSockets: 50
    },
    
    // Request timeouts
    timeouts: {
        fetch: 3000,            // 3s max per request
        tagDiscovery: 2000      // 2s for tag lookups
    },
    
    // Concurrency limits
    concurrency: {
        perSource: 100,         // 100 concurrent requests per source
        interval: 50,           // Check every 50ms
        intervalCap: 100        // 100 requests per interval
    },
    
    // Cache settings
    cache: {
        images: {
            max: 5000,          // 5000 searches cached
            ttl: 1000 * 60 * 60 * 12  // 12 hours
        },
        tags: {
            max: 10000,         // 10000 tag lookups cached
            ttl: 1000 * 60 * 60 * 72  // 72 hours
        }
    },
    
    // Fetch limits
    limits: {
        maxPagesPerSource: 200,
        imagesPerPage: 100
    }
};
