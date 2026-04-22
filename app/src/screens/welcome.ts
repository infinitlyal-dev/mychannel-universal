import { html } from 'lit-html';
import type { RouteContext } from '../router';

export function renderWelcome(ctx: RouteContext) {
  return html`
    <div class="screen">
      <h1 style="margin-top:0;">Let's build your channel.</h1>
      <ul style="line-height:1.6;padding-left:18px;">
        <li>📺 Pick your streamers</li>
        <li>🎬 Pick shows you love</li>
        <li>⏰ Pick when you watch</li>
      </ul>
      <p class="muted">About 2 minutes.</p>
      <mc-button label="Let's Build It →" @click=${() => ctx.navigate('region')}></mc-button>
    </div>
  `;
}
