import { html, render } from 'lit-html';

export interface MCEmptyStateAction {
  label: string;
  event: string;
}

export class MCEmptyState extends HTMLElement {
  private _heading = '';
  private _message = '';
  private _action: MCEmptyStateAction | null = null;

  static get observedAttributes(): string[] {
    return ['heading', 'message'];
  }

  set heading(value: string) {
    this._heading = value ?? '';
    this.invalidate();
  }

  get heading(): string {
    return this._heading;
  }

  set message(value: string) {
    this._message = value ?? '';
    this.invalidate();
  }

  get message(): string {
    return this._message;
  }

  set action(value: MCEmptyStateAction | null) {
    this._action = value && value.label && value.event ? value : null;
    this.invalidate();
  }

  get action(): MCEmptyStateAction | null {
    return this._action;
  }

  connectedCallback(): void {
    if (this._heading === '' && this.hasAttribute('heading')) {
      this._heading = this.getAttribute('heading') ?? '';
    }
    if (this._message === '' && this.hasAttribute('message')) {
      this._message = this.getAttribute('message') ?? '';
    }
    this.invalidate();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
    if (name === 'heading') this._heading = value ?? '';
    if (name === 'message') this._message = value ?? '';
    this.invalidate();
  }

  private onAction = (): void => {
    const action = this._action;
    if (!action) return;
    this.dispatchEvent(
      new CustomEvent('mc-empty-action', {
        bubbles: true,
        composed: true,
        detail: { event: action.event },
      }),
    );
  };

  private invalidate(): void {
    if (!this.isConnected) return;
    render(
      html`
        <div class="mc-empty" role="status">
          <h3 class="mc-empty__heading">${this._heading}</h3>
          ${this._message
            ? html`<p class="mc-empty__message">${this._message}</p>`
            : null}
          ${this._action
            ? html`<button
                type="button"
                class="mc-empty__action"
                @click=${this.onAction}
              >
                ${this._action.label}
              </button>`
            : null}
        </div>
      `,
      this,
    );
  }
}

if (!customElements.get('mc-empty-state')) {
  customElements.define('mc-empty-state', MCEmptyState);
}
