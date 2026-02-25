var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-W3tCDP/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// src/services/sources.js
var SOURCES = {
  safebooru: {
    name: "Safebooru",
    baseUrl: "https://safebooru.org/index.php",
    rateLimit: 2,
    concurrent: 3,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        json: "1",
        tags: tag,
        pid: page - 1,
        limit
      });
      return `https://safebooru.org/index.php?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = Array.isArray(data) ? data : [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url?.startsWith("//") ? `https:${p.file_url}` : p.file_url,
        preview: p.preview_url?.startsWith("//") ? `https:${p.preview_url}` : p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score || 0,
        tags: p.tags?.split(" ") || [],
        source: "Safebooru"
      })).filter((p) => p.url);
    }, "parse")
  },
  danbooru: {
    name: "Danbooru",
    baseUrl: "https://danbooru.donmai.us/posts.json",
    rateLimit: 1,
    concurrent: 2,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        tags: `${tag} rating:general`,
        page,
        limit: Math.min(limit, 100)
      });
      return `https://danbooru.donmai.us/posts.json?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = Array.isArray(data) ? data : [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url || p.large_file_url,
        preview: p.preview_file_url,
        width: p.image_width,
        height: p.image_height,
        score: p.score || 0,
        tags: p.tag_string?.split(" ") || [],
        source: "Danbooru"
      })).filter((p) => p.url && !p.url.includes("deleted"));
    }, "parse")
  },
  gelbooru: {
    name: "Gelbooru",
    baseUrl: "https://gelbooru.com/index.php",
    rateLimit: 2,
    concurrent: 2,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        json: "1",
        tags: `${tag} rating:general`,
        pid: page - 1,
        limit
      });
      return `https://gelbooru.com/index.php?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = data?.post || (Array.isArray(data) ? data : []);
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url,
        preview: p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score || 0,
        tags: p.tags?.split(" ") || [],
        source: "Gelbooru"
      })).filter((p) => p.url);
    }, "parse")
  },
  yandere: {
    name: "Yande.re",
    baseUrl: "https://yande.re/post.json",
    rateLimit: 3,
    concurrent: 3,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        tags: `${tag} rating:safe`,
        page,
        limit
      });
      return `https://yande.re/post.json?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = Array.isArray(data) ? data : [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url || p.jpeg_url,
        preview: p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score || 0,
        tags: p.tags?.split(" ") || [],
        source: "Yande.re"
      })).filter((p) => p.url);
    }, "parse")
  },
  konachan: {
    name: "Konachan",
    baseUrl: "https://konachan.net/post.json",
    rateLimit: 3,
    concurrent: 2,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        tags: `${tag} rating:safe`,
        page,
        limit
      });
      return `https://konachan.net/post.json?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = Array.isArray(data) ? data : [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url || p.jpeg_url,
        preview: p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score || 0,
        tags: p.tags?.split(" ") || [],
        source: "Konachan"
      })).filter((p) => p.url);
    }, "parse")
  },
  tbib: {
    name: "TBIB",
    baseUrl: "https://tbib.org/index.php",
    rateLimit: 2,
    concurrent: 2,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        page: "dapi",
        s: "post",
        q: "index",
        json: "1",
        tags: tag,
        pid: page - 1,
        limit
      });
      return `https://tbib.org/index.php?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = Array.isArray(data) ? data : [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url?.startsWith("//") ? `https:${p.file_url}` : p.file_url,
        preview: p.preview_url?.startsWith("//") ? `https:${p.preview_url}` : p.preview_url,
        width: p.width,
        height: p.height,
        score: p.score || 0,
        tags: p.tags?.split(" ") || [],
        source: "TBIB"
      })).filter((p) => p.url);
    }, "parse")
  },
  wallhaven: {
    name: "Wallhaven",
    baseUrl: "https://wallhaven.cc/api/v1/search",
    rateLimit: 3,
    concurrent: 2,
    maxPages: 20,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        q: tag.replace(/_/g, " "),
        categories: "010",
        // Anime only
        purity: "100",
        // SFW only
        sorting: "relevance",
        page
      });
      return `https://wallhaven.cc/api/v1/search?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = data?.data || [];
      return posts.map((p) => {
        const tags = (p.tags || []).map((t) => t.name || t).filter(Boolean);
        return {
          id: p.id,
          url: p.path,
          preview: p.thumbs?.large || p.thumbs?.original || p.path,
          width: p.dimension_x || 1920,
          height: p.dimension_y || 1080,
          score: p.favorites || 0,
          tags,
          source: "Wallhaven"
        };
      }).filter((p) => p.url);
    }, "parse")
  },
  anime_pictures: {
    name: "Anime-Pictures",
    baseUrl: "https://anime-pictures.net/api/v3/posts",
    rateLimit: 3,
    concurrent: 2,
    maxPages: 20,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const params = new URLSearchParams({
        search_tag: tag.replace(/_/g, " "),
        page: page - 1,
        order_by: "date",
        ldate: "0",
        lang: "en"
      });
      return `https://anime-pictures.net/api/v3/posts?${params}`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const posts = data?.posts || [];
      return posts.map((p) => ({
        id: p.id,
        url: p.file_url ? `https://anime-pictures.net${p.file_url}` : null,
        preview: p.preview_url ? `https://anime-pictures.net${p.preview_url}` : null,
        width: p.width || 0,
        height: p.height || 0,
        score: p.score_number || 0,
        tags: [],
        source: "Anime-Pictures"
      })).filter((p) => p.url);
    }, "parse")
  },
  zerochan: {
    name: "Zerochan",
    baseUrl: "https://www.zerochan.net",
    rateLimit: 3,
    concurrent: 1,
    maxPages: 10,
    buildUrl: /* @__PURE__ */ __name((tag, page, limit) => {
      const cleanTag = tag.replace(/_/g, "+");
      return `https://www.zerochan.net/${encodeURIComponent(cleanTag.replace(/\+/g, " "))}?json&l=${limit || 100}&p=${page}&s=fav`;
    }, "buildUrl"),
    parse: /* @__PURE__ */ __name((data) => {
      const items = data?.items || [];
      return items.map((item) => {
        const tag = (item.tag || "").replace(/\s+/g, ".");
        const fullUrl = `https://static.zerochan.net/${tag}.full.${item.id}.jpg`;
        return {
          id: item.id,
          url: fullUrl,
          preview: item.thumbnail || fullUrl,
          width: item.width || 0,
          height: item.height || 0,
          score: item.fav || 0,
          tags: item.tags || [],
          source: "Zerochan"
        };
      }).filter((p) => p.id);
    }, "parse")
  },
  wallpapers_com: {
    name: "wallpapers.com",
    baseUrl: "https://wallpapers.com",
    rateLimit: 3,
    concurrent: 1,
    maxPages: 10,
    responseType: "html",
    buildUrl: /* @__PURE__ */ __name((tag, page) => {
      const slug = tag.replace(/_/g, "-").replace(/\s+/g, "-").toLowerCase();
      let url = `https://wallpapers.com/search/${slug}`;
      if (page > 1) url += `?page=${page}`;
      return url;
    }, "buildUrl"),
    parseHtml: /* @__PURE__ */ __name((html) => {
      const results = [];
      const seen = /* @__PURE__ */ new Set();
      const pattern = /(?:data-src|src)=["']([^"']*\/images\/hd\/[^"']*\.(?:jpg|jpeg|png|webp))["']/gi;
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let url = match[1].trim();
        if (url.startsWith("//")) url = "https:" + url;
        else if (url.startsWith("/")) url = "https://wallpapers.com" + url;
        if (seen.has(url) || !url.startsWith("http")) continue;
        if (/icon|logo|avatar|favicon|sprite|banner|ads/i.test(url)) continue;
        seen.add(url);
        results.push({
          id: `wcom_${url.split("/").pop().split(".")[0]}`,
          url,
          preview: url,
          width: 1920,
          height: 1080,
          score: 0,
          tags: [],
          source: "wallpapers.com"
        });
      }
      return results;
    }, "parseHtml")
  }
};
var SOURCE_LIST = Object.keys(SOURCES);

