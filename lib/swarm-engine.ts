/**
 * Shared typing for the framework-free Swarm Arena card engine
 * (public/swarm-arena-cards/card-engine.js, exposed as window.SA).
 *
 * Single home for the `declare global` — TypeScript rejects two declarations
 * of the same Window property with different types, and both the Remotion
 * swarm-card composition and the /engine kit page embed the engine. Import
 * this module (even type-only) from any host that touches window.SA.
 */
import type { EngineAgent, EngineMatch } from "@/data/swarm-output";

export type EngineRenderOpts = {
  variant?: string;
  layout?: string;
  theme: string;
  size: string;
};

/** One "Market vs Agents" consensus record (game × market), from swarm-consensus. */
export type ConsensusRecord = {
  home: string;
  away: string;
  homeCode?: string;
  awayCode?: string;
  game: string;
  kickoff?: string;
  competition?: string;
  stage?: string;
  venue?: string | null;
  marketType: "moneyline" | "btts" | "totals" | string;
  line: number | null;
  selection: string;
  marketPrice: number;
  consensus: number;
  spread: [number, number];
  edgePp: number;
  agentsN: number;
  agentsTotal: number;
  perAgent: { handle: string; fairValue: number; edgePp: number }[];
};

export type ConsensusRenderOpts = EngineRenderOpts & {
  betStyle?: "question" | "emphasis";
  breakdown?: "list" | "histogram";
  colors?: { bar?: string; line?: string };
};

/** What SA.load() accepts. The live /api/swarm-deck returns `match: null`
 *  (no aggregated fixture yet); the stricter SwarmDeck remains assignable. */
export type EngineDeck = { agents: EngineAgent[]; match?: EngineMatch | null };

export type SwarmEngine = {
  AGENTS: EngineAgent[];
  byHandle: Record<string, EngineAgent>;
  LEADERBOARD: EngineAgent[];
  load: (deck: EngineDeck) => SwarmEngine;
  renderAgentCard: (handleOrAgent: string | EngineAgent, opts: EngineRenderOpts) => string;
  renderModelCard: (handleOrAgent: string | EngineAgent, opts: EngineRenderOpts) => string;
  renderMatchCard: (match: unknown, opts: EngineRenderOpts) => string;
  renderMatchConsensusCard: (rec: ConsensusRecord, opts: ConsensusRenderOpts) => string;
  renderLeaderboardCard: (opts: EngineRenderOpts) => string;
};

declare global {
  interface Window {
    SA: SwarmEngine;
    /** Host-provided asset overrides read by the engine: footer wordmarks
     *  (footerHTML) and the model card's asset base (renderModelCard). */
    __resources?: { nickWhite?: string; nickDark?: string; assetBase?: string };
  }
}
