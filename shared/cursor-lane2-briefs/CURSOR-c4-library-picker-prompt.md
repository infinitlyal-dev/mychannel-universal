# Lane 2 / Commit 4 — Library picker screen (Cursor)

**Branch:** `v2-rebuild`
**Lane:** 2 (parallel with c5 and c6)
**Your agent:** Cursor Composer, Agent mode
**Depends on:** c1 (`7962407` — library-api, library-cache), c2 (`9b94dfc` — UI primitives), c3 (`579cc12` — router, rewire, /slot-edit route stub), main.ts demote (`4052593`)
**Blocks:** nothing in Lane 2 — runs parallel with c5/c6
**Reference plan:** `shared/cursor-picker-plan.md` §1.1 (shows.ts picker), §2 (data flow), §2.4 (filter persistence), §3 (virtualization), §4.1 (runtime annotation at pick-time)
**Reference amendments:** plan commit `7cb89ba` — especially (1) runtime fetch at pick-time, widen client-side `PersistedTitleClient` only; (2) filter persistence via `localStorage`.

> **This is the moment real TMDB data lights up in the app.** Full effort. Do not stub. Infinite scroll, search, filter bar, provider badges, virtualization — all wired through. If you can't make a section production-quality in this commit, stop and raise it — do not ship a half-baked picker.

---

## Deliverables (one commit)

### A. Rebuild `app/src/screens/shows.ts` as the live-library picker

Three reachable modes, same file (no new screens):

- `wizard/shows` (onboarding step)
- `shows-picker` (return user "Add titles" path)
- Both render the same picker UI; only the footer CTA label + post-click navigation differ (wizard → `/wizard/times`, tab-return → `/now`).

Delete every remaining consumer of the old `ctx.catalogue` path inside `shows.ts`. Legacy `poster-card.ts` stays in the tree (other screens use it) — but the picker screen MUST use the new `<mc-library-card>`.

Screen composition (lit-html render fns local to `shows.ts` unless a primitive):

1. `<mc-top-bar>` (existing).
2. `<mc-filter-bar>` — wire to the picker's `screenState.filters`. Props: `providers`, `selectedProviders`, `type`, `query`, `genre`. Listen for `mc-filter-change` → update `screenState.filters`, reset `page=1`, refetch, persist to localStorage.
3. Counter row: `"X selected · min 6"` with Continue/Done button. Disabled until `state.selectedTitles.length >= 6`.
4. Results grid — see §B virtualization.
5. Bottom skeleton row (one full row of `<mc-skeleton-tile>` while a page fetch is in-flight).
6. `<mc-empty-state variant="...">` with variants `no-providers | no-results | no-filters | api-error`. Single component, variant prop chosen by which empty condition matched.
7. Sentinel: `<div data-sentinel>` below the last tile, picked up by the `IntersectionObserver` described in §B.

### B. Virtualization (plan §3, two lines of defense)

