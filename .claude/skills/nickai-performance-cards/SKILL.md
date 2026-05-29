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

There are two modes. Both end in the same render → ledger → Slack flow.

**Production — structured R2 mode** (the live flow):
```
NickAI agents ──write── R2 (profile/snapshot/runs JSONs per agent)
                        │
                        ▼
                  pull only new since last watermark
                        │
                        ▼
                  rank by profitPercent  →  Top N
                        │
                        ▼
                  render PNG + MP4  →  post to Slack  →  ledger
                        │
                        ▼
                  advance pull-log watermark
```

**Testing / one-off — curated JSON mode**:
```
agents.json (curated)  →  render PNG + MP4  →  post to Slack  →  ledger
```

Four things make repeated runs safe and efficient:
- **Raw in, formatted out** — producers supply numbers and ISO timestamps; the
  adapters format currency, dates, and the relative "next run" countdown.
- **Pull-log watermark** (`data/pull-log.json`) — in R2 mode, only snapshots
  whose `LastModified` is after the watermark are touched. The watermark
  advances to the max LastModified observed, so a run that finishes after R2
  writes new data still picks the new objects up next time.
- **Build ledger** (`data/cards-built.json`) — content-hash diff so a rerun
  only rebuilds agents whose performance data actually moved.
- **Slack post is tied to a build** — a card posts when (and only when) it
  (re)renders. No double-posts.

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

## The R2 layout NickAI writes to

The pipeline supports multiple **sources** (e.g. `nickai` and `swarm-arena`).
Each source has its own top-level namespace in the bucket:
```
nickai-cards-feed/
├── nickai/
│   └── agents/{workflowId}/
│       ├── profile.json    # name, builder, activeSince, nodes (rarely changes)
│       ├── snapshot.json   # current cumulative totals (overwritten each run)
│       └── runs/
│           └── {date}/
│               └── {executionId}.json   # per-run record incl. individual trades
└── swarm-arena/
    └── agents/{workflowId}/
        ├── profile.json
        ├── snapshot.json
        └── runs/{date}/{executionId}.json
```

