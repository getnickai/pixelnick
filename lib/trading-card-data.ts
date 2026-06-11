/**
 * Shared NickAI trading-card helpers — used by every surface that renders the
 * Design performance card from deck data (the standalone /trading-cards pages
 * and the Engine NickAI pages). One home so the surfaces can't drift; mirrors
 * `lib/swarm-card-data.ts` on the Swarm Arena side.
 */
import type { AgentCardData } from "@/data/mock-agents";

/** Native size of the Design performance card (components/ai-ready-card). */
export const TRADING_CARD_W = 650;
export const TRADING_CARD_H = 1136;

/** A live deck agent: the card props plus the feed's stable id. */
export type TradingDeckAgent = AgentCardData & { id: string };

export function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`;
}

export function money(n: number) {
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** House-style caption (no em-dashes, no hashtags). */
export function captionFor(a: AgentCardData): string {
  const cta = "Try it for free now: getnick.ai";
  const lines = [`*${a.agentName}* · NickAI`];
  const parts = [`${pct(a.profitPercent)} return`];
  if (typeof a.pnl === "number") parts.push(`${money(a.pnl)} PNL`);
  if (typeof a.runs === "number" && typeof a.trades === "number")
    parts.push(`${a.runs} runs / ${a.trades} trades`);
  lines.push(parts.join("  ·  "));
  if (a.builderName) lines.push(`Built by ${a.builderName}`);
  lines.push(cta);
  return lines.join("\n");
}
