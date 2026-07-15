/**
 * Re-capture the NickAI Widget Library PNGs from the nickai `/dev/cards` harness.
 *
 * The widget cards are React components that live in `getnickai/nickai-app`
 * (assistant-ui tool-ui cards). Rather than port them (drift), we screenshot the
 * REAL components from the app's dev-only `/dev/cards` harness — light + dark,
 * one 2x PNG per card — into `public/widget-library/{light,dark}/<slug>.png`.
 *
 * This script uses Playwright, which pixelnick does NOT depend on. Run it from a
 * nickai-app checkout (which has Playwright + the harness). Steps:
 *
 *   1. In the nickai-app worktree (with PR #402's `/dev/cards` harness present):
 *        bunx next dev --webpack -p 3009        # Turbopack rejects symlinked node_modules
 *   2. Each Specimen in the harness must expose `data-card="<slug>"` on the card
 *      wrapper (add it if missing — it is the capture hook).
 *   3. Copy this file into that worktree (so `import "playwright"` resolves) and:
 *        OUT=<pixelnick>/public/widget-library PORT=3009 bun --no-install capture-widget-library.ts
 *   4. Update `app/engine/nickai-widget-library/manifest.ts` if slugs/dims changed
 *      (the script prints a dims manifest for the light pass).
 *
 * Card edges + charts: waits for recharts' draw animation to settle and hides
 * floating page overlays (Next dev indicator, Gleap) so element screenshots are
 * clean.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const PORT = process.env.PORT ?? "3009";
const URL = process.env.HARNESS_URL ?? `http://localhost:${PORT}/dev/cards`;
const OUT = process.env.OUT ?? path.join(process.cwd(), "public/widget-library");
const THEMES = ["light", "dark"] as const;

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
page.setDefaultTimeout(60_000);

console.log(`→ ${URL}\n→ ${OUT}`);
await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForSelector("[data-card]");
await page.addStyleTag({
  content: `nextjs-portal, [data-nextjs-toast], [data-next-badge-root],
  #__next-build-watcher, .gleap-frame-container,
  iframe[title*="Gleap" i], #gleap-frame-container { display: none !important; }`,
});

const manifest: { slug: string; w: number; h: number }[] = [];
for (const theme of THEMES) {
  await page.getByRole("button", { name: theme, exact: true }).click();
  await page.waitForTimeout(2800); // recharts draw animation + theme repaint
  const cards = page.locator("[data-card]");
  const n = await cards.count();
  const dir = path.join(OUT, theme);
  await mkdir(dir, { recursive: true });
  for (let i = 0; i < n; i++) {
    const card = cards.nth(i);
    const slug = await card.getAttribute("data-card");
    if (!slug) continue;
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(120);
    const box = await card.boundingBox();
    await card.screenshot({ path: path.join(dir, `${slug}.png`) });
    if (theme === "light" && box)
      manifest.push({ slug, w: Math.round(box.width), h: Math.round(box.height) });
  }
  console.log(`captured ${n} cards · ${theme}`);
}
console.log(JSON.stringify(manifest, null, 2));
await browser.close();
