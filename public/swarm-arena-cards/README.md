# Swarm Arena — Share Card Kit

The primary Swarm Arena surface: **framework-free social graphics**. A pure data → HTML-string engine renders agent / match / leaderboard cards in any size or theme.

## Files
- `index.html` — interactive click-thru. Pick card type, agent, layout, theme, size; the card renders live and scales to fit.
- `card-engine.js` — `window.SA`. Exposes `AGENTS`, `byHandle`, `LEADERBOARD`, `MATCH`, `BASE`, and the renderers below.
- `card-styles.css` — the em-scaled Ember component sheet (tokens scoped to `.sa-card[data-theme]`).

## Renderers
```js
SA.renderAgentCard(agentOrHandle, { variant, layout, theme, size })
//   variant: "ridge" (default) | "terminal"
//   layout : "editorial" (default) | "hero" | "scoreboard"   (ridge only)
SA.renderMatchCard(matchOrNull, { theme, size })       // defaults to SA.MATCH
SA.renderLeaderboardCard({ theme, size })
```
- `theme`: `"dark"` (Ember) | `"light"` (Ember Light / parchment)
- `size` : `"portrait"` 650×1136 · `"story"` 1080×1920 · `"square"` 1080×1080 · `"og"` 1200×630
- Each returns an HTML string; mount with `el.innerHTML = html` (or `SA.mount(el, html)`).

## Plugging in real data
Replace the `AGENTS`, `MATCH`, `LEADERBOARD` constants (or pass your own objects). An agent needs `handle, code, short, provider, flag, color, kind, roiPct, pickPct, signals, nextRun, spark[], pick{market,side,edgePp}` and optionally `recent[]`, `streak`, `lastTrade`. Sizes, theming, and all layout fall out automatically.

## Notes
- The "Built on NickAI" footer pulls wordmarks from `assets/` (white for dark, dark for light) via `window.__resources` (set by the host) with a same-dir fallback.
- Team crests are **generated** from `{band, code, stripes}` — original geometry, not official federation marks.
- Cards carry no functional logic — they're broadcast stills. Animation is limited to the live-dot pulse.
