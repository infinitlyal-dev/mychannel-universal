import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { renderTabs } from '../ui/tabs';

export function renderShowsTab(ctx: RouteContext) {
  const shows = ctx.catalogue.filter((s) => ctx.state.shows.includes(s.id));
  const remove = async (id: string) => {
    await ctx.patch({ shows: ctx.state.shows.filter((x) => x !== id) });
    ctx.navigate('shows-picks');
  };
  return html`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="Your shows" show-back @mc-back=${() => ctx.navigate('now')}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <mc-button label="Add shows" @click=${() => ctx.navigate('shows-picker')}></mc-button>
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
