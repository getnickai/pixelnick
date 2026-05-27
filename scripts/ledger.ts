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
  agentName: string;
  hash: string;
  builtAt: string;
  outputs: { png?: string; mp4?: string };
  /** Slack permalink (or future CDN URL) where the card was published. */
  publishedTo?: string;
};

export type Ledger = {
  generatedAt: string;
  cards: Record<string, LedgerEntry>;
};

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
  slug: string;
  agent: AgentCardData;
  build: boolean;
  reason: BuildReason | "unchanged";
};

/**
 * Decide, per agent, whether to build and why. `outputsExist` checks the actual
 * files on disk so a deleted `out/` (fresh clone) triggers a rebuild even when
 * the hash matches.
 */
export function planBuilds(
  agents: AgentCardData[],
  ledger: Ledger,
  opts: { force: boolean; outputsExist: (slug: string) => boolean },
): Plan[] {
  return agents.map((agent) => {
    const hash = hashCard(agent);
    const prev = ledger.cards[agent.slug];
    let reason: Plan["reason"];
    if (opts.force) reason = "forced";
    else if (!prev) reason = "new";
    else if (prev.hash !== hash) reason = "updated";
    else if (!opts.outputsExist(agent.slug)) reason = "missing-files";
    else reason = "unchanged";
    return { slug: agent.slug, agent, build: reason !== "unchanged", reason };
  });
}

/** Slugs present in the ledger but absent from the current pull. */
export function removedSlugs(agents: AgentCardData[], ledger: Ledger): string[] {
  const current = new Set(agents.map((a) => a.slug));
  return Object.keys(ledger.cards).filter((slug) => !current.has(slug));
}
