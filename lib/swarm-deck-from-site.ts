/**
 * Deck builder that consumes swarmarena.ai's OWN computed leaderboard
 * (`/api/leaderboard`) instead of re-deriving ROI from R2.
 *
 * Why: the cron used to recompute the leaderboard from R2 (lib/swarm-deck.ts),
 * which drifted from the public site — a different effective-snapshot pick +
 * season-bounding produced different ROIs and even a different rank order
 * (Kimi #4 on the site vs #7 from the cron). The site is the source of truth,
 * so the cards now read its numbers directly and can never drift again.
 *
 * Performance data comes from the endpoint; BRANDING (monogram, colour, logo,
 * display name, flag) stays ours — resolved from the design-owned identity
 * registry by canonical handle, exactly like swarm-deck.ts. The endpoint emits
 * the live roster slot (e.g. handle "MINIMAX", label "Mistral"); canonicalHandle
 * normalizes it to the brand handle so the logo/name resolve correctly.
 *
 * Output shape mirrors buildSwarmDeck() (agents: EngineAgent[] + match) so
 * swarm-adapter.ts writes live-deck.json identically and generate-swarm-cards.ts
 * consumes it unchanged.
 *
 * Throws on any failure (network, non-200, no live agents) so the caller can
 * fall back to the R2 deck build rather than post fabricated/empty data.
 */
import { canonicalHandle, identityFor } from "../data/swarm-identity";

const DEFAULT_API = "https://swarmarena.ai/api/leaderboard";
const FETCH_TIMEOUT_MS = 12_000;

type SitePosition = {
  market: string;
  marketType?: string | null;
  line?: number | null;
  selection: string;
  price?: number | null;
  edgePp?: number | null;
  confPct?: number | null;
  sizeUsd?: number | null;
  mtmPnlUsd?: number | null;
};
type SiteAgent = {
  handle: string;
  rank: number;
  label?: string;
  roiPct: number;
  currentValue?: number;
  realizedPnlUsd?: number | null;
  unrealizedPnlUsd?: number | null;
  wins?: number | null;
  losses?: number | null;
  pickPct?: number | null;
  signals?: number | null;
  sparkline?: number[];
  hasTraded?: boolean;
  openPositions?: SitePosition[];
};
type SiteLeaderboard = {
  seasonStart?: string;
  startingCapital?: number;
  generatedAt?: string;
  agents: SiteAgent[];
};

/** Self-contained "BACK <selection> @ <price>" string — the exact shape the card
 *  kit's toPick() parses (BACK|LAY <sel> @ <price>). Selection already carries
 *  the line for totals ("Under 2.5"); btts is "Yes"/"No"; moneyline is the team. */
function sideOf(p: SitePosition): string {
  const sel = String(p.selection ?? "").trim();
  if (!sel) return "—";
  return p.price != null && Number.isFinite(Number(p.price))
    ? `BACK ${sel} @ ${Number(p.price).toFixed(2)}`
    : `BACK ${sel}`;
}

/** Map one endpoint agent → the EngineAgent deck shape (see swarm-deck.ts). */
function toEngineAgent(a: SiteAgent): Record<string, unknown> {
  const handle = canonicalHandle(a.handle);
  const id = identityFor(handle);
  const positions = [...(a.openPositions ?? [])].sort((x, y) => (y.edgePp ?? 0) - (x.edgePp ?? 0));
  const top = positions[0];
  const base = a.sparkline?.[0] ?? 1000;
  const equity = a.currentValue ?? a.sparkline?.[a.sparkline.length - 1] ?? base * (1 + a.roiPct / 100);
  const spark = a.sparkline && a.sparkline.length >= 2 ? a.sparkline : [base, equity];
  const hasRecord = a.wins != null && a.losses != null;
  return {
    handle,
    code: id?.code ?? handle.slice(0, 3),
    short: id?.short ?? a.label ?? handle,
    label: id?.label ?? a.label ?? handle,
    provider: id?.provider ?? "",
    flag: id?.flag ?? "⚽",
    color: id?.color ?? "#10a37f",
    kind: id?.kind ?? "llm",
    roiPct: Number(a.roiPct.toFixed(2)),
    pickPct: a.pickPct != null ? Number(a.pickPct.toFixed(2)) : 0,
    signals: a.signals ?? positions.length,
    nextRun: "—",
    activeSince: "",
    spark,
    ...(hasRecord ? { record: `${a.wins}-${a.losses}` } : {}),
    pick: top
      ? { market: top.market, side: sideOf(top), edgePp: Number((top.edgePp ?? 0).toFixed(1)) }
      : { market: "No open picks", side: "—", edgePp: 0 },
    recent: positions.slice(1, 4).map((p) => ({
      market: p.market,
      side: sideOf(p),
      pnl: Number((p.mtmPnlUsd ?? 0).toFixed(2)),
    })),
    streak: "—",
  };
}

/**
 * Fetch the site leaderboard and build a deck. Throws if the endpoint is
 * unreachable, returns non-200, is malformed, or has zero agents — so the
 * caller falls back to the R2 build instead of posting empty/fabricated data.
 */
export async function buildDeckFromSite(): Promise<{
  _generatedFrom: string;
  agents: Record<string, unknown>[];
  match: null;
}> {
  const url = process.env.SWARM_LEADERBOARD_API ?? DEFAULT_API;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  let json: SiteLeaderboard;
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    json = (await res.json()) as SiteLeaderboard;
  } finally {
    clearTimeout(timer);
  }
  const siteAgents = Array.isArray(json?.agents) ? json.agents : [];
  if (!siteAgents.length) throw new Error("endpoint returned no agents");

  // Preserve the site's ranking (already roiPct desc with its tie-breaks).
  const agents = [...siteAgents].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0)).map(toEngineAgent);
  return { _generatedFrom: `site:${url}`, agents, match: null };
}
