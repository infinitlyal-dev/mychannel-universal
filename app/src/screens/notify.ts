import { html } from 'lit-html';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { RouteContext } from '../router';

export function renderNotify(ctx: RouteContext) {
  const showBanner = ctx.session.notifyDenied || ctx.state.notificationsEnabled === false;
  const allow = async () => {
    const res = await LocalNotifications.requestPermissions();
    const granted = res.display === 'granted';
    ctx.session.notifyDenied = !granted;
    await ctx.patch({ notificationsEnabled: granted });
    ctx.navigate('notify');
  };
  const skip = async () => {
    ctx.session.notifyDenied = false;
    await ctx.patch({ notificationsEnabled: false });
    ctx.navigate('scheduling');
  };
  const onward = () => {
    ctx.session.notifyDenied = false;
    ctx.navigate('scheduling');
  };
  return html`
    <div class="screen layout">
      <div class="layout__body" style="text-align:center;">
        <div style="font-size:3rem;">🔔</div>
        <h2>One last thing.</h2>
        <p class="muted">We’ll nudge you when a pick in your lineup starts so you can jump straight in.</p>
        ${showBanner ? html`<div class="banner">Notifications are off. You can enable them later in Settings.</div>` : ''}
      </div>
      <div style="display:grid;gap:8px;">
        <mc-button label="Allow" @click=${allow}></mc-button>
        ${showBanner ? html`<mc-button label="Continue" variant="ghost" @click=${onward}></mc-button>` : ''}
        <button type="button" class="muted" style="background:none;border:none;cursor:pointer;" @click=${skip}>Skip for now</button>
      </div>
    </div>
  `;
}
