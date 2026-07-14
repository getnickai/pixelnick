# Nick email asset library

Reusable, production-ready images for Nick lifecycle and campaign emails (customer.io), plus the source files that produced them so every asset is reproducible.

- `images/` — the final PNGs, ready to host and reference in email HTML.
- `sources/` — the HTML/CSS/JS render files, Python compositors, SVG logos, and TypeScript fixtures used to generate the PNGs.

All hosted URLs use the customer.io asset host prefix:
`https://userimg-assets.customeriomail.com/images/client-env-208004/<id>.png`

## Manifest

| Asset | File | Dimensions | Hosted URL | What it shows / when to use | Source / how to re-render |
|---|---|---|---|---|---|
| Brand gradient banner | `images/banner.png` | 2400x600 | `.../01KXDSVDM4MF9K9F3J4WQ4Y6MR.png` | Full-width top-of-email band, no text. Use as the header on any email. | Generated gradient (no source file). Re-create as a 4:1 brand-gradient PNG. |
| Chat-to-workflow demo | `images/demo-still.png` | 1000x640 | `.../01KXDSVFVNWRCSSTQG3PE0C105.png` | "Describe it, Nick builds it" onboarding shot. Use in welcome / activation emails. | Product screenshot of the chat-to-workflow demo. Fixture: `sources/demo-nodes.ts`. |
| NVDA research view | `images/research-still.png` | 1200x750 | `.../01KXDSVEV17EP6VS5M6RTNF3ZV.png` | Research / analysis view. Use when the email is about research or deep-dive workflows. | Product screenshot. |
| LLM consensus workflow | `images/llm-consensus.png` | 517x262 **(low-res)** | `.../01KXE7ZJQ3827XB03WS7TNQPYD.png` | Multi-model consensus (fan-out to models, then combine). Use for "ask every model" messaging. | Product screenshot. **Re-export larger when possible** (see low-res note below). |
| LLM logo row | `images/llm-row.png` | 1120x240 | `.../01KXDRS357F95VAGM6Y9QRWSDM.png` | Model logos (Claude, ChatGPT, Gemini, Grok). Use to show model coverage. | `sources/llm-row.html` (render + crop). |
| Venues logo row | `images/markets-row.png` | 1103x106 | `.../01KXE4SY05XP59YX2W3PZVTTF8.png` | Supported venues as black wordmarks (Coinbase, Hyperliquid, OKX, Kalshi, Polymarket). Use to show venue coverage. | `sources/markets-row.html` + `sources/polymarket-black.svg`, composited via `sources/compose.py` / `sources/build_preview.py`. |
| 22-node workflow canvas | `images/workflow-22.png` | 630x316 **(low-res)** | `.../01KXE22CFNVQ7J93RGPHRE9PQ5.png` | Complex / advanced workflow (icon nodes). Use for "Nick handles complexity" messaging. | Product screenshot. **Re-export larger when possible.** |
| 12-node quant workflow | `images/workflow-quant.png` | 1120x353 | `.../01KXE090TEPEARA07HXS0CT4RY.png` | Systematic strategy (BTC Paper Trader). Use for quant / systematic-strategy emails. | `sources/workflow-quant.html`. |
| 4-node alert workflow | `images/workflow-4node-alert.png` | 1120x908 | `.../01KXDYSGAZNN74VGXMAM95Z9SN.png` | Simple automation (price alert). Use for "get started in a few nodes" messaging. | `sources/workflow-nodes.html`. (Renamed from `workflow-nodes.png`.) |
| Starter-agent trio | `images/starter-trio.png` | 4408x2982 | `.../01KXE7YR9NGMDFMG7DPYXD6VWF.png` | The 3 starter agents as workflows. Use in onboarding / "pick a starter agent" emails. 2k copy: `images/starter-trio-2k.png` (2000x1353). | `sources/starter-trio.html` + `sources/panels.js` + `sources/panels.css`, data from `sources/starter-workflows.ts`. |
| Smart-alert workflow (component) | `images/workflow-smart-alert.png` | 4408x694 | not separately hosted | Component panel used to build the starter-trio composite. | `sources/workflow-smart-alert.html`. |
| Morning-brief workflow (component) | `images/workflow-morning-brief.png` | 2028x1354 | not separately hosted | Component panel used to build the starter-trio composite. | `sources/workflow-morning-brief.html`. |

### Sources without a separately hosted asset

- `sources/world-cup-agent.ts` — workflow fixture used when rendering agent/workflow panels.
- `sources/measure.py` — helper to measure PNG dimensions.

## Email image guidelines

- **PNG only.** Email clients do not render SVG. Keep SVGs in `sources/` and always export a PNG for the email.
- **Sizing.** Content images: max-width 520px. Banners: full-width 600px (email body width). Export at 2x for retina, then constrain with `width`/`max-width` in the HTML.
- **Host new images in customer.io.** `POST /v1/assets/files` with a multipart form field named `file` (max 2MB, max 4096px on the long edge). It returns a permanent `userimg-assets.customeriomail.com` URL. Reference that URL directly in the email HTML.
- **Venue and brand logos** render as black wordmarks on white for consistency across clients.
- **Keep sources in `sources/`** so every asset can be re-rendered and re-exported.

### Low-res items to re-export

- `llm-consensus.png` (517px wide) and `workflow-22.png` (630px wide) came from product screenshots. Re-export them larger (target the ~1120px content width used by the other workflow images) before reusing at full width.
