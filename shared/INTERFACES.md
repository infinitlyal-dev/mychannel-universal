&#x20;INTERFACES.md — MyChannel v1 Contract



\## What this is



This file defines the boundaries between the three workstreams. Each workstream implements against these interfaces, not against each other's code. If a workstream needs an interface to change, they propose a change here first; they don't change their implementation and break the other two.



\*\*Project root:\*\* `C:\\dev\\mychannel-universal\\`

\*\*Git repo:\*\* `infinitlyal-dev/mychannel-universal` (new repo, separate from the v5 Netflix demo)

\*\*Branches:\*\* `main` (integration), `backend` (Codex), `app` (Cursor), `data` (Claude Code)



\## 1. Directory structure

mychannel-universal/

├── api/                     # Codex workstream — Vercel proxy

│   ├── al.ts               # Disabled in v1, stub returns 501

│   ├── elevenlabs.ts       # TTS — used only for notification-sound generation in v1

│   ├── transcribe.ts       # Disabled in v1, stub returns 501

│   ├── tmdb.ts             # Watch Providers proxy

│   └── \_middleware.ts      # Rate limiting, auth, CORS

├── app/                     # Cursor workstream — Capacitor app

│   ├── www/                # Web root

│   │   ├── index.html

│   │   ├── css/

│   │   ├── js/

│   │   │   ├── wizard.js

│   │   │   ├── channel.js

│   │   │   ├── native.js   # Capacitor plugin wiring

│   │   │   └── store.js    # localStorage/Preferences state

│   │   └── assets/         # Icons, images

│   ├── android/

│   ├── ios/

│   └── capacitor.config.ts

├── data/                    # Claude Code workstream — catalogue

│   ├── catalogue.json      # The show database — single source

│   ├── streamers.json      # 9 streamers × 2 regions metadata

│   ├── genres.json         # 12 genre buckets

│   ├── scripts/

│   │   └── build-catalogue.ts   # Nightly regeneration

│   └── schema/

│       └── catalogue.schema.json  # JSON Schema for validation

├── shared/                  # Read by all three workstreams

│   ├── INTERFACES.md       # This file

│   ├── constants.ts        # Shared constants (endpoints, versions)

│   ├── types.ts            # TypeScript types — canonical

│   └── workstream-prompts/ # Day-1 prompts for each workstream

│       ├── prompt-A-codex.md

│       ├── prompt-B-cursor.md

│       └── prompt-C-claude-code.md

├── orchestration/           # Cowork's workspace

│   ├── reports/            # Daily morning reports

│   ├── evidence-log.md     # Append-only verification log

│   └── daily-screenshots/  # Per-date emulator screenshots

├── .codex/agents/          # Codex workstream custom subagents

├── .cursor/rules/          # Cursor workstream rules

├── .claude/agents/         # Claude Code workstream subagents

├── BLOCKERS.md             # Cross-workstream blockers

└── README.md



\## 2. Shared types (canonical — `shared/types.ts`)



