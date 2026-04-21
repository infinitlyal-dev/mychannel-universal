# Workstream B — Evidence Report (Guardrail 2)

## Summary

Capacitor 6 web app under `app/` with vanilla TypeScript, `lit-html`, hash routing, Preferences-backed state, bundled catalogue in `www/data/`, and Vitest smoke tests against the production API base URL.

## B1 — Android APK

- **Status:** Not produced on this agent host (`ANDROID_HOME` unset; Gradle reports missing SDK). See `app/BLOCKERS.md`.
- **Expected artifact path (after local build):** `app/android/app/build/outputs/apk/debug/app-debug.apk`
- **MD5 / size:** N/A (APK not built here)

## B9 — iOS

- **Status:** `pod install` / Xcode simulator not executed on Windows. iOS project path: `app/ios/App/`.
- **Evidence:** N/A on this host; run on macOS per `app/BLOCKERS.md`.

## Screenshots

Captured in-browser (static `serve` of `app/www`) into:

- `app/screenshots/B2/test-components.png`
- `app/screenshots/B3/splash.png`, `welcome.png`, `region.png`
- `app/screenshots/B4/streamer-picker.png` (3 selections, counter “3 selected”)
- `app/screenshots/B5/show-picker.png`, `time-picker.png`, `preview.png`

## Automated tests

- **Runner:** Vitest (`npm test` in `app/`)
- **Latest run:** 1 file, **3 tests passed** (`tests/backend-integration.test.ts`)
  - Fixture read for `www/data/backend-mock.json`
  - Live `GET https://mychannel-api.vercel.app/api/health` (passes when reachable)
  - Live `GET /api/tmdb/providers/tv/1396` for `ZA` and `US`

## Native evidence gaps (B6 / B9)

- Android **system permission prompt** and **scheduled notification firing** require an emulator/device with SDK + Google Play services as applicable.
- iOS **simulator screenshots** require macOS + CocoaPods + Xcode.

## Repo hygiene

- Root `.gitignore` updated so `app/android` and `app/ios` are **not** globally ignored.
- Workstream scope respected: changes under `app/` only in this delivery (plus root `.gitignore` adjustment for Capacitor).
