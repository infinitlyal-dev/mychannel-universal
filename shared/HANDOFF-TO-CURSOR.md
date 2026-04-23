# HANDOFF TO CURSOR

Foundation is ready.

## V1 Foundation Sign-Off

Architect verdict: ship it. Blockers resolved.

Resolved before Cursor handoff:

- Provider hydration now has a 24h in-memory LRU to reduce repeated TMDB bursts.
- Orphaned `LegacyScheduleEntry` was deleted.
- Cache policy is declared in [shared/CACHE.md](/C:/dev/mychannel-universal/shared/CACHE.md).
- `data/streamers.json` now has provider IDs and fallback names for every declared region.
- V1.5 tech debt is logged in [shared/V1.5-TECH-DEBT.md](/C:/dev/mychannel-universal/shared/V1.5-TECH-DEBT.md).

## Locked constraints

- Path A deep-links are search URLs only. Title + year. No resolver. No licensed mapping.
- Product data is live from TMDB.
- `/data` is metadata only.
- Web-first build. Capacitor stays, native wrap is not the product.

## Start here

- Contracts: [shared/types.ts](/C:/dev/mychannel-universal/shared/types.ts)
- API surface: [shared/INTERFACES.md](/C:/dev/mychannel-universal/shared/INTERFACES.md)
- UI acceptance: [shared/acceptance/picker-ui.md](/C:/dev/mychannel-universal/shared/acceptance/picker-ui.md)
- App foundation:
  - [app/src/state/store.ts](/C:/dev/mychannel-universal/app/src/state/store.ts)
  - [app/src/lib/scheduler.ts](/C:/dev/mychannel-universal/app/src/lib/scheduler.ts)
  - [app/src/lib/deep-link.ts](/C:/dev/mychannel-universal/app/src/lib/deep-link.ts)

## API endpoints ready to consume

- `GET /api/library`
- `GET /api/library/providers`
- `GET /api/title/:tmdbType/:tmdbId`
- `GET /api/title/:tmdbType/:tmdbId/providers`

Ignore the old `shared/workstream-prompts/` files. They describe the dead catalogue architecture.

## What to replace

Stop using:

- `app/src/data/catalogue.ts`
- `app/www/data/catalogue.json`
- `app/www/data/catalogue.mock.json`

Those files are legacy ballast until your picker rewrite lands.

## State shape

Use:

- `streamers`
- `selectedTitles`
- `schedule`
- `channel`

Legacy `shows` is still present as compatibility ballast. Do not build new UI around it.

## Search-link rule

Every watch action resolves to a provider search URL generated locally from streamer + title + year.

If a provider has no reliable native search path, use the web search URL. Reliability beats purity.
