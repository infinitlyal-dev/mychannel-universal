import { Preferences } from '@capacitor/preferences';

import type { ScheduleEntry, UserState } from '../types';

const KEY = 'mychannel_user_state_v2';

type LegacyState = {
  version?: number;
  onboarded?: boolean;
  region?: 'US' | 'ZA';
  subscription?: { tier: 'free' | 'paid'; expiresAt?: string };
  streamers?: string[];
  shows?: string[];
  schedule?: Array<{
    showId?: string;
    dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
    startTime: string;
    endTime: string;
    enabled: boolean;
  }>;
  lastOpenedAt?: string;
  notificationsEnabled?: boolean;
};

function scheduleId(dayOfWeek: number, startTime: string): string {
  return `slot-${dayOfWeek}-${startTime}`;
}

function normalizeSchedule(schedule: LegacyState['schedule']): ScheduleEntry[] {
  return (schedule ?? []).map((entry) => ({
    id: scheduleId(entry.dayOfWeek, entry.startTime),
    showId: entry.showId,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    enabled: entry.enabled,
  }));
}

export function defaultState(): UserState {
  return {
    version: 2,
    onboarded: false,
    region: 'US',
    subscription: { tier: 'free' },
    streamers: [],
    shows: [],
    selectedTitles: [],
    schedule: [],
    channel: [],
    lastOpenedAt: new Date().toISOString(),
    notificationsEnabled: true,
  };
}

export function migrateState(input: unknown): UserState {
  const base = defaultState();
  if (!input || typeof input !== 'object') {
    return base;
  }

  const legacy = input as LegacyState;
  if (legacy.version === 2) {
    return {
      ...base,
      ...(legacy as Partial<UserState>),
      schedule: normalizeSchedule(legacy.schedule),
      selectedTitles: Array.isArray((legacy as Partial<UserState>).selectedTitles)
        ? (legacy as Partial<UserState>).selectedTitles ?? []
        : [],
      channel: Array.isArray((legacy as Partial<UserState>).channel)
        ? (legacy as Partial<UserState>).channel ?? []
        : [],
      lastOpenedAt: legacy.lastOpenedAt ?? base.lastOpenedAt,
    };
  }

  return {
    ...base,
    onboarded: legacy.onboarded ?? base.onboarded,
    region: legacy.region ?? base.region,
    subscription: legacy.subscription ?? base.subscription,
    streamers: Array.isArray(legacy.streamers) ? (legacy.streamers as UserState['streamers']) : [],
    shows: Array.isArray(legacy.shows) ? legacy.shows : [],
    schedule: normalizeSchedule(legacy.schedule),
    lastOpenedAt: legacy.lastOpenedAt ?? base.lastOpenedAt,
    notificationsEnabled: legacy.notificationsEnabled ?? base.notificationsEnabled,
  };
}

function isNative(): boolean {
  try {
    return Boolean(
      (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor?.isNativePlatform?.(),
    );
  } catch {
    return false;
  }
}

export async function loadState(): Promise<UserState | null> {
  let raw: string | null = null;

  if (isNative()) {
    raw = (await Preferences.get({ key: KEY })).value;
  } else if (typeof localStorage !== 'undefined') {
    raw = localStorage.getItem(KEY);
  }

  if (!raw) {
    return null;
  }

  try {
    return migrateState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export async function saveState(state: UserState): Promise<void> {
  const payload = JSON.stringify({
    ...state,
    lastOpenedAt: new Date().toISOString(),
  });

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
