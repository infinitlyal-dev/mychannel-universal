import type { ScheduleEntry, Show } from '../types';
import { bandWindow, type TimeBand } from './slots';

export type SlotPick = { dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand };

function parseMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = Math.floor(total % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function clampEndToWindow(start: string, windowEnd: string, runtimeMinutes: number): string {
  const startM = parseMinutes(start);
  const endCap = parseMinutes(windowEnd);
  const naturalEnd = startM + runtimeMinutes;
  return formatMinutes(Math.min(naturalEnd, endCap));
}

/** Round-robin assign shows to picked slots; trims runtime to window. */
export function buildSchedule(shows: Show[], slots: SlotPick[]): ScheduleEntry[] {
  if (!shows.length || !slots.length) return [];
  const orderedSlots = [...slots].sort((a, b) => {
    if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.band.localeCompare(b.band);
  });
  return orderedSlots.map((slot, idx) => {
    const show = shows[idx % shows.length]!;
    const { startTime, endTime } = bandWindow(slot.band);
    const computedEnd = clampEndToWindow(startTime, endTime, show.runtimeMinutes);
    return {
      showId: show.id,
      dayOfWeek: slot.dayOfWeek,
      startTime,
      endTime: computedEnd,
      enabled: true,
    };
  });
}

export function scheduleStats(schedule: ScheduleEntry[], shows: Show[]): { slots: number; uniqueShows: number; weeklyMinutes: number } {
  const ids = new Set(schedule.map((s) => s.showId));
  let weeklyMinutes = 0;
  for (const e of schedule) {
    const show = shows.find((x) => x.id === e.showId);
    const rt = show?.runtimeMinutes ?? 0;
    weeklyMinutes += Math.max(0, parseMinutes(e.endTime) - parseMinutes(e.startTime)) || rt;
  }
  return { slots: schedule.length, uniqueShows: ids.size, weeklyMinutes };
}
