# Evidence Log

Raw verification output per morning cycle. Append-only. Each day gets a
`## YYYY-MM-DD` heading with per-claim timestamp, command, and output.

---

## 2026-04-21

### Setup (Cowork orchestration bootstrap)
- `2026-04-21T12:25Z` — repo state before setup: branch=master, commits=7, no remote, clean tree.
- `2026-04-21T12:25Z` — handoff file `C:\Users\27741\Son-Memory\handoffs\mychannel-v1-interfaces.md` does not exist; INTERFACES.md blocked pending Al paste.
- `2026-04-21T12:26Z` — renamed master → main, created branches: backend, app, data. Verified via `git branch -a`.

---

## 2026-04-23

### c2 — UI primitives (Cursor, lane 1)

- Status: **code authored, .ts files NOT on disk**. Cursor is stuck in Plan mode; three `Write` calls on `app/src/components/*.ts` returned hard tool-layer rejection (`"Plan mode can only edit markdown files"`). Two `SwitchMode(target=agent)` requests were rejected on Al's end and the tool then instructed "Do not attempt to switch modes again." No per-write approval prompt surfaced.
- Workaround shipped: full c2 code landed as a markdown bundle at `orchestration/lane1/c2-code-bundle.md` (commit `1fc50b7`). Bundle contains all six files verbatim: `mc-library-card.ts`, `mc-provider-badges.ts`, `mc-skeleton-tile.ts`, `mc-empty-state.ts`, `mc-filter-bar.ts`, `index.ts`.
- Compliance with brief (`orchestration/lane1/CURSOR-c2-prompt.md`): confirmed by self-review — localStorage key `mc.picker.filters`, `content-visibility: auto` + `contain-intrinsic-size: 160px 240px` on library-card and skeleton-tile hosts, 250 ms query debounce, no screen wiring, no `shared/*` edits, types imported from `../types`.
- Verification **not run**: `npx tsc --noEmit` requires the files to exist on disk; Cursor can't create them from Plan mode.
- Commit message for when files land: `feat(picker): add UI primitives — card, badges, skeleton, empty, filter-bar` (per brief).
- Al action needed: toggle agent mode in the Cursor chat UI chrome yourself (the mode selector at the bottom of chat, not via tool call), then say "execute" — c2 lands in one commit. Alternatively, copy the six files out of the bundle and commit locally, or hand the bundle to Codex.
c3 shipped: commit 579cc12; removed app/src/data/catalogue.ts (app/src/lib/catalogue.ts was absent); rewired preview.ts, scheduling.ts, shows-tab.ts; added /slot-edit/:slotId; tsc clean; vitest 9/9; note components/index not landed upstream, dynamic placeholder import used until c2 commit lands.

### c2 — UI primitives SHIPPED (Vos on Cursor's behalf, lane 1)

