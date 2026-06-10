# Swarm Arena — Design Upgrade Guide (for Onur / his agent)

There are **two separate surfaces**, in **two separate repos**. Pick the right one:

| You're changing… | Repo | Deploys to |
|---|---|---|
| The **shareable card graphic** (the agent cards) | `getnickai/pixelnick` | swarm-arena-cards.vercel.app + the PNG/MP4 render pipeline |
| The **website** (swarmarena.ai) | `getnickai/swarm-arena` | swarmarena.ai |

## Access / setup (do once)
- GitHub **write access** to both repos: `getnickai/pixelnick` and `getnickai/swarm-arena`.
- `git clone https://github.com/getnickai/pixelnick.git`
- `git clone https://github.com/getnickai/swarm-arena.git`
- For previewing cards with **real agent data** you need R2 read creds in `pixelnick/.env.local` (`S3_ENDPOINT`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`). **Pure design edits do NOT need this** — use Remotion Studio / fixtures.
- All shipping is via **PR into `main`** (no direct pushes to `main`).

---

## A) Card design upgrades → `pixelnick`

### Where the design lives (single source of truth)
Everything is under `public/swarm-arena-cards/`:
- **`card-engine.js`** — the verbatim design engine. Vanilla JS; `renderAgentCard()` / `renderLeaderboardCard()` / `renderMatchCard()` each return the card's **HTML**. This is where layout/markup lives.
- **`card-styles.css`** — all card styling (em-based, scoped to `.sa-card`; sizes via `--sa-u`).
- **`colors_and_type.css`** — color tokens + typography.
- **`assets/`** — logos, wordmarks, rank hexes, etc.
- **`../../data/swarm-identity.ts`** — per-agent branding (handle → monogram, model name, provider, flag, brand color). Keep its roster in sync with the engine's `AGENTS` if you add/rename an agent.

### How it's consumed — you edit once, everything updates
The **same `card-engine.js`** powers both outputs, so there's no separate "apply design" step:
1. **Render pipeline (PNG/MP4 for sharing):** `remotion/compositions/swarm-card/composition.tsx` loads `card-engine.js`, injects its HTML, and `scripts/generate-swarm-cards.ts` screenshots it with Remotion → `out/swarm-arena/*.png|mp4`.
2. **Live gallery (browser preview / history):** `public/swarm-arena-cards/live.html` loads the **same** `card-engine.js` in the browser and renders cards live from R2 data.

So: edit the engine/CSS/assets → the generated cards **and** the live site both reflect it.

### Preview locally
```bash
cd pixelnick && bun install
bun run studio   # Remotion Studio → pick the "swarm-card" composition, tweak live (no R2 needed)
# or the live gallery against real data (needs .env.local R2 creds):
bun run dev      # then open http://localhost:3000/swarm-arena-cards/live.html
# or render files to disk:
bun scripts/swarm-adapter.ts   # reads R2 → public/swarm-arena-cards/live-deck.json
bun scripts/generate-swarm-cards.ts --deck=public/swarm-arena-cards/live-deck.json --layout=editorial --mp4
```

### Ship it
1. `git checkout -b design/<what-you-changed>` (off `main`)
2. Edit `card-engine.js` / `card-styles.css` / `colors_and_type.css` / `assets/` (+ `data/swarm-identity.ts` if roster/branding changed).
3. Verify in Studio or the live gallery.
4. Commit → push → open a **PR into `main` on `getnickai/pixelnick`**.
5. On merge: Vercel redeploys the cards site, and the next card generation uses the new design automatically.

---

## B) Website upgrades → `swarm-arena`

### Where it lives
- Repo: `getnickai/swarm-arena`
- The Next.js site is in the **`terminal/`** directory (deploy from there).
- It reads live agent data (R2 / Supabase) and renders the World Cup site → swarmarena.ai.

### Ship it
1. `git checkout -b <feat|design>/<what>` (off `main`)
2. Edit the site under `terminal/` (components, pages, styles).
3. Preview: `cd terminal && npm install && npm run dev`
4. Commit → push → open a **new PR into `main` on `getnickai/swarm-arena`**. (Yes — a separate PR inside the swarm-arena repo.)
5. On merge: Vercel redeploys swarmarena.ai.

---

## The one rule to remember
- Changing the **card graphic itself** → **pixelnick** (`public/swarm-arena-cards/`).
- Changing the **website UI** → **swarm-arena** (`terminal/`).
- The website can embed the live cards (same engine), so a `card-engine.js` change in pixelnick can also change how cards look on the site once both deploy.
