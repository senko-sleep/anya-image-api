/**
 * Anya Image API - Ultra-Fast Booru Image Search Proxy
 * 
 * Features:
 * - Intelligent rate limiting per source
 * - LRU caching for instant responses
 * - Parallel batch fetching with smart throttling
 * - Automatic tag discovery and normalization
 * - Deduplication across all sources
 */

import express from 'express';
import compression from 'compression';
import cors from 'cors';
import { ImageSearchService } from './services/imageSearch.js';
import { CacheService } from './services/cache.js';
import { TagDiscoveryService } from './services/tagDiscovery.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Services
const cache = new CacheService();
const tagDiscovery = new TagDiscoveryService(cache);
const imageSearch = new ImageSearchService(cache, tagDiscovery);

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Main search endpoint
app.get('/api/search', async (req, res) => {
    const startTime = Date.now();
    
    try {
        const { character, series, page = 1, limit = 100 } = req.query;
        
        if (!character) {
            return res.status(400).json({ error: 'Character name required' });
        }
        
        const result = await imageSearch.searchAll(character, series, parseInt(page), parseInt(limit));
        
        res.json({
            success: true,
            character,
            series: series || null,
            page: parseInt(page),
            limit: parseInt(limit),
            totalImages: result.totalImages,
            maxPages: result.maxPages,
            images: result.images,
            sources: result.sources,
            cached: result.cached,
            timing: Date.now() - startTime
        });
    } catch (error) {
        console.error('[API Error]', error);
        res.status(500).json({ error: error.message });
    }
});

// Tag discovery endpoint
app.get('/api/tags', async (req, res) => {
    try {
        const { character, series } = req.query;
        
        if (!character) {
            return res.status(400).json({ error: 'Character name required' });
        }
        
        const tags = await tagDiscovery.discoverTags(character, series);
        res.json({ success: true, tags });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Cache stats
app.get('/api/stats', (req, res) => {
    res.json({
        cache: cache.getStats(),
        uptime: process.uptime()
    });
});

// Clear cache
app.post('/api/cache/clear', (req, res) => {
    cache.clear();
    res.json({ success: true, message: 'Cache cleared' });
});

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    ANYA IMAGE API v1.0                       ║
║══════════════════════════════════════════════════════════════║
║  Status: ONLINE                                              ║
║  Port: ${PORT}                                                 ║
║  Endpoints:                                                  ║
║    GET  /api/search?character=X&series=Y&page=1&limit=100    ║
║    GET  /api/tags?character=X&series=Y                       ║
║    GET  /api/stats                                           ║
║    POST /api/cache/clear                                     ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

export default app;
