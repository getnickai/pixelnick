# Swarm Arena Model Card — engine version (guide for Onur)

Your `SwarmArenaModelCard` design (the React component in
`components/swarm-arena-model-card.tsx` + the Remotion composition) has been
**ported into the framework-free card engine** so the live **kit** and
**gallery** can render it from real agent data — not hard-coded values.

This doc explains the engine version so you can use it as a base and keep
iterating. **Your React component stays the design source of truth**; the engine
copy mirrors it. When you change the design, ping Badi/Claude to mirror the
change here (or edit it directly — it's just one function).

## Where it lives

- **`public/swarm-arena-cards/card-engine.js`** → `renderModelCard(agent, opts)`.
  The engine is plain JS: every renderer takes a data object and returns an
  **HTML string**. No React, no build step — edit the file, refresh the page.
- Assets are the ones you added: `public/swarm-arena-cards/assets/models/*.svg`
  (model logos), `rank-hex.svg`, `rank-ribbon.svg`, `arrow-up.svg`, `logoshp-*`.

## How it's wired in

- **Kit** (`/swarm-arena-cards/index.html`): Agent card type → **Layout → "Model"**.
  Picks the agent from the left rail and renders your card live.
- **Gallery** (`/swarm-arena-cards/history.html`): the **"Agent card: Model"**
  control (defaults to Model). Every agent in the live deck renders as your card.
- Both render **client-side** from the live R2 deck via `window.SA`, and the
  "↓ PNG" button rasterizes the card for download.

## Data mapping (what's live vs hard-coded)

Everything that was hard-coded in your component is now fed from the agent:

| Card element        | Source (EngineAgent field)                    |
|---------------------|-----------------------------------------------|
| Model name          | `MODEL_NAMES[handle]` (e.g. GPT → "GPT 5.5")   |
| Model logo          | `MODEL_LOGOS[handle]` → `assets/models/*.svg`; falls back to the agent's colour+code avatar if no logo |
| Season PNL          | `1000 × roiPct/100`                            |
| Profit %            | `roiPct`                                       |
| Equity / base       | `1000 × (1+roiPct/100)` / `1000`               |
| Pick Accuracy       | `pickPct`                                      |
| Record              | `record` (or derived from signals×pickPct)     |
| Rank                | position in the ROI-sorted leaderboard         |
| Top Pick            | `pick.side` (+ `pick.edgePp`)                  |
| Latest Picks        | `recent[]` (side + realised PNL)               |
| Live Agent / World Cup | static tags                                |

**Adding a model logo/name:** drop the SVG in `assets/models/`, then add the
handle to `MODEL_LOGOS` and `MODEL_NAMES` at the top of `renderModelCard`.
Agents without a logo render a clean colour+code avatar — no breakage.

## How to iterate on the design

The card is built as a **flex column in `em` units** (the card root font-size =
`16px × --sa-u`, so it scales to any size: portrait / story / square). To tweak:
edit the inline styles in `renderModelCard`'s `inner` template. Refresh the kit
to see it instantly. Keep dimensions in `em` so it stays size-responsive.

## Known differences from your React version (by design)

- **Theme:** uses your exact dark palette (`#110d0b→#2f231e`, `#8bce6c`,
  `#f98051`, `#fff8ea`) and stays dark regardless of the kit's Dark/Light toggle
  — it's a branded dark card. If you want a light variant, we can add one.
- **Heavy effects:** the progressive-blur band and `mix-blend` watermarks are
  simplified — `backdrop-blur`/`mix-blend` don't survive the in-browser PNG
  export (`html-to-image`) reliably. The gradient, glass panel, rank hexagon,
  and logo watermark are kept.
- **Layout** is flex (fills the card height) rather than absolute pixel
  positions, so it adapts across the kit's sizes.

## Preview routes (your originals, untouched)

- `/static/swarm-arena-model-card` — your static React card
- `/motion/[componentId]` — your animated Remotion version

These remain the design reference; the engine version is the data-driven
production card used in the kit + gallery.
