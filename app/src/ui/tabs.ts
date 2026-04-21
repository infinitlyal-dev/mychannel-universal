import { html } from 'lit-html';
import type { RouteContext } from '../router';

export function renderTabs(active: 'now' | 'week' | 'shows', ctx: RouteContext) {
  return html`
    <nav class="bottom-tabs">
      <button type="button" aria-current=${active === 'now' ? 'true' : 'false'} @click=${() => ctx.navigate('now')}>Now</button>
      <button type="button" aria-current=${active === 'week' ? 'true' : 'false'} @click=${() => ctx.navigate('week')}>Week</button>
      <button type="button" aria-current=${active === 'shows' ? 'true' : 'false'} @click=${() => ctx.navigate('shows-picks')}>Shows</button>
    </nav>
  `;
}
