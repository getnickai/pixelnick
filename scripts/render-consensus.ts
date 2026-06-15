/**
 * Render the "Market vs Agents" consensus card to PNG + MP4.
 *
 * Two modes, same card design (the registered `consensus-card` Remotion
 * composition → the React ConsensusCardView):
 *
 *  1. CONSENSUS (default): feed each chosen record from consensus.json (written
 *     by scripts/swarm-consensus.ts) straight through as `data`. A record is a
 *     superset of ConsensusCardData. Market vs Agents body.
 *
 *  2. PREVIEW (`--preview-game=`): for fixtures the agents haven't traded yet
 *     (no consensus record), render the SAME design in its Elo-only preview
 *     mode — 3-way win probability + Elo ratings + an honest "agent picks land
 *     closer to kickoff" note. Fixtures + Elo come from /api/swarm-upcoming.
 *
 *   PNG = settled final frame.   MP4 = the full animation.
 *
 * Flags:
 *   --game=<substr>         consensus: pick records whose `game` contains this (repeatable)
 *   --market=<type>         consensus: restrict to one marketType (moneyline|btts|totals)
 *   --all                   consensus: render every record in consensus.json
 *   --no-top                consensus: render every market for a game (default = highest edge)
 *   --preview-game=<substr> PREVIEW: render the Elo-only card for this fixture (repeatable)
 *   --src=<url>             preview: upcoming/Elo feed (default the prod /api/swarm-upcoming)
 *   --no-mp4                PNG only (faster)
 *   --feed=<path>           consensus.json path (default public/swarm-arena-cards/consensus.json)
 *   --out=<dir>             output dir (default out/consensus)
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, renderMedia, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const COMPOSITION_ID = "consensus-card";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const DEFAULT_SRC = "https://swarm-arena-cards.vercel.app/api/swarm-upcoming";

type Rec = {
  home: string; away: string; homeCode: string; awayCode: string;
  game: string; marketType: string; selection: string; line: number | null;
  marketPrice: number; consensus: number; edgePp: number;
  agentsN: number; agentsTotal: number;
  [k: string]: unknown;
};

type Job = { slug: string; desc: string; data: Record<string, unknown> };

function parse(argv: string[]) {
  const games: string[] = [];
  const previewGames: string[] = [];
  const f = { market: "", all: false, top: true, mp4: true, src: DEFAULT_SRC,
    feed: path.join(PUBLIC_DIR, "swarm-arena-cards", "consensus.json"),
    out: path.join(process.cwd(), "out", "mp4") };
  for (const a of argv) {
    if (a.startsWith("--game=")) games.push(a.slice(7).toLowerCase());
    else if (a.startsWith("--preview-game=")) previewGames.push(a.slice(15).toLowerCase());
    else if (a.startsWith("--market=")) f.market = a.slice(9).toLowerCase();
    else if (a === "--all") f.all = true;
    else if (a === "--top") f.top = true;
    else if (a === "--no-top") f.top = false;
    else if (a === "--no-mp4") f.mp4 = false;
    else if (a.startsWith("--src=")) f.src = a.slice(6);
    else if (a.startsWith("--feed=")) f.feed = path.resolve(a.slice(7));
    else if (a.startsWith("--out=")) f.out = path.resolve(a.slice(6));
  }
  return { ...f, games, previewGames };
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** Consensus mode: select records from consensus.json. */
function pickConsensus(records: Rec[], o: ReturnType<typeof parse>): Job[] {
  let recs = records;
  if (o.market) recs = recs.filter((r) => r.marketType.toLowerCase() === o.market);
  const chosen: Rec[] = o.all
    ? recs
    : o.games.flatMap((g) => {
        const matched = recs.filter((r) => r.game.toLowerCase().includes(g));
        if (!matched.length) { console.warn(`  ! no consensus record matches "${g}" — agents may not cover it (try --preview-game).`); return []; }
        return o.top ? [[...matched].sort((a, b) => b.edgePp - a.edgePp)[0]] : matched;
      });
  return chosen.map((r) => ({
    slug: `consensus-${slugify(r.home)}-vs-${slugify(r.away)}-${r.marketType}`,
    desc: `${r.game} [${r.marketType}/${r.selection}${r.line != null ? " " + r.line : ""}] swarm ${Math.round(r.consensus * 100)}% vs mkt ${Math.round(r.marketPrice * 100)}% edge ${r.edgePp >= 0 ? "+" : ""}${r.edgePp}pp (${r.agentsN}/${r.agentsTotal})`,
    data: { ...r, slide: undefined } as unknown as Record<string, unknown>,
  }));
}

