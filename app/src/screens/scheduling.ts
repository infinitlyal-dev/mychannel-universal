import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { scheduleEntriesToNotifications } from '../lib/notifications';

let activeCtx: RouteContext | null = null;

class McSchedulingRun extends HTMLElement {
  connectedCallback(): void {
    const ctx = activeCtx;
    if (!ctx) return;
    const shows = ctx.catalogue.filter((s) => ctx.state.shows.includes(s.id));
    const bar = this.querySelector('mc-progress-bar') as HTMLElement | null;
    const label = this.querySelector('[data-label]') as HTMLElement | null;
    const start = performance.now();
    const finalize = async () => {
      try {
        if (ctx.state.notificationsEnabled) {
          await scheduleEntriesToNotifications(ctx.state, shows, ctx.streamers);
        }
      } catch {
        /* web / permissions */
      }
      await ctx.patch({ onboarded: true });
      ctx.navigate('now');
    };
    const step = () => {
      const t = Math.min(1, (performance.now() - start) / 2500);
      bar?.setAttribute('value', String(t));
      if (label) label.textContent = `Scheduling ${ctx.state.shows.length} shows across your week…`;
      if (t < 1) requestAnimationFrame(step);
      else void finalize();
    };
    step();
  }
}

if (!customElements.get('mc-scheduling-run')) {
  customElements.define('mc-scheduling-run', McSchedulingRun);
}

export function renderScheduling(ctx: RouteContext) {
  activeCtx = ctx;
  return html`
    <div class="screen layout">
      <mc-scheduling-run>
        <div class="layout__body">
          <p data-label>Scheduling ${ctx.state.shows.length} shows across your week…</p>
          <mc-progress-bar value="0"></mc-progress-bar>
        </div>
      </mc-scheduling-run>
    </div>
  `;
}
