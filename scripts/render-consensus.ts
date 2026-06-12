/**
 * Render the "Market vs Agents" consensus card to PNG + MP4 from the
 * consensus.json snapshot (written by scripts/swarm-consensus.ts).
 *
 * There's no consensus path in generate-swarm-cards.ts yet, so this is the
 * dedicated harness: it feeds each chosen consensus record straight into the
 * registered `consensus-card` Remotion composition (which renders the React
 * ConsensusCardView — slot-machine count-ups + blur-edge reveal).
 *
 * A consensus.json record is a superset of ConsensusCardData, so it's passed
 * through as `data` verbatim.
 *
 *   PNG  = settled final frame.
 *   MP4  = the full 240-frame (8s) animation.
 *
 * Flags:
 *   --game=<substr>   pick records whose `game` contains this (repeatable)
 *   --market=<type>   restrict to one marketType (moneyline|btts|totals)
 *   --all             render every record in consensus.json
 *   --top             when a game has several markets, keep only the
 *                     highest-edge one (default when --game is used)
 *   --no-mp4          PNG only (faster)
 *   --feed=<path>     consensus.json path (default public/swarm-arena-cards/consensus.json)
 *   --out=<dir>       output dir (default out/consensus)
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const COMPOSITION_ID = "consensus-card";
const PUBLIC_DIR = path.join(process.cwd(), "public");

type Rec = {
  home: string; away: string; homeCode: string; awayCode: string;
  game: string; marketType: string; selection: string; line: number | null;
  marketPrice: number; consensus: number; edgePp: number;
  agentsN: number; agentsTotal: number;
  [k: string]: unknown;
};

function parse(argv: string[]) {
  const games: string[] = [];
  const f = { market: "", all: false, top: true, mp4: true,
    feed: path.join(PUBLIC_DIR, "swarm-arena-cards", "consensus.json"),
    out: path.join(process.cwd(), "out", "consensus") };
  for (const a of argv) {
    if (a.startsWith("--game=")) games.push(a.slice(7).toLowerCase());
    else if (a.startsWith("--market=")) f.market = a.slice(9).toLowerCase();
    else if (a === "--all") f.all = true;
    else if (a === "--top") f.top = true;
    else if (a === "--no-top") f.top = false;
    else if (a === "--no-mp4") f.mp4 = false;
    else if (a.startsWith("--feed=")) f.feed = path.resolve(a.slice(7));
    else if (a.startsWith("--out=")) f.out = path.resolve(a.slice(6));
  }
  return { ...f, games };
}

function pick(records: Rec[], o: ReturnType<typeof parse>): Rec[] {
  let recs = records;
  if (o.market) recs = recs.filter((r) => r.marketType.toLowerCase() === o.market);
  if (o.all) return recs;
  if (!o.games.length) {
    console.error("Nothing selected. Pass --game=<substr> (repeatable) or --all.");
    process.exit(1);
  }
  const out: Rec[] = [];
  for (const g of o.games) {
    const matched = recs.filter((r) => r.game.toLowerCase().includes(g));
    if (!matched.length) { console.warn(`  ! no consensus record matches game "${g}" — skipping (agents may not cover it).`); continue; }
    if (o.top) {
      const best = [...matched].sort((a, b) => b.edgePp - a.edgePp)[0];
      out.push(best);
    } else out.push(...matched);
  }
  return out;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const o = parse(process.argv.slice(2));
  if (!fs.existsSync(o.feed)) { console.error(`No consensus feed at ${o.feed}. Run \`bun scripts/swarm-consensus.ts\` first.`); process.exit(1); }
  const feed = JSON.parse(fs.readFileSync(o.feed, "utf8")) as { records: Rec[] };
  const jobs = pick(feed.records ?? [], o);
  if (!jobs.length) { console.error("No records selected — nothing to render."); process.exit(1); }
  fs.mkdirSync(o.out, { recursive: true });

  console.log(`Selected ${jobs.length} card(s):`);
  for (const r of jobs) console.log(`  • ${r.game}  [${r.marketType}/${r.selection}${r.line != null ? " " + r.line : ""}]  swarm ${(r.consensus*100).toFixed(0)}% vs mkt ${(r.marketPrice*100).toFixed(0)}%  edge ${r.edgePp >= 0 ? "+" : ""}${r.edgePp}pp  (${r.agentsN}/${r.agentsTotal})`);

  console.log("\nBundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });
  console.log(`Bundle ready. Rendering → ${path.relative(process.cwd(), o.out)}/\n`);

  for (const rec of jobs) {
    const slug = `consensus-${rec.marketType}-${slugify(rec.homeCode)}-${slugify(rec.awayCode)}`;
    const inputProps = { data: rec, slide: true } as Record<string, unknown>;
    const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps });

    const png = path.join(o.out, `${slug}.png`);
    await renderStill({ composition, serveUrl, output: png, inputProps, frame: composition.durationInFrames - 1, imageFormat: "png" });
    console.log(`  ✓ ${slug}.png  (${composition.width}×${composition.height})`);

    if (o.mp4) {
      const mp4 = path.join(o.out, `${slug}.mp4`);
      await renderMedia({ composition, serveUrl, codec: "h264", muted: true, outputLocation: mp4, inputProps });
      console.log(`  ✓ ${slug}.mp4  (${(composition.durationInFrames / composition.fps).toFixed(1)}s, ${composition.width}×${composition.height})`);
    }
  }
  console.log(`\nDone. ${jobs.length} card(s) → ${path.relative(process.cwd(), o.out)}/`);
}

main().catch((err) => { console.error(err); process.exit(1); });
