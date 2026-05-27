/**
 * Mock agent dataset for automated performance-card generation.
 *
 * Each entry is a full set of `PerformanceCardProps` plus a `slug` used to name
 * the output files (`out/<slug>.png`, `out/<slug>.mp4`).
 *
 * This stands in for the eventual real data source (NickAI DB / internal API).
 * Swap `mockAgents` for a fetch + map to the same shape and the render pipeline
 * keeps working unchanged.
 */
import type { PerformanceCardProps } from "@/remotion/compositions/performance-card/props";

export type AgentCardData = PerformanceCardProps & {
  /** Filename-safe identifier, e.g. "mag-7-rotator-v2". */
  slug: string;
};

export const mockAgents: AgentCardData[] = [
  {
    slug: "mag-7-rotator-v2",
    agentName: "Mag 7 Rotator V2 — Rotation 25% Cap",
    pnl: 4012.95,
    profitPercent: 27.97,
    runs: 12,
    trades: 26,
    builderName: "Franklin",
    builderAvatar: "/figma/avatar-franklin.png",
    activeSince: "Mar 17, 2026",
    nodes: 9,
    nextRun: "6h 2m",
    slide: true,
  },
  {
    slug: "btc-momentum-scalper",
    agentName: "BTC Momentum Scalper — 15m EMA Cross",
    pnl: 8841.4,
    profitPercent: 41.12,
    runs: 48,
    trades: 132,
    builderName: "Franklin",
    builderAvatar: "/figma/avatar-franklin.png",
    activeSince: "Jan 04, 2026",
    nodes: 14,
    nextRun: "12m",
    slide: true,
  },
  {
    slug: "dividend-harvester",
    agentName: "Dividend Harvester — Blue Chip Income",
    pnl: 1290.33,
    profitPercent: 6.84,
    runs: 5,
    trades: 9,
    builderName: "Franklin",
    builderAvatar: "/figma/avatar-franklin.png",
    activeSince: "Feb 28, 2026",
    nodes: 6,
    nextRun: "1d 3h",
    slide: true,
  },
  {
    slug: "ai-sector-breakout",
    agentName: "AI Sector Breakout — Volatility Filter",
    pnl: 15730.8,
    profitPercent: 63.5,
    runs: 91,
    trades: 240,
    builderName: "Franklin",
    builderAvatar: "/figma/avatar-franklin.png",
    activeSince: "Nov 12, 2025",
    nodes: 18,
    nextRun: "44m",
    slide: true,
  },
  {
    slug: "mean-reversion-spy",
    agentName: "Mean Reversion SPY — RSI Bands",
    pnl: 2204.17,
    profitPercent: 13.06,
    runs: 33,
    trades: 71,
    builderName: "Franklin",
    builderAvatar: "/figma/avatar-franklin.png",
    activeSince: "Mar 02, 2026",
    nodes: 11,
    nextRun: "3h 18m",
    slide: true,
  },
];
