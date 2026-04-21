import { html } from 'lit-html';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { RouteContext } from '../router';
import { clearDraftSlots } from '../lib/web-session';
import { clearState, defaultState, saveState } from '../state/store';

export function renderSettings(ctx: RouteContext) {
  const toggleNotifications = async () => {
    const enabled = ctx.state.notificationsEnabled !== false;
    const next = !enabled;
    if (next) await LocalNotifications.requestPermissions();
    await ctx.patch({ notificationsEnabled: next });
    ctx.navigate('settings');
  };
  const reset = async () => {
    await clearState();
    Object.assign(ctx.state, defaultState());
    ctx.session.draftSlots = [];
    clearDraftSlots();
    ctx.session.previewEdits = {};
    ctx.session.notifyDenied = false;
    await saveState(ctx.state);
    ctx.navigate('splash');
  };
  return html`
    <div class="screen layout">
      <mc-top-bar title="Settings" show-back @mc-back=${() => ctx.navigate('now')}></mc-top-bar>
      <div class="layout__body" style="display:grid;gap:12px;">
        <div class="lineup__row">
          <div>Region</div>
          <div>${ctx.state.region}</div>
        </div>
        <div class="lineup__row">
          <div>Notifications</div>
          <button type="button" class="card-select" @click=${toggleNotifications}>
            ${ctx.state.notificationsEnabled !== false ? 'On' : 'Off'}
          </button>
        </div>
        <mc-button variant="danger" label="Reset my channel" @click=${reset}></mc-button>
        <mc-button variant="ghost" label="About" @click=${() => ctx.navigate('about')}></mc-button>
      </div>
    </div>
  `;
}
