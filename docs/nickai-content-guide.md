# NickAI Content Guide (source of truth)

This is the single source of truth for how we talk about NickAI. Every piece of content we make, a tweet, a blog post, an ad, a card, a landing section, a template writeup, an email, references this doc. If a claim, a hook, or a framing is not here, it is not ready to ship.

**One rule above all the others:** ground every piece in this guide. When in doubt, open this file.

- **Owner:** Badi
- **Lives in two places, kept in sync:** the pixelnick repo (`docs/nickai-content-guide.md`, the assets and guidelines home) and the company wiki (`wiki/marketing/nickai-content-guide.md`).
- **Upstream sources:** the PMM strategy doc (the positioning source of truth), the PMM Positioning artifact, the writing-style rules. Links in [References](#references).

---

## Quick checklist (run this on every draft)

Before anything ships, it passes all seven:

1. **Value-first.** It sells the trader's outcome, not the feature. See [Content principles](#content-principles).
2. **Positive, never negative.** Aspirational and empowering. No fear, loss, or "you can't" framing.
3. **No banned claims.** Zero returns, profit, win, beat, or guaranteed language. See [Claims map](#claims-map).
4. **True and specific.** Real numbers with a stated period, real venues, real outputs. No invented stats.
5. **Clean style.** No em-dash, no en-dash, no double-dash, no hashtags, no AI slop.
6. **Right names.** NickAI is the company and platform, Nick is the agent (it, never he). Swarm Arena is a separate brand.
7. **Right CTA.** `Try it for free now: getnick.ai`, and lead with the free trial (1000 credits, no card, no time limit).

---

## Positioning and category

**NickAI is the agentic trading platform.** Nick is an enterprise ready AI trading agent that works across platforms and across assets, and stays non-custodial. You describe what you want to trade in plain English, and Nick spins up, backtests, deploys, and supervises the workflows and specialized agents that run the strategy. It is one place to build and run a whole desk of agents instead of babysitting python scripts.

**Anchor line:**
> An enterprise ready AI trading agent. Across platforms. Across assets. Non-custodial.

**Category and legibility hooks:**
- **The agentic trading platform** (primary category line, general use)
- **The Cursor of trading** (social, quants and devs)
- **Claude for trading**, and variants: **Claude for prediction markets**, **Claude for Polymarket** (social, SEO)

**Supporting hooks:**
- Describe a strategy. Nick builds it, backtests it, and runs it.
- Run a whole desk of agents instead of babysitting python scripts.
- Go from 0 to 1. Become an actual trader powered by AI, no code required.

### Naming and voice-of-brand

- **NickAI** is the company and the platform. **Nick** is the trading agent.
- Nick is referred to as **"it"**, never "he" or "him". Nick is an advanced trading agent, not a chatbot and not a person.
- The company voice is **"we"**.
- **Swarm Arena is a separate brand** and a public showcase. Never merge it into NickAI or platform copy. Its CTA is `swarmarena.ai`, not `getnick.ai`.

---

## Audiences

Three segments. This supersedes the older "traders, quants, and funds only, no retail" framing: AI enthusiasts are in scope now. What stays out of scope is mass-retail "get rich with AI" framing, for every segment.

### 1. Traders and quants
- **Who:** experienced running their own portfolio or a small fund. Comfortable with scripts, APIs, and pulling and analyzing data. They already automate and build strategies.
- **Tools today:** TradingView, custom scripts, open-source tooling, exchange APIs, pricing APIs, on-chain and smart contracts.
- **Why Nick:** automate and scale faster, run 10 strategies instead of 3, get many tools, data sources, and exchanges out of the box, add your own easily, and stop building and maintaining your own infra and harness. Plug your existing scripts, APIs, and workflows straight into Nick.
- **Where they hear it:** X, dev channels. Lead with MCP support, custom scripts, data sources, orchestration.

### 2. AI enthusiasts
- **Who:** aspiring, self-directed traders leveling up with AI. Small trading experience today: they buy stocks and tokens and place prediction-market bets, usually on gut or on what is trending.
- **Tools today:** Robinhood, Revolut, Coinbase, Hyperliquid, usually via a UI.
- **Why Nick:** go from 0 to 1 and become an actual trader powered by AI. Nick understands trading, analyzes assets, and handles both simple automations ("monitor this stock and let me know if it moves") and advanced ones ("rebalance my portfolio every day so I am not over exposed on X"). No code required, Nick does the building, and they get access to tools that used to be limited to quants and funds.
- **Framing guardrail:** the promise is capability and leveling up, never profit. Never get-rich, guaranteed, or returns language for this segment.

### 3. Funds and enterprise
- **Who:** professional traders inside a fund, from teams of 3 to 4 up to 20 to 30 or more.
- **Tools today:** Bloomberg, private data, expensive real-time tooling.
- **Why Nick:** enterprise ready on security, compliance, and legal. A platform they customize by adding their own private data, with multi-user workspaces for collaboration. A strong on-ramp to agentic trading, backed by Galaxy. If it works for a leading publicly-traded digital-asset trading firm, it works for other funds.
- **Where they hear it:** direct and LinkedIn. Enterprise ready, private data, multi-user workspaces, Galaxy backing. This is the one segment where non-custodial can lead, because it is their first question.

---

## The problem we solve

Agentic trading is where the work is going, but getting there means stitching it together yourself. Quants build and babysit their own scripts, harnesses, and infra, and rerun the same plumbing for every new strategy. Self-directed traders have the ideas but not the code, so they trade on gut across a handful of apps. Funds have the data and the people but no safe, customizable on-ramp to agents that clears their security, compliance, and legal bar.

The common gap is **orchestration**. There is no single place to describe a strategy, wire in the right data and venues, test it, and run a whole desk of agents under supervision. Nick is that place.

---

## Value props (in messaging order)

Lead with capability. **Non-custodial is the closer, not the opener** in cold copy: leading with security puts fear top of mind before value is felt, so it closes a convinced-but-hesitant user rather than opening the pitch. The exception is funds and enterprise 1:1, where custody is a legitimate lead.

1. **Describe it, Nick builds it.** Say what you want to trade in plain English. Nick creates the advanced workflows, and you run them on a schedule or via webhooks.
2. **A desk of agents, orchestrated.** Nick is a meta trading agent that spins up, backtests, deploys, and supervises specialized agents and workflows. One place to run the whole desk instead of babysitting python scripts.
3. **Across platforms, across assets.** Coinbase, Hyperliquid, Tradexyz, OKX, Polymarket, Kalshi. Equities and stocks, perps, tokens, prediction markets, commodities, ETFs.
4. **High-quality data in one place.** Databento and Pyth for market data, Dune and DeFiLlama for on-chain, all in the same workflow.
5. **Prove before you risk.** Nick's paper exchange lets you deploy agents with virtual money, then switch to real money once strategies are proven. Backtesting is in beta: build, backtest, run on paper, graduate to real money.
6. **Your call on consensus.** Set up adversarial reviews or LLM consensus to power a workflow or a trading decision. This is orchestration inside the product, different LLMs running different tasks as sub-agents. It is user-directed, not automatic, and it is not framed via Swarm Arena.
7. **Private by default.** Your agents and strategies are yours. A user's agents and trades are never public. This matters most to funds.
8. **Non-custodial by design (the closer).** Nick never holds your funds. They stay in your exchange or wallet.
9. **Enterprise ready.** Security, compliance, and legal built for funds, backed by Galaxy.

---

## Feature set

Name real features, real venues, real sources. Label anything in beta.

| Feature | What it is |
|---|---|
| Vibe Trading | Brainstorm strategies, analyze data, compare approaches, run execution, optimize outputs. |
| Data | Many high-quality sources in one place (Databento, Pyth) plus on-chain (Dune, DeFiLlama). |
| Execute | Place a trade, pick a prediction market, create a ratio between assets, rebalance assets. |
| Create a trading strategy | Describe it in plain English, Nick builds the advanced workflows, run on a schedule or via webhooks. |
| Across platforms | Coinbase, Hyperliquid, Tradexyz, OKX, Polymarket, Kalshi. |
| Across assets | Equities and stocks, perps, tokens, prediction markets, commodities, ETFs. |
| Paper exchange | Deploy agents with virtual money, switch to real money once strategies are proven. |
| Custom scripts | Use Nick to write custom scripts and include them in workflows. |
| LLM consensus | Use adversarial reviews or consensus to power workflows and trading decisions (user-directed). |
| On-chain | Partnership with snapshot.org. Bring agents on-chain on a non-custodial wallet with specific permissions. Supports ETH, Base, Arbitrum, Polygon. |
| Non-custodial | Nick never holds your funds. |
| Enterprise ready | Backed by Galaxy. |
| Backtesting (beta) | Build strategies, backtest, run on paper, graduate to real money. Always labeled beta. |
| MCP support | Use Nick from Claude Code, Codex, or Openclaw and Hermes. |
| Nick skills | Import favorite skills or create custom ones so Nick learns your trading style. |

---

## Content principles

These are the substance rules. They decide whether a draft is good, not just clean.

### Value-first, never feature-first
Lead with the outcome for the trader and their own account working harder, not with what shipped. Walk every item through three layers and post the third:

> feature ("Revolut exchange added") to use case ("connect your Revolut account") to **value** ("let Nick trade your Revolut account for you, so the account you already have works harder").

Speak to what the trader already has: "your account", "your positions", "your strategy". If you cannot name what the trader gets, it is not ready to post. Never simply announce what shipped.

Endorsed examples:
- "Connect your Revolut account and let Nick trade it for you."
- "See all your positions in one unified portfolio."

### Positive, never negative
Aspirational and empowering framing. No fear, loss, or "you can't" hooks, even for a lesson. Turn a cautionary point into the capability that prevents it.

- Do: "Nick is non-custodial, your funds stay in your own exchange or wallet."
- Don't: "Don't worry about giving a stranger access to your money."
- Do: "Great agents win on position sizing."
- Don't: "Position sizing kills trading agents."

### Show real outputs and use cases
Showcase an actual finished workflow, a real result, a concrete use case. "Here is a workflow Nick built and ran" beats "Nick can do anything." Concrete beats abstract every time.

### Use varied, non-crypto examples
Crypto is implied by the exchanges we support, so favor non-crypto examples when you can: stocks, ETFs, prediction markets, commodities, a Revolut or Robinhood account. This widens the story beyond crypto-native readers.

### Truth rule
Every number comes from recorded data with the period stated. Performance and results content is freshness-gated (24h): stale data drops the post. Never invent a stat (no "5K+ winning users").

---

## Voice and style

Write like a sharp human, for traders, quants, and funds. Plain, direct, specific.

### Never, ever
- **No em-dash (—), en-dash (–), or double-dash (--).** Substitute in this order: comma, then period (two sentences), then colon (before a list or explanation), then parentheses (for an aside).
- **No hashtags.** Anywhere: X, LinkedIn, Meta, blog, Slack.

### No AI slop
Avoid the tells:
- Hype filler: unlock, elevate, seamless, robust, leverage, supercharge, game-changer, revolutionary, cutting-edge, world-class, "in today's fast-paced world".
- Throat-clearing: delve, dive in, "it's worth noting", "that being said", "at the end of the day", "in conclusion", "moreover", "furthermore".
- The "it's not just X, it's Y" and "X isn't just about Y" constructions.
- Rule-of-three triads added for rhythm, parallel-structure padding.
- Decorative emoji as bullets, Title Case On Every Word, bolding everything.
- Vague claims. Use concrete nouns, numbers, and specifics.

### Tone by segment
- **Traders and quants:** confident, numbers-first, mechanics over adjectives. Terse is fine.
- **AI enthusiasts:** encouraging and plain, capability-focused ("no code required"), never hype or get-rich.
- **Funds and enterprise:** measured and precise. Security, compliance, and control lead.

---

## Claims map

Verified claims are backed by product, partners, or investors. Directional claims need confirmation before external use. Banned claims never appear, in any channel.

| Claim | Status | Basis / note |
|---|---|---|
| The agentic trading platform | Verified | Category lead line |
| The Cursor of trading, Claude for trading | Verified | Analogy for legibility, plus "Claude for prediction markets / Polymarket" |
| Meta trading agent orchestrating a desk of agents | Verified | Use "a desk of agents", never "swarm" (reserved for Swarm Arena) |
| Across platforms | Verified | Coinbase, Hyperliquid, Tradexyz, OKX, Polymarket, Kalshi. Name venues actually supported |
| Across assets | Verified | Equities, perps, tokens, prediction markets, commodities, ETFs |
| Data sources | Verified | Databento, Pyth, Dune, DeFiLlama. Name real sources |
| On-chain | Verified | snapshot.org partnership, ETH / Base / Arbitrum / Polygon |
| MCP clients | Verified | Claude Code, Codex, Openclaw and Hermes |
| Non-custodial | Verified | Nick never holds funds. Factual attribute in the anchor line, the closer in persuasive copy |
| Private by default | Verified | A user's agents and trades are never public |
| Backtesting | Directional | Always label beta |
| Enterprise ready, backed by Galaxy | Directional | Confirm approved public Galaxy naming before external use. Fallback: "backed by a leading publicly-traded digital-asset trading firm" |

### Banned claims (CFTC risk, never use)
Never make a returns, profit, or performance-outcome claim. If asked about performance, stay on capability, what Nick can build and run, never on outcomes.

Kill these words and everything like them: **profit, returns, win, winning, grow your portfolio, beat the market, guaranteed, get rich**, and any implied or promised outcome.

Also never use:
- **Invented or unverifiable stats** ("5K+ winning users").
- **"Swarm" / "swarms"** as product language for Nick. Say "a desk of agents". "Swarm" belongs to Swarm Arena only.
- Any claim a user's agents or trades are public.

---

## CTAs

- **Public product CTA, always exactly:** `Try it for free now: getnick.ai`
- **Lead with the free trial:** 1000 credits, no time limit, no credit card. This is the strongest low-friction hook, use it in CTAs and closers.
- Not "Try it on NickAI", not "app.getnick.ai/library", not a one-click template link. Just the standard line.
- **Swarm Arena exception:** Swarm Arena content uses `swarmarena.ai` ("Follow the agents on swarmarena.ai" and natural variants), never `getnick.ai`.

---

## Objection handling

- **Is my money safe?** Nick is non-custodial. It never holds your funds. They stay in your exchange or wallet, and on-chain agents run on a non-custodial wallet with specific permissions.
- **I cannot code.** You do not need to. Describe the strategy in plain English and Nick builds the workflow. This is the core of the AI-enthusiast on-ramp.
- **Is this ready for a fund?** Enterprise ready on security, compliance, and legal, with private data, multi-user workspaces, and Galaxy backing.
- **Is this just a chatbot?** No. Nick is a meta trading agent that spins up, backtests, deploys, and supervises real workflows and specialized agents.
- **Can it be trusted to decide alone?** Consensus and adversarial review are user-directed capabilities you set up, not automatic behavior. You stay in control.

---

## Channel dispatch

Where each message lands. Each channel pulls from the same positioning, weighted for its audience.

- **Website and landing:** lead with the category ("the agentic trading platform") and the anchor line, then the three audiences, then the feature grid. Non-custodial as the deploy-time reassurance, not the opener.
- **Product Hunt and launch:** "The Cursor of trading" and "Claude for trading" for instant legibility, plus the desk-of-agents framing.
- **Traders and quants (X, dev):** MCP support, custom scripts, data sources, run 10 strategies instead of 3, stop building your own infra.
- **AI enthusiasts:** 0 to 1, no code required, become an actual trader powered by AI. Never returns or get-rich framing.
- **Funds and enterprise (direct, LinkedIn):** enterprise ready, private data, multi-user workspaces, Galaxy backing. Custody can lead here.
- **Swarm Arena:** its own brand and public showcase. Do not merge it into platform copy. CTA is swarmarena.ai.

---

## Visual system

Assets, the design system, and brand guidelines live in the **pixelnick** repo. Pull existing assets, do not recreate them.

- **Card vs cover (the rule):** genuine DATA cards (performance cards, workflow-highlight cards) get the bespoke animated brand design plus a video. Everything text-heavy (product updates, blog, field notes, playbook, tutorials) uses the single-line **cover image** (the `nickai-og-cover` template: logo top-left, one sentence, the blue wave panel with the white mark, light or dark, no subhead, no CTA, no version stamp). The blog reuses the same cover template (dark) as each post's hero, so blog and social stay in sync.
- **Logo and mark blue is `#0178FF`** (the brand primary, same as the CTA and logo blue). `#0892F5` is only the app favicon background, never the logo or mark color. Pull the exact logo asset from the site repo, do not recreate it.

---

## References

- **PMM strategy doc** (positioning source of truth): https://docs.google.com/document/d/1jtT7gfViEFC9f6zP013c9aqZGbaSmicgXTeBlDR_Ja0
- **PMM Positioning artifact:** https://claude.ai/code/artifact/598fede1-21eb-4c62-9319-3135f3c75999
- **Landing content recommendations:** https://claude.ai/code/artifact/33167147-6143-4c70-9098-01e26e3bf8ff
- **X content calendar (wiki):** how the weekly social pipeline uses this guide.
- **Blog SEO strategy (wiki):** `wiki/seo/strategy-overview.md` and `wiki/seo/pillars.md` for the 8 content pillars.
- **Skills that consume this guide:** `nickai-weekly-social`, `nickai-figma-template-cards`.

*Keep this doc current. When positioning changes, change it here first, then propagate to the artifact and channels.*
