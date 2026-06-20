/**
 * swarm-auto.ts — Swarm Arena automated card cron ("the loop").
 *
 * One idempotent tick. Meant to run every ~15 min (GitHub Actions cron). It
 * reads the fixture clock straight from the swarm-arena mirror `matches` table
 * (the single source of truth for kickoff + status + final score) and fires
 * three kinds of card, each at most once, tracked in a small ledger:
 *
 *   PREGAME      ~1h before kickoff  → consensus "Market vs Agents" card
 *   POSTGAME     when status = FT    → result "Won Pick" card (final score)
 *   LEADERBOARD  ~3.5h before the slate's first kickoff (once per slate day)
 *
 * For each fired card it:
 *   1. builds the feed (swarm-consensus / swarm-results; leaderboard reads R2),
 *   2. renders PNG + MP4 via the existing render scripts,
 *   3. posts the MP4 + PNG to Slack (save → Reels/TikTok/Insta), and
 *   4. posts a ready-to-paste X draft caption as a follow-up Slack message.
 *
 * Idempotent + self-healing: a missed tick is caught up on the next one; the
 * ledger (data/swarm-auto-ledger.json) prevents double-posting. When nothing
 * is due the tick exits in a few seconds without bundling Remotion (the
 * expensive part only runs when a card actually fires).
 *
 * Honest-data rule (inherited from the feed builders): a consensus/result card
 * is only posted if the agents actually covered that game. No coverage → the
 * tick logs it and posts nothing.
 *
 * Env:
 *   SWARM_DB_URL               read-only mirror (kickoff/status/score)
 *   S3_ENDPOINT + AWS_*        R2 (agent runs + leaderboard deck)
 *   SLACK_BOT_TOKEN            bot token (render-only if unset)
 *   SLACK_CHANNEL_SWARM_ARENA  target channel (falls back to SLACK_CHANNEL_ID)
 *
 * Flags (for local testing / manual runs):
 *   --dry-run        classify + print what WOULD fire; no build/render/post
 *   --no-slack       build + render but do not post (leaves files in out/auto)
 *   --force-pregame=<substr>     ignore timing/ledger, fire a pregame card for the matching game
 *   --force-postgame=<substr>    ignore timing/ledger, fire a result card for the matching game
 *   --force-leaderboard          ignore timing/ledger, fire the leaderboard
 *   --force-matchday             ignore timing/ledger, render + post the matchday card
 *
 * Run: bun scripts/swarm-auto.ts            (one tick; this is what CI runs)
 */
import fs from "node:fs";
import path from "node:path";
import { $ } from "bun";
import { Pool } from "pg";
import { postCardToSlack, slackTokenFromEnv, type SlackConfig } from "./slack";

// ── Config ──────────────────────────────────────────────────────────────────
const LEDGER = path.join(process.cwd(), "data", "swarm-auto-ledger.json");
const OUT_ROOT = path.join(process.cwd(), "out", "auto");
const CHANNEL = process.env.SLACK_CHANNEL_SWARM_ARENA ?? process.env.SLACK_CHANNEL_ID ?? "";
const CONSENSUS_FEED = path.join(process.cwd(), "public", "swarm-arena-cards", "consensus.json");
const RESULTS_FEED = path.join(process.cwd(), "public", "swarm-arena-cards", "results.json");
const LIVE_DECK = path.join(process.cwd(), "public", "swarm-arena-cards", "live-deck.json");
const AUDIO_GAME = path.join(process.cwd(), "public", "audio", "stadium-groove.mp3"); // pre-game game cards
const AUDIO_RESULT = path.join(process.cwd(), "public", "audio", "decisive-moment.mp3"); // post-game result cards
const AUDIO_LEADERBOARD = path.join(process.cwd(), "public", "audio", "victory-jingle.mp3"); // leaderboard
const AUDIO_MATCHDAY = path.join(process.cwd(), "public", "audio", "stadium-groove-matchday.mp3"); // matchday card (~20s)

const PREGAME_LEAD_MIN = 60; // fire on the first tick at/after kickoff − 60m
const PREGAME_FLOOR_MIN = 3; // never fire inside this many minutes of kickoff
const LEADERBOARD_LEAD_MIN = 390; // 6.5h before the slate's first kickoff (moved up 3h)
const BUNDLE_LEAD_MIN = 390; // games-of-the-day bundle: 6.5h before first kickoff (moved up 3h)
const POSTGAME_GIVEUP_HRS = 24; // stop retrying a result card this long after kickoff
// Grace after kickoff before a missing winning pick is treated as terminal (the
// swarm lost the game's markets or never traded it) rather than a transient
// closed_trades lag. Games run ~2h; self-settle already covers still-open picks
// at FT, so ~8h post-kickoff (~6h post-FT) tolerates the writer lag while
// ending the otherwise-silent 24h of fruitless retries.
const POSTGAME_SETTLE_GRACE_MIN = Number(process.env.POSTGAME_SETTLE_GRACE_MIN) || 8 * 60;
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const CTA = "Follow the agents on swarmarena.ai";

// ── Flags ─────────────────────────────────────────────────────────────────--
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const NO_SLACK = argv.includes("--no-slack");
const forceFlag = (p: string) => argv.find((a) => a.startsWith(p))?.slice(p.length) ?? null;
const FORCE_PRE = forceFlag("--force-pregame=");
const FORCE_POST = forceFlag("--force-postgame=");
const FORCE_LB = argv.includes("--force-leaderboard");
const BUNDLE_TODAY = argv.includes("--bundle-today");
const FORCE_MATCHDAY = argv.includes("--force-matchday");

// ── Types ─────────────────────────────────────────────────────────────────--
type Match = {
  match_uid: string;
  home_team: string;
  away_team: string;
  scheduled_at: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  winner: string | null;
};
type Ledger = { actions: Record<string, { postedAt: string; permalink?: string; note?: string }> };
type Phase = "pregame" | "postgame";

