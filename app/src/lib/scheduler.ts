import type {
  PersistedTitle,
  ScheduleEntry,
  ScheduledProgram,
  Show,
  StreamerId,
} from '../types';
import { buildStreamerSearchUrls } from './deep-link';
import { bandWindow, type TimeBand } from './slots';

export type SlotPick = { dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand };

function parseMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function pickProvider(providerIds: StreamerId[] | undefined, selectedProviders: StreamerId[]): StreamerId | null {
  const available = providerIds ?? [];
  return selectedProviders.find((providerId) => available.includes(providerId)) ?? available[0] ?? null;
}

export function hydrateChannel(
  slots: ScheduleEntry[],
  titles: PersistedTitle[],
  selectedProviders: StreamerId[],
): ScheduledProgram[] {
  if (!slots.length || !titles.length) {
    return [];
  }

  return slots
    .filter((slot) => slot.enabled)
    .sort((left, right) => {
      if (left.dayOfWeek !== right.dayOfWeek) {
        return left.dayOfWeek - right.dayOfWeek;
      }
      return left.startTime.localeCompare(right.startTime);
    })
    .map((slot, index) => {
      const title = titles[index % titles.length]!;
      const providerId = pickProvider(title.providerIds, selectedProviders);

      return {
        ...slot,
        id: slot.id ?? `slot-${slot.dayOfWeek}-${slot.startTime}`,
        showId: title.id,
        titleId: title.id,
        providerId,
        searchUrls: providerId ? buildStreamerSearchUrls(title, providerId) : {},
        title: title.title,
        year: title.year,
        tmdbId: title.tmdbId,
        tmdbType: title.tmdbType,
        posterUrl: title.posterUrl ?? null,
        backdropUrl: title.backdropUrl ?? null,
      };
    });
}

function clampEndToWindow(startTime: string, windowEnd: string, runtimeMinutes: number): string {
  const start = parseMinutes(startTime);
  const endCap = parseMinutes(windowEnd);
  const naturalEnd = start + runtimeMinutes;
  const clamped = Math.min(naturalEnd, endCap);
  const hours = Math.floor(clamped / 60) % 24;
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function buildSchedule(shows: Show[], slots: SlotPick[]): ScheduleEntry[] {
  if (!shows.length || !slots.length) {
    return [];
  }

  return slots
    .slice()
    .sort((left, right) => {
      if (left.dayOfWeek !== right.dayOfWeek) {
        return left.dayOfWeek - right.dayOfWeek;
      }
      return left.band.localeCompare(right.band);
    })
    .map((slot, index) => {
      const show = shows[index % shows.length]!;
      const { startTime, endTime } = bandWindow(slot.band);

      return {
        id: `slot-${slot.dayOfWeek}-${startTime}`,
        showId: show.id,
        titleId: show.id,
        providerId: show.providers?.US?.[0] ?? null,
        searchUrls: {},
        dayOfWeek: slot.dayOfWeek,
        startTime,
        endTime: clampEndToWindow(startTime, endTime, show.runtimeMinutes ?? 60),
        enabled: true,
      };
    });
}

export function scheduleStats(
  schedule: Array<ScheduleEntry | ScheduledProgram>,
  shows: Show[] = [],
): {
  slots: number;
  enabledSlots: number;
  titlesScheduled: number;
  uniqueShows: number;
  weeklyMinutes: number;
} {
  const ids = new Set(
    schedule
      .map((entry) => entry.titleId ?? entry.showId)
      .filter((value): value is string => Boolean(value)),
  );

  const weeklyMinutes = schedule.reduce((total, entry) => {
    const duration = parseMinutes(entry.endTime) - parseMinutes(entry.startTime);
    if (duration > 0) {
      return total + duration;
    }

    const legacyShowId = 'showId' in entry ? entry.showId : undefined;
    const fallback = shows.find((show) => show.id === legacyShowId)?.runtimeMinutes ?? 0;
    return total + fallback;
  }, 0);

  return {
    slots: schedule.length,
    enabledSlots: schedule.filter((entry) => entry.enabled).length,
    titlesScheduled: ids.size,
    uniqueShows: ids.size,
    weeklyMinutes,
  };
}
