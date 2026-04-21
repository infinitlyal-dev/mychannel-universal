import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { BAND_LABEL, UI_DAY_ORDER, presetEveryNight, presetWeekends, presetWeeknights, toggleSlot, type TimeBand } from '../lib/slots';
import type { SlotPick } from '../lib/scheduler';
import { loadDraftSlotsJson, saveDraftSlotsJson } from '../lib/web-session';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function readSlots(ctx: RouteContext): SlotPick[] {
  const raw = loadDraftSlotsJson();
  if (raw) {
    try {
      return JSON.parse(raw) as SlotPick[];
    } catch {
      /* fallthrough */
    }
  }
  return ctx.session.draftSlots;
}

function writeSlots(ctx: RouteContext, slots: SlotPick[]): void {
  ctx.session.draftSlots = slots;
  saveDraftSlotsJson(JSON.stringify(slots));
}

export function renderTimes(ctx: RouteContext) {
  const bands: TimeBand[] = ['early', 'afternoon', 'evening', 'late'];
  const slots: SlotPick[] = readSlots(ctx);
  const has = (d: 0 | 1 | 2 | 3 | 4 | 5 | 6, b: TimeBand) => slots.some((s) => s.dayOfWeek === d && s.band === b);
  const click = (d: 0 | 1 | 2 | 3 | 4 | 5 | 6, b: TimeBand) => {
    writeSlots(ctx, toggleSlot(slots, d, b));
    ctx.redraw();
  };
  const applyPreset = (next: SlotPick[]) => {
    writeSlots(ctx, next);
    ctx.redraw();
  };
  const count = slots.length;
  return html`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 3/4 — Times</h2>
        <p class="muted">${count} slots (min 3)</p>
        <div class="pill-row">
          <button type="button" @click=${() => applyPreset(presetWeeknights())}>Weeknights only</button>
          <button type="button" @click=${() => applyPreset(presetWeekends())}>Weekends</button>
          <button type="button" @click=${() => applyPreset(presetEveryNight())}>Every night</button>
          <button type="button" @click=${() => applyPreset([])}>Clear all</button>
        </div>
        <div style="display:grid;grid-template-columns:64px repeat(7,minmax(0,1fr));gap:4px;align-items:center;">
          <div></div>
          ${UI_DAY_ORDER.map((d) => html`<div class="muted" style="text-align:center;font-size:0.75rem;">${DAY_SHORT[d]}</div>`)}
          ${bands.map((b) => html`
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
          `)}
        </div>
      </div>
      <mc-button label="Continue" ?disabled=${count < 3} @click=${() => ctx.navigate('wizard/preview')}></mc-button>
    </div>
  `;
}
