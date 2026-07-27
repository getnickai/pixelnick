---
name: run-pixelnick
description: Build, run, and drive the pixelnick Next.js app (the NickAI / Swarm Arena card design dashboards). Use when asked to start pixelnick, run the dev server, preview or screenshot a card design (/static or /motion), smoke-test the routes, or look at the running app.
---

pixelnick is a **Next.js 16 (Turbopack) web app** that serves NickAI's card
**design dashboards**: `/static/<id>` renders a live, data-complete card in a
preview pane; `/motion/<id>` is the animated Remotion Player; `/embed/...`
serves a chrome-free pixel-accurate card. There is no `chromium-cli` in this
container, so you drive the app with **`.claude/skills/run-pixelnick/driver.sh`**,
which screenshots routes via the pre-installed Chromium at `/opt/pw-browsers`.

> The card **render/publish pipelines** (turning agent JSON into PNG/MP4 and
> posting to Slack) are a different surface with their own skills —
> `nickai-performance-cards` and `swarm-mp4`. This skill is only about running
> and looking at the **web app**.

All paths below are relative to the repo root (`pixelnick/`).

## Prerequisites

Runtimes are already present in this container: **Bun 1.3** and **Node 22**.
No `apt-get` was needed — Chromium ships at `/opt/pw-browsers/chromium-*/`
(`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers`). Do **not** run `playwright
install`.

## Setup

Install deps once after a fresh clone:

```bash
bun install
```

No env vars are required to run and screenshot the **design dashboards** —
they render from bundled fonts and inline sample data. (The `/api/*` deck
routes need R2/Postgres creds and fail without them — see Gotchas.)

## Run (agent path) — FIRST

**1. Launch the dev server in a persistent background context.** A server
backgrounded from inside a one-shot shell gets reaped when that shell exits
(see Gotchas), so use the Bash tool's `run_in_background: true`:

```bash
bun run dev > /tmp/pixelnick-dev.log 2>&1 &
```

It listens on `http://localhost:3000` and is ready in well under 10s (first
route compile is ~7s on demand).

**2. Drive it with the driver.** Screenshots land in `OUT` (default
`<repo>/.driver-out`; override with `OUT=…`):

```bash
D=.claude/skills/run-pixelnick/driver.sh

$D wait                          # block until the server answers
$D smoke                         # curl every /static/<id>, print HTTP codes
$D routes                        # list the known /static routes
$D shot /static/consensus-card   # screenshot one route → OUT/static_consensus-card.png
$D shot /static/performance-card perf 900,1300   # custom name + WxH
$D gallery                       # screenshot all 13 /static cards at card aspect
```

`smoke` exits non-zero if any static route is not 200. **Actually open the
PNGs** — a written file is not proof the card rendered.

### The route space (verified)

`/static/<id>` — full dashboard chrome + live card preview. All 13 ids:

```
performance-card   workflow-template-card   swarm-arena-model-card
consensus-card     result-card              swarm-arena-leaderboard-card
matchday-card      matchday-card-analysis-start   matchday-card-analysis-final
game-pick-card     game-pick-card-analysis-start  game-pick-card-analysis-final
result-portfolio-card
```

`/embed/performance-card` — the **chrome-free, pixel-accurate** card at its
native 650×1136 (the exact `<AiReadyCard />` the Remotion pipeline renders).
Best target when you want the card alone, not the dashboard. Capture at
`700,1200`:

```bash
$D shot /embed/performance-card card 700,1200
```

`/motion/<id>` — animated Remotion Player preview (18 ids in
`remotion/manifest.ts`, e.g. `performance-card`, `swarm-intro`,
`nickai-social-card`). The page shell renders, but the Player canvas is often
blank in a headless single-frame capture (see Gotchas).

## Run (human path)

```bash
bun run dev      # → http://localhost:3000, leave it running; Ctrl-C to stop
```

`/` client-redirects to `/static/performance-card`. Open `/static` to browse
the card gallery, `/motion` for the animated previews, `/engine` for the
live-data surfaces. Headless, use the driver instead.

## Gotchas

- **A backgrounded server must outlive the launching shell.** `nohup` and even
  `setsid bun run dev &` get **reaped** when the launching tool-call's process
  group is torn down (observed: the parent exits 144 and the child dies before
  writing a log). Launch via the harness's `run_in_background` (agent) or a
  real terminal you leave open (human). `driver.sh serve` deliberately does
  **not** self-launch for this reason — it prints instructions and points at
  `driver.sh wait`.
- **Chromium prints scary stderr that is harmless here:**
  `Failed to connect to the bus` (dbus) and `CreatePlatformSocket() failed:
  Address family not supported` (no IPv6 in the sandbox). The screenshot is
  still written — check for the output file, not a clean stderr. The driver
  swallows this noise.
- **`/motion/<id>` Player renders blank offline.** The Remotion Player fetches
  fonts/assets over the network (`@remotion/google-fonts`); with no egress
  those requests throw `NetworkError: A network error occurred` (visible in the
  dev log as `[browser] ⨯ unhandledRejection`) and a red **"1 Issue"** dev
  badge appears. The page chrome (nav, breadcrumb, Export button, player frame)
  still renders. `/static/<id>` does **not** have this problem — it uses bundled
  fonts, so prefer `/static` and `/embed` for reliable card captures.
- **`/api/trading-deck`, `/api/swarm-deck`, `/api/swarm-upcoming` return 500
  with no creds** — this is expected, not a bug. They reach R2/S3
  (`getaddrinfo ENOTFOUND …s3…amazonaws.com`) or need `SWARM_DB_URL`. The card
  dashboards don't depend on them.
- **Cards are wider than a 900px window** (native ~650px @2x). At the dashboard
  chrome width the card clips on the right. Use `/embed/performance-card` at
  `700,1200`, or widen the window, for a full-card capture.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `driver.sh shot` says "server not up" | Launch `bun run dev` in the background (see Run step 1), then `driver.sh wait`. |
| Screenshot file missing after `shot` | Chromium binary moved — set `CHROME=$(ls -d /opt/pw-browsers/chromium-*/chrome-linux/chrome \| head -1)`. |
| `/motion/*` capture is a dark/blank card | Expected offline (network fonts). Use `/static/<id>` or `/embed/performance-card` instead. |
| Port 3000 busy | `PORT=3001 bun run dev …` then `PORT=3001 $D wait`. |

## The driver

`.claude/skills/run-pixelnick/driver.sh` — pure bash, no deps. Commands:
`serve` (guidance), `wait`, `shot <route> [name] [WxH]`, `gallery`, `smoke`,
`routes`. Env overrides: `PORT`, `OUT`, `CHROME`, `LOG`.
