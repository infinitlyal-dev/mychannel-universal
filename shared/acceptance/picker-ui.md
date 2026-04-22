# Picker UI Acceptance

Owner: Cursor

Use the live-library foundation. Do not resurrect `catalogue.json`.

## Hard requirements

- Web-first UI. Must work in laptop browser, iPhone Safari, tablet browser, smart-TV browser.
- Capacitor shell retained.
- `lit-html` + vanilla TypeScript.
- Consume shared contracts from [shared/types.ts](/C:/dev/mychannel-universal/shared/types.ts). No local forked type surface.
- Use `/api/library`, `/api/library/providers`, `/api/title/:tmdbType/:tmdbId`, `/api/title/:tmdbType/:tmdbId/providers`.

## Picker

Must deliver:

- Infinite scroll over `/api/library`
- Search box wired to `/api/library?query=...`
- Genre filter UI
- Provider badges on cards from `providerBadges`
- Virtualized poster grid
- Loading skeletons
- Empty states for:
  - no providers selected
  - no search results
  - no titles for selected filters
  - upstream/API failure

## Scheduler UI

Must deliver:

- Editable per-slot schedule UI
- Add, remove, and swap titles per slot
- Channel view hydrated from the pure scheduler output in [app/src/lib/scheduler.ts](/C:/dev/mychannel-universal/app/src/lib/scheduler.ts)
- Search-link launch uses the pure generator in [app/src/lib/deep-link.ts](/C:/dev/mychannel-universal/app/src/lib/deep-link.ts)

## State

Must use:

- [app/src/state/store.ts](/C:/dev/mychannel-universal/app/src/state/store.ts) migration path
- `selectedTitles`
- `schedule`
- `channel`

Must stop depending on:

- `app/src/data/catalogue.ts`
- `app/www/data/catalogue.json`
- `app/www/data/catalogue.mock.json`

## Done means

- No bundled catalogue as product data
- Picker works against live API only
- Channel preview and channel view both derive from persisted schedule + selected titles
- Provider filter, search, and genre filter all survive reload
