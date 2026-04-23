import './components/button';
import './components/top-bar';
import './components/progress-bar';
import './components/poster-card';
import './components/streamer-tile';
import './components/modal';
import './components/index';
import { AppLauncher } from '@capacitor/app-launcher';
import { LocalNotifications } from '@capacitor/local-notifications';
import { fetchProviders } from './lib/library-api';
import { getCachedProviders, setCachedProviders } from './lib/library-cache';
import { mountRouter, navigate, type Session } from './router';
import { defaultState, loadState, saveState } from './state/store';
import type { Region, Streamer, UserState } from './types';
import type { SlotPick } from './lib/scheduler';
import { loadDraftSlotsJson } from './lib/web-session';

const outlet = () => document.getElementById('app')!;

async function loadRuntimeStreamers(region: Region): Promise<Streamer[]> {
  const cached = getCachedProviders(region);
  if (cached) return cached;
  const response = await fetchProviders(region);
  setCachedProviders(region, response.providers);
  return response.providers;
}

async function bootstrap(): Promise<void> {
  const stored = await loadState();
  const state: UserState = stored ?? defaultState();
  const streamers = await loadRuntimeStreamers(state.region).catch(() => []);
  let draftSlots: SlotPick[] = [];
  const rawDraft = loadDraftSlotsJson();
  if (rawDraft) {
    try {
      draftSlots = JSON.parse(rawDraft) as SlotPick[];
    } catch {
      draftSlots = [];
    }
  }
  const session: Session = { draftSlots, previewEdits: {}, notifyDenied: false };
  let invalidate: () => void = () => {};
  const patch = async (partial: Partial<UserState>) => {
    Object.assign(state, partial);
    await saveState(state);
    invalidate();
  };
  const ctx = {
    state,
    patch,
    navigate,
    redraw: () => invalidate(),
    catalogue: [],
    streamers,
    session,
  };
  void LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
    const extra = action.notification.extra as { deepLink?: string } | undefined;
    const url = extra?.deepLink;
    if (url) void AppLauncher.openUrl({ url });
  });
  invalidate = mountRouter(ctx, outlet());
  if (state.onboarded) {
    const r = window.location.hash.replace(/^#\/?/, '') || 'splash';
    const wizard = ['splash', 'welcome', 'region', 'wizard/streamers', 'wizard/shows', 'wizard/times', 'wizard/preview', 'notify', 'scheduling'].includes(r);
    if (wizard) navigate('now');
  } else {
    const r = window.location.hash.replace(/^#\/?/, '');
    if (r === 'now' || r === 'week' || r === 'shows-picks' || r === 'settings' || r === 'about') navigate('splash');
  }
}

void bootstrap();
