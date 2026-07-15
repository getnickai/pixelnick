# Nick asset library

Reusable, production-ready brand and product assets for all channels — email, website, ads, and social — plus the source files that produced them so every asset is reproducible.

Organized by asset category:

- `product-shots/` — screenshots of the product (chat-to-workflow demo, research view, consensus workflow, complex canvas).
- `workflows/` — rendered workflow graphs (quant, alert, starter agents, component panels).
- `logos/` — venue and model logo rows, and individual logo files.
- `brand/` — brand elements (gradient banner).
- `sources/` — render HTML/CSS/JS, Python compositors, and TypeScript fixtures used to generate the assets.

Meta-agent chat **widgets** (the cards Nick renders inline in chat — price, portfolio, prediction markets, data readouts, trade confirmations) live in the app itself, not here, because there are 64 files (32 designs × light/dark) and the app serves them directly: `public/widget-library/{light,dark}/<slug>.png` (2× retina). Browse and download them in the pixelnick UI at **Engine → NickAI → Widget Library** (`/engine/nickai-widget-library`); each tile has copy-path and download. They are static captures of the REAL components from the nickai `/dev/cards` harness — re-capture after a design change with `scripts/capture-widget-library.ts` (see that file's header). Catalog + labels: `app/engine/nickai-widget-library/manifest.ts`.

The "email / customer.io CDN URL" column holds a permanent URL already hosted on customer.io's image CDN. It works in any channel (it is a plain HTTPS image URL), but it was created for email; see per-channel guidance below.

customer.io CDN prefix: `https://userimg-assets.customeriomail.com/images/client-env-208004/<id>.png`

## Manifest

### product-shots/

| Asset | File | Dimensions | Email / customer.io CDN URL | What it shows | Reuse across channels |
|---|---|---|---|---|---|
| Chat-to-workflow demo | `product-shots/demo-still.png` | 1000x640 | `.../01KXDSVFVNWRCSSTQG3PE0C105.png` | "Describe it, Nick builds it" onboarding shot. | Good for onboarding/activation across email, website hero, and social. |
| NVDA research view | `product-shots/research-still.png` | 1200x750 | `.../01KXDSVEV17EP6VS5M6RTNF3ZV.png` | Research / analysis view. | Use in any research/deep-dive messaging: email, website feature section, social. |
| LLM consensus workflow | `product-shots/llm-consensus.png` | 517x262 **(low-res)** | `.../01KXE7ZJQ3827XB03WS7TNQPYD.png` | Multi-model consensus (fan-out to models, then combine). | "Ask every model" messaging. **Re-export larger before ad/social use** (see low-res note). |
| 22-node workflow canvas | `product-shots/workflow-22.png` | 630x316 **(low-res)** | `.../01KXE22CFNVQ7J93RGPHRE9PQ5.png` | Complex / advanced workflow (icon nodes). | "Nick handles complexity" messaging. **Re-export larger before ad/social use.** |

### workflows/

| Asset | File | Dimensions | Email / customer.io CDN URL | What it shows | Reuse across channels |
|---|---|---|---|---|---|
| 12-node quant workflow | `workflows/workflow-quant.png` | 1120x353 | `.../01KXE090TEPEARA07HXS0CT4RY.png` | Systematic strategy (BTC Paper Trader). | Quant / systematic-strategy messaging across all channels. Re-render from source for any size. |
| 4-node alert workflow | `workflows/workflow-4node-alert.png` | 1120x908 | `.../01KXDYSGAZNN74VGXMAM95Z9SN.png` | Simple automation (price alert). | "Get started in a few nodes" messaging. Renamed from `workflow-nodes.png`. |
| Starter-agent trio | `workflows/starter-trio.png` | 4408x2982 | `.../01KXE7YR9NGMDFMG7DPYXD6VWF.png` | The 3 starter agents as workflows. 2k copy: `workflows/starter-trio-2k.png` (2000x1353). | High-res, safe for ads/social/print. Use the 2k copy for web/email to keep file size down. |
| Smart-alert workflow (component) | `workflows/workflow-smart-alert.png` | 4408x694 | not separately hosted | Component panel used to build the starter-trio composite. | Standalone hero for a single alert agent; re-composite via sources. |
| Morning-brief workflow (component) | `workflows/workflow-morning-brief.png` | 2028x1354 | not separately hosted | Component panel used to build the starter-trio composite. | Standalone hero for the morning-brief agent; re-composite via sources. |

### logos/

| Asset | File | Dimensions | Email / customer.io CDN URL | What it shows | Reuse across channels |
|---|---|---|---|---|---|
| Venues logo row | `logos/markets-row.png` | 1103x106 | `.../01KXE4SY05XP59YX2W3PZVTTF8.png` | Supported venues as black wordmarks (Coinbase, Hyperliquid, OKX, Kalshi, Polymarket). | "Supported venues" strip on any channel. Re-render from source for a subset or different order. |
| LLM logo row | `logos/llm-row.png` | 1120x240 | `.../01KXDRS357F95VAGM6Y9QRWSDM.png` | Model logos (Claude, ChatGPT, Gemini, Grok). | "Model coverage" strip on any channel. |
| Polymarket wordmark (black) | `logos/polymarket-black.svg` | vector | n/a (SVG — export PNG for email) | Black Polymarket wordmark. | Website can use the SVG directly; export a PNG for email/ads/social. |

### brand/

| Asset | File | Dimensions | Email / customer.io CDN URL | What it shows | Reuse across channels |
|---|---|---|---|---|---|
| Brand gradient banner | `brand/banner.png` | 2400x600 | `.../01KXDSVDM4MF9K9F3J4WQ4Y6MR.png` | Full-width brand-gradient band, no text. | Email header (full-width 600px), website section divider, or social background. |

### sources/

Render files, compositors, and fixtures kept so every asset above can be regenerated and re-exported at any size.

- `workflow-quant.html` -> `workflows/workflow-quant.png`
- `workflow-nodes.html` -> `workflows/workflow-4node-alert.png`
- `workflow-smart-alert.html` -> `workflows/workflow-smart-alert.png`
- `workflow-morning-brief.html` -> `workflows/workflow-morning-brief.png`
- `starter-trio.html` + `panels.js` + `panels.css` + `starter-workflows.ts` -> `workflows/starter-trio.png`
- `llm-row.html` -> `logos/llm-row.png`
- `markets-row.html` + `logos/polymarket-black.svg`, composited via `compose.py` / `build_preview.py` -> `logos/markets-row.png`
- `demo-nodes.ts` — fixture for the chat-to-workflow demo (`product-shots/demo-still.png`).
- `world-cup-agent.ts` — workflow fixture for rendering agent/workflow panels.
- `measure.py` — helper to measure PNG dimensions.

Assets with no source file (regenerate manually if needed): `brand/banner.png` (generated gradient); `product-shots/research-still.png` and the two low-res product-shots (`llm-consensus.png`, `workflow-22.png`) came from product screenshots.

## Per-channel guidance

- **EMAIL.** PNG only (email clients do not render SVG). Reference the image by its customer.io CDN URL. Host new images via `POST /v1/assets/files` (multipart form field `file`, max 2MB, max 4096px on the long edge); it returns a permanent `userimg-assets.customeriomail.com` URL to drop into the email HTML. Content images: max-width 520px; banners: full-width 600px.
- **WEBSITE.** Use the SVG or the source render directly for crisp scaling (e.g. `logos/polymarket-black.svg`), or the PNG. Prefer re-rendering from `sources/` when you need an exact size or a different subset.
- **ADS / SOCIAL.** Use the high-res PNG. **Flag: re-export the low-res items before ad/social use** — `llm-consensus.png` (517px wide) and `workflow-22.png` (~630px wide) came from product screenshots and will look soft at ad/social sizes; re-export them at ~1120px+ (the content width used by the other workflow images) first. `starter-trio.png` (4408px) is already ad/social/print safe.

### General notes

- Venue and brand logos render as black wordmarks on white for cross-client consistency.
- Keep source files in `sources/` so every asset stays reproducible at any size.

## Brand system + social/video covers

Design-system assets pulled from the live site (`getnickai/nicksitev2`) so everything matches the real brand, plus a one-line cover renderer for social and video.

- `brand/fonts/` — Duplet Regular / Semibold / Bold (`.woff`). Semibold is the heading/wordmark face, Regular is body.
- `brand/logos/` — `mark-blue.svg` (NickAI node mark in brand blue `#0178FF`) and `mark-white-N-on-blue.svg` (the white-N app icon). Note: brand blue is `#0178FF`, not the favicon square `#0892F5`.
- `brand/textures/` — `silk-deco.jpg` (the "Got questions?" blue silk) and `silk-dark.jpg`.
- `covers/` — a text-swappable social / video cover template.

### Covers: make one in one line

```bash
cd asset-library/covers
./make-cover.sh "Title" "Subtitle" [og|wide|square] [output.png] [cta]
```

Sizes: `og` 1200x630 (social share / OpenGraph), `wide` 1920x1080 (16:9 video / YouTube), `square` 1080x1080 (Instagram). The CTA chip defaults to `Try for free at getnick.ai`. The design lives on a fixed 1200x630 stage that scales to any size, so editing `covers/cover-template.html` updates every format. Requires macOS with Google Chrome (renders headless). The site OG image (`public/og.png` in nicksitev2) is produced from this template at `og` size.
