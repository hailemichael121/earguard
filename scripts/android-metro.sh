#!/usr/bin/env bash
# Metro bundler - Android focused startup

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Force JDK 17
JAVA17=""
for _jdk in \
  /usr/lib/jvm/java-17-openjdk-amd64 \
  /usr/lib/jvm/java-17-openjdk \
  /usr/lib/jvm/temurin-17-jdk-amd64
do
  if [[ -x "$_jdk/bin/java" ]]; then
    JAVA17="$_jdk"
    break
  fi
done

if [[ -n "$JAVA17" ]]; then
  export JAVA_HOME="$JAVA17"
  export PATH="$JAVA_HOME/bin:$PATH"
fi

# Cleanup conflicting vars
unset ANDROID_NDK_HOME || true
unset ANDROID_NDK_ROOT || true
unset NDK_HOME || true

# Node binary
if command -v node >/dev/null 2>&1; then
  export NODE_BINARY="$(command -v node)"
fi

export CI=false
export TERM=xterm-256color

exec npx react-native start