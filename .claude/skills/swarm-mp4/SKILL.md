---
name: swarm-mp4
description: >-
  On-demand render of Swarm Arena share cards to MP4 (and PNG) from the live R2
  agent output, for download — NOT posted to Slack. Covers every Swarm Arena
  card design: agent cards (classic + the model-card design), the leaderboard
  (classic + the model-design leaderboard), the "Market vs Agents"
  consensus/games card (the design for UPCOMING game/match cards), and the
  settled "won pick" result card (the consensus design after the whistle: final
  score + the swarm's pick + how much the agents made). Use whenever Badi asks to
  "generate an mp4", "make a video of the leaderboard", "render the consensus card
  for <game>", "render the won pick / result card for <game>", "card for a game
  the agents won", "render GROK as an mp4", "swarm arena card video", "do the games
  for today as mp4", or wants a downloadable clip of any Swarm Arena card. This is
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
- **Consensus / games card** (upcoming fixtures): refresh the feed →
  `bun scripts/swarm-consensus.ts` (writes `public/swarm-arena-cards/consensus.json`).
- **Result / "won pick" card** (settled fixtures): refresh the feed →
  `bun scripts/swarm-results.ts` (writes `public/swarm-arena-cards/results.json`).

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
| **Games — consensus "Market vs Agents"** (animated) | per-fixture/market, UPCOMING; slot-machine + blur-edge reveal | `bun scripts/swarm-consensus.ts` then `bun scripts/render-consensus.ts --game="<substr>" [--market=btts\|totals\|moneyline] [--all] [--no-mp4] --out=out/consensus` |
| **Result — "won pick"** (animated) | the consensus design after the whistle, SETTLED: final score in the teams row, HIT/MISS chip, "agents banked +$X" payout (slot reveal) + per-agent $ bars | `bun scripts/swarm-results.ts` then `bun scripts/render-results.ts --game="<substr>" [--market=btts\|totals\|moneyline] [--all] [--no-top] [--no-mp4] --out=out/results` |
| **Agent — classic editorial** (broadcast still) | the original `swarm-card` engine agent card | `bun scripts/generate-swarm-cards.ts --slug=agent-<handle> --mp4 --no-archive` |
| **Leaderboard — classic** (still) | the original engine leaderboard | `bun scripts/generate-swarm-cards.ts --slug=leaderboard --mp4 --no-archive` |

- **Animated designs** (model card, model leaderboard, consensus) render their
  full native choreography for MP4 (the script plays `durationInFrames`, not
  `--seconds`). **Still designs** (classic agent/match/leaderboard) hold for
  `--seconds` (default 5).
- The model card + model leaderboard are **agent/ranking only**; game/match
  cards are the consensus design (see below). Slugs: model agent =
  `model-<handle>`, model leaderboard = `leaderboard-model`, consensus =
  `consensus-<market>-<homeCode>-<awayCode>`.

## The games/match card IS the consensus card
**For any game/match, always render the consensus "Market vs Agents" design**
(the design built 2026-06-12, STA-421). The old classic Elo match-preview card
(`swarm-card` "match" / `generate-upcoming-cards.ts`) is **deprecated — do not
use it** for game cards, even as a fallback. Badi's standing instruction: the
new consensus design is the only games card.

### Two modes of the SAME design (consensus vs Elo preview)
The consensus card is **Market vs Agents**, so the full body only renders when
the match-reader agents have taken a position on the game. `swarm-consensus.ts`
aggregates the 8 `s1-match-reader-<model>` agents' R2 runs; a fixture with **zero
agent positions produces no consensus record**.

**When a game has no agent coverage, render the SAME design in its Elo preview
mode** — never fabricate an agents side, and never fall back to the old card:

```bash
bun scripts/render-consensus.ts --preview-game="<substr>" --out=out/consensus
```

This pulls the fixture + Elo from `/api/swarm-upcoming` and renders the
consensus card's **preview branch** (`data.preview`): same shell/crests/footer,
but the body is a 3-way win-probability panel + both teams' Elo ratings + an
honest "agent picks land closer to kickoff" note (slug
`consensus-preview-<homeCode>-<awayCode>`). Use the normal `--game=` path the
moment the agents cover it (check `consensus.json`). Example 2026-06-12: USA vs
Paraguay had 6/8 agents → full consensus card; Canada vs Bosnia had zero coverage
to kickoff → Elo preview of the same design.

`render-consensus.ts` selection: `--game=<substr>` (repeatable) matches on the
record's `game`; with several markets per game it keeps the **highest-edge** one
by default (`--no-top` to render all markets; `--market=` to force one). `--all`
renders every record in the feed. If unsure which game maps to a record, read
the freshly built `public/swarm-arena-cards/consensus.json`.

## The won-pick / result card (the consensus design, settled)
For a game that has **already finished**, render the **result card** — the same
shell/crests/footer as the consensus card, but the center Market-vs-Agents block
is replaced with the after-the-whistle story:
- the **final score** sits in the teams row (where "VS" was), with an `FT` badge
  and the winner emphasized,
- a **HIT/MISS chip** for the swarm's pick (green hit / red miss), and
- the **payout** — an "agents banked +$X" hero (slot-machine reveal) + a
  per-agent `$` PnL breakdown ("how much they made").

`swarm-results.ts` reads the 8 agents' settled `closed_trades` from R2, groups
them by (game × market × selection), and joins each to its **final score** in
the `matches` mirror (`status=FT`). **Honest-data rule:** a pick is only emitted
when (a) agents actually held a settled position on it and (b) the fixture has a
real final score — no score → no card. Voids and malformed rows are skipped, so
`agentsN/8` reflects only the agents that genuinely settled win/loss on the pick.

`render-results.ts` selection mirrors `render-consensus.ts`: `--game=<substr>`
(repeatable) matches the record's `game`; with several markets per game it keeps
the **biggest-payout** one by default (`--no-top` for all markets; `--market=` to
force one); `--all` renders every settled pick. By default only the swarm's
**winning** picks are in the feed — pass `--include-losses` to `swarm-results.ts`
to also build cards for picks they got wrong. Slug:
`result-<market>-<homeCode>-<awayCode>`. Read `public/swarm-arena-cards/results.json`
to see which games/markets settled. Example 2026-06-14: USA 4–1 Paraguay, the
swarm's Over 2.5 hit and 5/8 agents banked +$564.

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
# a settled "won pick" result card for a finished game
bun scripts/swarm-results.ts
bun scripts/render-results.ts --game="usa vs paraguay" --out=out/results
```
