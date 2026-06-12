/**
 * Shared Engine-side mapping from live deck agents (EngineAgent) to the Design
 * model card's props (SwarmArenaModelCardData) — used by every Swarm Arena
 * engine surface (kit, history). Keeps the deck→card translation in one place
 * so the surfaces can't drift.
 */
import type { SwarmArenaModelCardData } from "@/components/swarm-arena-model-card";
import { identityFor } from "@/data/swarm-identity";
import type { EngineAgent } from "@/data/swarm-output";

/** Native size of the Design model card (components/swarm-arena-model-card). */
export const MODEL_CARD_W = 650;
export const MODEL_CARD_H = 1110;

export const MODELS_ASSET = "/swarm-arena-cards/assets/models";
/** Handles with a monochrome mark on disk; others fall back to a monogram. */
export const MODEL_LOGOS: Record<string, string> = {
  GPT: "chatgpt",
  CLAUDE: "claude",
  GEMINI: "google",
  KIMI: "kimi",
  GROK: "grok",
  DEEPSEEK: "deepseek",
  MISTRAL: "mistral",
};

/** "BACK Yes @ 0.38" → { label: "BACK Yes at:", value: "0.38" } */
export function toPickRow(side: string): { label: string; value: string } {
  const at = side.lastIndexOf(" @ ");
  if (at === -1) return { label: side, value: "—" };
  return { label: `${side.slice(0, at)} at:`, value: side.slice(at + 3) };
}

export function toCardData(
  a: EngineAgent,
  rank: number,
  rankOf: number,
): SwarmArenaModelCardData {
  const base = a.spark?.[0] ?? 1000;
  const equity = a.spark?.[a.spark.length - 1] ?? base * (1 + a.roiPct / 100);
  const wins = Math.round(a.signals * a.pickPct);
  const logoFile = MODEL_LOGOS[a.handle];
  const hasPick = a.pick && a.pick.side && a.pick.side !== "—";
  return {
    // Meta model name only ("Gemini", "Kimi", "GPT") — NOT the version
    // ("Gemini 3 Pro"). The design-owned registry's `short` is purpose-built
    // for this; fall back to the deck's short fields.
    name: identityFor(a.handle)?.short ?? a.short ?? a.label ?? a.handle,
    logo: logoFile ? `${MODELS_ASSET}/${logoFile}.svg` : undefined,
    monogram: a.code,
    monogramColor: a.color,
    pnlUsd: equity - base,
    profitPct: a.roiPct,
    equityUsd: equity,
    baseUsd: base,
    pickAccuracyPct: a.pickPct * 100,
    record: a.record ?? `${wins}-${Math.max(0, a.signals - wins)}`,
    rank,
    rankOf,
    topPick: hasPick ? toPickRow(a.pick.side) : undefined,
    latestPicks: (a.recent ?? []).slice(0, 3).map((r) => toPickRow(r.side)),
    // Equity curve for the background chart.
    spark: a.spark,
  };
}

/**
 * The upstream feed has produced colliding handles (two agents reporting
 * "GPT") — keep the first/higher-ranked per handle so selection and React
 * keys stay sound.
 */
export function dedupeByHandle(agents: EngineAgent[]): EngineAgent[] {
  const seen = new Set<string>();
  return agents.filter((a) => {
    if (seen.has(a.handle)) return false;
    seen.add(a.handle);
    return true;
  });
}
