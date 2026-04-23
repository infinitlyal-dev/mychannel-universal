# data/fixtures

QA fixtures for backend + UI unit tests. Not runtime assets.

- `provider-mapping.json` — TMDB watch-provider → streamer resolution cases, region-aware. Covers id matches, name aliases, legacy HBO Max, Showtime-in-Paramount+ bundle, null cases, region gating.
- `search-urls.json` — `(streamerId, platform, query) → url` cases for the search-URL builder. Covers every streamer in `streamers.json`, all three platforms, encoding edge cases.

Adding a new streamer or alias: add a case here first, then make it pass.
