# NickAI voice and social guide

The one document for how NickAI sounds and what it posts, on X first and on every other surface by extension. It sits on top of the content guide (`docs/nickai-content-guide.md`, mirrored on the wiki as `marketing/nickai-content-guide`): the content guide owns positioning, audiences, claims, banned words and CTAs, and wins on any conflict. This guide owns voice, content types, structure, visuals, the virality mechanics we use and the ones we refuse, the competitor read, and the accounts we study.

Evidence base: 36 fast-growing startup accounts (2,056 organic posts over 60 days, paid-looking posts and the top 5% by impressions removed, ranked by likes + bookmarks), 15 competitor and venue accounts (60 days), two viral-format scans of the AI-trading timeline, and our own last 60 days. Data and per-account pages live in the reposter admin repo under `research/x-growth/`. Re-pulled monthly.

Owner: Benoit. Created 2026-10-15.

---

## 1. Where we stand

| Account | Followers | Originals / 60 days | Median likes | Top post |
|---|---|---|---|---|
| @getNickAI (us) | 10,028 | 21 (+78 replies) | 0 | 7 likes |
| @agenticscredit | 43,309 | 18 | 142 | 12,423 likes, one launch video |
| @AIWayfinder | 89,351 | 23 | 25 | 55 |
| @TheoriqAI | 269,467 | 30 | 32 | 69 |
| @autonolas | 31,208 | 40 | 33 | 97 |
| @3commas_io | 38,124 | 7 | 5 | 10 |
| @cryptohopper | 8,604 | 99 | 0 | 2 |
| @ComposerTrade, @gizatechxyz, @griffaindotcom | 6k to 110k | 0 | | dormant |
| @Polymarket (venue) | 2,017,583 | 60 | 917 | 23,571 |
| @Kalshi (venue) | 476,852 | 99 | 284 | 6,903 |

Two facts decide the strategy. First, the direct competitors are quiet or dormant on X: median engagement under 35 likes, three accounts with no posts in 60 days. Nobody owns the "agentic trading platform" voice on the timeline. Second, the reach on our topics goes to two kinds of accounts: venues breaking news with numbers (Polymarket, Kalshi) and individuals giving away artifacts (prompts, repos, workflows) that readers bookmark at twice the rate they like. Our last 60 days did neither: 21 originals, text-heavy threads, median zero likes, and three times more replies than posts without a reply strategy.

The opportunity is not to shout louder. It is to post one measured, visual, generous thing a day in a voice no competitor is using.

---

## 2. Brand and voice

**What we are.** The agentic trading platform. Nick is an AI trading agent: you describe a strategy in plain English and Nick builds it, paper trades it, and runs it, across venues and assets, non-custodially. NickAI is the company and says "we". Nick is the agent and is "it". (Full positioning, hooks and audiences: content guide.)

**How we sound.** Six attributes, each with the test that catches a violation.

| Attribute | We write | We never write | Test |
|---|---|---|---|
| Calm | "The H100 hour just hit $3.08, its highest in a month." | "HUGE: GPU prices are exploding right now!" | Could a wire service have sent it? |
| Specific | "28 of 32 CVEs", "24 nodes, every 4 hours" | "tons of integrations", "lightning fast" | Is every claim a noun or a measured number? |
| Plain | "Nick reads both order books before it places an order." | "leverages cross-venue liquidity intelligence" | Would a trader say it out loud at a desk? |
| Understated | "One of those evenings." (over a strong visual) | "You won't BELIEVE what Nick just did" | Is the copy smaller than the image? |
| Generous | "Here is the one-sentence prompt. Clone it." | "DM me for the strategy" | Does the reader leave with something? |
| Confident | "Fade extreme funding rates. 24 nodes." | "We think you might find this useful" | Any hedging adverb left? |

**Second person only when giving.** "You can now", "free for everyone", "your account works harder". Never "you should", "you need", "you're missing out".

