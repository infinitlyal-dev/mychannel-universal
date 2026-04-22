# Workstream A Report

## A1 — Scaffold Vercel Edge project
- Status: `done`
- Claim: `/api` is a standalone TypeScript Vercel project with package metadata, TypeScript config, and Vercel config.
- Evidence:
```text
api/package.json:2:  "name": "mychannel-api",
api/package.json:5:  "type": "module",
api/package.json:14:    "@vercel/functions": "^2.2.13",
api/package.json:15:    "zod": "^4.1.12"
api/tsconfig.json:2:  "compilerOptions":
api/vercel.json:1:  "version": 2
```

## A2 — Middleware
- Status: `done`
- Claim: Shared middleware applies the CORS allowlist, enforces `X-Device-Id` UUID v4 validation, and applies an in-memory rate limiter with the required Upstash TODO marker.
- Evidence:
```text
api/_middleware.ts:5:  'capacitor://localhost',
api/_middleware.ts:6:  'http://localhost',
api/_middleware.ts:7:  'https://mychannel-api.vercel.app',
api/_middleware.ts:120:        { error: 'Missing or invalid X-Device-Id header' },
api/_middleware.ts:127:    // TODO v1.2: swap for Upstash sliding-window
```
```text
Test Files  5 passed (5)
     Tests  24 passed (24)
```

## A3 — Health
- Status: `done`
- Claim: `GET /api/health` returns the v1 health payload and bypasses device/rate-limit requirements.
- Evidence:
```text
api/health.ts:8:    requireDeviceId: false,
api/health.ts:31:      status: 'ok',
api/health.ts:32:      version: '1.0.0',
api/health.ts:33:      timestamp: new Date().toISOString(),
```
```text
HTTP/1.1 200 OK
{"status":"ok","version":"1.0.0","timestamp":"2026-04-22T12:30:53.469Z"}
```

## A4 — TMDB providers proxy
- Status: `done`
- Claim: `GET /api/tmdb/providers/:tmdbType/:tmdbId` validates `ZA|US`, maps TMDB watch providers onto the canonical streamer IDs, preserves typed TMDB failures, and sets a 24-hour cache header.
- Evidence:
```text
api/tmdb/providers/[tmdbType]/[tmdbId].ts:15:  'Amazon Prime Video': 'prime',
api/tmdb/providers/[tmdbType]/[tmdbId].ts:16:  'Apple TV Plus': 'appletv',
api/tmdb/providers/[tmdbType]/[tmdbId].ts:17:  'Apple TV+': 'appletv',
api/tmdb/providers/[tmdbType]/[tmdbId].ts:120:      'Invalid region. Use ZA or US.',
api/tmdb/providers/[tmdbType]/[tmdbId].ts:170:      `TMDB request failed with status ${tmdbResponse.status}`,
api/tmdb/providers/[tmdbType]/[tmdbId].ts:182:  headers.set('cache-control', 'public, max-age=86400');
```
```text
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400
{"success":true,"region":"US","providers":["netflix"]}
```

## A5 — ElevenLabs TTS
- Status: `done`
- Claim: `POST /api/elevenlabs` enforces the v1 request contract, restricts voices to Mark and Rachel, requires `eleven_flash_v2_5`, caps text at 500 chars, and returns `audio/mpeg`.
- Evidence:
```text
api/elevenlabs.ts:11:  text: z.string().max(500),
api/elevenlabs.ts:12:  voiceId: z.enum(['UgBBYS2sOqTuMpoF3BR0', '21m00Tcm4TlvDq8ikWAM']),
api/elevenlabs.ts:13:  modelId: z.literal('eleven_flash_v2_5'),
api/elevenlabs.ts:19:      limit: 10,
api/elevenlabs.ts:102:          accept: 'audio/mpeg',
api/elevenlabs.ts:125:  headers.set('content-type', 'audio/mpeg');
```
```text
✓ deployed integration > serves POST /api/elevenlabs with audio/mpeg output 3256ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

## A6 — v2 stubs
- Status: `done`
- Claim: `POST /api/al` and `POST /api/transcribe` are present as v1 stubs and return the locked `501` payload.
- Evidence:
```text
api/al.ts:29:      error: 'Method not allowed',
api/al.ts:38:  return notAvailableResponse(request, middleware.headers);
api/transcribe.ts:29:      error: 'Method not allowed',
api/transcribe.ts:38:  return notAvailableResponse(request, middleware.headers);
```
```text
✓ deployed integration > serves POST /api/al as a 501 stub 355ms
✓ deployed integration > serves POST /api/transcribe as a 501 stub 420ms
```

## A7 — Deploy
- Status: `done`
- Claim: `mychannel-api` was linked, production env vars were configured, the API was deployed to Vercel production, and the live health/TMDB routes now respond successfully.
- Evidence:
```text
Production: https://mychannel-nipbf2r0n-albert-snymans-projects.vercel.app [19s]
Aliased: https://mychannel-api.vercel.app [19s]
```
```text
HTTP/1.1 200 OK
{"status":"ok","version":"1.0.0","timestamp":"2026-04-22T12:30:53.469Z"}
```
```text
HTTP/1.1 200 OK
Cache-Control: public, max-age=86400
{"success":true,"region":"US","providers":["netflix"]}
```

## A8 — Integration tests
- Status: `done`
- Claim: The live integration suite covers every public route and passes against production.
- Evidence:
```text
api/package.json:8:    "test:integration": "vitest run tests/integration.test.ts",
api/package.json:9:    "test:integration:full": "node scripts/run-integration.mjs",
api/vitest.integration.config.ts:5:    include: ['tests/integration.test.ts'],
```
```text
Test Files  1 passed (1)
     Tests  5 passed (5)
```

## A9 — Evidence report
- Status: `done`
- Claim: This report records claim + evidence + status for A1-A9 and includes an operational runbook.
- Evidence:
```text
api/WORKSTREAM-A-REPORT.md
```

## Runbook
1. Run `npm --prefix C:\dev\mychannel-universal-backend\api run typecheck` and `npm --prefix C:\dev\mychannel-universal-backend\api test`.
2. Verify Vercel env vars exist for `mychannel-api`: `TMDB_API_KEY`, `ELEVENLABS_API_KEY`, `ANTHROPIC_API_KEY`.
3. Deploy from `C:\dev\mychannel-universal-backend\api` with `vercel deploy --prod --scope team_yiwk7JTdU3fdQVwcuOmsEVlT`.
4. Verify production with `curl.exe -i https://mychannel-api.vercel.app/api/health` and the TMDB providers curl with `X-Device-Id`.
5. Run `npm --prefix C:\dev\mychannel-universal-backend\api run test:integration:full` before merging or promoting any further change.
