#!/usr/bin/env bash
# EarGuard — quick reference (JanAlarm-style workflow)

cat <<'EOF'
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  EarGuard Development Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

METRO (single terminal — press a for Android)
  pnpm start              Start Metro (interactive: a, r, d, j)
  pnpm start:metro        Same as pnpm start

ANDROID
  pnpm android            Build + install on USB device (bumps build #)
  pnpm android:phone      Same as pnpm android
  pnpm metro:usb          adb reverse tcp:8081 (if Metro can't load JS)

ANDROID RELEASE
  pnpm android:release    APK + AAB
  pnpm android:apk        Release APK only
  pnpm android:bundle     Release AAB only

TYPICAL WORKFLOW (like JanAlarm):
  $ pnpm start             # keep running; press a to run on phone

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EOF
