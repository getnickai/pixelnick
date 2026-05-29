/**
 * Schemas for the JSON outputs NickAI workflows write to R2.
 *
 * Canonical paths (per source, e.g. nickai or swarm-arena):
 *   s3://<bucket>/<source>/agents/{workflowId}/profile.json
 *   s3://<bucket>/<source>/agents/{workflowId}/snapshot.json
 *   s3://<bucket>/<source>/agents/{workflowId}/runs/{date}/{executionId}.json
 *
 * Today's card pipeline reads (profile, snapshot) and ranks by profitPercent.
 * The `runs/{date}/{executionId}.json` layer is forward-compatible — when
 * trade-highlight cards arrive, listing only today's runs is a single
 * prefix scan instead of a full enumeration.
 *
 * Internal terminology is "workflow" (NickAI's data model); the public-facing
 * card copy still says "agent". `agents/` stays as the path segment for that
 * reason — public surface aligned with what the card displays.
 */
import type { AgentCardData } from "./mock-agents";
import { slugify } from "./agent-input";

export type AgentProfile = {
  workflowId: string;
  agentName: string;
  /** Optional. If absent, derived from agentName. */
  slug?: string;
  builder: { name: string; avatarUrl?: string };
  activeSinceISO: string;
  nodes: number;
};

export type AgentSnapshot = {
  workflowId: string;
  /** When this snapshot was produced. */
  asOfISO: string;
  pnlUsd: number;
  profitPercent: number;
  runsTotal: number;
  tradesTotal: number;
  /** Most recent run completion. */
  lastRunAtISO?: string;
  /** Next scheduled run (used for the "Next run in …" countdown on the card). */
  nextRunISO?: string;
};

export type Trade = {
  tradeId: string;
  symbol: string;
  side: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  qty: number;
  pnlUsd: number;
  pnlPercent: number;
  openedISO: string;
  closedISO: string;
};

/**
 * A single workflow execution. Path: `agents/{workflowId}/runs/{date}/{executionId}.json`.
 * `date` is the execution day in YYYY-MM-DD; lets us list "runs since X" as
 * a cheap prefix scan when trade-highlight cards land later.
 */
export type AgentRun = {
  executionId: string;
  workflowId: string;
  startedISO: string;
  completedISO: string;
  pnlDeltaUsd: number;
  trades: Trade[];
};

const DEFAULT_AVATAR = "/figma/avatar-franklin.png";

/** "2026-03-17T..." -> "Mar 17, 2026"; empty string if unparseable. */
function formatDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

/** Relative "Xd Yh" / "Xh Ym" / "Xm" / "now"; empty if no iso. */
function formatRelative(iso?: string, now: Date = new Date()): string {
  if (!iso) return "";
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return "";
  let diffMin = Math.round((target.getTime() - now.getTime()) / 60000);
  if (diffMin <= 0) return "now";
  const days = Math.floor(diffMin / 1440);
  diffMin -= days * 1440;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin - hours * 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

/**
 * Map a (profile + snapshot) pair into the renderer's `AgentCardData` shape.
 * The single seam between the R2 output schema and the card schema — change
 * either side, adjust this mapping, the rest of the pipeline is unaffected.
 */
export function toCardDataFromR2(
  profile: AgentProfile,
  snapshot: AgentSnapshot,
  now: Date = new Date(),
): AgentCardData {
  return {
    slug: profile.slug ?? slugify(profile.agentName),
    agentName: profile.agentName,
    pnl: snapshot.pnlUsd,
    profitPercent: snapshot.profitPercent,
    runs: snapshot.runsTotal,
    trades: snapshot.tradesTotal,
    nodes: profile.nodes,
    builderName: profile.builder.name,
    builderAvatar: profile.builder.avatarUrl ?? DEFAULT_AVATAR,
    activeSince: formatDate(profile.activeSinceISO),
    nextRun: formatRelative(snapshot.nextRunISO, now),
    slide: true,
  };
}
