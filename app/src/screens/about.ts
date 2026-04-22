import { html } from 'lit-html';
import type { RouteContext } from '../router';

export function renderAbout(ctx: RouteContext) {
  return html`
    <div class="screen layout">
      <mc-top-bar title="About" show-back @mc-back=${() => ctx.navigate('settings')}></mc-top-bar>
      <div class="layout__body">
        <p>MyChannel v1 — personal lineup across your streamers.</p>
        <p class="muted">
          <a href="https://example.com/privacy" target="_blank" rel="noreferrer">Privacy policy</a>
        </p>
      </div>
    </div>
  `;
}