**Three registers, one voice.**
- *Brand account (@getNickAI)*: sentence case, no emoji, no exclamation marks, no hashtags, no em-dashes. The data punishes lowercase-casual openers on brand accounts by half.
- *Inside the desk films*: the approved film register (conversational, a lowercase reaction, one pointed uppercase question, one purposeful emoji) lives in the video, as the trader character. The post copy around the film stays in brand voice.
- *Founder accounts*: lowercase, first person, opinionated. This is where "I built this in a sentence" belongs, quoted or reposted by the brand.

**Tone by audience** (content guide): traders and quants get numbers and mechanics; AI enthusiasts get capability in plain words, never get-rich; funds get security, control, precision.

---

## 3. What we post: the content types

Each type is tied to a mechanism the data rewards and to a source we already have. Weekly calendar in the reposter admin: Monday product, Tuesday and Thursday strategy, Wednesday and Friday guide, plus reactive posts.

1. **The one-sentence agent** (Strategy Highlight). A real template from the library: the sentence that creates it, the workflow it becomes, the venues it runs on. Visual: the workflow-template card or the film segment where the graph assembles. Mechanism: contrast and generosity. Example: "Fade extreme funding rates. 24 nodes, BTC and ETH funding every 4 hours, an LLM check, paper trades, Telegram alerts."
2. **Day-0 model test.** Every frontier-model launch: "We ran <model> as a trading agent on N paper strategies for 24 hours." A comparison chart with the new model in blue, rivals grey. Five of the fastest-growing accounts grow on this format and none of them is multi-LLM by design; we are. Mechanism: recency and the measured comparison.
3. **Market data with Nick's data nodes.** Funding rates, open interest, liquidations, prediction-market odds gaps, from CoinGlass, Nansen, Santiment, Polymarket and Kalshi through Nick. The post is the number and its frame; the image is a one-number data card with source and date. Never performance, always market facts. Mechanism: the counter-intuitive data point, the daily-tape habit.
4. **Product drops, value-first.** What shipped, walked to the trader's outcome ("Connect your Propr account to get 1,000 free credits", not "unlock Propr partnership credits on node connection"). One capability per post, with a guide link in the first reply when the source is a GitHub PR. Mechanism: the generous release.
5. **Proof.** A badge, a partner logo, a leaderboard, a press mention, a template count. Raw screenshot, no design. Mechanism: borrowed authority.
6. **Artifact giveaways.** The prompt, the workflow JSON, the dataset, the explainer thread that gets bookmarked. The image is the artifact itself. Mechanism: reciprocity; bookmarks are the thank-you.
7. **Show the machine.** The render box, the agent's reasoning trace, a workflow assembling, the desk films. Mechanism: curiosity and the IKEA effect by proxy.
8. **Launches as events.** A 3-post thread: demo video, then the number with its frame, then the link and CTA. The fastest-growing accounts get 60 to 100% of their reach from their top 3 posts; concentrate effort here.

Not for us yet: tribe talk ("for the believers"), which needs 50k+ followers to have anyone to address, and anything that needs a performance number.

---

## 4. How we get reach while staying on brand

The mechanisms, in the order a post uses them, and the compliant form of each.

1. **Pattern interrupt in the first nine words**: a precise number, a named authority, or a belief reversal. Not a question (questions underperform statements), not an emoji.
2. **Specificity as credibility**: measured and odd numbers ("17,895-line proof"), named rivals, dates. Rounded numbers read as marketing.
3. **Third-party proof** whenever we have it: let the badge or the partner make the claim.
4. **Anchoring and contrast**: give the number a frame. "158 lines" against "1 sentence". "$299 a month on its own" against "free on Nick".
5. **Reciprocity**: give the prompt, the workflow, the dataset, the explainer. Aim for bookmarks per like above 0.3.
6. **Curiosity resolved inside the thread**, not behind a link. A URL in the body cuts reach 4x; the link goes in the first reply.
7. **Restraint as status**: short copy, calm voice, no exclamation marks. The strongest posts do not sell.
8. **Native media on every post**: 3x median reach with media; video carries the outliers. Post 14:00 to 20:00 UTC.
9. **Reply where the attention already is**: two replies under larger accounts' posts on the same topic within the hour of posting. The winning accounts reply more than they post.
10. **Reply to trade ideas with an agent.** When an account posts a trade idea (a funding read, an odds gap, a setup, a "what if" on a market), reply with the one-sentence Nick agent that would run it, and the workflow it becomes: "Fade extreme funding rates" under a funding post, "Alert me when the Kalshi and Polymarket odds diverge by 5 points" under an odds post. The reply is the giveaway: the sentence, the nodes, the venues. It turns someone else's idea into a demo of the product without a pitch, and it reaches their audience, not ours. Rules: only on posts that state a mechanism (not price calls), never a performance claim, no link in the reply (the library link can follow if they ask), one reply per thread. Target feeds: the Data voices and Venues lists, plus the daily viral scan.

