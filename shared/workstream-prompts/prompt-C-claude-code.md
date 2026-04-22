# Workstream C — Catalogue & Data (Claude Code Desktop)
You are Workstream C. Workstreams A (Codex, backend) and B (Cursor, app) run in parallel. Scope: /data/ only, branch `data`. Do NOT touch /api/ or /app/.
## Read first
1. /shared/INTERFACES.md — Sections 2, 4, 8. Contract wins on any conflict.
2. /shared/types.ts — canonical Show, Streamer, Region, GenreId types.
3. C:\Users\27741\Son-Memory\directives\DIRECTIVE.md — three guardrails. Guardrail 2 governs your evidence reporting.
## Model
claude-opus-4-7 for curation and review. claude-sonnet-4-6 for mechanical tasks (schema validation, bulk fetches). Verify via /model picker.
## Tasks
### C1 — Streamers manifest
- /data/streamers.json — 9 entries per INTERFACES.md §4: netflix, disney, prime, max, appletv, hulu, paramount, showmax, youtube
- Per entry: id, name, logo path (assets/streamers/{id}.png), regions array, deepLinkSchemes {android, ios, web}
- Region filtering rules: Hulu=US only, Showmax=ZA only, Paramount=US only (Paramount+ via Showmax in ZA), others both regions
- Research actual deep link schemes for each streamer. Where unknown: use web URL as fallback.
- /data/schema/streamers.schema.json — JSON Schema v2020-12 for this file
- Validate with ajv
- Evidence: file validates, 9 entries, region filtering matches rules above, sample deep link per streamer
- Commit: "C1: streamers manifest + schema"
### C2 — Catalogue schema
- /data/schema/catalogue.schema.json — JSON Schema v2020-12 derived from Show type in /shared/types.ts
- Every field strict-typed, every required field marked, additionalProperties: false
- Evidence: ajv validates a sample Show object; ajv rejects a malformed Show
- Commit: "C2: catalogue schema"
### C3 — Seed show list (300 TMDB IDs)
- /data/seed-shows.json — array of {tmdbType, tmdbId, hint} objects
- Breakdown:
  - 200 TV shows (the anchor — we are a channel builder)
  - 100 movies
  - Genre diversity across the 12 GenreIds
  - Streamer diversity: ≥20 shows per streamer in ≥1 region
  - Mix popularity tiers: top-tier anchors (Stranger Things, Severance, Last of Us) + long-tail quality (Slow Horses, Tokyo Vice, Mr Robot)
  - Mix of US-dominant and ZA-available content
- The `hint` field is a human-readable title so reviewers can sanity-check
- Before finalizing, spawn subagent curator-reviewer (Opus 4.7) — reviews the list for diversity gaps, outdated shows, missing obvious entries
- Evidence: count-by-genre table, count-by-streamer table, curator-reviewer pass output
- Commit: "C3: 300 seed shows curated"
### C4 — Catalogue build script
- /data/scripts/build-catalogue.ts — TypeScript, Node 20+
- For each seed ID:
  1. Fetch TMDB /tv/{id} or /movie/{id} → title, year, genres, poster, backdrop, runtime
  2. Fetch TMDB /tv/{id}/watch/providers → ZA + US provider lists
  3. Filter providers against 9-streamer whitelist (use same mapping as Workstream A: "Netflix"→netflix, "Disney Plus"→disney, "Amazon Prime Video"→prime, "Max"→max, "Apple TV Plus"→appletv, "Hulu"→hulu, "Paramount Plus"→paramount, "Showmax"→showmax, "YouTube"→youtube)
  4. Build deepLinks per streamer per platform from streamers.json templates
  5. Map TMDB genres to our 12 GenreId buckets (see C6)
  6. Assemble Show object, validate against catalogue.schema.json
- Concurrency limit 10 parallel fetches
- Skip shows with zero providers in zero regions (log to build-errors.log)
- On any failure: log and continue, don't abort
- Write /data/catalogue.json
- Evidence: script runs clean, produces valid JSON under 2MB, ≥280 of 300 shows successful
- Commit: "C4: build script"
### C5 — Run the build
- Execute build-catalogue.ts
- Verify: catalogue.json valid, <2MB, schema-valid, ≥280 shows with ≥1 provider in ≥1 region
- Asset verification: every posterUrl and backdropUrl returns 200 OK on HEAD request
- Spawn schema-tester subagent (Sonnet 4.6) to validate random sample of 50 Show objects against schema
- Evidence: catalogue committed, file size, show count, genre/streamer distribution tables, schema-tester pass output
- Commit: "C5: v1 catalogue built"
### C6 — Genres manifest
- /data/genres.json — 12 entries per INTERFACES.md: drama, comedy, crime, scifi, fantasy, thriller, action, romance, documentary, animation, horror, reality
- Per entry: id, name, icon (emoji or SF Symbol name)
- /data/tmdb-genre-mapping.ts — maps TMDB's ~20 raw genre IDs to our 12 buckets (e.g., TMDB "Action & Adventure" + "War" → our "action")
- Used by build-catalogue.ts step 5
- Commit: "C6: genre manifest + TMDB mapping"
### C7 — GitHub Actions nightly rebuild
- /.github/workflows/rebuild-catalogue.yml
- Cron: daily 03:00 UTC
- Runs build-catalogue.ts, commits updated catalogue.json to `data` branch if diff exists
- Secret: TMDB_API_KEY (I'll add to repo secrets before first scheduled run)
- Evidence: workflow file committed, one manual dispatch run successful
- Commit: "C7: nightly rebuild automation"
### C8 — Evidence report
- /data/WORKSTREAM-C-REPORT.md per Guardrail 2: claim + evidence + status per task
- Include: final show count, file size, genre/streamer distribution tables, sample Show object, link to successful manual workflow run
## Subagents
Project-scoped at /.claude/agents/:
- curator-reviewer (Opus 4.7) — used in C3 for list quality
- schema-tester (Sonnet 4.6) — used in C5 for bulk validation
## Data quality rule
Better 280 clean shows than 300 with broken links. If a show can't build cleanly, drop it. Shipped catalogue must be 100% valid.
## Blockers
- TMDB rate limit: back off and retry, do not abandon
- Missing streamer deep link scheme: web fallback + log for later
- Blockers go in /data/BLOCKERS.md
## Commit cadence
One commit per task. Push to origin/data. Do NOT merge to main.
GO.
