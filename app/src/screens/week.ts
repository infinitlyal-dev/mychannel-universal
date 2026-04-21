import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { BAND_LABEL, UI_DAY_ORDER, toggleSlot, type TimeBand } from '../lib/slots';
import type { SlotPick } from '../lib/scheduler';
import { buildSchedule } from '../lib/scheduler';
import type { ScheduleEntry } from '../types';
import { renderTabs } from '../ui/tabs';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function inferBand(start: string): TimeBand {
  const h = Number(start.split(':')[0]);
  if (h >= 22) return 'late';
  if (h >= 17) return 'evening';
  if (h >= 12) return 'afternoon';
  return 'early';
}

function scheduleToSlots(schedule: ScheduleEntry[]): SlotPick[] {
  const out: SlotPick[] = [];
  const seen = new Set<string>();
  for (const e of schedule) {
    const band = inferBand(e.startTime);
    const k = `${e.dayOfWeek}|${band}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push({ dayOfWeek: e.dayOfWeek, band });
  }
  return out;
}

export function renderWeek(ctx: RouteContext) {
  const bands: TimeBand[] = ['early', 'afternoon', 'evening', 'late'];
  const slots = scheduleToSlots(ctx.state.schedule);
  const has = (d: 0 | 1 | 2 | 3 | 4 | 5 | 6, b: TimeBand) => slots.some((s) => s.dayOfWeek === d && s.band === b);
  const click = async (d: 0 | 1 | 2 | 3 | 4 | 5 | 6, b: TimeBand) => {
    const nextSlots = toggleSlot(slots, d, b);
    const shows = ctx.catalogue.filter((s) => ctx.state.shows.includes(s.id));
    const schedule = buildSchedule(shows, nextSlots);
    await ctx.patch({ schedule });
    ctx.navigate('week');
  };
  return html`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="Week" show-back @mc-back=${() => ctx.navigate('now')}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <p class="muted">Tap a slot to toggle. We’ll reshuffle picks across enabled slots.</p>
        <div style="display:grid;grid-template-columns:64px repeat(7,minmax(0,1fr));gap:4px;align-items:center;">
          <div></div>
          ${UI_DAY_ORDER.map((d) => html`<div class="muted" style="text-align:center;font-size:0.75rem;">${DAY_SHORT[d]}</div>`)}
          ${bands.map(
            (b) => html`
              <div class="muted" style="font-size:0.75rem;">${BAND_LABEL[b]}</div>
              ${UI_DAY_ORDER.map(
                (d) => html`
                  <button
                    type="button"
                    class="card-select"
                    style="padding:8px 4px;font-size:0.7rem;"
                    aria-pressed=${has(d, b)}
                    @click=${() => click(d, b)}
                  >
                    ${has(d, b) ? '●' : '○'}
                  </button>
                `,
              )}
            `,
          )}
        </div>
      </div>
      ${renderTabs('week', ctx)}
    </div>
  `;
}