What we refuse, even though it works for others: money promises and performance claims (banned by the content guide and the CFTC risk list), fear and loss framing, scarcity and urgency, engagement bait ("RT if", "drop your setup below"), hashtags, hype vocabulary, and copying a competitor's claim with our logo on it. The artifact-giveaway format is ours to use; the "it will make you a lot of money" caption that usually comes with it is not.

---

## 5. Structure rules

Numbers from the organic winners: median 144 characters, 2 lines, first line 9 words; 36% are one line; 80 to 160 characters is the sweet spot; over 160 halves the median.

- **Single**: first line under 10 words with a number, an authority or a reversal. Then one line that says what it means. Then the CTA line. 80 to 160 characters before the CTA.
- **Thread**: three posts. 1 is the reveal with the video. 2 is the number with its frame and the chart. 3 is the link and the CTA.
- **One idea per post.** Two ideas are two posts.
- **Templates** (name the one you used): T1 flat fact + image; T2 belief, then the number that breaks it; T3 we ran the test; T4 introducing + one outcome line + three nouns; T5 third-party proof + screenshot; T6 understated reveal, three to five words over a strong visual; T7 day-0 model test; T8 launch thread. Full exemplars in the reposter admin repo, `research/x-growth/PLAYBOOK.md`.
- **Compliance line** (content guide): banned in any form: profit, returns, win, beat, guaranteed, edge, alpha, swarm. Every number is a sourced product or market fact. Positive framing. Final line exactly `Try it for free now: getnick.ai`. No off-domain URL in the body.

---

## 6. Visual rules

One idea per image, and it is the same idea as the post's first line. In-image text is either four to six huge words or one huge number; never a paragraph. Light cards for data (reads as a document), dark cards for product and culture (reads as a stage). Vertical or square for cards, 16:9 for screenshots and video. Source and date on every data card. Brand mark small, in a corner.

Six constructions that keep winning, and who makes them:

| Construction | What it is | Made by |
|---|---|---|
| Stat card | one object or face, one giant word, a row of 3 to 4 numbers with tiny labels | pixelnick |
| Screenshot as evidence | a raw crop of the badge, leaderboard or product page, zero design | nobody, that is the point |
| One-number data card | light card, plain title, huge number with a delta, chart, source + date footer | pixelnick (to build) |
| Comparison chart | rivals named and grey, Nick in blue | pixelnick (to build) |
| Textured type card | dark, one soft 3D object, 4 to 6 word headline | pixelnick social card / OG cover, FAL for the object |
| Scene or process | cinematic frame, workflow assembling, the desk films | films, FAL for stills |

Anything with numbers or words that must read exactly goes through pixelnick. FAL (nano-banana-2, gpt-image-2.5 through the reposter admin) makes hero objects and scenes, and short specified text only with `allow_text`. Palette: dark `#09090b`, light `#f8fafc`, blue `#0178ff`.

---

## 7. No AI slop: the tells and the tests

The content guide's list stands (hype filler, throat-clearing, "it's not X, it's Y", rhythm triads, emoji bullets, Title Case, bolding everything, vague claims). X adds its own tells. Any of these in a draft means rewrite, not edit:

