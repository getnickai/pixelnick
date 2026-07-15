/**
 * Render every Nick launch-video screen to a PNG for design review.
 *
 *   bun scripts/render-nick-stills.ts            # all screens
 *   bun scripts/render-nick-stills.ts intro cta  # only these
 *
 * Output → out/nick-stills/<screen>.png (1920×1080). No R2/data creds needed —
 * pure design.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { ALL_SCREENS, type LaunchScreen } from "../remotion/compositions/nick-launch-video/props";

const COMPOSITION_ID = "nick-launch-still";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT = path.join(process.cwd(), "out", "nick-stills");

async function main() {
  const argv = process.argv.slice(2);
  const screens: LaunchScreen[] = argv.length
    ? (argv.filter((a) => (ALL_SCREENS as string[]).includes(a)) as LaunchScreen[])
    : ALL_SCREENS;
  if (!screens.length) {
    console.error(`No valid screens. Options: ${ALL_SCREENS.join(", ")}`);
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });
  console.log(`Bundle ready. Rendering ${screens.length} screen(s) → out/nick-stills/\n`);

  for (const screen of screens) {
    const inputProps = { screen };
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });
    const png = path.join(OUT, `${screen}.png`);
    await renderStill({ composition, serveUrl, output: png, inputProps, frame: 0, imageFormat: "png" });
    console.log(`  ✓ ${screen}.png  (${composition.width}×${composition.height})`);
  }
  console.log(`\nDone. ${screens.length} still(s) → out/nick-stills/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
