/**
 * Swarm Arena agent-output shape helpers — shared by the deck builder
 * (lib/swarm-deck.ts) and the consensus builder (scripts/swarm-consensus.ts).
 *
 * The competition agents' R2 writer is inconsistent in two ways the card
 * readers must defend against:
 *
 *  1. STUB SNAPSHOTS (Bug B): the writer intermittently overwrites
 *     snapshot.json (or an individual run file) with an empty stub —
 *     { current_value: starting, run_count: 0, open_positions: [], closed_trades: [] }
 *     — then self-heals on the next run. A reader that trusts the stub renders
 *     the agent flat at its starting book / 0% / no picks. `isStubSnap` detects
 *     it so callers can fall back to the most recent NON-stub run.
 *
 *  2. DIVERGENT CLOSED-TRADE SHAPES (Bug A): closed_trades ships in ≥3 writer
 *     shapes — { result, pnl_usd } (gpt/deepseek), { realized_pnl_usd, last_price }
 *     with NO pnl_usd (kimi/qwen), and voided / empty (grok/gemini). `closedPnl`
 *     and `tradeResult` read every shape so the per-trade P&L and win/loss never
 *     silently read $0 / blank for the realized_pnl_usd writers.
 *
 * Headline ROI/equity still comes from performance.current_value / roi_pct (the
 * writer's book value, which reconciles with the replayed settled-trade ledger);
 * these helpers only harden the ledger-derived secondary fields (lastTrade,
 * record, streak) and the stub guard.
 */

const STARTING_CAPITAL = 1000;

const num = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

/** A closed trade's realised P&L across writer shapes: pnl_usd | pnl | realized_pnl_usd. */
export function closedPnl(t: any): number {
  return num(t?.pnl_usd) ?? num(t?.pnl) ?? num(t?.realized_pnl_usd) ?? 0;
}

/**
 * Win / loss / void for a closed trade. Prefers the explicit `result`; when the
 * writer omits it (the realized_pnl_usd shape), infers from the settled
 * `last_price` (1 = win, 0 = loss; anything else = void).
 */
export function tradeResult(t: any): "win" | "loss" | "void" {
  const r = String(t?.result ?? "").toLowerCase();
  if (r === "win" || r === "loss" || r === "void") return r;
  if (t?.last_price === 1) return "win";
  if (t?.last_price === 0) return "loss";
  return "void";
}

/**
 * True when a snapshot/run is the writer's empty stub: no positions, no closed
 * trades, book value still at starting capital, and zero runs. Such a doc means
 * "the writer hiccuped", not "the agent is flat" — callers should fall back to
 * the most recent non-stub run rather than render the agent flat.
 */
export function isStubSnap(doc: any): boolean {
  if (!doc) return true;
  const perf = doc.performance ?? {};
  const open = (doc.open_positions ?? doc.positions ?? []).length;
  const closed = (doc.closed_trades ?? []).length;
  const start = perf.starting_capital ?? doc.bankrollRefUsd ?? STARTING_CAPITAL;
  const value = perf.current_value ?? start;
  const runCount = perf.run_count ?? doc.runsTotal ?? 0;
  return open === 0 && closed === 0 && value === start && runCount === 0;
}
