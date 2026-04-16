// Deep-link URL builder for streamer handoff.
// Uses universal HTTPS URLs — they auto-launch the native streamer app
// on Android/iOS when installed, fall back to browser when not.
//
// Every template below has a source-URL comment. Formats without official
// developer documentation are marked "observed, not officially documented"
// with the best community source I could verify. Universal deep links for
// streamers are rarely first-party-documented — the web URL pattern is
// effectively the contract because platform installers register the host.
//
// Interface is protected per BOUNDARY.md Rule 2 — do not change the
// signature of buildDeepLink or SUPPORTED_STREAMERS.

const TEMPLATES = Object.freeze({
  // Netflix — numeric title ID, 6–8 digits.
  // Source: https://en.wikipedia.org/wiki/Template:Netflix_title
  //   ("URL of the form www.netflix.com/title/<number>")
  netflix:        'https://www.netflix.com/title/{id}',

  // Apple TV+ — UMC (Universal Media Catalog) identifier, e.g. umc.cmc.xxxxx.
  // Source: https://developer.apple.com/documentation/xcode/supporting-universal-links-in-your-app
  //   and Apple UMC Catalog Data Interface which specifies tv.apple.com
  //   as the locator base for show and movie entries:
  //   https://tvpartners.apple.com/support/3678-catalog-and-availability-feeds-overview
  apple_tv_plus:  'https://tv.apple.com/show/{id}',

  // Max — id is the show slug (TODO: source unconfirmed — format observed on
  // live URLs, no public developer doc specifies the universal link template).
  // Community reference: https://en.wikipedia.org/wiki/Max_(streaming_service)
  //   confirms play.max.com as the primary web host post-HBO-Max rebrand.
  max:            'https://play.max.com/show/{id}',

  // Disney+ — id is the series slug or content GUID.
  // TODO: source unconfirmed — Disney+ does not publish a deep-link spec.
  // Format observed on live URLs. Third-party doc:
  //   https://docs.nagra.vision/opentv-docs/23.24_Q2/Default/disney-metadata-deep-link
  //   (OpenTV ingestion spec for Disney+ deep-link metadata).
  disney_plus:    'https://www.disneyplus.com/series/{id}',

  // Prime Video — id is the ASIN (10-char alphanumeric).
  // Source: https://videocentral.amazon.com/support/marketing/market-and-link-to-your-titles
  //   ("Detail page URL is https://www.amazon.com/gp/video/detail/<ASIN>")
  prime_video:    'https://www.amazon.com/gp/video/detail/{id}',

  // Hulu — id is the series slug.
  // Source: https://en.wikipedia.org/wiki/Template:Hulu_series
  //   ("URL of the form www.hulu.com/series/<slug>")
  hulu:           'https://www.hulu.com/series/{id}',

  // Paramount+ — id is the show slug.
  // Source: https://github.com/yt-dlp/yt-dlp/issues/3096
  //   (yt-dlp tracked the paramountplus.com/shows/<slug>/... URL format
  //    across the 2022 restructure; old /shows/<slug>/ still resolves).
  paramount_plus: 'https://www.paramountplus.com/shows/{id}',

  // YouTube — id is the 11-char video ID.
  // Source: https://developers.google.com/youtube/player_parameters
  //   and https://support.google.com/youtube/answer/6180214
  //   (canonical watch URL is youtube.com/watch?v=<11-char id>).
  youtube:        'https://www.youtube.com/watch?v={id}',

  // Spotify — id is the show's Spotify ID (base62, 22 chars).
  // Source: https://developer.spotify.com/documentation/web-api/concepts/spotify-uris-ids
  //   (open.spotify.com/show/<id> is the canonical open-in-app link form).
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
