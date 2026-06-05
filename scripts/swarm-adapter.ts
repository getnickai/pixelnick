/**
 * Swarm Arena adapter — maps a competitor agent's R2 output to the card
 * engine's agent object, then writes a deck JSON the card kit can `SA.load()`.
 *
 * Real competitor: S1 Match Reader (ChatGPT), wfl_vlbkalq5rn9b, a WC football
 * paper-better running in shadow mode on a $1000 bankroll. Its profile/snapshot
 * already match pixelnick's AgentProfile/AgentSnapshot; its run files carry
 * positions[] with the per-pick edge we surface on the card.
 *
 * Layout read: <AGENT_PREFIX>/profile.json + snapshot.json + runs/<date>/<exe>.json
 *
 * Run: bun scripts/swarm-adapter.ts   → public/swarm-arena-cards/live-deck.json
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./feed";

const BUCKET = "nickai-swarmarena-internal";
const AGENT_PREFIX = "nickai/agents/wfl_vlbkalq5rn9b/";
const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "live-deck.json");

const client = s3Client();
async function getJson<T>(key: string): Promise<T> {
  const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  return JSON.parse(await res.Body!.transformToString()) as T;
}

const profile: any = await getJson(`${AGENT_PREFIX}profile.json`);
const snap: any = await getJson(`${AGENT_PREFIX}snapshot.json`);

// All run files (history → equity curve + the latest positions for picks).
const runKeys: { key: string; mod: Date }[] = [];
let token: string | undefined;
do {
  const page = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: `${AGENT_PREFIX}runs/`, ContinuationToken: token }),
  );
  for (const o of page.Contents ?? []) {
    if (o.Key?.endsWith(".json") && o.LastModified) runKeys.push({ key: o.Key, mod: o.LastModified });
  }
  token = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (token);
runKeys.sort((a, b) => a.mod.getTime() - b.mod.getTime());
const runs: any[] = await Promise.all(runKeys.map((r) => getJson(r.key)));
const latestRun = runs.at(-1) ?? { positions: [] };

console.log(`Agent: ${profile.agentName} (${profile.workflowId})`);
console.log(`Run files: ${runs.length}; latest positions: ${latestRun.positions?.length ?? 0}`);

/* ── derive card fields ─────────────────────────────────────────────────── */
const BASE = snap.bankrollRefUsd ?? 1000;
const roiPct = snap.profitPercent ?? 0;
const equity = BASE + (snap.pnlUsd ?? 0);

// Equity curve from run history (bankroll + that run's pnl). Falls back to a
// 2-point line until several runs exist.
const curve = runs.map((r) => BASE + (r.pnlUsd ?? 0));
const spark = curve.length >= 2 ? [BASE, ...curve] : [BASE, equity];

// Pretty bet formatting from a position.
const MARKET_LABEL: Record<string, string> = {
  totals: "Total goals",
  btts: "Both teams to score",
  moneyline: "Match winner",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// Selection only (no price) — the card already shows the edge, and the price
// string would squeeze the fixture column under the real monospace font.
const sideOf = (p: any) =>
  p.market_type === "totals" ? `${cap(p.direction)} ${p.line}` : cap(String(p.direction));
// The fixture is the useful context; the side string ("Over 2.5 @ 0.45")
// already implies the market type, so keep this short to fit the pick column.
const marketOf = (p: any) => String(p.match).replace(" vs ", " v ");

const positions = [...(latestRun.positions ?? [])].sort((a, b) => (b.edge_pp ?? 0) - (a.edge_pp ?? 0));
const top = positions[0];

// nextRun countdown string.
const nextRun = (() => {
  if (!snap.nextRunISO) return "—";
  const diffMin = Math.round((new Date(snap.nextRunISO).getTime() - Date.now()) / 60000);
  if (diffMin <= 0) return "due";
  const h = Math.floor(diffMin / 60), m = diffMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
})();

const agent = {
  handle: "S1GPT",
  code: "GPT",
  short: "S1 Match Reader",
  label: profile.agentName,
  provider: `${profile.model} · ${profile.builder?.name ?? ""}`.trim(),
  flag: "⚽",
  color: "#10a37f",
  kind: "llm",
  roiPct: Number(roiPct.toFixed(2)),
  // No settled bets yet (closedPositions = 0) → accuracy unknown. Use the
  // share of picks the sharp market agrees with as an honest quality proxy.
  pickPct: positions.length
    ? Number((positions.filter((p) => p.sharp_agreement === "sharp_supports_edge").length / positions.length).toFixed(2))
    : 0,
  signals: snap.tradesTotal ?? positions.length,
  nextRun,
  activeSince: new Date(profile.activeSinceISO).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
  spark,
  pick: top
    ? { market: marketOf(top), side: sideOf(top), edgePp: Number((top.edge_pp ?? 0).toFixed(1)) }
    : { market: "No open picks", side: "—", edgePp: 0 },
  recent: positions.slice(0, 3).map((p) => ({ market: marketOf(p), side: sideOf(p), pnl: Number((p.mtm_pnl_usd ?? 0).toFixed(2)) })),
};

const deck = {
  _generatedFrom: AGENT_PREFIX,
  _asOf: snap.asOfISO,
  _note: `real competitor (shadow mode). ROI/pnl/picks/nextRun are real. pickPct = sharp-agreement proxy until bets settle (closedPositions=${snap.closedPositions}).`,
  agents: [agent],
  match: null,
};

fs.writeFileSync(OUT, JSON.stringify(deck, null, 2));
console.log(`\n${JSON.stringify(agent, null, 2)}`);
console.log(`\nWrote ${path.relative(process.cwd(), OUT)}`);
