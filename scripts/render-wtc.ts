/**
 * Renderer for the Workflow Template Card (library "Blueprint" video).
 *
 * Mirrors the repo's real pipeline (Tailwind webpack override + public/ mirror)
 * so headless output matches the /motion Player. Frame size + duration come
 * from the composition's `calculateMetadata`, so passing a template's graph as
 * `inputProps` gives a correctly-sized, correctly-timed render per template.
 *
 *   bun scripts/render-wtc.ts                       # BTC-dip key-beat stills
 *   bun scripts/render-wtc.ts --mp4                 # BTC-dip stills + mp4
 *   bun scripts/render-wtc.ts --slug=eth-agent-ai --mp4
 *   bun scripts/render-wtc.ts --ratio=landscape --mp4
 *   bun scripts/render-wtc.ts --all --mp4           # every template → mp4
 *   bun scripts/render-wtc.ts --all --mp4 --archive # … + copy to public/workflow-templates/
 *
 * Not part of the product; used for review. Output under out/wtc/.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import {
  TEMPLATES,
  TEMPLATE_SLUGS,
} from "../remotion/compositions/workflow-template-card/data/templates.generated";

const ID = "workflow-template-card";
const OUT = path.join(process.cwd(), "out", "wtc");
const ARCHIVE = path.join(process.cwd(), "public", "workflow-templates");
const PUBLIC_DIR = path.join(process.cwd(), "public");

function argValue(flag: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`${flag}=`));
  return hit?.slice(flag.length + 1);
}

async function main() {
  const wantMp4 = process.argv.includes("--mp4");
  const all = process.argv.includes("--all");
  const archive = process.argv.includes("--archive");
  const ratio = (argValue("--ratio") ?? "portrait") as "portrait" | "landscape";

  fs.mkdirSync(OUT, { recursive: true });
  if (archive) fs.mkdirSync(ARCHIVE, { recursive: true });

  if (ratio === "landscape") {
    throw new Error(
      "landscape (16:9) layout isn't implemented yet — the View + conveyor geometry are portrait-only. Use --ratio=portrait.",
    );
  }
  const slug = argValue("--slug") ?? "btc-buy-the-dip";
  const slugs = all ? TEMPLATE_SLUGS : [slug];

  for (const s of slugs) {
    if (!TEMPLATES[s]) throw new Error(`Unknown template slug: ${s}`);
  }

  console.log("Bundling (tailwind override)…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  for (const s of slugs) {
    const inputProps = { template: TEMPLATES[s], ratio };
    const composition = await selectComposition({ serveUrl, id: ID, inputProps });
    console.log(
      `\n${s} [${ratio}]: ${composition.width}×${composition.height}, ${composition.durationInFrames}f @ ${composition.fps}fps`,
    );

    if (all) {
      // Batch mode: one mp4 per template (skip the per-beat stills).
      const mp4 = path.join(OUT, `${s}.${ratio}.mp4`);
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        muted: true,
        inputProps,
        outputLocation: mp4,
      });
      console.log(`mp4 → ${path.relative(process.cwd(), mp4)}`);

      const poster = path.join(OUT, `${s}.${ratio}.poster.png`);
      await renderStill({
        composition,
        serveUrl,
        output: poster,
        frame: composition.durationInFrames - 1,
        imageFormat: "png",
        inputProps,
      });
      console.log(`poster → ${path.relative(process.cwd(), poster)}`);

      if (archive) {
        fs.copyFileSync(mp4, path.join(ARCHIVE, `${s}.mp4`));
        fs.copyFileSync(poster, path.join(ARCHIVE, `${s}.png`));
        console.log(`archived → public/workflow-templates/${s}.{mp4,png}`);
      }
      continue;
    }

    // Single-template mode: key-beat stills across the timeline for review.
    const last = composition.durationInFrames - 1;
    const frames = [0, 40, 66, 110, 134, 170, 210, 250, Math.round(last * 0.9), last];
    for (const f of frames) {
      const frame = Math.min(Math.max(f, 0), last);
      const out = path.join(OUT, `${s}.${ratio}.f${String(frame).padStart(4, "0")}.png`);
      await renderStill({ composition, serveUrl, output: out, frame, imageFormat: "png", inputProps });
      console.log(`still f${frame} → ${path.relative(process.cwd(), out)}`);
    }

    if (wantMp4) {
      const mp4 = path.join(OUT, `${s}.${ratio}.mp4`);
      console.log("Rendering mp4…");
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        muted: true,
        inputProps,
        outputLocation: mp4,
      });
      console.log(`mp4 → ${path.relative(process.cwd(), mp4)}`);
    }
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
