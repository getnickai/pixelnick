/**
 * Swarm results builder — "Won Picks" (the settled sibling of swarm-consensus).
 *
 * Reads the 8 match-reader agents' settled `closed_trades` from R2, groups them
 * by (game x market x selection), and joins each to its FINAL SCORE in the
 * swarm-arena mirror `matches` table (home_score / away_score / winner /
 * status=FT). Emits one record per pick the swarm got right to:
 *
 *   public/swarm-arena-cards/results.json
 *
 * Per record (ResultCardData shape, components/result-card-view.tsx):
 *   { home, away, homeCode, awayCode, competition, stage, venue, kickoff,
 *     homeScore, awayScore, winner, status, marketType, selection, line,
 *     hit:true, entryPrice (mean), totalPnl ($), agentsN, agentsTotal,
 *     perAgent:[{handle, pnl, result}] }
 *
 * Honest-data rule: a pick is only emitted when (a) agents actually held a
 * settled position on it and (b) the fixture has a real final score in the
 * matches mirror (status=FT). No score → no card.
 *
 * Env: S3_ENDPOINT + AWS_* (R2), SWARM_DB_URL (final scores).
 * Run: bun scripts/swarm-results.ts [--limit=20] [--include-losses] [--runs=8]
 *   --include-losses   also emit picks the swarm got wrong (hit:false)
 *   --runs=N           how many recent runs per agent to scan for closed trades (default 8)
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { s3Client } from "./feed";
import { canonicalHandle } from "../data/swarm-identity";

const BUCKET = "nickai-swarmarena-internal";
const BASE = (process.env.SWARM_AGENTS_PREFIX ?? "swarm-arena/agents/").replace(/\/?$/, "/");
const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "results.json");
const AGENTS = ["claude", "gpt", "gemini", "grok", "deepseek", "kimi", "minimax", "qwen"].map(
  (m) => `s1-match-reader-${m}`,
);

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

// ── Normalization (shared shape with swarm-consensus.ts) ────────────────────
const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const TEAM_ALIAS: Record<string, string> = {
  "united states": "usa",
  "korea republic": "south korea",
  "ir iran": "iran",
};
const canonTeam = (t: string) => {
  const k = strip(t);
  return TEAM_ALIAS[k] ?? k;
};
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
const codeFor = (name: string) => CODE[name] ?? name.slice(0, 3).toUpperCase();

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
  });
}
/** "United States vs Paraguay" → ["usa","paraguay"] (canon). */
function teamsOf(market: string): [string, string] | null {
  const cleaned = market.replace(/\([^)]*\)/g, "").trim();
  const parts = cleaned.split(/\s+vs\.?\s+/i);
  if (parts.length !== 2) return null;
  return [canonTeam(parts[0]), canonTeam(parts[1])];
}
/** Selection without the embedded line: "Over 2.5" → "Over"; "Yes" → "Yes". */
function canonSelection(sel: string): string {
  const s = String(sel ?? "").trim();
  const m = s.match(/^(over|under|yes|no|home|away|draw)\b/i);
  return m ? m[1][0].toUpperCase() + m[1].slice(1).toLowerCase() : s;
}

type Closed = {
  market: string;
  market_type?: string;
  line?: number | null;
  selection: string;
  price?: number;
  result?: string;
  pnl_usd?: number;
  closed_iso?: string;
};

