/**
 * Build ledger — the durable record of which cards have been generated.
 *
 * Lives at `data/cards-built.json` and IS committed (unlike `out/`, which is
 * gitignored). On each run the generator diffs the incoming agents against this
 * ledger to decide what's new, what changed, and what can be skipped.
 *
 * The content hash deliberately EXCLUDES `nextRun` (a relative countdown that
 * changes every run) and `slug` (the key). A card is only considered "changed"
 * when real performance data moves.
 */
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import type { AgentCardData } from "../data/mock-agents";

export const LEDGER_PATH = path.join(process.cwd(), "data", "cards-built.json");

export type LedgerEntry = {
  /** Source the agent came from (e.g. "nickai", "swarm-arena"). */
  source: string;
  slug: string;
  agentName: string;
  hash: string;
  builtAt: string;
  outputs: { png?: string; mp4?: string };
  /** Slack permalink (or future CDN URL) where the card was published. */
  publishedTo?: string;
};

export type Ledger = {
  generatedAt: string;
  /** Keyed by `<source>/<slug>` so identical slugs in different sources don't collide. */
  cards: Record<string, LedgerEntry>;
};

/** Composite key under which a card is stored in the ledger. */
export function ledgerKey(source: string, slug: string): string {
  return `${source}/${slug}`;
}

/** Stable content hash of the card-relevant fields (excludes slug + nextRun). */
export function hashCard(agent: AgentCardData): string {
  const stable = {
    agentName: agent.agentName,
    pnl: agent.pnl,
    profitPercent: agent.profitPercent,
    runs: agent.runs,
    trades: agent.trades,
    nodes: agent.nodes,
    builderName: agent.builderName,
    builderAvatar: agent.builderAvatar,
    activeSince: agent.activeSince,
    slide: agent.slide ?? true,
  };
  return crypto.createHash("sha256").update(JSON.stringify(stable)).digest("hex");
}

export function loadLedger(): Ledger {
  if (!fs.existsSync(LEDGER_PATH)) {
    return { generatedAt: new Date().toISOString(), cards: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(LEDGER_PATH, "utf8")) as Ledger;
    return { generatedAt: parsed.generatedAt, cards: parsed.cards ?? {} };
  } catch {
    return { generatedAt: new Date().toISOString(), cards: {} };
  }
}

export function saveLedger(ledger: Ledger): void {
  ledger.generatedAt = new Date().toISOString();
  fs.mkdirSync(path.dirname(LEDGER_PATH), { recursive: true });
  fs.writeFileSync(LEDGER_PATH, JSON.stringify(ledger, null, 2) + "\n");
}

export type BuildReason = "new" | "updated" | "missing-files" | "forced";
export type Plan = {
  source: string;
  slug: string;
  agent: AgentCardData;
  build: boolean;
  reason: BuildReason | "unchanged";
};

/**
 * Decide, per agent, whether to build and why. `outputsExist` checks the actual
 * files on disk so a deleted `out/` (fresh clone) triggers a rebuild even when
 * the hash matches. Caller passes the source so the ledger key is composite.
 */
export function planBuilds(
  source: string,
  agents: AgentCardData[],
  ledger: Ledger,
  opts: { force: boolean; outputsExist: (slug: string) => boolean },
): Plan[] {
  return agents.map((agent) => {
    const hash = hashCard(agent);
    const prev = ledger.cards[ledgerKey(source, agent.slug)];
    let reason: Plan["reason"];
    if (opts.force) reason = "forced";
    else if (!prev) reason = "new";
    else if (prev.hash !== hash) reason = "updated";
    else if (!opts.outputsExist(agent.slug)) reason = "missing-files";
    else reason = "unchanged";
    return {
      source,
      slug: agent.slug,
      agent,
      build: reason !== "unchanged",
      reason,
    };
  });
}

/** Slugs present in the ledger for this source but absent from the current pull. */
export function removedSlugs(
  source: string,
  agents: AgentCardData[],
  ledger: Ledger,
): string[] {
  const current = new Set(agents.map((a) => ledgerKey(source, a.slug)));
  return Object.keys(ledger.cards)
    .filter((k) => k.startsWith(`${source}/`) && !current.has(k))
    .map((k) => k.slice(source.length + 1));
}
