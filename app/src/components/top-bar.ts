import { html, render } from 'lit-html';

export class McTopBar extends HTMLElement {
  static observedAttributes = ['title', 'show-back', 'show-settings'];

  connectedCallback(): void {
    this.render();
    this.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-action="back"]')) {
        this.dispatchEvent(new CustomEvent('mc-back', { bubbles: true, composed: true }));
      }
      if (t.closest('[data-action="settings"]')) {
        this.dispatchEvent(new CustomEvent('mc-settings', { bubbles: true, composed: true }));
      }
    });
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const title = this.getAttribute('title') ?? '';
    const showBack = this.hasAttribute('show-back');
    const showSettings = this.hasAttribute('show-settings');
    render(
      html`
        <header class="mc-topbar">
          <div class="mc-topbar__left">
            ${showBack
              ? html`<button type="button" class="mc-topbar__icon" data-action="back" aria-label="Back">←</button>`
              : html`<span class="mc-topbar__mark">MC</span>`}
          </div>
          <div class="mc-topbar__title">${title}</div>
          <div class="mc-topbar__right">
            ${showSettings
              ? html`<button type="button" class="mc-topbar__icon" data-action="settings" aria-label="Settings">⚙</button>`
              : ''}
          </div>
        </header>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-top-bar')) {
  customElements.define('mc-top-bar', McTopBar);
}
