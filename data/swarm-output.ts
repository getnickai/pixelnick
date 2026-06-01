/**
 * Swarm Arena — bucket data contract + mappers.
 *
 * This is the consumer side of the JSON that Swarm Arena agents write to the
 * Cloudflare R2 bucket. The pipeline reads these objects and maps them onto
 * the design-owned identity registry (`swarm-identity.ts`) to produce the
 * plain objects the share-card engine renders.
 *
 * Canonical R2 layout (one source = "swarm-arena"):
 *   s3://<bucket>/swarm-arena/agents/<HANDLE>/snapshot.json   (one per agent)
 *   s3://<bucket>/swarm-arena/match/current.json              (one, aggregated)
 *
 * The leaderboard card needs no file of its own: it is derived by sorting the
 * agent snapshots by roiPct.
 *
 * Producer contract (human-readable, with examples): see
 * `data/swarm-card-data-contract.md`. This file is the executable copy; keep
 * the two in sync.
 *
 * Money model: every agent starts with a $1,000 paper book. roiPct is the
 * percentage return on that book; equity is derived as 1000 * (1 + roiPct/100)
 * unless the snapshot supplies it explicitly.
 */
import {
  identityFor,
  type SwarmAgentIdentity,
} from "./swarm-identity";

export const SWARM_BASE_USD = 1000;

/* ─────────────────────────── Agent snapshot ─────────────────────────────
   What each agent writes to agents/<HANDLE>/snapshot.json. Performance only;
   branding comes from the identity registry. Required vs optional is marked. */

/** The agent's flagship current pick, shown prominently on the card. */
export type SwarmPick = {
  /** Market name, e.g. "Both teams to score". */
  market: string;
  /** Human side string exactly as it should print, e.g. "BACK Yes @ 0.58".
   *  Use "ABSTAIN" when the agent has no position. */
  side: string;
  /** Edge over the market in percentage points. 0 = abstain / no edge. */
  edgePp: number;
};

/** A recently settled pick, for the editorial card's "Latest picks" ledger. */
export type SwarmRecentPick = {
  market: string;
  side: string;
  /** Realised P&L in dollars (positive win, negative loss, 0 push). */
  pnlUsd: number;
};

/** The most recently settled trade, shown on the scoreboard layout. */
export type SwarmLastTrade = {
  pnlUsd: number;
  /** How long ago it settled, display string, e.g. "2h". */
  ago: string;
};

/** agents/<HANDLE>/snapshot.json */
export type SwarmAgentSnapshot = {
  /** REQUIRED. Stable uppercase id; must match a key in the identity registry. */
  handle: string;
  /** REQUIRED. ISO timestamp this snapshot was produced (freshness watermark). */
  asOf: string;
  /** REQUIRED. Percentage return on the $1,000 book. May be negative. */
  roiPct: number;
  /** OPTIONAL. Current equity in dollars. Derived from roiPct if omitted. */
  equityUsd?: number;
  /** REQUIRED. Pick accuracy as a fraction 0..1 (settled wins / settled picks). */
  pickPct: number;
  /** REQUIRED. Total signals / picks emitted this season. */
  signals: number;
  /** REQUIRED. Display string for the next scheduled run, e.g. "4h 12m". */
  nextRun: string;
  /** OPTIONAL. ISO date the agent went live, e.g. "2026-05-28". */
  activeSince?: string;
  /** REQUIRED. Equity curve, >=2 points, FIRST point = 1000 (the base). */
  spark: number[];
  /** REQUIRED. The flagship current pick. */
  pick: SwarmPick;
  /** OPTIONAL. Streak token, e.g. "W4" / "L3" / "—". Derived if omitted. */
  streak?: string;
  /** OPTIONAL. Settled record "wins-losses". Derived from signals*pickPct if omitted. */
  record?: string;
  /** OPTIONAL. Most recent settled trade. */
  lastTrade?: SwarmLastTrade;
  /** OPTIONAL. Up to 3 recent settled picks (newest first). */
  recent?: SwarmRecentPick[];
};

/* ─────────────────────────────── Match ──────────────────────────────────
   What the aggregator writes to match/current.json. Combines market odds and
   the swarm's averaged view + sharpest individual calls. */

