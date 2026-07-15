/**
 * Render stills at beat-center frames of the full `launch-video` composition,
 * for design review of the grafted product beats (STA-494).
 *
 *   bun scripts/render-launch-frames.ts             # all named beats
 *   bun scripts/render-launch-frames.ts montage grid # only these
 *   bun scripts/render-launch-frames.ts 972          # a raw frame number
 *
 * Output → out/launch-frames/<name>.png (1920×1200). Pure design, no creds.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { launchVideoDefaultProps } from "../remotion/compositions/launch-video/props";

const COMPOSITION_ID = "launch-video";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT = path.join(process.cwd(), "out", "launch-frames");

// Beat-center frames (see remotion/compositions/launch-video/timeline.ts).
// Retimed after the intro reflow, composer speed-ups, grid removal, and the
// grown grid+execute finale (STA-494 rework).
const BEATS: Record<string, number> = {
  opening: 62, // settled "Nick trades anything" reflow
  statement: 96, // title + subline
  "chat-composer": 178, // Send click (local ~60)
  "chat-response": 258, // big NVDA price card settled
  "workflow-composer": 350, // Send click (local ~72)
  "workflow-response": 448, // widget highlight-click
  "workflow-build": 520,
  "montage-2": 596,
  "montage-3": 662,
  product: 800,
  execution: 960,
  "finale-grid": 1058, // four workflows revealed
  finale: 1180, // NickAI lockup + CTA
};

async function main() {
  const argv = process.argv.slice(2);
  const targets: Array<{ name: string; frame: number }> = argv.length
    ? argv.map((a) =>
        /^\d+$/.test(a)
          ? { name: `frame-${a}`, frame: Number(a) }
          : { name: a, frame: BEATS[a] },
      )
    : Object.entries(BEATS).map(([name, frame]) => ({ name, frame }));

  const bad = targets.filter((t) => t.frame == null || Number.isNaN(t.frame));
  if (bad.length) {
    console.error(`Unknown beat(s): ${bad.map((b) => b.name).join(", ")}`);
    console.error(`Options: ${Object.keys(BEATS).join(", ")} (or a raw frame number)`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  const composition = await selectComposition({
    serveUrl,
    id: COMPOSITION_ID,
    inputProps: launchVideoDefaultProps,
  });
  console.log(
    `Rendering ${targets.length} frame(s) of ${COMPOSITION_ID} (${composition.width}×${composition.height}, ${composition.durationInFrames}f)\n`,
  );

  for (const { name, frame } of targets) {
    const png = path.join(OUT, `${name}.png`);
    await renderStill({
      composition,
      serveUrl,
      output: png,
      inputProps: launchVideoDefaultProps,
      frame,
      imageFormat: "png",
    });
    console.log(`  ✓ ${name}.png  @ frame ${frame}`);
  }
  console.log(`\nDone → out/launch-frames/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