- Status: **landed**. Commit `9b94dfc`, pushed to `origin/v2-rebuild`.
- Path: Cursor was unable to write `.ts` files from its Plan-mode gate, so I (Vos) wrote the six files verbatim from `orchestration/lane1/c2-code-bundle.md` via the Windows-MCP filesystem. Per Al's guardrail 4 ("stop making Al copy-paste"), the orchestrator executes the paste step when an agent is blocked by its own UI chrome.
- Files: `app/src/components/{mc-library-card,mc-provider-badges,mc-skeleton-tile,mc-empty-state,mc-filter-bar,index}.ts` (6 new files, 664 insertions).
- Fix applied during tsc: `MCLibraryCard.title` collided with `HTMLElement.title: string` — renamed property to `libraryTitle` to satisfy variance. No consumers downstream yet (c3 did not wire screens to the card), so the rename is breakage-free. Bundle text is now stale vs. the canonical in-tree files on this one name; future screen wiring should use `.libraryTitle=`.
- Brief compliance (`orchestration/lane1/CURSOR-c2-prompt.md`): confirmed — localStorage key `mc.picker.filters`, `content-visibility: auto` + `contain-intrinsic-size: 160px 240px` on card + skeleton hosts, 250 ms debounce on query input, no `shared/*` edits, no screen wiring, types imported from `../types`.
- Frozen-zone audit: Codex's c3 diff (commit 579cc12) touched only `catalogue.ts`, `live-title-details.ts`, `main.ts`, `router.ts`, `preview.ts`, `scheduling.ts`, `shows-tab.ts`, `slot-edit.ts` + generated build output; it did **not** touch `app/src/components/*` (c2's zone) or `app/src/lib/library-api.ts`/`library-cache.ts` or `shared/*` (c1's zone). Contract held.
- Verification run (`cd app && npx tsc --noEmit`): exit 0, no errors (log: `C:\Users\27741\AppData\Local\Temp\tsc-c2.log` empty on second pass after rename).
- Follow-up: Codex left a dynamic-import placeholder in `app/src/main.ts` L17-18 (`const componentsIndexModule = './components/index'; void import(componentsIndexModule).catch(() => undefined);`) to keep c3 tsc-clean before c2 existed. Now that c2 is on disk, this should be demoted to a static `import './components/index';`. Leaving for a small polish commit so c3's lane isn't re-opened mid-lane-1.

### Lane 3 prep — screenshot harness scaffolded (Vos direct, non-blocking)

- Commit: `0559afe`, pushed to `origin/v2-rebuild`.
- Entry: `orchestration/screenshots/run-screenshot-pass.mjs` (ESM, no top-level await, manual argv parse).
- Supporting files: `orchestration/screenshots/README.md` (run doc), `orchestration/screenshots/.gitignore` (excludes `out/`).
- Routes (default): `/`, `/channel`, `/preview`, `/scheduling`, `/shows`, `/slot-edit/test-slot-1`. Overridable via `--routes=csv`.
- Base (default): `http://localhost:5173`. Overridable via `--base=url`.
- Output: `orchestration/screenshots/out/<ISO-UTC>/{<slug>.png, manifest.json}`. Overridable via `--out=path`.
- Viewport: 390×844 (iPhone-ish / Capacitor shell), full-page screenshot per route, `networkidle` + 2 s grace.
- Playwright: **added** to root `package.json` devDependencies at `^1.52.0`. Chromium binary not installed; runner invokes `npx playwright install chromium` on first use.
- Exit codes: 0 all-pass, 1 any route error, 2 Playwright missing.
- Verification: `node --check orchestration/screenshots/run-screenshot-pass.mjs` → exit 0. Not run against a live server (screens don't exist yet — Lane 2 will ship them).
- Path note: brief envisioned Claude Code CLI in a wt session running this scaffold. That wt session (PID 46512) was launched earlier but the tier-"click" restriction on Windows Terminal blocked keystroke / clipboard injection from the orchestrator. Rather than burn a fresh claude-code spawn on a 250-line scaffold, Vos wrote the files directly. Same output, zero CLI usage consumed.
- Follow-ups: none blocking. After Lane 2 lands screens + the dev server boots, run `npx playwright install chromium` once, then `node orchestration/screenshots/run-screenshot-pass.mjs` from repo root.

### main.ts placeholder demoted to static import (Vos direct, polish)

- Commit: `4052593`, pushed to `origin/v2-rebuild`.
- Edit: `app/src/main.ts` L17-18 — removed `const componentsIndexModule = './components/index'; void import(componentsIndexModule).catch(() => undefined);` and inserted `import './components/index';` on L7 alongside the other static component imports.
- Rationale: c3's dynamic-import indirection existed solely to keep tsc clean before c2's components/index.ts was on disk. c2 shipped (`9b94dfc`) — placeholder is obsolete. Static import is simpler, eager, and matches the pattern used by button/top-bar/progress-bar/poster-card/streamer-tile/modal.
- Verification: `cd app && npx tsc --noEmit` exit 0, empty log (`C:\Users\27741\AppData\Local\Temp\tsc-main-demote.log`).
- Diff: `1 file changed, 1 insertion(+), 3 deletions(-)`. Out of all frozen zones (main.ts is router/boot, not c1/c2/c3 lane property).
### c5 — slot-edit full-screen route shipped

- commit: c76b55c
- files: app/src/screens/slot-edit.ts (full-screen body), app/src/lib/channel-adapter.ts (new), app/src/lib/picker-return.ts (new), app/src/screens/week.ts (minimal tap handler), shared/V1.5-TECH-DEBT.md (+1 line)
- week.ts touch: yes, line 39 routes existing slots to `slot-edit/${slot.id}`
- tsc: clean
- tests: vitest 3 files / 9 tests passed
- notes: no modal used; picker return intent is set only because c4 owns consumption; scheduler remains frozen.
### c4 — library-picker shipped

- commit: 583218c
- files: app/src/screens/shows.ts (rebuild), app/src/types.ts (+PersistedTitleClient), shared/V1.5-TECH-DEBT.md (+1 line)
- tsc: clean
- tests: vitest 3 files / 9 tests passed
- notes: picker uses real TMDB library/title endpoints through c1 client/cache; no `ctx.catalogue`; `.libraryTitle=` only; slot-edit return intent intentionally left as TODO per brief.

### Vercel preview URL live (Vos direct, for Al's iPhone gate on c6)

- commit: a949ac3 (infra(vercel): move vercel.json to repo root; build from app/ with shared access)
- rationale: first deploy attempt (project `app`, rooted at `app/`) failed esbuild — `src/lib/library-api.ts` and `src/lib/deep-link.ts` import from `../../../shared/constants` and `../../../data/streamers.json`, outside `app/`. Fix: move vercel.json to repo root so build context is the whole repo; use `cd app && npm install && npm run build:bundle` + output `app/www`; `/api/*` → `https://mychannel-api.vercel.app/api/:path*` proxy still in place (frontend needs zero env vars).
- Vercel project: `albert-snymans-projects/mychannel-universal-app` (old `app` project removed; fresh link at repo root; GitHub repo auto-connected).
- Build: esbuild OK, 137.6kb main.js + 17.4kb test-components.js; completed in 26 s.
- Preview URL: `https://mychannel-universal-b6cs2z0s9-albert-snymans-projects.vercel.app` — HTTP 200, `<title>MyChannel</title>`, publicly accessible (no Vercel SSO gate).
- Backend proxy verified: `GET /api/health` → `{"status":"ok","version":"1.0.0","timestamp":"2026-04-23T17:18:47.702Z"}` via rewrite to mychannel-api.
- Gate: Al's 10-minute iPhone Safari walk on this URL. c6 kickoff blocked pending his pass/fail.