```typescript

// ─── CATALOGUE TYPES ───



export type Region = 'ZA' | 'US';



export type StreamerId =

&#x20; | 'netflix' | 'disney' | 'prime' | 'max' | 'appletv'

&#x20; | 'hulu' | 'paramount' | 'showmax' | 'youtube';



export interface Streamer {

&#x20; id: StreamerId;

&#x20; name: string;              // "Netflix"

&#x20; logo: string;              // Path relative to /assets/streamers/

&#x20; regions: Region\[];         // Where this streamer operates

&#x20; deepLinkSchemes: {

&#x20;   android: string;         // "nflx://"

&#x20;   ios: string;             // "nflx://"

&#x20;   web: string;             // "https://www.netflix.com/title/"

&#x20; };

}



export interface Show {

&#x20; id: string;                // "tmdb-tv-1396" — stable, used as key

&#x20; tmdbId: number;

&#x20; tmdbType: 'tv' | 'movie';

&#x20; title: string;

&#x20; year: number;

&#x20; posterUrl: string;         // TMDB CDN, absolute

&#x20; backdropUrl: string;

&#x20; genres: GenreId\[];

&#x20; runtimeMinutes: number;    // Average episode, or movie length

&#x20; providers: {               // Which streamers, per region

&#x20;   \[R in Region]?: StreamerId\[];

&#x20; };

&#x20; deepLinks: {               // Pre-built deep links per streamer

&#x20;   \[S in StreamerId]?: {

&#x20;     android?: string;

&#x20;     ios?: string;

&#x20;     web?: string;

&#x20;   };

&#x20; };

}



export type GenreId =

&#x20; | 'drama' | 'comedy' | 'crime' | 'scifi' | 'fantasy'

&#x20; | 'thriller' | 'action' | 'romance' | 'documentary'

&#x20; | 'animation' | 'horror' | 'reality';



// ─── USER STATE TYPES (stored on device) ───



export interface UserState {

&#x20; version: 1;                // Schema version — bump on breaking change

&#x20; onboarded: boolean;

&#x20; region: Region;

&#x20; subscription: {

&#x20;   tier: 'free' | 'paid';

&#x20;   expiresAt?: string;      // ISO date, paid only

&#x20; };

&#x20; streamers: StreamerId\[];   // Which streamers user has

&#x20; shows: string\[];           // Show IDs user picked (NOT full Show objects)

&#x20; schedule: ScheduleEntry\[];

&#x20; lastOpenedAt: string;      // ISO date

}



export interface ScheduleEntry {

&#x20; showId: string;

&#x20; dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;   // 0=Sunday

&#x20; startTime: string;         // "HH:mm" 24h local

&#x20; endTime: string;           // Computed, for UI convenience

&#x20; enabled: boolean;          // User can toggle slots on/off

}



// ─── BACKEND RESPONSE TYPES ───



export interface TmdbProvidersResponse {

&#x20; success: boolean;

&#x20; region: Region;

&#x20; providers: StreamerId\[];   // Filtered to our known set

&#x20; error?: string;

}



export interface ElevenLabsTtsRequest {

&#x20; text: string;              // Max 500 chars

&#x20; voiceId: string;           // Whitelisted on server

&#x20; modelId: 'eleven\_flash\_v2\_5';

}

```



\## 3. Backend API contract (Codex workstream)



\*\*Base URL:\*\* `https://mychannel-api.vercel.app`

\*\*Auth:\*\* `X-Device-Id` header (UUID generated on first app launch, stored in Preferences)

\*\*Rate limits:\*\* Per-device, via Upstash Redis free tier



\### GET /api/tmdb/providers/:tmdbType/:tmdbId



Proxies TMDB Watch Providers. TMDB API key stays server-side.



\*\*Params:\*\* `tmdbType` = `tv` | `movie`, `tmdbId` = number

\*\*Query:\*\* `?region=ZA` or `?region=US`

\*\*Response:\*\* `TmdbProvidersResponse`

\*\*Rate limit:\*\* 100/hr per device

\*\*Cache:\*\* `Cache-Control: public, max-age=86400` (24h — provider data is stable)



\### POST /api/elevenlabs



TTS for notification sounds only in v1. Not called at runtime — called at build time by the asset script.



\*\*Body:\*\* `ElevenLabsTtsRequest`

\*\*Response:\*\* `audio/mpeg`

\*\*Rate limit:\*\* 10/hr per device

\*\*Voice whitelist:\*\* Mark (`UgBBYS2sOqTuMpoF3BR0`), Rachel (`21m00Tcm4TlvDq8ikWAM`)



\### GET /api/health



Returns `{status: 'ok', version: '1.0.0'}`. Used by app on startup to confirm backend is reachable.



\### POST /api/al  and  POST /api/transcribe



\*\*v1: Return 501 Not Implemented.\*\* Routes exist as stubs so v2 can enable them without deploying new routes.



\## 4. Catalogue contract (Claude Code workstream)



\### catalogue.json



\*\*Size target:\*\* Under 2 MB, gzipped under 500 KB.



\*\*Format:\*\* Array of `Show` objects, validated against `catalogue.schema.json`.



\*\*v1 scope:\*\*

\- 300 shows total

\- 9 streamers × 2 regions (ZA, US)

\- Genres filtered to 12 buckets

\- All poster/backdrop URLs validated as 200-OK at build time

\- Deep links pre-built per streamer per platform



\### build-catalogue.ts



Runs nightly via GitHub Actions (not on user devices).



\*\*Inputs:\*\*

\- `seed-shows.json` — 300 TMDB IDs hand-picked for v1

\- TMDB API key (env var)

\- Streamer deep-link templates from `streamers.json`



\*\*Process:\*\*

1\. For each TMDB ID: fetch show details, watch providers for ZA and US, poster/backdrop URLs

2\. Filter providers to our 9-streamer whitelist

3\. Build deep links using streamer templates + show title/ID

4\. Validate schema

5\. Write to `catalogue.json`

6\. Commit to `data` branch if diff exists



