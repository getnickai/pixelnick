/**
 * Real-data input contract for the card generator.
 *
 * This is what you feed the pipeline via `--data=agents.json`. It carries RAW
 * values (numbers + ISO timestamps + an avatar URL) so the data producer never
 * has to know how the card formats anything. `toCardData()` maps each input to
 * the `AgentCardData` shape the renderer consumes, doing all display formatting
 * here in one place.
 *
 * Minimum required per object: agentName, pnl, profitPercent, runs, trades,
 * nodes. Everything else has a sensible default.
 */
import type { AgentCardData } from "./mock-agents";

export type AgentInput = {
  /** Filename-safe id. Optional — derived from agentName if omitted. */
  slug?: string;
  agentName: string;
  /** PNL in USD, raw number e.g. 4012.95 */
  pnl: number;
  /** Profit percent, raw number e.g. 27.97 */
  profitPercent: number;
  runs: number;
  trades: number;
  nodes: number;
  /** Defaults to "Franklin". */
  builderName?: string;
  /**
   * Avatar as a remote URL (downloaded into public/ before rendering) OR a path
   * already under /public (e.g. "/figma/avatar-franklin.png"). Defaults to the
   * bundled Franklin avatar.
   */
  builderAvatarUrl?: string;
  /** ISO timestamp the agent went live, e.g. "2026-03-17T00:00:00Z". */
  activeSinceISO?: string;
  /** ISO timestamp of the next scheduled run; rendered relative to now. */
  nextRunISO?: string;
  /** Count-up animation style (default true = slot-machine slide). */
  slide?: boolean;
};

const DEFAULT_AVATAR = "/figma/avatar-franklin.png";

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** "2026-03-17T00:00:00Z" -> "Mar 17, 2026". Falls back to "" if unparseable. */
export function formatActiveSince(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

/**
 * Next-run ISO -> compact relative string from `now`:
 *   >= 1 day  -> "2d 4h"
 *   >= 1 hour -> "6h 2m"
 *   < 1 hour  -> "12m"
 *   past/now  -> "now"
 */
export function formatNextRun(iso?: string, now: Date = new Date()): string {
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

/** Map one raw input object to the renderer's card-data shape. */
export function toCardData(input: AgentInput, now: Date = new Date()): AgentCardData {
  return {
    slug: input.slug ?? slugify(input.agentName),
    agentName: input.agentName,
    pnl: input.pnl,
    profitPercent: input.profitPercent,
    runs: input.runs,
    trades: input.trades,
    nodes: input.nodes,
    builderName: input.builderName ?? "Franklin",
    // Resolved to a /public path by the generator (remote URLs are downloaded
    // first); local paths and the default pass through unchanged.
    builderAvatar: input.builderAvatarUrl ?? DEFAULT_AVATAR,
    activeSince: formatActiveSince(input.activeSinceISO),
    nextRun: formatNextRun(input.nextRunISO, now),
    slide: input.slide ?? true,
  };
}
