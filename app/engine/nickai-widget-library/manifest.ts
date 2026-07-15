/**
 * NickAI meta-agent chat widgets — the card designs Nick renders inline in chat
 * (price, portfolio, prediction markets, data readouts, trade confirmations).
 *
 * These are static PNG captures of the REAL components (from the nickai
 * `/dev/cards` harness, mock data), light + dark, so marketing has one place to
 * grab a widget visual for any channel. Re-capture with
 * `scripts/capture-widget-library.ts` after a design change (see that file).
 *
 * Files: `public/widget-library/{light,dark}/<slug>.png` (2x retina).
 * Dimensions are the CSS size of the card (the PNG is 2x each side).
 */
export type WidgetGroup =
  | "Prices & charts"
  | "Prediction markets"
  | "Portfolio"
  | "Data readouts"
  | "Trades & actions";

export type WidgetMeta = {
  /** File slug: public/widget-library/<theme>/<slug>.png */
  slug: string;
  /** Display name in the gallery. */
  label: string;
  group: WidgetGroup;
  /** Source agent tool / node this card renders (context for marketing). */
  tool?: string;
  /** CSS width/height of the card (PNG is 2x). */
  w: number;
  h: number;
};

/** Group display order in the gallery. */
export const WIDGET_GROUPS: WidgetGroup[] = [
  "Prices & charts",
  "Prediction markets",
  "Portfolio",
  "Data readouts",
  "Trades & actions",
];

export const WIDGETS: WidgetMeta[] = [
  // Prices & charts
  { slug: "price-single-interactive", label: "Price · interactive candles", group: "Prices & charts", tool: "run_price_data", w: 440, h: 348 },
  { slug: "price-stocks-databento", label: "Price · stocks (Databento)", group: "Prices & charts", tool: "run_stocks_data", w: 440, h: 348 },
  { slug: "price-close-only-coingecko-1d", label: "Price · line fallback", group: "Prices & charts", tool: "run_price_data", w: 440, h: 392 },
  { slug: "price-multi-resolution-sta-456", label: "Price · multi-resolution", group: "Prices & charts", tool: "run_price_data", w: 440, h: 348 },
  { slug: "comparison-2-assets", label: "Comparison · 2 assets", group: "Prices & charts", tool: "run_price_data", w: 440, h: 344 },
  { slug: "comparison-3-assets", label: "Comparison · 3 assets", group: "Prices & charts", tool: "run_price_data", w: 440, h: 366 },
  { slug: "chart-indexed-to-100", label: "Chart · indexed to 100", group: "Prices & charts", tool: "render_chart", w: 440, h: 335 },
  { slug: "chart-volume-bars", label: "Chart · volume bars", group: "Prices & charts", tool: "render_chart", w: 440, h: 307 },
  { slug: "chart-near-constant-line", label: "Chart · near-constant line", group: "Prices & charts", tool: "render_chart", w: 440, h: 307 },

  // Prediction markets
  { slug: "markets-sortable", label: "Markets · sortable list", group: "Prediction markets", tool: "search_prediction_markets", w: 440, h: 621 },
  { slug: "polymarket-binary", label: "Polymarket · binary", group: "Prediction markets", tool: "render_polymarket_market", w: 440, h: 290 },
  { slug: "polymarket-multi-candidate", label: "Polymarket · multi-candidate", group: "Prediction markets", tool: "render_polymarket_market", w: 440, h: 306 },
  { slug: "polymarket-with-history", label: "Polymarket · with history", group: "Prediction markets", tool: "render_polymarket_market", w: 440, h: 290 },
  { slug: "kalshi-match-history", label: "Kalshi · match (history)", group: "Prediction markets", tool: "render_polymarket_market", w: 440, h: 290 },
  { slug: "kalshi-no-history", label: "Kalshi · no history", group: "Prediction markets", tool: "render_polymarket_market", w: 440, h: 214 },

  // Portfolio
  { slug: "portfolio-snapshot-curve", label: "Portfolio · snapshot + curve", group: "Portfolio", tool: "run_portfolio", w: 440, h: 405 },

  // Data readouts
  { slug: "statgrid-liquidations", label: "Liquidations", group: "Data readouts", tool: "run_coinglass", w: 440, h: 248 },
  { slug: "statgrid-funding-rate", label: "Funding rate", group: "Data readouts", tool: "run_coinglass", w: 440, h: 210 },
  { slug: "statgrid-fear-greed", label: "Fear & Greed", group: "Data readouts", tool: "run_coinglass", w: 440, h: 128 },
  { slug: "value-tvl-over-time", label: "TVL over time", group: "Data readouts", tool: "run_defillama", w: 440, h: 304 },
  { slug: "list-yields", label: "Top yields", group: "Data readouts", tool: "run_defillama", w: 440, h: 322 },
  { slug: "list-options-oi", label: "Options open interest", group: "Data readouts", tool: "run_coinglass", w: 440, h: 263 },

  // Trades & actions
  { slug: "buy-filled", label: "Buy · filled", group: "Trades & actions", tool: "run_exchange", w: 440, h: 282 },
  { slug: "sell-filled", label: "Sell · filled", group: "Trades & actions", tool: "run_exchange", w: 440, h: 282 },
  { slug: "close-position", label: "Close position", group: "Trades & actions", tool: "run_exchange", w: 440, h: 281 },
  { slug: "pending-working-limit", label: "Pending · working limit", group: "Trades & actions", tool: "run_exchange", w: 440, h: 216 },
  { slug: "failed-rejected-order", label: "Failed · rejected", group: "Trades & actions", tool: "run_exchange", w: 440, h: 194 },
  { slug: "skipped", label: "Skipped", group: "Trades & actions", tool: "run_exchange", w: 440, h: 171 },
  { slug: "bet-placed", label: "Bet placed", group: "Trades & actions", tool: "run_exchange", w: 440, h: 282 },
  { slug: "swap-cow", label: "Swap · CoW", group: "Trades & actions", tool: "run_cow_swap", w: 440, h: 222 },
  { slug: "supply-aave", label: "Supply · Aave", group: "Trades & actions", tool: "run_aave_v3", w: 440, h: 171 },
  { slug: "stake-lido", label: "Stake · Lido", group: "Trades & actions", tool: "run_lido", w: 440, h: 171 },
];

export const WIDGET_COUNT = WIDGETS.length;
