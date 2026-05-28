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

Each agent has its own folder under the agents prefix:
```
nickai-cards-feed/
└── agents/
    └── {agentId}/
        ├── profile.json    # name, builder, activeSince, nodes (rarely changes)
        ├── snapshot.json   # current cumulative totals (overwritten each run)
        └── runs/
            └── {runId}.json   # per-run record incl. individual trades (append-only)
```

The pipeline reads `profile.json` + `snapshot.json` today. `runs/*.json` is
forward-compatible — when "best trade" cards arrive, the data is already there
with no schema migration. The authoritative typed schemas are in
`data/agent-output.ts`; the curated single-file contract (for testing) is in
`data/agent-input.ts`, and `data/agents.template.json` is a copy-paste example.

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

**Production setup — Cloudflare R2 (S3-compatible).** Set in `.env.local`:
```
R2_AGENTS_PREFIX=s3://nickai-cards-feed/agents/
S3_ENDPOINT=https://<account_id>.r2.cloudflarestorage.com
AWS_REGION=auto
AWS_ACCESS_KEY_ID=<r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<r2-secret>
```
Note the prefix ends in `/`. Required permissions on the R2 API token:
**Object Read** on the agents prefix for the generator; the NickAI producer
needs **Object Write** on the same prefix. For real AWS S3, leave `S3_ENDPOINT`
unset and use the bucket's region. Never commit credentials — `.env.local`
is gitignored.

## Running it

From the repo root:

```bash
# PRODUCTION (R2 structured mode): with $R2_AGENTS_PREFIX set in env you can
# just run `bun run cards`. Otherwise pass --from-r2 explicitly:
bun scripts/generate-cards.ts --from-r2 --top-n=5

# Curated JSON mode (testing / one-off):
bun scripts/generate-cards.ts --data=data/incoming/agents.json

# Preview the plan without rendering or posting anything:
bun scripts/generate-cards.ts --from-r2 --dry-run
bun scripts/generate-cards.ts --data=... --dry-run

# Convenience scripts (auto-pick R2 mode if $R2_AGENTS_PREFIX is set):
bun run cards         # PNG + MP4
bun run cards:png     # PNG only (fast)
```

### Flags
- `--from-r2[=<prefix>]` — structured R2 mode. With no `=`, reads
  `$R2_AGENTS_PREFIX`. Lists snapshots since the watermark, ranks by
  `profitPercent`, takes the Top N.
- `--top-n=<n>` — number of top agents to render in R2 mode (default 5; also
  configurable via `$TOP_N`).
- `--full-pull` — ignore the watermark this run (treats every snapshot as
  fresh). Useful after a schema change or for a "rebuild everything" pass.
- `--data=<source>` — curated single-file mode. Source can be `s3://`,
  `https://`, or a local path. Wins over R2 mode if set.
- `--slug=<slug>` — render just one agent (from whatever source).
- `--png` / `--mp4` — limit output to one format. PNG-only is much faster.
- `--force` — rebuild everything, ignoring the build ledger (hashes).
- `--dry-run` — print the plan; write nothing, post nothing, don't advance
  the watermark.
- `--no-slack` — render only; never post (also auto-skipped if Slack env unset).

### Recommended flow for a real run
1. `--dry-run` first to see what's new vs unchanged.
2. If it looks right, run without `--dry-run` to render + post.

## Outputs
- Files land in `out/<slug>.png` and `out/<slug>.mp4` (the `out/` dir is
  gitignored — the media is not committed).
- Each built card is recorded in `data/cards-built.json` with a content hash,
  build time, output paths, and the Slack permalink (`publishedTo`).

## How the pull-log decides what to fetch (R2 mode)
The pull-log at `data/pull-log.json` holds a single `lastPulledISO` watermark.
On each pull the pipeline:
1. Lists every `agents/*/snapshot.json` under the prefix.
2. Filters to those whose S3/R2 `LastModified` is **strictly after** the
   watermark.
3. For each fresh snapshot, loads the matching `profile.json`.
4. Ranks the result by `profitPercent` desc and slices to Top N.
5. After a successful (non-dry-run) pull, advances the watermark to the
   **max `LastModified` observed across ALL fresh agents** (not just the Top N)
   — otherwise non-selected agents would replay every run.

`--full-pull` ignores the watermark for that run. The pull-log is committed so
the watermark survives fresh clones.

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