// ── Ledger ────────────────────────────────────────────────────────────────--
function loadLedger(): Ledger {
  if (!fs.existsSync(LEDGER)) return { actions: {} };
  try {
    return JSON.parse(fs.readFileSync(LEDGER, "utf8")) as Ledger;
  } catch {
    return { actions: {} };
  }
}
function saveLedger(l: Ledger) {
  if (DRY) return;
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, JSON.stringify(l, null, 2) + "\n");
}
const done = (l: Ledger, key: string) => key in l.actions;

// ── Time helpers ────────────────────────────────────────────────────────────
const MIN = 60_000;
// Slate "day" = the US matchday in US Eastern, which is how the World Cup
// schedule is grouped. A late US-evening kickoff that lands after 00:00 UTC is
// still the same matchday, so group by ET date (not UTC, not Dubai) to fire one
// leaderboard per matchday.
// WC games run from afternoon into the small hours US-Eastern; a game just past
// midnight ET (e.g. Austria v Jordan at 00:00 ET) is the tail of the PRIOR
// evening's slate, not a new day. Shift the day boundary to ~6am ET (no games
// run 1am-1pm ET, so it's a safe gap) so late-night games group with their day.
const SLATE_BOUNDARY_MS = 6 * 60 * 60 * 1000;
const slateDay = (ms: number) => new Date(ms - SLATE_BOUNDARY_MS).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const kickoffMs = (m: Match) => new Date(m.scheduled_at).getTime();

// ── DB ────────────────────────────────────────────────────────────────────--
async function fetchMatches(): Promise<Match[]> {
  if (!process.env.SWARM_DB_URL) throw new Error("SWARM_DB_URL is not set (read-only mirror).");
  const pool = new Pool({
    connectionString: process.env.SWARM_DB_URL,
    ssl: { rejectUnauthorized: false },
    max: 2,
    connectionTimeoutMillis: 8000,
    statement_timeout: 8000,
  });
  try {
    const { rows } = await pool.query(
      `SELECT match_uid, home_team, away_team, scheduled_at, status, home_score, away_score, winner
         FROM matches
        WHERE scheduled_at >= now() - interval '1 day'
          AND scheduled_at <= now() + interval '2 days'
        ORDER BY scheduled_at ASC`,
    );
    return rows as Match[];
  } finally {
    await pool.end();
  }
}

// ── Trigger logic ─────────────────────────────────────────────────────────--
function pregameDue(m: Match, now: number, l: Ledger): boolean {
  if (FORCE_PRE) return false; // forced path handled separately
  if (done(l, `${m.match_uid}:pregame`)) return false;
  if (FINAL_STATUSES.has(m.status) || m.status !== "NS") return false;
  const k = kickoffMs(m);
  return now >= k - PREGAME_LEAD_MIN * MIN && now <= k - PREGAME_FLOOR_MIN * MIN;
}
function postgameDue(m: Match, now: number, l: Ledger): boolean {
  if (FORCE_POST) return false;
  if (done(l, `${m.match_uid}:postgame`)) return false;
  if (!FINAL_STATUSES.has(m.status)) return false;
  // Give the agents time to settle; stop retrying long after kickoff.
  return now <= kickoffMs(m) + POSTGAME_GIVEUP_HRS * 60 * MIN;
}
/** The slate's first kickoff + its ledger key, or null if no leaderboard is due. */
function leaderboardDue(matches: Match[], now: number, l: Ledger): { key: string; firstKickoff: number } | null {
  const future = matches.filter((m) => kickoffMs(m) > now).sort((a, b) => kickoffMs(a) - kickoffMs(b));
  if (!future.length) return null;
  const slateDate = slateDay(kickoffMs(future[0]));
  const firstKickoff = Math.min(...future.filter((m) => slateDay(kickoffMs(m)) === slateDate).map(kickoffMs));
  const key = `lb:${slateDate}`;
  if (done(l, key)) return null;
  if (now >= firstKickoff - LEADERBOARD_LEAD_MIN * MIN && now < firstKickoff) return { key, firstKickoff };
  return null;
}
/** The games-of-the-day bundle: due once per matchday, ~3.5h before its first
 *  kickoff. Returns that matchday's not-yet-kicked-off games, or null. */
function bundleDue(matches: Match[], now: number, l: Ledger): { key: string; games: Match[] } | null {
  const future = matches.filter((m) => kickoffMs(m) > now).sort((a, b) => kickoffMs(a) - kickoffMs(b));
  if (!future.length) return null;
  const today = slateDay(kickoffMs(future[0]));
  const firstKickoff = Math.min(...future.filter((m) => slateDay(kickoffMs(m)) === today).map(kickoffMs));
  const key = `bundle:${today}`;
  if (done(l, key)) return null;
  if (now >= firstKickoff - BUNDLE_LEAD_MIN * MIN && now < firstKickoff) {
    const games = matches.filter((m) => m.status === "NS" && kickoffMs(m) > now && slateDay(kickoffMs(m)) === today);
    return { key, games };
  }
  return null;
}

// ── Captions (house style: no em-dashes, no hashtags, exact CTA) ────────────--
function selectionPhrase(rec: any): string {
  const mt = String(rec.marketType ?? "").toLowerCase();
  const sel = String(rec.selection ?? "");
  if (mt === "totals") return `${sel} ${rec.line} goals`;
  if (mt === "btts") return sel.toLowerCase() === "yes" ? "both teams to score" : "both teams not to score";
  if (mt === "moneyline") {
    const s = sel.toLowerCase();
    if (s === "home") return `${rec.home} to win`;
    if (s === "away") return `${rec.away} to win`;
    if (s === "draw") return "the draw";
  }
  return `${sel}${rec.line != null ? ` ${rec.line}` : ""}`;
}
const sign = (n: number) => (n >= 0 ? "+" : "");
const pct = (x: number) => `${Math.round(x * 100)}%`;

