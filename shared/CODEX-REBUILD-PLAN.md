# MyChannel Universal Rebuild Plan

Assessed against:
- Repo: `C:\dev\mychannel-universal`
- Branch: `main`
- Tag: `v1.0.0-pre-integration-test`
- Commit: `7f6a3dc02e21001ddb8f237b96f44887f0deab83`
- Contract: [INTERFACES.md](C:/dev/mychannel-universal/shared/INTERFACES.md)

Reality check:
- The current product is architected around a shipped, hand-curated catalogue (`data/catalogue.json`, 278 titles), not around the real full libraries of the user’s selected streamers.
- That is not a small miss. It is the wrong product architecture.
- The backend, app, and data layers are all usable in pieces, but the catalogue assumption must be removed at the root.
- Existing tests were not runnable as-is on this machine because `vitest` is not installed in `api/` or `app/` despite being referenced by their package scripts.

Official TMDB docs used for this plan:
- [Discover TV](https://developer.themoviedb.org/reference/discover-tv)
- [Discover Movie](https://developer.themoviedb.org/reference/discover-movie)
- [TV Providers List](https://developer.themoviedb.org/reference/watch-provider-tv-list)
- [Movie Providers List](https://developer.themoviedb.org/reference/watch-providers-movie-list)
- [TV Watch Providers](https://developer.themoviedb.org/reference/tv-series-watch-providers)
- [Movie Watch Providers](https://developer.themoviedb.org/reference/movie-watch-providers)
- [Search Multi](https://developer.themoviedb.org/reference/search-multi)

## Executive Verdict

The rebuild should be:
- Web-first for speed and browser verification
- API-backed for live library browsing
- Capacitor-wrapped later for TestFlight and native notifications
- Provider-truth-based, not seed-catalogue-based

Bluntly:
- `/data` as currently conceived is wrong for the real product.
- `/app` has a usable shell, route map, and native plugin wiring, but most user-facing logic is built around the wrong data model.
- `/api` has the right instinct, but far too little surface area. It is a helper proxy, not a real library backend.

## 1. `/api` Assessment

### Keep

- `api/_middleware.ts`
  - Keep the general shape: CORS handling, typed JSON responses, edge runtime friendliness, device header validation.
  - Rework the storage backend for rate limiting; the current in-memory map is not real production behavior.

- `api/health.ts`
  - Keep. It is simple, correct, and useful.

- `api/tmdb/providers/[tmdbType]/[tmdbId].ts`
  - Keep the endpoint concept and some of the handler structure.
  - It already does one useful thing: proxy TMDB watch-provider data without exposing the API key.
  - It is a good building block for per-title enrichment and cache warming.

- `api/elevenlabs.ts`
  - Keep only if notification/audio asset generation remains in scope.
  - It is not central to the real library-builder product.

### Rework

- The backend scope
  - Right now it only proxies single-title provider lookups.
  - The rebuild needs the backend to become the library service for browsing, searching, paging, caching, and provider enrichment.

- Caching and rate limiting
  - Current cache behavior is just `Cache-Control`.
  - The rebuild needs actual server-side response caching for TMDB fetches and a real shared rate limiter.

- Route surface
  - Add library-focused routes instead of forcing the app to ship and browse a static catalogue.

Recommended new API surface:
- `GET /api/library`
  - Query: `region`, `streamers`, `mediaType`, `genre`, `query`, `cursor`
  - Returns paged titles plus next cursor
- `GET /api/library/providers`
  - Returns the provider registry for the selected region from TMDB’s provider-list endpoints
- `GET /api/title/:tmdbType/:tmdbId/providers`
  - Keep current behavior, but move under the new naming scheme
- `GET /api/title/:tmdbType/:tmdbId`
  - Canonical detail fetch with cached enrichment
- `POST /api/deep-link/resolve`
  - Optional if deep-link resolution becomes server-owned

### Scrap

- The assumption that the backend is only an edge-case helper while the app ships the main library in-bundle
  - Scrap completely.

- The current v1 stubs as a product boundary
  - `al` and `transcribe` being stubbed is fine if voice is out of scope.
  - The idea that the backend can remain this thin is not fine.

### Verdict

- `api`: **Keep the skeleton, rework the service, scrap the current scope**

## 2. `/app` Assessment

### Keep

- Capacitor shell and project structure
  - `android/`, `ios/`, `capacitor.config.json`, build scripts, plugin choices: worth keeping.

- The route map and screen decomposition
  - `src/router.ts`
  - `src/screens/*`
  - The app is at least divided into real product screens rather than one giant file.

- Native integration points
  - `src/lib/notifications.ts`
  - `src/lib/deep-link.ts`
  - `src/state/store.ts`
  - These are the right categories of code, even if the current logic is not production-truthful.

- Vanilla TS + `lit-html`
  - This is a defensible stack here.
  - No need to replatform just because the current data model is wrong.

### Rework

- Show picker
  - `src/screens/shows.ts` is currently a local filter over the bundled catalogue.
  - It must become a server-backed picker with:
    - search
    - genre filter
    - media-type filter if movies and TV are both in scope
    - provider badges
    - infinite scroll
    - virtualization/windowing

- Schedule generation
  - `src/lib/scheduler.ts` is a round-robin slot filler over a preselected title set.
  - That is fine for a demo wizard, but not for a real channel-builder with large live libraries.
  - The rebuilt scheduler must operate on exact title records and exact chosen streamer availability, not just recycled picks.

- Week view
  - `src/screens/week.ts` currently toggles coarse time bands and then regenerates the whole schedule.
  - Rework into real per-slot editing.
  - Local edits should not reshuffle the whole week.

- Channel view
  - `src/screens/channel.ts` is salvageable visually, but it currently assumes the catalogue is small and local.
  - Rework to consume hydrated schedule entries and cached title detail data.

- Data loading
  - `src/data/catalogue.ts` must stop treating `www/data/catalogue.json` as the main library source.
  - The app should fetch from backend APIs for browse/search and optionally cache recent pages locally.

- Type drift
  - `app/src/types.ts` has already drifted from `shared/types.ts`:
    - app still references `showmax`
    - shared references `peacock`
    - app carries `notificationsEnabled` even though shared `UserState` does not
  - Rework the app to consume generated/shared canonical types instead of hand-copying them.

### Scrap

- The in-bundle full-library assumption
  - Scrap.

- The current 7×4 time-band picker as the only scheduling model
  - Keep it only as an onboarding accelerator if wanted.
  - Scrap it as the actual schedule model.

- Any notion that the current show picker can scale to hundreds or thousands of titles
  - Scrap.

### Verdict

- `app`: **Keep the shell and route scaffolding, rework most business logic, scrap the local-catalogue assumption**

## 3. `/data` Assessment

### Keep

- `data/streamers.json`
  - Keep as a starting metadata manifest, but change what it stores.
  - It should describe provider IDs, display names, supported regions, and fallback search/deep-link strategies.

- `data/tmdb-genre-mapping.ts`
  - Keep the genre normalization idea.

- Schema discipline
  - Keep the schema-first habit.
  - Keep JSON schema validation patterns where they still make sense.

### Rework

- `data` should stop producing the shipped user library
  - The current output is a static, nightly-built, curated subset.
  - That is the opposite of “full library of selected streamers, filtered by region.”

- Build responsibilities
  - Repurpose `data` into:
    - provider registry metadata
    - genre mapping
    - maybe warm-cache jobs for popular provider-region combinations
    - maybe QA fixtures/snapshots for deterministic UI tests

- Deep link metadata
  - Replace fake exact-title URL construction with honest resolver metadata:
    - exact ID mapping source if available
    - search URL fallback if exact mapping is unavailable

### Scrap

- `data/catalogue.json` as the main product dataset
  - Scrap.

- `data/seed-shows.json`
  - Scrap for product behavior.
  - Keep only as QA/dev fixture input if useful.

- `data/scripts/build-catalogue.ts` in its current role
  - Scrap the role, not necessarily every utility inside it.
  - The current script builds the wrong artifact.

- Prebuilding “deep links” by concatenating TMDB IDs or titles into provider URLs
  - Scrap.
  - This is not reliable at scale.

### Verdict

- `data`: **Keep metadata patterns, scrap the catalogue product, replace the build pipeline**

## 4. Rebuild Plan

## 4.1 Core product architecture

Target shape:
- `api/` becomes the live library service
- `app/` becomes a web-first client with Capacitor adapters
- `data/` becomes metadata + cache-warming + fixtures
- `shared/` becomes the enforced contract layer

The product should no longer ship a “catalogue” as its truth source.
The product should ship:
- app shell
- provider metadata
- lightweight fixtures

And fetch the actual browse/search library live from the backend.

## 4.2 How the app gets each streamer’s real library

### Provider registry

Use TMDB’s provider-list endpoints to discover region-specific provider IDs:
- `GET /watch/providers/tv?watch_region=ZA|US`
- `GET /watch/providers/movie?watch_region=ZA|US`

Do not hardcode provider-name guessing as the core source of truth.
Hardcode only a small allowlist mapping from TMDB provider IDs to supported streamers.

### Library browse

Use TMDB discover endpoints as the primary browse mechanism:
- `GET /discover/tv`
- `GET /discover/movie`

Required query params:
- `watch_region=<region>`
- `with_watch_providers=<providerId|providerId|...>` for OR across selected streamers
- `with_watch_monetization_types=flatrate`
- `page=<n>`
- `sort_by=popularity.desc` for default browse

Optional filters:
- `with_genres=<tmdbGenreIds>`
- `with_original_language=<lang>` only if the user explicitly filters by language
- `vote_count.gte` to suppress ultra-thin/noisy results if needed

Important:
- Do not repeat the old English-only logic.
- A real provider library is not “English only.”
- If the UI wants a language preference, make it an explicit filter, not a hidden rule.

### Search

Use TMDB search for text lookup:
- `GET /search/multi?query=...&page=...`
  - or split into `search/tv` and `search/movie` if cleaner

Then filter search results by provider availability:
- fast path: hit cached provider availability if already known
- slow path: enrich visible results with `/{tmdbType}/{tmdbId}/watch/providers`

### Pagination strategy

For browse:
- backend cursor should encode:
  - `region`
  - selected provider set
  - `mediaType`
  - sort
  - filter hash
  - current TMDB page

- app requests 20-40 results at a time
- backend fetches the next TMDB page, filters/enriches it, returns visible results plus `nextCursor`

For multi-streamer browse:
- use provider OR filtering in one discover request where possible
- enrich only the returned page’s items with per-title provider data for badges and chosen-streamer selection

For scale:
- cache per-title provider lookups for 24h
- cache discover-page responses by `(region, provider set, mediaType, page, filters)` for a short TTL
- warm popular combinations in the background if needed, but do not make warm-cache success a product requirement

## 4.3 How the show picker works at full-library scale

The picker needs a total rewrite.

Required behavior:
- server-backed query state
- debounced search
- genre filter
- streamer filter summary
- infinite scroll
- virtualization/windowing in the poster grid
- loading skeletons
- empty states
- “available on” badges per title

Recommended API:
- `GET /api/library?region=US&streamers=netflix,max&mediaType=all&genre=crime&query=&cursor=...`

Recommended UI behavior:
- default browse view: popular titles across selected streamers
- query mode: ranked search results restricted to selected streamers and region
- facet state in URL/hash for browser testing reproducibility

What not to do:
- do not load thousands of posters into memory at once
- do not prebundle the library into the app
- do not force the user to pick from a static subset

## 4.4 How the scheduler works with real data

Schedule entries should store:
- canonical TMDB identity
- media type
- chosen streamer
- start time
- end time
- local availability snapshot

Recommended schedule entry shape:
- `showId`
- `tmdbType`
- `streamerId`
- `dayOfWeek`
- `startTime`
- `endTime`
- `enabled`
- `availabilityCheckedAt`
- `availabilityStatus`

Scheduling rules:
- onboarding can still offer quick bands or presets
- final schedule must resolve to exact local times
- runtime derives from the actual title metadata
- editing one slot must not regenerate the rest of the week unless the user explicitly asks for auto-fill

Runtime behavior:
- schedule notifications from exact entries
- on app resume or daily refresh, revalidate upcoming entries against current provider availability
- if a title disappears from a selected streamer in that region, mark the slot degraded and prompt a replacement

## 4.5 How deep links work reliably at scale

This is the hardest truth in the repo.

TMDB can tell you:
- that a title is available on a provider in a region

TMDB cannot reliably tell you:
- the provider’s exact content URL/ID needed for deep-linking into Netflix, Max, Hulu, Peacock, etc.

That means the current approach is not salvageable:
- `https://www.netflix.com/title/{tmdbId}` is not a reliable Netflix deep link
- `https://play.max.com/show/{tmdbId}` is not a reliable Max deep link
- `https://www.hulu.com/series/{tmdbId}` is not a reliable Hulu deep link

Rebuild rule:
- stop pretending TMDB IDs are provider IDs

Reliable strategy, in order:

1. Best
- Use a licensed or provider-specific mapping source for exact provider IDs/URLs.
- If exact title-launch is a hard requirement, this is the real answer.

2. Acceptable v1.5 bridge
- Maintain exact deep links only where verified by test coverage and manual validation.
- For everything else, open the provider’s search experience with title + year.

3. Unacceptable
- Fabricated exact-title URLs from TMDB IDs or title slugs.

Recommended resolver model:
- `shared/provider-resolver.ts` defines per-streamer launch strategy:
  - `exact`
  - `search`
  - `web_fallback_only`

Per streamer example:
- Netflix: likely search fallback unless exact licensed mapping exists
- Disney+: exact may be possible only if entity IDs are sourced correctly, not guessed
- YouTube: search fallback is honest and workable
- Apple TV+: exact may still need dedicated mapping validation

Bottom line:
- if Al wants “tap notification, land on exact title in exact app” as a hard product promise, TMDB alone is insufficient

## 4.6 Deployment plan

### Web first

Deploy both:
- `api/` to Vercel
- a browser-testable build of `app/` to Vercel

Why:
- fastest iteration on browse/search/infinite-scroll behavior
- easiest real API verification
- easiest visual QA

### Native later

After the web flow is stable:
- keep the same `app/` codebase
- use Capacitor for Android and iOS wrappers
- verify notifications and app-launch behavior on devices
- only then move to TestFlight

Recommended sequence:
1. Web browse/search/schedule works end-to-end
2. Android device notification + launch validated
3. iOS wrapper + TestFlight

Do not start with TestFlight.
The product risk is in data truth and launch behavior, not in store packaging.

## 5. Tool Division

This is the blunt version.

## 5.1 Contract reset and architecture

Owner: **Codex**

Why:
- This is a systems problem, not a styling problem.
- It needs contract discipline across `/api`, `/app`, `/data`, and `/shared`.
- Codex is the best fit here for type contracts, backend shape, and identifying where the current repo is lying to itself.

Best at vs alternatives:
- Better than Cursor for backend/data architecture rigor
- Better than Claude Code for not drifting into confident-but-wrong product assumptions

Handoff contract:
- Codex writes/updates shared contracts, API shapes, and acceptance criteria
- Cursor and Claude Code implement against those contracts

Cowork role:
- Minimal
- Track tasks and status, but stay out of technical authorship

## 5.2 Backend library service

Owner: **Codex**

Why:
- This is the backbone of the rebuild.
- Wrong choices here poison every other layer.

Best at vs alternatives:
- Strongest on edge/backend TypeScript, caching, contract design, typed handlers, and integration-test shape
- Cursor is weaker here
- Claude Code can implement pieces, but should not own backend truth-model decisions

Handoff contract:
- Codex defines routes, payloads, cache semantics, and failure modes
- Claude Code can take bounded implementation tickets inside `/api` only after that

Cowork role:
- Orchestrate deploy checks and evidence capture
- Do not author the backend

## 5.3 Picker UI, infinite scroll, and browser QA

Owner: **Cursor 3**

Why:
- This is where Cursor is actually the best tool in the stack.
- Its browser tooling and UI iteration loop are the most useful fit for a large poster grid, search states, skeletons, and infinite scroll.

Best at vs alternatives:
- Better than Codex for visual verification and interaction debugging
- Better than Claude Code for fast UI iteration with live browser checks

Handoff contract:
- Codex hands Cursor:
  - stable API contract
  - mock fixtures
  - pagination contract
  - edge-case checklist

Cowork role:
- Coordinate verification runs and screenshot collection
- Stay out of implementation unless a human-in-the-loop click path is needed

## 5.4 App-side scheduling logic and state model

Owner: **Codex**

Why:
- This is domain logic and state integrity work.
- The current app already has type drift; this part needs stricter engineering than vibe-driven UI iteration.

Best at vs alternatives:
- Better than Cursor for state-model correctness
- Better than Claude Code for catching contract drift before it spreads

Handoff contract:
- Codex owns store shape, scheduler logic, deep-link launch policy, and migrations
- Cursor consumes that logic in the screen layer

Cowork role:
- None unless coordinating device verification

## 5.5 Data-layer repurposing

Owner: **Codex for redesign, Claude Code for bounded worker tasks**

Why:
- The current `/data` concept is wrong, so redesign belongs with the architecture owner.
- Once the redesign is fixed, Claude Code is useful for long, bounded, mechanical tasks.

Best at vs alternatives:
- Codex is better at deciding what `/data` should become
- Claude Code is good at grinding through schemas, scripts, and fixture generation once the target is unambiguous
- Claude Code is weaker at self-evaluation, so do not let it define “done” for this area alone

Handoff contract:
- Codex defines the new `/data` scope and acceptance tests
- Claude Code gets explicit tickets such as:
  - convert `streamers.json` to provider-ID manifest
  - write cache-warmer script
  - generate deterministic fixture pages

Cowork role:
- Track long-running jobs and daily reports

## 5.6 Deep-link resolver strategy

Owner: **Codex**

Why:
- This is where false confidence will do the most damage.
- The current repo is already faking exact links.

Best at vs alternatives:
- Better than Cursor because this is not a UI problem
- Better than Claude Code because this needs skepticism, not just output volume

Handoff contract:
- Codex defines per-streamer launch mode:
  - exact
  - search
  - web fallback
- Cursor wires it into UI
- Claude Code can help with fixture generation or test cases

Cowork role:
- Manual device validation coordination only

## 5.7 Native packaging and TestFlight prep

Owner: **Cursor 3 for app-side integration, Cowork for orchestration**

Why:
- Once the web flow works, this becomes a verification and packaging problem more than a domain-model problem.

Best at vs alternatives:
- Cursor is stronger than Codex for interactive UI/device-ish validation loops
- Cowork is useful for multi-step operational flows, screenshots, and handoff tracking
- Claude Code adds little here unless there is a bounded native config task

Handoff contract:
- Codex signs off on app logic and launch semantics
- Cursor handles wrapper integration and visual/device smoke checks
- Cowork manages checklist execution and reports

## 6. Recommended Execution Order

1. Codex rewrites `shared` contracts and backend/app/data boundaries.
2. Codex rebuilds `/api` into a real browse/search/provider service.
3. Codex rewrites app state and schedule/deep-link policy.
4. Cursor rebuilds picker, schedule UI, and browser-tested flows against the new API.
5. Claude Code handles bounded `/data` migration tasks under Codex-defined acceptance tests.
6. Cursor + Cowork handle native wrapping, screenshots, and TestFlight prep.

## 7. Final Recommendation

Do not “improve” the 278-title architecture.
Replace it.

The right salvage call is:
- keep the repo split
- keep the Capacitor shell
- keep the TMDB proxy idea
- keep the metadata discipline
- throw out the shipped-catalogue worldview

If the rebuild still ships a precomputed catalogue as the user’s main browse surface, it will miss the actual spec again.
