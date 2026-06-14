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

/**
 * How complete an agent doc is: [#settled trades, run_count]. `closed_trades`
 * count is the honest monotonic signal — a settled win/loss never un-settles —
 * with run_count as the tie-breaker among equally-settled docs (later rollup).
 */
function completeness(doc: any): [number, number] {
  return [(doc?.closed_trades ?? []).length, doc?.performance?.run_count ?? doc?.runsTotal ?? 0];
}

/**
 * Pick the doc that best represents the agent's CURRENT state, defending against
 * the writer's transient regressions. Beyond the empty stub (isStubSnap), the
 * writer also intermittently writes a PARTIAL rewrite where run_count and
 * closed_trades go BACKWARDS (e.g. KIMI: run_count 24→20, $1437→$1012, 11→2
 * settled) before self-healing on the next run — so the live snapshot can briefly
 * understate a +43% book as +1%.
 *
 * Strategy: trust the snapshot (the writer's authoritative rollup) UNLESS it is a
 * stub, or a run still carries MORE settled trades than the snapshot — i.e. the
 * snapshot dropped ledger history it can't honestly have lost. Then fall back to
 * that fuller run. A healthy snapshot has the most settled trades, so this is a
 * no-op for agents the writer isn't currently glitching. (It does NOT mask a real
 * loss: losing money lowers current_value, not the settled-trade count.)
 *
 * Pass snapshot=null to just choose the most-complete run (used by the consensus
 * builder, which has no snapshot — only runs/).
 */
export function pickEffectiveSnapshot(snapshot: any, runs: any[]): any {
  // Most-complete run; ties resolve to the later one (runs are timestamp-sorted).
  const best = (runs ?? []).reduce<any>((b, r) => {
    if (!r) return b;
    if (!b) return r;
    const [rClosed, rRuns] = completeness(r);
    const [bClosed, bRuns] = completeness(b);
    return rClosed > bClosed || (rClosed === bClosed && rRuns >= bRuns) ? r : b;
  }, null);
  if (!snapshot) return best;
  if (!best) return snapshot;
  if (isStubSnap(snapshot)) return best;
  return completeness(best)[0] > completeness(snapshot)[0] ? best : snapshot;
}