function consensusCaption(rec: any): string {
  return [
    `*Market vs Agents · ${flagFor(rec.homeCode)} ${rec.home} v ${rec.away} ${flagFor(rec.awayCode)}*`,
    `The swarm of ${rec.agentsTotal} AI models prices ${selectionPhrase(rec)} at ${pct(rec.consensus)} vs the market's ${pct(rec.marketPrice)} (${sign(rec.edgePp)}${rec.edgePp}pp edge).`,
    `${rec.agentsN} of ${rec.agentsTotal} agents are positioned on it.${rec.kickoff ? ` Kickoff ${rec.kickoff}.` : ""}`,
    CTA,
  ].join("\n");
}
function resultCaption(rec: any): string {
  return [
    `*${flagFor(rec.homeCode)} ${rec.home} ${rec.homeScore}-${rec.awayScore} ${rec.away} ${flagFor(rec.awayCode)} · full time*`,
    `The swarm backed ${selectionPhrase(rec)} and it ${rec.hit ? "hit" : "missed"}: ${sign(rec.totalPnl)}$${Math.round(Math.abs(rec.totalPnl))} across ${rec.agentsN} of ${rec.agentsTotal} agents.`,
    CTA,
  ].join("\n");
}
function leaderboardCaption(): string {
  return [
    `*Swarm Arena leaderboard · The Agents World Cup*`,
    `${8} AI models, one $1,000 book each. Here is where they stand right now.`,
    CTA,
  ].join("\n");
}
/** The #1 agent's spotlight caption — fired alongside the leaderboard. Reads
 *  the deck agent's own fields (no identity import needed; the adapter already
 *  resolves `short`/`provider`). Honest about a small/negative book. */
function topAgentCaption(a: any): string {
  const name = a.short ?? a.label ?? a.handle;
  const provider = a.provider ? ` (${a.provider})` : "";
  const base = a.spark?.[0] ?? 1000;
  const equity = a.spark?.[a.spark.length - 1] ?? base * (1 + (a.roiPct ?? 0) / 100);
  const pnl = equity - base;
  const roi = Number(a.roiPct ?? 0);
  const roiStr = `${roi >= 0 ? "+" : "-"}${Math.abs(roi).toFixed(2).replace(/\.?0+$/, "")}%`;
  const pnlStr = `${pnl >= 0 ? "+" : "-"}$${Math.round(Math.abs(pnl))}`;
  return [
    `*Top agent · ${name} leads the Swarm Arena*`,
    `${name}${provider} is out front of all 8 AI models right now: ${roiStr} ROI, ${pnlStr} on its $1,000 book.`,
    CTA,
  ].join("\n");
}

// ISO-2 country code → flag emoji. Flags are the ONLY emoji used in X drafts.
function flagFor(code: string): string {
  const c = String(code ?? "").toUpperCase();
  if (c === "GB" || c === "EN") return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (c === "GB-SCT") return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (!/^[A-Z]{2}$/.test(c)) return "";
  return String.fromCodePoint(...[...c].map((ch) => 0x1f1e6 + (ch.charCodeAt(0) - 65)));
}
// X-draft call-to-action, varied per game so a bundle doesn't read repetitively.
const SWARM_CTAS = [
  "Follow the agents on swarmarena.ai",
  "See how the agents are trading on swarmarena.ai",
  "Track the agents live on swarmarena.ai",
  "Watch it play out on swarmarena.ai",
];

type Agreement = { top: any; n: number; others: number; total: number };
/** For one game: the top pick, plus how the agents lined up on that market —
 *  `n` took the pick, `others` took a different side of the same market/line. */
function gameAgreement(records: any[], m: Match): Agreement | null {
  const h = m.home_team.toLowerCase();
  const a = m.away_team.toLowerCase();
  const mine = records.filter((r) => {
    const g = String(r.game ?? "").toLowerCase();
    return g.includes(h) && g.includes(a);
  });
  if (!mine.length) return null;
  const top = [...mine].sort((x, y) => y.edgePp - x.edgePp)[0];
  const others = mine
    .filter((r) => r.marketType === top.marketType && (r.line ?? null) === (top.line ?? null) && r.selection !== top.selection)
    .reduce((s, r) => s + (Number(r.agentsN) || 0), 0);
  return { top, n: Number(top.agentsN) || 0, others, total: Number(top.agentsTotal) || 8 };
}

/** One game's X post: flag + teams, an agreement-aware line, a varied CTA.
 *  No em-dash, no emoji except the country flags, no filler. */
function gameTweet(ag: Agreement, ctaIdx: number): string {
  const { top, n, others, total } = ag;
  const pick = selectionPhrase(top);
  const cons = pct(top.consensus);
  const mkt = pct(top.marketPrice);
  let body: string;
  if (n >= total) {
    body = `All ${total} AI models agree on ${pick}: ${cons} vs the market's ${mkt}.`;
  } else if (Math.min(n, others) >= 3) {
    body = `The models are split, ${n} on ${pick} and ${others} the other way: ${cons} vs the market's ${mkt}.`;
  } else if (n === 1) {
    body = `Just 1 of ${total} models is on ${pick}, at ${cons} vs the market's ${mkt}.`;
  } else {
    body = `${n} of ${total} models back ${pick}, ${cons} vs the market's ${mkt} (${sign(top.edgePp)}${top.edgePp}pp edge).`;
  }
  const title = `${flagFor(top.homeCode)} ${top.home} vs ${flagFor(top.awayCode)} ${top.away}`.replace(/\s{2,}/g, " ").trim();
  return [title, body, SWARM_CTAS[ctaIdx % SWARM_CTAS.length]].join("\n");
}

