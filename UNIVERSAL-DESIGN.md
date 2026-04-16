# Universal My-Channel — Design Summary

> Read this with `C:\Users\27741\Son-Memory\MASTER-MEMORY.md` and you know where Universal stands as of 2026-04-16.
>
> This file is a **summary of decisions Al has made**, not a re-brainstorm. Tomorrow's `/superpowers:brainstorm` should start from this baseline — it answers "what's locked?" so Al doesn't have to re-derive.

---

## 1 — Product identity

**Universal My-Channel** is a standalone cross-streamer personal TV channel app. TV + phone, multi-region. It is a **separate product from v5** (`C:\Users\27741\OneDrive\Desktop\MCN\mychannel-v5.html`, the Netflix-skinned pitch demo live at `mychannel-app.vercel.app/mychannel-v5.html`).

Shared DNA with v5 (extracted or reused, never duplicated):

| DNA | v5 source | This project location |
|---|---|---|
| State machine | `mychannel-v5.html` + `MCN-overnight-build/src/lib/state-machine.js` | `www/lib/state-machine.js` |
| Deep-link builder | salvaged module | `www/lib/deep-link.js` |
| Scheduler (Capacitor LocalNotifications API match) | salvaged module | `www/lib/scheduler.js` |
| Al voice pipeline | `alSpeak`/`alSpeakStep`/`processAlCommand` (v5 lines 2092, 2624, 2686) | `www/lib/al.js` |
| Rachel narration + timeupdate cue system | `preloadRachelAudio`/`playRachelClip`/cue loop (v5 lines 3081, 3101, 3394) | `www/lib/rachel.js` |
| TMDB watch-providers wrapper | new (not in v5) | `www/lib/tmdb-watch-providers.js` |

What v5 has that this project does NOT copy tonight: SFX 16-sound engine, wizard layouts, home layouts, browse grid, Netflix branding (by design). Those are visual/UX work, deferred to daytime sessions with browser feedback.

---

## 2 — Scope (quote Al)

From today's conversation:

> "No its not a phone app first, tv first, but phone is as important. I dont want to split them. That is stupid and shorst sighted. And no, i dont want it SA focused, i want it focused on greater regions like we decided before."

So v1 ships with TV + phone equally important, and multi-region from day one. Phone-first-TV-later is explicitly rejected. SA-only is explicitly rejected.

> "the new universal mychannel that is what we discussed at fucking length in this thread with opus 4.6. Two seperate products with a lot of ahsred dna."

