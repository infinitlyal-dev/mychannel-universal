# CACHE.md

Cache policy for v1 foundation.

## Rule

Fresh enough beats exact. Provider availability can drift by hours. v1 accepts 24h staleness for provider data because TMDB/JustWatch data is not live playback state.

## Endpoints

### `GET /api/library`

- Response `Cache-Control`: none.
- Server-side cache: internal in-memory LRU for title watch-provider hydration.
- LRU key: `tmdbType:tmdbId:region`.
- LRU TTL: 24h.
- LRU size: 1000 entries per warm runtime instance.
- Client may assume: title cards can be stale for provider badges by up to 24h on warm Edge instances. Title search/discover results themselves are not cached by this service.

### `GET /api/library/providers`

- Response `Cache-Control`: none.
- Server-side cache: none.
- Source: static `data/streamers.json` bundled into the deployment.
- Client may assume: provider manifest changes only on deploy. Client may cache in memory for the app session.

### `GET /api/title/:tmdbType/:tmdbId`

- Response `Cache-Control`: none.
- Server-side cache: none.
- Client may assume: detail freshness is live TMDB per request. Cursor may add short client memory cache for UX, but must not persist it as product data.

### `GET /api/title/:tmdbType/:tmdbId/providers`

- Response `Cache-Control`: none.
- Server-side cache: same internal in-memory LRU as `/api/library`.
- LRU key: `tmdbType:tmdbId:region`.
- LRU TTL: 24h.
- Client may assume: provider results can be stale by up to 24h on warm Edge instances.

### `GET /api/tmdb/providers/:tmdbType/:tmdbId`

- Legacy compatibility endpoint.
- Response `Cache-Control`: `public, max-age=86400`.
- Server-side cache: Vercel edge/public HTTP cache may cache for 24h.
- Client may assume: 24h provider staleness.

### `GET /api/health`

- Response `Cache-Control`: none.
- Server-side cache: none.
- Client may assume: live health check per request.

### `POST /api/elevenlabs`

- Response `Cache-Control`: none.
- Server-side cache: none.
- Client may assume: never cached.

### `POST /api/al`

- Stub endpoint.
- Response `Cache-Control`: none.
- Server-side cache: none.

### `POST /api/transcribe`

- Stub endpoint.
- Response `Cache-Control`: none.
- Server-side cache: none.

## Client guidance

- Do not assume `/api/library` response identity is stable across reloads.
- Infinite scroll should debounce and avoid duplicate page requests.
- Cursor can cache `/api/library/providers` in memory for the app session.
- Cursor can cache title detail and provider responses in memory for UX.
- Do not persist live-library API responses as a bundled catalogue.
