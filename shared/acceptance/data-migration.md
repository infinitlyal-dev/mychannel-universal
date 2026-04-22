# Data Migration Acceptance

Owner: Claude Code

Scope is bounded. Do not rebuild a licensed feed. Do not rebuild `catalogue.json`.

## Must deliver

- Keep [data/tmdb-genre-mapping.ts](/C:/dev/mychannel-universal/data/tmdb-genre-mapping.ts) intact or improve it without breaking imports.
- Rebuild [data/streamers.json](/C:/dev/mychannel-universal/data/streamers.json) only as provider manifest + search URL templates.
- Add QA fixtures for backend and UI tests. Put them under `data/fixtures/`.
- Tombstone catalogue-era files and references that no longer make sense.

## Provider manifest requirements

Each entry must carry:

- `id`
- `name`
- `shortName`
- `logo`
- `regions`
- `tmdbProviderIds` by region
- `tmdbProviderNames` by region where needed for alias matching
- `searchUrlTemplates`

Providers expected in scope:

- Netflix
- Prime Video
- Disney+
- Apple TV+
- Max
- Hulu
- Peacock
- Paramount+
- Showtime
- Starz
- YouTube

## Tombstones

Catalogue-era assets already removed or scheduled for removal:

- `data/catalogue.json`
- `data/seed-shows.json`
- `data/scripts/build-catalogue.ts`

Claude should also sweep stale docs/workflows/schema references that still assume the product ships from a bundled catalogue.

## Done means

- `/data` is metadata only
- No product path reads a static catalogue from `/data`
- Fixtures exist for provider mapping and search URL generation
