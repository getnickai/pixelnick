/**
 * Nick feed builder — Season 2, ONE agent ("Nick", world-cup-agent[-N]).
 *
 * The 8-model roster (swarm-consensus / swarm-results) is Season 1. Season 2 runs
 * a single agent that writes one pick per game to a versioned top-level R2 prefix:
 *
 *   world-cup-agent[-N]/shared/decisions/<YYYY-MM-DD>/all_decisions.json
 *
 * whose `picks[]` carry the fixture (`matchup`, `fixture_id`, `kickoff`), the
 * 3-way probs, and the bet ({selection, size_usd, market_implied_prob, edge_pct,
 * conviction}). We read the highest-numbered prefix that has data (matches the
 * terminal's meta-agent-r2 resolver), join the swarm-arena mirror `matches` table
 * for kickoff / venue / final scores, and emit two feeds:
 *
 *   public/swarm-arena-cards/nick-upcoming.json  → GamePickCardData records
 *   public/swarm-arena-cards/nick-results.json   → ResultPortfolioCardData records
 *
 * UPCOMING: picks whose fixture hasn't kicked off, with a real staked bet.
 * RESULTS:  the agent's staked bets across ALL decision days, settled site-side
 *           against FT scores (the agent writes no settlement) — win pays
 *           size·(1/price − 1), loss −size — with a running portfolio (bankroll
 *           = $1,000 + cumulative realized P&L). Newest settled first, capped.
 *
 * Honest-data rule (inherited): only games the agent actually traded appear, and
 * a result needs a real FT score in the mirror. No coverage → empty feed.
 *
 * Env: S3_ENDPOINT + AWS_* (R2), SWARM_DB_URL (fixtures). Server-only.
 * Run: bun scripts/swarm-nick.ts [--results-limit=4]
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { Pool } from "pg";
import { s3Client } from "./feed";
import { canonTeam, codeFor } from "./swarm-consensus";

const BUCKET = process.env.SWARM_R2_BUCKET ?? "nickai-swarmarena-internal";
const STARTING_CAPITAL = 1000;
const OUT_UPCOMING = path.join(process.cwd(), "public", "swarm-arena-cards", "nick-upcoming.json");
const OUT_RESULTS = path.join(process.cwd(), "public", "swarm-arena-cards", "nick-results.json");

const client = s3Client();
async function getJson<T>(key: string): Promise<T | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch {
    return null;
  }
}
async function listDirs(prefix: string): Promise<string[]> {
  const p = await client.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, Delimiter: "/" }));
  return (p.CommonPrefixes ?? []).map((x) => x.Prefix ?? "");
}

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** Highest-numbered `world-cup-agent[-N]/shared/` prefix that has decisions. */
async function resolveActivePrefix(): Promise<string> {
  if (process.env.SWARM_R2_META_PREFIX) return process.env.SWARM_R2_META_PREFIX;
  const top = await listDirs("");
  const cands = top
    .map((p) => {
      const m = p.match(/^world-cup-agent(?:-(\d+))?\/$/);
      return m ? { prefix: `${p}shared/`, n: m[1] ? parseInt(m[1], 10) : 1 } : null;
    })
    .filter((x): x is { prefix: string; n: number } => !!x)
    .sort((a, b) => b.n - a.n);
  for (const c of cands) {
    const days = await listDirs(`${c.prefix}decisions/`);
    if (days.length) return c.prefix;
  }
  return process.env.SWARM_R2_META_PREFIX ?? "world-cup-agent/shared/";
}

/** All YYYY-MM-DD day folders under a workflow prefix, oldest → newest. */
async function decisionDays(prefix: string): Promise<string[]> {
  const dirs = await listDirs(`${prefix}decisions/`);
  return dirs
    .map((d) => d.slice(`${prefix}decisions/`.length).replace(/\/$/, ""))
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort();
}

function splitMatchup(matchup: string): [string, string] | null {
  const parts = String(matchup ?? "")
    .replace(/\([^)]*\)/g, "")
    .split(/\s+vs\.?\s+|\s+-\s+/i)
    .map((s) => s.trim());
  if (parts.length < 2 || !parts[0] || !parts[1]) return null;
  return [parts[0], parts[1]];
}

const norm = (s: string) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
/** Does the selection text refer to this team (full name or canon alias)? */
function refersTo(sel: string, team: string): boolean {
  const n = norm(sel);
  return n.includes(norm(team)) || n.includes(canonTeam(team));
}

