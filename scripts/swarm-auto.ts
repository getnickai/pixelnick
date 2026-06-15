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

const PREGAME_LEAD_MIN = 60; // fire on the first tick at/after kickoff − 60m
const PREGAME_FLOOR_MIN = 3; // never fire inside this many minutes of kickoff
const LEADERBOARD_LEAD_MIN = 210; // 3.5h before the slate's first kickoff
const POSTGAME_GIVEUP_HRS = 8; // stop retrying a result card this long after kickoff
const FINAL_STATUSES = new Set(["FT", "AET", "PEN", "AWD", "WO"]);

const CTA = "Try it for free now: getnick.ai";

// ── Flags ─────────────────────────────────────────────────────────────────--
const argv = process.argv.slice(2);
const DRY = argv.includes("--dry-run");
const NO_SLACK = argv.includes("--no-slack");
const forceFlag = (p: string) => argv.find((a) => a.startsWith(p))?.slice(p.length) ?? null;
const FORCE_PRE = forceFlag("--force-pregame=");
const FORCE_POST = forceFlag("--force-postgame=");
const FORCE_LB = argv.includes("--force-leaderboard");

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
const slateDay = (ms: number) => new Date(ms).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
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
    `*Market vs Agents · ${rec.home} v ${rec.away}*`,
    `The swarm of ${rec.agentsTotal} AI models prices ${selectionPhrase(rec)} at ${pct(rec.consensus)} vs the market's ${pct(rec.marketPrice)} (${sign(rec.edgePp)}${rec.edgePp}pp edge).`,
    `${rec.agentsN} of ${rec.agentsTotal} agents are positioned on it.${rec.kickoff ? ` Kickoff ${rec.kickoff}.` : ""}`,
    CTA,
  ].join("\n");
}
function resultCaption(rec: any): string {
  return [
    `*${rec.home} ${rec.homeScore}-${rec.awayScore} ${rec.away} · full time*`,
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

// ── Slack ─────────────────────────────────────────────────────────────────--
async function postXDraft(token: string, caption: string) {
  const text = `X draft (copy):\n\`\`\`\n${caption}\n\`\`\``;
  const res = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ channel: CHANNEL, text, unfurl_links: false, unfurl_media: false }),
  });
  const j: any = await res.json();
  if (!j.ok) throw new Error(`chat.postMessage failed: ${j.error}`);
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
  const label = `${phase === "pregame" ? "Pre-game" : "Result"} card · ${game}`;

  const rec = topRecord(feed, m, kind);
  if (!rec) {
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
  if (!cfg) {
    console.log(`  ✓ leaderboard: rendered (no Slack post). ${mp4 ?? png}`);
    return true;
  }
  const res = await postCardToSlack(cfg, { slug: "leaderboard-model" } as any, { png, mp4 }, "Leaderboard · Swarm Arena\nSave the MP4 for Reels/TikTok. X draft below.");
  await postXDraft(cfg.token, leaderboardCaption());
  console.log(`  ⤴ leaderboard: posted ${res.permalink ?? "(ok)"}`);
  l.actions[key] = { postedAt: new Date().toISOString(), permalink: res.permalink };
  return true;
}

// ── Main tick ───────────────────────────────────────────────────────────────
async function main() {
  const now = Date.now();
  const matches = await fetchMatches();
  const ledger = loadLedger();

  // Forced paths (manual testing) bypass timing + ledger entirely.
  const forced = FORCE_PRE || FORCE_POST || FORCE_LB;

  const pre = forced
    ? FORCE_PRE
      ? matches.filter((m) => `${m.home_team} vs ${m.away_team}`.toLowerCase().includes(FORCE_PRE.toLowerCase()))
      : []
    : matches.filter((m) => pregameDue(m, now, ledger));
  const post = forced
    ? FORCE_POST
      ? matches.filter((m) => `${m.home_team} vs ${m.away_team}`.toLowerCase().includes(FORCE_POST.toLowerCase()))
      : []
    : matches.filter((m) => postgameDue(m, now, ledger));
  const lb = forced ? (FORCE_LB ? { key: `lb:${slateDay(now)}`, firstKickoff: now } : null) : leaderboardDue(matches, now, ledger);

  console.log(
    `[swarm-auto] ${new Date(now).toISOString()} · ${matches.length} matches in window · ` +
      `due: ${pre.length} pregame, ${post.length} postgame, ${lb ? 1 : 0} leaderboard${forced ? " (FORCED)" : ""}`,
  );
  for (const m of pre) console.log(`   pregame  → ${m.home_team} vs ${m.away_team}  (kickoff ${m.scheduled_at})`);
  for (const m of post) console.log(`   postgame → ${m.home_team} ${m.home_score}-${m.away_score} ${m.away_team}  (${m.status})`);
  if (lb) console.log(`   leaderboard (${lb.key})`);

  // Machine-readable signal for the CI gate (lets no-op ticks skip the heavy
  // apt + Chromium + render steps). Printed on every run; parsed only by the
  // workflow's --dry-run gate step.
  console.log(`gate-due=${pre.length + post.length + (lb ? 1 : 0)}`);

  if (!pre.length && !post.length && !lb) {
    console.log("Nothing due. Exiting.");
    return;
  }
  if (DRY) {
    console.log("--dry-run: not building, rendering, or posting.");
    return;
  }

  // Build feeds once per tick (cheap: R2 + DB reads, no Remotion bundle).
  if (pre.length) {
    console.log("→ building consensus feed…");
    await sh(["bun", "scripts/swarm-consensus.ts"]);
  }
  if (post.length) {
    console.log("→ building results feed…");
    await sh(["bun", "scripts/swarm-results.ts"]);
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
