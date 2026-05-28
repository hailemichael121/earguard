#!/usr/bin/env bash
# Launched from Metro when you press [a] — JDK 17, adb reverse, run-android (no version bump).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

JAVA17=""
for _jdk in \
  /usr/lib/jvm/java-17-openjdk-amd64 \
  /usr/lib/jvm/java-17-openjdk \
  /usr/lib/jvm/temurin-17-jdk-amd64; do
  if [[ -x "$_jdk/bin/java" ]]; then
    JAVA17="$_jdk"
    break
  fi
done
if [[ -n "$JAVA17" ]]; then
  export JAVA_HOME="$JAVA17"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

unset ANDROID_NDK_HOME || true
unset ANDROID_NDK_ROOT || true
unset NDK_HOME || true

if [[ -z "${NODE_BINARY:-}" ]] && command -v node >/dev/null 2>&1; then
  export NODE_BINARY="$(command -v node)"
fi

(cd android && ./gradlew --stop 2>/dev/null) || true

if command -v adb >/dev/null 2>&1; then
  if adb devices 2>/dev/null | grep -qE '[[:alnum:]]+[[:space:]]+device$'; then
    adb reverse tcp:8081 tcp:8081 || true
  fi
fi

exec npx react-native run-android "$@"
