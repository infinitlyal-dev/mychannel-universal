import { html, render } from 'lit-html';

export class McPosterCard extends HTMLElement {
  static observedAttributes = ['title', 'image', 'selected', 'square'];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const title = this.getAttribute('title') ?? '';
    const image = this.getAttribute('image') ?? '';
    const selected = this.hasAttribute('selected');
    const square = this.hasAttribute('square');
    const ratioClass = square ? 'mc-poster mc-poster--square' : 'mc-poster';
    render(
      html`
        <button type="button" class="${ratioClass} ${selected ? 'mc-poster--selected' : ''}" aria-pressed="${selected}">
          <img src="${image}" alt="" loading="lazy" />
          <span class="mc-poster__cap">${title}</span>
        </button>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-poster-card')) {
  customElements.define('mc-poster-card', McPosterCard);
}