Internal id is `workflowId` (NickAI's data model); the public-facing card copy
still says "agent" so the path segment stays `agents/`. The date partition
under `runs/` lets us list "today's runs" cheaply when trade-highlight cards
arrive — until then, the pipeline only reads profile + snapshot.

Authoritative typed schemas: `data/agent-output.ts`. The curated single-file
contract (for testing only) is in `data/agent-input.ts` with an example at
`data/agents.template.json`.

## The input data (curated mode — testing only)

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

## Where the feed comes from

The generator reads the feed from one of three sources (in precedence order):

1. **`--data=<source>`** — explicit. The source can be:
   - an **S3 URL**: `s3://nickai-cards-feed/input/agents.json` (production)
   - an **HTTPS URL**: `https://.../agents.json`
   - a **local path**: `data/incoming/agents.json` (testing; `data/incoming/` is
     gitignored, the convention for real local data)
2. **`$S3_FEED_URL`** — if set, used when no `--data=` is passed. This is the
   production default: point it at the S3 key NickAI writes to, then
   `bun run cards` just works.
3. **bundled mock data** — if neither is set.

**Production setup — Cloudflare R2 + multi-source.** Set in `.env.local`:
```
# List of sources to process (comma-separated). Drives everything below.
SOURCES=nickai,swarm-arena

# Per-source config. Source name -> uppercase, hyphens -> underscores:
#   nickai       -> R2_FEED_NICKAI / SLACK_CHANNEL_NICKAI / TOP_N_NICKAI
#   swarm-arena  -> R2_FEED_SWARM_ARENA / SLACK_CHANNEL_SWARM_ARENA / TOP_N_SWARM_ARENA
R2_FEED_NICKAI=s3://nickai-cards-feed/nickai/agents/
SLACK_CHANNEL_NICKAI=C09Q2AVTCCF        # #tests-agents-output
TOP_N_NICKAI=5

R2_FEED_SWARM_ARENA=s3://nickai-cards-feed/swarm-arena/agents/
SLACK_CHANNEL_SWARM_ARENA=C0AGQ57SM60   # #product-swarm-arena
TOP_N_SWARM_ARENA=10

# Optional human label override (defaults: smart title-case from source name).
# SOURCE_LABEL_NICKAI=NickAI
# SOURCE_LABEL_SWARM_ARENA=Swarm Arena

# R2 (S3-compatible) credentials — shared across sources.
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<r2-secret>
```
Permissions: R2 token needs **Object Read** on every configured prefix; the
NickAI producer needs **Object Write** on its source's prefix. Both source
Slack channels must have the bot invited (file uploads need channel
membership). For real AWS S3 instead of R2, leave `S3_ENDPOINT` unset and set
`AWS_REGION` to the bucket's region. Never commit credentials — `.env.local`
is gitignored.

## Running it

From the repo root:

```bash
# PRODUCTION: with SOURCES configured in env, this iterates every source,
# pulls each from R2, ranks Top N per source, renders + posts to each
# source's Slack channel:
bun run cards

# Curated JSON mode (testing / one-off — overrides SOURCES for this run):
bun scripts/generate-cards.ts --data=data/incoming/agents.json

# Preview the plan across all sources without rendering or posting:
bun run cards --dry-run
# (or explicitly:)
bun scripts/generate-cards.ts --dry-run

# Convenience scripts:
bun run cards         # PNG + MP4
bun run cards:png     # PNG only (fast)
```

### Flags
- `--data=<source>` — curated single-file mode (testing). Source can be
  `s3://`, `https://`, or a local path. Bypasses SOURCES for that run.
- `--slug=<slug>` — render just one agent (filters across whatever batch
  contains it).
- `--full-pull` — ignore the watermark this run (treats every snapshot as
  fresh). Useful after a schema change or a "rebuild everything" pass.
- `--png` / `--mp4` — limit output to one format. PNG-only is much faster.
- `--force` — rebuild everything, ignoring the build ledger (hashes).
- `--dry-run` — print the plan across all sources; write nothing, post
  nothing, don't advance any watermark.
- `--no-slack` — render only; never post (also auto-skipped if `SLACK_BOT_TOKEN`
  is unset).

Top N and channels are **per-source** via env (`TOP_N_<NAME>`,
`SLACK_CHANNEL_<NAME>`), not flags.

### Recommended flow for a real run
1. `--dry-run` first to see what's new vs unchanged.
2. If it looks right, run without `--dry-run` to render + post.

## Outputs
- Files land in `out/<source>/<slug>.png` and `out/<source>/<slug>.mp4`
  (the `out/` dir is gitignored — the media is not committed).
- Each built card is recorded in `data/cards-built.json` under key
  `<source>/<slug>` with content hash, build time, output paths, and the
  Slack permalink (`publishedTo`).

## How the pull-log decides what to fetch (per source)
The pull-log at `data/pull-log.json` is **keyed by source**:
```json
{
  "sources": {
    "nickai":      { "lastPulledISO": "...", "agentsSeen": { ... } },
    "swarm-arena": { "lastPulledISO": "...", "agentsSeen": { ... } }
  },
  "pullCount": 42
}
```
For each configured source, the pipeline:
1. Lists every `agents/{workflowId}/snapshot.json` under the source's prefix.
2. Filters to snapshots whose S3/R2 `LastModified` is **strictly after** that
   source's `lastPulledISO`.
3. Loads the matching `profile.json` per fresh agent.
4. Ranks by `profitPercent` desc and slices to that source's Top N.
5. After a successful (non-dry-run) pull, advances the source's watermark to
   the **max `LastModified` observed across ALL fresh agents in that source**
   (not just the Top N) — otherwise non-selected agents would replay every run.

`--full-pull` ignores every source's watermark for that run. The pull-log is
committed so watermarks survive fresh clones.

## How the ledger decides what to build
The build ledger at `data/cards-built.json` is keyed by `<source>/<slug>` so a
collision between e.g. `nickai/mag-7-rotator` and `swarm-arena/mag-7-rotator`
is impossible. Each entry stores its `source`, `slug`, content hash, build
time, output paths, and Slack permalink.

Per agent, the pipeline compares a content hash against the entry at
`ledgerKey(source, slug)`:
| Situation | Action |
|---|---|
| key not in ledger | build (new) |
| hash changed (PNL/%/runs/trades/nodes/name/builder/activeSince) | rebuild (updated) |
| hash same + output files exist | skip |
| hash same but files missing (e.g. fresh clone) | rebuild |

The hash deliberately **excludes `nextRun`** — it's a relative countdown that
changes every run, and hashing it would force needless rebuilds. A card only
rebuilds when real performance data moves.

## Slack post format
Each new/changed card posts as one message with the PNG and MP4 attached to
the source's Slack channel. Caption (with `via <SourceLabel>` so the reader
always knows the origin):
```
*BTC Momentum Scalper*
+$8,841.40 PNL  ·  41.12% profit  ·  48 runs, 132 trades
Built by Franklin  ·  14 nodes
via NickAI
Try it for free now: getnick.ai
```
House style: no em-dashes, no hashtags; the CTA is exactly
`Try it for free now: getnick.ai`. Caption logic lives in
`scripts/slack.ts` (`buildCaption`) if you need to adjust it.

## Scheduling (macOS, weekly)

For the first phase the pipeline runs from a laptop on a weekly schedule via
`launchd`. The wrapper at `scripts/run-weekly.sh` cd's into the repo, sets
PATH, runs the generator in R2 mode, and logs to
`~/Library/Logs/pixelnick-cards.log`. The plist at
`.claude/launchd/com.nickai.pixelnick-cards.plist` triggers it Monday 09:00
local; a sleeping Mac at trigger time just delays the run to next wake (it
doesn't skip the week).

Install (one time, only after R2 has been verified to work):
```bash
cp .claude/launchd/com.nickai.pixelnick-cards.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.nickai.pixelnick-cards.plist
launchctl start com.nickai.pixelnick-cards   # optional: trigger once now
```
Inspect:
```bash
tail -f ~/Library/Logs/pixelnick-cards.log
```
The hardcoded `/Users/badi/...` path in the plist needs editing for other
machines. Long-term plan: move this to GitHub Actions so the schedule runs
unattended regardless of whose laptop is open.

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
