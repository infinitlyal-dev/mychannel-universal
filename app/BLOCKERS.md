# Workstream B — Blockers

## B1 — Android APK build

- **Condition:** `ANDROID_HOME` not set on this machine; Gradle requires `local.properties` or `ANDROID_HOME`.
- **Impact:** `assembleDebug` cannot run until Android SDK is installed and env configured.
- **Workaround:** On a machine with Android Studio: set `ANDROID_HOME`, run `cd app/android && ./gradlew assembleDebug` (or `gradlew.bat` on Windows).

## B9 — iOS

- **Condition:** CocoaPods / Xcode not available on Windows CI agent.
- **Impact:** `pod install` and simulator screenshots must be produced on macOS.
