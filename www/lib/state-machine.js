// Schedule entry state machine.
// Pure logic — no Dexie, no Capacitor, no side effects.
// Transitions per product-spec.md §Data models §State machine transitions.

export const STATES = Object.freeze({
  SCHEDULED:   'scheduled',
  READY:       'ready',
  PLAYING:     'playing',
  COMPLETED:   'completed',
  IN_PROGRESS: 'in_progress',
  SKIPPED:     'skipped',
});

export const EVENTS = Object.freeze({
  TIME_REACHED_MINUS_5:           'TIME_REACHED_MINUS_5',
  USER_PRESSED_PLAY:              'USER_PRESSED_PLAY',
  USER_CONFIRMED_FINISHED:        'USER_CONFIRMED_FINISHED',
  USER_CONFIRMED_STILL_WATCHING:  'USER_CONFIRMED_STILL_WATCHING',
  USER_CONFIRMED_STOPPED_EARLY:   'USER_CONFIRMED_STOPPED_EARLY',
  USER_RESCHEDULED:               'USER_RESCHEDULED',
});

const TRANSITIONS = {
  scheduled:   { TIME_REACHED_MINUS_5: 'ready' },
  ready:       { USER_PRESSED_PLAY: 'playing' },
  playing: {
    USER_CONFIRMED_FINISHED:       'completed',
    USER_CONFIRMED_STILL_WATCHING: 'in_progress',
    USER_CONFIRMED_STOPPED_EARLY:  'skipped',
  },
  completed:   {},
  in_progress: {},
  skipped:     {},
};

const VALID_STATES = new Set(Object.values(STATES));
const VALID_EVENTS = new Set(Object.values(EVENTS));

export function transition(state, event) {
  if (!VALID_STATES.has(state)) throw new Error(`Unknown state: ${state}`);
  if (!VALID_EVENTS.has(event)) throw new Error(`Unknown event: ${event}`);
  if (event === EVENTS.USER_RESCHEDULED) return STATES.SCHEDULED;
  const next = TRANSITIONS[state][event];
  if (!next) throw new Error(`Invalid transition: ${state} -> ${event}`);
  return next;
}

export function isTerminal(state) {
  return state === STATES.COMPLETED || state === STATES.SKIPPED;
}
