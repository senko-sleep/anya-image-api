/**
 * Booru Source Configurations
 * Each source has its own rate limit and API format
 */

export const SOURCES = {
    safebooru: {
        name: 'Safebooru',
        baseUrl: 'https://safebooru.org/index.php',
        rateLimit: 2,
        concurrent: 5,
        maxPages: 100,
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
        maxPages: 50,
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
    
    gelbooru: {
        name: 'Gelbooru',
        baseUrl: 'https://gelbooru.com/index.php',
        rateLimit: 2,
        concurrent: 5,
        maxPages: 100,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                page: 'dapi', s: 'post', q: 'index', json: '1',
                tags: `${tag} rating:general`, pid: page - 1, limit
            });
            return `https://gelbooru.com/index.php?${params}`;
        },
        parse: (data) => {
            const posts = data?.post || (Array.isArray(data) ? data : []);
            return posts.map(p => ({
                id: p.id,
                url: p.file_url,
                preview: p.preview_url,
                width: p.width,
                height: p.height,
                score: p.score || 0,
                tags: p.tags?.split(' ') || [],
                source: 'Gelbooru'
            })).filter(p => p.url);
        }
    },
    
    yandere: {
        name: 'Yande.re',
        baseUrl: 'https://yande.re/post.json',
        rateLimit: 3,
        concurrent: 3,
        maxPages: 50,
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
        concurrent: 3,
        maxPages: 50,
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
        concurrent: 3,
        maxPages: 50,
        buildUrl: (tag, page, limit) => {
            const params = new URLSearchParams({
                page: 'dapi', s: 'post', q: 'index', json: '1',
                tags: tag, pid: page - 1, limit
            });
            return `https://tbib.org/index.php?${params}`;
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
                source: 'TBIB'
            })).filter(p => p.url);
        }
    }
};

export const SOURCE_LIST = Object.keys(SOURCES);