type ApiGame = {
  home: { name: string; code: string }; away: { name: string; code: string };
  odds: { homePct: number; drawPct: number; awayPct: number };
  elo?: { home: number; away: number };
  kickoff?: string; stage?: string; competition?: string; venue?: string;
};

/** Honest one-line read from the 3-way win probability. */
function modelRead(g: ApiGame): string {
  const { homePct: h, drawPct: d, awayPct: a } = g.odds;
  const fav = Math.max(h, d, a);
  if (fav === d) return `Too close to call — the draw leads at ${d}%.`;
  const favName = fav === h ? g.home.name : g.away.name;
  return `${favName} favoured at ${fav}%, but ${d}% says the draw is in play.`;
}

/** Preview mode: build Elo-only cards from the upcoming feed. */
async function pickPreview(o: ReturnType<typeof parse>): Promise<Job[]> {
  console.log(`Fetching upcoming fixtures from ${o.src} …`);
  const res = await fetch(o.src);
  if (!res.ok) { console.error(`Upcoming feed ${res.status}`); process.exit(1); }
  const json = (await res.json()) as { games?: ApiGame[] } | ApiGame[];
  const games: ApiGame[] = Array.isArray(json) ? json : json.games ?? [];
  return o.previewGames.flatMap((q) => {
    const g = games.find((x) => `${x.home.name} ${x.away.name}`.toLowerCase().includes(q));
    if (!g) { console.warn(`  ! no upcoming fixture matches "${q}" — skipping.`); return []; }
    const data = {
      home: g.home.name, away: g.away.name, homeCode: g.home.code, awayCode: g.away.code,
      competition: g.competition, stage: g.stage, venue: g.venue, kickoff: g.kickoff,
      marketType: "moneyline", selection: "Home", line: null,
      marketPrice: 0, consensus: 0, edgePp: 0, agentsN: 0, agentsTotal: 0, perAgent: [],
      preview: true,
      winProb: { home: g.odds.homePct / 100, draw: g.odds.drawPct / 100, away: g.odds.awayPct / 100 },
      elo: g.elo ? { home: g.elo.home, away: g.elo.away } : undefined,
      modelRead: modelRead(g),
    };
    return [{
      slug: `consensus-preview-${slugify(g.home.name)}-vs-${slugify(g.away.name)}`,
      desc: `${g.home.name} vs ${g.away.name} [Elo preview] win% ${g.odds.homePct}/${g.odds.drawPct}/${g.odds.awayPct}${g.elo ? ` · elo ${g.elo.home}/${g.elo.away}` : ""}`,
      data,
    }];
  });
}

async function main() {
  const o = parse(process.argv.slice(2));
  let jobs: Job[];
  if (o.previewGames.length) {
    jobs = await pickPreview(o);
  } else {
    if (!fs.existsSync(o.feed)) { console.error(`No consensus feed at ${o.feed}. Run \`bun scripts/swarm-consensus.ts\` first.`); process.exit(1); }
    if (!o.all && !o.games.length) { console.error("Nothing selected. Pass --game=<substr>, --all, or --preview-game=<substr>."); process.exit(1); }
    const feed = JSON.parse(fs.readFileSync(o.feed, "utf8")) as { records: Rec[] };
    jobs = pickConsensus(feed.records ?? [], o);
  }
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
