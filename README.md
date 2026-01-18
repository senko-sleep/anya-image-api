# Anya Image API

Ultra-fast anime image search API with intelligent rate limiting and caching.

## Features

- **Smart Rate Limiting**: Per-source rate limits to avoid overwhelming APIs
- **Parallel Fetching**: Batch fetches pages with controlled concurrency
- **LRU Caching**: 2-hour cache for instant repeat searches
- **Tag Discovery**: Automatically finds correct tags for each source
- **Deduplication**: Removes duplicate images across sources
- **6 Sources**: Safebooru, Danbooru, Gelbooru, Yande.re, Konachan, TBIB

## Quick Start

```bash
cd image-api
npm install
npm start
```

API runs on `http://localhost:3456`

## Endpoints

### Search Images
```
GET /api/search?character=Anya+Forger&series=Spy+x+Family&page=1&limit=100
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
  "timing": 3500
}
```

### Discover Tags
```
GET /api/tags?character=Anya+Forger&series=Spy+x+Family
```

### Cache Stats
```
GET /api/stats
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
