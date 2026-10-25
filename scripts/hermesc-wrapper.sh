#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HERMESC_BIN="$(find "$ROOT_DIR/node_modules/.pnpm" -path '*/hermesc/linux64-bin/hermesc' | head -n 1)"

if [[ -z "${HERMESC_BIN}" ]]; then
  echo "Unable to locate hermesc binary under node_modules/.pnpm" >&2
  exit 1
fi

exec "$HERMESC_BIN" "$@"
