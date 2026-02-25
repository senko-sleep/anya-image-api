/**
 * Anya Image API - Cloudflare Worker
 * 
 * Ultra-fast booru image search with Cloudflare Images CDN.
 * Runs on Cloudflare Workers (no Express, no Node.js deps).
 */

import { ImageSearchService } from './services/imageSearch.js';
import { CacheService } from './services/cache.js';
import { TagDiscoveryService } from './services/tagDiscovery.js';
import { CloudflareImagesService } from './services/cloudflare.js';

// Shared service instances (persist across requests in the same isolate)
let cache, tagDiscovery, imageSearch, cloudflare;

function initServices(env) {
    if (!cache) {
        cache = new CacheService();
        tagDiscovery = new TagDiscoveryService(cache);
        imageSearch = new ImageSearchService(cache, tagDiscovery);
        cloudflare = new CloudflareImagesService(env);
    }
}

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}

export default {
    async fetch(request, env) {
        initServices(env);

        const url = new URL(request.url);
        const path = url.pathname;

        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        try {
            // Health check
            if (path === '/health') {
                return json({ status: 'ok' });
            }

            // Search images
            if (path === '/api/search' && request.method === 'GET') {
                const startTime = Date.now();
                const character = url.searchParams.get('character');
                const series = url.searchParams.get('series');
                const page = parseInt(url.searchParams.get('page') || '1');
                const limit = parseInt(url.searchParams.get('limit') || '100');
                const cf = url.searchParams.get('cf') === 'true';

                if (!character) {
                    return json({ error: 'Character name required' }, 400);
                }

                const result = await imageSearch.searchAll(character, series, page, limit);

                let images = result.images;
                let cloudflareProcessed = false;

                if (cf && cloudflare.enabled) {
                    images = await cloudflare.processImages(images, character, 5);
                    cloudflareProcessed = true;
                }

                return json({
                    success: true,
                    character,
                    series: series || null,
                    page, limit,
                    totalImages: result.totalImages,
                    maxPages: result.maxPages,
                    images,
                    sources: result.sources,
                    cached: result.cached,
                    cloudflare: cloudflareProcessed,
                    timing: Date.now() - startTime
                });
            }

            // Tag discovery
            if (path === '/api/tags' && request.method === 'GET') {
                const character = url.searchParams.get('character');
                const series = url.searchParams.get('series');

                if (!character) {
                    return json({ error: 'Character name required' }, 400);
                }

                const tags = await tagDiscovery.discoverTags(character, series);
                return json({ success: true, tags });
            }

            // Stats
            if (path === '/api/stats' && request.method === 'GET') {
                const cfStats = await cloudflare.getStats();
                return json({ cache: cache.getStats(), cloudflare: cfStats });
            }

            // Cloudflare upload
            if (path === '/api/cloudflare/upload' && request.method === 'POST') {
                const body = await request.json();
                const { url: imageUrl, character, source } = body;

                if (!imageUrl) return json({ error: 'Image URL required' }, 400);
                if (!cloudflare.enabled) return json({ error: 'Cloudflare Images not configured' }, 503);

                const cfUrl = await cloudflare.uploadFromUrl(imageUrl, { character, source });
                if (cfUrl) {
                    return json({ success: true, url: cfUrl, original: imageUrl });
                }
                return json({ error: 'Failed to upload to Cloudflare' }, 500);
            }

            // Cloudflare delete
            if (path.startsWith('/api/cloudflare/image/') && request.method === 'DELETE') {
                if (!cloudflare.enabled) return json({ error: 'Cloudflare Images not configured' }, 503);
                const imageId = path.split('/').pop();
                const success = await cloudflare.deleteImage(imageId);
                return json({ success });
            }

            // Clear cache
            if (path === '/api/cache/clear' && request.method === 'POST') {
                cache.clear();
                return json({ success: true, message: 'Cache cleared' });
            }

            return json({ error: 'Not found' }, 404);

        } catch (error) {
            console.error('[API Error]', error);
            return json({ error: error.message }, 500);
        }
    }
};
