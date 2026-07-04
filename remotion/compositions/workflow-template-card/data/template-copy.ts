/**
 * Authored marketing copy for each library template, keyed by slug.
 *
 * This is the ONE hand-edited data file for the Workflow Template Card:
 *   - `prompt`           first-person phrasing a user would type to Nick (intro).
 *   - `description`      third-person summary for the static poster.
 *   - `nickDescription`  Nick's first-person voice on the animated payoff
 *                        ("I made a strategy that…").
 *
 * Names, nodes, edges and node subtitles are derived automatically from the
 * library definitions by `scripts/gen-templates.ts`. Edit copy here, then run
 * `bun scripts/gen-templates.ts` to regenerate `templates.generated.ts`.
 */
export type TemplateCopy = {
  prompt: string;
  description: string;
  nickDescription: string;
};

export const TEMPLATE_COPY: Record<string, TemplateCopy> = {
  "ai-hedge-fund-paper-trading": {
    prompt: "Run an AI hedge fund on paper",
    description:
      "Runs a committee of AI analysts over price and derivatives data, sizes conviction-weighted positions, and paper-trades the book with a full report.",
    nickDescription:
      "I built a paper hedge fund that runs a committee of AI analysts over price and derivatives data, sizes conviction-weighted positions, and trades the book with a full report.",
  },
  "btc-buy-the-dip": {
    prompt: "Automate my BTC dip buying",
    description:
      "Reads BTC price + your portfolio daily, scores the dip with RSI, Bollinger Bands & moving averages, rebalances, and emails a full report.",
    nickDescription:
      "I made a strategy that reads BTC price + your portfolio daily, scores the dip with RSI, Bollinger Bands & moving averages, rebalances, and emails you a full report.",
  },
  "btc-eth-pairs-trader-paper-trading": {
    prompt: "Paper-trade the BTC/ETH spread",
    description:
      "Tracks the BTC–ETH ratio, scores mean-reversion signals with an LLM, and paper-trades the pair — pinging Telegram on every rebalance.",
    nickDescription:
      "I made a strategy that tracks the BTC–ETH ratio, scores mean-reversion signals with an LLM, paper-trades the pair, and pings you on Telegram every rebalance.",
  },
  "btc-momentum-consensus": {
    prompt: "Trade BTC momentum by consensus",
    description:
      "Blends price, funding and open-interest into a multi-model momentum vote, rebalances BTC, and emails the committee's verdict.",
    nickDescription:
      "I made a strategy that blends price, funding and open-interest into a multi-model momentum vote, rebalances BTC, and emails you the committee's verdict.",
  },
  "crypto-news-catalyst-monitor": {
    prompt: "Watch crypto news for catalysts",
    description:
      "Scans crypto headlines, has an LLM grade each catalyst's impact, and emails you the market-moving stories worth acting on.",
    nickDescription:
      "I made a strategy that scans crypto headlines, has an LLM grade each catalyst's impact, and emails you the market-moving stories worth acting on.",
  },
  "crypto-sector-heatmap-weekly-report": {
    prompt: "Send me a weekly crypto heatmap",
    description:
      "Pulls prices across crypto sectors, ranks the hot and cold rotations, and emails a weekly heatmap of where money is flowing.",
    nickDescription:
      "I made a workflow that pulls prices across crypto sectors, ranks the hot and cold rotations, and emails you a weekly heatmap of where money is flowing.",
  },
  "equity-news-catalyst-monitor": {
    prompt: "Monitor stock news for catalysts",
    description:
      "Watches equity news, scores each headline's catalyst potential with an LLM, and emails the stories most likely to move your names.",
    nickDescription:
      "I made a strategy that watches equity news, scores each headline's catalyst potential with an LLM, and emails you the stories most likely to move your names.",
  },
  "eth-agent-ai": {
    prompt: "Give me an ETH trading agent",
    description:
      "An autonomous ETH agent reads price + derivatives data, forms a thesis with an LLM, executes the trade, and reports on Telegram.",
    nickDescription:
      "I built an autonomous ETH agent that reads price + derivatives data, forms a thesis with an LLM, executes the trade, and reports to you on Telegram.",
  },
  "eth-btc-relative-value-rotation": {
    prompt: "Rotate between ETH and BTC",
    description:
      "Measures ETH vs BTC relative value, rotates the allocation on regime shifts, and emails each rebalance with the rationale.",
    nickDescription:
      "I made a strategy that measures ETH vs BTC relative value, rotates the allocation on regime shifts, and emails you each rebalance with the rationale.",
  },
  "funding-rate-contrarian-paper-trading": {
    prompt: "Fade extreme funding rates",
    description:
      "Hunts stretched perp funding, fades the crowded side after an LLM check, and paper-trades the contrarian position with Telegram alerts.",
    nickDescription:
      "I made a strategy that hunts stretched perp funding, fades the crowded side after an LLM check, paper-trades the contrarian position, and alerts you on Telegram.",
  },
  "growth-vs-value-factor-rotation": {
    prompt: "Rotate growth vs value",
    description:
      "Compares growth and value factor momentum, tilts the portfolio to the leading factor, and emails the rotation call.",
    nickDescription:
      "I made a strategy that compares growth and value factor momentum, tilts the portfolio to the leading factor, and emails you the rotation call.",
  },
  "mag-7-cross-provider-jury": {
    prompt: "Have AIs vote on the Mag 7",
    description:
      "Puts each Magnificent-7 stock before a jury of LLMs from different providers, tallies the verdict, and trades the majority call.",
    nickDescription:
      "I made a strategy that puts each Magnificent-7 stock before a jury of LLMs from different providers, tallies the verdict, and trades the majority call.",
  },
  "mag-7-stock-rotator-daily-paper-trading": {
    prompt: "Rotate the Magnificent 7 daily",
    description:
      "Ranks the Mag 7 every day with an LLM, rotates into the strongest names, and paper-trades the book with a Telegram recap.",
    nickDescription:
      "I made a strategy that ranks the Mag 7 every day with an LLM, rotates into the strongest names, paper-trades the book, and sends you a Telegram recap.",
  },
  "mean-reversion-btc-sol": {
    prompt: "Mean-revert BTC and SOL",
    description:
      "Detects overstretched BTC and SOL moves, confirms the fade with an LLM, rebalances, and emails the mean-reversion report.",
    nickDescription:
      "I made a strategy that detects overstretched BTC and SOL moves, confirms the fade with an LLM, rebalances, and emails you the mean-reversion report.",
  },
  "multi-llm-consensus-trader-paper-trading": {
    prompt: "Trade on multi-LLM consensus",
    description:
      "Asks several LLMs for a call, trades only when they agree, and paper-trades the consensus with performance history on Telegram.",
    nickDescription:
      "I made a strategy that asks several LLMs for a call, trades only when they agree, paper-trades the consensus, and tracks performance history on Telegram.",
  },
  "multi-llm-consensus": {
    prompt: "Get a multi-LLM market call",
    description:
      "Runs the same market data past several LLMs and returns their consensus view — the signal core you can wire into any strategy.",
    nickDescription:
      "I built a consensus engine that runs the same market data past several LLMs and returns their shared view — the signal core you can wire into any strategy.",
  },
  "polymarket-signal-scanner": {
    prompt: "Scan Polymarket for signals",
    description:
      "Turns trending news into Polymarket searches, has an LLM surface the sharpest odds, and pings Telegram with the live signal.",
    nickDescription:
      "I made a strategy that turns trending news into Polymarket searches, has an LLM surface the sharpest odds, and pings you on Telegram with the live signal.",
  },
  "spy-trend-following-strategy": {
    prompt: "Trend-follow the S&P 500",
    description:
      "Reads SPY's trend with indicators + an LLM, takes or skips the trade accordingly, and emails you the daily decision either way.",
    nickDescription:
      "I made a strategy that reads SPY's trend with indicators + an LLM, takes or skips the trade accordingly, and emails you the daily decision either way.",
  },
  "top-movers-scanner-paper-trading": {
    prompt: "Find today's top movers",
    description:
      "Scans the market for the biggest movers, ranks them with an LLM, paper-trades the standouts, and saves a Telegram report.",
    nickDescription:
      "I made a strategy that scans the market for the biggest movers, ranks them with an LLM, paper-trades the standouts, and saves you a Telegram report.",
  },
  "vix-regime-spy-bnd-allocation": {
    prompt: "Allocate by the VIX regime",
    description:
      "Reads the volatility regime from the VIX and rotates SPY vs bonds accordingly, emailing each allocation shift.",
    nickDescription:
      "I made a strategy that reads the volatility regime from the VIX, rotates SPY vs bonds accordingly, and emails you each allocation shift.",
  },
  "weekly-crypto-macro-brief": {
    prompt: "Write my weekly crypto brief",
    description:
      "Gathers price, funding and open-interest across majors, has an LLM synthesize the macro picture, and emails a weekly brief.",
    nickDescription:
      "I made a workflow that gathers price, funding and open-interest across majors, synthesizes the macro picture with an LLM, and emails you a weekly brief.",
  },
};
