# Lane 2 / Commit 6 — Channel home with three hero states (Cursor)

**Branch:** `v2-rebuild`
**Lane:** 2 (parallel with c4 and c5)
**Your agent:** Cursor Composer, Agent mode
**Depends on:** c1 (`7962407`), c2 (`9b94dfc`), c3 (`579cc12`), main.ts demote (`4052593`)
**Blocks:** nothing — final Lane 2 lane
**Reference plan:** `shared/cursor-picker-plan.md` §1.2 (week), §1.3 (channel.ts), §4 (per-slot edit), §4.1 (rebuildChannel adapter)
**Reference amendments:** plan commit `7cb89ba` — amendment (3) no empty-grid regression.

> **Three hero states must all work. Explicitly.** (1) NOW PLAYING — current slot active. (2) UP NEXT — next slot upcoming. (3) "nothing scheduled today" — empty day, shows tomorrow's first slot. The third state is a known gap in earlier specs. Al flagged it. DO NOT SKIP IT. A channel screen that goes blank when today is empty is a regression — ship-blocker.

---

## Deliverables (one commit)

### A. Rebuild `app/src/screens/channel.ts` as a pure consumer of `state.channel`

Channel is hydrated upstream by `rebuildChannel` (slot-edit mutations, c5) or at app boot (wire this in §D below). `channel.ts` reads `state.channel: ScheduledProgram[]` and renders — it never calls `hydrateChannel` itself.

Drop the dependency on `Show[]`. Drop the dependency on `app/src/lib/channel-hero.ts` (legacy; `preview.ts` + `scheduling.ts` still import it — leave those untouched).

Screen composition (lit-html render fns local to `channel.ts`):

1. `<mc-top-bar>` (existing).
2. **Hero region** — see §B, three states.
3. **Up-next strip** — next 4 `ScheduledProgram` entries after the hero's index. Horizontally scrolling row of small poster cards. Use `<mc-library-card>` with a compact variant or render a local tiny tile if the card doesn't fit — TBD by what looks right. Binding via `.libraryTitle=` on the card.
4. **Today's lineup** — all programs whose `dayOfWeek === today.getDay()`, chronological. Card grid (re-use `<mc-library-card>` with small tile). Empty list is fine — the hero covers the "today is empty" message; the lineup row simply doesn't render when empty.
5. **Watch button** (only in state 1 NOW PLAYING and state 2 UP NEXT) — resolves via `ScheduledProgram.searchUrls` and calls the existing deep-link path. No new deep-link code. The launcher already exists; import from `app/src/lib/deep-link.ts`.

### B. Three hero states — ALL REQUIRED

Write one `computeHeroFromPrograms` helper local to `channel.ts` (per plan §1.3):

```ts
type HeroState =
  | { kind: 'now-playing'; program: ScheduledProgram }
  | { kind: 'up-next'; program: ScheduledProgram }
  | { kind: 'nothing-today'; tomorrowFirst: ScheduledProgram | null };

function computeHeroFromPrograms(
  programs: ScheduledProgram[],
  now: Date,
): HeroState {
  // 1. NOW PLAYING — first program where now ∈ [startAt, endAt]
  const live = programs.find(p => within(p, now));
  if (live) return { kind: 'now-playing', program: live };

  // 2. UP NEXT — earliest future occurrence today
  const today = now.getDay();
  const futureToday = programs
    .filter(p => p.dayOfWeek === today && startsAfter(p, now))
    .sort(chronological)[0];
  if (futureToday) return { kind: 'up-next', program: futureToday };

  // 3. NOTHING SCHEDULED TODAY — show tomorrow's first slot (null if week is empty)
  const tomorrow = (today + 1) % 7;
  const tomorrowFirst = programs
    .filter(p => p.dayOfWeek === tomorrow)
    .sort(chronological)[0] ?? null;
  return { kind: 'nothing-today', tomorrowFirst };
}
```

Render each state:

- **`now-playing`**: backdrop + title + "NOW PLAYING" label + Watch button + progress bar (use `<mc-progress-bar>`) showing `(now - startAt) / (endAt - startAt)`.
- **`up-next`**: backdrop + title + "UP NEXT at {HH:MM}" label + Watch button (launch immediately even though it hasn't started — user chose to watch early, that's fine).
- **`nothing-today`**: `<mc-empty-state>` with:
  - If `tomorrowFirst` is non-null: heading `"Nothing scheduled today"`, message `"Tomorrow at {HH:MM}: {title}"`, action `{label: "Open week view", event: "mc-open-week"}`.
  - If `tomorrowFirst` is null (whole channel empty): heading `"Your channel is empty"`, message `"Pick some titles to get started."`, action `{label: "Add titles", event: "mc-open-picker"}`.
  - Listen for `mc-empty-action` → route to `/week` or `/shows-picker`.