// src/services/imageSearch.js
var ImageSearchService = class {
  static {
    __name(this, "ImageSearchService");
  }
  constructor(cache2, tagDiscovery2) {
    this.cache = cache2;
    this.tagDiscovery = tagDiscovery2;
    this.userAgent = "AnyaImageAPI/1.0";
  }
  /**
   * Fetch a single page from a source - NO TIMEOUT
   */
  async fetchPage(source, tag, page, limit = 100) {
    const config = SOURCES[source];
    if (!config) return [];
    try {
      const url = config.buildUrl(tag, page, limit);
      const isHtml = config.responseType === "html";
      const headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": isHtml ? "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8" : "application/json",
        "Accept-Language": "en-US,en;q=0.9"
      };
      if (source === "wallpapers_com") headers["Referer"] = "https://wallpapers.com/";
      if (source === "zerochan") headers["Referer"] = "https://www.zerochan.net/";
      const res = await fetch(url, { headers });
      if (!res.ok) {
        if (res.status !== 429) console.log(`[${source}] HTTP ${res.status} for page ${page}`);
        return [];
      }
      if (isHtml) {
        const html = await res.text();
        return config.parseHtml(html);
      } else {
        const data = await res.json();
        return config.parse(data);
      }
    } catch (err) {
      console.log(`[${source}] Error page ${page}: ${err.message}`);
      return [];
    }
  }
  /**
   * Fetch pages from a source with smart batching
   */
  async fetchAllPages(source, tag) {
    const config = SOURCES[source];
    const allImages = [];
    const limit = 100;
    const waveSize = config.concurrent || 3;
    const maxPages = Math.min(config.maxPages || 10, 15);
    let page = 1;
    let emptyWaves = 0;
    while (page <= maxPages && emptyWaves < 2) {
      const wave = [];
      for (let i = 0; i < waveSize && page <= maxPages; i++, page++) {
        wave.push(this.fetchPage(source, tag, page, limit));
      }
      const results = await Promise.all(wave);
      let waveHadResults = false;
      for (const images of results) {
        if (images && images.length > 0) {
          allImages.push(...images);
          waveHadResults = true;
        }
      }
      if (!waveHadResults) {
        emptyWaves++;
      } else {
        emptyWaves = 0;
      }
    }
    if (allImages.length > 0) {
      console.log(`[${source}] Fetched ${allImages.length} images (${page - 1} pages)`);
    }
    return allImages;
  }
  /**
   * Search all sources in parallel
   */
  async searchAll(characterName, seriesName = null, page = 1, limit = 100) {
    const cacheKey = `search:${characterName.toLowerCase()}:${(seriesName || "none").toLowerCase()}`;
    const cached = this.cache.getImages(cacheKey);
    if (cached) {
      console.log(`[Search] Cache hit for ${characterName}`);
      return this.paginateResults(cached, page, limit, true);
    }
    console.log(`[Search] Fetching ${characterName} from all sources...`);
    const startTime = Date.now();
    const tags = await this.tagDiscovery.discoverTags(characterName, seriesName);
    const sourcePromises = SOURCE_LIST.map(async (source) => {
      const tag = tags[source] || characterName.toLowerCase().replace(/\s+/g, "_");
      return { source, images: await this.fetchAllPages(source, tag) };
    });
    const results = await Promise.all(sourcePromises);
    const seen = /* @__PURE__ */ new Set();
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
    allImages.sort((a, b) => (b.score || 0) - (a.score || 0));
    const elapsed = Date.now() - startTime;
    console.log(`[Search] Found ${allImages.length} unique images in ${elapsed}ms`);
    console.log(`[Search] Sources:`, sourceCounts);
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
};

