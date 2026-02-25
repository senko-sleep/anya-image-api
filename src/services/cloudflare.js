/**
 * Cloudflare Images API Service
 * 
 * Proxies and caches cover art images through Cloudflare Images
 * for faster global delivery and persistent caching.
 * 
 * Features:
 * - Upload images to Cloudflare Images
 * - Generate optimized delivery URLs
 * - Cache management with variants
 */

export class CloudflareImagesService {
    constructor(env = {}) {
        this.accountId = env.CLOUDFLARE_ACCOUNT_ID || '';
        this.apiToken = env.CLOUDFLARE_API_TOKEN || '';
        this.imageDeliveryUrl = env.CLOUDFLARE_IMAGES_URL || `https://imagedelivery.net/${this.accountId}`;
        
        // In-memory cache for URL mappings (original -> cloudflare)
        this.urlCache = new Map();
        this.cacheMaxSize = 10000;
        
        // Check if Cloudflare is configured
        this.enabled = !!(this.accountId && this.apiToken);
        
        if (this.enabled) {
            console.log('[Cloudflare] Images API enabled');
        } else {
            console.log('[Cloudflare] Images API disabled (missing credentials)');
        }
    }
    
    /**
     * Generate a unique image ID from the source URL (sync, simple hash)
     */
    generateImageId(url) {
        let hash = 0;
        for (let i = 0; i < url.length; i++) {
            const char = url.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit int
        }
        return Math.abs(hash).toString(16).padStart(8, '0');
    }
    
    /**
     * Upload an image to Cloudflare Images from URL
     */
    async uploadFromUrl(sourceUrl, metadata = {}) {
        if (!this.enabled) return null;
        
        const imageId = this.generateImageId(sourceUrl);
        
        // Check cache first
        if (this.urlCache.has(sourceUrl)) {
            return this.urlCache.get(sourceUrl);
        }
        
        try {
            const formData = new URLSearchParams();
            formData.append('url', sourceUrl);
            formData.append('id', imageId);
            formData.append('metadata', JSON.stringify({
                source: metadata.source || 'unknown',
                character: metadata.character || '',
                originalUrl: sourceUrl,
                uploadedAt: new Date().toISOString()
            }));
            
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`,
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: formData.toString()
                }
            );
            
            const data = await response.json();
            
            if (data.success && data.result) {
                const cfUrl = this.getDeliveryUrl(data.result.id);
                this.cacheUrl(sourceUrl, cfUrl);
                return cfUrl;
            } else if (data.errors?.[0]?.code === 5409) {
                // Image already exists, return cached URL
                const cfUrl = this.getDeliveryUrl(imageId);
                this.cacheUrl(sourceUrl, cfUrl);
                return cfUrl;
            }
            
            console.log(`[Cloudflare] Upload failed: ${data.errors?.[0]?.message || 'Unknown error'}`);
            return null;
        } catch (error) {
            console.error(`[Cloudflare] Upload error: ${error.message}`);
            return null;
        }
    }
    
    /**
     * Get Cloudflare delivery URL for an image
     */
    getDeliveryUrl(imageId, variant = 'public') {
        return `${this.imageDeliveryUrl}/${imageId}/${variant}`;
    }
    
    /**
     * Cache URL mapping with LRU eviction
     */
    cacheUrl(originalUrl, cfUrl) {
        if (this.urlCache.size >= this.cacheMaxSize) {
            // Remove oldest entry
            const firstKey = this.urlCache.keys().next().value;
            this.urlCache.delete(firstKey);
        }
        this.urlCache.set(originalUrl, cfUrl);
    }
    
    /**
     * Process an array of images, uploading to Cloudflare in parallel
     */
    async processImages(images, character = '', batchSize = 10) {
        if (!this.enabled || !images.length) return images;
        
        const results = [];
        
        // Process in batches to avoid rate limits
        for (let i = 0; i < images.length; i += batchSize) {
            const batch = images.slice(i, i + batchSize);
            
            const processed = await Promise.all(
                batch.map(async (img) => {
                    const cfUrl = await this.uploadFromUrl(img.url, {
                        source: img.source,
                        character
                    });
                    
                    return {
                        ...img,
                        url: cfUrl || img.url,
                        preview: cfUrl ? this.getDeliveryUrl(this.generateImageId(img.url), 'thumbnail') : img.preview,
                        cloudflare: !!cfUrl
                    };
                })
            );
            
            results.push(...processed);
        }
        
        const cfCount = results.filter(r => r.cloudflare).length;
        console.log(`[Cloudflare] Processed ${cfCount}/${results.length} images`);
        
        return results;
    }
    
    /**
     * Delete an image from Cloudflare
     */
    async deleteImage(imageId) {
        if (!this.enabled) return false;
        
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/${imageId}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`
                    }
                }
            );
            
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error(`[Cloudflare] Delete error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Get usage stats from Cloudflare
     */
    async getStats() {
        if (!this.enabled) return { enabled: false };
        
        try {
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1/stats`,
                {
                    headers: {
                        'Authorization': `Bearer ${this.apiToken}`
                    }
                }
            );
            
            const data = await response.json();
            
            if (data.success) {
                return {
                    enabled: true,
                    current: data.result.count?.current || 0,
                    allowed: data.result.count?.allowed || 0,
                    cacheSize: this.urlCache.size
                };
            }
        } catch (error) {
            console.error(`[Cloudflare] Stats error: ${error.message}`);
        }
        
        return { enabled: true, error: 'Failed to fetch stats' };
    }
}
