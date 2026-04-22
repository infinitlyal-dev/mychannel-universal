# Workstream B — App Shell & UI (Cursor 3)
You are Workstream B. Workstream A (Codex, backend) and C (Claude Code, catalogue) run in parallel. Scope: /app/ only, branch `app`. Do NOT touch /api/ or /data/.
## Read first
1. /shared/INTERFACES.md — Sections 1, 2, 5, 7, 8, 9. Contract wins over this prompt on any conflict.
2. /shared/types.ts — canonical types.
## Model
Composer 2 default. Switch to Claude Opus 4.7 for architectural decisions only. Use 5 parallel agents per Cursor 3 worktree model (see Agent split below).
## Stack
- Capacitor 6 (fresh scaffold — no legacy code carried forward)
- Vanilla TypeScript + lit-html for templating. NO React. NO framework bloat.
- State persistence via @capacitor/preferences
- Catalogue loaded from /app/www/data/catalogue.json (shipped in bundle)
- Backend calls to https://mychannel-api.vercel.app
## Design tokens (LOCKED)
Ground #0B0B0C, Surface #141414, Red #E50914, Text #FAFAFA, Muted #8A8A8F.
Corners 2px max. Font: system-ui stack. No gradients, no glow. Posters 2:3, square.
## 14 screens to build (authoritative copy in INTERFACES.md §7)
1. Splash — MC wordmark + "Your own TV channel. / Built from your streamers, your shows, your week." + "tap to begin"
2. Welcome — "Let's build your channel." + 3 bullets + button
3. Region — ZA | US two cards
4. Streamer picker (wizard 1/4) — region-filtered tiles, ≥1 required
5. Show picker (wizard 2/4) — 300-show grid filtered by state.streamers, ≥6 required, search bar
6. Time picker (wizard 3/4) — 7×4 grid + 4 presets (Weeknights/Weekends/Every night/Clear), ≥3 required
7. Preview (wizard 4/4) — computed schedule, tap-to-swap, "Lock it in"
8. Notification permission — native permission request with explanation
9. Scheduling animation — 2-3s progress, writes state.onboarded=true
10. Channel view — hero (NOW or UP NEXT) + Watch button + Up Next strip + Today's Lineup + bottom tabs
11. System notification — native payload, tap fires deep link to streamer
12. Week tab — full 7×4 grid, tap to swap/remove/add
13. Shows tab — picks grid, add/remove
14. Settings — region, notifications toggle, reset, about
## Tasks
### B1 — Scaffold fresh Capacitor 6 project
- cd /app/ on branch `app`
- npx @capacitor/cli@latest init MyChannel com.mychannel.universal --web-dir=www
- npm i @capacitor/core @capacitor/android @capacitor/ios @capacitor/preferences @capacitor/local-notifications @capacitor/app @capacitor/app-launcher @capacitor/splash-screen @capacitor/status-bar @capacitor/haptics @capacitor/network
- npx cap add android && npx cap add ios
- Build a "hello world" index.html, run gradle assembleDebug, verify APK produced
- Evidence: APK path, md5, file size
- Commit: "B1: fresh Capacitor 6 scaffold"
### B2 — Design system
- /app/www/css/tokens.css (the 6 locked tokens as CSS vars)
- /app/www/css/base.css (reset + typography)
- /app/www/js/components/ — Button, TopBar, ProgressBar, PosterCard, StreamerTile, Modal — each a standalone HTMLElement subclass
- /app/www/test-components.html showing all components
- Evidence: screenshot of test-components.html in browser
- Commit: "B2: design system + components"
### B3 — Screens 1, 2, 3
- /app/www/js/screens/splash.ts, welcome.ts, region.ts
- Router: /app/www/js/router.ts — hash-based routing, screen transitions
- Writes state.region on screen 3
- Evidence: screenshot of each screen rendered in browser + screen transition video (or 3 sequential screenshots)
- Commit: "B3: splash/welcome/region"
### B4 — Screen 4 streamer picker
- Reads /data/streamers.json from Workstream C (if not yet present, create /app/www/data/streamers.mock.json with 9 streamers per INTERFACES.md §4 and use it)
- Filter by state.region, multi-select, Continue disabled until ≥1 picked
- Writes state.streamers
- Evidence: screenshot with 3 selected, counter "3 selected"
- Commit: "B4: streamer picker"
### B5 — Screens 5, 6, 7 (wizard 2-4)
- /app/www/data/catalogue.mock.json with 30 shows (Workstream C replaces with real 300)
- Screen 5: filtered 3-col poster grid, search bar filters live
- Screen 6: 7×4 grid + 4 preset buttons
- Screen 7: /app/www/js/lib/scheduler.ts — distribute state.shows across state.schedule time windows, round-robin, match runtime to window length roughly; slot-tap-to-swap modal
- Evidence: screenshots of all three with mock data
- Commit: "B5: wizard 2-4"
### B6 — Screens 8, 9 (notification + scheduling)
- /app/www/js/lib/notifications.ts — scheduleEntriesToNotifications(state) → LocalNotifications.schedule()
- /app/www/js/lib/deep-link.ts — buildDeepLink(show, streamer, platform) using Show.deepLinks
- Screen 8: LocalNotifications.requestPermissions(), branch on grant/deny, persistent banner if denied
- Screen 9: 2-3s progress, schedule notifications, writes state.onboarded=true
- Evidence: Android emulator screenshot of system permission prompt + notification firing with correct payload 1 minute later
- Commit: "B6: notification flow"
### B7 — Screen 10 channel view
- Hero logic: check state.schedule + current time → NOW (current slot active) or UP NEXT (next upcoming)
- "Watch on [Streamer]" button → AppLauncher.openUrl(deepLink) with web fallback
- Up Next horizontal strip (next 4)
- Today's Lineup vertical list
- Bottom tabs (Now, Week, Shows)
- Evidence: screenshots of 3 hero states — NOW playing, UP NEXT, empty day
- Commit: "B7: channel view"
### B8 — Screens 12, 13, 14
- Week tab: full 7×4 grid, tap to edit
- Shows tab: picks grid, add reopens screen 5, swipe to remove
- Settings: region, notifications toggle, reset (wipes state), about page
- Evidence: screenshot of each
- Commit: "B8: tabs + settings"
### B9 — iOS build
- cd ios/App && pod install
- Open Xcode, build for simulator
- Evidence: screenshots of splash, wizard, channel view on iOS simulator
- Commit: "B9: iOS build"
### B10 — Backend integration
- Replace mock data paths with real backend URL once Workstream A is live
- /app/tests/backend-integration.test.ts — vitest hitting /api/health on startup + /api/tmdb/providers for one show per region
- Must pass
- Commit: "B10: backend integration"
### B11 — Evidence report
- /app/WORKSTREAM-B-REPORT.md per Guardrail 2
- Include: APK path+md5, iOS build path, screenshots folder, vitest pass count
## Agent split (Cursor 3 parallel agents via worktrees)
- Agent 1 — design system (B2)
- Agent 2 — wizard screens (B3, B4, B5)
- Agent 3 — channel view + tabs (B7, B8)
- Agent 4 — native integration (B6, B9, B10)
- Agent 5 — background visual reviewer using Cursor's native browser tool: screenshot every screen, flag visual deviations from tokens
## Browser verification
Every screen: render → screenshot → save to /app/screenshots/{task}/{screen}.png → compare to spec language.
## Blockers
- If backend not live, mock at /app/www/data/backend-mock.json. config.apiBase switches between mock and live.
- If catalogue not live, use /app/www/data/*.mock.json.
- Do NOT stop. Blockers go in /app/BLOCKERS.md.
## Commit cadence
One commit per task. Push to origin/app. Do NOT merge to main.
GO.
