import { html } from 'lit-html';
import type { RouteContext } from '../router';
import { computeHero, nextStrip, todayLineup } from '../lib/channel-hero';
import { launchShow } from '../lib/deep-link';
import type { StreamerId } from '../types';
import { renderTabs } from '../ui/tabs';

function pickStreamer(show: { providers: { ZA?: StreamerId[]; US?: StreamerId[] } }, region: 'ZA' | 'US', picks: StreamerId[]): StreamerId | undefined {
  const prov = show.providers[region] ?? [];
  for (const p of picks) {
    if (prov.includes(p)) return p;
  }
  return picks[0];
}

export function renderChannel(ctx: RouteContext) {
  const shows = ctx.catalogue.filter((s) => ctx.state.shows.includes(s.id));
  const hero = computeHero(ctx.state.schedule, shows);
  const strip = nextStrip(ctx.state.schedule, shows, 4);
  const lineup = todayLineup(ctx.state.schedule, shows);
  const tag = hero.kind === 'NOW' ? 'NOW' : hero.kind === 'UP_NEXT' ? 'UP NEXT' : 'Today';
  const streamer =
    hero.kind === 'EMPTY' ? undefined : pickStreamer(hero.show, ctx.state.region, ctx.state.streamers);
  const streamerName = streamer ? ctx.streamers.find((s) => s.id === streamer)?.name ?? streamer : '';
  const watch = async () => {
    if (hero.kind === 'EMPTY' || !streamer) return;
    await launchShow(hero.show, streamer);
  };
  return html`
    <div class="layout screen" style="padding:0;">
      <mc-top-bar title="MyChannel" show-settings @mc-settings=${() => ctx.navigate('settings')}></mc-top-bar>
      <div class="layout__body" style="padding:16px;">
        <div class="hero">
          ${hero.kind === 'EMPTY'
            ? html`<div class="hero__meta"><div class="muted">Nothing scheduled today yet.</div></div>`
            : html`
                <img class="hero__backdrop" src=${hero.show.backdropUrl} alt="" />
                <div class="hero__meta">
                  <div class="muted">${tag}</div>
                  <h2 style="margin:6px 0;">${hero.show.title}</h2>
                  <mc-button label=${streamer ? `Watch on ${streamerName} →` : 'Watch'} @click=${watch}></mc-button>
                </div>
              `}
        </div>
        <h3 style="margin:16px 0 8px;">Up Next</h3>
        <div class="strip">
          ${strip.map(
            ({ show }) => html`
              <mc-poster-card title=${show.title} image=${show.posterUrl}></mc-poster-card>
            `,
          )}
        </div>
        <h3 style="margin:16px 0 8px;">Today's Lineup</h3>
        <div class="lineup">
          ${lineup.length
            ? lineup.map(
                ({ entry, show }) => html`
                  <div class="lineup__row">
                    <div>${entry.startTime}</div>
                    <div>${show.title}</div>
                  </div>
                `,
              )
            : html`<div class="muted">No slots today.</div>`}
        </div>
      </div>
      ${renderTabs('now', ctx)}
    </div>
  `;
}
