---
name: swarm-mp4
description: >-
  On-demand render of Swarm Arena share cards to MP4 (and PNG) from the live R2
  agent output, for download — NOT posted to Slack. Covers every Swarm Arena
  card design: agent cards (classic + the model-card design), the leaderboard
  (classic + the model-design leaderboard), the match/Elo preview, and the
  "Market vs Agents" consensus/games card. Use whenever Badi asks to "generate
  an mp4", "make a video of the leaderboard", "render the consensus card for
  <game>", "render GROK as an mp4", "swarm arena card video", "do the games for
  today as mp4", or wants a downloadable clip of any Swarm Arena card. This is
  the swarm-arena card pipeline in the `pixelnick` repo — distinct from the
  performance-card / trading-card pipeline (see nickai-performance-cards).
  Reach for this even if Badi doesn't say "pixelnick".
---

# Swarm Arena Card MP4 (on demand)

Render any Swarm Arena card to **MP4** (h264) + **PNG** (settled final frame)
from the live R2 agent output, so Badi can download a clip. Render-only: this
never posts to Slack and (by default) never touches the committed
`public/swarm-arena-cards/history/` archive.

This is the **swarm-arena** pipeline. It is NOT the performance/trading-card
pipeline (`generate-cards.ts` / `bun run cards`, the `nickai-performance-cards`
skill). Don't cross the wires.

