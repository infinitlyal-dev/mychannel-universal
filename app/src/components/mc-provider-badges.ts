import { html, render } from 'lit-html';
import type { StreamerManifest } from '../types';

const DEFAULT_MAX = 4;

export class MCProviderBadges extends HTMLElement {
  private _providers: StreamerManifest[] = [];
  private _max = DEFAULT_MAX;

  static get observedAttributes(): string[] {
    return ['max'];
  }

  set providers(value: StreamerManifest[]) {
    this._providers = Array.isArray(value) ? value : [];
    this.invalidate();
  }

  get providers(): StreamerManifest[] {
    return this._providers;
  }

  set max(value: number) {
    this._max = Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MAX;
    this.invalidate();
  }

  get max(): number {
    return this._max;
  }

  connectedCallback(): void {
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'max') {
      const parsed = value === null ? DEFAULT_MAX : Number(value);
      this._max = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MAX;
      this.invalidate();
    }
  }

  private invalidate(): void {
    if (!this.isConnected) return;
    const visible = this._providers.slice(0, this._max);
    const overflow = Math.max(0, this._providers.length - visible.length);

    render(
      html`
        <ul class="mc-badges" role="list">
          ${visible.map(
            (provider) => html`
              <li class="mc-badges__item" title=${provider.name}>
                ${provider.logo
                  ? html`<img
                      class="mc-badges__logo"
                      src=${provider.logo}
                      alt=${provider.shortName || provider.name}
                      loading="lazy"
                      decoding="async"
                      referrerpolicy="no-referrer"
                    />`
                  : html`<span class="mc-badges__abbr" aria-hidden="true"
                      >${(provider.shortName || provider.name).slice(0, 2)}</span
                    >`}
                <span class="mc-badges__sr">${provider.name}</span>
              </li>
            `,
          )}
          ${overflow > 0
            ? html`<li class="mc-badges__more" aria-label=${`${overflow} more`}>+${overflow}</li>`
            : null}
        </ul>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-provider-badges')) {
  customElements.define('mc-provider-badges', MCProviderBadges);
}
