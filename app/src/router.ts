import { render, type TemplateResult } from 'lit-html';
import type { Show, Streamer, UserState } from './types';
import { renderSplash } from './screens/splash';
import { renderWelcome } from './screens/welcome';
import { renderRegion } from './screens/region';
import { renderStreamers } from './screens/streamers';
import { renderShows } from './screens/shows';
import { renderTimes } from './screens/times';
import { renderPreview } from './screens/preview';
import { renderNotify } from './screens/notify';
import { renderScheduling } from './screens/scheduling';
import { renderChannel } from './screens/channel';
import { renderWeek } from './screens/week';
import { renderShowsTab } from './screens/shows-tab';
import { renderSettings } from './screens/settings';
import { renderAbout } from './screens/about';
import type { SlotPick } from './lib/scheduler';

export type Session = {
  draftSlots: SlotPick[];
  previewEdits: Record<string, string>;
  notifyDenied: boolean;
};

export type RouteContext = {
  state: UserState;
  patch: (partial: Partial<UserState>) => Promise<void>;
  navigate: (hash: string) => void;
  redraw: () => void;
  catalogue: Show[];
  streamers: Streamer[];
  session: Session;
};

function normalizeHash(): string {
  const h = window.location.hash.replace(/^#\/?/, '');
  return h || 'splash';
}

export function navigate(hash: string): void {
  window.location.hash = `#/${hash}`;
}

export function mountRouter(ctx: RouteContext, outlet: HTMLElement): () => void {
  const draw = (): void => {
    const route = normalizeHash();
    let view: TemplateResult;
    switch (route) {
      case 'splash':
        view = renderSplash(ctx);
        break;
      case 'welcome':
        view = renderWelcome(ctx);
        break;
      case 'region':
        view = renderRegion(ctx);
        break;
      case 'wizard/streamers':
        view = renderStreamers(ctx);
        break;
      case 'wizard/shows':
      case 'shows-picker':
        view = renderShows(ctx, route === 'shows-picker');
        break;
      case 'wizard/times':
        view = renderTimes(ctx);
        break;
      case 'wizard/preview':
        view = renderPreview(ctx);
        break;
      case 'notify':
        view = renderNotify(ctx);
        break;
      case 'scheduling':
        view = renderScheduling(ctx);
        break;
      case 'now':
        view = renderChannel(ctx);
        break;
      case 'week':
        view = renderWeek(ctx);
        break;
      case 'shows-picks':
        view = renderShowsTab(ctx);
        break;
      case 'settings':
        view = renderSettings(ctx);
        break;
      case 'about':
        view = renderAbout(ctx);
        break;
      default:
        view = renderSplash(ctx);
    }
    render(view, outlet);
  };
  window.addEventListener('hashchange', draw);
  draw();
  return draw;
}