All three states tsc-clean and visually tested. Use `now = new Date(Date.now())` in production; accept an injected `now` in the helper so tests can freeze time.

### C. Week grid — wire tap + scroll capture (plan §1.2)

Rebuild `app/src/screens/week.ts` as an editable per-slot grid driven by `state.schedule` + `state.selectedTitles`:

- 7-day × 4-band grid (same column structure as today).
- Each cell shows either the scheduled title's thumb + title + start time, or an "+ Add" button if empty/disabled.
- Day-header row has a "+" that opens the slot-create sheet preset to that day. (For this commit, the "+" can stub out with a toast "Slot create: coming soon" — v1 adds ad-hoc slot creation, not in picker-plan scope. Al can pull in later.)
- Tap on a slot cell captures `weekScrollY = window.scrollY` (module-scoped `let`) and navigates to `ctx.navigate('slot-edit/' + slot.id)` — the full-screen route (c5).
- On mount from a return navigation, restore `window.scrollTo(0, weekScrollY)`.
- **No-reshuffle guarantee:** mutations write to a single `ScheduleEntry` keyed by `slot.id`. Delete the legacy "rebuild via `buildSchedule(shows, slots)` on every toggle" behavior.

Delete the legacy `buildSchedule(shows, slots)` call-site in week.ts. `buildSchedule` stays in scheduler.ts (legacy; frozen; still used by the wizard `/wizard/preview` path).

### D. Boot-time channel hydration

At app boot (in `main.ts` or wherever the initial channel is computed), call `rebuildChannel(state.schedule, state.selectedTitles, state.streamers)` once and `ctx.patch({ channel })`. Only if `state.channel` is currently empty / stale. c5 owns `rebuildChannel`; you import it:

```ts
import { rebuildChannel } from '../lib/channel-adapter';
```

If c5 hasn't landed yet at the time you start this lane, add a TODO comment and stop — this line is the one cross-lane coupling that genuinely requires c5's adapter module to exist on disk.

### E. `<mc-library-card>` binding

Same rule as c4 / c5: consume with `.libraryTitle=` (NOT `.title=`). The card was renamed in c2 to avoid `HTMLElement.title: string` variance.

---

## Hard rules (frozen zones)

- **Do NOT** touch `shared/*`.
- **Do NOT** touch `app/src/lib/scheduler.ts`, `app/src/lib/deep-link.ts`, `app/src/state/store.ts`.
- **Do NOT** touch `app/src/lib/library-api.ts` or `app/src/lib/library-cache.ts` — c1's zone.
- **Do NOT** touch `app/src/components/*` — c2's zone. Consume via props + events.
- **Do NOT** touch `app/src/router.ts` — c3 already has `/channel` and `/week` routes.
- **Do NOT** touch `app/src/lib/channel-adapter.ts` or `app/src/lib/picker-return.ts` — c5's zone; consume only.
- **Do NOT** touch `app/src/screens/shows.ts` — c4's zone.
- **Do NOT** touch `app/src/screens/slot-edit.ts` — c5's zone.
- **Do NOT** touch `app/src/lib/channel-hero.ts` — legacy, still used by preview.ts + scheduling.ts; leave it alone.
- The third hero state (`nothing-today`) is NOT optional. Ship it or don't ship the commit.
- Style: 2-space indent, single quotes, type-only imports, no default exports.

---

## Verification gate (run before commit)

```
cd C:\dev\mychannel-universal\app
npx tsc --noEmit
npx vitest run
```

Both must exit 0 / pass. If you add a hero-state unit test (recommended — it's the whole reason this commit exists), it should cover:

- `now ∈ slot` → `now-playing`
- `now < first future slot today` → `up-next`
- today-empty, tomorrow-populated → `nothing-today` with `tomorrowFirst` set
- whole channel empty → `nothing-today` with `tomorrowFirst: null`

Then commit:

```
git add app/src/screens/channel.ts app/src/screens/week.ts app/src/main.ts
# plus any unit test file under app/test/ or similar
git commit -m "feat(channel): three hero states — now-playing, up-next, nothing-today"
git push origin v2-rebuild
```

---

## When done

Append to `orchestration/evidence-log.md`:

```
### c6 — channel home (three hero states) shipped

- commit: <SHA>
- files: app/src/screens/channel.ts (rebuild), app/src/screens/week.ts (rebuild — no-reshuffle), app/src/main.ts (boot-time hydrate)
- hero states: [now-playing ✓ / up-next ✓ / nothing-today ✓]
- tests: [state matrix covered — yes/no, pass/fail]
- tsc: clean
- notes: [anything Al should know — boot-hydrate race conditions, week scroll edge cases, backdrop fallbacks, etc.]
```

Then stop. Lane 2 is complete.
