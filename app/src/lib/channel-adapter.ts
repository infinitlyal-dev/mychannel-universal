import { hydrateChannel } from './scheduler';
import type { PersistedTitle, ScheduleEntry, ScheduledProgram, StreamerId } from '../types';

export function rebuildChannel(
  schedule: ScheduleEntry[],
  selectedTitles: PersistedTitle[],
  selectedProviders: StreamerId[],
): ScheduledProgram[] {
  const enabled = schedule
    .filter((s) => s.enabled)
    .slice()
    .sort((l, r) =>
      l.dayOfWeek !== r.dayOfWeek
        ? l.dayOfWeek - r.dayOfWeek
        : l.startTime.localeCompare(r.startTime),
    );
  const titleById = new Map(selectedTitles.map((t) => [t.id, t]));
  const slotOrderedTitles: PersistedTitle[] = enabled
    .map((s) => s.titleId && titleById.get(s.titleId))
    .filter((t): t is PersistedTitle => Boolean(t));
  return hydrateChannel(schedule, slotOrderedTitles, selectedProviders);
}