## Which checkout to run from
Every design is on `main` (PR #30 merged 2026-06-12) — render from any
up-to-date `main` checkout. Override the repo dir with `PIXELNICK_DIR`.

**Pull `main` first.** The design IS the code: each animated card renders its
real source-of-truth React component, so a stale checkout renders a stale
design. `git -C <dir> pull` before rendering to get the latest of every design.

> ⚠️ Check the branch before running — the shared `~/claude/pixelnick` checkout
> is often a stale divergent branch. Verify with
> `git -C <dir> branch --show-current` (want `main`) and pull before rendering.

## Prerequisites
- `bun` on PATH; run from the repo root so `.env.local` auto-loads.
- `.env.local` must have the R2 read creds + the mirror DSN (never print values):
  `S3_ENDPOINT`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
  (R2, for agent snapshots) and `SWARM_DB_URL` (the swarm-arena Postgres mirror,
  for fixture kickoffs in the consensus feed). If a fresh worktree is missing
  `.env.local`, copy it from a checkout that has it.
- Remotion deps are already in `package.json`. Headless Chromium downloads its
  shell on the first render (slowish) — this is why it can't run on Vercel.

## The two-step flow: refresh data, then render
Every render reads a data file. **Always refresh it immediately before
rendering** — a stale file silently renders old numbers.

- **Deck-based cards** (agent cards, both leaderboards, match): refresh the
  live deck → `bun scripts/swarm-adapter.ts` (writes `public/swarm-arena-cards/live-deck.json`).
- **Consensus / games card**: refresh the feed → `bun scripts/swarm-consensus.ts`
  (writes `public/swarm-arena-cards/consensus.json`).

Output lands in `out/…`. `out/` is gitignored. After rendering, report the
absolute path(s) and offer to reveal (`open out/<dir>`).

## The design → command matrix
All commands run from the render workspace above. Add `--mp4` for video
(omit for PNG-only, faster). `--no-archive` keeps one-off clips out of the
committed `history/` dir — **use it for on-demand downloads.**

| Design | What it is | Command |
|---|---|---|
| **Agent — model card** (Onur's design, animated) | per-agent card, the `/motion/swarm-arena-model-card` choreography | `bun scripts/swarm-adapter.ts` then `bun scripts/generate-swarm-cards.ts --deck=public/swarm-arena-cards/live-deck.json --card=model --mp4 --no-archive [--slug=model-<handle>] --out=out/swarm-model` |
| **Leaderboard — model design** (animated) | the ranking in the model-card design language; bottom-up reveal | `bun scripts/swarm-adapter.ts` then `bun scripts/generate-swarm-cards.ts --deck=public/swarm-arena-cards/live-deck.json --card=leaderboard --mp4 --no-archive --out=out/swarm-model` → `leaderboard-model.{png,mp4}` |
| **Games — consensus "Market vs Agents"** (animated) | per-fixture/market; slot-machine + blur-edge reveal | `bun scripts/swarm-consensus.ts` then `bun scripts/render-consensus.ts --game="<substr>" [--market=btts\|totals\|moneyline] [--all] [--no-mp4] --out=out/consensus` |
| **Agent — classic editorial** (broadcast still) | the original `swarm-card` engine agent card | `bun scripts/generate-swarm-cards.ts --slug=agent-<handle> --mp4 --no-archive` |
| **Match — classic Elo preview** (still) | head-to-head Elo-only preview (no agent consensus) | per-fixture PNG: `bun scripts/generate-upcoming-cards.ts --n=5` · single from deck: `--slug=match` |
| **Leaderboard — classic** (still) | the original engine leaderboard | `bun scripts/generate-swarm-cards.ts --slug=leaderboard --mp4 --no-archive` |

- **Animated designs** (model card, model leaderboard, consensus) render their
  full native choreography for MP4 (the script plays `durationInFrames`, not
  `--seconds`). **Still designs** (classic agent/match/leaderboard) hold for
  `--seconds` (default 5).
- The model card + model leaderboard are **agent/ranking only**; the classic
  engine still owns the match still. Slugs: model agent = `model-<handle>`,
  model leaderboard = `leaderboard-model`, consensus = `consensus-<market>-<homeCode>-<awayCode>`.

## Consensus / games card — honest-data rule
The consensus card is **Market vs Agents**: it only renders a game if the
match-reader agents actually took positions on it. `swarm-consensus.ts`
aggregates the 8 `s1-match-reader-<model>` agents' R2 runs; a fixture with **zero
agent positions produces no record**, and `render-consensus.ts` will skip it
with a warning. **Do not fabricate an agents side** — if a game isn't in
`consensus.json`, the agents haven't covered it yet (they tend to pick up a
fixture closer to kickoff). Example seen 2026-06-12: Canada vs Bosnia had zero
coverage at midday while USA vs Paraguay had 6/8 — only the latter was
renderable. When a requested game is missing, say so and offer the classic
Elo match preview (honest, market/Elo-based) instead.

`render-consensus.ts` selection: `--game=<substr>` (repeatable) matches on the
record's `game`; with several markets per game it keeps the **highest-edge** one
by default (`--no-top` to render all markets; `--market=` to force one). `--all`
renders every record in the feed. If unsure which game maps to a record, read
the freshly built `public/swarm-arena-cards/consensus.json`.

## Slug / handle notes
- Handles come from `data/swarm-identity.ts` / the deck's `agents[].handle`
  (e.g. `GROK`, `GPT`, `CLAUDE`, `GEMINI`, `KIMI`, `DEEPSEEK`, `QWEN`, `MISTRAL`).
  Single-agent slugs: classic = `agent-grok`, model = `model-grok`.
- The live deck dedupes colliding handles (the upstream feed has produced two
  "GPT"s) and drops agents with no data, so the leaderboard may show fewer than
  8 rows even though the subtitle says "8 LLMs" (fixed editorial copy).
- A wrong `--slug` renders nothing and exits 1 — don't guess; read the deck.

## Gotchas
- **Render time:** first render bundles Remotion + downloads the headless shell
  (slow); later renders are faster. Each card is a separate headless render —
  give the command a generous timeout and don't assume it hung.
- **Stale data file:** the #1 footgun. Re-run `swarm-adapter` / `swarm-consensus`
  right before rendering. The deck is only as fresh as the last adapter run.
- **Headless asset paths:** bare `/swarm-arena-cards/...` img srcs 404 in CLI
  renders (they only resolve in the browser Player). Compositions wrap them in
  `staticFile()`, and the generators `cpSync` `public/` into the bundle so they
  resolve headlessly. If a new card shows missing logos in the PNG, that's the
  cause.
- **Live = now (v1).** The deck/feed are point-in-time "now". Timeline/historical
  MP4s (the gallery's `?at=` date picker) are not wired into these scripts yet.
- **No Slack.** Posting is the daily `swarm-daily.ts` cron's job, not this skill.
- Don't print or echo `.env.local` values when checking creds — key names only.
```bash
# canonical full run (model leaderboard + the games card for a fixture)
cd "${PIXELNICK_DIR:-$HOME/claude/pixelnick}"   # any up-to-date `main` checkout
bun scripts/swarm-adapter.ts
bun scripts/generate-swarm-cards.ts --deck=public/swarm-arena-cards/live-deck.json \
  --card=leaderboard --mp4 --no-archive --out=out/swarm-model
bun scripts/swarm-consensus.ts
bun scripts/render-consensus.ts --game="usa vs paraguay" --out=out/consensus
```
