# Backend API Acceptance

Owner: Codex

Status: foundation implemented. Unit tests pass. Live TMDB smoke is blocked by missing local `TMDB_API_KEY`.

## Endpoints

### `GET /api/library`

Must deliver:

- Browse mode from TMDB discover when `query` is absent.
- Search mode from TMDB search when `query` is present.
- Query params:
  - `region=US|ZA` default `US`
  - `providers=<csv StreamerId>` optional
  - `page=1..500` default `1`
  - `type=movie|tv|all` default `all`
  - `genre=<GenreId>` pass-through placeholder until picker UI consumes it
  - `query=<string>` optional
- Response body: `LibraryResponse` from [shared/types.ts](/C:/dev/mychannel-universal/shared/types.ts)
- Each item includes `providerBadges` built from `/data/streamers.json`
- Filtering rule: if `providers` is supplied, every returned item must match at least one selected provider in the requested region

### `GET /api/library/providers`

Must deliver:

- Full provider manifest from `/data/streamers.json`
- Optional `region` filter
- Response body: `LibraryProvidersResponse`

### `GET /api/title/:tmdbType/:tmdbId`

Must deliver:

- Normalized single-title detail payload
- Route validation for `tmdbType=movie|tv` and numeric `tmdbId`
- Response body: `TitleResponse`

### `GET /api/title/:tmdbType/:tmdbId/providers`

Must deliver:

- Region-specific watch-provider groups: `flatrate`, `free`, `ads`, `buy`, `rent`
- `title` summary in response
- Only supported providers should carry `streamerId`
- Response body: `TitleProvidersResponse`

## Error shape

All new endpoints must use:

```json
{
  "success": false,
  "error": {
    "code": "machine_readable_code",
    "message": "plain text"
  }
}
```

Required error cases:

- Invalid region
- Invalid route params
- Missing TMDB key
- Upstream TMDB non-200

## Test fixtures

Current coverage lives in:

- [api/tests/library.test.ts](/C:/dev/mychannel-universal/api/tests/library.test.ts)
- [api/tests/library-providers.test.ts](/C:/dev/mychannel-universal/api/tests/library-providers.test.ts)
- [api/tests/title-detail.test.ts](/C:/dev/mychannel-universal/api/tests/title-detail.test.ts)
- [api/tests/title-providers-v2.test.ts](/C:/dev/mychannel-universal/api/tests/title-providers-v2.test.ts)

Fixture coverage required:

- Mixed movie + TV library page
- Search results with non-title rows dropped
- Region-filtered provider manifest
- Title detail normalization
- Title providers normalization with provider mapping

## Verification

Required commands:

```powershell
cd C:\dev\mychannel-universal\api
npm test
npx tsc --noEmit --pretty false
```

Current result:

- `npm test`: 30 tests passed on 2026-04-22
- `npx tsc --noEmit --pretty false`: passed on 2026-04-22
