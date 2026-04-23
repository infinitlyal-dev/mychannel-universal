# Lane 2 / Commit 5 — Slot-edit full-screen route (Cursor)

**Branch:** `v2-rebuild`
**Lane:** 2 (parallel with c4 and c6)
**Your agent:** Cursor Composer, Agent mode
**Depends on:** c1 (`7962407`), c2 (`9b94dfc`), c3 (`579cc12` — route stub `/slot-edit/:slotId` exists), main.ts demote (`4052593`)
**Blocks:** nothing in Lane 2
**Reference plan:** `shared/cursor-picker-plan.md` §1.2 (week + slot-edit), §4 (per-slot edit walkthrough), §4.1 (runtime + channel-adapter)
**Reference amendments:** plan commit `7cb89ba` — **amendment (4)** is the one that matters here: per-slot edit is a DEDICATED FULL-SCREEN ROUTE, NOT a modal. Smart-TV focus on modals is clumsy. `<mc-modal>` stays alive for other uses; it does NOT participate in per-slot edit.

> **This MUST be a full-screen route.** Do not render this inside `<mc-modal>`. Do not popover, do not overlay. Full-screen. The route already exists as a stub (c3 commit `579cc12`). You fill in the body.

---

## Deliverables (one commit)

### A. Create `app/src/screens/slot-edit.ts`

Export `renderSlotEdit(ctx, slotId: string)` consumed by `router.ts`'s existing `/slot-edit/:slotId` case. The stub in router points at a placeholder custom element; replace the registration so the router calls your `renderSlotEdit` directly (same pattern as `renderShows`, `renderChannel`, etc. — check c3's `579cc12` diff for the exact integration point).

Screen layout (lit-html, full-screen — no `<mc-modal>`):

1. `<mc-top-bar>` with back button wired to `ctx.navigate('week')`. Title text: `Edit {DayName} {HH:MM}` (derive from `schedule.find(s => s.id === slotId)`).
2. Preview strip: `<mc-library-card>` of the currently-bound title (if any). Bind via `.libraryTitle=${currentTitle}` with `providers` derived the same way the picker does. Non-interactive (pass `disabled`).
3. Tab bar — 4 tabs: `Swap` | `Off` | `Remove` | `Pick new title`. Smart-TV focus model (see §D).
4. Tab content region. Each tab renders into the same region below the tab bar:
   - **Swap:** grid of `state.selectedTitles` as `<mc-library-card>` tiles. Current `slot.titleId` pre-marked selected. Tap → mutation (§B1) + `ctx.navigate('week')`.
   - **Off:** a single destructive button "Disable this slot". Tap → mutation (§B2) + navigate back.
   - **Remove:** a single destructive button "Remove this slot from the week". Tap → mutation (§B3) + navigate back.
   - **Pick new title:** navigates to `shows-picker` with a session-scoped return intent — `setReturnIntent({ type: 'slot-edit', slotId })` from the new module in §E. After the picker writes a new title, returning to `/slot-edit/:slotId` reads the intent and auto-binds that new titleId into the slot (step 4 of plan §4).

If `slot` is not found: render an empty-state `<mc-empty-state heading="Slot not found" message="It may have been removed." action={label: "Back to week", event: "mc-back"}>` + listen for `mc-empty-action` → navigate to week.

### B. Mutations (plan §4 step 4-6)

All three mutations land through `ctx.patch`. All three use `rebuildChannel` from the new adapter module in §C.

```ts
// 1. Swap (replace titleId; may also change endTime via computeEndTime)
const nextSchedule = state.schedule.map(s =>
  s.id === slotId
    ? { ...s, titleId: newTitleId, showId: newTitleId, endTime: computeEndTime(s, newTitle) }
    : s
);

// 2. Off (disable)
const nextSchedule = state.schedule.map(s =>
  s.id === slotId ? { ...s, enabled: false } : s
);

// 3. Remove
const nextSchedule = state.schedule.filter(s => s.id !== slotId);
```

Then for all three:

```ts
const nextChannel = rebuildChannel(nextSchedule, state.selectedTitles, state.streamers);
await ctx.patch({ schedule: nextSchedule, channel: nextChannel });
ctx.navigate('week');
```

### C. Create `app/src/lib/channel-adapter.ts`

Caller-side adapter, not a scheduler edit. Exact code per plan §4 step 5 — copy-paste that block:

```ts
import { hydrateChannel } from './scheduler';
import type { PersistedTitle, ScheduleEntry, ScheduledProgram, StreamerId } from '../types';

export function rebuildChannel(
  schedule: ScheduleEntry[],
  selectedTitles: PersistedTitle[],
  selectedProviders: StreamerId[],
): ScheduledProgram[] {
  const enabled = schedule
    .filter(s => s.enabled)
    .slice()
    .sort((l, r) =>
      l.dayOfWeek !== r.dayOfWeek
        ? l.dayOfWeek - r.dayOfWeek
        : l.startTime.localeCompare(r.startTime),
    );
  const titleById = new Map(selectedTitles.map(t => [t.id, t]));
  const slotOrderedTitles: PersistedTitle[] = enabled
    .map(s => s.titleId && titleById.get(s.titleId))
    .filter((t): t is PersistedTitle => Boolean(t));
  return hydrateChannel(schedule, slotOrderedTitles, selectedProviders);
}
```