/**
 * Classify a bet selection → { marketType, selection, line } for the card.
 * Moneyline is resolved to the actual TEAM NAME (not the raw "Spain to advance"
 * / "Argentina win (reg)" phrasing), so the chip reads right and — critically —
 * it settles against the fixture winner. In a knockout, "to advance" = win the
 * tie, so the fixture winner is who advanced.
 */
function classifyBet(raw: string, home: string, away: string): { marketType: "moneyline" | "btts" | "totals"; selection: string; line: number | null } {
  const s = String(raw ?? "").replace(/^\s*(back|lay)\s+/i, "").replace(/\s*@.*$/, "").trim();
  const over = s.match(/over\s+([\d.]+)/i);
  const under = s.match(/under\s+([\d.]+)/i);
  if (over) return { marketType: "totals", selection: "Over", line: Number(over[1]) };
  if (under) return { marketType: "totals", selection: "Under", line: Number(under[1]) };
  if (/^yes\b/i.test(s) || /both teams/i.test(s)) return { marketType: "btts", selection: "Yes", line: null };
  if (/^no\b/i.test(s)) return { marketType: "btts", selection: "No", line: null };
  if (/\bdraw\b/i.test(s)) return { marketType: "moneyline", selection: "Draw", line: null };
  // Resolve to the fixture team the selection names.
  if (refersTo(s, home) && !refersTo(s, away)) return { marketType: "moneyline", selection: home, line: null };
  if (refersTo(s, away) && !refersTo(s, home)) return { marketType: "moneyline", selection: away, line: null };
  if (/\bhome\b/i.test(s)) return { marketType: "moneyline", selection: home, line: null };
  if (/\baway\b/i.test(s)) return { marketType: "moneyline", selection: away, line: null };
  return { marketType: "moneyline", selection: s, line: null }; // unresolved (rare) — won't settle
}

/** Settle a selection against a final score. Null for market types we can't settle. */
function settleResult(marketType: string, selection: string, line: number | null, hs: number, as: number): "win" | "loss" | null {
  const mt = String(marketType).toLowerCase();
  const sel = String(selection).toLowerCase();
  const total = hs + as;
  if (mt === "btts") {
    const both = hs > 0 && as > 0;
    if (sel.startsWith("yes")) return both ? "win" : "loss";
    if (sel.startsWith("no")) return both ? "loss" : "win";
  } else if (mt === "totals" && line != null) {
    if (sel.startsWith("over")) return total > line ? "win" : "loss";
    if (sel.startsWith("under")) return total < line ? "win" : "loss";
  }
  return null; // moneyline handled by winner name (see settleMoneyline)
}
/** Moneyline settle by selection team name vs the fixture winner. */
function settleMoneyline(selection: string, home: string, away: string, winner: string | null, hs: number, as: number): "win" | "loss" | null {
  const sel = canonTeam(selection);
  if (/^draw$/i.test(selection)) return hs === as ? "win" : "loss";
  const w = winner ? canonTeam(winner) : hs > as ? canonTeam(home) : as > hs ? canonTeam(away) : null;
  if (!w) return null;
  return sel === w ? "win" : "loss";
}
const pnlOf = (result: "win" | "loss", size: number, price: number): number =>
  !Number.isFinite(size) || !Number.isFinite(price) || price <= 0 ? 0 : result === "win" ? size * (1 / price - 1) : -size;

const TZ = "America/New_York";
function fmtKickoff(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ, timeZoneName: "short" });
  return `${date} · ${time}`;
}
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });

type Pick = {
  home: string;
  away: string;
  marketType: "moneyline" | "btts" | "totals";
  selection: string;
  line: number | null;
  price: number; // market-implied prob 0..1
  agentProb: number; // Nick's fair value 0..1
  stakeUsd: number;
  conviction?: string;
  date: string; // decision day
  fixtureId: string | null;
};