// Team name → ISO-2 code (mirrors the card engine / swarm-consensus map), so we
// can flag the games the agents sit out (those have no consensus record/code).
const TEAM_CODE: Record<string, string> = {
  Mexico: "MX", "South Africa": "ZA", "South Korea": "KR", "Czech Republic": "CZ",
  Canada: "CA", "Bosnia-Herzegovina": "BA", USA: "US", "United States": "US",
  Paraguay: "PY", Qatar: "QA", Switzerland: "CH", Brazil: "BR", France: "FR",
  Argentina: "AR", England: "GB", Spain: "ES", Germany: "DE", Portugal: "PT",
  Netherlands: "NL", Belgium: "BE", Croatia: "HR", Morocco: "MA", Japan: "JP",
  Uruguay: "UY", Colombia: "CO", Senegal: "SN", Denmark: "DK", Australia: "AU",
  Ecuador: "EC", Ghana: "GH", Norway: "NO", Iran: "IR", "New Zealand": "NZ",
  "Saudi Arabia": "SA", "Cape Verde": "CV", Iraq: "IQ", Algeria: "DZ", Jordan: "JO",
  Austria: "AT", Uzbekistan: "UZ", "Congo DR": "CD", "DR Congo": "CD", Panama: "PA",
  Haiti: "HT", Scotland: "GB-SCT", Tunisia: "TN", Sweden: "SE", Turkey: "TR",
  "Ivory Coast": "CI", "Curaçao": "CW", Curacao: "CW", Egypt: "EG", Poland: "PL", Bahrain: "BH",
};
const nameFlag = (name: string) => flagFor(TEAM_CODE[name] ?? "");

/** A 'no model is on this' draft for a game the agents took zero position on. */
function sittingOutTweet(m: Match, ctaIdx: number): string {
  const title = `${nameFlag(m.home_team)} ${m.home_team} vs ${nameFlag(m.away_team)} ${m.away_team}`.replace(/\s{2,}/g, " ").trim();
  return [title, "None of the 8 AI models are positioned on this game, the swarm is staying out.", SWARM_CTAS[ctaIdx % SWARM_CTAS.length]].join("\n");
}

// ── Feed lookup (mirror the render scripts' --top pick so caption == card) ───--
function topRecord(feedFile: string, m: Match, kind: "consensus" | "result"): any | null {
  if (!fs.existsSync(feedFile)) return null;
  const recs: any[] = JSON.parse(fs.readFileSync(feedFile, "utf8")).records ?? [];
  const h = m.home_team.toLowerCase();
  const a = m.away_team.toLowerCase();
  const matched = recs.filter((r) => {
    const g = String(r.game ?? "").toLowerCase();
    return g.includes(h) && g.includes(a);
  });
  if (!matched.length) return null;
  const by = kind === "consensus" ? (r: any) => r.edgePp : (r: any) => r.totalPnl;
  return [...matched].sort((x, y) => by(y) - by(x))[0];
}

// ── Shell + output collection ───────────────────────────────────────────────
async function sh(cmd: string[]): Promise<boolean> {
  const r = await $`${cmd}`.nothrow();
  if (r.exitCode !== 0) {
    console.error(`  ! \`${cmd.join(" ")}\` exited ${r.exitCode}`);
    return false;
  }
  return true;
}
function collectOutputs(dir: string): { png?: string; mp4?: string } {
  if (!fs.existsSync(dir)) return {};
  const files = fs.readdirSync(dir);
  const png = files.find((f) => f.endsWith(".png"));
  const mp4 = files.find((f) => f.endsWith(".mp4"));
  return { png: png && path.join(dir, png), mp4: mp4 && path.join(dir, mp4) };
}

// ── Audio mux ───────────────────────────────────────────────────────────────
// Add a music track to a rendered (silent) MP4: copy the video, encode the
// audio to aac, cut to the video length. Isolated to the cron — the shared
// compositions and render scripts stay muted and untouched.
let _ffmpeg: { bin: string; env: Record<string, string> } | null | undefined;
function resolveFfmpeg(): { bin: string; env: Record<string, string> } | null {
  if (_ffmpeg !== undefined) return _ffmpeg;
  const sys = Bun.which("ffmpeg");
  if (sys) return (_ffmpeg = { bin: sys, env: {} });
  // Fall back to the ffmpeg bundled in Remotion's compositor (needs its sibling
  // shared libs on the loader path).
  const base = path.join(process.cwd(), "node_modules", "@remotion");
  const dir = fs.existsSync(base)
    ? fs.readdirSync(base).find((d) => d.startsWith("compositor-") && fs.existsSync(path.join(base, d, "ffmpeg")))
    : undefined;
  if (!dir) return (_ffmpeg = null);
  const full = path.join(base, dir);
  const key = process.platform === "darwin" ? "DYLD_FALLBACK_LIBRARY_PATH" : "LD_LIBRARY_PATH";
  return (_ffmpeg = { bin: path.join(full, "ffmpeg"), env: { [key]: full } });
}
async function muxAudio(mp4: string, audio: string): Promise<void> {
  if (!fs.existsSync(mp4) || !fs.existsSync(audio)) return;
  const ff = resolveFfmpeg();
  if (!ff) {
    console.warn("  ! no ffmpeg available — leaving card silent");
    return;
  }
  const tmp = mp4.replace(/\.mp4$/, ".aud.mp4");
  const r = await $`${ff.bin} -y -hide_banner -loglevel error -i ${mp4} -i ${audio} -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -shortest ${tmp}`
    .env({ ...process.env, ...ff.env })
    .nothrow();
  if (r.exitCode !== 0) {
    console.error(`  ! audio mux failed for ${path.basename(mp4)} (exit ${r.exitCode})`);
    return;
  }
  fs.renameSync(tmp, mp4);
}

