// Notification scheduler — pure logic with dependency-injected notifier.
// The notifier is any object with `schedule({ notifications })` and
// `cancel({ notifications })` methods. At runtime, Capacitor's
// LocalNotifications plugin is injected. At test time, a fake is.

export const T_MINUS_5_MS = 5 * 60 * 1000;

const STREAMER_LABELS = Object.freeze({
  netflix:        'Netflix',
  apple_tv_plus:  'Apple TV+',
  max:            'Max',
  disney_plus:    'Disney+',
  prime_video:    'Prime Video',
  hulu:           'Hulu',
  paramount_plus: 'Paramount+',
  youtube:        'YouTube',
  spotify:        'Spotify',
});

// FNV-1a 32-bit — deterministic, fast, collision-resistant enough for
// a handful of entry ids. Returns a positive integer.
function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Shift into positive 30-bit space so both id+1 stays safe.
  return (h >>> 2);
}

function idsForEntry(entryId) {
  const base = hash32(String(entryId));
  return { readyId: base, startId: base + 1 };
}

export function computeFireTimes(entry) {
  const start = new Date(entry.startTime);
  const ready = new Date(start.getTime() - T_MINUS_5_MS);
  return { start, ready };
}

export async function scheduleForShow(notifier, entry, show) {
  const { start, ready } = computeFireTimes(entry);
  if (start.getTime() <= Date.now()) return;

  const label = STREAMER_LABELS[show.streamer] ?? show.streamer;
  const { readyId, startId } = idsForEntry(entry.id);

  const notifications = [
    {
      id: readyId,
      title: `Up next: ${show.title}`,
      body: `Starting in 5 minutes · ${label}`,
      schedule: { at: ready },
      extra: { entryId: entry.id, showId: show.id, kind: 'ready' },
    },
    {
      id: startId,
      title: `${show.title} starts now · ${label}`,
      body: 'Tap to watch',
      schedule: { at: start },
      extra: { entryId: entry.id, showId: show.id, kind: 'start' },
    },
  ];

  await notifier.schedule({ notifications });
}

export async function cancelForEntry(notifier, entryId) {
  const { readyId, startId } = idsForEntry(entryId);
  await notifier.cancel({
    notifications: [{ id: readyId }, { id: startId }],
  });
}
