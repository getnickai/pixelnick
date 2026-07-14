/**
 * Render NickAI social cards (STA-473) to PNG (and MP4 once the CP2 motion
 * pass lands) from a props JSON file.
 *
 * Usage:
 *   bun scripts/render-nickai-social.ts --props <file.json> [--out <dir>] [--mp4]
 *   bun scripts/render-nickai-social.ts --sample            # built-in samples
 *
 * The props file is either a single NickaiSocialCardProps object or an array
 * of { slug, props } jobs. Follows the generate-swarm-cards render path:
 * bundle → mirror public/ → selectComposition → renderStill (+ renderMedia).
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { enableTailwind } from "@remotion/tailwind-v4";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import type { NickaiSocialCardProps } from "../remotion/compositions/nickai-social-card/props";
import { nickaiSocialCardDefaultProps } from "../remotion/compositions/nickai-social-card/props";

const PUBLIC_DIR = path.join(process.cwd(), "public");
const COMPOSITION_ID = "nickai-social-card";

type Job = { slug: string; props: NickaiSocialCardProps };

const SAMPLE_JOBS: Job[] = [
  { slug: "sample-use-case-dark", props: nickaiSocialCardDefaultProps },
  {
    slug: "sample-use-case-light",
    props: { ...nickaiSocialCardDefaultProps, theme: "light" },
  },
  {
    slug: "sample-live-results-dark",
    props: {
      theme: "dark",
      eyebrow: "Trading analysis",
      headline: "One momentum agent, thirty days of live capital",
      chips: [],
      fill: {
        kind: "bigNumber",
        value: "+18.4%",
        label: "30 days, live capital",
        caption: "recorded on-platform, Jun 3 to Jul 3",
        tone: "positive",
      },
      wave: 2,
    },
  },
  {
    slug: "sample-live-results-light",
    props: {
      theme: "light",
      eyebrow: "Trading analysis",
      headline: "One momentum agent, thirty days of live capital",
      chips: [],
      fill: {
        kind: "bigNumber",
        value: "+18.4%",
        label: "30 days, live capital",
        caption: "recorded on-platform, Jun 3 to Jul 3",
        tone: "positive",
      },
      wave: 2,
    },
  },
];

function parseFlags(argv: string[]) {
  const flags = { props: "", out: "out/nickai-social", mp4: false, sample: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--props") flags.props = argv[++i] ?? "";
    else if (argv[i] === "--out") flags.out = argv[++i] ?? flags.out;
    else if (argv[i] === "--mp4") flags.mp4 = true;
    else if (argv[i] === "--sample") flags.sample = true;
  }
  return flags;
}

/**
 * Remotion shallow-merges defaultProps under inputProps, so an absent key
 * would silently inherit the sample default (e.g. its subline). Pin every
 * optional key explicitly.
 */
function normalize(props: NickaiSocialCardProps): NickaiSocialCardProps {
  const merged: NickaiSocialCardProps = {
    theme: "dark",
    subline: "",
    chips: [],
    fill: { kind: "none" },
    wave: 1,
    animate: false,
    ...props,
  };
  // A hand-written props file with an unknown wave variant would 404 the
  // staticFile mid-render; clamp to the default motif instead.
  if (![0, 1, 2].includes(merged.wave as number)) merged.wave = 1;
  if (merged.theme !== "light" && merged.theme !== "dark") merged.theme = "dark";
  return merged;
}

function loadJobs(flags: ReturnType<typeof parseFlags>): Job[] {
  const jobs: Job[] = (() => {
    if (flags.sample) return SAMPLE_JOBS;
    if (!flags.props) {
      console.error("Pass --props <file.json> or --sample.");
      process.exit(1);
    }
    const raw = JSON.parse(fs.readFileSync(flags.props, "utf8"));
    if (Array.isArray(raw)) return raw as Job[];
    return [{ slug: path.basename(flags.props, ".json"), props: raw as NickaiSocialCardProps }];
  })();
  return jobs.map((job) => ({ ...job, props: normalize(job.props) }));
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const jobs = loadJobs(flags);
  fs.mkdirSync(flags.out, { recursive: true });

  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  // Mirror public/ into the bundle so staticFile() asset paths resolve headlessly.
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });
  console.log(`Bundle ready. Rendering ${jobs.length} card(s) → ${path.relative(process.cwd(), flags.out)}/\n`);

  for (const job of jobs) {
    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps: job.props,
    });
    const output = path.join(flags.out, `${job.slug}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      inputProps: job.props,
      // Settled frame — last frame once the CP2 entrance animation lands.
      frame: composition.durationInFrames - 1,
      imageFormat: "png",
    });
    console.log(`  ✓ ${job.slug}.png  (${composition.width}×${composition.height})`);

    if (flags.mp4) {
      if (composition.durationInFrames <= 1) {
        console.warn(
          `  ⚠ skipping ${job.slug}.mp4 — composition is a 1-frame still; ` +
            `the CP2 motion pass bumps the duration first.`,
        );
        continue;
      }
      const mp4Out = path.join(flags.out, `${job.slug}.mp4`);
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        muted: true,
        outputLocation: mp4Out,
        inputProps: { ...job.props, animate: true },
      });
      const secs = (composition.durationInFrames / composition.fps).toFixed(1);
      console.log(`  ✓ ${job.slug}.mp4  (${secs}s)`);
    }
  }

  console.log(`\nDone. ${jobs.length} card(s) → ${path.relative(process.cwd(), flags.out)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
