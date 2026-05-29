/**
 * Multi-source card generator.
 *
 * For each configured source (e.g. nickai, swarm-arena), the pipeline:
 *   1. Lists agents/{workflowId}/snapshot.json under the source's R2 prefix.
 *   2. Filters by the source's pull-log watermark — only fresh snapshots.
 *   3. Loads each matching profile.json.
 *   4. Ranks by profitPercent desc, takes the source's Top N.
 *   5. Renders PNG (settled frame) + MP4 (5s animation) to
 *      `out/<source>/<slug>.{png,mp4}`.
 *   6. Posts each new/changed card to the source's Slack channel with a
 *      caption that includes the source label ("via NickAI" / "via Swarm Arena").
 *   7. Records the build in the ledger under key `<source>/<slug>` so the
 *      same slug in different sources can never collide.
 *   8. Advances the source's pull-log watermark.
 *
 * Sources are configured purely from env (SOURCES + per-source vars).
 * Without SOURCES, the script falls back to a single "default" source from
 * --data= / S3_FEED_URL / mock data, so back-compat with the curated-feed
 * mode is preserved for testing.
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
  ledgerKey,
  type Plan,
} from "./ledger";
import {
  slackTokenFromEnv,
  postCardToSlack,
  buildCaption,
} from "./slack";
import { readFeed } from "./feed";
import { pullAgentsFromR2 } from "./r2-source";
import {
  loadPullLog,
  savePullLog,
  getSourceState,
  setSourceState,
} from "./pull-log";
import { toCardDataFromR2 } from "../data/agent-output";
import { loadSources, type Source } from "../data/sources";

const COMPOSITION_ID = "performance-card";
const OUT_DIR = path.join(process.cwd(), "out");
const PUBLIC_DIR = path.join(process.cwd(), "public");
const AVATAR_DIR = path.join(PUBLIC_DIR, "figma", "avatars");

type Flags = {
  slug?: string;
  data?: string;
  /** Treat R2 watermark as if it weren't set (process every snapshot). */
  fullPull: boolean;
  pngOnly: boolean;
  mp4Only: boolean;
  force: boolean;
  dryRun: boolean;
  noSlack: boolean;
};

function parseFlags(argv: string[]): Flags {
  const flags: Flags = {
    fullPull: false,
    pngOnly: false,
    mp4Only: false,
    force: false,
    dryRun: false,
    noSlack: false,
  };
  for (const arg of argv) {
    if (arg.startsWith("--slug=")) flags.slug = arg.slice("--slug=".length);
    else if (arg.startsWith("--data=")) flags.data = arg.slice("--data=".length);
    else if (arg === "--full-pull") flags.fullPull = true;
    else if (arg === "--png") flags.pngOnly = true;
    else if (arg === "--mp4") flags.mp4Only = true;
    else if (arg === "--force") flags.force = true;
    else if (arg === "--dry-run") flags.dryRun = true;
    else if (arg === "--no-slack") flags.noSlack = true;
  }
  return flags;
}

/** A batch of agents scoped to one source — drives the render+post loop. */
type Batch = {
  source: Source;
  agents: AgentCardData[];
};

/** Output path for a card under its source folder. */
function outputPath(sourceName: string, slug: string, ext: "png" | "mp4"): string {
  return path.join(OUT_DIR, sourceName, `${slug}.${ext}`);
}

/** True when the expected output files for this source/slug already exist. */
function outputsExist(sourceName: string, slug: string, flags: Flags): boolean {
  const pngOk = flags.mp4Only || fs.existsSync(outputPath(sourceName, slug, "png"));
  const mp4Ok = flags.pngOnly || fs.existsSync(outputPath(sourceName, slug, "mp4"));
  return pngOk && mp4Ok;
}

/**
 * Build the batch list for this run. Three paths:
 *   - --data=<source>          curated single batch (source="default")
 *   - SOURCES configured       one batch per source, pulled from R2
 *   - neither                  one mock batch (source="default")
 */
