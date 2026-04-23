import { html, render } from 'lit-html';

export class MCSkeletonTile extends HTMLElement {
  connectedCallback(): void {
    this.ensureHostStyles();
    render(
      html`
        <div class="mc-skeleton" aria-hidden="true">
          <div class="mc-skeleton__poster"></div>
          <div class="mc-skeleton__line mc-skeleton__line--title"></div>
          <div class="mc-skeleton__line mc-skeleton__line--year"></div>
        </div>
      `,
      this,
    );
  }

  private ensureHostStyles(): void {
    const style = this.style;
    if (!style.display) style.display = 'block';
    (style as CSSStyleDeclaration & { contentVisibility?: string }).contentVisibility = 'auto';
    (style as CSSStyleDeclaration & { containIntrinsicSize?: string }).containIntrinsicSize = '160px 240px';
    style.contain = 'layout paint style';
    this.setAttribute('role', 'presentation');
    this.setAttribute('aria-busy', 'true');
  }
}

if (!customElements.get('mc-skeleton-tile')) {
  customElements.define('mc-skeleton-tile', MCSkeletonTile);
}
