/**
 * Booru Source Configurations
 * Each source has its own rate limit and API format
 */

export const SOURCES = {
    safebooru: {
        name: 'Safebooru',
        baseUrl: 'https://safebooru.org/index.php',
        rateLimit: 2,
        concurrent: 3,
        maxPages: 10,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                page: 'dapi', s: 'post', q: 'index', json: '1',
                tags: tag, pid: page - 1, limit
            });
            return `https://safebooru.org/index.php?${params}`;
        },
        parse: (data) => {
            const posts = Array.isArray(data) ? data : [];
            return posts.map(p => ({
                id: p.id,
                url: p.file_url?.startsWith('//') ? `https:${p.file_url}` : p.file_url,
                preview: p.preview_url?.startsWith('//') ? `https:${p.preview_url}` : p.preview_url,
                width: p.width,
                height: p.height,
                score: p.score || 0,
                tags: p.tags?.split(' ') || [],
                source: 'Safebooru'
            })).filter(p => p.url);
        }
    },
    
    danbooru: {
        name: 'Danbooru',
        baseUrl: 'https://danbooru.donmai.us/posts.json',
        rateLimit: 1,
        concurrent: 2,
        maxPages: 10,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                tags: `${tag} rating:general`,
                page, limit: Math.min(limit, 100)
            });
            return `https://danbooru.donmai.us/posts.json?${params}`;
        },
        parse: (data) => {
            const posts = Array.isArray(data) ? data : [];
            return posts.map(p => ({
                id: p.id,
                url: p.file_url || p.large_file_url,
                preview: p.preview_file_url,
                width: p.image_width,
                height: p.image_height,
                score: p.score || 0,
                tags: p.tag_string?.split(' ') || [],
                source: 'Danbooru'
            })).filter(p => p.url && !p.url.includes('deleted'));
        }
    },
    
    yandere: {
        name: 'Yande.re',
        baseUrl: 'https://yande.re/post.json',
        rateLimit: 3,
        concurrent: 3,
        maxPages: 10,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                tags: `${tag} rating:safe`, page, limit
            });
            return `https://yande.re/post.json?${params}`;
        },
        parse: (data) => {
            const posts = Array.isArray(data) ? data : [];
            return posts.map(p => ({
                id: p.id,
                url: p.file_url || p.jpeg_url,
                preview: p.preview_url,
                width: p.width,
                height: p.height,
                score: p.score || 0,
                tags: p.tags?.split(' ') || [],
                source: 'Yande.re'
            })).filter(p => p.url);
        }
    },
    
    konachan: {
        name: 'Konachan',
        baseUrl: 'https://konachan.net/post.json',
        rateLimit: 3,
        concurrent: 2,
        maxPages: 10,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                tags: `${tag} rating:safe`, page, limit
            });
            return `https://konachan.net/post.json?${params}`;
        },
        parse: (data) => {
            const posts = Array.isArray(data) ? data : [];
            return posts.map(p => ({
                id: p.id,
                url: p.file_url || p.jpeg_url,
                preview: p.preview_url,
                width: p.width,
                height: p.height,
                score: p.score || 0,
                tags: p.tags?.split(' ') || [],
                source: 'Konachan'
            })).filter(p => p.url);
        }
    },
    
    tbib: {
        name: 'TBIB',
        baseUrl: 'https://tbib.org/index.php',
        rateLimit: 2,
        concurrent: 2,
        maxPages: 10,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                page: 'dapi', s: 'post', q: 'index', json: '1',
                tags: tag, pid: page - 1, limit
            });
            return `https://tbib.org/index.php?${params}`;
        },
        parse: (data) => {
            const posts = Array.isArray(data) ? data : [];
            return posts.map(p => {
                // TBIB doesn't include file_url - construct from directory + image
                let url = p.file_url;
                if (!url && p.directory && p.image) {
                    url = `https://tbib.org/images/${p.directory}/${p.image}`;
                }
                if (url?.startsWith('//')) url = 'https:' + url;
                
                let preview = p.preview_url;
                if (!preview && p.directory && p.image) {
                    preview = `https://tbib.org/thumbnails/${p.directory}/thumbnail_${p.image}`;
                }
                if (preview?.startsWith('//')) preview = 'https:' + preview;
                
                return {
                    id: p.id,
                    url,
                    preview,
                    width: p.width,
                    height: p.height,
                    score: p.score || 0,
                    tags: p.tags?.split(' ') || [],
                    source: 'TBIB'
                };
            }).filter(p => p.url);
        }
    },

    wallhaven: {
        name: 'Wallhaven',
        baseUrl: 'https://wallhaven.cc/api/v1/search',
        rateLimit: 3,
        concurrent: 2,
        maxPages: 20,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                q: tag.replace(/_/g, ' '),
                categories: '010',  // Anime only
                purity: '100',      // SFW only
                sorting: 'relevance',
                page
            });
            return `https://wallhaven.cc/api/v1/search?${params}`;
        },
        parse: (data) => {
            const posts = data?.data || [];
            return posts.map(p => {
                const tags = (p.tags || []).map(t => t.name || t).filter(Boolean);
                return {
                    id: p.id,
                    url: p.path,
                    preview: p.thumbs?.large || p.thumbs?.original || p.path,
                    width: p.dimension_x || 1920,
                    height: p.dimension_y || 1080,
                    score: p.favorites || 0,
                    tags,
                    source: 'Wallhaven'
                };
            }).filter(p => p.url);
        }
    },

    wallpapers_com: {
        name: 'wallpapers.com',
        baseUrl: 'https://wallpapers.com',
        rateLimit: 3,
        concurrent: 1,
        maxPages: 10,
        responseType: 'html',
        buildUrl: (tag, page) => {
            const slug = tag.replace(/_/g, '-').replace(/\s+/g, '-').toLowerCase();
            let url = `https://wallpapers.com/search/${slug}`;
            if (page > 1) url += `?page=${page}`;
            return url;
        },
        parseHtml: (html) => {
            const results = [];
            const seen = new Set();
            // Match /images/hd/ paths (high quality wallpapers)
            const pattern = /(?:data-src|src)=["']([^"']*\/images\/hd\/[^"']*\.(?:jpg|jpeg|png|webp))["']/gi;
            let match;
            while ((match = pattern.exec(html)) !== null) {
                let url = match[1].trim();
                if (url.startsWith('//')) url = 'https:' + url;
                else if (url.startsWith('/')) url = 'https://wallpapers.com' + url;
                if (seen.has(url) || !url.startsWith('http')) continue;
                if (/icon|logo|avatar|favicon|sprite|banner|ads/i.test(url)) continue;
                seen.add(url);
                results.push({
                    id: `wcom_${url.split('/').pop().split('.')[0]}`,
                    url,
                    preview: url,
                    width: 1920,
                    height: 1080,
                    score: 0,
                    tags: [],
                    source: 'wallpapers.com'
                });
            }
            return results;
        }
    }
};

export const SOURCE_LIST = Object.keys(SOURCES);
