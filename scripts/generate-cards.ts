/**
 * Batch card generator.
 *
 * Bundles the Remotion project once, then for every agent in the data source
 * renders BOTH outputs to `out/`:
 *   - `<slug>.png`  — a still of the final settled frame (all count-ups done),
 *                     ideal for OG images / static social posts.
 *   - `<slug>.mp4`  — the full 5s animated card for video posts.
 *
 * Data source:
 *   - default: `data/mock-agents.ts` (already-formatted sample data)
 *   - live:    `--data=agents.json` — a JSON array of raw `AgentInput` objects
 *              (numbers + ISO timestamps + avatar URLs). The adapter in
 *              `data/agent-input.ts` formats them; remote avatars are
 *              downloaded into public/ before rendering.
 *
 * Run:  bun run cards                         (mock agents, PNG + MP4)
 *       bun run cards:png                      (mock agents, PNG only — fast)
 *       bun scripts/generate-cards.ts --data=agents.json
 *       bun scripts/generate-cards.ts --slug=btc-momentum-scalper
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";
import { mockAgents, type AgentCardData } from "../data/mock-agents";
import { toCardData, type AgentInput } from "../data/agent-input";
import {
  loadLedger,
  saveLedger,
  hashCard,
  planBuilds,
  removedSlugs,
} from "./ledger";
import { slackConfigFromEnv, postCardToSlack, buildCaption } from "./slack";
import { readFeed } from "./feed";

const COMPOSITION_ID = "performance-card";
const OUT_DIR = path.join(process.cwd(), "out");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const AVATAR_DIR = path.join(PUBLIC_DIR, "figma", "avatars");

type Flags = {
  slug?: string;
  data?: string;
  pngOnly: boolean;
  mp4Only: boolean;
  force: boolean;
  dryRun: boolean;
  noSlack: boolean;
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    pngOnly: false,
    mp4Only: false,
    force: false,
    dryRun: false,
    noSlack: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--slug=")) flags.slug = arg.slice("--slug=".length);
    else if (arg.startsWith("--data=")) flags.data = arg.slice("--data=".length);
    else if (arg === "--png") flags.pngOnly = true;
    else if (arg === "--mp4") flags.mp4Only = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--no-slack") flags.noSlack = true;
  }
  return flags;
}

/** True when the expected output files for a slug already exist on disk. */
function outputsExist(slug: string, flags: Flags): boolean {
  const pngOk = flags.mp4Only || fs.existsSync(path.join(OUT_DIR, `${slug}.png`));
  const mp4Ok = flags.pngOnly || fs.existsSync(path.join(OUT_DIR, `${slug}.mp4`));
  return pngOk && mp4Ok;
}

/**
 * Resolve the agent list. Source precedence:
 *   1. --data=<source>     (explicit: s3://, https://, or local path)
 *   2. $S3_FEED_URL        (env default, e.g. s3://nickai-cards-feed/input/agents.json)
 *   3. bundled mock data   (no source configured)
 */
async function loadAgents(flags: Flags): Promise<AgentCardData[]> {
  const source = flags.data ?? process.env.S3_FEED_URL;
  if (!source) return mockAgents;

  console.log(`Reading feed: ${source}`);
  const raw = await readFeed(source);
  const parsed = JSON.parse(raw) as AgentInput[];
  if (!Array.isArray(parsed)) {
    throw new Error(`Feed ${source} must contain a JSON array of agents.`);
  }
  const now = new Date();
  return parsed.map((input) => toCardData(input, now));
}

/**
 * Download any remote (http/https) avatar into public/figma/avatars/ and
 * rewrite the agent's `builderAvatar` to the resulting /public path. Local
 * paths (e.g. "/figma/avatar-franklin.png") pass through untouched.
 */
