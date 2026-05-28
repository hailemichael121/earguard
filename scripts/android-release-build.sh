#!/usr/bin/env bash
# Optimized Android release builds (arm64-only, R8, shrunk resources).
#
# Usage:
#   ./scripts/android-release-build.sh apk      -> earguard.apk (testers, sideload)
#   ./scripts/android-release-build.sh bundle   -> earguard.aab (Google Play)
#   ./scripts/android-release-build.sh all      -> both (default)
#
# Requires JDK 17 (see scripts/android-with-jdk17.sh).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODE="${1:-all}"

usage() {
  echo "Usage: $0 [apk|bundle|all]" >&2
  echo "  apk     - release APK for direct install (arm64 phones)" >&2
  echo "  bundle  - release AAB for Google Play" >&2
  echo "  all     - build and export both earguard.apk and earguard.aab" >&2
  exit 1
}

case "$MODE" in
  apk) GRADLE_TASKS=(assembleRelease) ;;
  bundle) GRADLE_TASKS=(bundleRelease) ;;
  all) GRADLE_TASKS=(assembleRelease bundleRelease) ;;
  -h | --help) usage ;;
  *) echo "Unknown mode: $MODE" >&2; usage ;;
esac

echo "EarGuard release build ($MODE) - clean + optimized (arm64-v8a, R8, shrinkResources)..." >&2

pnpm android:patch
pnpm build:prepare

bash "$ROOT/scripts/android-with-jdk17.sh" "$ROOT/android/gradlew" -p "$ROOT/android" clean "${GRADLE_TASKS[@]}"

APK_SRC="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
AAB_SRC="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"

[[ -f "$APK_SRC" ]] && cp -f "$APK_SRC" "$ROOT/earguard.apk"
[[ -f "$AAB_SRC" ]] && cp -f "$AAB_SRC" "$ROOT/earguard.aab"

echo "" >&2
echo "Done. Outputs:" >&2
[[ -f "$ROOT/earguard.apk" ]] && ls -lh "$ROOT/earguard.apk" >&2
[[ -f "$ROOT/earguard.aab" ]] && ls -lh "$ROOT/earguard.aab" >&2

if [[ "$MODE" == "apk" || "$MODE" == "all" ]]; then
  echo "  Testers: share earguard.apk (install unknown apps -> open file)." >&2
fi
if [[ "$MODE" == "bundle" || "$MODE" == "all" ]]; then
  echo "  Play Store: upload earguard.aab in Play Console -> Release -> Create release." >&2
fi
