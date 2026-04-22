import { html, render } from 'lit-html';

export class McStreamerTile extends HTMLElement {
  static observedAttributes = ['name', 'logo', 'selected'];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const name = this.getAttribute('name') ?? '';
    const logo = this.getAttribute('logo') ?? '';
    const selected = this.hasAttribute('selected');
    render(
      html`
        <button type="button" class="mc-streamer ${selected ? 'mc-streamer--selected' : ''}" aria-pressed="${selected}">
          <div class="mc-streamer__logo">${logo ? html`<img src="${logo}" alt="" />` : html`<span class="mc-streamer__mono">${name.slice(0, 1)}</span>`}</div>
          <div class="mc-streamer__name">${name}</div>
        </button>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-streamer-tile')) {
  customElements.define('mc-streamer-tile', McStreamerTile);
}