// src/services/cache.js
var TTLMap = class {
  static {
    __name(this, "TTLMap");
  }
  constructor(max = 500, ttl = 72e5) {
    this.map = /* @__PURE__ */ new Map();
    this.max = max;
    this.ttl = ttl;
  }
  get(key) {
    const entry = this.map.get(key);
    if (!entry) return void 0;
    if (Date.now() > entry.expires) {
      this.map.delete(key);
      return void 0;
    }
    this.map.delete(key);
    entry.expires = Date.now() + this.ttl;
    this.map.set(key, entry);
    return entry.value;
  }
  set(key, value) {
    this.map.delete(key);
    if (this.map.size >= this.max) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
    this.map.set(key, { value, expires: Date.now() + this.ttl });
  }
  has(key) {
    return this.get(key) !== void 0;
  }
  get size() {
    return this.map.size;
  }
  clear() {
    this.map.clear();
  }
};
var CacheService = class {
  static {
    __name(this, "CacheService");
  }
  constructor() {
    this.imageCache = new TTLMap(500, 1e3 * 60 * 60 * 2);
    this.tagCache = new TTLMap(1e3, 1e3 * 60 * 60 * 24);
    this.stats = { hits: 0, misses: 0, tagHits: 0, tagMisses: 0 };
  }
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
};

