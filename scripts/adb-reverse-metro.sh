#!/usr/bin/env bash
# Forward Metro (8081) to the USB-connected Android device — fixes "Unable to load script".
set -euo pipefail
if ! command -v adb >/dev/null 2>&1; then
  echo "adb not found. Install Android platform-tools." >&2
  exit 1
fi
adb reverse tcp:8081 tcp:8081
echo "OK: phone localhost:8081 → this PC Metro. Keep 'pnpm start' running."
