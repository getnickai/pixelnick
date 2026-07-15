/**
 * Data types + deterministic sample data for the reusable NickAI chat cards
 * (the in-chat cards Nick renders: a price / candlestick card and a portfolio
 * snapshot card). Faithful to the real product widgets on nickai-app
 * (origin/badi1/cards-in-chat: price-card.tsx / portfolio-card.tsx).
 *
 * The Views (price-card-view / portfolio-card-view) are pure, data-driven and
 * importable, so these cards are first-class REUSABLE pixelnick compositions
 * AND can be embedded into the launch video later. All sample data is
 * DETERMINISTIC — no Math.random / Date.now (both throw in this Remotion
 * bundle); candles and the equity curve come from a seeded sine helper.
 */

// ── Data shapes ───────────────────────────────────────────────────────────────

export type Candle = { o: number; h: number; l: number; c: number };

export type PriceCardData = {
  symbol: string;
  source: string;
  /** Preformatted headline price, e.g. "$184.52". */
  priceLabel: string;
  /** 24h change as a percent, signed (drives green/red). */
  changePct: number;
  /** Snapshot date/time display string. */
  snapshot: string;
  candles: Candle[];
  periods: string[];
  activePeriod: string;
};

export type PortfolioPosition = {
  symbol: string;
  /** Legend dot + allocation-bar segment color (hex). */
  color: string;
  allocPct: number;
  value: number;
  /** Unrealized P&L percent, signed (green/red). null hides it (e.g. cash). */
  pnlPct: number | null;
};

export type PortfolioCardData = {
  account: string;
  netWorth: number;
  pnlAbs: number;
  pnlPct: number;
  snapshot: string;
  /** Reconstructed equity curve, oldest → newest. */
  curve: number[];
  positions: PortfolioPosition[];
};

export type TradeConfirmationCardData = {
  symbol: string;
  /** Company / instrument name under the symbol. */
  name: string;
  side: "Buy" | "Sell";
  /** e.g. "Filled". */
  status: string;
  shares: number;
  /** Average fill price per share. */
  avgPrice: number;
  /** Order total (shares × avgPrice). */
  total: number;
  account: string;
  /** Filled-at display string. */
  filledAt: string;
};

// ── Seeded generators (deterministic) ─────────────────────────────────────────
// A tiny sine-based pseudo-random walk. Same seed → same series every render,
// so a still is byte-stable and the launch video can reuse it. No RNG, no clock.

function wob(seed: number, i: number, freq: number): number {
  // Layered sines detuned by the seed → an irregular, non-repeating-looking
  // wiggle in [-1, 1] without Math.random.
  return (
    0.6 * Math.sin(i * freq + seed) +
    0.3 * Math.sin(i * freq * 2.3 + seed * 1.7) +
    0.1 * Math.sin(i * freq * 5.1 + seed * 0.4)
  );
}

/**
 * Generate `n` OHLC candles around `base`, with an overall `driftPct` trend and
 * a mid-run pump so the shape reads like the reference (flat → pump → choppy up
 * → fade). `vol` sets candle body/wick size as a fraction of price.
 */
export function seededCandles(
  seed: number,
  n: number,
  base: number,
  driftPct: number,
  vol = 0.02,
): Candle[] {
  const out: Candle[] = [];
  let prevClose = base * (1 - driftPct / 100);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // Base trend: gentle S rise, a pronounced pump around 30%, a fade near the
    // end — mirrors the AAPL reference (rise then roll over).
    const trend =
      driftPct / 100 * (t - 0.5) +
      0.06 * Math.sin(t * Math.PI) + // arch: up then back
      (t > 0.25 && t < 0.4 ? 0.05 : 0) + // the pump
      -0.05 * Math.max(0, t - 0.72); // late fade
    const mid = base * (1 + trend + 0.015 * wob(seed, i, 0.55));
    const open = prevClose;
    const close = mid + base * vol * 0.8 * wob(seed + 3, i, 0.8);
    const hi = Math.max(open, close) + base * vol * (0.5 + 0.5 * Math.abs(wob(seed + 7, i, 1.3)));
    const lo = Math.min(open, close) - base * vol * (0.5 + 0.5 * Math.abs(wob(seed + 11, i, 1.1)));
    out.push({ o: open, h: hi, l: lo, c: close });
    prevClose = close;
  }
  return out;
}

