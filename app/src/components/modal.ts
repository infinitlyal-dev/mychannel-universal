import { html, render } from 'lit-html';

export class McModal extends HTMLElement {
  static observedAttributes = ['open', 'title'];

  connectedCallback(): void {
    this.render();
    this.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-close]')) {
        this.removeAttribute('open');
        this.dispatchEvent(new CustomEvent('mc-close', { bubbles: true, composed: true }));
      }
    });
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const open = this.hasAttribute('open');
    const title = this.getAttribute('title') ?? '';
    render(
      html`
        <div class="mc-modal ${open ? 'mc-modal--open' : ''}" aria-hidden="${!open}">
          <div class="mc-modal__backdrop" data-close></div>
          <div class="mc-modal__panel" role="dialog" aria-modal="true" aria-label="${title}">
            <div class="mc-modal__head">
              <div class="mc-modal__title">${title}</div>
              <button type="button" class="mc-modal__x" data-close aria-label="Close">×</button>
            </div>
            <div class="mc-modal__body"><slot></slot></div>
          </div>
        </div>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-modal')) {
  customElements.define('mc-modal', McModal);
}
