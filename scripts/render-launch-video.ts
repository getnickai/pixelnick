/**
 * Render the full Nick launch video to MP4 (H.264, with the audio bed).
 *
 *   bun scripts/render-launch-video.ts
 *
 * Output → out/nick-launch-video.mp4 (1920×1200, 30fps, ~44s). Pure design.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { launchVideoDefaultProps } from "../remotion/compositions/launch-video/props";

const COMPOSITION_ID = "launch-video";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT = path.join(process.cwd(), "out", "nick-launch-video.mp4");

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
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
    `Rendering ${COMPOSITION_ID} → ${OUT}  (${composition.width}×${composition.height}, ${composition.durationInFrames}f @ ${composition.fps}fps)\n`,
  );

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: OUT,
    inputProps: launchVideoDefaultProps,
    onProgress: ({ progress }) => {
      process.stdout.write(`\r  ${Math.round(progress * 100)}%`);
    },
  });
  console.log(`\nDone → ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
