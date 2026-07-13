/**
 * Render the single-agent "Result + Portfolio" card to PNG + MP4.
 *
 * Feeds each record from nick-results.json (written by scripts/swarm-nick.ts)
 * straight through as `data` to the registered `result-portfolio-card` Remotion
 * composition → the React ResultPortfolioCardView. A record is a
 * ResultPortfolioCardData (final score + Nick's pick + running portfolio).
 *
 *   PNG = settled final frame.   MP4 = payout slot + portfolio slot reveal.
 *
 * Flags (mirror render-results.ts):
 *   --game=<substr>   pick records whose `game` contains this (repeatable)
 *   --all             render every record
 *   --no-mp4          PNG only
 *   --feed=<path>     default public/swarm-arena-cards/nick-results.json
 *   --out=<dir>       default out/mp4
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const COMPOSITION_ID = "result-portfolio-card";
const PUBLIC_DIR = path.join(process.cwd(), "public");

type Rec = { home: string; away: string; game: string; homeScore: number; awayScore: number; marketType: string; selection: string; hit: boolean; totalPnl: number; portfolioUsd: number; [k: string]: unknown };
type Job = { slug: string; desc: string; data: Record<string, unknown> };

function parse(argv: string[]) {
  const games: string[] = [];
  const f = {
    all: false, mp4: true,
    feed: path.join(PUBLIC_DIR, "swarm-arena-cards", "nick-results.json"),
    out: path.join(process.cwd(), "out", "mp4"),
  };
  for (const a of argv) {
    if (a.startsWith("--game=")) games.push(a.slice(7).toLowerCase());
    else if (a === "--all") f.all = true;
    else if (a === "--no-mp4") f.mp4 = false;
    else if (a.startsWith("--feed=")) f.feed = path.resolve(a.slice(7));
    else if (a.startsWith("--out=")) f.out = path.resolve(a.slice(6));
  }
  return { ...f, games };
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function pick(records: Rec[], o: ReturnType<typeof parse>): Job[] {
  const chosen: Rec[] = o.all
    ? records
    : o.games.flatMap((g) => {
        const matched = records.filter((r) => r.game.toLowerCase().includes(g));
        if (!matched.length) { console.warn(`  ! no settled record matches "${g}" — run swarm-nick.ts, or Nick has no settled pick on it.`); return []; }
        return [matched[0]];
      });
  return chosen.map((r) => ({
    slug: `result-portfolio-${slugify(r.home)}-vs-${slugify(r.away)}`,
    desc: `${r.home} ${r.homeScore}-${r.awayScore} ${r.away} [${r.marketType}/${r.selection}] ${r.hit ? "HIT" : "MISS"} ${r.totalPnl >= 0 ? "+" : ""}$${r.totalPnl} → portfolio $${r.portfolioUsd}`,
    data: r as unknown as Record<string, unknown>,
  }));
}

async function main() {
  const o = parse(process.argv.slice(2));
  if (!fs.existsSync(o.feed)) { console.error(`No feed at ${o.feed}. Run \`bun scripts/swarm-nick.ts\` first.`); process.exit(1); }
  if (!o.all && !o.games.length) { console.error("Nothing selected. Pass --game=<substr> or --all."); process.exit(1); }
  const feed = JSON.parse(fs.readFileSync(o.feed, "utf8")) as { records: Rec[] };
  const jobs = pick(feed.records ?? [], o);
  if (!jobs.length) { console.error("No cards selected — nothing to render."); process.exit(1); }
  fs.mkdirSync(o.out, { recursive: true });

  console.log(`Selected ${jobs.length} card(s):`);
  for (const j of jobs) console.log(`  • ${j.desc}`);

  console.log("\nBundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });
  console.log(`Bundle ready. Rendering → ${path.relative(process.cwd(), o.out)}/\n`);

  for (const job of jobs) {
    const inputProps = { data: job.data, slide: true } as Record<string, unknown>;
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });

    const png = path.join(o.out, `${job.slug}.png`);
    await renderStill({ composition, serveUrl, output: png, inputProps, frame: composition.durationInFrames - 1, imageFormat: "png" });
    console.log(`  ✓ ${job.slug}.png  (${composition.width}×${composition.height})`);

    if (o.mp4) {
      const mp4 = path.join(o.out, `${job.slug}.mp4`);
      await renderMedia({ composition, serveUrl, codec: "h264", muted: true, outputLocation: mp4, inputProps });
      console.log(`  ✓ ${job.slug}.mp4  (${(composition.durationInFrames / composition.fps).toFixed(1)}s, ${composition.width}×${composition.height})`);
    }
  }
  console.log(`\nDone. ${jobs.length} card(s) → ${path.relative(process.cwd(), o.out)}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
