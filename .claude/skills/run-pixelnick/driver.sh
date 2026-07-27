#!/usr/bin/env bash
#
# driver.sh — launch and drive the pixelnick Next.js app headlessly.
#
# pixelnick is a web app (Next.js 16 + Turbopack). The design dashboards it
# serves are the thing you usually want to see: /static/<id> renders a live,
# data-complete card; /motion/<id> is the animated Remotion Player preview.
# There is no chromium-cli in this container, so this driver shells out to the
# pre-installed Chromium at /opt/pw-browsers and screenshots by URL.
#
# Commands:
#   serve                 start `bun run dev` (idempotent) and wait until ready
#   shot <route> [name] [WxH]
#                         screenshot one route → OUT/<name>.png
#   gallery               screenshot every /static/<id> at card aspect
#   smoke                 curl every /static/<id>, print HTTP codes (nonzero exit on any miss)
#   routes                print the known /static routes
#
# Env overrides: PORT (3000), OUT (<repo>/.driver-out), CHROME, LOG.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
PORT="${PORT:-3000}"
BASE="http://localhost:${PORT}"
OUT="${OUT:-$REPO/.driver-out}"
LOG="${LOG:-/tmp/pixelnick-dev.log}"
CHROME="${CHROME:-$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome 2>/dev/null | head -1)}"

# Every id registered in static/manifest.ts (the /static gallery).
STATIC_IDS=(
  performance-card workflow-template-card swarm-arena-model-card
  consensus-card result-card swarm-arena-leaderboard-card
  matchday-card matchday-card-analysis-start matchday-card-analysis-final
  game-pick-card game-pick-card-analysis-start game-pick-card-analysis-final
  result-portfolio-card
)

mkdir -p "$OUT"
up() { curl -sf -o /dev/null "$BASE/static"; }

cmd_serve() {
  if up; then echo "already up at $BASE"; return 0; fi
  cat >&2 <<EOF
Server not up at $BASE. Start it in a *persistent* background context, then
re-run this driver — a server backgrounded from inside a one-shot shell gets
reaped when that shell exits.

  • Agent (Claude Code): run \`cd $REPO && bun run dev\` with the Bash tool's
    run_in_background:true — it survives across tool calls.
  • Human terminal:      \`cd $REPO && bun run dev\`  (leave it running)

Then: $0 wait   # blocks until $BASE answers
EOF
  return 1
}

cmd_wait() {
  echo "waiting for $BASE …"
  for i in $(seq 1 60); do up && { echo "ready at $BASE (${i}s)"; return 0; }; sleep 1; done
  echo "not ready in 60s; check the dev log" >&2; return 1
}

cmd_shot() {
  local route="${1:?usage: shot <route> [name] [WxH]}"
  local name="${2:-$(printf '%s' "$route" | tr '/?=&' '____' | sed 's/^_//')}"
  local size="${3:-1600,1000}"; size="${size/x/,}"
  local file="$OUT/${name}.png"
  up || { echo "server not up — run: $0 serve" >&2; return 1; }
  "$CHROME" --headless=new --disable-gpu --no-sandbox --hide-scrollbars \
    --virtual-time-budget=6000 --window-size="$size" \
    --screenshot="$file" "$BASE$route" >/dev/null 2>&1
  [ -s "$file" ] && echo "wrote $file" || { echo "FAILED to capture $route" >&2; return 1; }
}

cmd_gallery() {
  up || { echo "server not up — see: $0 serve" >&2; return 1; }
  local id
  for id in "${STATIC_IDS[@]}"; do cmd_shot "/static/$id" "static-$id" 900,1300; done
}

cmd_smoke() {
  local id code fail=0
  for id in "${STATIC_IDS[@]}"; do
    code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/static/$id")
    printf "%-45s %s\n" "/static/$id" "$code"
    [ "$code" = 200 ] || fail=1
  done
  return $fail
}

cmd_routes() { local id; for id in "${STATIC_IDS[@]}"; do echo "/static/$id"; done; }

case "${1:-help}" in
  serve)   cmd_serve ;;
  wait)    cmd_wait ;;
  shot)    shift; cmd_shot "$@" ;;
  gallery) cmd_gallery ;;
  smoke)   cmd_smoke ;;
  routes)  cmd_routes ;;
  *) echo "usage: $0 {serve | wait | shot <route> [name] [WxH] | gallery | smoke | routes}" ;;
esac
