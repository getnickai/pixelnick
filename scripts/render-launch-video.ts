/**
 * Render the full Nick launch video to MP4 (H.264, with the audio bed).
 *
 *   bun scripts/render-launch-video.ts            # both soundtrack versions
 *   bun scripts/render-launch-video.ts performance # only the perf-highlight bed
 *   bun scripts/render-launch-video.ts workflow    # only the workflow-highlight bed
 *
 * Output → out/nick-launch-video[-<track>].mp4 (1920×1200, 30fps). Pure design.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { launchVideoDefaultProps } from "../remotion/compositions/launch-video/props";

const COMPOSITION_ID = "launch-video";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const OUT_DIR = path.join(process.cwd(), "out");

// Two soundtrack variants for A/B comparison.
const VARIANTS = [
  { key: "performance", track: "audio/nick-performance-highlight.mp3", out: "nick-launch-video-performance.mp3" },
  { key: "workflow", track: "audio/nick-workflow-highlight.mp3", out: "nick-launch-video-workflow.mp3" },
].map((v) => ({ ...v, out: v.out.replace(/\.mp3$/, ".mp4") }));

async function main() {
  const filter = process.argv[2];
  const variants = filter ? VARIANTS.filter((v) => v.key === filter) : VARIANTS;
  if (!variants.length) {
    console.error(`Unknown variant "${filter}". Options: ${VARIANTS.map((v) => v.key).join(", ")}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  for (const variant of variants) {
    const inputProps = { ...launchVideoDefaultProps, musicTrack: variant.track };
    const outPath = path.join(OUT_DIR, variant.out);
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });
    console.log(
      `\nRendering ${variant.key} → ${outPath}  (${composition.width}×${composition.height}, ${composition.durationInFrames}f @ ${composition.fps}fps)\n`,
    );
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: outPath,
      inputProps,
      onProgress: ({ progress }) => {
        process.stdout.write(`\r  ${variant.key}: ${Math.round(progress * 100)}%`);
      },
    });
    console.log(`\nDone → ${outPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
