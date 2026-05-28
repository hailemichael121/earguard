# EarGuard (React Native)

EarGuard reminds users to switch ears during phone calls to reduce long-call strain.

This repository is a React Native app using Metro and **pnpm**.

## Stack

- React Native `0.85.3`
- React `19`
- TypeScript
- Android native module/services for call state, overlay, and foreground reminders
- Metro bundler

## Package Manager

Use **pnpm only**:

```bash
pnpm install
```

---

## One-click desktop workflow

Use these three commands from the project root (same style as a simple desktop app script flow):

| Command | What it does |
| --- | --- |
| `pnpm dev` | Starts Metro bundler (JS dev server) |
| `pnpm trun` | Alias of `pnpm run` |
| `pnpm run` | Installs and launches the Android debug app (works around `pnpm run` listing behavior) |
| `pnpm run:android` | Installs and launches the Android debug app (uses local cached Gradle if wrapper download fails) |
| `pnpm build` | Prepares build metadata, then builds a release APK |
| `pnpm build:apk` | Builds release APK and copies a versioned APK to Desktop + output folder |

### Typical session (Android)

**Terminal 1** — keep Metro running:

```bash
pnpm dev
```

**Terminal 2** — run the app on a connected device/emulator:

```bash
pnpm run
# or explicitly:
pnpm run:android
# or:
pnpm android
```

**Release APK** (when you need an installable build):

```bash
pnpm build
# or
pnpm build:apk
```

Output APK path (default):

`android/app/build/outputs/apk/release/app-release.apk`

Versioned export (from `pnpm build:apk`):

- `android/app/build/outputs/apk/release/EarGuard-v<version>+<build>.apk`
- `~/Desktop/EarGuard-v<version>+<build>.apk`

### Equivalent explicit commands

| Shortcut | Full command |
| --- | --- |
| `pnpm dev` | `pnpm start` |
| `pnpm trun` | `pnpm run run` |
| `pnpm run` | `pnpm run:android` |
| `pnpm run:android` | `pnpm build:prepare && node scripts/runAndroidDebug.js` |
| `pnpm build` | `pnpm build:apk` |
| `pnpm build:apk` | `pnpm build:prepare && node scripts/exportApkToDesktop.js` |

Other useful scripts:

```bash
pnpm android:bundle   # Play Store AAB
pnpm ios              # iOS debug (macOS + Xcode)
pnpm lint             # ESLint
pnpm test             # Jest
pnpm build:prepare    # Bump build counter only (no compile)
```

---

## Build versioning + counter

`pnpm run` and `pnpm build` automatically run `pnpm build:prepare`, which:

- Increments `build-meta.json` build number
- Updates Android `versionCode` / `versionName`
- Updates iOS `CURRENT_PROJECT_VERSION` / `MARKETING_VERSION`
- Regenerates `src/buildInfo.ts` (shown in About)

---

## App behavior

- Monitors call state and tracks active calls
- Overlay call-tracking toast (overlay permission required)
- Foreground service for periodic reminders
- Optional reminder sounds and smart vibration intensity
- Settings, About, and guided onboarding
- Streak tracking, weekly insights, and lightweight achievements
- Quiet hours and smart reminder intensity

---

## Troubleshooting

### `pnpm install` fails or times out

- Retry on a stable network: `pnpm install`
- Clear store cache: `pnpm store prune` then `pnpm install`
- If you previously used npm/yarn, remove `node_modules` and reinstall with pnpm only

### Metro (`pnpm dev`) — port already in use

```bash
# Find and stop the process on port 8081 (Linux)
fuser -k 8081/tcp
pnpm dev
```

Or start on another port:

```bash
pnpm start -- --port 8088
```

Then run Android with that port if needed:

```bash
adb reverse tcp:8088 tcp:8088
```

### Why Metro does not show Android `a` key

- In plain React Native, Metro (`react-native start`) usually only shows `r / d / j` (no Expo-style `a` install shortcut).
- Installing/running on phone is done by `pnpm run` (or `pnpm run:android` / `pnpm android`) in another terminal.
- Keep Metro open in terminal 1, then run the install command in terminal 2.

### `pnpm run` — no device / emulator

```bash
adb devices
```

- Enable **USB debugging** on the phone and accept the RSA prompt
- Or start an emulator from Android Studio (AVD Manager), then run `pnpm run` again

### `pnpm run` / `pnpm build` — Gradle download timeout

- Check internet connection; Gradle may need to download distributions on first build
- Project uses an extended Gradle network timeout in `android/gradle.properties`
- This project now auto-uses cached local Gradle `8.14.3` when available to avoid wrapper download failures
- Retry: `pnpm run:android` or `pnpm build:apk`

### App installs but shows red screen / cannot load JS

1. Ensure Metro is running: `pnpm dev`
2. Reload app (shake device → Reload, or `adb shell input keyevent 82`)
3. Reset bundler cache:

```bash
pnpm start -- --reset-cache
```

### Overlay / reminders not working

- Grant **Phone**, **Notifications**, and **Display over other apps** (overlay)
- On MIUI: Settings → Apps → EarGuard → Other permissions → allow background pop-ups
- Disable battery restrictions for EarGuard when prompted in onboarding

### `pnpm build` succeeds but APK not found

Look under:

```text
android/app/build/outputs/apk/release/
```

If the folder is empty, run with logs:

```bash
cd android && ./gradlew assembleRelease --stacktrace
```

### iOS (`pnpm ios`) on Linux

iOS builds require **macOS** with Xcode and CocoaPods:

```bash
cd ios && pod install && cd ..
pnpm ios
```

---

## Prerequisites

- Node.js `>= 22.11.0`
- pnpm `10.33.0` (see `packageManager` in `package.json`)
- Android Studio / SDK + JDK for Android
- Physical device or emulator for call testing (simulation available in-app)