1. **CSS line:** every grid row wrapper gets `content-visibility: auto; contain-intrinsic-size: auto 360px`. (`<mc-library-card>` host already sets `content-visibility: auto; contain-intrinsic-size: 160px 240px` — the row wrapper's 360px intrinsic height accounts for caption + badge row below the poster.)
2. **JS line (hard window):** `MAX_LIVE_ROWS = 40`. Rows outside the window are replaced with a spacer `<div>` whose height = `nRows × measuredRowHeight`. Measurement: `ResizeObserver` on the first rendered row writes `rowHeight` + `colsPerRow` to a module-scoped variable; spacers recompute on resize.
3. Grid CSS: `display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px;`. Cap tile width at 240px on ≥1600px viewports.
4. `IntersectionObserver` on `<div data-sentinel>` with `rootMargin: '0px 0px 600px 0px'`. On intersect → if not already loading and `page < totalPages`, load `page+1`. The observer `unobserve`s while loading and re-observes after the fetch resolves.

### C. Data plumbing (plan §2)

Consume the c1 client untouched:

```ts
import {
  fetchLibrary,
  fetchProviders,
  fetchTitle,
} from '../lib/library-api';
import {
  getCachedLibraryPage, setCachedLibraryPage,
  getCachedProviders, setCachedProviders,
  getCachedTitleDetail, setCachedTitleDetail,
} from '../lib/library-cache';
```

Screen lifecycle:

- **On mount:**
  - Read `screenState` from localStorage key `mc.picker.filters` (same key as `<mc-filter-bar>` — one reader, one writer).
  - If no cached providers for `state.region`, call `fetchProviders(state.region)`, write through `setCachedProviders`.
  - Fire the initial `fetchLibrary({page:1, ...filters})`. Show a full page of `<mc-skeleton-tile>` while pending.
- **On filter change:** reset `page=1`, clear `screenState.items`, refetch, scroll to top.
- **On sentinel intersect:** `fetchLibrary({page:page+1, ...filters})`, append to `screenState.items`. Stop when `page >= totalPages`.
- **On card tap (`mc-card-click`):** call `onPickTitle(card)` from plan §4.1 step 2. Fetches title detail (cached), annotates with `runtimeMinutes`, writes `PersistedTitleClient` into `state.selectedTitles` via `ctx.patch`.
- **On card tap when already selected:** de-select (remove from `selectedTitles`). `<mc-library-card>.selected` reflects membership.

State types (add to `app/src/types.ts`):

```ts
export * from '../../shared/types';
import type { PersistedTitle as BasePersistedTitle } from '../../shared/types';

/**
 * Client-only extension of PersistedTitle.
 * See V1.5-TECH-DEBT.md: "Promote runtimeMinutes onto shared/types.ts".
 */
export interface PersistedTitleClient extends BasePersistedTitle {
  runtimeMinutes?: number | null;
}
```

Add the V1.5-TECH-DEBT.md entry in this same commit: `Promote runtimeMinutes onto shared/types.ts PersistedTitle; currently widened client-side in app/src/types.ts.`

### D. Error / retry (plan §2.5)

- On fetch rejection or `response.success === false`: set `screenState.error`, render `<mc-empty-state variant="api-error">` with a Retry button.
- `mc-empty-action` → one retry. On second failure, keep the error state. No silent backoff, no auto-retry loop.

### E. Smart-TV focus

- Initial focus on the search input when picker opens from `shows-picker`. From `wizard/shows`, initial focus on the first tile (no prior text to edit).
- D-pad up/down from the filter bar enters the grid; up from the first tile returns to the filter bar. D-pad left/right moves between tiles in a row, wraps to next/previous row.
- Keep focus-visible ring visible (no `outline: 0`).

### F. `<mc-library-card>` consumer binding — CRITICAL

Consume the card via `.libraryTitle=` (NOT `.title=`). The property was renamed in c2 to avoid `HTMLElement.title: string` variance collision. Example:

```ts
html`
  <mc-library-card
    .libraryTitle=${item}
    .providers=${providerBadgesFor(item)}
    ?selected=${selectedIds.has(item.id)}
    @mc-card-click=${(e: CustomEvent) => onCardClick(e.detail)}
  ></mc-library-card>
`;
```

If you write `.title=` by reflex, tsc will accept it (string setter on HTMLElement) but the poster will render blank. Use `.libraryTitle=` everywhere.

---

## Hard rules (frozen zones)

- **Do NOT** touch `shared/*` (except appending one line to `shared/V1.5-TECH-DEBT.md` per §C).
- **Do NOT** touch `app/src/lib/scheduler.ts`, `app/src/lib/deep-link.ts`, `app/src/state/store.ts` — frozen per picker-plan header.
- **Do NOT** touch `app/src/lib/library-api.ts` or `app/src/lib/library-cache.ts` — c1's zone.
- **Do NOT** touch `app/src/components/*` — c2's zone. Consume components through their public props + events only.
- **Do NOT** touch `app/src/router.ts` — c3 finalised routes; no new routes here.
- **Do NOT** touch `app/src/screens/week.ts`, `channel.ts`, or `slot-edit.ts` — those belong to c5 and c6 (parallel lanes).
- **Do NOT** wire the picker to `slot-edit`'s return intent session module yet — c5 owns that protocol. Leave a TODO marker and stop.
- Style: 2-space indent, single quotes, type-only imports, no default exports.

---

## Verification gate (run before commit)

```
cd C:\dev\mychannel-universal\app
npx tsc --noEmit
```

Must exit 0. If you have vitest tests for `library-api` or a picker render test, run:

```
npx vitest run
```

Must pass. Then commit:

```
git add app/src/screens/shows.ts app/src/types.ts shared/V1.5-TECH-DEBT.md
git commit -m "feat(picker): live-library shows picker — infinite scroll, filter persistence, virtualization"
git push origin v2-rebuild
```

---

## When done

Append to `orchestration/evidence-log.md`:

```
### c4 — library-picker shipped

- commit: <SHA>
- files: app/src/screens/shows.ts (rebuild), app/src/types.ts (+PersistedTitleClient), shared/V1.5-TECH-DEBT.md (+1 line)
- tsc: clean
- tests: <vitest result or "n/a">
- notes: [anything Al should know — focus quirks, TMDB edge cases, localStorage migration, etc.]
```

Then stop. Do not start c5 or c6.
