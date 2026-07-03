#!/bin/bash
# Friday weekly-social run (STA-473 CP7): headless Claude executes the
# /nickai-weekly-social skill (scorecard → gather → draft → render → publish
# → deliver). Degraded-mode guarantee: whatever happens, a Slack message
# lands in #social-posts-nick — a silent Friday is the one unacceptable
# failure. Logs: ~/nickai-content/social-calendar/logs/.
#
# DRY_RUN=1 bash scripts/run-weekly-social.sh   # plumbing test, no Claude run
set -u

PIXELNICK_DIR="${PIXELNICK_DIR:-/Users/badi/claude/pixelnick-social-cards}"
LOG_DIR="/Users/badi/nickai-content/social-calendar/logs"
CHANNEL="${SLACK_CHANNEL_SOCIAL_POSTS:-C0BEUBTTTJ7}"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/run-$(date +%Y%m%d-%H%M%S).log"

cd "$PIXELNICK_DIR" || exit 1
set -a; source .env.local 2>/dev/null; set +a

heartbeat() {
  curl -sS -X POST "https://slack.com/api/chat.postMessage" \
    -H "Authorization: Bearer ${SLACK_BOT_TOKEN:-}" \
    -d "channel=$CHANNEL" \
    --data-urlencode "text=$1" \
    >/dev/null 2>&1
}

if [ "${DRY_RUN:-0}" = "1" ]; then
  echo "dry run: env + paths ok, would invoke headless claude" | tee "$LOG_FILE"
  heartbeat "weekly-social dry run: plumbing OK (no batch generated)"
  exit 0
fi

# Preflight: the worktree must be on the expected branch family, not detached
# mid-experiment (shared-checkout staleness is a documented pixelnick hazard).
git fetch origin main -q 2>>"$LOG_FILE"

PROMPT='/nickai-weekly-social Run the full weekly batch end to end: scorecard for last week (skip gracefully on missing data), gather sources, draft, render cards (stills first, then MP4s), publish to R2, deliver to #social-posts-nick, update the posted ledger, and leave a checkpoint comment on Linear STA-473. Delivery is autonomous (format was approved on the first batch).'

if command -v claude >/dev/null 2>&1; then
  claude -p "$PROMPT" --permission-mode bypassPermissions >>"$LOG_FILE" 2>&1
  STATUS=$?
else
  STATUS=127
  echo "claude CLI not found" >>"$LOG_FILE"
fi

if [ $STATUS -ne 0 ]; then
  heartbeat "weekly-social run FAILED (exit $STATUS). No batch was delivered this Friday — check $LOG_FILE on Badi's Mac."
fi
exit $STATUS
