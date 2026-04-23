import { html } from 'lit-html';
import type { RouteContext } from '../router';

class McSlotEditScreen extends HTMLElement {
  static observedAttributes = ['slot-id'];

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    this.render();
  }

  private render(): void {
    const slotId = this.getAttribute('slot-id') ?? '';
    this.innerHTML = `<h1>Slot edit: ${slotId}</h1>`;
  }
}

if (!customElements.get('mc-slot-edit-screen')) {
  customElements.define('mc-slot-edit-screen', McSlotEditScreen);
}

export function renderSlotEdit(ctx: RouteContext, slotId: string) {
  return html`
    <div class="screen layout">
      <mc-top-bar title="Edit slot" show-back @mc-back=${() => ctx.navigate('/channel')}></mc-top-bar>
      <div class="layout__body">
        <mc-slot-edit-screen slot-id=${slotId}></mc-slot-edit-screen>
        <mc-button label="Close" @click=${() => ctx.navigate('/channel')}></mc-button>
      </div>
    </div>
  `;
}
