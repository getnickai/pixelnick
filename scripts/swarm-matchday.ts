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
  const fixByPair = new Map<string, any>();
  for (const f of fixtures) {
    const h = canonTeam(f.home_team), a = canonTeam(f.away_team);
    fixByPair.set(`${h}|${a}`, f);
    fixByPair.set(`${a}|${h}`, f);
  }

  // 3. Group positions by (game x market x line x selection) → one market each.
  const groups = new Map<string, Pos[]>();
  for (const p of positions) {
    const key = `${p.teams[0]}|${p.teams[1]}|${p.rawType}|${p.line ?? ""}|${p.selection}`;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(p);
  }

  const now = Date.now();
  const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / (xs.length || 1);
  type Mkt = {
    pair: string; fix: any; kickoffMs: number;
    marketType: MatchdayMarket; line: number | null; selection: string;
    agentsN: number; price: number; agentProb: number; stakeUsd: number; edge: number;
  };
  const markets: Mkt[] = [];
  for (const ps of groups.values()) {
    const { teams } = ps[0];
    const fix = fixByPair.get(`${teams[0]}|${teams[1]}`);
    if (!fix) continue;
    const kickoffMs = new Date(fix.scheduled_at).getTime();
    const upcoming = kickoffMs > now && (fix.status ? fix.status === "NS" : true);
    if (!opts.all && !upcoming) continue;
    markets.push({
      pair: `${canonTeam(fix.home_team)}|${canonTeam(fix.away_team)}`,
      fix,
      kickoffMs,
      marketType: ps[0].marketType,
      line: ps[0].line,
      selection: ps[0].selection,
      agentsN: ps.length,
      price: mean(ps.map((p) => p.price)),
      agentProb: mean(ps.map((p) => p.fairValue)),
      stakeUsd: ps.reduce((s, p) => s + (p.sizeUsd || 0), 0),
      edge: mean(ps.map((p) => p.edge)),
    });
  }

  if (!markets.length) return { day: dayNumber(etDate(now)), games: [] };

  // 4. Restrict to a single matchday — the earliest upcoming ET slate with
  //    coverage (which is the slate the leaderboard fires for).
  const slate = opts.all ? null : markets.map((m) => etDate(m.kickoffMs)).sort()[0];
  const slateMarkets = slate ? markets.filter((m) => etDate(m.kickoffMs) === slate) : markets;

  // 5. Per game, pick the highest-consensus market (most agents; tie → stake → edge).
  const byGame = new Map<string, Mkt[]>();
  for (const m of slateMarkets) (byGame.get(m.pair) ?? byGame.set(m.pair, []).get(m.pair)!).push(m);

  const picked: { kickoffMs: number; game: MatchdayGame }[] = [];
  for (const ms of byGame.values()) {
    const top = [...ms].sort(
      (a, b) => b.agentsN - a.agentsN || b.stakeUsd - a.stakeUsd || b.edge - a.edge,
    )[0];
    const { home_team: home, away_team: away } = top.fix;
    // moneyline selection ("Home"/"Away") → the team name for the chip copy.
    const selection =
      top.marketType === "moneyline"
        ? top.selection === "Home" ? home : top.selection === "Away" ? away : top.selection
        : top.selection;
    picked.push({
      kickoffMs: top.kickoffMs,
      game: {
        home, away,
        homeCode: codeFor(home), awayCode: codeFor(away),
        homeScore: 0, awayScore: 0,
        kickoff: kickoffLabel(top.kickoffMs),
        marketType: top.marketType, selection, line: top.line,
        consensusN: top.agentsN, agentsTotal: agents.length,
        stakeUsd: Math.round(top.stakeUsd),
        price: Number(top.price.toFixed(4)),
        agentProb: Number(top.agentProb.toFixed(4)),
      },
    });
  }
  // The card layout fits a handful of rows cleanly; on a heavy slate keep the
  // strongest picks (most agents, then biggest stake), capped, then show them
  // in kickoff order.
  const max = Number(process.env.SWARM_MATCHDAY_MAX ?? 6);
  const top = [...picked]
    .sort((a, b) => b.game.consensusN - a.game.consensusN || b.game.stakeUsd - a.game.stakeUsd)
    .slice(0, max)
    .sort((a, b) => a.kickoffMs - b.kickoffMs);

  return { day: dayNumber(slate ?? etDate(now)), games: top.map((p) => p.game) };
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  buildMatchdayData({ all: process.argv.includes("--all") })
    .then((data) => {
      fs.mkdirSync(path.dirname(OUT), { recursive: true });
      fs.writeFileSync(OUT, `${JSON.stringify(data, null, 2)}\n`);
      console.log(`Wrote matchday — Day ${data.day}, ${data.games.length} game(s) → ${path.relative(process.cwd(), OUT)}`);
      for (const g of data.games)
        console.log(
          `  ${`${g.home} vs ${g.away}`.padEnd(34)} [${g.marketType}/${g.selection}${g.line != null ? ` ${g.line}` : ""}]` +
            ` ${g.consensusN}/${g.agentsTotal} · $${g.stakeUsd} @ ${g.price} (agents ${Math.round(g.agentProb * 100)}%)`,
        );
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