// ── Slack ─────────────────────────────────────────────────────────────────--
async function slackMessage(token: string, channel: string, text: string): Promise<void> {
  const j: any = await (
    await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ channel, text, unfurl_links: false, unfurl_media: false }),
    })
  ).json();
  if (!j.ok) throw new Error(`chat.postMessage failed: ${j.error}`);
}
async function postXDraft(token: string, caption: string) {
  await slackMessage(token, CHANNEL, `X draft (copy):\n\`\`\`\n${caption}\n\`\`\``);
}

// ── Card pipeline ───────────────────────────────────────────────────────────
const uidSlug = (uid: string) => uid.replace(/[^a-z0-9]+/gi, "-");

/** Render + post one consensus/result card. Returns true if a card was posted. */
async function fireGameCard(
  phase: Phase,
  m: Match,
  cfg: SlackConfig | null,
  l: Ledger,
): Promise<boolean> {
  const kind = phase === "pregame" ? "consensus" : "result";
  const feed = phase === "pregame" ? CONSENSUS_FEED : RESULTS_FEED;
  const renderScript = phase === "pregame" ? "render-consensus.ts" : "render-results.ts";
  const game = `${m.home_team} vs ${m.away_team}`;
  const label = `${phase === "pregame" ? "Pre-game" : "Result"} card · ${nameFlag(m.home_team)} ${m.home_team} vs ${m.away_team} ${nameFlag(m.away_team)}`;

  const rec = topRecord(feed, m, kind);
  if (!rec) {
    // Result cards are wins-only: a card needs a winning swarm pick in the
    // freshly-built feed. When there's none for a scheduled post-game, tell
    // apart a transient settle lag from the terminal case (the game is settled
    // and the swarm simply had no winning pick — it lost those markets, or
    // never traded it). Within the grace window we genuinely retry; past it we
    // record the game as resolved so the cron stops retrying every tick for 24h
    // and the give-up is logged honestly instead of the misleading "yet" + a
    // silent drop. Forced/pre-game runs keep the old behavior (no ledger write).
    if (phase === "postgame") {
      const sinceKickoffMin = (Date.now() - kickoffMs(m)) / MIN;
      if (sinceKickoffMin >= POSTGAME_SETTLE_GRACE_MIN) {
        console.log(`  · ${game}: FT and settled, but the swarm has no winning pick on it — no result card${FORCE_POST ? "" : " (recording as resolved; won't retry)"}.`);
        // Record terminal resolution so the cron stops retrying every tick (the
        // give-up is now explicit, not silent). Forced manual runs never touch
        // the ledger, so testing can't block a real scheduled post.
        if (!FORCE_POST) l.actions[`${m.match_uid}:postgame`] = { postedAt: new Date().toISOString(), note: "resolved: no winning swarm pick" };
        return false;
      }
      console.log(`  · ${game}: no winning swarm pick in the results feed yet — within settle grace (${Math.round(sinceKickoffMin)}m since kickoff), will retry.`);
      return false;
    }
    console.log(`  · ${game}: no ${kind} coverage from the agents yet — skipping (will retry).`);
    return false;
  }

  const outDir = path.join(OUT_ROOT, `${phase}-${uidSlug(m.match_uid)}`);
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log(`  → rendering ${kind} card: ${game}`);
  const ok = await sh(["bun", `scripts/${renderScript}`, `--game=${game}`, `--out=${outDir}`]);
  if (!ok) return false;

  const { png, mp4 } = collectOutputs(outDir);
  if (!png && !mp4) {
    console.error(`  ✗ ${game}: render produced no files.`);
    return false;
  }
  if (mp4) await muxAudio(mp4, phase === "postgame" ? AUDIO_RESULT : AUDIO_GAME);
  const caption = phase === "pregame" ? consensusCaption(rec) : resultCaption(rec);

  if (!cfg) {
    console.log(`  ✓ ${game}: rendered (no Slack post). ${mp4 ?? png}`);
    return true;
  }
  const slug = `${phase}-${rec.homeCode ?? ""}-${rec.awayCode ?? ""}`.toLowerCase();
  const res = await postCardToSlack(cfg, { slug } as any, { png, mp4 }, `${label}\nSave the MP4 for Reels/TikTok. X draft below.`);
  await postXDraft(cfg.token, caption);
  console.log(`  ⤴ ${game}: posted ${res.permalink ?? "(ok)"}`);
  l.actions[`${m.match_uid}:${phase}`] = { postedAt: new Date().toISOString(), permalink: res.permalink };
  return true;
}

