import { html } from 'lit-html';
import type { RouteContext } from '../router';

export function renderRegion(ctx: RouteContext) {
  const pick = async (r: 'ZA' | 'US') => {
    await ctx.patch({ region: r });
    ctx.navigate('wizard/streamers');
  };
  return html`
    <div class="screen">
      <h2>Where are you?</h2>
      <div class="grid-2" style="margin-top:16px;">
        <button class="card-select" @click=${() => pick('ZA')}>🇿🇦 South Africa</button>
        <button class="card-select" @click=${() => pick('US')}>🇺🇸 United States</button>
      </div>
      <p class="muted" style="margin-top:16px;">More countries coming.</p>
    </div>
  `;
}
