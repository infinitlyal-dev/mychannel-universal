import { html } from 'lit-html';
import type { RouteContext } from '../router';

export function renderSplash(ctx: RouteContext) {
  return html`
    <div class="screen" @click=${() => ctx.navigate('welcome')}>
      <div class="wordmark">MC</div>
      <p style="line-height:1.5;margin-top:24px;">Your own TV channel.<br />Built from your streamers, your shows, your week.</p>
      <p class="muted" style="margin-top:32px;">tap to begin</p>
    </div>
  `;
}
