/**
 * Matchday card data builder — the swarm's single pick per game for today's slate.
 *
 * Reads the 8 match-reader agents' latest R2 open positions (same source as
 * swarm-consensus.ts, helpers reused from it), groups by (game x market), and
 * for each of today's upcoming games picks the HIGHEST-CONSENSUS market (most
 * agents; tie-break by stake, then edge). Joins the upcoming-fixture mirror for
 * kickoff + display names. Emits `MatchdayCardData` ({ day, games[] }) for the
 * `matchday-analysis` Remotion composition.
 *
 * Honest-data rule (see swarm-consensus.ts): only games the agents actually
 * traded appear — no fabricated picks. Zero coverage → empty games[].
 *
 * Env: S3_ENDPOINT + AWS_* (R2), SWARM_DB_URL (fixtures).
 * Run standalone: bun scripts/swarm-matchday.ts [--all]  → writes matchday.json
 */
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import { canonicalHandle } from "../data/swarm-identity";
import {
  canonSelection,
  canonTeam,
  codeFor,
  currentRun,
  discoverAgents,
  teamsOf,
} from "./swarm-consensus";
import type {
  MatchdayCardData,
  MatchdayGame,
  MatchdayMarket,
  MatchdayPick,
} from "../components/matchday-card-view";

const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "matchday.json");
// WC "Day N": days since the tournament's first matchday (ET), 1-indexed.
const WC_DAY_ONE = process.env.SWARM_WC_DAY_ONE ?? "2026-06-11";
// A game kicking off just after midnight ET still belongs to the prior evening's
// matchday — shift ~6h so 00:00–06:00 ET groups with the night before (mirrors
// swarm-auto's SLATE_BOUNDARY_MS).
const SLATE_BOUNDARY_MS = 6 * 60 * 60 * 1000;

const etDate = (ms: number) =>
  new Date(ms - SLATE_BOUNDARY_MS).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const dayNumber = (etDateStr: string) => {
  const ms = (s: string) => Date.parse(`${s}T00:00:00Z`);
  return Math.max(1, Math.round((ms(etDateStr) - ms(WC_DAY_ONE)) / 86_400_000) + 1);
};
const kickoffLabel = (ms: number) =>
  `${new Date(ms).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" })} ET`;

/** Normalize the backend market_type to the card's three buckets. */
function marketTypeOf(raw: string): MatchdayMarket {
  const s = (raw || "").toLowerCase();
  if (s.includes("btts") || s.includes("both")) return "btts";
  if (s.includes("total") || s.includes("over") || s.includes("under") || s.includes("goal")) return "totals";
  return "moneyline";
}

type Pos = {
  handle: string;
  teams: [string, string];
  rawType: string;
  marketType: MatchdayMarket;
  line: number | null;
  selection: string;
  price: number;
  fairValue: number;
  edge: number;
  sizeUsd: number;
};

