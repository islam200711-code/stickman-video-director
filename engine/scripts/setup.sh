#!/usr/bin/env bash
# Restore the Stickman engine in a fresh cloud session. Idempotent.
set -euo pipefail
cd "$(dirname "$0")/.."
command -v ffmpeg >/dev/null || { echo "ffmpeg missing: apt-get install -y ffmpeg"; exit 1; }
if ! command -v espeak-ng >/dev/null; then
  (apt-get install -y espeak-ng >/dev/null 2>&1 || (apt-get update >/dev/null && apt-get install -y espeak-ng >/dev/null)) \
    || echo "⚠ espeak-ng unavailable: narration will be skipped (captions still render)"
fi
npm ci --no-audit --no-fund
CHROME="${REMOTION_CHROME:-/opt/pw-browsers/chromium}"
if [ -x "$CHROME" ]; then echo "✔ Chromium: $CHROME"; else echo "⚠ $CHROME not found; Remotion will download its own headless shell (needs network) or set REMOTION_CHROME"; fi
npx tsc -p . && npx tsx --test tests/*.test.ts >/dev/null && echo "✔ typecheck + unit tests passed"