/**
 * Generate an equity curve of `n` points from `start` to `end`, rising with an
 * ease-in-out and a late acceleration to a peak near the right edge (matches the
 * portfolio reference). Deterministic.
 */
export function seededCurve(seed: number, n: number, start: number, end: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // smoothstep base rise + a small plateau dip in the middle + late kick
    const smooth = t * t * (3 - 2 * t);
    const kick = 0.12 * Math.max(0, t - 0.6) / 0.4; // steepen after 60%
    const ripple = 0.012 * wob(seed, i, 0.7);
    const frac = Math.min(1, smooth * 0.85 + kick + ripple);
    out.push(start + (end - start) * frac);
  }
  return out;
}

// ── Sample data ───────────────────────────────────────────────────────────────

const SNAPSHOT = "Jun 25, 2026, 7:42 PM";

export const SAMPLE_PRICE_NVDA: PriceCardData = {
  symbol: "NVDA",
  source: "Databento",
  priceLabel: "$184.52",
  changePct: 1.82,
  snapshot: SNAPSHOT,
  candles: seededCandles(2, 32, 184.52, 22, 0.02),
  periods: ["1D", "1W", "1M", "3M", "1Y"],
  activePeriod: "1M",
};

export const SAMPLE_PRICE_SPACEX: PriceCardData = {
  symbol: "SPACEX",
  source: "Databento",
  priceLabel: "$412.80",
  changePct: 4.35,
  snapshot: SNAPSHOT,
  candles: seededCandles(9, 32, 412.8, 34, 0.022),
  periods: ["1D", "1W", "1M", "3M", "1Y"],
  activePeriod: "1M",
};

// seriesColor palette from the real comparison-chart (sky / amber / violet /
// pink / …). Cash uses the neutral soft gray.
export const SAMPLE_PORTFOLIO: PortfolioCardData = {
  account: "papernick2",
  netWorth: 48250,
  pnlAbs: 6120,
  pnlPct: 14.53,
  snapshot: SNAPSHOT,
  curve: seededCurve(5, 48, 42130, 48250),
  positions: [
    { symbol: "BTC/USD", color: "#0ea5e9", allocPct: 42, value: 20265, pnlPct: 18.2 },
    { symbol: "NVDA", color: "#f59e0b", allocPct: 24, value: 11580, pnlPct: 9.4 },
    { symbol: "SPACEX", color: "#8b5cf6", allocPct: 16, value: 7720, pnlPct: 26.1 },
    { symbol: "ETH/USD", color: "#ec4899", allocPct: 10, value: 4825, pnlPct: -3.1 },
    { symbol: "Cash", color: "#71717a", allocPct: 8, value: 3860, pnlPct: null },
  ],
};

// A filled Apple buy — the payoff of the executed workflow.
export const SAMPLE_TRADE_AAPL: TradeConfirmationCardData = {
  symbol: "AAPL",
  name: "Apple Inc.",
  side: "Buy",
  status: "Filled",
  shares: 27,
  avgPrice: 232.15,
  total: 6268.05,
  account: "papernick2",
  filledAt: "Jun 25, 2026, 7:42 PM",
};

// ── Composition props ─────────────────────────────────────────────────────────

export type ChatPriceCardProps = { data?: PriceCardData };
export type ChatPortfolioCardProps = { data?: PortfolioCardData };
export type ChatTradeCardProps = { data?: TradeConfirmationCardData };

export const chatPriceCardDefaultProps: ChatPriceCardProps = { data: SAMPLE_PRICE_NVDA };
export const chatPortfolioCardDefaultProps: ChatPortfolioCardProps = { data: SAMPLE_PORTFOLIO };
export const chatTradeCardDefaultProps: ChatTradeCardProps = { data: SAMPLE_TRADE_AAPL };