Therefore Universal is a separate product. It does not evolve `mychannel-v5.html`. It does not extend `C:\dev\mychannel\` (abandoned per 2026-04-16 disk audit).

> "I think your 6 to 10 weeks is a bit much. Think you are underestimating yourself."

Timeline is tighter than 6–10 weeks. Exact milestones are TBD in the daytime brainstorm.

### Concrete scope consequences

- **v1 target platforms:** Android phone + Android TV (both Capacitor wrappers of `www/`).
- **v1.1 target platforms:** iOS phone + Apple TV. Separate native build per platform. Out of scope for the Universal v1 build tonight — flagged so tomorrow's brainstorm can decide how much of `www/` is genuinely portable vs TV-specific.
- **v1 regions:** US, UK, CA, AU, ZA minimum (per MASTER-MEMORY 2026-04-16 decision "greater regions" that Al referenced).
- **Streamers:** Netflix, Disney+, Max, Apple TV+, Prime Video, Hulu, Paramount+, YouTube, Spotify podcasts. All 9 covered in `www/lib/deep-link.js`.

---

## 3 — Visual direction

**Editorial Cinema** register. Canonical home-screen reference:

- `C:\Users\27741\OneDrive\Desktop\MCN\calibration-hero-v3.html` (9/10 calibration pass, 2026-04-14)

Authority skill with veto power on every UI screen:

- `~/.claude/skills/visual-director/`

Tokens, cream rhyme rule, forbidden fonts, motion timing — all codified in that skill's `references/editorial-cinema.md`. Don't restate them here; re-reading the reference is the right path.

---

## 4 — Data layer

Per MASTER-MEMORY 2026-04-16 decision:

- **Catalogue + streamer-per-title + region:** TMDB Watch Providers endpoint. Free, powered by JustWatch, attribution required. Implemented in `www/lib/tmdb-watch-providers.js` tonight.
- **Deep links to streamers:** constructed in-house via `www/lib/deep-link.js` (salvaged module + 9 cited sources).
- **Cost:** ~$0/month for v1. JustWatch direct partner deal and Watchmode are future-scale upgrades, not v1 needs.
- **TMDB API key:** `process.env.TMDB_API_KEY`, inlined at esbuild time. Never hardcoded. See README.

Proxy (ElevenLabs + Anthropic) lives separately on Vercel, deployed by Al tomorrow — see `C:\dev\mychannel\proxy-to-ship\README.md` for the deploy procedure. This project calls `config.proxyBase + '/api/elevenlabs'` and `config.proxyBase + '/api/al'`.

---

## 5 — Architecture

**Runtime wrapper:** Capacitor 6.2.1 wraps `www/` for Android. The same `www/` is loaded on Android phone and Android TV. TV-specific focus-state UI is a TV-screen implementation detail, not a separate codebase.

- Android phone: Capacitor 6 + `www/` + standard Android target.
- Android TV: Capacitor 6 + `www/` + TV manifest flags (banner, leanback launcher). Focus navigation lives in `www/screens/` CSS + keyboard handlers.
- iOS phone + Apple TV: **v1.1. Separate native build. Out of scope for the Universal v1 ship.**

**Cross-device sync backend: DECISION PENDING.** Al has not chosen between Supabase and a custom backend. Tomorrow's brainstorm should force this choice before any schema work. Constraints to decide against:

- Read-heavy (schedule + entries per user, ~KB/user).
- Needs multi-device sync and offline fallback.
- Auth-coupled (see §6).
- Cost sensitivity at low MAU.

**Auth: DECISION PENDING.** Magic-link email vs Apple/Google sign-in. Al has not chosen. Constraints:

- TV input makes magic-link friction-heavy unless "sign in on phone, auto-link to TV via QR" is the flow.
- Apple/Google sign-in is SDK-coupled and affects the Capacitor plugin list.
- v5 has no auth, so there's no legacy to carry.

**Persistence in this project (tonight, pre-auth):** `@capacitor/preferences` on native, `localStorage` on web — fine for v1 single-device until cross-device sync lands.

---

## 6 — What was built tonight — foundation only

Each item below is linked to real files and has commit-log evidence in `MORNING-REPORT.md`.

| File | Purpose | Tests |
|---|---|---|
| `package.json`, `vitest.config.js` | Fresh project scaffold, Capacitor 6, vitest, esbuild | n/a |
| `www/lib/state-machine.js` | Salvaged state machine (protected interface) | 13 |
| `www/lib/deep-link.js` | 9 streamers, cited sources per builder | 16 |
| `www/lib/scheduler.js` | Salvaged scheduler (Capacitor LocalNotifications match) | 12 |
| `www/lib/tmdb-watch-providers.js` | TMDB wrapper, 1h in-memory cache, env-var key | 12 |
| `www/lib/al.js` | Al voice pipeline via proxy, fade-in preserved | — |
| `www/lib/rachel.js` | Rachel intro via proxy, RACHEL_SCRIPT verbatim, timeupdate cue system | — |
| `tests/shared-dna-imports.test.js` | Smoke test for al + rachel imports | 4 |
| `README.md` | Project summary + env var docs | n/a |

**Total tests: 57 (53 unit + 4 smoke).**

---

## 7 — Out of scope tonight

Do NOT read this section as "backlog." These are items an overnight run can't deliver quality on — they need Al at the screen, or they need a decision that hasn't been made.

- **Visual screens.** No home, no wizard, no lineup, no hero, no TV grid. `www/screens/` is empty.
- **`editorial-cinema.css`.** Not written tonight — needs visual-director gate with Al present.
- **Al proactive nudge logic.** What triggers Al to speak at T-5, T-0, T+10 etc. Needs product-level conversation.
- **TV focus-state UI.** Separate visual calibration session required (analogous to phone's three `calibration-hero-*` sessions).
- **Real sign-in.** Blocked on §6 DECISION PENDING.
- **Supabase or backend integration.** Blocked on §6 DECISION PENDING.
- **Vercel proxy deployment.** Al has the credentials, deploys in the morning. Files already written at `C:\dev\mychannel\proxy-to-ship\` — reuse them as-is.
- **Capacitor wrap and APK build.** The first APK for Universal comes after the home screen is real. No point wrapping empty `www/`.
- **Netflix demo preservation.** `mychannel-v5.html` stays untouched. This project never writes to it.

---

## 8 — What must not be re-decided tomorrow without Al saying so

Per MASTER-MEMORY "what's locked" list:

- Six-touchpoint seam pattern from `C:\dev\mychannel\BOUNDARY.md` (reusable concept — transplant if needed, but don't relitigate the principle).
- Editorial Cinema tokens and rules (see visual-director skill).
- "Al IS the app" — Al's voice pipeline non-negotiable in any scope cut.
- "Tap outside post-play dialog does nothing" — deliberate friction.
- Three salvaged modules lifted unchanged, no interface improvements.
- Project root stays at `C:\dev\` — never OneDrive.

---

## 9 — Three questions to open tomorrow's daytime session

1. **Supabase or custom backend?** (see §5) — the schema and auth flow both derive from this.
2. **Magic link or Apple/Google sign-in?** (see §5) — affects TV input flow and SDK choices.
3. **Which screen do we calibrate first — TV home or phone home?** Phone has `calibration-hero-v3` as reference; TV has none. If TV first, the calibration session is the critical-path blocker.
