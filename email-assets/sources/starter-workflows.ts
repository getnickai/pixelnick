/**
 * Starter workflow definitions.
 *
 * Three pre-built workflows seeded into every new user's org at signup
 * so the library is never empty. All created in paused (isActive=false)
 * state — the user activates when ready.
 *
 * Hardcoded here (no template-ID dependency) so definitions ship with
 * the code and update on deploy.
 *
 * IMPORTANT: these definitions are extracted from real, tested workflows
 * built and validated in production via the UI. Do not hand-edit unless
 * you also re-test in the editor — handle names, edge labels, and field
 * paths must match the live React Flow components and node executors.
 */

import type { WorkflowDefinition } from "@/lib/schemas/workflow";

// ---------------------------------------------------------------------------
// Smart Price Alert
// Source workflow ID: wfl_9ghad97k08bt (extracted from prod, sanitized)
// ---------------------------------------------------------------------------

export const SMART_PRICE_ALERT_WORKFLOW: WorkflowDefinition = {
	id: "",
	name: "Smart Price Alert",
	edges: [
		{
			id: "edg_qppep30qxzc7",
			data: {
				label: "schedule",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_efn8zoca6z35",
			target: "nde_0h495mxaqnt5",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_hudqu91f323j",
			data: {
				label: "price_data",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_0h495mxaqnt5",
			target: "nde_8e95v5j2muzm",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_jzrolzxul53c",
			data: {
				label: "alert_check",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_8e95v5j2muzm",
			target: "nde_7n81r5tfkhph",
			sourceHandle: "output",
			targetHandle: "input",
		},
		{
			id: "edg_omvziwbwpl60",
			data: {
				label: "cond_alert",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_7n81r5tfkhph",
			target: "nde_qp7ls0wtfot6",
			sourceHandle: "true",
			targetHandle: "trigger",
		},
		{
			id: "edg_iaiexagab4l9",
			data: {
				label: "storage_read",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_qp7ls0wtfot6",
			target: "nde_g442rm7vc3oa",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_c0oki8gx8juh",
			data: {
				label: "cooldown_check",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_g442rm7vc3oa",
			target: "nde_gswi3xcurkiu",
			sourceHandle: "output",
			targetHandle: "input",
		},
		{
			id: "edg_y3fzgsyv10ub",
			data: {
				label: "cond_cooldown",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_gswi3xcurkiu",
			target: "nde_urj5mpezgvnl",
			sourceHandle: "true",
			targetHandle: "trigger",
		},
		{
			id: "edg_x0cmji9wgvw6",
			data: {
				label: "telegram_data",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_urj5mpezgvnl",
			target: "nde_4lpm48mzeqa2",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_aqn8qgo9m2my",
			data: {
				label: "alert_payload",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_gswi3xcurkiu",
			target: "nde_4lpm48mzeqa2",
			sourceHandle: "true",
			targetHandle: "input",
		},
		{
			id: "edg_r3m5smt2a3lu",
			data: {
				label: "cooldown_fn",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_g442rm7vc3oa",
			target: "nde_urj5mpezgvnl",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_ifky0i5427ci",
			data: {
				label: "alert_data",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_8e95v5j2muzm",
			target: "nde_4lpm48mzeqa2",
			sourceHandle: "output",
			targetHandle: "input",
		},
	],
	nodes: [
		{
			id: "nde_efn8zoca6z35",
			data: {
				label: "Every Hour",
				config: {
					schedule: {
						type: "interval",
						unit: "hours",
						value: 1,
					},
					triggerType: "schedule",
				},
			},
			type: "start",
			position: {
				x: 100,
				y: 150,
			},
		},
		{
			id: "nde_0h495mxaqnt5",
			data: {
				label: "BTC / ETH / SOL Prices",
				config: {
					symbols: ["BTC/USD", "ETH/USD", "SOL/USD"],
					exchange: "coingecko",
					interval: "1h",
					lookback: 48,
					provider: "coingecko",
					baseCurrency: "USD",
					includeIndicators: true,
				},
			},
			type: "price-data",
			position: {
				x: 450,
				y: 150,
			},
		},
		{
			id: "nde_8e95v5j2muzm",
			data: {
				label: "Detect Alert Conditions",
				config: {
					code: "def main(inputs, workflow_variables=None, global_variables=None):\n    prices = inputs['price_data']['data']['prices']\n\n    # Build a lookup by symbol\n    lookup = {}\n    for p in prices:\n        lookup[p['symbol']] = p\n\n    btc = lookup.get('BTC/USD', {})\n    eth = lookup.get('ETH/USD', {})\n    sol = lookup.get('SOL/USD', {})\n\n    btc_change = btc.get('changePercent24h', 0) or 0\n    eth_change = eth.get('changePercent24h', 0) or 0\n    sol_change = sol.get('changePercent24h', 0) or 0\n\n    # RSI is already pre-computed by the price-data node — just read it directly\n    btc_rsi = (btc.get('indicators') or {}).get('rsi', None)\n    eth_rsi = (eth.get('indicators') or {}).get('rsi', None)\n    sol_rsi = (sol.get('indicators') or {}).get('rsi', None)\n\n    triggers = []\n\n    # --- 1. Big price moves ---\n    for sym, chg in [('BTC', btc_change), ('ETH', eth_change), ('SOL', sol_change)]:\n        abs_chg = abs(chg)\n        if abs_chg >= 5:\n            severity = 'high' if abs_chg >= 10 else 'medium'\n            direction = 'pump' if chg > 0 else 'dump'\n            context = 'momentum building' if direction == 'pump' else 'capitulation zone'\n            triggers.append({\n                'type': direction,\n                'asset': sym,\n                'label': sym + ' ' + direction,\n                'severity': severity,\n                'value': round(chg, 2),\n                'context': context\n            })\n\n    # --- 2. RSI extremes ---\n    rsi_assets = [('BTC', btc_rsi), ('ETH', eth_rsi), ('SOL', sol_rsi)]\n    for sym, rsi in rsi_assets:\n        if rsi is None:\n            continue\n        if rsi <= 30:\n            severity = 'high' if rsi <= 25 else 'medium'\n            triggers.append({\n                'type': 'oversold',\n                'asset': sym,\n                'label': sym + ' oversold',\n                'severity': severity,\n                'value': round(rsi, 1),\n                'context': 'potential reversal'\n            })\n        elif rsi >= 70:\n            severity = 'high' if rsi >= 75 else 'medium'\n            triggers.append({\n                'type': 'overbought',\n                'asset': sym,\n                'label': sym + ' overbought',\n                'severity': severity,\n                'value': round(rsi, 1),\n                'context': 'potential top'\n            })\n\n    # --- 3. BTC/ETH divergence ---\n    spread = abs(btc_change - eth_change)\n    opposite_dirs = (btc_change > 0 and eth_change < 0) or (btc_change < 0 and eth_change > 0)\n    if opposite_dirs and spread >= 3:\n        severity = 'high' if spread >= 5 else 'medium'\n        triggers.append({\n            'type': 'divergence',\n            'asset': 'BTC/ETH',\n            'label': 'BTC/ETH divergence',\n            'severity': severity,\n            'value': round(spread, 2),\n            'context': 'rotation imminent'\n        })\n\n    # --- Pick top priority (high > medium, then by abs value) ---\n    top_priority = None\n    if len(triggers) > 0:\n        def sort_key(t):\n            sev_score = 0\n            if t['severity'] == 'high':\n                sev_score = 1\n            return (sev_score, abs(t['value']))\n        sorted_triggers = sorted(triggers, key=sort_key, reverse=True)\n        top_priority = sorted_triggers[0]\n\n    has_alert = len(triggers) > 0\n\n    return {\n        'hasAlert': has_alert,\n        'triggers': triggers,\n        'topPriority': top_priority,\n        'prices': {\n            'BTC': {\n                'current': round(btc.get('current', 0), 2),\n                'change24h': round(btc_change, 2),\n                'rsi': round(btc_rsi, 1) if btc_rsi is not None else None\n            },\n            'ETH': {\n                'current': round(eth.get('current', 0), 2),\n                'change24h': round(eth_change, 2),\n                'rsi': round(eth_rsi, 1) if eth_rsi is not None else None\n            },\n            'SOL': {\n                'current': round(sol.get('current', 0), 2),\n                'change24h': round(sol_change, 2),\n                'rsi': round(sol_rsi, 1) if sol_rsi is not None else None\n            }\n        }\n    }\n",
					timeout: 30,
					language: "python",
					description: "Detect big moves, RSI extremes, and BTC/ETH divergence",
				},
			},
			type: "function",
			position: {
				x: 800,
				y: 150,
			},
		},
		{
			id: "nde_7n81r5tfkhph",
			data: {
				label: "Has Alert?",
				config: {
					logic: "and",
					conditions: [
						{
							field: "alert_check.hasAlert",
							value: "true",
							operator: "equals",
						},
					],
				},
			},
			type: "conditional",
			position: {
				x: 1150,
				y: 150,
			},
		},
		{
			id: "nde_qp7ls0wtfot6",
			data: {
				label: "Read Last Alert Time",
				config: {
					action: "retrieve",
					storageKey: "last_alert_at",
				},
			},
			type: "storage",
			position: {
				x: 1500,
				y: 150,
			},
		},
		{
			id: "nde_g442rm7vc3oa",
			data: {
				label: "Check Cooldown",
				config: {
					code: "def main(inputs, workflow_variables=None, global_variables=None):\n    import time\n    storage_data = inputs.get('storage_read', {})\n    last_alert_at = 0\n    stored = storage_data.get('data', None)\n    if stored is not None:\n        try:\n            last_alert_at = int(stored)\n        except Exception:\n            last_alert_at = 0\n    now = int(time.time())\n    elapsed = now - last_alert_at\n    cooldown_passed = elapsed > 14400\n    return {\n        'cooldownPassed': cooldown_passed,\n        'elapsed': elapsed,\n        'now': now,\n        'lastAlertAt': last_alert_at,\n    }\n",
					timeout: 30,
					language: "python",
					description: "Check if 4 hours have passed since last alert",
				},
			},
			type: "function",
			position: {
				x: 1850,
				y: 150,
			},
		},
		{
			id: "nde_gswi3xcurkiu",
			data: {
				label: "Cooldown Passed?",
				config: {
					logic: "and",
					conditions: [
						{
							field: "cooldown_check.cooldownPassed",
							value: "true",
							operator: "equals",
						},
					],
				},
			},
			type: "conditional",
			position: {
				x: 2200,
				y: 150,
			},
		},
		{
			id: "nde_urj5mpezgvnl",
			data: {
				label: "Write Last Alert Time",
				config: {
					action: "store",
					storageKey: "last_alert_at",
					uploadedFileContent: "{cond_cooldown.cooldown_check.now}",
				},
			},
			type: "storage",
			position: {
				x: 2550,
				y: 150,
			},
		},
		{
			id: "nde_4lpm48mzeqa2",
			data: {
				label: "Send Alert",
				config: {
					text: "🚨 *Smart Price Alert*\n━━━━━━━━━━━━━━━━━━━━\n\n*Trigger:* {alert_data.topPriority.label}\n*Type:* {alert_data.topPriority.type}\n*Asset:* {alert_data.topPriority.asset}\n*Severity:* {alert_data.topPriority.severity}\n\n━━━━━━━━━━━━━━━━━━━━\n📊 *Price Snapshot*\n\n🟠 *BTC* — ${alert_data.prices.BTC.current} `({alert_data.prices.BTC.change24h}% 24h)`\n🔵 *ETH* — ${alert_data.prices.ETH.current} `({alert_data.prices.ETH.change24h}% 24h)`\n🟣 *SOL* — ${alert_data.prices.SOL.current} `({alert_data.prices.SOL.change24h}% 24h)`\n\n━━━━━━━━━━━━━━━━━━━━\n💡 *{alert_data.topPriority.context}*\n\n_Next alert in 4 hours minimum._",
					chatId: "",
					parseMode: "Markdown",
					credentialId: "",
					disableNotification: false,
					disableWebPagePreview: true,
				},
			},
			type: "telegram-notification",
			position: {
				x: 2900,
				y: 150,
			},
		},
	],
	version: 1,
	variables: {},
} as WorkflowDefinition;

// ---------------------------------------------------------------------------
// Morning Edge Brief
// Source workflow ID: wfl_igzpzppqv92g (extracted from prod, sanitized)
// ---------------------------------------------------------------------------

export const MORNING_EDGE_BRIEF_WORKFLOW: WorkflowDefinition = {
	id: "",
	name: "Morning Edge Brief",
	edges: [
		{
			id: "edg_scmmlnvely1q",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_0hds4u524lml",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_7rd7ukuwwqrm",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_1cdbhjl4wmdy",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_r4ze0j7nkolw",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_d1di6426efuh",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_pzs2a91gtgkj",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_7u5qlxy7ndgp",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_m66m7guyncb7",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_7qo89rv099wv",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_le0ifopblhbx",
			data: {
				label: "price_data",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_0hds4u524lml",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_t9xtohrz0gan",
			data: {
				label: "funding_rates",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_1cdbhjl4wmdy",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_fxie5g3cfymd",
			data: {
				label: "fear_greed",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_d1di6426efuh",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_q8amx8bbfmk2",
			data: {
				label: "defillama",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_7u5qlxy7ndgp",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_g0ou5evmbpdj",
			data: {
				label: "rss_news",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_yt9nmthybndb",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_1jamtwktepiv",
			data: {
				label: "polymarket",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_7qo89rv099wv",
			target: "nde_0nllhqxvb5l8",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_rqcu0oi7q153",
			data: {
				label: "brief",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_0nllhqxvb5l8",
			target: "nde_ssci140wmvhy",
			sourceHandle: "output",
			targetHandle: "input",
		},
		{
			id: "edg_eau567mwol3e",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_quazcwb5o8p2",
			target: "nde_yt9nmthybndb",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
	],
	nodes: [
		{
			id: "nde_quazcwb5o8p2",
			data: {
				label: "Daily 8AM Trigger",
				config: {
					schedule: {
						time: "08:00",
						type: "daily",
					},
					triggerType: "schedule",
				},
			},
			type: "start",
			position: {
				x: 100,
				y: 330,
			},
		},
		{
			id: "nde_0hds4u524lml",
			data: {
				label: "Crypto Prices",
				config: {
					symbols: ["BTC/USD", "ETH/USD", "SOL/USD"],
					exchange: "coingecko",
					interval: "1h",
					lookback: 24,
					provider: "coingecko",
					baseCurrency: "USD",
					includeIndicators: true,
				},
			},
			type: "price-data",
			position: {
				x: 450,
				y: 60,
			},
		},
		{
			id: "nde_1cdbhjl4wmdy",
			data: {
				label: "Funding Rates",
				config: {
					limit: 24,
					symbol: "BTCUSDT",
					dataType: "fundingRates",
					exchange: "all",
					timeframe: "1h",
				},
			},
			type: "coinglass",
			position: {
				x: 450,
				y: 210,
			},
		},
		{
			id: "nde_d1di6426efuh",
			data: {
				label: "Fear & Greed Index",
				config: {
					limit: 1,
					symbol: "BTC",
					dataType: "fearGreedIndex",
					exchange: "all",
					timeframe: "1d",
				},
			},
			type: "coinglass",
			position: {
				x: 450,
				y: 360,
			},
		},
		{
			id: "nde_7u5qlxy7ndgp",
			data: {
				label: "Chain TVL",
				config: {
					chain: "Ethereum",
					limit: 100,
					queryType: "chainTvl",
					timeRange: "7d",
				},
			},
			type: "defillama",
			position: {
				x: 450,
				y: 510,
			},
		},
		{
			id: "nde_yt9nmthybndb",
			data: {
				label: "CoinDesk RSS",
				config: {
					feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
					maxItems: 5,
				},
			},
			type: "rss-feed",
			position: {
				x: 450,
				y: 660,
			},
		},
		{
			id: "nde_7qo89rv099wv",
			data: {
				label: "Polymarket Signals",
				config: {
					mode: "browse",
					limit: 20,
				},
			},
			type: "polymarket-data",
			position: {
				x: 450,
				y: 810,
			},
		},
		{
			id: "nde_0nllhqxvb5l8",
			data: {
				label: "Morning Brief LLM",
				config: {
					model: "claude-haiku-4.5",
					timeout: 60,
					provider: "anthropic",
					maxTokens: 4000,
					userPrompt:
						"Synthesize today's morning briefing using these inputs:\n\n**Prices:**\n{price_data}\n\n**Derivatives (Funding Rates):**\n{funding_rates}\n\n**Derivatives (Fear & Greed):**\n{fear_greed}\n\n**On-chain:**\n{defillama}\n\n**News:**\n{rss_news}\n\n**Prediction markets:**\n{polymarket}",
					description: "",
					temperature: 0.4,
					systemPrompt:
						"You are a sharp crypto trading desk analyst writing a morning briefing for a sophisticated trader. Output must be 150 words MAX, structured as 6 sections with Markdown bold labels: 1) **Price action** (1 sentence with BTC/ETH/SOL movement), 2) **Derivatives & sentiment** (1 sentence with funding rate direction + fear/greed reading), 3) **On-chain flow** (1 sentence with TVL movements across top chains), 4) **Headline impact** (1 sentence with the most market-relevant news), 5) **Polymarket signal** (1 sentence on what speculators are pricing), 6) **Edge of the day** (1 sentence — what to watch today, actionable). No disclaimers, no fluff, no hedging. Direct, sharp, professional desk DM tone.",
				},
			},
			type: "llm",
			position: {
				x: 900,
				y: 330,
			},
		},
		{
			id: "nde_ssci140wmvhy",
			data: {
				label: "Morning Brief Telegram",
				config: {
					text: "☀️ *Morning Edge Brief*\n\n{brief.output}",
					chatId: "",
					parseMode: "Markdown",
					credentialId: "",
					disableNotification: false,
					disableWebPagePreview: true,
				},
			},
			type: "telegram-notification",
			position: {
				x: 1250,
				y: 330,
			},
		},
	],
	version: 1,
	variables: {},
} as WorkflowDefinition;

// ---------------------------------------------------------------------------
// Disciplined BTC Paper Trader
// Source workflow ID: wfl_91ltt7uq4rm0 (extracted from prod, sanitized)
// ---------------------------------------------------------------------------

export const PAPER_TRADER_WORKFLOW: WorkflowDefinition = {
	id: "",
	name: "Disciplined BTC Paper Trader",
	edges: [
		{
			id: "edg_b2fweuwt8utk",
			data: {
				label: "trigger",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_tq1j8l2xicu1",
			target: "nde_arksflyj3q45",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_5gpw26hvi2h6",
			data: {
				label: "trigger_storage",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_tq1j8l2xicu1",
			target: "nde_uycbnjv3d0p8",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_ww4rw4x30zmn",
			data: {
				label: "btc_price",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_arksflyj3q45",
			target: "nde_e3juw9fl8iy3",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_xyxnydrf1p8z",
			data: {
				label: "last_trade",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_uycbnjv3d0p8",
			target: "nde_e3juw9fl8iy3",
			sourceHandle: "data",
			targetHandle: "input",
		},
		{
			id: "edg_2osd5ebtw0t7",
			data: {
				label: "signal_eval",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_e3juw9fl8iy3",
			target: "nde_oeor31jpaa4h",
			sourceHandle: "output",
			targetHandle: "input",
		},
		{
			id: "edg_kjrfj4spk5ez",
			data: {
				label: "trade_gate",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_oeor31jpaa4h",
			target: "nde_t3gkpznqk0yy",
			sourceHandle: "true",
			targetHandle: "input",
		},
		{
			id: "edg_ezdusc841lyn",
			data: {
				label: "trade_gate",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_oeor31jpaa4h",
			target: "nde_p02e9eni8g5f",
			sourceHandle: "false",
			targetHandle: "input",
		},
		{
			id: "edg_33cypt3r9yd1",
			data: {
				label: "long_short",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_t3gkpznqk0yy",
			target: "nde_lrvsx4g5kahr",
			sourceHandle: "true",
			targetHandle: "trigger",
		},
		{
			id: "edg_dylxz1ccj63a",
			data: {
				label: "long_short",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_t3gkpznqk0yy",
			target: "nde_89uulmoam4oe",
			sourceHandle: "false",
			targetHandle: "trigger",
		},
		{
			id: "edg_tc1wlf2nzjxk",
			data: {
				label: "buy_order",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_lrvsx4g5kahr",
			target: "nde_ezehbqlm6zo6",
			sourceHandle: "result",
			targetHandle: "input",
		},
		{
			id: "edg_93xpwgxcjnei",
			data: {
				label: "sell_order",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_89uulmoam4oe",
			target: "nde_ezehbqlm6zo6",
			sourceHandle: "result",
			targetHandle: "input",
		},
		{
			id: "edg_m8uzwr33ribm",
			data: {
				label: "merged_order",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_ezehbqlm6zo6",
			target: "nde_s3ip2d9448gd",
			sourceHandle: "output",
			targetHandle: "trigger",
		},
		{
			id: "edg_d4jkfnvqsrxt",
			data: {
				label: "alert",
				animated: false,
				highlighted: false,
				dashAnimation: false,
				connectionType: null,
			},
			source: "nde_ezehbqlm6zo6",
			target: "nde_6z3c038x73hm",
			sourceHandle: "output",
			targetHandle: "input",
		},
	],
	nodes: [
		{
			id: "nde_tq1j8l2xicu1",
			data: {
				label: "Every 6 Hours",
				config: {
					schedule: {
						type: "interval",
						unit: "hours",
						value: 6,
					},
					triggerType: "schedule",
				},
			},
			type: "start",
			position: {
				x: 40,
				y: 240,
			},
		},
		{
			id: "nde_arksflyj3q45",
			data: {
				label: "BTC Price + Indicators",
				config: {
					symbols: ["BTC/USD"],
					exchange: "coingecko",
					interval: "4h",
					lookback: 50,
					provider: "coingecko",
					baseCurrency: "USD",
					includeIndicators: true,
				},
			},
			type: "price-data",
			position: {
				x: 510,
				y: 140,
			},
		},
		{
			id: "nde_uycbnjv3d0p8",
			data: {
				label: "Load Last Trade Time",
				config: {
					action: "retrieve",
					storageKey: "btc_mean_reversion_last_trade",
				},
			},
			type: "storage",
			position: {
				x: 510,
				y: 340,
			},
		},
		{
			id: "nde_e3juw9fl8iy3",
			data: {
				label: "Evaluate Setup & Risk",
				config: {
					code: 'def main(inputs, workflow_variables=None, global_variables=None):\n    import math\n\n    # --- Pull price data ---\n    price_node = inputs.get(\'btc_price\', {})\n    prices = price_node.get(\'data\', {}).get(\'prices\', [{}])[0]\n    current_price = prices.get(\'current\', 0)\n    indicators = prices.get(\'indicators\', {})\n\n    # --- Extract RSI (scalar float OR list) ---\n    rsi_raw = indicators.get(\'rsi\', None)\n    if rsi_raw is None:\n        return {"should_trade": "false", "reason": "RSI unavailable", "signal": "none", "qty": 0}\n    if isinstance(rsi_raw, list):\n        rsi = float(rsi_raw[-1]) if len(rsi_raw) > 0 else None\n    else:\n        rsi = float(rsi_raw)\n    if rsi is None:\n        return {"should_trade": "false", "reason": "RSI empty", "signal": "none", "qty": 0}\n\n    # --- Extract EMA20 (scalar float OR list) ---\n    ema20_raw = indicators.get(\'ema20\', None)\n    if ema20_raw is None:\n        return {"should_trade": "false", "reason": "EMA20 unavailable", "signal": "none", "qty": 0}\n    if isinstance(ema20_raw, list):\n        ema20 = float(ema20_raw[-1]) if len(ema20_raw) > 0 else None\n    else:\n        ema20 = float(ema20_raw)\n    if ema20 is None:\n        return {"should_trade": "false", "reason": "EMA20 empty", "signal": "none", "qty": 0}\n\n    # --- EMA deviation % ---\n    ema_deviation_pct = abs(current_price - ema20) / ema20 * 100.0\n\n    # --- 24h cooldown check ---\n    last_trade_node = inputs.get(\'last_trade\', {})\n    last_trade_data = last_trade_node.get(\'data\', None)\n    hours_since_last = 999.0\n    if last_trade_data is not None:\n        last_ts_str = None\n        if isinstance(last_trade_data, dict):\n            last_ts_str = last_trade_data.get(\'traded_at\', None)\n        elif isinstance(last_trade_data, str):\n            last_ts_str = last_trade_data\n        if last_ts_str is not None:\n            try:\n                # Parse ISO timestamp manually (RestrictedPython safe)\n                # Format: 2026-05-06T09:06:57.105Z\n                ts_clean = last_ts_str.replace(\'Z\', \'\').replace(\'T\', \' \')\n                parts = ts_clean.split(\' \')\n                date_parts = parts[0].split(\'-\')\n                time_parts = parts[1].split(\':\') if len(parts) > 1 else [\'0\',\'0\',\'0\']\n                yr = int(date_parts[0])\n                mo = int(date_parts[1])\n                dy = int(date_parts[2])\n                hr = int(time_parts[0])\n                mn = int(time_parts[1])\n                sc = int(float(time_parts[2])) if len(time_parts) > 2 else 0\n                # Days since epoch approximation (good enough for 24h check)\n                # Use a simple epoch offset calculation\n                days_in_month = [0,31,28,31,30,31,30,31,31,30,31,30,31]\n                total_days = (yr - 1970) * 365 + (yr - 1969) // 4\n                for m in range(1, mo):\n                    total_days = total_days + days_in_month[m]\n                total_days = total_days + dy - 1\n                last_epoch_hours = total_days * 24 + hr + mn / 60.0 + sc / 3600.0\n\n                # Current time from triggeredAt (passed via btc_price trigger chain — use a fixed ref)\n                # We\'ll use the candles last timestamp as a proxy for "now"\n                candles = prices.get(\'candles\', [])\n                if len(candles) > 0:\n                    now_str = candles[-1].get(\'timestamp\', \'\')\n                    now_clean = now_str.replace(\'Z\', \'\').replace(\'T\', \' \')\n                    now_parts = now_clean.split(\' \')\n                    now_date = now_parts[0].split(\'-\')\n                    now_time = now_parts[1].split(\':\') if len(now_parts) > 1 else [\'0\',\'0\',\'0\']\n                    nyr = int(now_date[0])\n                    nmo = int(now_date[1])\n                    ndy = int(now_date[2])\n                    nhr = int(now_time[0])\n                    nmn = int(now_time[1])\n                    nsc = int(float(now_time[2])) if len(now_time) > 2 else 0\n                    now_total_days = (nyr - 1970) * 365 + (nyr - 1969) // 4\n                    for m in range(1, nmo):\n                        now_total_days = now_total_days + days_in_month[m]\n                    now_total_days = now_total_days + ndy - 1\n                    now_epoch_hours = now_total_days * 24 + nhr + nmn / 60.0 + nsc / 3600.0\n                    hours_since_last = now_epoch_hours - last_epoch_hours\n            except Exception:\n                hours_since_last = 999.0\n\n    cooldown_ok = hours_since_last >= 24.0\n\n    # --- Signal logic ---\n    long_setup = rsi <= 30 and ema_deviation_pct >= 3.0 and current_price < ema20\n    short_setup = rsi >= 70 and ema_deviation_pct >= 3.0 and current_price > ema20\n\n    if not cooldown_ok:\n        reason = "24h cooldown active (" + str(round(hours_since_last, 1)) + "h since last trade)"\n        return {\n            "should_trade": "false",\n            "reason": reason,\n            "signal": "none",\n            "qty": 0,\n            "rsi": round(rsi, 2),\n            "ema20": round(ema20, 2),\n            "current_price": round(current_price, 2),\n            "ema_deviation_pct": round(ema_deviation_pct, 2)\n        }\n\n    if not long_setup and not short_setup:\n        reason = ("RSI=" + str(round(rsi, 1)) +\n                  " EMAdev=" + str(round(ema_deviation_pct, 2)) + "%" +\n                  " — no extreme setup")\n        return {\n            "should_trade": "false",\n            "reason": reason,\n            "signal": "none",\n            "qty": 0,\n            "rsi": round(rsi, 2),\n            "ema20": round(ema20, 2),\n            "current_price": round(current_price, 2),\n            "ema_deviation_pct": round(ema_deviation_pct, 2)\n        }\n\n    # --- Position sizing: 5% of $10,000 paper portfolio ---\n    portfolio_value = 10000.0\n    risk_pct = 0.05\n    trade_usd = portfolio_value * risk_pct\n    qty = round(trade_usd / current_price, 6)\n\n    signal = "long" if long_setup else "short"\n    reason = ("RSI=" + str(round(rsi, 1)) +\n              " EMAdev=" + str(round(ema_deviation_pct, 2)) + "%" +\n              " signal=" + signal)\n\n    return {\n        "should_trade": "true",\n        "signal": signal,\n        "qty": qty,\n        "trade_usd": round(trade_usd, 2),\n        "current_price": round(current_price, 2),\n        "rsi": round(rsi, 2),\n        "ema20": round(ema20, 2),\n        "ema_deviation_pct": round(ema_deviation_pct, 2),\n        "reason": reason\n    }\n',
					timeout: 30,
					language: "python",
					description:
						"Evaluates RSI, EMA20 deviation, and 24h cooldown to determine trade signal and position sizing",
				},
			},
			type: "function",
			position: {
				x: 980,
				y: 240,
			},
		},
		{
			id: "nde_oeor31jpaa4h",
			data: {
				label: "Should Trade?",
				config: {
					logic: "and",
					conditions: [
						{
							field: "signal_eval.should_trade",
							value: "true",
							operator: "equals",
						},
					],
				},
			},
			type: "conditional",
			position: {
				x: 1450,
				y: 240,
			},
		},
		{
			id: "nde_t3gkpznqk0yy",
			data: {
				label: "Long or Short?",
				config: {
					logic: "and",
					conditions: [
						{
							field: "trade_gate.signal_eval.signal",
							value: "long",
							operator: "equals",
						},
					],
				},
			},
			type: "conditional",
			position: {
				x: 1920,
				y: 140,
			},
		},
		{
			id: "nde_lrvsx4g5kahr",
			data: {
				label: "Paper Buy BTC",
				config: {
					side: "buy",
					amount: "{long_short.trade_gate.signal_eval.qty}",
					symbol: "BTCUSDT",
					exchange: "papernick2",
					orderType: "market",
					credentialId: "",
				},
			},
			type: "exchange",
			position: {
				x: 2390,
				y: 40,
			},
		},
		{
			id: "nde_89uulmoam4oe",
			data: {
				label: "Paper Sell BTC",
				config: {
					side: "sell",
					amount: "{long_short.trade_gate.signal_eval.qty}",
					symbol: "BTCUSDT",
					exchange: "papernick2",
					orderType: "market",
					credentialId: "",
				},
			},
			type: "exchange",
			position: {
				x: 2390,
				y: 240,
			},
		},
		{
			id: "nde_ezehbqlm6zo6",
			data: {
				label: "Merge Order Result",
				config: {
					code: "def main(inputs, workflow_variables=None, global_variables=None):\n    # One of these will be present depending on which branch fired\n    buy_result = inputs.get('buy_order', None)\n    sell_result = inputs.get('sell_order', None)\n\n    if buy_result is not None:\n        order = buy_result.get('order', {})\n        direction = 'LONG'\n        side_label = 'BUY'\n        # Signal context: buy_order -> long_short (conditional) -> trade_gate (conditional) -> signal_eval (function)\n        long_short_ctx = buy_result.get('long_short', {})\n        trade_gate_ctx = long_short_ctx.get('trade_gate', {})\n        signal_eval = trade_gate_ctx.get('signal_eval', {})\n    else:\n        order = sell_result.get('order', {}) if sell_result else {}\n        direction = 'SHORT'\n        side_label = 'SELL'\n        long_short_ctx = sell_result.get('long_short', {}) if sell_result else {}\n        trade_gate_ctx = long_short_ctx.get('trade_gate', {})\n        signal_eval = trade_gate_ctx.get('signal_eval', {})\n\n    order_price = order.get('price', 0)\n    order_amount = order.get('amount', 0)\n    order_id = order.get('id', 'N/A')\n    order_status = order.get('status', 'unknown')\n    order_symbol = order.get('symbol', 'BTC/USD')\n\n    rsi = signal_eval.get('rsi', 0)\n    ema20 = signal_eval.get('ema20', 0)\n    qty = signal_eval.get('qty', order_amount)\n    trade_usd = signal_eval.get('trade_usd', 0)\n    reason = signal_eval.get('reason', '')\n    ema_dev = signal_eval.get('ema_deviation_pct', 0)\n\n    # Stop-loss: 3% adverse from entry\n    stop_loss_pct = 3.0\n    if direction == 'LONG':\n        stop_loss_price = round(order_price * (1 - stop_loss_pct / 100.0), 2)\n    else:\n        stop_loss_price = round(order_price * (1 + stop_loss_pct / 100.0), 2)\n\n    # Timestamp for storage cooldown\n    traded_at = order.get('createdAt', '')\n\n    return {\n        \"direction\": direction,\n        \"side_label\": side_label,\n        \"order_price\": round(order_price, 2),\n        \"order_id\": order_id,\n        \"order_status\": order_status,\n        \"order_symbol\": order_symbol,\n        \"qty\": qty,\n        \"trade_usd\": round(trade_usd, 2),\n        \"rsi\": rsi,\n        \"ema20\": ema20,\n        \"ema_deviation_pct\": ema_dev,\n        \"reason\": reason,\n        \"stop_loss_price\": stop_loss_price,\n        \"stop_loss_pct\": stop_loss_pct,\n        \"traded_at\": traded_at,\n        \"trade_data\": {\n            \"traded_at\": traded_at,\n            \"direction\": direction,\n            \"price\": round(order_price, 2),\n            \"qty\": qty,\n            \"order_id\": order_id\n        }\n    }\n",
					timeout: 30,
					language: "python",
					description:
						"Merges buy or sell order result with signal context for downstream notification",
				},
			},
			type: "function",
			position: {
				x: 2860,
				y: 140,
			},
		},
		{
			id: "nde_s3ip2d9448gd",
			data: {
				label: "Save Last Trade Time",
				config: {
					action: "store",
					storageKey: "btc_mean_reversion_last_trade",
				},
			},
			type: "storage",
			position: {
				x: 3330,
				y: 40,
			},
		},
		{
			id: "nde_p02e9eni8g5f",
			data: {
				label: "No Setup Telegram",
				config: {
					text: "🔵 *BTC Mean-Reversion Scan — No Trade*\n\n🕒 Scanned every 6 hours. No qualifying setup found.\n\n📈 *Current BTC Price:* ${trade_gate.signal_eval.current_price}\n📉 *RSI:* {trade_gate.signal_eval.rsi}\n📊 *EMA20:* ${trade_gate.signal_eval.ema20}\n\n🔍 *Reason:* {trade_gate.signal_eval.reason}\n\n_Next scan in 6 hours._",
					chatId: "",
					parseMode: "Markdown",
					credentialId: "",
					disableNotification: false,
					disableWebPagePreview: false,
				},
			},
			type: "telegram-notification",
			position: {
				x: 1920,
				y: 340,
			},
		},
		{
			id: "nde_6z3c038x73hm",
			data: {
				label: "Trade Alert Telegram",
				config: {
					text: "🤖 *BTC Mean-Reversion Trade Executed*\n\n📊 *Signal:* {alert.direction} ({alert.side_label})\n💰 *Entry Price:* ${alert.order_price}\n📦 *Quantity:* {alert.qty} BTC (~${alert.trade_usd})\n\n📉 *RSI:* {alert.rsi}\n📈 *EMA20:* ${alert.ema20}\n🔍 *Reason:* {alert.reason}\n\n🛑 *Stop-Loss:* ${alert.stop_loss_price} ({alert.stop_loss_pct}% adverse)\n_Monitor manually and close if price hits stop-loss._\n\n🆔 *Order ID:* {alert.order_id}\n✅ *Status:* {alert.order_status}",
					chatId: "",
					parseMode: "Markdown",
					credentialId: "",
					disableNotification: false,
					disableWebPagePreview: false,
				},
			},
			type: "telegram-notification",
			position: {
				x: 3330,
				y: 240,
			},
		},
	],
	version: 1,
	variables: {},
} as WorkflowDefinition;

/** All starter workflows, in display order. */
export const STARTER_WORKFLOWS = [
	{ name: "Smart Price Alert", definition: SMART_PRICE_ALERT_WORKFLOW },
	{ name: "Morning Edge Brief", definition: MORNING_EDGE_BRIEF_WORKFLOW },
	{ name: "Disciplined BTC Paper Trader", definition: PAPER_TRADER_WORKFLOW },
] as const;
