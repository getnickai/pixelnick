#!/usr/bin/env bash
# Wrapper invoked by launchd for the weekly card generation run.
#
# - cds into the repo so bun auto-loads `.env.local` (R2 + Slack creds).
# - ensures bun is on PATH (launchd doesn't inherit shell PATH).
# - logs everything to ~/Library/Logs/pixelnick-cards.log so failures are
#   inspectable after the fact ("tail -f ~/Library/Logs/pixelnick-cards.log").
#
# Switch to GitHub Actions once we trust the flow — this file is the local-only
# stepping stone, not the long-term automation surface.

set -uo pipefail

REPO_DIR="${PIXELNICK_DIR:-$HOME/claude/pixelnick}"
LOG_FILE="$HOME/Library/Logs/pixelnick-cards.log"

mkdir -p "$(dirname "$LOG_FILE")"

{
  echo ""
  echo "===== $(date "+%Y-%m-%d %H:%M:%S %Z") starting weekly run ====="

  if [ ! -d "$REPO_DIR" ]; then
    echo "Repo dir not found: $REPO_DIR" >&2
    exit 1
  fi
  cd "$REPO_DIR"

  # launchd starts with a minimal PATH. Try the common bun install locations.
  export PATH="$HOME/.bun/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"

  if ! command -v bun >/dev/null 2>&1; then
    echo "bun not found on PATH. PATH=$PATH" >&2
    exit 1
  fi

  bun scripts/generate-cards.ts --from-r2
  status=$?
  echo "===== $(date "+%Y-%m-%d %H:%M:%S %Z") finished (exit=$status) ====="
  exit "$status"
} >>"$LOG_FILE" 2>&1
