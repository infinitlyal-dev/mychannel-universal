import { html, render } from 'lit-html';

export type ButtonVariant = 'primary' | 'ghost' | 'danger';

export class McButton extends HTMLElement {
  static observedAttributes = ['variant', 'disabled', 'label'];

  get variant(): ButtonVariant {
    const v = this.getAttribute('variant');
    return v === 'ghost' || v === 'danger' ? v : 'primary';
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  attributeChangedCallback(): void {
    this.render();
  }

  connectedCallback(): void {
    this.render();
    this.addEventListener('click', (e) => {
      if (this.disabled) e.stopPropagation();
    });
  }

  private render(): void {
    const label = this.getAttribute('label') ?? this.textContent?.trim() ?? '';
    const cls =
      this.variant === 'ghost'
        ? 'mc-btn mc-btn--ghost'
        : this.variant === 'danger'
          ? 'mc-btn mc-btn--danger'
          : 'mc-btn mc-btn--primary';
    render(
      html`
        <button class="${cls}" ?disabled=${this.disabled} part="control">
          ${label}
        </button>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-button')) {
  customElements.define('mc-button', McButton);
}
