import type { ScheduleEntry } from '../types';

export type TimeBand = 'early' | 'afternoon' | 'evening' | 'late';

/** UI column order Mon..Sun maps to JS getDay() with Monday=1 ... Sunday=0 */
export const UI_DAY_ORDER: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6, 0];

export const BAND_LABEL: Record<TimeBand, string> = {
  early: 'Early',
  afternoon: 'Afternoon',
  evening: 'Evening',
  late: 'Late',
};

export function bandWindow(band: TimeBand): { startTime: string; endTime: string } {
  switch (band) {
    case 'early':
      return { startTime: '06:00', endTime: '11:59' };
    case 'afternoon':
      return { startTime: '12:00', endTime: '16:59' };
    case 'evening':
      return { startTime: '17:00', endTime: '21:59' };
    case 'late':
      return { startTime: '22:00', endTime: '23:59' };
  }
}

export function toggleSlot(
  slots: Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand }>,
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6,
  band: TimeBand,
): typeof slots {
  const i = slots.findIndex((s) => s.dayOfWeek === day && s.band === band);
  if (i >= 0) return slots.filter((_, idx) => idx !== i);
  return [...slots, { dayOfWeek: day, band }];
}

export function presetWeeknights(): Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand }> {
  const days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5];
  return days.flatMap((d) => [{ dayOfWeek: d, band: 'evening' as const }]);
}

export function presetWeekends(): Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand }> {
  return [
    { dayOfWeek: 0, band: 'evening' },
    { dayOfWeek: 6, band: 'evening' },
  ];
}

export function presetEveryNight(): Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand }> {
  const days: Array<0 | 1 | 2 | 3 | 4 | 5 | 6> = [0, 1, 2, 3, 4, 5, 6];
  return days.map((d) => ({ dayOfWeek: d, band: 'evening' as const }));
}

export function slotsToScheduleEntries(
  slots: Array<{ dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6; band: TimeBand }>,
): Omit<ScheduleEntry, 'showId'>[] {
  return slots.map((s) => {
    const { startTime, endTime } = bandWindow(s.band);
    return {
      id: `slot-${s.dayOfWeek}-${startTime}`,
      dayOfWeek: s.dayOfWeek,
      startTime,
      endTime,
      enabled: true,
    };
  });
}
