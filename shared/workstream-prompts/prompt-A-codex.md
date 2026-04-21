# Workstream A — Backend & Proxy (Codex CLI)
You are Workstream A of a 3-workstream parallel build. Workstreams B (Cursor, app shell) and C (Claude Code, catalogue data) are running simultaneously on separate branches. Do NOT touch their directories. Your scope is /api/ only, on the `backend` branch.
## Read these first
1. /shared/INTERFACES.md — the contract you implement against. If this file contradicts what's below, INTERFACES.md wins.
2. /shared/types.ts — canonical TypeScript types. Your API responses conform exactly.
## Model
Use GPT-5.3-Codex (default). Verify via the model picker.
## Tasks
### A1 — Scaffold Vercel Edge project
- cd to /api/ on branch `backend`
- Create Vercel Edge-runtime TypeScript project: package.json, tsconfig.json, vercel.json
- Dependencies: @upstash/redis, zod
- Commit: "A1: scaffold Vercel Edge project"
### A2 — Middleware
- /api/_middleware.ts with CORS (allow capacitor://localhost, http://localhost, https://mychannel-api.vercel.app), X-Device-Id UUID v4 validation (400 if missing/bad), Upstash Redis sliding-window rate limiting per device
- Commit: "A2: middleware"
### A3 — GET /api/health
- Returns {status: 'ok', version: '1.0.0', timestamp: ISO}
- No rate limit
- Evidence: curl against deployed URL returns 200
- Commit: "A3: health"
### A4 — GET /api/tmdb/providers/:tmdbType/:tmdbId
- Proxies TMDB Watch Providers
- TMDB key from env TMDB_API_KEY
- ?region=ZA|US, default ZA, reject others 400
- Whitelist mapping: Netflix→netflix, Disney Plus→disney, Amazon Prime Video→prime, Max→max, Apple TV Plus→appletv, Hulu→hulu, Paramount Plus→paramount, Showmax→showmax, YouTube→youtube
- Response matches TmdbProvidersResponse in /shared/types.ts
- Rate limit 100/hr per device. Cache-Control: public, max-age=86400
- Evidence: vitest covering valid, missing deviceId, bad region, TMDB 404, TMDB 429
- Commit: "A4: TMDB providers proxy"
### A5 — POST /api/elevenlabs
- Accepts ElevenLabsTtsRequest
- Voice whitelist: UgBBYS2sOqTuMpoF3BR0 (Mark), 21m00Tcm4TlvDq8ikWAM (Rachel) only
- Model must be eleven_flash_v2_5
- Text ≤500 chars
- Returns audio/mpeg
- Rate limit 10/hr per device
- Note: v1 app does NOT call this at runtime — exists for Minnie's asset pipeline and v2 future-proofing
- Commit: "A5: ElevenLabs TTS"
### A6 — /api/al and /api/transcribe stubs
- Both return 501 with {error: "Not available in v1", version: "1.0.0"}
- Commit: "A6: v2 stubs"
### A7 — Deploy
- Vercel team: team_yiwk7JTdU3fdQVwcuOmsEVlT
- Project name: mychannel-api
- Env vars: TMDB_API_KEY, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY
- Verify: curl https://mychannel-api.vercel.app/api/health returns 200; curl with valid X-Device-Id against /api/tmdb/providers/tv/1396?region=US returns Breaking Bad providers
- Commit: "A7: deployed"
### A8 — Integration tests
- /api/tests/integration.test.ts — vitest against deployed URL covering every route
- Must pass before merge
- Commit: "A8: integration tests"
### A9 — Evidence report
- /api/WORKSTREAM-A-REPORT.md per Guardrail 2 of DIRECTIVE.md: claim + evidence + status per task
- Evidence must be grep, curl output, or vitest pass count — not "trust me"
- Include 5-line Runbook for "what to do if this breaks"
## Subagents
Spawn 3 project-scoped agents at /.codex/agents/:
- security-reviewer — checks for hardcoded secrets, unsafe env handling, missing CORS headers
- contract-reviewer — verifies response shapes match /shared/types.ts byte-for-byte
- test-runner — runs vitest, reports pass/fail
Run all three against every PR before committing.
## Commit cadence
One commit per task. Push to origin/backend after each. Do NOT merge to main — Cowork handles merges with my approval.
## Blockers
Write to /api/BLOCKERS.md and continue with other tasks. Do NOT silently work around missing info.
GO.