\*\*Output contract:\*\* Valid `catalogue.json`, no null fields, no broken URLs, no shows without at least one provider in at least one region.



\### streamers.json



Static file, hand-maintained by Claude Code initially. Schema:



```json

\[

&#x20; {

&#x20;   "id": "netflix",

&#x20;   "name": "Netflix",

&#x20;   "logo": "assets/streamers/netflix.png",

&#x20;   "regions": \["ZA", "US"],

&#x20;   "deepLinkSchemes": {

&#x20;     "android": "nflx://www.netflix.com/title/",

&#x20;     "ios": "nflx://www.netflix.com/title/",

&#x20;     "web": "https://www.netflix.com/title/"

&#x20;   }

&#x20; }

]

```



\## 5. App contract (Cursor workstream)



\### State persistence



`UserState` stored via Capacitor Preferences plugin (secure, survives app updates).



\*\*Migration rule:\*\* On app launch, check `state.version`. If schema version bumped, run migration function. If migration impossible, reset with preservation of `streamers` and `shows` arrays only.



\### Catalogue loading



On first launch after install or update:

1\. Fetch `catalogue.json` from app bundle (shipped inside the app, not downloaded)

2\. Parse, validate against schema, store in memory

3\. If background refresh enabled, fetch updated catalogue from `https://mychannel-api.vercel.app/static/catalogue.json` once per 24h



Catalogue is READ-ONLY from the app's perspective.



\### Backend calls



App calls backend ONLY for:

\- `/api/health` on startup

\- `/api/tmdb/providers/...` if user picks a show not in the shipped catalogue (edge case)

\- `/api/elevenlabs` — NEVER in v1 (notification sounds are pre-generated and shipped in the bundle)



\### Native plugins required (Capacitor 6)



```json

{

&#x20; "dependencies": {

&#x20;   "@capacitor/core": "^6.0.0",

&#x20;   "@capacitor/cli": "^6.0.0",

&#x20;   "@capacitor/android": "^6.0.0",

&#x20;   "@capacitor/ios": "^6.0.0",

&#x20;   "@capacitor/preferences": "^6.0.0",

&#x20;   "@capacitor/local-notifications": "^6.0.0",

&#x20;   "@capacitor/app": "^6.0.0",

&#x20;   "@capacitor/app-launcher": "^6.0.0",

&#x20;   "@capacitor/splash-screen": "^6.0.0",

&#x20;   "@capacitor/status-bar": "^6.0.0",

&#x20;   "@capacitor/haptics": "^6.0.0",

&#x20;   "@capacitor/network": "^6.0.0"

&#x20; }

}

```



\### Notification contract



When user finishes wizard, app:

1\. Requests notification permission via `LocalNotifications.requestPermissions()`

2\. For each `ScheduleEntry` with `enabled: true`, schedules a notification for the next occurrence

3\. Notification payload:

&#x20;  - Title: show title

&#x20;  - Body: "Starts now on {streamer name}"

&#x20;  - Action: tap opens the streamer's deep link for that show

4\. Reschedules weekly via `@capacitor/app` resume hooks



\*\*Notification sound:\*\* One `.wav` shipped in bundle, same across all notifications. Not per-show in v1.



\### Deep link opening



```typescript

import { AppLauncher } from '@capacitor/app-launcher';

import { Capacitor } from '@capacitor/core';



async function launchShow(show: Show, streamer: StreamerId) {

&#x20; const platform = Capacitor.getPlatform();  // 'android' | 'ios' | 'web'

&#x20; const link = show.deepLinks\[streamer]?.\[platform];

&#x20; if (!link) return fallbackToWeb(show, streamer);



&#x20; const { value: canOpen } = await AppLauncher.canOpenUrl({ url: link });

&#x20; if (canOpen) {

&#x20;   await AppLauncher.openUrl({ url: link });

&#x20; } else {

&#x20;   fallbackToWeb(show, streamer);

&#x20; }

}

```



\## 6. Asset contract (Minnie workstream)



Assets live in `app/www/assets/` and platform-specific locations.



\*\*v1 asset list:\*\*

\- App icon: 1024×1024 master, exported to all platform sizes

\- Splash screen: portrait + landscape per platform

\- Notification icon: Android monochrome, iOS colored

\- 9 streamer logos: 256×256 PNG, transparent background

\- 1 notification sound: `notification.wav`, under 1 second, subtle

\- Store screenshots: 6 per device type, 2 variants (ZA, US) — priority: week 3



