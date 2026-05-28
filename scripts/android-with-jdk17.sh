#!/usr/bin/env bash
# Enforce JDK 17 for Metro/Gradle commands.

set -euo pipefail

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
  echo "WARN: No JDK 17 found. Install with: sudo apt install openjdk-17-jdk" >&2
fi

if [[ -z "${NODE_BINARY:-}" ]] && command -v node >/dev/null 2>&1; then
  export NODE_BINARY="$(command -v node)"
fi

# Avoid broken global NDK env overrides.
unset ANDROID_NDK_HOME || true
unset ANDROID_NDK_ROOT || true
unset NDK_HOME || true

exec "$@"