async function resolveAvatars(agents: AgentCardData[]): Promise<void> {
  const remote = agents.filter((a) => /^https?:\/\//i.test(a.builderAvatar));
  if (remote.length === 0) return;
  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  for (const agent of remote) {
    const ext = (path.extname(new URL(agent.builderAvatar).pathname) || ".png").split("?")[0];
    const file = `${agent.slug}${ext}`;
    const res = await fetch(agent.builderAvatar);
    if (!res.ok) {
      throw new Error(`Avatar download failed for ${agent.slug}: ${res.status} ${agent.builderAvatar}`);
    }
    fs.writeFileSync(path.join(AVATAR_DIR, file), Buffer.from(await res.arrayBuffer()));
    agent.builderAvatar = `/figma/avatars/${file}`;
    console.log(`  ↓ avatar ${agent.slug} → public${agent.builderAvatar}`);
  }
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));

  let agents = await loadAgents(flags);
  if (flags.slug) agents = agents.filter((a) => a.slug === flags.slug);

  if (agents.length === 0) {
    console.error(
      `No agents matched${flags.slug ? ` slug="${flags.slug}"` : ""}.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Download remote avatars into public/ before bundling so they get mirrored
  // into the bundle root alongside the other /figma assets.
  await resolveAvatars(agents);

  // Diff the incoming agents against the ledger to decide what to (re)build.
  const ledger = loadLedger();
  const plan = planBuilds(agents, ledger, {
    force: flags.force,
    outputsExist: (slug) => outputsExist(slug, flags),
  });
  const toBuild = plan.filter((p) => p.build);
  const skipped = plan.filter((p) => !p.build);
  const gone = removedSlugs(agents, ledger);

  // Report the plan.
  for (const p of plan) {
    const tag =
      p.reason === "unchanged"
        ? "· skip (unchanged)"
        : `→ build (${p.reason})`;
    console.log(`${tag.startsWith("·") ? " " : "▶"} ${p.slug}  ${tag}`);
  }
  if (gone.length > 0) {
    console.log(`\nIn ledger but not in this pull (left untouched): ${gone.join(", ")}`);
  }

  if (flags.dryRun) {
    console.log(
      `\nDry run. Would build ${toBuild.length}, skip ${skipped.length}. No files written.`,
    );
    return;
  }

  if (toBuild.length === 0) {
    console.log(`\nNothing to build — all ${agents.length} card(s) up to date.`);
    return;
  }

  // Slack handoff config (skipped if --no-slack or env not set).
  const slackCfg = flags.noSlack ? null : slackConfigFromEnv();
  if (!flags.noSlack && !slackCfg) {
    console.log("(SLACK_BOT_TOKEN/SLACK_CHANNEL_ID not set — skipping Slack post.)\n");
  }

  console.log(`\nBundling Remotion project…`);
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });

  // The shared card component references assets as `/figma/...` because the
  // Next.js app serves `public/` at the site root. Remotion instead serves the
  // public folder under `/public/...`, so those absolute paths 404 during a
  // headless render. Mirror `public/` into the bundle root so `/figma/...`
  // resolves identically — keeps the composition usable by both the app and
  // the renderer with zero changes to it.
  fs.cpSync(path.join(process.cwd(), "public"), serveUrl, { recursive: true });
  console.log("Bundle ready.\n");

  for (const { slug, agent } of toBuild) {
    const { slug: _slug, ...inputProps } = agent;
    console.log(`▶ ${slug}`);

    const composition = await selectComposition({
      serveUrl,
      id: COMPOSITION_ID,
      inputProps,
    });

    const outputs: { png?: string; mp4?: string } = {};

    if (!flags.mp4Only) {
      const pngOut = path.join(OUT_DIR, `${slug}.png`);
      await renderStill({
        composition,
        serveUrl,
        output: pngOut,
        inputProps,
        // Last frame: every count-up / wipe has settled to final values.
        frame: composition.durationInFrames - 1,
        imageFormat: "png",
      });
      outputs.png = path.relative(process.cwd(), pngOut);
      console.log(`  ✓ ${outputs.png}`);
    }

    if (!flags.pngOnly) {
      const mp4Out = path.join(OUT_DIR, `${slug}.mp4`);
      await renderMedia({
        composition,
        serveUrl,
        codec: "h264",
        // The card has no audio — drop the empty AAC track for a clean file.
        muted: true,
        // NOTE: renderMedia uses `outputLocation` (renderStill uses `output`).
        // Passing `output` here is silently ignored — frames render but no file
        // is written.
        outputLocation: mp4Out,
        inputProps,
      });
      outputs.mp4 = path.relative(process.cwd(), mp4Out);
      console.log(`  ✓ ${outputs.mp4}`);
    }

    // Post to Slack (one message with PNG + MP4 attached).
    let publishedTo = ledger.cards[slug]?.publishedTo;
    if (slackCfg) {
      try {
        const result = await postCardToSlack(slackCfg, agent, outputs, buildCaption(agent));
        publishedTo = result.permalink ?? publishedTo;
        console.log(`  ⤴ slack: ${result.permalink ?? "posted"}`);
      } catch (err) {
        console.error(`  ✗ slack post failed for ${slug}: ${(err as Error).message}`);
      }
    }

    // Record in the ledger immediately so a crash mid-batch still persists the
    // cards already built.
    ledger.cards[slug] = {
      agentName: agent.agentName,
      hash: hashCard(agent),
      builtAt: new Date().toISOString(),
      outputs: { ...ledger.cards[slug]?.outputs, ...outputs },
      publishedTo,
    };
    saveLedger(ledger);
  }

  const built = toBuild.length;
  const newCount = toBuild.filter((p) => p.reason === "new").length;
  const updatedCount = toBuild.filter((p) => p.reason === "updated").length;
  console.log(
    `\nDone. Built ${built} (${newCount} new, ${updatedCount} updated), ` +
      `skipped ${skipped.length}. → ${path.relative(process.cwd(), OUT_DIR)}/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
