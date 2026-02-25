# Anya Image API

Ultra-fast anime image search API with intelligent rate limiting, caching, and Cloudflare Images CDN.

## Features

- **Smart Rate Limiting**: Per-source rate limits to avoid overwhelming APIs
- **Parallel Fetching**: Batch fetches pages with controlled concurrency
- **LRU Caching**: 2-hour cache for instant repeat searches
- **Tag Discovery**: Automatically finds correct tags for each source
- **Deduplication**: Removes duplicate images across sources
- **Cloudflare Images**: Optional CDN proxy for faster global delivery
- **6 Sources**: Safebooru, Danbooru, Gelbooru, Yande.re, Konachan, TBIB

## Quick Start

```bash
cd image-api
npm install
npm start
```

API runs on `http://localhost:10000`

## Cloudflare Images Setup

To enable Cloudflare Images CDN:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Images
2. Enable Cloudflare Images for your account
3. Create an API token with `Cloudflare Images:Edit` permission
4. Set environment variables:

```env
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_API_TOKEN=your_api_token
```

## Endpoints

### Search Images
```
GET /api/search?character=Anya+Forger&series=Spy+x+Family&page=1&limit=100
```

Add `&cf=true` to proxy images through Cloudflare:
```
GET /api/search?character=Anya+Forger&cf=true
```

Response:
```json
{
  "success": true,
  "totalImages": 5000,
  "maxPages": 50,
  "images": [...],
  "sources": {"Safebooru": 2000, "Danbooru": 1500, ...},
  "cached": false,
  "cloudflare": true,
  "timing": 3500
}
```

### Discover Tags
```
GET /api/tags?character=Anya+Forger&series=Spy+x+Family
```

### Stats (includes Cloudflare usage)
```
GET /api/stats
```

### Cloudflare Upload (single image)
```
POST /api/cloudflare/upload
Content-Type: application/json

{"url": "https://example.com/image.jpg", "character": "Anya", "source": "Safebooru"}
```

### Delete Cloudflare Image
```
DELETE /api/cloudflare/image/:imageId
```

### Clear Cache
```
POST /api/cache/clear
```

## Architecture

```
src/
├── server.js           # Express server
└── services/
    ├── cache.js        # LRU cache service
    ├── cloudflare.js   # Cloudflare Images CDN
    ├── imageSearch.js  # Main search orchestrator
    ├── sources.js      # Booru configurations
    └── tagDiscovery.js # Smart tag discovery
```

## Rate Limits

| Source    | Requests/sec | Concurrent |
|-----------|-------------|------------|
| Safebooru | 2           | 5          |
| Danbooru  | 1           | 2          |
| Gelbooru  | 2           | 5          |
| Yande.re  | 3           | 3          |
| Konachan  | 3           | 3          |
| TBIB      | 2           | 3          |
