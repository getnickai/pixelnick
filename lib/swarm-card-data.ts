/**
 * Shared mapping from the live/historical deck (`EngineAgent`, served by
 * `/api/swarm-deck`) to the React design card's data shape
 * (`SwarmArenaModelCardData`, consumed by `components/swarm-arena-model-card.tsx`).
 *
 * Single home so every host that renders the Design card from deck data — the
 * Engine kit (`/engine/swarm-arena-kit`) and the Swarm history page — uses one
 * mapping. The React component stays the single design source of truth; this is
 * just the data adapter feeding it.
 */
import type { SwarmArenaModelCardData } from "@/components/swarm-arena-model-card";
import type { EngineAgent } from "@/data/swarm-output";
import { identityFor } from "@/data/swarm-identity";

export const MODELS_ASSET = "/swarm-arena-cards/assets/models";

/** Handles with a monochrome mark on disk; others fall back to a monogram. */
export const MODEL_LOGOS: Record<string, string> = {
  GPT: "chatgpt",
  CLAUDE: "claude",
  GEMINI: "google",
  KIMI: "kimi",
  GLM: "glm",
  GROK: "grok",
  DEEPSEEK: "deepseek",
  MINIMAX: "minimax",
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
    // Versioned display name ("Kimi K2", "GPT-5.1") from the design-owned
    // registry — the deck's `label` is the short headline ("Kimi").
    name: identityFor(a.handle)?.label ?? a.label ?? a.short ?? a.handle,
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
