#!/usr/bin/env bash
set -eu

EXTENSION_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROFILE_DIR="${TMPDIR:-/tmp}/meshygrab-chrome-profile"
ARGS=("--user-data-dir=$PROFILE_DIR" --no-first-run "--load-extension=$EXTENSION_DIR" "https://www.meshy.ai/")

if [ "$(uname -s)" = "Darwin" ]; then
  for app in "/Applications/Google Chrome.app" "$HOME/Applications/Google Chrome.app" "/Applications/Chromium.app" "$HOME/Applications/Chromium.app"; do
    if [ -d "$app" ]; then
      exec open -na "$app" --args "${ARGS[@]}"
    fi
  done
  echo "Chrome or Chromium was not found in /Applications or ~/Applications." >&2
  exit 1
fi

for candidate in google-chrome google-chrome-stable chromium chromium-browser; do
  if command -v "$candidate" >/dev/null 2>&1; then
    exec "$(command -v "$candidate")" "${ARGS[@]}"
  fi
done

echo "Chrome or Chromium was not found. Install one, then run ./run.sh again." >&2
exit 1
