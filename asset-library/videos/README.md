# NickAI use-case films

Short narrated product films, each showing one real flow in a Nick chat and ending on the multi-node workflow Nick builds and test-runs. Every film comes in two formats with a matching cover (the cover is also the first 1.6s of the film and its embedded thumbnail).

| Film | 16:9 (1920x1080) | 9:16 (1080x1920) | Length | Story |
|---|---|---|---|---|
| Polymarket | `use-cases/NickAI-Polymarket.mp4` | `use-cases/NickAI-Polymarket-iPhone.mp4` | 43s | Research a market, set up a non-custodial Polymarket wallet, approve a bet, then a "Fed Watch" workflow (Polymarket Data + RSS, LLM, Conditional, Polymarket order, Telegram). |
| Hyperliquid | `use-cases/NickAI-Hyperliquid.mp4` | `use-cases/NickAI-Hyperliquid-iPhone.mp4` | 42s | CoinGlass and Nansen research, a bracketed perp order you approve through a trade-only API wallet, then an hourly "Funding Fade" workflow. |
| Vibe trading | `use-cases/NickAI-Vibe-Trading.mp4` | `use-cases/NickAI-Vibe-Trading-iPhone.mp4` | 35s | "What's moving in crypto today?", a trade on the paper exchange, then a "SOL Momentum" workflow. |
| Kalshi | `use-cases/NickAI-Kalshi.mp4` | `use-cases/NickAI-Kalshi-iPhone.mp4` | 41s | Kalshi odds and history in chat, a demo-account order behind a confirm step, then a "Fed Odds Gap" workflow comparing Kalshi and Polymarket. |
| On-chain (DeFi) | `use-cases/NickAI-DeFi.mp4` | `use-cases/NickAI-DeFi-iPhone.mp4` | 42s | A CoW Swap from a Safe wallet limited to the protocols and tokens you allow, then a "Buy the Dip" workflow (CoW Swap, Aave v3, Telegram). |
| Coinbase DCA | `use-cases/NickAI-Coinbase-DCA.mp4` | `use-cases/NickAI-Coinbase-DCA-iPhone.mp4` | 32s | One sentence becomes a branching weekly buy ($75 below the 30-day average, else $50), confirmed before its first run. |
| Research | `use-cases/NickAI-Research.mp4` | `use-cases/NickAI-Research-iPhone.mp4` | 32s | Nansen, CoinGlass, Santiment and the news in one answer, then an "ETH Whale Watch" workflow that alerts on Telegram. |

Covers: same name with `.cover.png` (1920x1080 or 1080x1920).

## Notes for use

- Copy follows `docs/nickai-content-guide.md`: off-domain CTA `Try it for free now: getnick.ai` on every end card and cover, "paper exchange" instead of the internal name, no outcome claims.
- Prices, fills and odds are illustrative, and every end card says so ("Illustrative product demo. Prices and fills are examples. Trading involves risk.").
- The Polymarket film shows the Polymarket wallet flow, which is behind the `feat-polymarket` flag; check it is live for users before promoting that film. Same for Kalshi.
- Narration: ElevenLabs (voice "Jonathan, Warm Executive Narrator"). Music: a cut of the NickAI pitch score made with ElevenLabs Music.

## Source

The films are code-rendered (HTML compositions rendered frame by frame with Playwright and ffmpeg). Scripts, narration and the render pipeline live in `getnickai/nickai-app` under `marketing/videos/` (`usecases/<slug>.js`, `vo/uc-<slug>.json`, `lib/usecase.js`, see its README). Edit the script there and re-render; do not edit the MP4s.