The pre-ordering exploits `hydrateChannel`'s `titles[index % titles.length]` pick so per-slot bindings land in the right slot without editing scheduler.ts.

### D. `computeEndTime` — inline in slot-edit.ts (plan §4 step 6)

Inline the 5-line clamp helper. DO NOT export from scheduler.ts (frozen).

```ts
function clampEndToWindow(start: string, windowEnd: string, runtimeMinutes: number): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = windowEnd.split(':').map(Number);
  const startMin = sh * 60 + sm;
  const windowEndMin = eh * 60 + em;
  const naturalEnd = startMin + runtimeMinutes;
  const clamped = Math.min(naturalEnd, windowEndMin);
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0');
  const mm = String(clamped % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

function computeEndTime(slot: ScheduleEntry, title: PersistedTitleClient): string {
  const runtime = title.runtimeMinutes ?? null;
  if (runtime == null) return slot.endTime;
  return clampEndToWindow(slot.startTime, slot.endTime, runtime);
}
```

Add to `shared/V1.5-TECH-DEBT.md`: `De-dupe clampEndToWindow between scheduler.ts and slot-edit.ts when scheduler un-freezes.`

### E. Session-scoped return-intent module — `app/src/lib/picker-return.ts`

New tiny module (module-scoped `let`, not store):

```ts
export type PickerReturnIntent =
  | { type: 'slot-edit'; slotId: string }
  | null;

let intent: PickerReturnIntent = null;

export function setReturnIntent(next: PickerReturnIntent): void { intent = next; }
export function consumeReturnIntent(): PickerReturnIntent {
  const v = intent;
  intent = null;
  return v;
}
```

The picker (c4) will later `consumeReturnIntent()` on mount — but that's c4's wiring, not yours. In this commit you only set the intent from the "Pick new title" tab.

### F. Smart-TV focus model (plan §1.2)

- Initial focus programmatically lands on the **Swap** tab button on route entry.
- D-pad left/right cycles `Swap → Off → Remove → Pick new title → Swap` (wraps).
- D-pad down enters the currently-selected tab's content region.
- D-pad up from the content returns to the tab bar.
- Back button returns to `/week`. Week screen restores its captured scroll position.
- Week screen captures `weekScrollY = window.scrollY` in its own module-scoped variable on route-away and restores on route-return. That variable lives in `week.ts` (c6's lane) — coordinate via a code comment if you touch week.ts, otherwise leave the capture+restore to c6.

### G. Week-grid tap handler (minimal — only if c6 hasn't landed yet)

If at the time you open this lane `week.ts` does not yet wire slot-tap → `ctx.navigate('slot-edit/' + slot.id)`, add the single-line handler in week.ts. Otherwise do not touch week.ts — c6 owns it.

(This is the only exception to the "no cross-lane edits" rule in this brief. If you make it, document exactly which line you added in the evidence-log note.)

---

## Hard rules (frozen zones)

- **Do NOT** touch `shared/*` except appending one line to `shared/V1.5-TECH-DEBT.md` per §D.
- **Do NOT** touch `app/src/lib/scheduler.ts`, `app/src/lib/deep-link.ts`, `app/src/state/store.ts`.
- **Do NOT** touch `app/src/lib/library-api.ts` or `app/src/lib/library-cache.ts` — c1's zone.
- **Do NOT** touch `app/src/components/*` — c2's zone. Consume via props + events; bind `<mc-library-card>` with `.libraryTitle=` (NOT `.title=`, see c2 note).
- **Do NOT** touch `app/src/router.ts` beyond replacing the c3 stub registration with a call to `renderSlotEdit(ctx, slotId)` — that IS allowed because it's the single route-body wiring this commit owns.
- **Do NOT** touch `app/src/screens/shows.ts` — c4's zone. Intent coordination goes through `picker-return.ts` only.
- **Do NOT** touch `app/src/screens/channel.ts` — c6's zone.
- **Do NOT** render the slot-edit UI inside `<mc-modal>`. Full-screen route, per amendment (4).
- Style: 2-space indent, single quotes, type-only imports, no default exports.

---

## Verification gate (run before commit)

```
cd C:\dev\mychannel-universal\app
npx tsc --noEmit
npx vitest run      # if tests exist for scheduler or channel-adapter
```

Both must exit 0 / pass. Then commit:

```
git add app/src/screens/slot-edit.ts app/src/lib/channel-adapter.ts app/src/lib/picker-return.ts app/src/router.ts shared/V1.5-TECH-DEBT.md
# plus app/src/screens/week.ts ONLY if you added the minimal tap handler per §G
git commit -m "feat(week): full-screen slot-edit route + channel-adapter + picker return intent"
git push origin v2-rebuild
```

---

## When done

Append to `orchestration/evidence-log.md`:

```
### c5 — slot-edit full-screen route shipped

- commit: <SHA>
- files: app/src/screens/slot-edit.ts (new), app/src/lib/channel-adapter.ts (new), app/src/lib/picker-return.ts (new), app/src/router.ts (stub → renderSlotEdit), shared/V1.5-TECH-DEBT.md (+1 line)
- week.ts touch: [yes + exact line / no]
- tsc: clean
- tests: <vitest result or "n/a">
- notes: [focus quirks, empty-slot edge cases, channel-adapter numeric issues, etc.]
```

Then stop. Do not start c4 or c6.