async function resolveBatches(flags: Flags): Promise<Batch[]> {
  // Explicit curated path always wins (testing override).
  if (flags.data) {
    const raw = await readFeed(flags.data);
    const parsed = JSON.parse(raw) as AgentInput[];
    if (!Array.isArray(parsed)) {
      throw new Error(`${flags.data} must contain a JSON array of agents.`);
    }
    const now = new Date();
    const defaultSource: Source = {
      name: "default",
      label: process.env.SOURCE_LABEL_DEFAULT ?? "NickAI",
      r2Prefix: "",
      slackChannelId: process.env.SLACK_CHANNEL_ID ?? "",
      topN: parsed.length, // curated data is already curated
    };
    console.log(`Reading curated feed: ${flags.data}`);
    return [{ source: defaultSource, agents: parsed.map((i) => toCardData(i, now)) }];
  }

  const sources = loadSources();

  // Curated env-only fallback (S3_FEED_URL) when no SOURCES set.
  if (sources.length === 0 && process.env.S3_FEED_URL) {
    const raw = await readFeed(process.env.S3_FEED_URL);
    const parsed = JSON.parse(raw) as AgentInput[];
    const now = new Date();
    return [
      {
        source: {
          name: "default",
          label: "NickAI",
          r2Prefix: "",
          slackChannelId: process.env.SLACK_CHANNEL_ID ?? "",
          topN: parsed.length,
        },
        agents: parsed.map((i) => toCardData(i, now)),
      },
    ];
  }

  // No sources, no curated feed → mock data for local testing.
  if (sources.length === 0) {
    return [
      {
        source: {
          name: "default",
          label: "NickAI",
          r2Prefix: "",
          slackChannelId: process.env.SLACK_CHANNEL_ID ?? "",
          topN: mockAgents.length,
        },
        agents: mockAgents,
      },
    ];
  }

  // Real production path: pull each source from R2.
  const pullLog = loadPullLog();
  const batches: Batch[] = [];
  for (const source of sources) {
    const state = getSourceState(pullLog, source.name);
    const since = flags.fullPull ? null : state.lastPulledISO;
    console.log(
      `[${source.name}] pulling ${source.r2Prefix}` +
        (since ? ` (since ${since})` : " (full pull)"),
    );
    const fresh = await pullAgentsFromR2(source.r2Prefix, since);
    console.log(`[${source.name}] fresh snapshots: ${fresh.length}`);

    // Rank by profitPercent desc; take Top N for this source.
    fresh.sort((a, b) => b.snapshot.profitPercent - a.snapshot.profitPercent);
    const selected = fresh.slice(0, Math.max(1, source.topN));
    if (selected.length > 0) {
      console.log(`[${source.name}] Top ${source.topN} by profitPercent:`);
      for (const f of selected) {
        console.log(
          `    · ${f.profile.agentName}  ${f.snapshot.profitPercent}%`,
        );
      }
    }

    // Advance the source's watermark to the max LastModified observed across
    // ALL fresh agents (not just the rendered Top N), so non-selected agents
    // don't replay every run.
    if (!flags.dryRun && fresh.length > 0) {
      const maxLastMod = fresh
        .map((f) => f.snapshotLastModifiedISO)
        .sort()
        .at(-1)!;
      const updated = {
        lastPulledISO: maxLastMod,
        agentsSeen: { ...state.agentsSeen },
      };
      for (const f of fresh) updated.agentsSeen[f.workflowId] = f.snapshotLastModifiedISO;
      setSourceState(pullLog, source.name, updated);
    }

    const now = new Date();
    batches.push({
      source,
      agents: selected.map((f) => toCardDataFromR2(f.profile, f.snapshot, now)),
    });
  }

  // Persist pull-log once after all sources have been pulled.
  if (!flags.dryRun) {
    pullLog.pullCount += 1;
    savePullLog(pullLog);
  }

  return batches;
}

