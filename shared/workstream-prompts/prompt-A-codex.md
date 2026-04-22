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
- Dependencies: zod (Upstash is DEFERRED to v1.2 — do NOT install @upstash/redis in v1)
- Commit: "A1: scaffold Vercel Edge project"
### A2 — Middleware
- /api/_middleware.ts with CORS (allow capacitor://localhost, http://localhost, https://mychannel-api.vercel.app), X-Device-Id UUID v4 validation (400 if missing/bad)
- Rate limiting: SKIP Upstash in v1. Use an in-memory per-device counter (Map<deviceId, {count, resetAt}>) — acceptable rough backstop; edge instances are ephemeral so it won't be strict. Leave a `// TODO v1.2: swap for Upstash sliding-window` marker at the limiter call site.
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
- Rate limit 100/hr per device (in-memory per A2). Cache-Control: public, max-age=86400
- Evidence: vitest covering valid, missing deviceId, bad region, TMDB 404, TMDB 429
- Commit: "A4: TMDB providers proxy"
### A5 — POST /api/elevenlabs
- Accepts ElevenLabsTtsRequest
- Voice whitelist: UgBBYS2sOqTuMpoF3BR0 (Mark), 21m00Tcm4TlvDq8ikWAM (Rachel) only
- Model must be eleven_flash_v2_5
- Text ≤500 chars
- Returns audio/mpeg
- Rate limit 10/hr per device (in-memory per A2)
- Note: v1 app does NOT call this at runtime — exists for Minnie's asset pipeline and v2 future-proofing
- Commit: "A5: ElevenLabs TTS"
### A6 — /api/al and /api/transcribe stubs
- Both return 501 with {error: "Not available in v1", version: "1.0.0"}
- Commit: "A6: v2 stubs"
### A7 — Deploy
- Vercel team: team_yiwk7JTdU3fdQVwcuOmsEVlT
- Project name: mychannel-api
- Env vars needed on Vercel (Al will add these directly in the Vercel dashboard): TMDB_API_KEY, ELEVENLABS_API_KEY, ANTHROPIC_API_KEY
- NOTE: Upstash env vars are NOT needed in v1 (deferred to v1.2)
- **PAUSE BEFORE DEPLOYING.** When you reach this task: write a /api/BLOCKERS.md entry titled "A7: awaiting Vercel env vars" and ping Al via Dispatch. Do NOT run `vercel deploy` until Al confirms env vars are in place. Keep working on A8 (tests that can run locally against mock handlers) in the meantime.
- After Al confirms: run `vercel deploy --prod`
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
Write to /api/BLOCKERS.md and continue with other tasks. Do NOT silently work around missing info. For A7 specifically: pause and ping Al via Dispatch before deploying.
## Usage
Al is on Codex Plus (not Pro). If you hit credit limits, pause this workstream — do NOT attempt workarounds. Al will restart you when credits reset.
GO.
