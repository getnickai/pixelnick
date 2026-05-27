---
name: nickai-performance-cards
description: >-
  Generate NickAI agent performance cards (social graphics) from agent data and
  post them to Slack. Use this whenever someone wants to create, render, refresh,
  or publish performance cards / agent cards / social cards for trading agents —
  including phrases like "make cards for these agents", "render the performance
  cards", "generate agent social graphics", "post the agent cards to Slack",
  "turn this agents.json into cards", or any time they hand over agent stats
  (PNL, profit %, runs, trades) and want a shareable PNG/MP4. This is the
  pixelnick card pipeline; reach for it even if the user doesn't say "pixelnick".
---

# NickAI Performance Cards

Render NickAI trading-agent performance cards to **PNG** (a still of the final
frame) and **MP4** (a 5-second animation) from a JSON data feed, then post the
new/changed ones to Slack. This skill drives the pipeline in the `pixelnick`
repo (`getnickai/pixelnick`).

## When to use this
Anyone who has agent stats and wants shareable graphics. Typical asks: "generate
cards for this week's top agents", "re-render the cards with updated numbers",
"post the agent cards to #tests-agents-output". You give it a data file; it
renders and publishes.

## The mental model
```
agents.json  ──►  render PNG + MP4  ──►  post to Slack  ──►  ledger records it
(raw data)        (only new/changed)     (one message)       (so reruns skip it)
```
Three things make this safe to run repeatedly:
- **Raw in, formatted out** — you supply numbers and ISO timestamps; the adapter
  formats currency, dates, and the relative "next run" countdown.
- **A content-hash ledger** (`data/cards-built.json`) so a rerun only rebuilds
  agents whose real data changed — not every agent every time.
- **Slack posting is idempotent per build** — a card posts when (and only when)
  it (re)renders.

## Prerequisites (one-time)

1. **Repo + deps**. From the `pixelnick` checkout: `bun install`. The render
   packages (`@remotion/bundler`, `@remotion/renderer`, `@remotion/tailwind-v4`,
   `@remotion/google-fonts`) are already in `package.json`.
2. **Slack (only needed to post)**. A Slack app with bot scopes `files:write` +
   `chat:write`, installed to the workspace, with the bot **invited to the target
   channel**. Put the credentials in `.env.local` (gitignored) at the repo root:
   ```
   SLACK_BOT_TOKEN=xoxb-...
   SLACK_CHANNEL_ID=C09Q2AVTCCF
   ```
   `bun` auto-loads `.env.local`. If these are unset, rendering still works and
   Slack posting is skipped automatically. Never put the token in chat, code, or
   a committed file.

## The input data

A JSON **array**, one object per card. The reference template is
`data/agents.template.json`; the authoritative typed contract (with per-field
docs) is the `AgentInput` type in `data/agent-input.ts`. Read those rather than
guessing.

**Send raw values, not formatted strings.** Numbers as numbers, dates as ISO
8601. The pipeline does all display formatting.

Required per object: `agentName`, `pnl`, `profitPercent`, `runs`, `trades`,
`nodes`. Optional (with defaults): `builderName`, `builderAvatarUrl`,
`activeSinceISO`, `nextRunISO`, `slug`, `slide`.

```json
[
  {
    "agentName": "BTC Momentum Scalper",
    "pnl": 8841.40,
    "profitPercent": 41.12,
    "runs": 48,
    "trades": 132,
    "nodes": 14,
    "builderName": "Franklin",
    "builderAvatarUrl": "https://cdn.getnick.ai/avatars/franklin.png",
    "activeSinceISO": "2026-01-04T00:00:00Z",
    "nextRunISO": "2026-05-27T19:30:00Z",
    "slug": "btc-momentum-scalper"
  }
]
```

**About `slug`**: it's the card's identity — the output filename and the ledger
key. If a producer emits a stable internal agent ID as `slug`, renaming the agent
won't create a duplicate card. If omitted, it's derived from `agentName` (so a
rename looks like a brand-new agent).

