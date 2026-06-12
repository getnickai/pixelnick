/**
 * Render the next N upcoming-game (match preview) cards to PNG.
 *
 * The upcoming fixtures come from /api/swarm-upcoming (Elo-only preview, no
 * agent council). The swarm-card composition's "match" card reads the deck's
 * `match`, so we feed each fixture as `deck.match` and render it headlessly via
 * Remotion — the reliable path (in-browser html-to-image hangs on these cards).
 *
 * Usage:
 *   bun scripts/generate-upcoming-cards.ts [--n=5] [--theme=dark|light]
 *     [--src=<upcoming json url>] [--out=<dir>]
 */
import path from "node:path";
import fs from "node:fs";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import { enableTailwind } from "@remotion/tailwind-v4";

const argv = process.argv.slice(2);
const flag = (name: string, def: string) => {
  const a = argv.find((x) => x.startsWith(`--${name}=`));
  return a ? a.slice(name.length + 3) : def;
};

const N = Number(flag("n", "5")) || 5;
const THEME = flag("theme", "dark");
const SRC = flag("src", "https://swarm-arena-cards.vercel.app/api/swarm-upcoming");
const OUT = path.resolve(flag("out", path.join(process.cwd(), "out", "upcoming")));
const PUBLIC_DIR = path.join(process.cwd(), "public");

type Game = {
  kickoffISO: string;
  home: { name: string; code?: string };
  away: { name: string; code?: string };
  [k: string]: unknown;
};

async function main() {
  console.log(`Fetching upcoming fixtures from ${SRC} …`);
  const res = await fetch(SRC);
  if (!res.ok) throw new Error(`upcoming feed ${res.status}`);
  const feed = (await res.json()) as { games?: Game[] };
  const games = (feed.games ?? [])
    .slice()
    .sort((a, b) => (a.kickoffISO < b.kickoffISO ? -1 : a.kickoffISO > b.kickoffISO ? 1 : 0))
    .slice(0, N);
  if (games.length === 0) throw new Error("no upcoming fixtures in the feed");
  console.log(`Rendering the next ${games.length} game(s) → ${path.relative(process.cwd(), OUT)}/`);

  fs.mkdirSync(OUT, { recursive: true });
  console.log("Bundling Remotion project…");
  const serveUrl = await bundle({
    entryPoint: path.join(process.cwd(), "remotion", "index.ts"),
    webpackOverride: (config) => enableTailwind(config),
  });
  // Mirror public/ into the bundle so staticFile() asset paths resolve headlessly.
  fs.cpSync(PUBLIC_DIR, serveUrl, { recursive: true });

  for (const [i, g] of games.entries()) {
    // Feed the fixture as the deck's match; renderMatchCard(null) reads it.
    const props = {
      card: "match",
      theme: THEME,
      size: "portrait",
      deck: { agents: [], match: g },
    } as Record<string, unknown>;
    const composition = await selectComposition({ serveUrl, id: "swarm-card", inputProps: props });
    const slug = `upcoming-${String(i + 1).padStart(2, "0")}-${(g.home.code ?? "").toLowerCase()}-${(g.away.code ?? "").toLowerCase()}`;
    await renderStill({
      composition,
      serveUrl,
      output: path.join(OUT, `${slug}.png`),
      inputProps: props,
      frame: composition.durationInFrames - 1, // settled frame
      imageFormat: "png",
    });
    console.log(`  ✓ ${slug}.png  (${g.home.name} vs ${g.away.name})`);
  }

  console.log(`\nDone. ${games.length} card(s) → ${path.relative(process.cwd(), OUT)}/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