/** Map one all_decisions picks[] row to a normalized Pick (bet required). */
function toPick(pk: Record<string, unknown>, date: string): Pick | null {
  const teams = splitMatchup(String(pk.matchup ?? ""));
  if (!teams) return null;
  const bet = (pk.bet ?? {}) as Record<string, unknown>;
  const stake = num(bet.size_usd) ?? num(bet.stake_usd) ?? 0;
  if (!(stake > 0) || !bet.selection) return null; // no real staked bet → not a card
  const m = classifyBet(String(bet.selection), teams[0], teams[1]);
  const price = num(bet.market_implied_prob) ?? num(bet.entry_price) ?? 0;
  const edgePp = num(bet.edge_pct);
  const probs = (pk.probs ?? {}) as Record<string, unknown>;
  // Agent fair value for the bet: market + edge when present, else the 3-way prob
  // for a moneyline side, else the market price.
  let agentProb = price;
  if (edgePp != null) agentProb = Math.min(0.99, Math.max(0.01, price + edgePp / 100));
  else if (m.marketType === "moneyline") {
    const sc = canonTeam(m.selection);
    if (sc === canonTeam(teams[0])) agentProb = num(probs.home) ?? price;
    else if (sc === canonTeam(teams[1])) agentProb = num(probs.away) ?? price;
  }
  return {
    home: teams[0],
    away: teams[1],
    marketType: m.marketType,
    selection: m.selection,
    line: m.line,
    price,
    agentProb,
    stakeUsd: stake,
    conviction: typeof bet.conviction === "string" ? bet.conviction : undefined,
    date,
    fixtureId: pk.fixture_id != null ? String(pk.fixture_id) : null,
  };
}

