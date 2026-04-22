import { html } from 'lit-html';
import type { StreamerId } from '../types';
import type { RouteContext } from '../router';

export function renderStreamers(ctx: RouteContext) {
  const list = ctx.streamers.filter((s) => s.regions.includes(ctx.state.region));
  const selected = new Set(ctx.state.streamers);
  const toggle = async (id: StreamerId) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    await ctx.patch({ streamers: [...next] });
  };
  const count = ctx.state.streamers.length;
  return html`
    <div class="screen layout">
      <div class="layout__body">
        <h2>Wizard 1/4 — Streamers</h2>
        <p class="muted">${count} selected</p>
        <div class="grid-3" style="margin-top:12px;">
          ${list.map(
            (s) => html`
              <mc-streamer-tile
                name=${s.name}
                logo=${s.logo}
                ?selected=${selected.has(s.id)}
                @click=${() => toggle(s.id)}
              ></mc-streamer-tile>
            `,
          )}
        </div>
      </div>
      <mc-button
        label="Continue"
        ?disabled=${count < 1}
        @click=${() => ctx.navigate('wizard/shows')}
      ></mc-button>
    </div>
  `;
}
