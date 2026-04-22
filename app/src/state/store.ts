import { Preferences } from '@capacitor/preferences';
import type { UserState } from '../types';

const KEY = 'mychannel_user_state_v1';

export function defaultState(): UserState {
  return {
    version: 1,
    onboarded: false,
    region: 'US',
    subscription: { tier: 'free' },
    streamers: [],
    shows: [],
    schedule: [],
    lastOpenedAt: new Date().toISOString(),
    notificationsEnabled: true,
  };
}

function isNative(): boolean {
  try {
    return Boolean((window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

export async function loadState(): Promise<UserState | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key: KEY });
    if (!value) return null;
    return JSON.parse(value) as UserState;
  }
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  return JSON.parse(raw) as UserState;
}

export async function saveState(state: UserState): Promise<void> {
  state.lastOpenedAt = new Date().toISOString();
  const payload = JSON.stringify(state);
  if (isNative()) {
    await Preferences.set({ key: KEY, value: payload });
    return;
  }
  localStorage.setItem(KEY, payload);
}

export async function clearState(): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key: KEY });
    return;
  }
  localStorage.removeItem(KEY);
}