\*\*Minnie generates these via:\*\* Leonardo for app icon + splash art, ElevenLabs for notification sound, Playwright against streamer brand pages for logo scraping (if licensing allows) or hand-download otherwise.



\## 7. UI Flow — 14 screens



Authoritative reference for Workstream B.



\*\*Screen 1 — Splash:\*\* Dark screen. `MC` wordmark. Two lines: "Your own TV channel. / Built from your streamers, your shows, your week." Tap to begin.



\*\*Screen 2 — Welcome:\*\* "Let's build your channel." Three bullets: 📺 Pick your streamers, 🎬 Pick shows you love, ⏰ Pick when you watch. Button: "Let's Build It →". Tiny: "About 2 minutes."



\*\*Screen 3 — Region:\*\* "Where are you?" Two cards: 🇿🇦 South Africa, 🇺🇸 United States. Faint: "More countries coming."



\*\*Screen 4 — Streamer picker (wizard 1/4):\*\* Region-filtered streamer tiles, multi-select, ≥1 required. SA shows 6, US shows 9. Continue disabled until ≥1 picked.



\*\*Screen 5 — Show picker (wizard 2/4):\*\* 300-show poster grid from catalogue, filtered by state.streamers, ≥6 required. Has search. No genre chips, no AI recommendations.



\*\*Screen 6 — Time picker (wizard 3/4):\*\* 7×4 grid (Mon-Sun × 4 time bands: Early, Afternoon, Evening, Late). Preset buttons: Weeknights only, Weekends, Every night, Clear all. ≥3 slots required.



\*\*Screen 7 — Preview (wizard 4/4):\*\* Scheduler output rendered as weekly grid. Tap slot to swap/remove. Stats: total slots, shows used, weekly hours. Buttons: Not quite / Lock it in.



\*\*Screen 8 — Notification permission:\*\* Bell icon, "One last thing." Explanation text. Primary: Allow. Tiny: Skip for now.



\*\*Screen 9 — Scheduling animation:\*\* 2-3 second progress bar, "Scheduling X shows across your week…" Writes state.onboarded = true.



\*\*Screen 10 — Channel view (Home):\*\* Top bar with MC logo + settings. Hero: NOW or UP NEXT show with backdrop, title, tag, "Watch on \[Streamer] →" button. Up Next horizontal strip (next 4 shows). Today's Lineup vertical list. Bottom tabs: Now / Week / Shows.



\*\*Screen 11 — Native notification:\*\* System-level. Title: show title. Body: "Starts now on \[Streamer] — Tap to watch." Tap → deep link → streamer app.



\*\*Screen 12 — Week view (tab):\*\* Full 7×4 grid. Tap empty to add, tap filled to swap/remove.



\*\*Screen 13 — Shows view (tab):\*\* User's picks grid. Add shows → reopens Screen 5 picker. Long-press/swipe to remove.



\*\*Screen 14 — Settings:\*\* Region, notification toggle, "Reset my channel," about, privacy policy.



\### Design tokens (locked)



\- Ground: `#0B0B0C`

\- Surface: `#141414`

\- Accent red: `#E50914`

\- Text: `#FAFAFA`

\- Muted: `#8A8A8F`

\- Corners: 2px max

\- Font stack: system-ui, -apple-system, "SF Pro Text", "Segoe UI", Roboto, sans-serif

\- NO gradients on buttons, NO glowing hover effects

\- Posters 2:3 aspect, square corners



\## 8. What's NOT in v1



\- Al the voice concierge (v2)

\- ElevenLabs TTS at runtime (v2)

\- Speech-to-text anywhere (v2)

\- Rachel cinematic intro (never — was v5 pitch theater)

\- Path choice Help/Let me build it (v2 with Al)

\- Pattern-aware fill (v2 with Al)

\- Curated channels (v2)

\- Kids mode (v2+)

\- Android TV, Apple TV, Fire TV (v1.5+)

\- Account system, sync, sign-in (v2)

\- Payment/subscription backend (v1.2 after retention data)

\- Disney+ deep-link Android reliability (degraded fallback only)

\- Live channel playback simulation (never — notification IS the moment)

\- Recommendations, ratings, reviews, social, discovery browse, "mark as watched"



\## 9. Definition of Done — v1



Ready for TestFlight when a user:

1\. Installs on Android or iOS

2\. Completes 4-step wizard in under 2 minutes (streamers → shows → times → review)

3\. Sees schedule visualized

4\. Grants notification permission

5\. Receives notification at scheduled time next day

6\. Taps notification, lands in correct streamer app on correct title



Nothing else.

