/**
 * Swarm Arena card generator.
 *
 * Loads the deck (R2 or fixtures, see swarm-feed.ts), then renders a PNG per
 * card to out/swarm-arena/:
 *   - one agent card per agent (default layout: editorial)
 *   - one match card
 *   - one leaderboard card
 *
 * The card engine is data-driven, so the deck is passed straight through as
 * Remotion inputProps. Size is set per-render via the composition's
 * calculateMetadata.
 *
 * Flags:
 *   --theme=dark|light     (default dark)
 *   --size=portrait|story|square|og   (default portrait)
 *   --layout=editorial|hero|scoreboard|terminal   (agent cards; default editorial)
 *   --slug=<name>          render only the card with this output slug
 *   --out=<dir>            output dir (default out/swarm-arena)
 *
 * MP4 / Slack posting are intentionally out of scope for this pass.
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { loadSwarmDeck } from "./swarm-feed";
import type { SwarmCardProps } from "../remotion/compositions/swarm-card/props";
import { toCardData } from "../lib/swarm-card-data";

const PUBLIC_DIR = path.join(process.cwd(), "public");

type Flags = {
  theme: "dark" | "light";
  size: SwarmCardProps["size"];
  layout: NonNullable<SwarmCardProps["layout"]>;
  /** Card design: classic editorial engine vs the new React model card. */
  design: "classic" | "model";
  slug?: string;
  out: string;
  /** Pre-built deck JSON (EngineAgent[] + match). Bypasses loadSwarmDeck. */
  deck?: string;
  /** Also render an MP4 (h264) per card. */
  mp4: boolean;
  /** MP4 duration in seconds (default 5). */
  seconds: number;
};

function parseFlags(argv: string[]): Flags {
  const f: Flags = {
    theme: "dark",
    size: "portrait",
    layout: "editorial",
    design: "classic",
    out: path.join(process.cwd(), "out", "swarm-arena"),
    mp4: false,
    seconds: 5,
  };
  for (const arg of argv) {
    if (arg.startsWith("--theme=")) f.theme = arg.slice(8) as Flags["theme"];
    else if (arg.startsWith("--size=")) f.size = arg.slice(7) as Flags["size"];
    else if (arg.startsWith("--layout=")) f.layout = arg.slice(9) as Flags["layout"];
    else if (arg.startsWith("--card=")) f.design = arg.slice(7) as Flags["design"];
    else if (arg.startsWith("--slug=")) f.slug = arg.slice(7);
    else if (arg.startsWith("--out=")) f.out = path.resolve(arg.slice(6));
    else if (arg.startsWith("--deck=")) f.deck = path.resolve(arg.slice(7));
    else if (arg === "--mp4") f.mp4 = true;
    else if (arg.startsWith("--seconds=")) f.seconds = Number(arg.slice(10)) || 5;
  }
  return f;
}

type Job = { slug: string; compositionId: string; props: Record<string, unknown> };

/** Build the list of cards to render, with an output slug + composition for each. */
function plan(flags: Flags, deck: Awaited<ReturnType<typeof loadSwarmDeck>>["deck"]): Job[] {
  const jobs: Job[] = [];

  if (flags.design === "model") {
    // New React design (single source of truth). Agent cards only — the
    // leaderboard + match designs have no React equivalent yet, so they stay
    // on the classic engine. Rank from the ROI order, like the live gallery.
    // Dedupe colliding handles (the upstream feed has produced two "GPT"s),
    // same defense as the live gallery, so we don't render one slug twice.
    const seen = new Set<string>();
    const unique = deck.agents.filter((a) =>
      seen.has(a.handle) ? false : (seen.add(a.handle), true),
    );
    const ranked = [...unique].sort((a, b) => b.roiPct - a.roiPct);
    ranked.forEach((a, i) => {
      jobs.push({
        slug: `model-${a.handle.toLowerCase()}`,
        // The full per-element animated design (the /motion composition), now
        // data-driven. PNG = its settled last frame; MP4 = the whole animation.
        compositionId: "swarm-arena-model-card",
        props: { data: toCardData(a, i + 1, ranked.length), slide: true },
      });
    });
    return flags.slug ? jobs.filter((j) => j.slug === flags.slug) : jobs;
  }

  const base = { theme: flags.theme, size: flags.size, deck } as const;
  for (const a of deck.agents) {
    jobs.push({
      slug: `agent-${a.handle.toLowerCase()}`,
      compositionId: "swarm-card",
      props: { ...base, card: "agent", handle: a.handle, layout: flags.layout },
    });
  }
  // The match card needs a head-to-head fixture in the deck. Skip it (don't
  // crash) when there's none yet, e.g. a single-agent live deck before the
  // World Cup bracket is populated.
  if (deck.match) {
    jobs.push({ slug: "match", compositionId: "swarm-card", props: { ...base, card: "match" } });
  } else {
    console.warn("Skipping match card: deck has no match data (deck.match is null).");
  }
  jobs.push({ slug: "leaderboard", compositionId: "swarm-card", props: { ...base, card: "leaderboard" } });
  return flags.slug ? jobs.filter((j) => j.slug === flags.slug) : jobs;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const { deck, source } = flags.deck
    ? { deck: JSON.parse(fs.readFileSync(flags.deck, "utf8")), source: `deck file ${path.relative(process.cwd(), flags.deck)}` }
    : await loadSwarmDeck();
  console.log(`Loaded deck from ${source}: ${deck.agents.length} agents + match.`);

  const jobs = plan(flags, deck);
  if (jobs.length === 0) {
    console.error(`No cards to render${flags.slug ? ` (slug="${flags.slug}")` : ""}.`);
    process.exit(1);
  }
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
      id: job.compositionId,
      inputProps: job.props,
    });
    const output = path.join(flags.out, `${job.slug}.png`);
    await renderStill({
      composition,
      serveUrl,
      output,
      inputProps: job.props,
      // Settled frame: the card holds after its entrance cascade.
      frame: composition.durationInFrames - 1,
      imageFormat: "png",
    });
    console.log(`  ✓ ${job.slug}.png  (${composition.width}×${composition.height})`);

    if (flags.mp4) {
      // The model card has a full entrance animation: play its native duration
      // so the cascade isn't truncated. Other (broadcast-still) cards hold for
      // `seconds` at the comp's fps.
      const durationInFrames =
        job.compositionId === "swarm-arena-model-card"
          ? composition.durationInFrames
          : Math.max(1, Math.round(composition.fps * flags.seconds));
      const mp4Out = path.join(flags.out, `${job.slug}.mp4`);
      await renderMedia({
        composition: { ...composition, durationInFrames },
        serveUrl,
        codec: "h264",
        muted: true,
        outputLocation: mp4Out,
        inputProps: job.props,
      });
      const secs = (durationInFrames / composition.fps).toFixed(1);
      console.log(`  ✓ ${job.slug}.mp4  (${secs}s, ${composition.width}×${composition.height})`);
    }
  }

  console.log(`\nDone. ${jobs.length} card(s) → ${path.relative(process.cwd(), flags.out)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