Drop the file at `data/incoming/agents.json` (gitignored, the convention for
real data) or anywhere you like and point `--data=` at it.

## Running it

From the repo root:

```bash
# Render every agent in the feed (PNG + MP4) and post new/changed to Slack:
bun scripts/generate-cards.ts --data=data/incoming/agents.json

# Preview the plan without rendering or posting anything:
bun scripts/generate-cards.ts --data=data/incoming/agents.json --dry-run

# Convenience scripts (use the bundled mock data):
bun run cards         # all mock agents, PNG + MP4
bun run cards:png     # mock agents, PNG only (fast)
```

### Flags
- `--data=<path>` — read agents from a JSON file. Without it, uses the bundled
  `data/mock-agents.ts` sample data.
- `--slug=<slug>` — build just one agent.
- `--png` — PNG only (skip the slower MP4 render).
- `--mp4` — MP4 only.
- `--force` — rebuild everything, ignoring the ledger.
- `--dry-run` — print what would build/skip; write nothing, post nothing.
- `--no-slack` — render only; never post (also auto-skipped if env unset).

### Recommended flow for a real run
1. `--dry-run` first to see what's new vs unchanged.
2. If it looks right, run without `--dry-run` to render + post.

## Outputs
- Files land in `out/<slug>.png` and `out/<slug>.mp4` (the `out/` dir is
  gitignored — the media is not committed).
- Each built card is recorded in `data/cards-built.json` with a content hash,
  build time, output paths, and the Slack permalink (`publishedTo`).

## How the ledger decides what to build
Per agent, the pipeline compares a content hash against the ledger:
| Situation | Action |
|---|---|
| slug not in ledger | build (new) |
| hash changed (PNL/%/runs/trades/nodes/name/builder/activeSince) | rebuild (updated) |
| hash same + output files exist | skip |
| hash same but files missing (e.g. fresh clone) | rebuild |

The hash deliberately **excludes `nextRun`** — it's a relative countdown that
changes every run, and hashing it would force needless rebuilds. A card only
rebuilds when real performance data moves.

## Slack post format
Each new/changed card posts as one message with the PNG and MP4 attached, with a
caption like:
```
*BTC Momentum Scalper*
+$8,841.40 PNL  ·  41.12% profit  ·  48 runs, 132 trades
Built by Franklin  ·  14 nodes
Try it for free now: getnick.ai
```
House style: no em-dashes, no hashtags; the CTA is exactly
`Try it for free now: getnick.ai`. Caption logic lives in
`scripts/slack.ts` (`buildCaption`) if you need to adjust it.

## Architecture notes (for editing the pipeline)
- `scripts/generate-cards.ts` — orchestrator: load data → diff against ledger →
  bundle Remotion once → render PNG/MP4 per agent → post to Slack → update ledger.
- `data/agent-input.ts` — the `AgentInput` contract + `toCardData()` adapter
  (date/countdown formatting, slug derivation, avatar resolution).
- `scripts/ledger.ts` — hashing + the build-plan diff.
- `scripts/slack.ts` — Slack Web API upload (getUploadURLExternal → PUT bytes →
  completeUploadExternal) + caption builder.
- `remotion/` — headless render setup: `Root.tsx` registers the composition,
  `compositions/performance-card/card-with-font.tsx` loads Rethink Sans so the
  render matches the browser, `style.css` is the Tailwind v4 entry.
- The card component itself (`remotion/compositions/performance-card/`) is shared
  with the Next.js app and unchanged by this pipeline.

### Gotchas already solved (don't reintroduce)
- `renderMedia` takes `outputLocation`, **not** `output` (that's `renderStill`).
  Wrong key = frames render but no file is written.
- The card references assets as `/figma/...` (Next.js serves `public/` at root),
  but Remotion serves `public/` under `/public/...`. The script mirrors `public/`
  into the bundle root so those paths resolve headlessly.
- Fonts: the headless render loads Rethink Sans via `@remotion/google-fonts`;
  without it, text falls back to a default face.