/**
 * Download any remote (http/https) avatar into public/figma/avatars/ and
 * rewrite the agent's `builderAvatar` to the resulting /public path. Local
 * paths pass through untouched.
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

  const batches = await resolveBatches(flags);

  // Optional single-agent filter applies across whichever batch contains the
  // requested slug.
  if (flags.slug) {
    for (const b of batches) {
      b.agents = b.agents.filter((a) => a.slug === flags.slug);
    }
  }

  const totalAgents = batches.reduce((n, b) => n + b.agents.length, 0);
  if (totalAgents === 0) {
    console.error(
      `No agents to render${flags.slug ? ` (slug="${flags.slug}")` : ""}.`,
    );
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Plan per batch (so unchanged cards are skipped before we spin up Remotion).
  const ledger = loadLedger();
  const planned: { batch: Batch; plans: Plan[] }[] = batches.map((batch) => ({
    batch,
    plans: planBuilds(batch.source.name, batch.agents, ledger, {
      force: flags.force,
      outputsExist: (slug) => outputsExist(batch.source.name, slug, flags),
    }),
  }));

  // Report the combined plan.
  let totalBuild = 0;
  let totalSkip = 0;
  for (const { batch, plans } of planned) {
    for (const p of plans) {
      if (p.build) totalBuild += 1;
      else totalSkip += 1;
      const tag = p.reason === "unchanged" ? "· skip (unchanged)" : `→ build (${p.reason})`;
      console.log(
        `${tag.startsWith("·") ? " " : "▶"} [${batch.source.name}] ${p.slug}  ${tag}`,
      );
    }
  }

  if (flags.dryRun) {
    console.log(
      `\nDry run. Would build ${totalBuild}, skip ${totalSkip} across ${batches.length} source(s).`,
    );
    return;
  }
  if (totalBuild === 0) {
    console.log(`\nNothing to build — all ${totalAgents} card(s) up to date.`);
    return;
  }

  // Resolve avatars for everything we'll actually build before bundling.
  const allToBuild = planned.flatMap((b) => b.plans.filter((p) => p.build).map((p) => p.agent));
  await resolveAvatars(allToBuild);

  const slackToken = flags.noSlack ? null : slackTokenFromEnv();
  if (!flags.noSlack && !slackToken) {
    console.log("(SLACK_BOT_TOKEN not set — skipping Slack posts.)\n");
  }

  console.log(`\nBundling Remotion project…`);
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });

  // Mirror public/ into the bundle root so the card's `/figma/...` paths
  // resolve identically headlessly (Remotion serves public/ at /public/ by
  // default; the card uses the Next.js convention of /).
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });
  console.log("Bundle ready.\n");

  // Render + post + ledger update, per source.
  for (const { batch, plans } of planned) {
    const buildable = plans.filter((p) => p.build);
    if (buildable.length === 0) continue;

    const sourceOutDir = path.join(OUT_DIR, batch.source.name);
    fs.mkdirSync(sourceOutDir, { recursive: true });

    for (const plan of buildable) {
      const { slug, agent } = plan;
      const { slug: _slug, ...inputProps } = agent;
      console.log(`▶ [${batch.source.name}] ${slug}`);

      const composition = await selectComposition({
        serveUrl,
        id: COMPOSITION_ID,
        inputProps,
      });

      const outputs: { png?: string; mp4?: string } = {};

      if (!flags.mp4Only) {
        const pngOut = outputPath(batch.source.name, slug, "png");
        await renderStill({
          composition,
          serveUrl,
          output: pngOut,
          inputProps,
          frame: composition.durationInFrames - 1,
          imageFormat: "png",
        });
        outputs.png = path.relative(process.cwd(), pngOut);
        console.log(`  ✓ ${outputs.png}`);
      }

      if (!flags.pngOnly) {
        const mp4Out = outputPath(batch.source.name, slug, "mp4");
        await renderMedia({
          composition,
          serveUrl,
          codec: "h264",
          muted: true,
          outputLocation: mp4Out,
          inputProps,
        });
        outputs.mp4 = path.relative(process.cwd(), mp4Out);
        console.log(`  ✓ ${outputs.mp4}`);
      }

      // Post to this source's Slack channel.
      const entryKey = ledgerKey(batch.source.name, slug);
      let publishedTo = ledger.cards[entryKey]?.publishedTo;
      if (slackToken && batch.source.slackChannelId) {
        try {
          const result = await postCardToSlack(
            { token: slackToken, channelId: batch.source.slackChannelId },
            agent,
            outputs,
            buildCaption(agent, batch.source.label),
          );
          publishedTo = result.permalink ?? publishedTo;
          console.log(`  ⤴ slack: ${result.permalink ?? "posted"}`);
        } catch (err) {
          console.error(
            `  ✗ slack post failed for ${entryKey}: ${(err as Error).message}`,
          );
        }
      } else if (slackToken && !batch.source.slackChannelId) {
        console.warn(
          `  ! no slack channel configured for source "${batch.source.name}" — skipped post`,
        );
      }

      // Persist the ledger after every card so a crash mid-batch doesn't lose
      // already-built work.
      ledger.cards[entryKey] = {
        source: batch.source.name,
        slug,
        agentName: agent.agentName,
        hash: hashCard(agent),
        builtAt: new Date().toISOString(),
        outputs: { ...ledger.cards[entryKey]?.outputs, ...outputs },
        publishedTo,
      };
      saveLedger(ledger);
    }
  }

  const newCount = planned
    .flatMap((b) => b.plans)
    .filter((p) => p.build && p.reason === "new").length;
  const updatedCount = planned
    .flatMap((b) => b.plans)
    .filter((p) => p.build && p.reason === "updated").length;
  console.log(
    `\nDone. Built ${totalBuild} (${newCount} new, ${updatedCount} updated), ` +
      `skipped ${totalSkip}. → ${path.relative(process.cwd(), OUT_DIR)}/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
