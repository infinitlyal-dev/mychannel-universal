import { LocalNotifications } from '@capacitor/local-notifications';
import type { ScheduleEntry, Show, Streamer, StreamerId, UserState } from '../types';
import { buildDeepLink, pickPlatform } from './deep-link';

function nextOccurrence(dayOfWeek: number, timeHHmm: string): Date {
  const now = new Date();
  const [hh, mm] = timeHHmm.split(':').map(Number);
  const target = new Date(now);
  const add = (dayOfWeek - now.getDay() + 7) % 7;
  target.setDate(now.getDate() + add);
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 7);
  return target;
}

function pickStreamerForShow(show: Show, state: UserState): StreamerId | undefined {
  const region = state.region;
  const providers = show.providers[region] ?? [];
  for (const s of state.streamers) {
    if (providers.includes(s)) return s;
  }
  return state.streamers[0];
}

export async function scheduleEntriesToNotifications(state: UserState, shows: Show[], streamers: Streamer[]): Promise<void> {
  const names = new Map(streamers.map((s) => [s.id, s.name] as const));
  const platform = pickPlatform();
  const pending = await LocalNotifications.getPending();
  if (pending.notifications.length) {
    await LocalNotifications.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
  }
  const notifications = state.schedule
    .filter((e) => e.enabled)
    .map((entry, idx) => {
      const show = shows.find((s) => s.id === entry.showId);
      if (!show) return null;
      const streamer = pickStreamerForShow(show, state);
      if (!streamer) return null;
      const when = nextOccurrence(entry.dayOfWeek, entry.startTime);
      const link = buildDeepLink(show, streamer, platform) ?? '';
      const streamerName = names.get(streamer) ?? streamer;
      return {
        id: 1000 + idx,
        title: show.title,
        body: `Starts now on ${streamerName} — Tap to watch.`,
        schedule: { at: when },
        extra: { showId: show.id, streamer, deepLink: link },
      };
    })
    .filter(Boolean) as Array<{
    id: number;
    title: string;
    body: string;
    schedule: { at: Date };
    extra: Record<string, string>;
  }>;

  if (notifications.length) {
    await LocalNotifications.schedule({ notifications });
  }
}
