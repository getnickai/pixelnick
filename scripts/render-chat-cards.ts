/**
 * Render settled stills of the reusable NickAI chat cards for design review.
 *
 *   bun scripts/render-chat-cards.ts
 *
 * Renders the LAST frame (fully settled) of each card for NVDA, SPACEX and the
 * portfolio. Output → out/chat-cards/<name>.png. Pure design, no creds.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import {
  SAMPLE_PORTFOLIO,
  SAMPLE_PRICE_NVDA,
  SAMPLE_PRICE_SPACEX,
} from "../remotion/compositions/chat-cards/props";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT = path.join(process.cwd(), "out", "chat-cards");

type Job = { name: string; compositionId: string; inputProps: Record<string, unknown> };

const JOBS: Job[] = [
  { name: "price-nvda", compositionId: "chat-price-card", inputProps: { data: SAMPLE_PRICE_NVDA } },
  { name: "price-spacex", compositionId: "chat-price-card", inputProps: { data: SAMPLE_PRICE_SPACEX } },
  { name: "portfolio", compositionId: "chat-portfolio-card", inputProps: { data: SAMPLE_PORTFOLIO } },
];

async function main() {
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  for (const job of JOBS) {
    const composition = await selectComposition({
      serveUrl,
      id: job.compositionId,
      inputProps: job.inputProps,
    });
    const png = path.join(OUT, `${job.name}.png`);
    await renderStill({
      composition,
      serveUrl,
      output: png,
      inputProps: job.inputProps,
      // Last frame = fully settled (anim = 1).
      frame: composition.durationInFrames - 1,
      imageFormat: "png",
    });
    console.log(`  ✓ ${job.name}.png  (${composition.width}×${composition.height})`);
  }
  console.log(`\nDone → out/chat-cards/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
