# Universal My-Channel

Universal My-Channel. Cross-streamer personal TV channel app. TV + phone,
multi-region from v1. Separate product from the v5 Netflix demo
(`mychannel-v5.html`, preserved live at `mychannel-app.vercel.app/mychannel-v5.html`).
Do not cross-contaminate.

## Three workstreams

Work is split across three tools on three branches. Each workstream owns its
directory exclusively — no cross-writing. All three consume `/shared/` as the
contract surface.

| Stream | Tool | Branch | Directory | Deliverable |
|---|---|---|---|---|
| A — Backend | Codex | `backend` | `/api/` | Vercel proxy (TMDB, ElevenLabs, Al, transcribe, health) |
| B — App | Cursor | `app` | `/app/` | Capacitor app (Android + iOS), Editorial Cinema UI |
| C — Data | Claude Code | `data` | `/data/` | Catalogue JSON + TMDB enrichment pipeline |
| Ω — Orchestration | Cowork (this session) | `main` | `/orchestration/` | Daily integration, verification, morning reports |

## Branch model

- `main` — integration target. Only the orchestration session writes here
  directly (scaffold, README, INTERFACES, morning reports). Feature branches
  merge in after Al approves.
- `backend`, `app`, `data` — long-lived feature branches. Each workstream
  commits and pushes to its own branch. Workstreams do not touch each other's
  branches.

Merges to `main` happen once per day after the orchestration session's morning
report flags a branch as a merge candidate. **Al approves every merge manually.
Orchestration does not auto-merge.**

## Shared contracts

All three workstreams consume `/shared/`:

- `/shared/INTERFACES.md` — response shapes, endpoints, error codes, events.
  Authoritative: when INTERFACES contradicts a workstream prompt, INTERFACES wins.
- `/shared/types.ts` — canonical TypeScript types, extracted from INTERFACES §2.
- `/shared/constants.ts` — `API_BASE`, `CATALOGUE_VERSION`, `SCHEMA_VERSION`,
  `SUPPORTED_REGIONS`.

## Running each locally

### Backend (Workstream A)
```bash
cd api/
npm install
vercel dev    # serves on http://localhost:3000
```

### App (Workstream B)
```bash
cd app/
npm install
npm run dev        # web preview
npx cap run android   # Android emulator
npx cap run ios       # iOS simulator (macOS only)
```

### Data (Workstream C)
```bash
cd data/
npm install
npm run build     # regenerates catalogue.json from TMDB
```

*Note: the detailed `run` commands above assume the layout described in
INTERFACES.md. Cross-check `/shared/INTERFACES.md` for authoritative per-
workstream run instructions.*

## Morning reports

The Cowork orchestration session writes a daily morning report to
`/orchestration/reports/{YYYY-MM-DD}-morning.md`. Template at
`/orchestration/morning-report-template.md`. Raw verification output lives
in `/orchestration/evidence-log.md`.

## Prior work preserved

The 2026-04-17 foundation work (salvaged `www/lib/` modules, 57-test vitest
suite, `UNIVERSAL-DESIGN.md`, `MORNING-REPORT.md`) is preserved in-tree and in
git history (commits `2c95e87` → `76921fb`). Workstreams may inherit these
modules as starting points — see `UNIVERSAL-DESIGN.md` and
`www/lib/` for the salvaged pieces.

## Environment variables

| Name | Purpose | Lives where |
|---|---|---|
| `TMDB_API_KEY` | TMDB catalogue + watch providers | Vercel (A) + build script (C) |
| `ELEVENLABS_API_KEY` | TTS proxy | Vercel (A) only |
| `ANTHROPIC_API_KEY` | Al concierge (v2) | Vercel (A) only |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Rate limiting | Vercel (A) only |

Never hardcoded. All routed through the Vercel proxy in Workstream A.

## Governing guardrails

This project runs under the three guardrails in
`C:\Users\27741\Son-Memory\directives\DIRECTIVE.md`:

1. No unverified factual claims (tool-backed or "I haven't checked").
2. Autonomous-session verification checklists — claims + per-item evidence.
3. Scope decisions require Al-quote-back.

The orchestration session enforces these on itself and flags violations in
workstream reports.
