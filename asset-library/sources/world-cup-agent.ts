// Badi's real World Cup meta-agent workflow (wfl_2oupcbow9qyk), exported from
// prod on 2026-07-08 and sanitized (no credentials/PII were present). The
// "Detect Edges (W3)" function is restored to its ORIGINAL broken state: it
// reads `d['match_item']` directly, but the loop node wraps each iteration in
// `{ item, index, total, isLast }` — the exact bug from #engineering-bugs that
// cost ~30k credits of fix-the-same-thing loops. Eval cases assert the agent
// reads the node code before editing and preserves the `.item` unwrap.
export const WORLD_CUP_AGENT_WORKFLOW: { nodes: unknown[]; edges: unknown[] } =
	{
		nodes: [
			{
				id: "nde_4ipcvxs8ix9o",
				data: {
					label: "Start",
					config: {
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
				id: "nde_rp8jilmotry2",
				data: {
					label: "Fetch Fixtures (Upcoming)",
					config: {
						lens: "fixtures",
						limit: 20,
						status: "upcoming",
					},
				},
				type: "worldcup-data",
				position: {
					x: 450,
					y: 150,
				},
			},
			{
				id: "nde_preh5bt3s8ds",
				data: {
					label: "Fetch Full Match Data",
					config: {
						lens: "full",
						limit: 20,
						status: "upcoming",
					},
				},
				type: "worldcup-data",
				position: {
					x: 450,
					y: 330,
				},
			},
			{
				id: "nde_uhpxxd8w6g90",
				data: {
					label: "Aggregate Match Data (W1)",
					config: {
						code: "import json\nfrom datetime import datetime\n\ndef main(inputs, workflow_variables=None, global_variables=None):\n    fixtures = inputs.get('fixtures', {}).get('items', [])\n    full = inputs.get('full', {}).get('items', [])\n    \n    # Build map\n    full_map = {}\n    for row in full:\n        if isinstance(row, dict):\n            score = row.get('score', {})\n            home = score.get('home')\n            away = score.get('away')\n            date = row.get('fixture', {}).get('date')\n            if home and away and date:\n                key = (home, away, date)\n                if key not in full_map:\n                    full_map[key] = row\n    \n    # Enrich fixtures, filter by round, and deduplicate by (home, away, date)\n    matches = []\n    seen = set()\n    \n    # Only include these rounds\n    valid_rounds = {'Quarter-finals', 'Semi-finals', 'Final'}\n    \n    for fixture in fixtures:\n        if not isinstance(fixture, dict):\n            continue\n        \n        home = fixture.get('home')\n        away = fixture.get('away')\n        date = fixture.get('date')\n        round_name = fixture.get('round', '')\n        \n        if not home or not away:\n            continue\n        \n        # Filter by round - skip Round of 32 and Round of 16\n        if round_name not in valid_rounds:\n            continue\n        \n        # Deduplicate by home, away, date combo\n        match_key = (home, away, date)\n        if match_key in seen:\n            continue\n        seen.add(match_key)\n        \n        full_row = full_map.get((home, away, date), {})\n        elo = full_row.get('elo', {})\n        form = full_row.get('form', {})\n        \n        match = {\n            'home_team': home,\n            'away_team': away,\n            'scheduled_at': date,\n            'status': fixture.get('status'),\n            'round': round_name,\n            'home_elo': (elo.get('home', {}) or {}).get('rating'),\n            'away_elo': (elo.get('away', {}) or {}).get('rating'),\n            'home_form': form.get('home'),\n            'away_form': form.get('away'),\n            'venue': fixture.get('venue'),\n        }\n        matches.append(match)\n    \n    return {'status': 'success', 'next_4_games': matches[:4]}",
						language: "python",
					},
				},
				type: "function",
				position: {
					x: 800,
					y: 240,
				},
			},
			{
				id: "nde_80hbmohrrfw9",
				data: {
					label: "Build Context (W1.5)",
					config: {
						code: "def main(inputs, workflow_variables=None, global_variables=None):\n    d = inputs or {}\n    # The input comes via edge 'matches'\n    match_data = d.get('matches') or d\n    next_4 = match_data.get('next_4_games', []) or []\n    \n    context = []\n    for idx, match in enumerate(next_4):\n        ctx = {\n            'id': idx,\n            'home_team': match.get('home_team', ''),\n            'away_team': match.get('away_team', ''),\n            'scheduled_at': match.get('scheduled_at', ''),\n            'home_elo': match.get('home_elo'),\n            'away_elo': match.get('away_elo'),\n            'home_form': match.get('home_form'),\n            'away_form': match.get('away_form'),\n            'venue': match.get('venue', ''),\n            'status': match.get('status', ''),\n            'round': match.get('round', ''),\n            'transitive_chains': []\n        }\n        context.append(ctx)\n    \n    return {'status': 'success', 'matches_context': context}",
						language: "python",
					},
				},
				type: "function",
				position: {
					x: 1150,
					y: 240,
				},
			},
			{
				id: "nde_hu00qsqr65bx",
				data: {
					label: "Loop Matches",
					config: {
						inputExpression: "{context.matches_context}",
					},
				},
				type: "loop",
				position: {
					x: 1535.2805510247977,
					y: 175.85354359127695,
				},
			},
			{
				id: "nde_mlhtrb7ter9x",
				data: {
					label: "Search Polymarket (W2a)",
					config: {
						mode: "search",
						sort: "volume",
						limit: 10,
						query: "{match_item.item.home_team} {match_item.item.away_team}",
						market: "{match_item.conditionId}",
						category: "",
						description:
							"Search for World Cup match markets by team names and match date",
					},
				},
				type: "polymarket-data",
				position: {
					x: 1818.3524294983233,
					y: 425.05685469301335,
				},
			},
			{
				id: "nde_sf8llzftdsc4",
				data: {
					label: "Generate Predictions (W2b)",
					config: {
						model: "anthropic/claude-opus-4.8",
						provider: "anthropic",
						userPrompt:
							"Analyze this World Cup match based on team form, ELO ratings, and market data. Generate win probabilities (0-1) for home win, away win, and draw. Output valid JSON with fields: home_win, away_win, draw. No markdown or explanation, just the JSON object.",
					},
				},
				type: "llm",
				position: {
					x: 2164.600911387113,
					y: 46.91406211152456,
				},
			},
			{
				id: "nde_d3taes6yei0r",
				data: {
					label: "Detect Edges (W3)",
					config: {
						code: "import json\n\ndef main(inputs, workflow_variables=None, global_variables=None):\n    d = inputs or {}\n    \n    match = d.get('match_item', {})\n    \n    search_results = d.get('search_results', {}) or {}\n    prediction_output = d.get('prediction_output', {})\n    \n    home = match.get('home_team', '')\n    away = match.get('away_team', '')\n    scheduled_at = match.get('scheduled_at', '')\n    \n    # Parse prediction\n    prediction = {}\n    if isinstance(prediction_output, dict):\n        prediction = prediction_output\n    elif isinstance(prediction_output, str):\n        try:\n            start = prediction_output.find('{')\n            end = prediction_output.rfind('}') + 1\n            if start >= 0 and end > start:\n                json_str = prediction_output[start:end]\n                prediction = json.loads(json_str)\n        except:\n            prediction = {}\n    \n    home_prob = float(prediction.get('home_win', 0))\n    away_prob = float(prediction.get('away_win', 0))\n    draw_prob = float(prediction.get('draw', 0))\n    \n    edges = []\n    markets = search_results.get('markets', []) if isinstance(search_results, dict) else []\n    \n    for market in markets:\n        if not isinstance(market, dict):\n            continue\n            \n        question = market.get('question', '')\n        outcomes = market.get('outcomes', [])\n        slug = market.get('slug', '')\n        url = market.get('url', '')\n        liquidity = market.get('liquidity', 0)\n        volume_24h = market.get('volume24hr', 0)\n        \n        question_lower = question.lower()\n        home_lower = home.lower()\n        away_lower = away.lower()\n        \n        # Improved matching for Polymarket's question format:\n        # \"Will France win on 2026-07-09?\" -> home win\n        # \"Will Morocco win on 2026-07-09?\" -> away win\n        # \"Will France vs. Morocco end in a draw?\" -> draw\n        \n        is_home_win = home_lower in question_lower and 'win' in question_lower and away_lower not in question_lower\n        is_away_win = away_lower in question_lower and 'win' in question_lower and home_lower not in question_lower\n        is_draw = 'draw' in question_lower or 'tie' in question_lower\n        \n        if not (is_home_win or is_away_win or is_draw):\n            continue\n        \n        # Extract pricing from outcomes\n        for outcome in outcomes:\n            outcome_text = outcome.get('outcome', '')\n            market_price = float(outcome.get('price', 0))\n            token_id = outcome.get('tokenId', '')\n            \n            if not token_id or market_price == 0:\n                continue\n            \n            # Home team win\n            if is_home_win and 'yes' in outcome_text.lower():\n                if home_prob > 0:\n                    edge_pct = (home_prob - market_price) * 100\n                    if abs(edge_pct) > 1:\n                        edges.append({\n                            'match': f\"{home} vs {away}\",\n                            'date': scheduled_at,\n                            'market_question': question,\n                            'outcome': f\"{home} Win\",\n                            'team': home,\n                            'fair_value': round(home_prob, 3),\n                            'market_price': round(market_price, 3),\n                            'edge_pct': round(edge_pct, 2),\n                            'side': 'BUY' if edge_pct > 0 else 'SELL',\n                            'tokenId': token_id,\n                            'url': url,\n                            'slug': slug,\n                            'liquidity': liquidity,\n                            'volume_24h': volume_24h,\n                            'amount': max(50, int(abs(edge_pct) * 5)),\n                            'confidence': min(abs(edge_pct) / 10, 1.0)\n                        })\n            \n            # Away team win\n            elif is_away_win and 'yes' in outcome_text.lower():\n                if away_prob > 0:\n                    edge_pct = (away_prob - market_price) * 100\n                    if abs(edge_pct) > 1:\n                        edges.append({\n                            'match': f\"{home} vs {away}\",\n                            'date': scheduled_at,\n                            'market_question': question,\n                            'outcome': f\"{away} Win\",\n                            'team': away,\n                            'fair_value': round(away_prob, 3),\n                            'market_price': round(market_price, 3),\n                            'edge_pct': round(edge_pct, 2),\n                            'side': 'BUY' if edge_pct > 0 else 'SELL',\n                            'tokenId': token_id,\n                            'url': url,\n                            'slug': slug,\n                            'liquidity': liquidity,\n                            'volume_24h': volume_24h,\n                            'amount': max(50, int(abs(edge_pct) * 5)),\n                            'confidence': min(abs(edge_pct) / 10, 1.0)\n                        })\n            \n            # Draw\n            elif is_draw and 'yes' in outcome_text.lower():\n                if draw_prob > 0:\n                    edge_pct = (draw_prob - market_price) * 100\n                    if abs(edge_pct) > 1:\n                        edges.append({\n                            'match': f\"{home} vs {away}\",\n                            'date': scheduled_at,\n                            'market_question': question,\n                            'outcome': 'Draw',\n                            'team': 'Draw',\n                            'fair_value': round(draw_prob, 3),\n                            'market_price': round(market_price, 3),\n                            'edge_pct': round(edge_pct, 2),\n                            'side': 'BUY' if edge_pct > 0 else 'SELL',\n                            'tokenId': token_id,\n                            'url': url,\n                            'slug': slug,\n                            'liquidity': liquidity,\n                            'volume_24h': volume_24h,\n                            'amount': max(25, int(abs(edge_pct) * 3)),\n                            'confidence': min(abs(edge_pct) / 10, 1.0)\n                        })\n    \n    edges = sorted(edges, key=lambda x: abs(x.get('edge_pct', 0)), reverse=True)\n    \n    return {\n        'status': 'success',\n        'edges': edges,\n        'bets_to_place': len(edges),\n        'predictions': prediction,\n        'match': f\"{home} vs {away}\",\n        'home_team': home,\n        'away_team': away\n    }\n",
						language: "python",
					},
				},
				type: "function",
				position: {
					x: 2550,
					y: 240,
				},
			},
			{
				id: "nde_ff77jv9jls54",
				data: {
					label: "Aggregator",
					config: {},
				},
				type: "aggregator",
				position: {
					x: 2900,
					y: 240,
				},
			},
			{
				id: "nde_febv1f2g2atz",
				data: {
					label: "Execute Bets (W4)",
					config: {
						side: "BUY",
						amount: "{bet_decisions.edges[0].amount}",
						tokenId: "{bet_decisions.edges[0].tokenId}",
						walletId: "{bet_decisions.edges[0]}",
						tokenLabel: "{bet_decisions.edges[0].outcome}",
						description:
							"Execute predicted bets on Polymarket CLOB using sizing decisions from W3",
						marketQuestion: "{bet_decisions.edges[0].match}",
					},
					failsafe: true,
				},
				type: "polymarket-order",
				position: {
					x: 3294.9767643314053,
					y: 117.97942871142723,
				},
			},
			{
				id: "nde_4fo15d8lugzb",
				data: {
					label: "Store Predictions in R2",
					config: {
						code: "import boto3\nimport json\nfrom botocore.config import Config\nfrom datetime import datetime\n\ndef main(inputs, workflow_variables=None, global_variables=None):\n    g = global_variables or {}\n    access_key = g.get('MARKETING_BUCKET_ACCESS_KEY')\n    secret_key = g.get('MARKETING_BUCKET_SECRET')\n    bucket_url = g.get('MARKETING_BUCKET_URL')\n    bucket_name = g.get('MARKETING_BUCKET_NAME')\n    \n    if not all([access_key, secret_key, bucket_url, bucket_name]):\n        return {'error': 'Missing Cloudflare R2 credentials'}\n    \n    data = inputs or {}\n    \n    try:\n        s3 = boto3.client(\n            's3',\n            endpoint_url=bucket_url,\n            aws_access_key_id=access_key,\n            aws_secret_access_key=secret_key,\n            region_name='auto',\n            config=Config(signature_version='s3v4')\n        )\n        \n        today = datetime.utcnow().strftime('%Y-%m-%d')\n        key = f'world-cup-agent/shared/decisions/{today}/all_decisions.json'\n        \n        s3.put_object(\n            Bucket=bucket_name,\n            Key=key,\n            Body=json.dumps(data),\n            ContentType='application/json'\n        )\n        \n        return {\n            'status': 'success',\n            'action': 'store',\n            'key': key,\n            'bucket': bucket_name,\n            'size': len(json.dumps(data)),\n            'timestamp': datetime.utcnow().isoformat()\n        }\n    except Exception as e:\n        return {'status': 'error', 'error': str(e)}\n",
						language: "python",
						description:
							"Store prediction picks to Cloudflare R2 with timestamp-based organization",
					},
				},
				type: "function",
				position: {
					x: 3383.125627245113,
					y: 344.6949873708794,
				},
			},
		],
		edges: [
			{
				id: "edg_vp3t413bkyjo",
				data: {
					label: "trigger",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_4ipcvxs8ix9o",
				target: "nde_rp8jilmotry2",
				sourceHandle: "output",
				targetHandle: "trigger",
			},
			{
				id: "edg_nuewmhnbzt0h",
				data: {
					label: "trigger",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_4ipcvxs8ix9o",
				target: "nde_preh5bt3s8ds",
				sourceHandle: "output",
				targetHandle: "trigger",
			},
			{
				id: "edg_8t4zb6nxuq8f",
				data: {
					label: "fixtures",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_rp8jilmotry2",
				target: "nde_uhpxxd8w6g90",
				sourceHandle: "data",
				targetHandle: "input",
			},
			{
				id: "edg_mk2htve4yruk",
				data: {
					label: "full",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_preh5bt3s8ds",
				target: "nde_uhpxxd8w6g90",
				sourceHandle: "data",
				targetHandle: "input",
			},
			{
				id: "edg_97cedqiyu1mw",
				data: {
					label: "matches",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_uhpxxd8w6g90",
				target: "nde_80hbmohrrfw9",
				sourceHandle: "output",
				targetHandle: "input",
			},
			{
				id: "edg_5ywlhid8xbfl",
				data: {
					label: "context",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_80hbmohrrfw9",
				target: "nde_hu00qsqr65bx",
				sourceHandle: "output",
				targetHandle: "items",
			},
			{
				id: "edg_5yzjnc07elxg",
				data: {
					label: "match_item",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_hu00qsqr65bx",
				target: "nde_mlhtrb7ter9x",
				sourceHandle: "item",
				targetHandle: "data",
			},
			{
				id: "edg_1adefnhayqdp",
				data: {
					label: "search_results",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_mlhtrb7ter9x",
				target: "nde_sf8llzftdsc4",
				sourceHandle: "data",
				targetHandle: "input",
			},
			{
				id: "edg_w5loevor82x1",
				data: {
					label: "prediction_output",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: "incoming",
				},
				source: "nde_sf8llzftdsc4",
				target: "nde_d3taes6yei0r",
				sourceHandle: "output",
				targetHandle: "input",
			},
			{
				id: "edg_eobsz2m8xeq1",
				data: {
					label: "edges",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: "outgoing",
				},
				source: "nde_d3taes6yei0r",
				target: "nde_ff77jv9jls54",
				sourceHandle: "output",
				targetHandle: "input",
			},
			{
				id: "edg_vyfswtrvjquq",
				data: {
					label: "match_item",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_hu00qsqr65bx",
				target: "nde_sf8llzftdsc4",
				sourceHandle: "item",
				targetHandle: "input",
			},
			{
				id: "edg_8glsgfb6y83e",
				data: {
					label: "match_item",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: "incoming",
				},
				source: "nde_hu00qsqr65bx",
				target: "nde_d3taes6yei0r",
				sourceHandle: "item",
				targetHandle: "input",
			},
			{
				id: "edg_kn4jygppl7ff",
				data: {
					label: "bet_decisions",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_ff77jv9jls54",
				target: "nde_febv1f2g2atz",
				sourceHandle: "result",
				targetHandle: "trigger",
			},
			{
				id: "edg_p8teh6ctkcve",
				data: {
					label: "predictions",
					animated: false,
					highlighted: false,
					dashAnimation: false,
					connectionType: null,
				},
				source: "nde_ff77jv9jls54",
				target: "nde_4fo15d8lugzb",
				sourceHandle: "result",
				targetHandle: "input",
			},
			{
				id: "edg_pg79trdueybw",
				data: {
					label: "search_results",
					animated: false,
					highlighted: false,
					dashAnimation: false,
				},
				source: "nde_mlhtrb7ter9x",
				target: "nde_d3taes6yei0r",
				sourceHandle: "data",
				targetHandle: "input",
			},
		],
	};
