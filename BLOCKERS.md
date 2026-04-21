# Orchestration Setup — Blockers (2026-04-21)

> Written by Cowork orchestration session. Per DIRECTIVE Guardrail 1,
> these items are flagged rather than invented.

## Blocking completion of Phase 1 setup

### B1 — /shared/INTERFACES.md content
- **Prompt SETUP-2** points at `C:\Users\27741\Son-Memory\handoffs\mychannel-v1-interfaces.md`.
- **Verified:** that path does not exist. No `handoffs/` directory in Son-Memory at all.
- **Prompt says:** "If that file doesn't exist, ASK Al to paste it. Do NOT invent the contents."
- **Ask:** Paste INTERFACES.md into this chat, or point me at the real path / handoff location.

### B2 — /shared/types.ts
- **Depends on B1.** Prompt SETUP-3 says extract TypeScript from Section 2 of INTERFACES.md.
- **Cannot proceed** until INTERFACES.md lands.

### B3 — Remote repo confirmation
- **Prompt SETUP-1** says set remote to `infinitlyal-dev/mychannel-app`.
- **Memory conflict:** `mychannel-app` is the v5 Netflix demo repo per `mychannel-status.md`.
  It already hosts `mychannel-v5.html`. Pushing Universal's `main` to the same remote
  would collide with existing content on that repo's main branch.
- **Options:**
  - (a) Push to `infinitlyal-dev/mychannel-app` on a Universal-only branch root
  - (b) Push to a NEW repo e.g. `infinitlyal-dev/mychannel-universal`
  - (c) Leave unpushed for now
- **Ask:** Confirm which.

### B4 — Existing 2026-04-17 content on main
- **Context:** main (was master) already has 7 commits of prior work: `www/lib/` modules
  (state-machine, deep-link, scheduler, tmdb-watch-providers, al, rachel), 57 passing tests
  in `/tests/`, `UNIVERSAL-DESIGN.md`, `MORNING-REPORT.md`, `package.json`, `vitest.config.js`.
- **Prompt layout** creates `/api/`, `/app/`, `/data/` as workstream homes — but doesn't
  say what to do with the existing `www/`, `tests/`, `docs/`, `package.json`, etc.
- **Options:**
  - (a) Leave them alongside new directories (clutter but preserves references)
  - (b) Move `www/lib/*` → `/app/lib/*` (Workstream B inherits the salvaged modules)
  - (c) Move `www/lib/tmdb-watch-providers.js` → `/api/` or `/data/` (shared)
  - (d) Delete (loss of 57 passing tests worth of work)
- **Ask:** Which migration, if any.

### B5 — GitHub MCP auth
- **Verified:** `mcp__github__get_file_contents` returns "Bad credentials" — PAT expired.
- **Impact:** I cannot SYNC Son-Memory over MCP. I read the local copy at
  `C:\Users\27741\Son-Memory\` instead.
- **For UPDATE at end of session:** will need to use local git + `git push` from the
  Son-Memory working tree, which depends on local credential-manager PAT being valid.
- **Ask:** Refresh the PAT when convenient; not urgent for Phase 1 setup.

## What HAS been done (local, not pushed)

- Renamed `master` → `main` on `C:\dev\mychannel-v2\`
- Created branches `backend`, `app`, `data` (all pointing at 76921fb, same as main head)
- Created skeleton dirs with `.gitkeep` stubs: `/api/`, `/app/`, `/data/`, `/shared/`,
  `/.codex/agents/`, `/.cursor/rules/`, `/.claude/agents/`, `/.github/workflows/`,
  `/orchestration/reports/`, `/orchestration/daily-screenshots/`
- Wrote `/shared/constants.ts` (contents per SETUP-4)
- Wrote `/orchestration/morning-report-template.md` (per SETUP-6)
- Wrote `/orchestration/evidence-log.md` (new file, append-only log)
- NOT committed yet. NOT pushed. Existing content on main untouched.

## What's next (once blockers resolved)

1. Receive INTERFACES.md → write to `/shared/INTERFACES.md`
2. Extract types → write to `/shared/types.ts` → validate with `npx tsc --noEmit`
3. Write new `/README.md` (overwriting existing) with workstream + orchestration info
4. Commit everything: `setup: initial project structure + INTERFACES + types`
5. Set remote and push `main` + `backend` + `app` + `data` branches
6. Wait for Al to fire Codex/Cursor/Claude Code day-1 prompts