export async function buildMatchdayData(opts: { all?: boolean } = {}): Promise<MatchdayCardData> {
  // 1. Every agent's open positions (with stake) from R2.
  const agents = await discoverAgents();
  const positions: Pos[] = [];
  for (const agent of agents) {
    const doc = await currentRun(agent);
    if (!doc) continue;
    for (const p of doc.open_positions ?? []) {
      const teams = teamsOf(String(p.market ?? ""));
      if (!teams) continue;
      const price = Number(p.last_price ?? p.price);
      const fairValue = Number(p.fair_value);
      positions.push({
        handle: canonicalHandle(agent.replace("s1-match-reader-", "")),
        teams,
        rawType: String(p.market_type ?? ""),
        marketType: marketTypeOf(String(p.market_type ?? "")),
        line: p.line ?? null,
        selection: canonSelection(p.selection),
        price,
        fairValue,
        edge: Math.abs((fairValue || 0) - (price || 0)),
        sizeUsd: Number(p.size_usd ?? p.size ?? 0),
      });
    }
  }

  // 2. Upcoming fixtures (kickoff + display names + status).
  const pool = new Pool({
    connectionString: process.env.SWARM_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    statement_timeout: 10_000,
  });
  const { rows: fixtures } = await pool.query(
    `SELECT home_team, away_team, scheduled_at, status FROM matches
     WHERE scheduled_at >= now() - interval '1 day' ORDER BY scheduled_at ASC`,
  );
  await pool.end();

  // 3. Aggregate positions per (game x market); keep the highest-consensus
  //    market per game pair (most agents; tie → stake → edge).
  const groups = new Map<string, Pos[]>();
  for (const p of positions) {
    const key = `${p.teams[0]}|${p.teams[1]}|${p.rawType}|${p.line ?? ""}|${p.selection}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
  type Mkt = {
    marketType: MatchdayMarket; line: number | null; selection: string;
    agentsN: number; price: number; agentProb: number; stakeUsd: number; edge: number;
  };
  const bestByPair = new Map<string, Mkt>();
  for (const ps of groups.values()) {
    const pair = `${ps[0].teams[0]}|${ps[0].teams[1]}`;
    const m: Mkt = {
      marketType: ps[0].marketType,
      line: ps[0].line,
      selection: ps[0].selection,
      agentsN: ps.length,
      price: mean(ps.map((p) => p.price)),
      agentProb: mean(ps.map((p) => p.fairValue)),
      stakeUsd: ps.reduce((s, p) => s + (p.sizeUsd || 0), 0),
      edge: mean(ps.map((p) => p.edge)),
    };
    const cur = bestByPair.get(pair);
    const better =
      !cur ||
      m.agentsN > cur.agentsN ||
      (m.agentsN === cur.agentsN && m.stakeUsd > cur.stakeUsd) ||
      (m.agentsN === cur.agentsN && m.stakeUsd === cur.stakeUsd && m.edge > cur.edge);
    if (better) bestByPair.set(pair, m);
  }

  // 4. The slate = TODAY's US (ET) matchday, sourced from the FIXTURES (not from
  //    coverage) so every scheduled game shows even when the agents haven't
  //    taken a position yet. Slate date = the ET date of the earliest upcoming
  //    NS fixture — the matchday the leaderboard fires for.
  const now = Date.now();
  const ns = fixtures
    .map((f: any) => ({ f, kickoffMs: new Date(f.scheduled_at).getTime(), status: String(f.status ?? "") }))
    .filter((x) => (opts.all ? true : x.kickoffMs > now && x.status === "NS"));
  if (!ns.length) return { day: dayNumber(etDate(now)), games: [] };
  const slate = opts.all ? null : ns.map((x) => etDate(x.kickoffMs)).sort()[0];
  const slateFixtures = (slate ? ns.filter((x) => etDate(x.kickoffMs) === slate) : ns).sort(
    (a, b) => a.kickoffMs - b.kickoffMs,
  );

  // 5. One row per slate game, attaching the swarm's pick where it has one.
  //    The layout fits a handful of rows; cap to the first SWARM_MATCHDAY_MAX.
  const max = Number(process.env.SWARM_MATCHDAY_MAX ?? 6);
  const games: MatchdayGame[] = slateFixtures.slice(0, max).map(({ f, kickoffMs }) => {
    const home = f.home_team as string;
    const away = f.away_team as string;
    const m = bestByPair.get(`${canonTeam(home)}|${canonTeam(away)}`);
    let pick: MatchdayPick | undefined;
    if (m) {
      // moneyline selection ("Home"/"Away") → the team name for the chip copy.
      const selection =
        m.marketType === "moneyline"
          ? m.selection === "Home" ? home : m.selection === "Away" ? away : m.selection
          : m.selection;
      pick = {
        marketType: m.marketType,
        selection,
        line: m.line,
        consensusN: m.agentsN,
        agentsTotal: agents.length,
        stakeUsd: Math.round(m.stakeUsd),
        price: Number(m.price.toFixed(4)),
        agentProb: Number(m.agentProb.toFixed(4)),
      };
    }
    return {
      home,
      away,
      homeCode: codeFor(home),
      awayCode: codeFor(away),
      homeScore: 0,
      awayScore: 0,
      kickoff: kickoffLabel(kickoffMs),
      pick,
    };
  });

  return { day: dayNumber(slate ?? etDate(now)), games };
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  buildMatchdayData({ all: process.argv.includes("--all") })
    .then((data) => {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
      console.log(`Wrote matchday — Day ${data.day}, ${data.games.length} game(s) → ${path.relative(process.cwd(), OUT)}`);
      for (const g of data.games) {
        const p = g.pick;
        console.log(
          `  ${`${g.home} vs ${g.away}`.padEnd(34)} ` +
            (p
              ? `[${p.marketType}/${p.selection}${p.line != null ? ` ${p.line}` : ""}] ${p.consensusN}/${p.agentsTotal} · $${p.stakeUsd} @ ${p.price} (agents ${Math.round(p.agentProb * 100)}%)`
              : "[no position yet]"),
        );
      }
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
