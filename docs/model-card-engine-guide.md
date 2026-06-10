# Swarm Arena Model Card — where to iterate (guide for Onur)

Your model-card design now ships in the live **kit** and **gallery**. This doc
tells you **where to make changes** so your improvements actually go live and we
don't end up maintaining two diverging copies.

## TL;DR — make changes in ONE place

**Edit `renderModelCard(agent)` in `public/swarm-arena-cards/card-engine.js`.**

That function is the **production card** — it's what renders in the kit, in the
live gallery, and in the downloaded PNGs, from real agent data. It's the single
source of truth now.

Your original React files are **reference only** going forward:
- `components/swarm-arena-model-card.tsx`
- `remotion/compositions/swarm-arena-model-card/`
- the `/static/swarm-arena-model-card` and `/motion` preview routes

They are NOT used by the product anymore. If you keep iterating there, those
changes **won't ship** and the two versions will drift — that's exactly the
duplication we want to avoid. Treat them as a sketchpad at most; the moment a
change is "real," put it in `renderModelCard`.

## How to edit it (it's easy — no React, no build)

`renderModelCard` is one self-contained function that returns an HTML string
with inline CSS. To change the design:

1. Open `public/swarm-arena-cards/card-engine.js`, find `renderModelCard`.
2. Edit the inline styles / markup in the `inner` template literal.
3. Refresh the kit (`/swarm-arena-cards/index.html` → Agent → Layout → **Model**)
   to see it instantly. No build step.

Keep these conventions so it stays correct everywhere:
- **Units in `em`** (the card root font-size = `16px × --sa-u`, so it scales to
  portrait / story / square automatically). Don't hard-code `px`.
- **Set `line-height`** on any text block (the kit's stage zeroes line-height;
  the wrapper sets a base `1.2`, but if you add a tightly-stacked group give it
  its own line-height so it can't collapse).
- Colours are your exact hexes (`#110d0b→#2f231e`, `#8bce6c`, `#f98051`,
  `#fff8ea`). Change them here.

## The data is live (don't hard-code values)

Everything that was hard-coded in your component is fed from the agent. Map:

| Card element   | Source (EngineAgent)                          |
|----------------|-----------------------------------------------|
| Model name     | `MODEL_NAMES[handle]` (GPT → "GPT 5.5")        |
| Model logo     | `MODEL_LOGOS[handle]` → `assets/models/*.svg`; falls back to a colour+code avatar |
| Season PNL     | `1000 × roiPct/100`                            |
| Profit %       | `roiPct`                                       |
| Equity / base  | `1000 × (1+roiPct/100)` / `1000`               |
| Pick Accuracy  | `pickPct`                                      |
| Record         | `record`                                       |
| Rank           | leaderboard position                           |
| Top / Latest picks | `pick` / `recent[]`                        |

**Add a model logo/name:** drop the SVG in `public/swarm-arena-cards/assets/models/`,
then add the handle to `MODEL_LOGOS` + `MODEL_NAMES` at the top of `renderModelCard`.

## Preview your changes

- Kit: `/swarm-arena-cards/index.html` → Agent → Layout → **Model** (pick any agent).
- Gallery: `/swarm-arena-cards/history.html` → "Agent card: Model" (all live agents).
- "↓ PNG" downloads the card.

## Known caveats (good first improvements)

- **Dark only** — the card keeps your dark palette regardless of the kit's
  Dark/Light toggle. A light variant would be a nice add.
- **Heavy effects simplified** — the progressive-blur band and `mix-blend`
  watermarks are toned down because `backdrop-blur`/`mix-blend` don't survive the
  in-browser PNG export (`html-to-image`). If you want them in the export we'd
  need a different render path.
- **Glass stats panel** is a touch denser than your roomier 1050px original
  (fitted to the 1136px frame) — loosen the spacing in `renderModelCard` if you
  like.

Questions or want a change paired up? Ping Badi/Claude. The golden rule:
**production design lives in `renderModelCard` — change it there.**
