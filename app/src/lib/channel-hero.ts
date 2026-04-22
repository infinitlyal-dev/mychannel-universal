import type { ScheduleEntry, Show } from '../types';

export type HeroState =
  | { kind: 'NOW'; entry: ScheduleEntry; show: Show }
  | { kind: 'UP_NEXT'; entry: ScheduleEntry; show: Show }
  | { kind: 'EMPTY' };

function parse(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function atSlotStart(entry: ScheduleEntry, base: Date): Date {
  const d = new Date(base);
  const add = (entry.dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + add);
  const [h, m] = entry.startTime.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  return d;
}

function atSlotEnd(entry: ScheduleEntry, base: Date): Date {
  const d = atSlotStart(entry, base);
  const [h, m] = entry.endTime.split(':').map(Number);
  d.setHours(h, m, 0, 0);
  if (d < atSlotStart(entry, base)) d.setDate(d.getDate() + 1);
  return d;
}

function nextOccurrenceStart(entry: ScheduleEntry, from: Date): Date {
  let d = atSlotStart(entry, from);
  if (d <= from) {
    d = new Date(d);
    d.setDate(d.getDate() + 7);
  }
  return d;
}

export function computeHero(schedule: ScheduleEntry[], shows: Show[], now = new Date()): HeroState {
  const enabled = schedule.filter((s) => s.enabled);
  for (const e of enabled) {
    const start = atSlotStart(e, now);
    const end = atSlotEnd(e, now);
    if (now >= start && now <= end) {
      const show = shows.find((x) => x.id === e.showId);
      if (show) return { kind: 'NOW', entry: e, show };
    }
  }
  const upcoming = enabled
    .map((e) => ({ e, t: nextOccurrenceStart(e, now) }))
    .sort((a, b) => a.t.getTime() - b.t.getTime());
  const next = upcoming[0]?.e;
  if (next) {
    const show = shows.find((x) => x.id === next.showId);
    if (show) return { kind: 'UP_NEXT', entry: next, show };
  }
  return { kind: 'EMPTY' };
}

export function nextStrip(schedule: ScheduleEntry[], shows: Show[], count: number, now = new Date()): Array<{ entry: ScheduleEntry; show: Show }> {
  const enabled = schedule.filter((s) => s.enabled);
  const ordered = enabled
    .map((e) => ({ e, t: nextOccurrenceStart(e, now) }))
    .sort((a, b) => a.t.getTime() - b.t.getTime());
  const hero = computeHero(schedule, shows, now);
  const out: Array<{ entry: ScheduleEntry; show: Show }> = [];
  for (const x of ordered) {
    const show = shows.find((s) => s.id === x.e.showId);
    if (!show) continue;
    const skipHero =
      hero.kind !== 'EMPTY' &&
      hero.entry.dayOfWeek === x.e.dayOfWeek &&
      hero.entry.startTime === x.e.startTime &&
      hero.entry.showId === x.e.showId;
    if (skipHero) continue;
    out.push({ entry: x.e, show });
    if (out.length >= count) break;
  }
  return out;
}

export function todayLineup(schedule: ScheduleEntry[], shows: Show[], now = new Date()): Array<{ entry: ScheduleEntry; show: Show }> {
  const dow = now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return schedule
    .filter((s) => s.enabled && s.dayOfWeek === dow)
    .sort((a, b) => parse(a.startTime) - parse(b.startTime))
    .map((entry) => {
      const show = shows.find((x) => x.id === entry.showId);
      return show ? { entry, show } : null;
    })
    .filter(Boolean) as Array<{ entry: ScheduleEntry; show: Show }>;
}
