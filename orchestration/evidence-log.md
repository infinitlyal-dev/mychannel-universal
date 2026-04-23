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
