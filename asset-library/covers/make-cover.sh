#!/usr/bin/env bash
# Render a NickAI social / video cover from the brand template.
#
# Usage:
#   ./make-cover.sh "Title" "Subtitle" [og|wide|square] [output.png] [cta]
#
# Sizes:
#   og      1200x630   (default; social share / OpenGraph)
#   wide    1920x1080  (16:9 video / YouTube cover)
#   square  1080x1080  (Instagram)
#
# Any argument left blank falls back to the default brand copy.
# Examples:
#   ./make-cover.sh "Nick now trades Polymarket" "Prediction markets, in plain English"
#   ./make-cover.sh "Rebalance while you sleep" "Set a rule, Nick runs it" wide yt-cover.png
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TITLE="${1:-}"
SUB="${2:-}"
SIZE="${3:-og}"
OUT="${4:-cover.png}"
CTA="${5:-}"

case "$SIZE" in
  og)     W=1200; H=630 ;;
  wide)   W=1920; H=1080 ;;
  square) W=1080; H=1080 ;;
  *) echo "size must be one of: og | wide | square" >&2; exit 1 ;;
esac

enc(){ python3 -c 'import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))' "$1"; }

QS=""
[ -n "$TITLE" ] && QS="${QS}&title=$(enc "$TITLE")"
[ -n "$SUB" ]   && QS="${QS}&subtitle=$(enc "$SUB")"
[ -n "$CTA" ]   && QS="${QS}&cta=$(enc "$CTA")"
URL="file://$DIR/cover-template.html?${QS#&}"

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --force-device-scale-factor=2 \
  --hide-scrollbars --default-background-color=FFFFFFFF \
  --screenshot="$OUT" --window-size="$W","$H" "$URL" >/dev/null 2>&1

# normalise to exact target dimensions (Chrome renders at 2x)
sips -z "$H" "$W" -s format png "$OUT" --out "$OUT" >/dev/null 2>&1
echo "Wrote $OUT (${W}x${H})"