// src/services/tagDiscovery.js
var TagDiscoveryService = class {
  static {
    __name(this, "TagDiscoveryService");
  }
  constructor(cache2) {
    this.cache = cache2;
    this.userAgent = "AnyaImageAPI/1.0";
  }
  normalize(name) {
    return name.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^\w_()'-]/g, "");
  }
  generateVariations(characterName, seriesName = null) {
    const variations = /* @__PURE__ */ new Set();
    const base = this.normalize(characterName);
    const parts = base.split("_");
    variations.add(base);
    if (parts[0]) variations.add(parts[0]);
    if (parts[1]) {
      variations.add(`${parts[0]}_${parts[1]}`);
      variations.add(parts[1]);
    }
    if (seriesName) {
      const series = this.normalize(seriesName);
      variations.add(`${parts[0]}_(${series})`);
      variations.add(`${base}_(${series})`);
    }
    return Array.from(variations);
  }
  scoreTag(tag, charName, seriesName, count = 0) {
    let score = 0;
    const charNorm = this.normalize(charName);
    const charFirst = charNorm.split("_")[0];
    const tagBase = tag.replace(/\([^)]+\)$/, "").replace(/_$/, "");
    if (seriesName) {
      const series = this.normalize(seriesName);
      const match = tag.match(/\(([^)]+)\)$/);
      if (match && (series.includes(match[1]) || match[1].includes(series))) {
        if (tagBase.split("_")[0] === charFirst) score += 1e3;
        else score += 500;
      }
    }
    if (tag === charNorm) score += 500;
    else if (tagBase.split("_")[0] === charFirst) score += 300;
    if (count > 1e3) score += 50;
    return score;
  }
  async fetchTags(source, term) {
    const configs = {
      safebooru: { url: "https://safebooru.org/index.php", params: { page: "dapi", s: "tag", q: "index", json: "1", name_pattern: `${term}%`, limit: 50 } },
      danbooru: { url: "https://danbooru.donmai.us/tags.json", params: { "search[name_matches]": `${term}*`, "search[category]": "4", limit: 50 } },
      gelbooru: { url: "https://gelbooru.com/index.php", params: { page: "dapi", s: "tag", q: "index", json: "1", name_pattern: `${term}%`, limit: 50 } },
      yandere: { url: "https://yande.re/tag.json", params: { name: `${term}*`, limit: 50 } },
      konachan: { url: "https://konachan.net/tag.json", params: { name: `${term}*`, limit: 50 } }
    };
    const cfg = configs[source];
    if (!cfg) return [];
    try {
      const url = new URL(cfg.url);
      Object.entries(cfg.params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url, { headers: { "User-Agent": this.userAgent } });
      if (!res.ok) return [];
      const data = await res.json();
      if (source === "gelbooru") return (data?.tag || data || []).map((t) => ({ name: t.name, count: +t.count || 0 }));
      return (Array.isArray(data) ? data : []).map((t) => ({ name: t.name, count: t.post_count || t.count || 0 }));
    } catch {
      return [];
    }
  }
  async discoverTags(characterName, seriesName = null) {
    const key = `tags:${this.normalize(characterName)}:${seriesName || "none"}`;
    const cached = this.cache.getTags(key);
    if (cached) return cached;
    const variations = this.generateVariations(characterName, seriesName);
    const result = {};
    let primaryTag = null;
    const danbooruTags = /* @__PURE__ */ new Map();
    for (const variation of variations.slice(0, 3)) {
      const tags = await this.fetchTags("danbooru", variation);
      for (const t of tags) {
        if (!danbooruTags.has(t.name) || danbooruTags.get(t.name).count < t.count) {
          danbooruTags.set(t.name, t);
        }
      }
    }
    let bestScore = 0;
    for (const [name, data] of danbooruTags) {
      const score = this.scoreTag(name, characterName, seriesName, data.count);
      if (score > bestScore) {
        bestScore = score;
        primaryTag = name;
      }
    }
    if (!primaryTag) primaryTag = this.normalize(characterName);
    const booruSources = ["safebooru", "danbooru", "gelbooru", "yandere", "konachan", "tbib"];
    for (const src of booruSources) {
      result[src] = primaryTag;
    }
    const sourceSpecific = ["safebooru", "yandere", "konachan"];
    await Promise.all(sourceSpecific.map(async (src) => {
      const allTags = /* @__PURE__ */ new Map();
      for (const variation of variations.slice(0, 2)) {
        const tags = await this.fetchTags(src, variation);
        for (const t of tags) {
          if (!allTags.has(t.name) || allTags.get(t.name).count < t.count) {
            allTags.set(t.name, t);
          }
        }
      }
      let srcBest = null, srcBestScore = 0;
      for (const [name, data] of allTags) {
        const score = this.scoreTag(name, characterName, seriesName, data.count);
        if (score > srcBestScore) {
          srcBestScore = score;
          srcBest = name;
        }
      }
      if (srcBest && srcBestScore >= bestScore) {
        result[src] = srcBest;
      }
    }));
    const nameSpaced = characterName;
    result.wallhaven = nameSpaced;
    result.anime_pictures = nameSpaced;
    result.zerochan = nameSpaced;
    result.wallpapers_com = nameSpaced;
    this.cache.setTags(key, result);
    console.log(`[TagDiscovery] Discovered:`, result);
    return result;
  }
};

