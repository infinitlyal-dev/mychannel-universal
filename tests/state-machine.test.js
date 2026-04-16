import { describe, it, expect } from 'vitest';
import { transition, isTerminal, STATES, EVENTS } from '../www/lib/state-machine.js';

describe('schedule state machine', () => {
  it('transitions scheduled -> ready on TIME_REACHED_MINUS_5', () => {
    expect(transition('scheduled', 'TIME_REACHED_MINUS_5')).toBe('ready');
  });

  it('transitions ready -> playing on USER_PRESSED_PLAY', () => {
    expect(transition('ready', 'USER_PRESSED_PLAY')).toBe('playing');
  });

  it('transitions playing -> completed on USER_CONFIRMED_FINISHED', () => {
    expect(transition('playing', 'USER_CONFIRMED_FINISHED')).toBe('completed');
  });

  it('transitions playing -> in_progress on USER_CONFIRMED_STILL_WATCHING', () => {
    expect(transition('playing', 'USER_CONFIRMED_STILL_WATCHING')).toBe('in_progress');
  });

  it('transitions playing -> skipped on USER_CONFIRMED_STOPPED_EARLY', () => {
    expect(transition('playing', 'USER_CONFIRMED_STOPPED_EARLY')).toBe('skipped');
  });

  it('reschedule from any state returns to scheduled', () => {
    for (const s of Object.values(STATES)) {
      expect(transition(s, 'USER_RESCHEDULED')).toBe('scheduled');
    }
  });

  it('throws on invalid transition from scheduled with USER_PRESSED_PLAY', () => {
    expect(() => transition('scheduled', 'USER_PRESSED_PLAY')).toThrow(/invalid/i);
  });

  it('throws on invalid transition from ready with TIME_REACHED_MINUS_5', () => {
    expect(() => transition('ready', 'TIME_REACHED_MINUS_5')).toThrow(/invalid/i);
  });

  it('rejects unknown states', () => {
    expect(() => transition('bogus', 'USER_PRESSED_PLAY')).toThrow(/unknown state/i);
  });

  it('rejects unknown events', () => {
    expect(() => transition('scheduled', 'BOGUS_EVENT')).toThrow(/unknown event/i);
  });

  it('isTerminal returns true for completed and skipped only', () => {
    expect(isTerminal('completed')).toBe(true);
    expect(isTerminal('skipped')).toBe(true);
    expect(isTerminal('scheduled')).toBe(false);
    expect(isTerminal('ready')).toBe(false);
    expect(isTerminal('playing')).toBe(false);
    expect(isTerminal('in_progress')).toBe(false);
  });

  it('STATES and EVENTS are frozen (immutable)', () => {
    expect(Object.isFrozen(STATES)).toBe(true);
    expect(Object.isFrozen(EVENTS)).toBe(true);
  });

  it('exposes all six spec states', () => {
    expect(Object.values(STATES).sort()).toEqual(
      ['completed', 'in_progress', 'playing', 'ready', 'scheduled', 'skipped']
    );
  });
});
