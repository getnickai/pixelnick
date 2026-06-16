/**
 * Shared Engine-side mapping from live deck agents (EngineAgent) to the Design
 * model card's props (SwarmArenaModelCardData) — used by every Swarm Arena
 * engine surface (kit, history). Keeps the deck→card translation in one place
 * so the surfaces can't drift.
 */
import type { SwarmArenaModelCardData } from "@/components/swarm-arena-model-card";
import type { SwarmArenaLeaderboardCardData } from "@/components/swarm-arena-leaderboard-card";
import { identityFor } from "@/data/swarm-identity";
import type { EngineAgent } from "@/data/swarm-output";

/** Native size of the Design model card (components/swarm-arena-model-card). */
export const MODEL_CARD_W = 650;
export const MODEL_CARD_H = 1110;

export const MODELS_ASSET = "/swarm-arena-cards/assets/models";
/** Handles with a monochrome mark on disk; others fall back to a monogram. */
export const MODEL_LOGOS: Record<string, string> = {
  GPT: "chatgpt",
  CLAUDE: "claude",
  GEMINI: "google",
  KIMI: "kimi",
  GROK: "grok",
  DEEPSEEK: "deepseek",
  MISTRAL: "mistral",
  QWEN: "qwen",
};

/**
 * Build a self-explanatory one-line bet sentence from a position's game + side.
 * The agent feed puts the fixture in `market` ("Germany v Curacao") and the bet
 * in `side` ("BACK Yes @ 0.33"); on its own "BACK Yes" doesn't say what "Yes"
 * means, so we name the game and humanize the selection:
 *   "Germany v Curacao" + "BACK Yes @ 0.33"      → { text: "Germany vs Curacao, back both teams to score at:", price: "0.33" }
 *   "Germany v Curacao" + "BACK Germany @ 0.30"  → { text: "Germany vs Curacao, back Germany at:",            price: "0.30" }
 *   "Germany v Curacao" + "BACK Over 2.5 @ 0.30" → { text: "Germany vs Curacao, back more than 2.5 goals at:", price: "0.30" }
 * The sentence is left-aligned, the price right-aligned in its own column.
 * Market type is inferred from the selection (Yes/No = both-teams-to-score,
 * Over/Under = totals, anything else = a team/moneyline name printed as-is).
 * Returns null when there's no real pick.
 */
export function toPick(game: string | undefined, side: string | undefined): { text: string; price: string } | null {
  if (!side || side === "—") return null;
  const m = side.match(/^\s*(BACK|LAY)\s+(.+?)\s+@\s+([\d.]+)\s*$/i);
  if (!m) return { text: side, price: "—" }; // unknown shape — print verbatim
  const dir = m[1].toLowerCase();
  const sel = m[2].trim();
  const price = m[3];
  const over = sel.match(/^over\s+([\d.]+)/i);
  const under = sel.match(/^under\s+([\d.]+)/i);
  let bet: string;
  if (/^yes$/i.test(sel)) bet = "both teams to score";
  else if (/^no$/i.test(sel)) bet = "both teams not to score";
  else if (over) bet = `more than ${over[1]} goals`;
  else if (under) bet = `fewer than ${under[1]} goals`;
  else bet = sel.toUpperCase(); // team / moneyline selection — capitalize the team name
  // The feed (mis)uses `market` for the fixture; only prepend it when it reads
  // like a matchup. Team names are uppercased; "vs" stays lowercase.
  const raw = (game ?? "").trim();
  const teams = raw.split(/\s+vs?\s+/i);
  const lead = teams.length === 2 ? `${teams[0].toUpperCase()} vs ${teams[1].toUpperCase()}, ` : "";
  return { text: `${lead}${dir} ${bet} at:`, price };
}

export function toCardData(
  a: EngineAgent,
  rank: number,
  rankOf: number,
): SwarmArenaModelCardData {
  const base = a.spark?.[0] ?? 1000;
  const equity = a.spark?.[a.spark.length - 1] ?? base * (1 + a.roiPct / 100);
  const wins = Math.round(a.signals * a.pickPct);
  const logoFile = MODEL_LOGOS[a.handle];
  const hasPick = a.pick && a.pick.side && a.pick.side !== "—";
  return {
    // Meta model name only ("Gemini", "Kimi", "GPT") — NOT the version
    // ("Gemini 3 Pro"). The design-owned registry's `short` is purpose-built
    // for this; fall back to the deck's short fields.
    name: identityFor(a.handle)?.short ?? a.short ?? a.label ?? a.handle,
    logo: logoFile ? `${MODELS_ASSET}/${logoFile}.svg` : undefined,
    monogram: a.code,
    monogramColor: a.color,
    pnlUsd: equity - base,
    profitPct: a.roiPct,
    equityUsd: equity,
    baseUsd: base,
    pickAccuracyPct: a.pickPct * 100,
    record: a.record ?? `${wins}-${Math.max(0, a.signals - wins)}`,
    rank,
    rankOf,
    topPick: hasPick ? (toPick(a.pick.market, a.pick.side) ?? undefined) : undefined,
    latestPicks: (a.recent ?? [])
      .slice(0, 3)
      .map((r) => toPick(r.market, r.side))
      .filter((p): p is { text: string; price: string } => !!p),
    // Equity curve for the background chart.
    spark: a.spark,
  };
}

/**
 * The upstream feed has produced colliding handles (two agents reporting
 * "GPT") — keep the first/higher-ranked per handle so selection and React
 * keys stay sound.
 */
export function dedupeByHandle(agents: EngineAgent[]): EngineAgent[] {
  const seen = new Set<string>();
  return agents.filter((a) => {
    if (seen.has(a.handle)) return false;
    seen.add(a.handle);
    return true;
  });
}

/**
 * Map the live deck's agents to the leaderboard card's data — dedupe colliding
 * handles, rank by ROI, and resolve each agent's name/provider/logo/colour from
 * the design-owned identity registry (same source as the model card). The
 * background spark is the leader's equity curve. Header copy is fixed editorial
 * (no live equivalent), matching the component's built-in sample.
 */
export function toLeaderboardData(
  agents: EngineAgent[],
): SwarmArenaLeaderboardCardData {
  const ranked = dedupeByHandle(agents).sort((a, b) => b.roiPct - a.roiPct);
  return {
    eyebrow: "The LLM World Cup · Leaderboard",
    title: "Which agent predicts the World Cup best?",
    subtitle:
      "8 LLMs built their trading strategy and compete live with a $1,000 real money portfolio.",
    rows: ranked.map((a, i) => {
      const logoFile = MODEL_LOGOS[a.handle];
      return {
        rank: i + 1,
        name: identityFor(a.handle)?.short ?? a.short ?? a.label ?? a.handle,
        provider: identityFor(a.handle)?.provider ?? "",
        logo: logoFile ? `${MODELS_ASSET}/${logoFile}.svg` : undefined,
        monogram: a.code,
        monogramColor: a.color,
        roiPct: a.roiPct,
      };
    }),
    spark: ranked[0]?.spark,
  };
}