// src/services/cloudflare.js
var CloudflareImagesService = class {
  static {
    __name(this, "CloudflareImagesService");
  }
  constructor(env = {}) {
    this.accountId = env.CLOUDFLARE_ACCOUNT_ID || "";
    this.apiToken = env.CLOUDFLARE_API_TOKEN || "";
    this.imageDeliveryUrl = env.CLOUDFLARE_IMAGES_URL || `https://imagedelivery.net/${this.accountId}`;
    this.urlCache = /* @__PURE__ */ new Map();
    this.cacheMaxSize = 1e4;
    this.enabled = !!(this.accountId && this.apiToken);
    if (this.enabled) {
      console.log("[Cloudflare] Images API enabled");
    } else {
      console.log("[Cloudflare] Images API disabled (missing credentials)");
    }
  }
  /**
   * Generate a unique image ID from the source URL (sync, simple hash)
   */
  generateImageId(url) {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, "0");
  }
  /**
   * Upload an image to Cloudflare Images from URL
   */
  async uploadFromUrl(sourceUrl, metadata = {}) {
    if (!this.enabled) return null;
    const imageId = this.generateImageId(sourceUrl);
    if (this.urlCache.has(sourceUrl)) {
      return this.urlCache.get(sourceUrl);
    }
    try {
      const formData = new URLSearchParams();
      formData.append("url", sourceUrl);
      formData.append("id", imageId);
      formData.append("metadata", JSON.stringify({
        source: metadata.source || "unknown",
        character: metadata.character || "",
        originalUrl: sourceUrl,
        uploadedAt: (/* @__PURE__ */ new Date()).toISOString()
      }));
      const response = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/images/v1`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`,
            "Content-Type": "application/x-www-form-urlencoded"
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
        const cfUrl = this.getDeliveryUrl(imageId);
        this.cacheUrl(sourceUrl, cfUrl);
        return cfUrl;
      }
      console.log(`[Cloudflare] Upload failed: ${data.errors?.[0]?.message || "Unknown error"}`);
      return null;
    } catch (error) {
      console.error(`[Cloudflare] Upload error: ${error.message}`);
      return null;
    }
  }
  /**
   * Get Cloudflare delivery URL for an image
   */
  getDeliveryUrl(imageId, variant = "public") {
    return `${this.imageDeliveryUrl}/${imageId}/${variant}`;
  }
  /**
   * Cache URL mapping with LRU eviction
   */
  cacheUrl(originalUrl, cfUrl) {
    if (this.urlCache.size >= this.cacheMaxSize) {
      const firstKey = this.urlCache.keys().next().value;
      this.urlCache.delete(firstKey);
    }
    this.urlCache.set(originalUrl, cfUrl);
  }
  /**
   * Process an array of images, uploading to Cloudflare in parallel
   */
  async processImages(images, character = "", batchSize = 10) {
    if (!this.enabled || !images.length) return images;
    const results = [];
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
            preview: cfUrl ? this.getDeliveryUrl(this.generateImageId(img.url), "thumbnail") : img.preview,
            cloudflare: !!cfUrl
          };
        })
      );
      results.push(...processed);
    }
    const cfCount = results.filter((r) => r.cloudflare).length;
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
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${this.apiToken}`
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
            "Authorization": `Bearer ${this.apiToken}`
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
    return { enabled: true, error: "Failed to fetch stats" };
  }
};

// src/server.js
var cache;
var tagDiscovery;
var imageSearch;
var cloudflare;
function initServices(env) {
  if (!cache) {
    cache = new CacheService();
    tagDiscovery = new TagDiscoveryService(cache);
    imageSearch = new ImageSearchService(cache, tagDiscovery);
    cloudflare = new CloudflareImagesService(env);
  }
}
__name(initServices, "initServices");
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
}
__name(json, "json");
var server_default = {
  async fetch(request, env) {
    initServices(env);
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }
    try {
      if (path === "/health") {
        return json({ status: "ok" });
      }
      if (path === "/api/search" && request.method === "GET") {
        const startTime = Date.now();
        const character = url.searchParams.get("character");
        const series = url.searchParams.get("series");
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "100");
        const cf = url.searchParams.get("cf") === "true";
        if (!character) {
          return json({ error: "Character name required" }, 400);
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
          page,
          limit,
          totalImages: result.totalImages,
          maxPages: result.maxPages,
          images,
          sources: result.sources,
          cached: result.cached,
          cloudflare: cloudflareProcessed,
          timing: Date.now() - startTime
        });
      }
      if (path === "/api/tags" && request.method === "GET") {
        const character = url.searchParams.get("character");
        const series = url.searchParams.get("series");
        if (!character) {
          return json({ error: "Character name required" }, 400);
        }
        const tags = await tagDiscovery.discoverTags(character, series);
        return json({ success: true, tags });
      }
      if (path === "/api/stats" && request.method === "GET") {
        const cfStats = await cloudflare.getStats();
        return json({ cache: cache.getStats(), cloudflare: cfStats });
      }
      if (path === "/api/cloudflare/upload" && request.method === "POST") {
        const body = await request.json();
        const { url: imageUrl, character, source } = body;
        if (!imageUrl) return json({ error: "Image URL required" }, 400);
        if (!cloudflare.enabled) return json({ error: "Cloudflare Images not configured" }, 503);
        const cfUrl = await cloudflare.uploadFromUrl(imageUrl, { character, source });
        if (cfUrl) {
          return json({ success: true, url: cfUrl, original: imageUrl });
        }
        return json({ error: "Failed to upload to Cloudflare" }, 500);
      }
      if (path.startsWith("/api/cloudflare/image/") && request.method === "DELETE") {
        if (!cloudflare.enabled) return json({ error: "Cloudflare Images not configured" }, 503);
        const imageId = path.split("/").pop();
        const success = await cloudflare.deleteImage(imageId);
        return json({ success });
      }
      if (path === "/api/cache/clear" && request.method === "POST") {
        cache.clear();
        return json({ success: true, message: "Cache cleared" });
      }
      return json({ error: "Not found" }, 404);
    } catch (error) {
      console.error("[API Error]", error);
      return json({ error: error.message }, 500);
    }
  }
};

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-W3tCDP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = server_default;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-W3tCDP/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=server.js.map
