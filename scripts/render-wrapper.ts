/**
 * Renderer for Wrapper 16:9 — bookends any 1920×1080 clip with the Nick Intro
 * and Nick Outro on one timeline.
 *
 * It measures the source file (duration → body frame count) with
 * @remotion/media-parser, copies it under public/ so `staticFile()` resolves
 * inside the bundle, then renders intro + body + outro to a single mp4.
 *
 *   bun scripts/render-wrapper.ts <video>                 # wrap <video>
 *   bun scripts/render-wrapper.ts <video> --out=final.mp4 # custom output name
 *   bun scripts/render-wrapper.ts <video> \
 *     --tagline="The agentic trading platform" \
 *     --cta="Try it for free now" --url="getnick.ai"
 *
 * Output under out/wrapper/. Not part of the product; used for review.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { parseMedia } from "@remotion/media-parser";
import { nodeReader } from "@remotion/media-parser/node";
import { WRAPPER_16_9_FPS } from "../remotion/compositions/wrapper-16-9/timeline";

const ID = "wrapper-16-9";
const OUT = path.join(process.cwd(), "out", "wrapper");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const STAGE_DIR = path.join(PUBLIC_DIR, "wrapper-input");

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

async function main() {
  const input = process.argv[2];
  if (!input || input.startsWith("--")) {
    throw new Error(
      "Usage: bun scripts/render-wrapper.ts <video.mp4> [--out=name.mp4] [--tagline=…] [--cta=…] [--url=…]",
    );
  }
  const inputPath = path.resolve(input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Video not found: ${inputPath}`);
  }

  // 1. Measure the source: duration → body frames, dimensions for the log.
  console.log("Measuring source…");
  const { durationInSeconds, dimensions } = await parseMedia({
    src: inputPath,
    fields: { durationInSeconds: true, dimensions: true },
    reader: nodeReader,
  });
  if (!durationInSeconds) {
    throw new Error("Could not read the video's duration.");
  }
  const bodyDurationInFrames = Math.max(
    1,
    Math.round(durationInSeconds * WRAPPER_16_9_FPS),
  );
  console.log(
    `source: ${dimensions?.width ?? "?"}×${dimensions?.height ?? "?"}, ` +
      `${durationInSeconds.toFixed(2)}s → ${bodyDurationInFrames}f body`,
  );
  if (dimensions && (dimensions.width !== 1920 || dimensions.height !== 1080)) {
    console.warn(
      `note: source isn't 1920×1080 — it will be letterboxed (object-fit: contain) to fit the 16:9 stage.`,
    );
  }

  // 2. Stage the file under public/ so staticFile() resolves in the bundle.
  fs.mkdirSync(STAGE_DIR, { recursive: true });
  const stagedName = "input" + path.extname(inputPath).toLowerCase();
  const stagedPath = path.join(STAGE_DIR, stagedName);
  fs.copyFileSync(inputPath, stagedPath);
  const videoSrc = `wrapper-input/${stagedName}`;

  const inputProps = {
    videoSrc,
    bodyDurationInFrames,
    introTagline: argValue("--tagline") ?? "The agentic trading platform",
    ctaHeadline: argValue("--cta") ?? "Try it for free now",
    ctaUrl: argValue("--url") ?? "getnick.ai",
  };

  // 3. Bundle (Tailwind override + public/ mirror), matching the repo pipeline.
  console.log("Bundling (tailwind override)…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  const composition = await selectComposition({ serveUrl, id: ID, inputProps });
  console.log(
    `\n${ID}: ${composition.width}×${composition.height}, ` +
      `${composition.durationInFrames}f @ ${composition.fps}fps ` +
      `(${(composition.durationInFrames / composition.fps).toFixed(1)}s total)`,
  );

  // 4. Render.
  fs.mkdirSync(OUT, { recursive: true });
  const outName = argValue("--out") ?? "wrapped.mp4";
  const mp4 = path.join(OUT, outName);
  console.log("Rendering mp4…");
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    // The bookends are silent; keep any audio the wrapped body carries.
    inputProps,
    outputLocation: mp4,
  });
  console.log(`\nDone → ${path.relative(process.cwd(), mp4)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
