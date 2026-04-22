import { html, render } from 'lit-html';

export class McProgressBar extends HTMLElement {
  static observedAttributes = ['value'];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const raw = Number(this.getAttribute('value') ?? '0');
    const value = Math.max(0, Math.min(1, Number.isFinite(raw) ? raw : 0));
    render(
      html`
        <div class="mc-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(value * 100)}">
          <div class="mc-progress__fill" style="width:${value * 100}%"></div>
        </div>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-progress-bar')) {
  customElements.define('mc-progress-bar', McProgressBar);
}