/** Render + post the leaderboard card. */
async function fireLeaderboard(key: string, cfg: SlackConfig | null, l: Ledger): Promise<boolean> {
  const outDir = path.join(OUT_ROOT, "leaderboard");
  fs.rmSync(outDir, { recursive: true, force: true });
  // Refresh the live deck from R2 first. generate-swarm-cards reads it via
  // --deck; without this it falls back to the sample fixtures (the USA/China
  // demo roster) — exactly the stale-data bug we hit on the first post.
  console.log("  → refreshing live deck from R2…");
  await sh(["bun", "scripts/swarm-adapter.ts"]);
  const deck = fs.existsSync(LIVE_DECK) ? JSON.parse(fs.readFileSync(LIVE_DECK, "utf8")) : null;
  if (!deck?.agents?.length) {
    console.error("  ✗ leaderboard: live deck has no agents — skipping (refusing to post sample data).");
    return false;
  }
  console.log(`  → rendering leaderboard card (${deck.agents.length} live agents)`);
  const ok = await sh(["bun", "scripts/generate-swarm-cards.ts", "--card=leaderboard", "--mp4", `--deck=${LIVE_DECK}`, `--out=${outDir}`]);
  if (!ok) return false;
  const { png, mp4 } = collectOutputs(outDir);
  if (!png && !mp4) {
    console.error("  ✗ leaderboard: render produced no files.");
    return false;
  }
  if (mp4) await muxAudio(mp4, AUDIO_LEADERBOARD);
  if (cfg) {
    const res = await postCardToSlack(cfg, { slug: "leaderboard-model" } as any, { png, mp4 }, "Leaderboard · Swarm Arena\nSave the MP4 for Reels/TikTok. X draft below.");
    await postXDraft(cfg.token, leaderboardCaption());
    console.log(`  ⤴ leaderboard: posted ${res.permalink ?? "(ok)"}`);
    l.actions[key] = { postedAt: new Date().toISOString(), permalink: res.permalink };
  } else {
    console.log(`  ✓ leaderboard: rendered (no Slack post). ${mp4 ?? png}`);
  }
  // The #1 agent's performance card, fired alongside the leaderboard (same
  // deck, same tick). Best-effort: a failure here is logged but never undoes
  // the leaderboard post above or its ledger entry.
  try {
    await fireTopAgent(deck, cfg);
  } catch (e) {
    console.error(`  ✗ top agent: ${(e as Error).message}`);
  }
  // The matchday card (today's slate, the swarm's pick per game), fired
  // alongside the leaderboard. Best-effort: a failure never undoes the
  // leaderboard post above or its ledger entry.
  try {
    await fireMatchday(cfg);
  } catch (e) {
    console.error(`  ✗ matchday: ${(e as Error).message}`);
  }
  return true;
}

/** Render + post the #1 agent's performance card (the model design), fired
 *  alongside the leaderboard. Reuses the deck fireLeaderboard already refreshed
 *  from R2, picks the top agent by ROI (same rank the leaderboard uses, after
 *  the same dedupe-by-handle), renders just that handle's card, muxes the
 *  victory jingle, and posts the MP4 + PNG with an X draft. */
async function fireTopAgent(deck: any, cfg: SlackConfig | null): Promise<void> {
  const seen = new Set<string>();
  const unique: any[] = (deck?.agents ?? []).filter((a: any) => (seen.has(a.handle) ? false : (seen.add(a.handle), true)));
  const top = [...unique].sort((a, b) => (b.roiPct ?? 0) - (a.roiPct ?? 0))[0];
  if (!top) {
    console.log("  · top agent: deck has no agents — skipping.");
    return;
  }
  const name = top.short ?? top.label ?? top.handle;
  const slug = `model-${String(top.handle).toLowerCase()}`;
  const outDir = path.join(OUT_ROOT, "top-agent");
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log(`  → rendering top-agent card: ${name} (${slug})`);
  const ok = await sh(["bun", "scripts/generate-swarm-cards.ts", "--card=model", `--slug=${slug}`, "--mp4", `--deck=${LIVE_DECK}`, `--out=${outDir}`]);
  if (!ok) return;
  const { png, mp4 } = collectOutputs(outDir);
  if (!png && !mp4) {
    console.error("  ✗ top agent: render produced no files.");
    return;
  }
  if (mp4) await muxAudio(mp4, AUDIO_LEADERBOARD);
  if (!cfg) {
    console.log(`  ✓ top agent: rendered (no Slack post). ${mp4 ?? png}`);
    return;
  }
  const res = await postCardToSlack(cfg, { slug } as any, { png, mp4 }, `Top agent · ${name} leads Swarm Arena\nSave the MP4 for Reels/TikTok. X draft below.`);
  await postXDraft(cfg.token, topAgentCaption(top));
  console.log(`  ⤴ top agent: posted ${res.permalink ?? "(ok)"}`);
}

/** Render + post the matchday card — today's slate with the swarm's
 *  highest-consensus pick per game — fired alongside the leaderboard. Builds its
 *  own data from R2 (today's upcoming games + agent positions). Best-effort;
 *  renders nothing when no game has swarm coverage (honest-data rule). */
async function fireMatchday(cfg: SlackConfig | null): Promise<void> {
  const outDir = path.join(OUT_ROOT, "matchday");
  fs.rmSync(outDir, { recursive: true, force: true });
  console.log("  → rendering matchday card (today's slate)…");
  const ok = await sh(["bun", "scripts/render-matchday.ts", `--out=${outDir}`]);
  if (!ok) {
    console.log("  · matchday: no card (no covered games today, or render failed).");
    return;
  }
  const { png, mp4 } = collectOutputs(outDir);
  if (!png && !mp4) {
    console.error("  ✗ matchday: render produced no files.");
    return;
  }
  if (mp4) await muxAudio(mp4, AUDIO_MATCHDAY);
  if (!cfg) {
    console.log(`  ✓ matchday: rendered (no Slack post). ${mp4 ?? png}`);
    return;
  }
  const res = await postCardToSlack(
    cfg,
    { slug: "matchday" } as any,
    { png, mp4 },
    "Today's matchday · the swarm's picks\nSave the MP4 for Reels/TikTok.",
  );
  console.log(`  ⤴ matchday: posted ${res.permalink ?? "(ok)"}`);
}

