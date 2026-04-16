// Deep-link URL builder for streamer handoff.
// Uses universal HTTPS URLs — they auto-launch the native streamer app
// on Android/iOS when installed, fall back to browser when not.
// Templates from product-spec.md §External API integration §Deep link templates.

const TEMPLATES = Object.freeze({
  netflix:        'https://www.netflix.com/title/{id}',
  apple_tv_plus:  'https://tv.apple.com/show/{id}',
  max:            'https://play.max.com/show/{id}',
  disney_plus:    'https://www.disneyplus.com/series/{id}',
  prime_video:    'https://www.amazon.com/gp/video/detail/{id}',
  hulu:           'https://www.hulu.com/series/{id}',
  paramount_plus: 'https://www.paramountplus.com/shows/{id}',
  youtube:        'https://www.youtube.com/watch?v={id}',
  spotify:        'https://open.spotify.com/show/{id}',
});

export const SUPPORTED_STREAMERS = Object.freeze(Object.keys(TEMPLATES));

export function buildDeepLink(streamer, id) {
  const template = TEMPLATES[streamer];
  if (!template) throw new Error(`Unsupported streamer: ${streamer}`);
  if (typeof id !== 'string' || id.length === 0) {
    throw new Error('id required (non-empty string)');
  }
  return template.replace('{id}', encodeURIComponent(id));
}
