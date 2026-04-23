import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { renderTabs } from '../ui/tabs';
import { resolveLiveTitles } from '../lib/live-title-details';

export function renderShowsTab(ctx: RouteContext) {
  const { titles: shows, loading } = resolveLiveTitles(ctx.state, ctx.redraw);
  const remove = async (id: string) => {
    await ctx.patch({
      shows: ctx.state.shows.filter((x) => x !== id),
      selectedTitles: ctx.state.selectedTitles.filter((title) => title.id !== id),
    });
    ctx.navigate('shows-picks');
  };
  return html`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="Your shows" show-back @mc-back=${() => ctx.navigate('now')}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <mc-button label="Add shows" @click=${() => ctx.navigate('shows-picker')}></mc-button>
        ${loading && !shows.length ? html`<p class="muted">Loading titles…</p>` : null}
        <div class="grid-3" style="margin-top:12px;">
          ${shows.map(
            (s) => html`
              <div>
                <mc-poster-card title=${s.title} image=${s.posterUrl}></mc-poster-card>
                <mc-button variant="danger" label="Remove" @click=${() => remove(s.id)}></mc-button>
              </div>
            `,
          )}
        </div>
      </div>
      ${renderTabs('shows', ctx)}
    </div>
  `;
}
