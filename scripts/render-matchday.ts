/**
 * Render the Matchday (Analysis) card to MP4 (+ PNG poster).
 *
 * Builds today's slate (the swarm's highest-consensus pick per game) via
 * buildMatchdayData, then feeds it to the registered `matchday-analysis`
 * Remotion composition. Duration scales to the game count
 * (matchdayDuration: games·135 + 90 @30fps). PNG = settled final frame,
 * MP4 = the full per-game reveal animation (muted; the cron muxes audio).
 *
 * Exits 2 (not 1) when the slate has no covered games, so the cron can treat
 * "nothing to post" distinctly from a render failure.
 *
 * Flags:
 *   --out=<dir>   output dir (default out/mp4)
 *   --no-mp4      PNG only (faster)
 *   --all         ignore the upcoming-only filter (debug; renders played games too)
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { buildMatchdayData } from "./swarm-matchday";
import { matchdayDuration } from "../remotion/compositions/matchday-analysis/props";

const COMPOSITION_ID = "matchday-analysis";
const PUBLIC_DIR = path.join(process.cwd(), "public");

async function main() {
  const argv = process.argv.slice(2);
  const out = path.resolve(argv.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(process.cwd(), "out", "mp4"));
  const wantMp4 = !argv.includes("--no-mp4");
  const all = argv.includes("--all");

  console.log("Building matchday slate from R2…");
  const data = await buildMatchdayData({ all });
  if (!data.games.length) {
    console.error("No covered games in today's slate — nothing to render.");
    process.exit(2);
  }
  console.log(
    `Day ${data.day} · ${data.games.length} game(s): ` +
      data.games.map((g) => `${g.home}/${g.selection}`).join(", "),
  );

  fs.mkdirSync(out, { recursive: true });
  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  const inputProps = { data, slide: true } as Record<string, unknown>;
  const base = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });
  // Duration scales to the real game count (manifest default is the 4-game sample).
  const composition = { ...base, durationInFrames: matchdayDuration(data.games.length) };

  const slug = `matchday-day-${data.day}`;
  const png = path.join(out, `${slug}.png`);
  await renderStill({ composition, serveUrl, output: png, inputProps, frame: composition.durationInFrames - 1, imageFormat: "png" });
  console.log(`  ✓ ${slug}.png  (${composition.width}×${composition.height})`);

  if (wantMp4) {
    const mp4 = path.join(out, `${slug}.mp4`);
    await renderMedia({ composition, serveUrl, codec: "h264", muted: true, outputLocation: mp4, inputProps });
    console.log(`  ✓ ${slug}.mp4  (${(composition.durationInFrames / composition.fps).toFixed(1)}s, ${composition.width}×${composition.height})`);
  }
  console.log(`Done → ${path.relative(process.cwd(), out)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