/** Gather settled trades for one agent across recent runs + snapshot, deduped. */
async function closedTradesFor(agent: string, nRuns: number): Promise<Closed[]> {
  const snap = (await getJson<any>(`${BASE}${agent}/snapshot.json`)) ?? {};
  const runKeys = (await listKeys(`${BASE}${agent}/runs/`)).filter((k) => /exe_.*\.json$/.test(k.key));
  runKeys.sort((a, b) => b.mod.getTime() - a.mod.getTime());
  const runs: any[] = [];
  for (const rk of runKeys.slice(0, nRuns)) {
    const d = await getJson<any>(rk.key);
    if (d) runs.push(d);
  }
  const all: Closed[] = [...runs.flatMap((r) => r.closed_trades ?? []), ...(snap.closed_trades ?? [])];
  const seen = new Set<string>();
  const out: Closed[] = [];
  for (const t of all) {
    const key = `${t.market ?? ""}|${t.market_type ?? ""}|${t.line ?? ""}|${t.selection ?? ""}|${t.closed_iso ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

type AgentPick = { handle: string; teams: [string, string]; marketType: string; line: number | null; selection: string; price: number; pnl: number; result: "win" | "loss" };

async function main() {
  const includeLosses = process.argv.includes("--include-losses");
  const limit = Number(process.argv.find((a) => a.startsWith("--limit="))?.slice(8)) || 50;
  const nRuns = Number(process.argv.find((a) => a.startsWith("--runs="))?.slice(7)) || 8;

  // 1. Every agent's deduped settled trades → normalized picks (win/loss only).
  const picks: AgentPick[] = [];
  for (const agent of AGENTS) {
    const handle = canonicalHandle(agent.replace("s1-match-reader-", ""));
    const closed = await closedTradesFor(agent, nRuns);
    let kept = 0;
    for (const t of closed) {
      const result = String(t.result ?? "").toLowerCase();
      if (result !== "win" && result !== "loss") continue; // skip void / malformed (e.g. KIMI)
      const teams = teamsOf(String(t.market ?? ""));
      if (!teams) continue;
      const pnl = Number(t.pnl_usd);
      if (!Number.isFinite(pnl)) continue;
      picks.push({
        handle,
        teams,
        marketType: String(t.market_type ?? ""),
        line: t.line ?? null,
        selection: canonSelection(t.selection),
        price: Number(t.price ?? 0),
        pnl,
        result: result as "win" | "loss",
      });
      kept++;
    }
    console.log(`  ${handle.padEnd(9)} ${kept} settled win/loss trade(s)`);
  }

  // 2. Final scores from the mirror (FT only).
  const pool = new Pool({
    connectionString: process.env.SWARM_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    statement_timeout: 10000,
  });
  const { rows: fixtures } = await pool.query(
    `SELECT home_team, away_team, home_score, away_score, winner, status, venue, stage, scheduled_at
     FROM matches WHERE status = 'FT' ORDER BY scheduled_at ASC`,
  );
  await pool.end();
  const fixByPair = new Map<string, any>();
  for (const f of fixtures) {
    const h = canonTeam(f.home_team), a = canonTeam(f.away_team);
    fixByPair.set(`${h}|${a}`, { ...f, _flip: false });
    fixByPair.set(`${a}|${h}`, { ...f, _flip: true });
  }

  // 3. Group winning (or all, with --include-losses) picks by game x market x selection.
  const groups = new Map<string, AgentPick[]>();
  for (const p of picks) {
    if (!includeLosses && p.result !== "win") continue;
    const key = `${p.teams[0]}|${p.teams[1]}|${p.marketType}|${p.line ?? ""}|${p.selection}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }

  const records: any[] = [];
  for (const [, ps] of groups) {
    const { teams, marketType, line, selection } = ps[0];
    const fix = fixByPair.get(`${teams[0]}|${teams[1]}`);
    if (!fix) continue; // honest-data rule: no final score in the mirror → no card

    // Orient home/away to the fixture row (closed_trade market order can differ).
    const homeName = fix.home_team as string;
    const awayName = fix.away_team as string;
    // Sum per agent (an agent may have averaged in/out across closed_iso).
    const byAgent = new Map<string, { pnl: number; wins: number; losses: number; price: number; n: number }>();
    for (const p of ps) {
      const cur = byAgent.get(p.handle) ?? { pnl: 0, wins: 0, losses: 0, price: 0, n: 0 };
      cur.pnl += p.pnl;
      cur.price += p.price;
      cur.n += 1;
      if (p.result === "win") cur.wins += 1; else cur.losses += 1;
      byAgent.set(p.handle, cur);
    }
    const perAgent = [...byAgent.entries()]
      .map(([handle, v]) => ({
        handle,
        pnl: Number(v.pnl.toFixed(2)),
        result: v.pnl >= 0 ? ("win" as const) : ("loss" as const),
      }))
      .sort((a, b) => b.pnl - a.pnl);
    const totalPnl = Number(perAgent.reduce((s, a) => s + a.pnl, 0).toFixed(2));
    const prices = ps.map((p) => p.price).filter((x) => Number.isFinite(x) && x > 0);
    const entryPrice = prices.length ? Number((prices.reduce((s, x) => s + x, 0) / prices.length).toFixed(4)) : undefined;
    const hit = totalPnl >= 0;

    records.push({
      home: homeName,
      away: awayName,
      homeCode: codeFor(homeName),
      awayCode: codeFor(awayName),
      game: `${homeName} vs ${awayName}`,
      competition: "FIFA World Cup 2026",
      stage: String(fix.stage ?? "Group Stage").replace(/\s*-\s*/g, " · "),
      venue: fix.venue ?? null,
      kickoff: fmtDate(new Date(fix.scheduled_at).toISOString()),
      homeScore: Number(fix.home_score),
      awayScore: Number(fix.away_score),
      winner: fix.winner ?? null,
      status: String(fix.status ?? "FT"),
      marketType,
      line,
      selection,
      hit,
      entryPrice,
      totalPnl,
      agentsN: perAgent.length,
      agentsTotal: AGENTS.length,
      perAgent,
    });
  }

  // Biggest swarm payout first.
  records.sort((a, b) => b.totalPnl - a.totalPnl);
  const out = records.slice(0, limit);

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      { generatedAt: new Date().toISOString(), source: "R2 match-reader closed_trades + matches mirror (FT)", count: out.length, records: out },
      null,
      2,
    ) + "\n",
  );
  console.log(`\nWrote ${out.length} settled-pick record(s) → ${path.relative(process.cwd(), OUT)}`);
  for (const r of out)
    console.log(
      `  ${`${r.home} ${r.homeScore}-${r.awayScore} ${r.away}`.padEnd(34)} ${r.marketType}${r.line ? " " + r.line : ""}/${r.selection}` +
        ` | ${r.hit ? "HIT" : "MISS"} ${r.totalPnl >= 0 ? "+" : ""}$${r.totalPnl} (${r.agentsN}/${r.agentsTotal} agents)`,
    );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
