#!/usr/bin/env bash
# Run debug build on a USB-connected phone (USB debugging on). Uses JDK 17 + your current Node.
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
else
  echo "WARN: No JDK 17 found under /usr/lib/jvm. Install: sudo apt install openjdk-17-jdk" >&2
fi

unset ANDROID_NDK_HOME || true
unset ANDROID_NDK_ROOT || true
unset NDK_HOME || true

if [[ -z "${NODE_BINARY:-}" ]] && command -v node >/dev/null 2>&1; then
  export NODE_BINARY="$(command -v node)"
fi

pnpm android:patch
pnpm build:prepare

echo "Using java: $(command -v java 2>/dev/null || true)"
java -version 2>&1 || true
echo "Using node: ${NODE_BINARY:-node}"
command -v node >/dev/null 2>&1 && node -v || true

(cd android && ./gradlew --stop 2>/dev/null) || true

if command -v adb >/dev/null 2>&1; then
  if adb devices 2>/dev/null | grep -qE '[[:alnum:]]+[[:space:]]+device$'; then
    adb reverse tcp:8081 tcp:8081 && echo "USB: adb reverse tcp:8081 (Metro → phone OK)" || true
  else
    echo "No USB device in 'adb devices'. For Wi‑Fi: set Debug server host to PC_IP:8081" >&2
  fi
else
  echo "adb not on PATH — install platform-tools or use Wi‑Fi + Debug server host" >&2
fi

exec npx react-native run-android "$@"
