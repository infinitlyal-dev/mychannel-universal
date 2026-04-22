# INTERFACES.md

Canonical contract for the v2 rebuild. This replaces the static-catalogue contract.

## Scope

- Product data is live from TMDB.
- `/data` is no longer product content. It holds provider registry, genre mapping, and QA fixtures.
- Path A deep-links are locked to streamer search URLs with `title + year`.
- No licensed resolver. No catalogue build pipeline. No `catalogue.json`.

## Shared types

Authoritative source: [shared/types.ts](/C:/dev/mychannel-universal/shared/types.ts)

Key entities:

- `StreamerManifest`: provider registry entry with TMDB provider IDs by region and search URL templates by platform.
- `LibraryTitle`: normalized browse/search card payload from TMDB.
- `TitleDetail`: normalized single-title detail payload.
- `TitleProviders`: normalized watch-provider payload for a title in one region.
- `UserState`: persisted app state for selected providers, picked titles, schedule slots, and scheduled channel output.
- `ScheduledProgram`: a hydrated slot with title metadata, chosen provider, and generated search URLs.

## API

Base path: `/api`

### `GET /api/library`

Unified browse and search endpoint.

Query params:

- `region=US|ZA` default `US`
- `providers=netflix,prime,...` optional
- `page=1..500` default `1`
- `type=movie|tv|all` default `all`
- `genre=<GenreId>` optional
- `query=<string>` optional. When present, TMDB search is used instead of discover.

Behavior:

- Browse mode: uses TMDB discover endpoints.
- Search mode: uses TMDB search and then enriches candidates with watch-provider data.
- Results are filtered to the requested region.
- If `providers` is supplied, results must have at least one matching provider in that region.
- Every item includes `providerBadges` for supported providers only.

Response: `LibraryResponse`

Error shape:

```json
{
  "success": false,
  "error": {
    "code": "invalid_region",
    "message": "region must be one of: US, ZA"
  }
}
```

### `GET /api/library/providers`

Returns the provider registry used by browse, filters, deep-links, and badges.

Query params:

- `region=US|ZA` optional. If supplied, only providers available in that region are returned.

Response: `LibraryProvidersResponse`

### `GET /api/title/:tmdbType/:tmdbId`

Returns normalized title detail for one TMDB movie or TV series.

Route params:

- `tmdbType=movie|tv`
- `tmdbId=<number>`

Response: `TitleResponse`

### `GET /api/title/:tmdbType/:tmdbId/providers`

Returns normalized watch-provider data for one title in one region.

Query params:

- `region=US|ZA` default `US`

Response: `TitleProvidersResponse`

Notes:

- Only providers present in `/data/streamers.json` are surfaced with `streamerId`.
- TMDB/JustWatch outbound links are not used for playback.
- The app turns provider matches into search URLs locally using the provider registry templates.

## Data

### Kept

- `data/tmdb-genre-mapping.ts`
- `data/streamers.json`
- QA fixtures under `data/fixtures/` or equivalent

### Removed

- `data/catalogue.json`
- `data/seed-shows.json`
- `data/scripts/build-catalogue.ts`

## App

Foundation modules in scope for this handoff:

- [app/src/state/store.ts](/C:/dev/mychannel-universal/app/src/state/store.ts)
- [app/src/lib/scheduler.ts](/C:/dev/mychannel-universal/app/src/lib/scheduler.ts)
- [app/src/lib/deep-link.ts](/C:/dev/mychannel-universal/app/src/lib/deep-link.ts)

Rules:

- Store persists provider picks, selected titles, editable schedule slots, and hydrated channel output.
- Scheduler is pure. It accepts titles + slots + provider registry and returns channel rows.
- Deep-links are pure search-URL generators. Input is `title + year + streamer`, output is URL strings.

## Acceptance docs

- [shared/acceptance/backend-api.md](/C:/dev/mychannel-universal/shared/acceptance/backend-api.md)
- [shared/acceptance/picker-ui.md](/C:/dev/mychannel-universal/shared/acceptance/picker-ui.md)
- [shared/acceptance/data-migration.md](/C:/dev/mychannel-universal/shared/acceptance/data-migration.md)
