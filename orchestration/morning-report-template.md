# Morning Report — {YYYY-MM-DD}

> Written by the orchestration Cowork session. Format follows Guardrail 2
> from `Son-Memory/directives/DIRECTIVE.md`: every claim carries per-item
> evidence (grep output, curl response, screenshot path, test output) or
> an explicit "not verified" flag. Commit counts appear only alongside
> evidence, never as substitutes.

## 1. Yesterday's shipped work

### Workstream A — Codex (backend)
- **Commits:** `{git log --oneline origin/backend --since=yesterday}`
- **Files touched:** `{git diff --stat}`
- **Claims from `/api/WORKSTREAM-A-REPORT.md`:**
  - {claim} — **Verification:** {command + result} — **Status:** {VERIFIED | FAILED | NOT CHECKED}

### Workstream B — Cursor (app)
- **Commits:** `{git log --oneline origin/app --since=yesterday}`
- **Files touched:** `{git diff --stat}`
- **Claims from `/app/WORKSTREAM-B-REPORT.md`:**
  - {claim} — **Verification:** {...}

### Workstream C — Claude Code (data)
- **Commits:** `{git log --oneline origin/data --since=yesterday}`
- **Files touched:** `{git diff --stat}`
- **Claims from `/data/WORKSTREAM-C-REPORT.md`:**
  - {claim} — **Verification:** {...}

## 2. Integration status

- **Backend reachable:** `curl https://mychannel-api.vercel.app/api/health` → `{status + body}`
- **App → backend wiring:** app points at `{API_BASE from shared/constants.ts}` = `{actual URL grep result from /app/}`
- **App → library wiring:** app consumes `/api/library` (no bundled catalogue) — **Evidence:** `{grep result}`
- **Type contract drift:** `tsc --noEmit` across /shared + all three workstreams — `{pass | fail + line}`

## 3. Smoke test results

### Android emulator
- **APK:** `{path}` — md5 `{hash}` — size `{kb}`
- **Walkthrough:** splash → welcome → region → streamers → shows → times → preview → notification → channel
- **Screenshots:** `/orchestration/daily-screenshots/{date}/android/{screen}.png`
- **Fails observed:** {list or "none"}

### iOS simulator
- **Status:** {pass | fail | NOT TESTED — Windows machine}

## 4. Blockers (P0/P1 requiring Al)

- **P0 (production broken):** {list or "none"}
- **P1 (workstream blocked):** {list or "none"}

## 5. Merge candidates

| Branch | Tests | Integration | Recommendation |
|---|---|---|---|
| backend | {pass count} | {ok/broken} | {merge/hold — reason} |
| app | {pass count} | {ok/broken} | {merge/hold — reason} |
| data | {pass count} | {ok/broken} | {merge/hold — reason} |

**Cowork will NOT auto-merge. Al approves each merge explicitly.**

## 6. Today's priorities (roadmap next-step, top 3 per workstream)

- **Backend:** {1. / 2. / 3.}
- **App:** {1. / 2. / 3.}
- **Data:** {1. / 2. / 3.}

## 7. Decisions needed from Al

- {question} — default if no answer: {fallback}

## 8. Evidence log reference

Full verification commands and raw output appended to
`/orchestration/evidence-log.md` under this date heading.
