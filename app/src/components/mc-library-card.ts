import { html, render } from 'lit-html';
import type { LibraryTitle, StreamerManifest } from '../types';
import './mc-provider-badges';

const MAX_BADGES = 4;

export class MCLibraryCard extends HTMLElement {
  private _title: LibraryTitle | null = null;
  private _providers: StreamerManifest[] = [];
  private _selected = false;
  private _disabled = false;

  static get observedAttributes(): string[] {
    return ['selected', 'disabled'];
  }

  set libraryTitle(value: LibraryTitle | null) {
    this._title = value;
    this.invalidate();
  }

  get libraryTitle(): LibraryTitle | null {
    return this._title;
  }

  set providers(value: StreamerManifest[]) {
    this._providers = Array.isArray(value) ? value : [];
    this.invalidate();
  }

  get providers(): StreamerManifest[] {
    return this._providers;
  }

  set selected(value: boolean) {
    this._selected = Boolean(value);
    this.toggleAttribute('selected', this._selected);
    this.invalidate();
  }

  get selected(): boolean {
    return this._selected;
  }

  set disabled(value: boolean) {
    this._disabled = Boolean(value);
    this.toggleAttribute('disabled', this._disabled);
    this.invalidate();
  }

  get disabled(): boolean {
    return this._disabled;
  }

  connectedCallback(): void {
    this.ensureHostStyles();
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'selected') this._selected = value !== null;
    if (name === 'disabled') this._disabled = value !== null;
    this.invalidate();
  }

  private ensureHostStyles(): void {
    const style = this.style;
    if (!style.display) style.display = 'block';
    (style as CSSStyleDeclaration & { contentVisibility?: string }).contentVisibility = 'auto';
    (style as CSSStyleDeclaration & { containIntrinsicSize?: string }).containIntrinsicSize = '160px 240px';
    style.contain = 'layout paint style';
  }

  private invalidate(): void {
    if (!this.isConnected) return;
    this.renderNow();
  }

  private onClick = (event: MouseEvent): void => {
    if (this._disabled || !this._title) return;
    event.preventDefault();
    this.dispatchEvent(
      new CustomEvent('mc-card-click', {
        bubbles: true,
        composed: true,
        detail: { tmdbType: this._title.tmdbType, tmdbId: this._title.tmdbId },
      }),
    );
  };

  private renderNow(): void {
    const title = this._title;
    if (!title) {
      render(html``, this);
      return;
    }

    const badges = this._providers.slice(0, MAX_BADGES);
    const poster = title.posterUrl ?? '';
    const year = title.year ?? '';

    render(
      html`
        <button
          type="button"
          class="mc-card ${this._selected ? 'mc-card--selected' : ''} ${this._disabled
            ? 'mc-card--disabled'
            : ''}"
          aria-pressed=${this._selected ? 'true' : 'false'}
          ?disabled=${this._disabled}
          @click=${this.onClick}
        >
          <div class="mc-card__poster">
            ${poster
              ? html`<img
                  src=${poster}
                  alt=${title.title}
                  loading="lazy"
                  decoding="async"
                  referrerpolicy="no-referrer"
                />`
              : html`<div class="mc-card__poster-fallback" aria-hidden="true"></div>`}
            ${badges.length
              ? html`<mc-provider-badges
                  class="mc-card__badges"
                  .providers=${badges}
                ></mc-provider-badges>`
              : null}
            ${this._selected
              ? html`<span class="mc-card__check" aria-hidden="true">✓</span>`
              : null}
          </div>
          <div class="mc-card__meta">
            <span class="mc-card__title" title=${title.title}>${title.title}</span>
            ${year ? html`<span class="mc-card__year">${year}</span>` : null}
          </div>
        </button>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-library-card')) {
  customElements.define('mc-library-card', MCLibraryCard);
}
