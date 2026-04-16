import { describe, it, expect } from 'vitest';
import {
  scheduleForShow,
  cancelForEntry,
  computeFireTimes,
  T_MINUS_5_MS,
} from '../www/lib/scheduler.js';

function makeFakeNotifier() {
  return {
    scheduled: [],
    cancelled: [],
    async schedule({ notifications }) { this.scheduled.push(...notifications); },
    async cancel({ notifications })   { this.cancelled.push(...notifications.map(n => n.id)); },
  };
}

const FUTURE = () => new Date(Date.now() + 60 * 60 * 1000).toISOString();

describe('notification scheduler', () => {
  it('T_MINUS_5_MS is 5 minutes in milliseconds', () => {
    expect(T_MINUS_5_MS).toBe(5 * 60 * 1000);
  });

  it('computeFireTimes returns ready (T-5) and start (T-0) Date objects', () => {
    const entry = { id: 'e1', startTime: '2030-04-14T20:00:00.000Z' };
    const { ready, start } = computeFireTimes(entry);
    expect(start.toISOString()).toBe('2030-04-14T20:00:00.000Z');
    expect(ready.toISOString()).toBe('2030-04-14T19:55:00.000Z');
  });

  it('schedules exactly two notifications per show (ready + start)', async () => {
    const notifier = makeFakeNotifier();
    const entry = { id: 'e1', startTime: FUTURE() };
    const show = { id: 's1', title: 'Slow Horses', streamer: 'apple_tv_plus' };
    await scheduleForShow(notifier, entry, show);
    expect(notifier.scheduled).toHaveLength(2);
  });

  it('ready notification has "Up next" title', async () => {
    const notifier = makeFakeNotifier();
    await scheduleForShow(
      notifier,
      { id: 'e1', startTime: FUTURE() },
      { id: 's1', title: 'Slow Horses', streamer: 'apple_tv_plus' }
    );
    const ready = notifier.scheduled.find(n => n.extra?.kind === 'ready');
    expect(ready.title).toBe('Up next: Slow Horses');
    expect(ready.body).toMatch(/5 minutes/i);
    expect(ready.body).toContain('Apple TV+');
  });

  it('start notification says "starts now · [Streamer]"', async () => {
    const notifier = makeFakeNotifier();
    await scheduleForShow(
      notifier,
      { id: 'e1', startTime: FUTURE() },
      { id: 's1', title: 'Ted Lasso', streamer: 'apple_tv_plus' }
    );
    const start = notifier.scheduled.find(n => n.extra?.kind === 'start');
    expect(start.title).toBe('Ted Lasso starts now · Apple TV+');
  });

  it('attaches entryId and showId to extra for tap routing', async () => {
    const notifier = makeFakeNotifier();
    await scheduleForShow(
      notifier,
      { id: 'e99', startTime: FUTURE() },
      { id: 's42', title: 'X', streamer: 'netflix' }
    );
    for (const n of notifier.scheduled) {
      expect(n.extra.entryId).toBe('e99');
      expect(n.extra.showId).toBe('s42');
    }
  });

  it('uses deterministic numeric ids (two distinct)', async () => {
    const notifier = makeFakeNotifier();
    await scheduleForShow(
      notifier,
      { id: 'e1', startTime: FUTURE() },
      { id: 's1', title: 'X', streamer: 'netflix' }
    );
    const ids = notifier.scheduled.map(n => n.id);
    expect(ids.every(id => Number.isInteger(id))).toBe(true);
    expect(new Set(ids).size).toBe(2);
  });

  it('same entry produces same ids across runs', async () => {
    const n1 = makeFakeNotifier();
    const n2 = makeFakeNotifier();
    const entry = { id: 'stable-id', startTime: FUTURE() };
    const show = { id: 's1', title: 'X', streamer: 'netflix' };
    await scheduleForShow(n1, entry, show);
    await scheduleForShow(n2, entry, show);
    expect(n1.scheduled.map(n => n.id).sort())
      .toEqual(n2.scheduled.map(n => n.id).sort());
  });

  it('skips scheduling when start time is in the past', async () => {
    const notifier = makeFakeNotifier();
    const past = { id: 'e-past', startTime: '2020-01-01T00:00:00.000Z' };
    await scheduleForShow(notifier, past, { id: 's1', title: 'X', streamer: 'netflix' });
    expect(notifier.scheduled).toHaveLength(0);
  });

  it('cancelForEntry cancels both notifications by entry id', async () => {
    const notifier = makeFakeNotifier();
    await cancelForEntry(notifier, 'e1');
    expect(notifier.cancelled).toHaveLength(2);
  });

  it('cancelForEntry targets the same ids scheduleForShow uses', async () => {
    const notifier = makeFakeNotifier();
    const entry = { id: 'match-me', startTime: FUTURE() };
    const show = { id: 's1', title: 'X', streamer: 'netflix' };
    await scheduleForShow(notifier, entry, show);
    const scheduledIds = notifier.scheduled.map(n => n.id).sort();
    await cancelForEntry(notifier, 'match-me');
    expect([...notifier.cancelled].sort()).toEqual(scheduledIds);
  });

  it('formats all known streamer labels', async () => {
    const cases = [
      ['netflix', 'Netflix'],
      ['apple_tv_plus', 'Apple TV+'],
      ['max', 'Max'],
      ['disney_plus', 'Disney+'],
      ['prime_video', 'Prime Video'],
      ['hulu', 'Hulu'],
      ['paramount_plus', 'Paramount+'],
      ['youtube', 'YouTube'],
      ['spotify', 'Spotify'],
    ];
    for (const [streamer, label] of cases) {
      const notifier = makeFakeNotifier();
      await scheduleForShow(
        notifier,
        { id: `e-${streamer}`, startTime: FUTURE() },
        { id: 's1', title: 'Show', streamer }
      );
      const start = notifier.scheduled.find(n => n.extra?.kind === 'start');
      expect(start.title).toBe(`Show starts now · ${label}`);
    }
  });
});