- Openers: "Here's the thing", "Let's break it down", "In a world where", "Imagine a world", "Hot take:", "Unpopular opinion:", "Thread 🧵", "A thread 👇", "1/".
- Closers: "What do you think?", "Drop your thoughts below", "Let that sink in", "Stay tuned", "More soon".
- Hype: excited to announce, thrilled, game-changer, revolutionary, next-level, 10x, insane, crack, "literally".
- Shape: three parallel lines for rhythm; a question as the hook; an exclamation mark anywhere; an em-dash anywhere; a list of five adjectives; the same sentence length five times in a row.
- Lowercase-casual on the brand account; emoji as decoration; a number with no source.

Four tests before anything ships:
1. **The desk test**: would a trader say this sentence out loud to a colleague? If not, it is marketing.
2. **The noun test**: strike every adjective and adverb. Does the post still carry its meaning? It should.
3. **The one-idea test**: can the post be said in one breath? If it needs two, split it.
4. **The screenshot test**: with the caption hidden, does the image alone tell the reader the first line?

---

## 8. Competitors on X: the read

| Account | What they do on X | What to learn | What to avoid |
|---|---|---|---|
| @agenticscredit (43k) | One launch video at 12,423 likes, then a campaign of paid-looking third-party threads about paper-trading credit | A launch concentrated into one strong video works; "paper trading" is a live topic | Reach bought through shill threads; their copy leans on "profitable" |
| @AIWayfinder (89k) | "Vibe trade" positioning, iMessage agent, mobile demos; 23 posts, median 25 likes | Casual mobile-native demos; the vibe-trading vocabulary overlaps ours | Feature-first captions, little proof |
| @TheoriqAI (269k) | Conference and partner announcements, yield vaults; median 32 likes on 269k followers | Nothing on format; shows that follower count without a format is dead reach | Event-partnership posts as the main cadence |
| @autonolas (31k) | Agent economy data posts, forecaster models; 40 posts, median 33 | Data-led posts about agent output ("agents generated the data") | Token-economy framing |
| @3commas_io (38k) | Seven feature announcements in 60 days, median 5 likes | The template of what a "New feature is live 🚀" post earns: nothing | Emoji bullets, "You asked, we listened" |
| @cryptohopper (8.6k) | 99 auto-posted news links, median 0 likes | What link-in-body volume posting earns: nothing | Link posting |
| @virtuals_io (293k) | Launch videos, "millions more people can own a working agent" | Big-number launch lines with video | Token hype |
| @ComposerTrade, @gizatechxyz, @griffaindotcom | Dormant | The category voice is unclaimed | |

Venues to ride, not compete with: @Polymarket and @Kalshi break news with numbers at 60 to 99 posts per 60 days and own the prediction-market conversation; @HyperliquidX posts rarely but every post carries a record number with a chart. When they post a number, a Nick post that adds the measured next step (the odds gap, the funding read, the workflow that acts on it) within the hour borrows their attention.

---

## 9. Accounts we study

Keep these as X Lists on the brand account (Benchmarks, Founders, Data voices, Venues, Competitors) so the daily scout and the reply strategy have a feed to work from.

**Benchmarks: formats to copy** (from the 36-account research; likes/bookmarks on their best organic post)
- @fomo (trading app, 160k): short rhythmic lines, tribe talk; closest consumer comparable.
- @Novig (sports prediction market, 52k): stat cards and YES/NO logo cards, daily cadence; the best visual system in our space.
- @OrnnExchange (compute market, 10k): one-number data cards with source and date; the template for our market-data posts.
- @resend (email API, 34k): changelog type cards, "free for everyone" releases.
- @askalphaxiv (research, 57k): one-clause paper explainers, bookmarks above likes.
- @ValsAI (evals, 24k): leaderboards with the new model on top; day-0 model posts.
- @PrismML (models, 28k): "9x smaller, 98.2% retained" number-led launches.
- @namespacelabs (dev infra, 5k): partner logos, behind-the-scenes video.
- @PrimeIntellect (85k): launch threads where post 2 carries the benchmark.
- @lmstudio (66k): "featured on Apple's page" proof posts, day-0 model support.

**Founder voices: what personal accounts can do that the brand cannot**
- @fabrice_mayrand (19k): price-hook launch post, 41.9M impressions. Launch-driven, 16 posts in 60 days.
- @vovudebosh (34k): "Jev can WHAT?" fake-naive discovery hook, 2.66M impressions.
- @virattt (51k): "AI Hedge Fund just got paper trading", a terminal video, 89 likes / 95 bookmarks.