async function main() {
  const resultsLimit = Number(process.argv.find((a) => a.startsWith("--results-limit="))?.slice(16)) || 4;

  const prefix = await resolveActivePrefix();
  console.log(`Active Nick prefix: ${prefix}`);
  const days = await decisionDays(prefix);
  if (!days.length) {
    console.log("No decision days under the active prefix — writing empty feeds.");
    writeFeeds([], []);
    return;
  }
  console.log(`Decision days: ${days.length} (latest ${days[days.length - 1]})`);

  // Read every day's picks (oldest → newest); dedupe per fixture keeping the
  // latest day (re-priced as kickoff nears), mirroring the terminal.
  const byFixture = new Map<string, Pick>();
  for (const day of days) {
    const dec = await getJson<{ picks?: unknown[] }>(`${prefix}decisions/${day}/all_decisions.json`);
    const picks = Array.isArray(dec?.picks) ? dec!.picks : [];
    for (const p of picks) {
      const pick = toPick(p as Record<string, unknown>, day);
      if (pick) byFixture.set(pick.fixtureId ?? `${canonTeam(pick.home)}|${canonTeam(pick.away)}`, pick);
    }
  }
  const picks = [...byFixture.values()];
  console.log(`Staked picks (deduped): ${picks.length}`);

  // Fixtures mirror: kickoff / venue / stage / final scores.
  const pool = new Pool({ connectionString: process.env.SWARM_DB_URL, ssl: { rejectUnauthorized: false }, max: 2, statement_timeout: 15000 });
  const { rows: fixtures } = await pool.query(
    `SELECT home_team, away_team, scheduled_at, venue, stage, status, home_score, away_score, winner
     FROM matches ORDER BY scheduled_at ASC`,
  );
  await pool.end();
  const fixByPair = new Map<string, any>();
  for (const f of fixtures) {
    const h = canonTeam(f.home_team), a = canonTeam(f.away_team);
    if (!fixByPair.has(`${h}|${a}`)) fixByPair.set(`${h}|${a}`, f);
    if (!fixByPair.has(`${a}|${h}`)) fixByPair.set(`${a}|${h}`, f);
  }
  const fixOf = (p: Pick) => fixByPair.get(`${canonTeam(p.home)}|${canonTeam(p.away)}`);
  // Knockout games (semis, final) can settle AET/PEN, not just FT — treat all
  // terminal statuses as finished so a shootout result still settles + cards.
  const FINAL = new Set(["FT", "AET", "PEN", "PENS", "AWD", "WO"]);
  const isFinished = (f: any) => !!f && FINAL.has(String(f.status ?? "").toUpperCase());
  const now = Date.now();

  // ── UPCOMING → GamePickCardData ────────────────────────────────────────────
  const upcoming: any[] = [];
  for (const p of picks) {
    const fix = fixOf(p);
    const kickoffMs = fix ? new Date(fix.scheduled_at).getTime() : NaN;
    const upcomingGame = fix ? !isFinished(fix) && kickoffMs > now : false;
    if (!upcomingGame) continue;
    const homeName = fix.home_team as string;
    const awayName = fix.away_team as string;
    upcoming.push({
      home: homeName,
      away: awayName,
      homeCode: codeFor(homeName),
      awayCode: codeFor(awayName),
      homeScore: 0,
      awayScore: 0,
      game: `${homeName} vs ${awayName}`,
      competition: "FIFA World Cup 2026",
      stage: String(fix.stage ?? "").replace(/\s*-\s*/g, " · ") || undefined,
      venue: fix.venue ?? null,
      kickoff: fmtKickoff(new Date(fix.scheduled_at).toISOString()),
      kickoffISO: new Date(fix.scheduled_at).toISOString(),
      pick: {
        marketType: p.marketType,
        selection: p.selection,
        line: p.line,
        stakeUsd: Math.round(p.stakeUsd),
        price: Number(p.price.toFixed(4)),
        agentProb: Number(p.agentProb.toFixed(4)),
        conviction: p.conviction,
      },
    });
  }
  upcoming.sort((a, b) => (a.kickoffISO < b.kickoffISO ? -1 : 1));

  // ── RESULTS → ResultPortfolioCardData (settled, running portfolio) ──────────
  // Settle every staked pick with a finished fixture, chronologically, so the
  // running bankroll is honest; then take the most-recent N for cards.
  const settledAll: any[] = [];
  const withFix = picks
    .map((p) => ({ p, fix: fixOf(p) }))
    .filter((x) => isFinished(x.fix))
    .sort((a, b) => (new Date(a.fix.scheduled_at).getTime() - new Date(b.fix.scheduled_at).getTime()));
  let bankroll = STARTING_CAPITAL;
  for (const { p, fix } of withFix) {
    const hs = Number(fix.home_score), as = Number(fix.away_score);
    if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
    const result =
      p.marketType === "moneyline"
        ? settleMoneyline(p.selection, fix.home_team, fix.away_team, fix.winner ?? null, hs, as)
        : settleResult(p.marketType, p.selection, p.line, hs, as);
    if (!result) continue;
    const pnl = pnlOf(result, p.stakeUsd, p.price);
    bankroll += pnl;
    settledAll.push({
      home: fix.home_team,
      away: fix.away_team,
      homeCode: codeFor(fix.home_team),
      awayCode: codeFor(fix.away_team),
      game: `${fix.home_team} vs ${fix.away_team}`,
      competition: "FIFA World Cup 2026",
      stage: String(fix.stage ?? "").replace(/\s*-\s*/g, " · ") || undefined,
      venue: fix.venue ?? null,
      kickoff: fmtDate(new Date(fix.scheduled_at).toISOString()),
      kickoffISO: new Date(fix.scheduled_at).toISOString(),
      homeScore: hs,
      awayScore: as,
      winner: fix.winner ?? null,
      status: String(fix.status ?? "FT"),
      marketType: p.marketType,
      selection: p.selection,
      line: p.line,
      hit: result === "win",
      entryPrice: Number(p.price.toFixed(4)),
      totalPnl: Number(pnl.toFixed(2)),
      portfolioUsd: Number(bankroll.toFixed(2)),
      startingUsd: STARTING_CAPITAL,
    });
  }
  // Most-recent N (newest first) for the cards.
  const results = settledAll.slice(-resultsLimit).reverse();

  writeFeeds(upcoming, results);

  console.log(`\nUPCOMING (${upcoming.length}):`);
  for (const r of upcoming) console.log(`  ${r.game.padEnd(34)} ${r.pick.marketType}/${r.pick.selection}${r.pick.line ? " " + r.pick.line : ""} | $${r.pick.stakeUsd} @ ${(r.pick.price * 100).toFixed(0)}% (Nick ${(r.pick.agentProb * 100).toFixed(0)}%)`);
  console.log(`\nRESULTS (${results.length} of ${settledAll.length} settled, portfolio now $${bankroll.toFixed(0)}):`);
  for (const r of results) console.log(`  ${`${r.home} ${r.homeScore}-${r.awayScore} ${r.away}`.padEnd(34)} ${r.marketType}/${r.selection} | ${r.hit ? "HIT" : "MISS"} ${r.totalPnl >= 0 ? "+" : ""}$${r.totalPnl} → portfolio $${r.portfolioUsd}`);
}

function writeFeeds(upcoming: any[], results: any[]) {
  const stamp = new Date().toISOString();
  fs.mkdirSync(path.dirname(OUT_UPCOMING), { recursive: true });
  fs.writeFileSync(OUT_UPCOMING, JSON.stringify({ generatedAt: stamp, source: "R2 world-cup-agent decisions + matches mirror", count: upcoming.length, records: upcoming }, null, 2) + "\n");
  fs.writeFileSync(OUT_RESULTS, JSON.stringify({ generatedAt: stamp, source: "R2 world-cup-agent decisions settled vs FT scores", count: results.length, records: results }, null, 2) + "\n");
  console.log(`Wrote ${upcoming.length} → ${path.relative(process.cwd(), OUT_UPCOMING)}`);
  console.log(`Wrote ${results.length} → ${path.relative(process.cwd(), OUT_RESULTS)}`);
}

if ((import.meta as ImportMeta & { main?: boolean }).main) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
