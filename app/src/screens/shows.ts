import { html } from 'lit-html';
import type { RouteContext } from '../router';
import type { StreamerId } from '../types';

let showQuery = '';

function showMatchesStreamers(show: { providers: { ZA?: StreamerId[]; US?: StreamerId[] } }, region: 'ZA' | 'US', picks: StreamerId[]): boolean {
  const prov = show.providers[region] ?? [];
  return picks.some((p) => prov.includes(p));
}

export function renderShows(ctx: RouteContext, fromTab: boolean) {
  const selected = new Set(ctx.state.shows);
  const filtered = ctx.catalogue
    .filter((s) => showMatchesStreamers(s, ctx.state.region, ctx.state.streamers))
    .filter((s) => s.title.toLowerCase().includes(showQuery.toLowerCase()));
  const toggle = async (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    await ctx.patch({ shows: [...next] });
  };
  const count = ctx.state.shows.length;
  const onInput = (e: Event) => {
    showQuery = (e.target as HTMLInputElement).value;
    ctx.redraw();
  };
  return html`
    <div class="screen layout">
      <div class="layout__body">
        <h2>${fromTab ? 'Add shows' : 'Wizard 2/4 — Shows'}</h2>
        <input class="search" placeholder="Search titles" .value=${showQuery} @input=${onInput} />
        <p class="muted">${count} selected (min 6)</p>
        <div class="grid-3">
          ${filtered.map(
            (s) => html`
              <mc-poster-card
                title=${s.title}
                image=${s.posterUrl}
                ?selected=${selected.has(s.id)}
                @click=${() => toggle(s.id)}
              ></mc-poster-card>
            `,
          )}
        </div>
      </div>
      <mc-button
        label=${fromTab ? 'Done' : 'Continue'}
        ?disabled=${count < 6}
        @click=${() => ctx.navigate(fromTab ? 'shows-picks' : 'wizard/times')}
      ></mc-button>
    </div>
  `;
}