**Data voices: the daily-tape habit on our topics**
- @0xThoor (93k): funding-rate data across Binance and TradeXYZ with a dated table.
- @ColeGotTweets (15k): funding-rate spreads, BVIV perp; numbers first.
- @EthanDeFi_ (3k): funding-rate arbitrage tutorials, 123 likes / 182 bookmarks.
- @BlockDogg777 (3.5k): "Daily Tape" macro cards, 227 likes on a tiny account; proof that a numbers list with an image beats follower count.

**Venues**: @Polymarket, @Kalshi, @HyperliquidX, plus @Coinbase, @OKX and @RobinhoodApp for the venues Nick supports.

**Competitors to monitor**: @agenticscredit, @AIWayfinder, @TheoriqAI, @autonolas, @3commas_io, @cryptohopper, @virtuals_io, @numerai, @gizatechxyz, @ComposerTrade, @griffaindotcom.

**Launch playbook lists (16 Oct 2026, Hyperliquid and prediction markets)**: the live source of truth is the allowlist on the reposter admin board (`/x/settings`), grouped by role. Core: @HyperliquidX, @chameleon_jeff, @Polymarket, @PolymarketIntel, @Domahhhh, @Kalshi, @shayne_coplan, @mansourtarek_. Top 10 reply targets (3 to 5 agent replies a day): @ThinkingUSD, @NateSilver538, @Cbb0fe, @lookonchain, @Kalshi_Crypto, @PolymarketMoney, @lxeagle17, @unusual_whales, @kirbyongeo, @aixbt_agent. Partners: @Outcomexyz (@OutcomeAK), @tradexyz, Kalshi crypto (@j0hnwang, @icobeast), @hydromancerxyz, @hypedexer, @recallnet; alternates @InsilicoTrading, @betmoardotfun, @sharexyz. Competitors to watch, never retweet: @senpi_ai (@betashop), @tread_fi, @the_nof1, @bankrbot, @HeyElsaAI, @autonolas. Avoid: @JamesWynnReal, @machibigbrother, @EmberCN, @stacy_muur; inactive @HyperFND, @HsakaTrades, @HypurrScan.

**Watch, do not copy**: @milesdeutscher and @RohOnChain (the "Opus 5.5 + Jev = crack" and "10x quant CLAUDE.md" posts). Their format (artifact + model name + short caption) is exactly right; their captions promise money. We take the format and leave the promise.

---

## 10. Operating cadence and measurement

- One substantive post per weekday, 14:00 to 20:00 UTC, from the calendar; reactive posts when a venue or a model lab gives us a number to add to.
- Launches get the 3-post thread and a film; everything else gets one post.
- Two replies under larger accounts' posts on the same topic within the hour of posting, plus one reply a day to a trade-idea post with the Nick agent that would run it (section 4, mechanism 10).
- Measure likes + bookmarks, never impressions (a third of the biggest impression counts in our research look paid). Bookmarks per like above 0.3 means reference content: make more of it.
- Monthly: re-pull the benchmark and competitor accounts (`scripts/research/x_pull_accounts.py` in the reposter admin, about $17), re-run the report, and update this guide if a format stops winning.

---

## Quick reference

- Calm, specific, plain, understated, generous, confident. Sentence case. No emoji, hashtags, em-dashes, exclamation marks.
- First line under 10 words with a number, an authority or a reversal. 80 to 160 characters. One idea.
- Media on every post. The image says what line one says. Links in the first reply.
- Banned: profit, returns, win, beat, guaranteed, edge, alpha, swarm. Numbers are sourced market or product facts. CTA last: `Try it for free now: getnick.ai`.
- Content types: one-sentence agent, day-0 model test, market data through Nick, value-first drops, proof, artifact giveaways, show the machine, launches.
- Four tests: desk, noun, one idea, screenshot.
- Score by likes + bookmarks. Reply twice, and once to a trade idea with the agent that runs it. Re-pull monthly.
