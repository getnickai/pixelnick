/**
 * Swarm consensus builder — "Market vs Agents".
 *
 * Reads the 8 match-reader agents' latest R2 runs, aggregates their per-market
 * `fair_value` into a swarm consensus, and pairs it with the market price the
 * agents traded against (Polymarket). Joins each market to the upcoming-fixture
 * list (swarm-arena mirror `matches`) so we only emit games that haven't kicked
 * off, then writes one consensus record per (game x market) to:
 *
 *   public/swarm-arena-cards/consensus.json
 *
 * Per record:
 *   { game, kickoffISO, venue, home/away, marketType, line, selection,
 *     marketPrice, consensus (mean fair_value), spread:[min,max],
 *     agentsN, agentsTotal, edgePp, perAgent:[{handle, fairValue, edgePp}] }
 *
 * Each agent only posts a fair_value where it took a position, so agentsN
 * varies per market. Source of truth is R2 (NOT the stale, Elo-derived
 * council_decisions / agent_signals DB tables — see
 * swarm-arena/docs/match-consensus-cards-handoff.md).
 *
 * Env: S3_ENDPOINT + AWS_* (R2), SWARM_DB_URL (upcoming fixtures).
 * Run: bun scripts/swarm-consensus.ts [--all] [--limit=20]
 *   --all   include markets on games already kicked off (skip the upcoming filter)
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { s3Client } from "./feed";
import { canonicalHandle } from "../data/swarm-identity";
import { pickEffectiveSnapshot } from "../lib/swarm-agent-shape";

const BUCKET = "nickai-swarmarena-internal";
const BASE = (process.env.SWARM_AGENTS_PREFIX ?? "swarm-arena/agents/").replace(/\/?$/, "/");
const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "consensus.json");

const client = s3Client();
async function getJson<T>(key: string): Promise<T | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch {
    return null;
  }
}
async function listKeys(prefix: string): Promise<{ key: string; mod: Date }[]> {
  const out: { key: string; mod: Date }[] = [];
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of page.Contents ?? []) if (o.Key && o.LastModified) out.push({ key: o.Key, mod: o.LastModified });
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

// ── Normalization ──────────────────────────────────────────────────────────
const strip = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
// Agent match strings → fixture team names. Agents say "United States"; the
// matches table says "USA". Add aliases as new mismatches surface.
const TEAM_ALIAS: Record<string, string> = {
  "united states": "usa",
  "korea republic": "south korea",
  "ir iran": "iran",
};
export const canonTeam = (t: string) => {
  const k = strip(t);
  return TEAM_ALIAS[k] ?? k;
};
// Full team name → code (matches the card engine's TEAM_MARKS keys). Unmapped
// names fall back to a 3-letter slice + the engine's neutral crest.
const CODE: Record<string, string> = {
  Mexico: "MX", "South Africa": "ZA", "South Korea": "KR", "Czech Republic": "CZ",
  Canada: "CA", "Bosnia-Herzegovina": "BA", USA: "US", "United States": "US",
  Paraguay: "PY", Qatar: "QA", Switzerland: "CH", Brazil: "BR", France: "FR",
  Argentina: "AR", England: "GB", Spain: "ES", Germany: "DE", Portugal: "PT",
  Netherlands: "NL", Belgium: "BE", Croatia: "HR", Morocco: "MA", Japan: "JP",
  Uruguay: "UY", Colombia: "CO", Senegal: "SN", Denmark: "DK", Australia: "AU",
  Ecuador: "EC", Ghana: "GH", Norway: "NO", Iran: "IR", "New Zealand": "NZ",
  "Saudi Arabia": "SA", "Cape Verde": "CV", Iraq: "IQ", Algeria: "DZ", Jordan: "JO",
  Austria: "AT", Uzbekistan: "UZ", "Congo DR": "CD", Panama: "PA", Haiti: "HT",
  Scotland: "GB-SCT", Tunisia: "TN", Sweden: "SE", Turkey: "TR", "Ivory Coast": "CI",
  "Curaçao": "CW", Curacao: "CW", Egypt: "EG", Poland: "PL", Bahrain: "BH",
};
export const codeFor = (name: string) => CODE[name] ?? name.slice(0, 3).toUpperCase();
function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short" });
  return `${date} · ${time}`;
}
/** "Mexico vs South Africa (2026-06-11)" → ["mexico","south africa"] (canon). */
export function teamsOf(market: string): [string, string] | null {
  const cleaned = market.replace(/\([^)]*\)/g, "").trim();
  const parts = cleaned.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  return [canonTeam(parts[0]), canonTeam(parts[1])];
}
/** Selection without the embedded line: "Over 2.5" → "Over"; "Yes" → "Yes". */
export function canonSelection(sel: string): string {
  const s = String(sel ?? "").trim();
  const m = s.match(/^(over|under|yes|no|home|away|draw)\b/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : s;
}

type Pos = {
  handle: string;
  teams: [string, string];
  marketType: string;
  line: number | null;
  selection: string;
  price: number;
  fairValue: number;
  edgePp: number;
};

/**
 * Discover the match-reader agent dirs under the prefix instead of hardcoding a
 * roster. A hardcoded list silently drops an agent when the backend renames a
 * slot — e.g. the list said `s1-match-reader-minimax` while the live slot is
 * `s1-match-reader-mistral`, so Mistral (a full book of positions) never made
 * the consensus and "N of 8" was off. Discovery + canonicalHandle handles
 * either slot name. Keeps only dirs that actually have a snapshot.json.
 */
export async function discoverAgents(): Promise<string[]> {
  const all = await listKeys(BASE);
  return [...new Set(all.map((o) => o.key.slice(BASE.length).split("/")[0]).filter(Boolean))]
    .filter((id) => id.startsWith("s1-match-reader-"))
    .filter((id) => all.some((o) => o.key === `${BASE}${id}/snapshot.json`))
    .sort();
}

export async function currentRun(agent: string): Promise<any | null> {
  const runKeys = (await listKeys(`${BASE}${agent}/runs/`)).filter((k) => /exe_.*\.json$/.test(k.key));
  if (!runKeys.length) return null;
  runKeys.sort((a, b) => a.mod.getTime() - b.mod.getTime()); // oldest → newest
  const docs = (await Promise.all(runKeys.map((r) => getJson<any>(r.key)))).filter(Boolean);
  // Bug B: the writer intermittently emits a stub or a partial-regression run
  // (run_count/settled going backwards) before self-healing. Use the MOST-COMPLETE
  // recent run, not blindly the newest, so a hiccup doesn't drop the agent — or its
  // full book of positions — out of the consensus.
  return pickEffectiveSnapshot(null, docs);
}

async function main() {
  const includeAll = process.argv.includes("--all");
  const limitArg = process.argv.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? Number(limitArg.slice(8)) || 50 : 50;

  // 1. Pull every agent's latest open positions. Roster is discovered from R2
  //    (not hardcoded) so a backend slot rename never silently drops an agent.
  const AGENTS = await discoverAgents();
  console.log(`Agents discovered: ${AGENTS.length} (${AGENTS.map((a) => a.replace("s1-match-reader-", "")).join(", ")})`);
  const positions: Pos[] = [];
  for (const agent of AGENTS) {
    const doc = await currentRun(agent);
    // Normalize the backend agent name to its brand handle (minimax → MISTRAL)
    // via the one shared alias in data/swarm-identity.ts.
    const handle = canonicalHandle(agent.replace("s1-match-reader-", ""));
    if (!doc) {
      console.log(`  ${handle}: no run`);
      continue;
    }
    const ops = doc.open_positions ?? [];
    for (const p of ops) {
      const teams = teamsOf(String(p.market ?? ""));
      if (!teams) continue;
      positions.push({
        handle,
        teams,
        marketType: String(p.market_type ?? ""),
        line: p.line ?? null,
        selection: canonSelection(p.selection),
        price: Number(p.last_price ?? p.price),
        fairValue: Number(p.fair_value),
        edgePp: Number(p.edge_pp),
      });
    }
    console.log(`  ${handle}: ${ops.length} positions (run ${doc.timestamp?.slice(0, 16)})`);
  }

  // 2. Upcoming fixtures from the mirror (for kickoff + filtering + display names).
  const pool = new Pool({
    connectionString: process.env.SWARM_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    statement_timeout: 10000,
  });
  const { rows: fixtures } = await pool.query(
    `SELECT home_team, away_team, scheduled_at, venue FROM matches
     WHERE scheduled_at >= now() - interval '1 day' ORDER BY scheduled_at ASC`,
  );
  await pool.end();
  // Map canon "home|away" (both orders) → fixture.
  const fixByPair = new Map<string, any>();
  for (const f of fixtures) {
    const h = canonTeam(f.home_team), a = canonTeam(f.away_team);
    fixByPair.set(`${h}|${a}`, f);
    fixByPair.set(`${a}|${h}`, f);
  }

  // 3. Group by (game x marketType x line x selection) and compute consensus.
  const groups = new Map<string, Pos[]>();
  for (const p of positions) {
    const key = `${p.teams[0]}|${p.teams[1]}|${p.marketType}|${p.line ?? ""}|${p.selection}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }

  const records: any[] = [];
  for (const [, ps] of groups) {
    const { teams, marketType, line, selection } = ps[0];
    const fix = fixByPair.get(`${teams[0]}|${teams[1]}`);
    const upcoming = fix && new Date(fix.scheduled_at).getTime() > Date.now();
    if (!includeAll && !upcoming) continue;

    const fvs = ps.map((p) => p.fairValue);
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const marketPrice = mean(ps.map((p) => p.price));
    const consensus = mean(fvs);
    const homeName = fix ? fix.home_team : teams[0];
    const awayName = fix ? fix.away_team : teams[1];
    const kickoffISO = fix ? new Date(fix.scheduled_at).toISOString() : null;
    records.push({
      home: homeName,
      away: awayName,
      homeCode: codeFor(homeName),
      awayCode: codeFor(awayName),
      game: `${homeName} vs ${awayName}`,
      kickoffISO,
      kickoff: kickoffISO ? fmtKickoff(kickoffISO) : "",
      competition: "FIFA World Cup 2026",
      stage: "Group Stage",
      venue: fix?.venue ?? null,
      upcoming: !!upcoming,
      marketType,
      line,
      selection,
      marketPrice: Number(marketPrice.toFixed(4)),
      consensus: Number(consensus.toFixed(4)),
      spread: [Number(Math.min(...fvs).toFixed(4)), Number(Math.max(...fvs).toFixed(4))],
      edgePp: Number(((consensus - marketPrice) * 100).toFixed(1)),
      agentsN: ps.length,
      agentsTotal: AGENTS.length,
      perAgent: ps
        .map((p) => ({ handle: p.handle, fairValue: Number(p.fairValue.toFixed(4)), edgePp: p.edgePp }))
        .sort((a, b) => b.edgePp - a.edgePp),
    });
  }

  // Strongest edge first; cap at limit.
  records.sort((a, b) => Math.abs(b.edgePp) - Math.abs(a.edgePp));
  const out = records.slice(0, limit);

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), source: "R2 match-reader agents + matches mirror", count: out.length, records: out },
      null,
      2,
    ) + "\n",
  );
  console.log(`\nWrote ${out.length} consensus record(s) → ${path.relative(process.cwd(), OUT)}`);
  for (const r of out)
    console.log(
      `  ${r.game.padEnd(34)} ${r.marketType}${r.line ? " " + r.line : ""}/${r.selection}` +
        ` | mkt ${(r.marketPrice * 100).toFixed(0)}% vs swarm ${(r.consensus * 100).toFixed(0)}%` +
        ` (${r.agentsN}/${r.agentsTotal}) edge ${r.edgePp > 0 ? "+" : ""}${r.edgePp}pp` +
        `${r.upcoming ? "" : " [played]"}`,
    );
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