// ── Games-of-the-day bundle ─────────────────────────────────────────────────
/** Upload one file via Slack's external-upload flow; returns {id,title}. */
async function uploadFile(token: string, filePath: string): Promise<{ id: string; title: string }> {
  const bytes = fs.readFileSync(filePath);
  const filename = path.basename(filePath);
  const reserve: any = await (
    await fetch(`https://slack.com/api/files.getUploadURLExternal?${new URLSearchParams({ filename, length: String(bytes.byteLength) })}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json();
  if (!reserve.ok) throw new Error(`getUploadURLExternal: ${reserve.error}`);
  const put = await fetch(reserve.upload_url, { method: "POST", body: bytes });
  if (!put.ok) throw new Error(`upload PUT ${filename}: HTTP ${put.status}`);
  return { id: reserve.file_id, title: filename };
}

/** Share files into the channel. Slack caps completeUploadExternal at 10 files
 *  per message, so chunk into batches; the caption rides the first batch. */
async function postBundle(token: string, channel: string, filePaths: string[], caption: string): Promise<void> {
  const existing = filePaths.filter((p) => fs.existsSync(p));
  if (!existing.length) throw new Error("no files to bundle");
  const CHUNK = 10;
  for (let i = 0; i < existing.length; i += CHUNK) {
    const files: { id: string; title: string }[] = [];
    for (const p of existing.slice(i, i + CHUNK)) files.push(await uploadFile(token, p));
    const res: any = await (
      await fetch("https://slack.com/api/files.completeUploadExternal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          files: JSON.stringify(files),
          channel_id: channel,
          initial_comment: i === 0 ? caption : "Today's games, continued.",
        }),
      })
    ).json();
    if (!res.ok) throw new Error(`completeUploadExternal: ${res.error}`);
  }
}

/** Render a card for EVERY market the agents touched on each covered game (top
 *  selection of each market type), post all MP4s, then the X drafts. One game
 *  with btts + totals consensus yields two cards. Returns the card count. */
async function renderBundle(games: Match[], cfg: SlackConfig | null): Promise<number> {
  console.log("→ building consensus feed…");
  await sh(["bun", "scripts/swarm-consensus.ts"]);
  const records: any[] = fs.existsSync(CONSENSUS_FEED) ? JSON.parse(fs.readFileSync(CONSENSUS_FEED, "utf8")).records ?? [] : [];

  const lines: string[] = [];
  const tweets: string[] = [];
  const selected: any[] = []; // one record per (covered game x market type), in game order
  const sittingOut: Match[] = [];
  for (const m of games) {
    const ag = gameAgreement(records, m);
    if (!ag) {
      console.log(`  · ${m.home_team} vs ${m.away_team}: no agent position — drafting a 'staying out' post`);
      sittingOut.push(m);
      continue;
    }
    // Every market type the agents touched, top-edge selection of each.
    const mine = records.filter((r) => {
      const g = String(r.game ?? "").toLowerCase();
      return g.includes(m.home_team.toLowerCase()) && g.includes(m.away_team.toLowerCase());
    });
    const byMkt = new Map<string, any>();
    for (const r of mine) {
      const cur = byMkt.get(r.marketType);
      if (!cur || r.edgePp > cur.edgePp) byMkt.set(r.marketType, r);
    }
    const picks = [...byMkt.values()];
    selected.push(...picks);
    console.log(`  • ${m.home_team} v ${m.away_team}: ${picks.length} market(s) (${picks.map((p) => p.marketType).join(", ")})`);
    lines.push(`• ${flagFor(ag.top.homeCode)} ${m.home_team} v ${m.away_team} ${flagFor(ag.top.awayCode)}: ${selectionPhrase(ag.top)} (swarm ${pct(ag.top.consensus)} vs market ${pct(ag.top.marketPrice)}, ${sign(ag.top.edgePp)}${ag.top.edgePp}pp)`);
    tweets.push(gameTweet(ag, tweets.length));
  }

  if (!selected.length) {
    console.log("No covered games to bundle.");
    return 0;
  }

  // Render every selected market card in ONE Remotion bundle, via a curated feed.
  const outDir = path.join(OUT_ROOT, "bundle");
  fs.rmSync(outDir, { recursive: true, force: true });
  fs.mkdirSync(OUT_ROOT, { recursive: true });
  const feedPath = path.join(OUT_ROOT, "bundle-feed.json");
  fs.writeFileSync(feedPath, JSON.stringify({ records: selected }));
  console.log(`→ rendering ${selected.length} market card(s) across ${tweets.length} game(s)…`);
  await sh(["bun", "scripts/render-consensus.ts", "--all", `--feed=${feedPath}`, `--out=${outDir}`]);

  // Collect every rendered MP4 (sorted = grouped by game slug). Robust to
  // whatever slug render-consensus uses.
  const mp4s = fs.readdirSync(outDir).filter((f) => f.endsWith(".mp4")).sort().map((f) => path.join(outDir, f));
  if (!mp4s.length) {
    console.log("Render produced no MP4s.");
    return 0;
  }
  // Every bundle card is a pre-game game card → the 'decisive moment' track.
  for (const mp4 of mp4s) await muxAudio(mp4, AUDIO_GAME);

  // A 'staying out' draft for each game the agents took no position on.
  for (const m of sittingOut) tweets.push(sittingOutTweet(m, tweets.length));

  const caption = [`*Today's games · Swarm Arena · Market vs Agents*`, `${mp4s.length} cards across today's slate, every market the agents are trading:`, ...lines, CTA].join("\n");
  // Second message: one X-draft per game (top market), stacked in copy blocks.
  const xText = "Today's games, X drafts (one per game):\n\n" + tweets.map((t) => "```\n" + t + "\n```").join("\n\n");
  if (!cfg) {
    console.log(`Rendered ${mp4s.length} card(s), not posting.\n\nBUNDLE CAPTION:\n${caption}\n\nX DRAFTS:\n${xText}`);
    return mp4s.length;
  }
  await postBundle(cfg.token, cfg.channelId, mp4s, caption);
  await slackMessage(cfg.token, cfg.channelId, xText);
  console.log(`  ⤴ posted bundle (${mp4s.length} MP4s) + X-draft message (${tweets.length} posts)`);
  return mp4s.length;
}

/** Scheduled games-of-the-day: render+post the bundle, then record it so it
 *  fires once per matchday. */
async function fireBundle(key: string, games: Match[], cfg: SlackConfig | null, l: Ledger): Promise<void> {
  const n = await renderBundle(games, cfg);
  if (n > 0 && cfg) l.actions[key] = { postedAt: new Date().toISOString(), note: `${n} games` };
}

/** Manual (--bundle-today): bundle today's covered upcoming games, ignore timing. */
async function bundleToday(): Promise<void> {
  const now = Date.now();
  const matches = await fetchMatches();
  const today = slateDay(now);
  const games = matches.filter((m) => m.status === "NS" && kickoffMs(m) > now && slateDay(kickoffMs(m)) === today);
  console.log(`[bundle] ${today} matchday · ${games.length} upcoming game(s)`);
  if (!games.length) {
    console.log("No upcoming games in today's matchday. Nothing to bundle.");
    return;
  }
  const token = slackTokenFromEnv();
  const cfg: SlackConfig | null = token && CHANNEL && !NO_SLACK ? { token, channelId: CHANNEL } : null;
  if (!cfg) console.log("(Slack token/channel not set or --no-slack — rendering only, not posting.)");
  await renderBundle(games, cfg);
}

/** Manual (--force-matchday): render + post just the matchday card, ignore timing/ledger. */
async function forceMatchday(): Promise<void> {
  const token = slackTokenFromEnv();
  const cfg: SlackConfig | null = token && CHANNEL && !NO_SLACK ? { token, channelId: CHANNEL } : null;
  if (!cfg) console.log("(Slack token/channel not set or --no-slack — rendering only, not posting.)");
  await fireMatchday(cfg);
}

// ── Main tick ───────────────────────────────────────────────────────────────
async function main() {
  if (BUNDLE_TODAY) return bundleToday();
  if (FORCE_MATCHDAY) return forceMatchday();

  const now = Date.now();
  const matches = await fetchMatches();
  const ledger = loadLedger();

  // Forced paths (manual testing) bypass timing + ledger entirely.
  const forced = FORCE_PRE || FORCE_POST || FORCE_LB;

  // Pre-game is now a single daily "games of the day" bundle (bundleDue), not
  // one post per game. --force-pregame still renders ONE consensus card for testing.
  const pre = FORCE_PRE
    ? matches.filter((m) => `${m.home_team} vs ${m.away_team}`.toLowerCase().includes(FORCE_PRE.toLowerCase()))
    : [];
  const post = forced
    ? FORCE_POST
      ? matches.filter((m) => `${m.home_team} vs ${m.away_team}`.toLowerCase().includes(FORCE_POST.toLowerCase()))
      : []
    : matches.filter((m) => postgameDue(m, now, ledger));
  const lb = forced ? (FORCE_LB ? { key: `lb:${slateDay(now)}`, firstKickoff: now } : null) : leaderboardDue(matches, now, ledger);
  const bundle = forced ? null : bundleDue(matches, now, ledger);

  console.log(
    `[swarm-auto] ${new Date(now).toISOString()} · ${matches.length} matches in window · ` +
      `due: ${bundle ? bundle.games.length : 0}-game bundle, ${pre.length} pregame, ${post.length} postgame, ${lb ? 1 : 0} leaderboard${forced ? " (FORCED)" : ""}`,
  );
  if (bundle) console.log(`   games-of-the-day bundle (${bundle.key}, ${bundle.games.length} games)`);
  for (const m of pre) console.log(`   pregame  → ${m.home_team} vs ${m.away_team}`);
  for (const m of post) console.log(`   postgame → ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}  (${m.status})`);
  if (lb) console.log(`   leaderboard (${lb.key})`);

  // Machine-readable signal for the CI gate (lets no-op ticks skip the heavy
  // apt + Chromium + render steps). Printed on every run; parsed only by the
  // workflow's --dry-run gate step.
  console.log(`gate-due=${(bundle ? 1 : 0) + pre.length + post.length + (lb ? 1 : 0)}`);

  if (!bundle && !pre.length && !post.length && !lb) {
    console.log("Nothing due. Exiting.");
    return;
  }
  if (DRY) {
    console.log("--dry-run: not building, rendering, or posting.");
    return;
  }

  // Build feeds once per tick (cheap: R2 + DB reads, no Remotion bundle). The
  // bundle builds the consensus feed itself; this covers --force-pregame.
  if (pre.length) {
    console.log("→ building consensus feed…");
    await sh(["bun", "scripts/swarm-consensus.ts"]);
  }
  if (post.length) {
    console.log("→ building results feed (self-settling open picks vs FT scores)…");
    await sh(["bun", "scripts/swarm-results.ts", "--settle-open"]);
  }

  const token = slackTokenFromEnv();
  const cfg: SlackConfig | null = token && CHANNEL && !NO_SLACK ? { token, channelId: CHANNEL } : null;
  if (!cfg) console.log("(Slack token/channel not set or --no-slack — rendering only, not posting.)");

  // Guard each fire so one card's failure (a bad render, a Slack hiccup) is
  // logged but never aborts the rest of the tick or the ledger save.
  const guard = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn();
    } catch (e) {
      console.error(`  ✗ ${label}: ${(e as Error).message}`);
    }
  };
  if (bundle) await guard("games-of-the-day bundle", () => fireBundle(bundle.key, bundle.games, cfg, ledger));
  for (const m of pre) await guard(`pregame ${m.home_team} v ${m.away_team}`, () => fireGameCard("pregame", m, cfg, ledger));
  for (const m of post) await guard(`postgame ${m.home_team} v ${m.away_team}`, () => fireGameCard("postgame", m, cfg, ledger));
  if (lb) await guard("leaderboard", () => fireLeaderboard(lb.key, cfg, ledger));

  saveLedger(ledger);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
