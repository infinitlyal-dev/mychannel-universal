import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { buildSchedule, scheduleStats, type SlotPick } from '../lib/scheduler';
import type { ScheduleEntry } from '../types';
import { clearDraftSlots, loadDraftSlotsJson } from '../lib/web-session';

let swapTarget: ScheduleEntry | null = null;

function slotKey(e: ScheduleEntry): string {
  return `${e.dayOfWeek}|${e.startTime}`;
}

function readPicks(ctx: RouteContext): SlotPick[] {
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

export function renderPreview(ctx: RouteContext) {
  const picks = readPicks(ctx);
  const shows = ctx.catalogue.filter((s) => ctx.state.shows.includes(s.id));
  const base = buildSchedule(shows, picks);
  const schedule = base.map((e) => {
    const k = slotKey(e);
    const alt = ctx.session.previewEdits[k];
    return alt ? { ...e, showId: alt } : e;
  });
  const stats = scheduleStats(schedule, shows);
  const openSwap = (e: ScheduleEntry) => {
    swapTarget = e;
    ctx.redraw();
  };
  const applySwap = async (showId: string) => {
    if (!swapTarget) return;
    ctx.session.previewEdits[slotKey(swapTarget)] = showId;
    swapTarget = null;
    ctx.redraw();
  };
  const lock = async () => {
    ctx.session.previewEdits = {};
    clearDraftSlots();
    ctx.session.draftSlots = [];
    await ctx.patch({ schedule });
    ctx.navigate('notify');
  };
  const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return html`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 4/4 — Preview</h2>
        <p class="muted">Slots: ${stats.slots} · Shows used: ${stats.uniqueShows} · Weekly minutes ~ ${stats.weeklyMinutes}</p>
        <div style="display:grid;gap:6px;margin-top:12px;">
          ${schedule.map(
            (e) => html`
              <button type="button" class="card-select" @click=${() => openSwap(e)}>
                ${DAY_SHORT[e.dayOfWeek]} ${e.startTime}-${e.endTime} · ${shows.find((s) => s.id === e.showId)?.title ?? e.showId}
              </button>
            `,
          )}
        </div>
        <mc-modal ?open=${Boolean(swapTarget)} title="Swap show" @mc-close=${() => {
          swapTarget = null;
          ctx.redraw();
        }}>
          <div class="grid-3">
            ${shows.map(
              (s) => html`
                <mc-poster-card title=${s.title} image=${s.posterUrl} @click=${() => applySwap(s.id)}></mc-poster-card>
              `,
            )}
          </div>
        </mc-modal>
      </div>
      <div style="display:grid;gap:8px;">
        <mc-button variant="ghost" label="Not quite" @click=${() => ctx.navigate('wizard/times')}></mc-button>
        <mc-button label="Lock it in" @click=${lock}></mc-button>
      </div>
    </div>
  `;
}
