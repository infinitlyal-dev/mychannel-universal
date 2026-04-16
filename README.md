# Universal My-Channel

Universal My-Channel. Fresh project, separate from v5 Netflix demo at `mychannel-v5.html`. Do not cross-contaminate.

## What this is

A standalone cross-streamer personal TV channel app. TV + phone, multi-region (US, UK, CA, AU, ZA minimum), built from the Editorial Cinema visual register calibrated at `C:\Users\27741\OneDrive\Desktop\MCN\calibration-hero-v3.html`.

Shares DNA with v5 (Al voice pipeline, Rachel intro, SFX, TMDB integration, state schema) but built fresh — NOT an evolution of v5.

## What this is NOT

- **NOT** `mychannel-v5.html` — that is the Netflix demo, a separate product, live at `mychannel-app.vercel.app/mychannel-v5.html`. Preserved as-is.
- **NOT** `C:\dev\mychannel\` — the abandoned second-overnight build. Disk audit 2026-04-16 found its `www/index.html` is v5 with a color swap, `editorial-cinema.css` not linked, `proxy-client.js` not loaded. Not salvageable.

## Directory layout

```
www/
  screens/   — visual screens (empty tonight — built in daytime sessions with browser feedback)
  lib/       — shared DNA modules (state-machine, deep-link, scheduler, tmdb-watch-providers, al, rachel)
  css/       — editorial-cinema.css lives here
tests/       — vitest unit tests
docs/        — design docs
```

## Environment variables

| Name | Purpose |
|---|---|
| `TMDB_API_KEY` | TMDB Watch Providers + catalogue. Required for `www/lib/tmdb-watch-providers.js`. Never hardcoded. |

Proxy routes (ElevenLabs, Anthropic) live on Vercel with their own env vars — not used by this project directly.

## Foundation scope (tonight)

See `UNIVERSAL-DESIGN.md` for what's decided vs what's pending. Tonight scaffolded: fresh project, lifted salvaged modules, extended deep-link, TMDB wrapper, extracted Al and Rachel pipelines. No visual screens.