export type SwarmTeam = {
  /** Full team name, e.g. "Paris Saint-Germain". */
  name: string;
  /** 2-3 char code used in legends + crest, e.g. "PSG". */
  code: string;
  /** Flag emoji (national teams) or club flag glyph. */
  flag: string;
  /** OPTIONAL. Crest band colour (hex). For nations, omit to use flag colours. */
  brand?: string;
  /** OPTIONAL. Crest stripe colours (hex[]). For nations, omit to default. */
  stripes?: string[];
};

export type SwarmOdds = {
  /** Market-implied probabilities as whole percentages; should total ~100. */
  homePct: number;
  drawPct: number;
  awayPct: number;
  /** 24h traded volume in dollars (shown as "$1.84M · 24h"). */
  volume24h: number;
};

export type SwarmConsensus = {
  homePct: number;
  drawPct: number;
  awayPct: number;
  /** Number of agents that voted. */
  agents: number;
  /** How many backed home / away; everything else counts as other/abstain. */
  backHome: number;
  backAway: number;
  other: number;
};

export type SwarmCall = {
  /** Agent handle (joins to the identity registry for name + colour). */
  handle: string;
  /** Market label, e.g. "Method". */
  market: string;
  /** Side string, e.g. "PSG on pens". */
  side: string;
  /** Edge in percentage points; the list is sorted by this descending. */
  edgePp: number;
};

/** match/current.json */
export type SwarmMatch = {
  asOf: string;
  competition: string;
  stage: string;
  /** Short competition tag, e.g. "UCL". */
  short: string;
  venue: string;
  /** Display kickoff string, e.g. "Sat 30 May · 21:00 CEST". */
  kickoff: string;
  home: SwarmTeam;
  away: SwarmTeam;
  odds: SwarmOdds;
  swarm: SwarmConsensus;
  /** Sharpest individual calls; rendered top-down by edge. */
  calls: SwarmCall[];
};

/* ───────────────────────── Engine-facing types ──────────────────────────
   The plain objects the card engine consumes (window.SA). Identity fields +
   performance fields flattened together, exactly as the engine's renderers
   read them. Produced by the mappers below; fed to SA.load(). */

export type EngineAgent = SwarmAgentIdentity & {
  roiPct: number;
  pickPct: number;
  signals: number;
  nextRun: string;
  activeSince?: string;
  spark: number[];
  pick: SwarmPick;
  streak?: string;
  record?: string;
  /** Engine uses `pnl` (dollars), not `pnlUsd`. */
  lastTrade?: { pnl: number; ago: string };
  recent?: { market: string; side: string; pnl: number }[];
};

export type EngineMatch = SwarmMatch;

export type SwarmDeck = { agents: EngineAgent[]; match: EngineMatch };

/* ──────────────────────────────── Mappers ───────────────────────────────── */

/**
 * Merge one bucket snapshot with its design-owned identity to produce the flat
 * object the engine renders. Throws if the handle has no registered identity
 * (an unknown agent must be added to the registry first, by design).
 */
export function toEngineAgent(snap: SwarmAgentSnapshot): EngineAgent {
  const identity = identityFor(snap.handle);
  if (!identity) {
    throw new Error(
      `Unknown swarm agent handle "${snap.handle}". Add it to ` +
        `data/swarm-identity.ts before sending a snapshot for it.`,
    );
  }
  return {
    ...identity,
    roiPct: snap.roiPct,
    pickPct: snap.pickPct,
    signals: snap.signals,
    nextRun: snap.nextRun,
    activeSince: snap.activeSince,
    spark: snap.spark,
    pick: snap.pick,
    streak: snap.streak,
    record: snap.record,
    lastTrade: snap.lastTrade
      ? { pnl: snap.lastTrade.pnlUsd, ago: snap.lastTrade.ago }
      : undefined,
    recent: snap.recent?.map((r) => ({
      market: r.market,
      side: r.side,
      pnl: r.pnlUsd,
    })),
  };
}

/** Match maps through unchanged (the engine shape equals the bucket shape). */
export function toEngineMatch(match: SwarmMatch): EngineMatch {
  return match;
}

/**
 * Assemble the full deck the engine needs from a set of agent snapshots and
 * the match. Agents are sorted by roiPct desc so the leaderboard and per-agent
 * rank fall out of one ordering.
 */
export function buildDeck(
  snapshots: SwarmAgentSnapshot[],
  match: SwarmMatch,
): SwarmDeck {
  const agents = snapshots
    .map(toEngineAgent)
    .sort((a, b) => b.roiPct - a.roiPct);
  return { agents, match: toEngineMatch(match) };
}
