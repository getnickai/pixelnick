/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";
import { CREAM, Crest, DIM, FAINT, BAR, pct } from "./consensus-card-view";

/**
 * Swarm Arena "Result + Portfolio" card — the SINGLE-AGENT sibling of the
 * per-agent `result-card-view`.
 *
 * Season 2 replaced the 8-model roster with ONE agent ("Nick"), so the result
 * card's per-agent PnL histogram (one bar per agent) no longer makes sense.
 * This card keeps the settled-pick story (final score, HIT/MISS chip, the pick,
 * entry odds, "banked +$X" payout hero) but:
 *   - the payout copy is singular ("The Swarm Arena Agent banked …"), and
 *   - the per-agent bars are replaced by Nick's CURRENT PORTFOLIO — a running
 *     bankroll ($1,000 start + realized P&L) revealed with a slot-machine
 *     count-up, plus its delta from the starting stake.
 *
 * One design definition, two render modes (the result/consensus pattern): the
 * default export is the settled still; `ResultPortfolioCardView` takes a
 * `ResultPortfolioAnim` so the Remotion composition drives every entrance
 * per-frame, so the still and the animation can never drift. Bundling
 * constraint: no "@/" alias imports or Next-only APIs.
 */
const ASSET = "/swarm-arena-cards/assets";

const WIN = BAR; // profit green (shared with the swarm palette)
const LOSS = "#e0653f"; // miss / negative (copper-red)

export type ResultPortfolioCardData = {
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  competition?: string;
  stage?: string;
  venue?: string;
  /** Match date/time display string (kept in the eyebrow). */
  kickoff?: string;
  /* ── Final result ─────────────────────────────────────────────── */
  homeScore: number;
  awayScore: number;
  /** Team name, "Draw", or null/undefined — emphasises the winning side. */
  winner?: string | null;
  /** "FT" | "AET" | "PENS" … shown as a badge under the score. */
  status?: string;
  /* ── The pick the agent backed ────────────────────────────────── */
  /** "moneyline" | "btts" | "totals". */
  marketType: string;
  /** "Home" | "Away" | "Yes" | "No" | "Over" | "Under". */
  selection: string;
  line?: number | null;
  /** Did the pick land? Drives HIT (green) vs MISS (red). */
  hit: boolean;
  /** Entry price the agent got, 0..1 (shown as the odds it took). */
  entryPrice?: number;
  /* ── Payout + portfolio ───────────────────────────────────────── */
  /** Realised P&L on THIS pick, in dollars. */
  totalPnl: number;
  /** Agent's current portfolio value in dollars (bankroll = start + realized P&L). */
  portfolioUsd: number;
  /** Starting bankroll in dollars (default $1,000). */
  startingUsd?: number;
};

/** Sample (Germany 3–1 Curaçao, BTTS Yes — settled, single agent). */
export const SAMPLE_RESULT_PORTFOLIO_CARD: ResultPortfolioCardData = {
  home: "Germany",
  away: "Curaçao",
  homeCode: "DE",
  awayCode: "CW",
  competition: "FIFA World Cup 2026",
  stage: "Group Stage",
  venue: "Reliant Stadium",
  kickoff: "Sun, Jun 14",
  homeScore: 3,
  awayScore: 1,
  winner: "Germany",
  status: "FT",
  marketType: "btts",
  selection: "Yes",
  line: null,
  hit: true,
  entryPrice: 0.3242,
  totalPnl: 148,
  portfolioUsd: 1148,
  startingUsd: 1000,
};

/** Per-frame animation values; the static still uses SETTLED (fully revealed). */
export type ResultPortfolioAnim = {
  headerOpacity: number;
  headerY: number;
  pillOpacity: number;
  pillScale: number;
  metaOpacity: number;
  teamsOpacity: number;
  teamsY: number;
  scoreOpacity: number;
  scoreScale: number;
  hitOpacity: number;
  hitScale: number;
  panelOpacity: number;
  panelY: number;
  statsPct: number;
  payoutOpacity: number;
  /** Blur (px) on the payout number — focus-in reveal. */
  payoutBlur: number;
  /** Portfolio panel fade-in. */
  portfolioOpacity: number;
  /** Blur (px) on the portfolio number — focus-in reveal. */
  portfolioBlur: number;
  footerOpacity: number;
  footerY: number;
  /** Optional animated payout number (count-up). Static leaves it undefined. */
  payoutNode?: ReactNode;
  /** Optional animated portfolio number (slot count-up). */
  portfolioNode?: ReactNode;
};

export const SETTLED_RESULT_PORTFOLIO_ANIM: ResultPortfolioAnim = {
  headerOpacity: 1,
  headerY: 0,
  pillOpacity: 1,
  pillScale: 1,
  metaOpacity: 1,
  teamsOpacity: 1,
  teamsY: 0,
  scoreOpacity: 1,
  scoreScale: 1,
  hitOpacity: 1,
  hitScale: 1,
  panelOpacity: 1,
  panelY: 0,
  statsPct: 1,
  payoutOpacity: 1,
  payoutBlur: 0,
  portfolioOpacity: 1,
  portfolioBlur: 0,
  footerOpacity: 1,
  footerY: 0,
};

const money = (n: number) => `${n >= 0 ? "+" : "−"}$${Math.abs(Math.round(n)).toLocaleString("en-US")}`;
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

/** Concise label for the pick the agent backed (the HIT chip). */
function pickLabel(d: ResultPortfolioCardData): string {
  const sel = String(d.selection);
  if (d.marketType === "btts") {
    return sel.toLowerCase() === "no" ? "No Goals Both Ends" : "Both Teams To Score";
  }
  if (d.marketType === "totals") {
    const ou = sel.toLowerCase() === "under" ? "Under" : "Over";
    return `${ou} ${d.line} Goals`;
  }
  const team = sel === "Away" ? d.away : sel === "Home" ? d.home : null;
  return team ? `${team} To Win` : "Match Winner";
}

/** Settled, past-tense headline of what actually happened on the pitch. */
function settledHeadline(d: ResultPortfolioCardData): string {
  const total = d.homeScore + d.awayScore;
  if (d.marketType === "btts") {
    const both = d.homeScore > 0 && d.awayScore > 0;
    return both ? "Both teams found the net" : "A clean sheet shut it out";
  }
  if (d.marketType === "totals") {
    return `${total} goal${total === 1 ? "" : "s"} on the day`;
  }
  if (d.winner && d.winner !== "Draw") return `${d.winner} took it`;
  return "Honours even";
}

const MARKET_PILL: Record<string, string> = {
  moneyline: "Result · Who Won",
  btts: "Result · Both To Score",
  totals: "Result · Over / Under",
};

export function ResultPortfolioCardView({
  data,
  assetBase = ASSET,
  anim = SETTLED_RESULT_PORTFOLIO_ANIM,
}: {
  data: ResultPortfolioCardData;
  assetBase?: string;
  anim?: ResultPortfolioAnim;
}) {
  const hit = data.hit;
  const ACCENT = hit ? WIN : LOSS;
  const homeWon = data.homeScore > data.awayScore;
  const awayWon = data.awayScore > data.homeScore;
  const starting = data.startingUsd ?? 1000;
  const allTimePnl = data.portfolioUsd - starting;
  const portfolioUp = allTimePnl >= 0;
  const entryTxt = data.entryPrice != null ? `${pct(data.entryPrice)}¢` : "—";

  return (
    <>
      {/* Card surface gradient (Onur's shell) + decorative watermark */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />
      <div className="pointer-events-none absolute left-[-120px] top-[770px] h-[471px] w-[412px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      {/* Content stack */}
      <div className="absolute inset-x-0 top-0 flex h-full flex-col gap-7 px-14 pt-14 pb-10 font-sans">
        {/* Header: wordmark + result pill */}
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-4"
            style={{ opacity: anim.headerOpacity, transform: `translateY(${anim.headerY}px)` }}
          >
            <img alt="" src={`${assetBase}/logos/swarm-arena.svg`} className="h-9 w-[31.5px] shrink-0" />
            <p className="text-xl font-bold uppercase leading-none text-[#fff8ea]">Swarm Arena</p>
          </div>
          <div
            className="rounded-full bg-[#8bce6c] px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-[#161210]"
            style={{ opacity: anim.pillOpacity, transform: `scale(${anim.pillScale})` }}
          >
            {MARKET_PILL[data.marketType] ?? "Settled Pick"}
          </div>
        </div>

        {/* Eyebrow: competition · stage + venue · date */}
        <div style={{ opacity: anim.metaOpacity }}>
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: DIM }}>
            {data.competition ?? "FIFA World Cup 2026"}
            {data.stage ? ` · ${data.stage}` : ""}
          </div>
          <div className="mt-1.5 font-mono text-[13px]" style={{ color: FAINT }}>
            {data.venue ?? ""}
            {data.kickoff ? ` · ${data.kickoff}` : ""}
          </div>
        </div>

        {/* Teams + FINAL SCORE (score replaces the consensus card's "VS") */}
        <div
          className="flex items-start justify-center gap-7"
          style={{ opacity: anim.teamsOpacity, transform: `translateY(${anim.teamsY}px)` }}
        >
          <div className="flex flex-1 flex-col items-center gap-2">
            <Crest code={data.homeCode} assetBase={assetBase} />
            <span
              className="text-center text-2xl font-semibold leading-tight"
              style={{ color: awayWon ? DIM : CREAM }}
            >
              {data.home}
            </span>
          </div>
          <div
            className="mt-[8px] flex shrink-0 flex-col items-center gap-2"
            style={{ opacity: anim.scoreOpacity, transform: `scale(${anim.scoreScale})` }}
          >
            <div className="flex items-center font-mono text-[46px] font-extrabold leading-none">
              <span style={{ color: homeWon ? CREAM : DIM }}>{data.homeScore}</span>
              <span className="px-2.5 text-[#7e7568]">–</span>
              <span style={{ color: awayWon ? CREAM : DIM }}>{data.awayScore}</span>
            </div>
            <span
              className="rounded-full bg-[rgba(255,248,234,0.1)] px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: FAINT }}
            >
              {data.status ?? "FT"}
            </span>
          </div>
          <div className="flex flex-1 flex-col items-center gap-2">
            <Crest code={data.awayCode} assetBase={assetBase} />
            <span
              className="text-center text-2xl font-semibold leading-tight"
              style={{ color: homeWon ? DIM : CREAM }}
            >
              {data.away}
            </span>
          </div>
        </div>

        {/* HIT / MISS chip — the settled equivalent of the question chip */}
        <div
          className="flex justify-center"
          style={{ opacity: anim.hitOpacity, transform: `scale(${anim.hitScale})` }}
        >
          <span
            className="flex items-center gap-2.5 rounded-full border px-7 py-3 text-[22px] font-bold leading-none text-[#fff8ea]"
            style={{
              borderColor: hit ? "rgba(158,196,106,0.65)" : "rgba(224,101,63,0.65)",
              backgroundImage: hit
                ? "linear-gradient(180deg, rgba(158,196,106,0.34), rgba(158,196,106,0.12))"
                : "linear-gradient(180deg, rgba(224,101,63,0.34), rgba(224,101,63,0.12))",
              boxShadow: `0 0 30px ${hit ? "rgba(158,196,106,0.30)" : "rgba(224,101,63,0.30)"}`,
            }}
          >
            <span style={{ color: ACCENT }}>{hit ? "✓" : "✗"}</span>
            {pickLabel(data)}
            <span
              className="rounded-full px-2.5 py-1 text-[13px] font-extrabold uppercase tracking-wide"
              style={{ background: ACCENT, color: "#161210" }}
            >
              {hit ? "Hit" : "Miss"}
            </span>
          </span>
        </div>

        {/* Payout panel — the pick's realised result */}
        <div
          className="flex flex-col gap-5 rounded-2xl bg-[rgba(10,10,6,0.5)] p-7 backdrop-blur-[24px]"
          style={{ opacity: anim.panelOpacity, transform: `translateY(${anim.panelY}px)` }}
        >
          <p className="text-center text-base font-bold uppercase tracking-[0.06em] text-[#fff8ea]">
            {settledHeadline(data)}
          </p>

          {/* Pick + entry-odds strip */}
          <div className="flex items-stretch gap-3" style={{ opacity: anim.statsPct }}>
            <div className="flex-1 rounded-xl border border-[#3c3a34] bg-[#26241d] px-5 py-3.5">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: DIM }}>
                The Pick
              </div>
              <div className="mt-1 text-[17px] font-bold leading-tight text-[#fff8ea]">{pickLabel(data)}</div>
            </div>
            <div className="rounded-xl border border-[#3c3a34] bg-[#26241d] px-5 py-3.5 text-center">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: DIM }}>
                Entry
              </div>
              <div className="mt-1 font-mono text-[17px] font-bold" style={{ color: CREAM }}>{entryTxt}</div>
            </div>
          </div>

          {/* Payout hero callout — singular agent copy */}
          <div
            className="mt-1 flex items-center justify-between rounded-xl border px-5 py-4"
            style={{
              opacity: anim.payoutOpacity,
              borderColor: hit ? "rgba(158,196,106,0.35)" : "#3c3a34",
              background: hit ? "rgba(158,196,106,0.10)" : "#26241d",
            }}
          >
            <span className="text-[15px] font-semibold text-[#fff8ea]">
              The Swarm Arena Agent {data.totalPnl >= 0 ? "banked" : "lost"}
            </span>
            <span
              className="font-mono text-[34px] font-extrabold leading-none"
              style={{ color: ACCENT, filter: `blur(${anim.payoutBlur}px)` }}
            >
              {anim.payoutNode ?? money(data.totalPnl)}
            </span>
          </div>
        </div>

        {/* Current portfolio — replaces the per-agent bars */}
        <div
          className="flex flex-col items-center gap-3 rounded-2xl border border-[#3c3a34] bg-[#1b1813] px-7 py-6"
          style={{ opacity: anim.portfolioOpacity }}
        >
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: DIM }}>
            Nick&apos;s portfolio now
          </div>
          <div
            className="font-mono text-[64px] font-extrabold leading-none"
            style={{ color: CREAM, filter: `blur(${anim.portfolioBlur}px)` }}
          >
            {anim.portfolioNode ?? usd(data.portfolioUsd)}
          </div>
          <div className="font-mono text-[14px] font-bold" style={{ color: portfolioUp ? WIN : LOSS }}>
            {money(allTimePnl)} <span className="font-semibold" style={{ color: DIM }}>from {usd(starting)} start</span>
          </div>
        </div>

        <div className="flex-1" />

        {/* Footer: microcopy + Built On (left) + CTA (right) */}
        <div style={{ opacity: anim.footerOpacity, transform: `translateY(${anim.footerY}px)` }}>
          <p className="mb-3 font-mono text-[12px]" style={{ color: FAINT }}>
            Settled P&amp;L · $1,000 shadow bankroll · one agent, multi-model consensus · swarmarena.ai
          </p>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: FAINT }}>
                Built On
              </span>
              <img alt="NickAI" src={`${assetBase}/NickAI-wordmark-white.svg`} className="h-[24px]" />
            </div>
            <div
              className="flex items-center gap-2 rounded-xl px-5 py-3.5 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
              style={{ backgroundImage: "linear-gradient(169deg, #f98051 17%, #e75218 89%)" }}
            >
              <span className="whitespace-nowrap text-lg font-semibold leading-none">View on Swarm Arena</span>
              <svg className="size-5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M5 12h14M13 6l6 6-6 6" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/** Static still — wraps the View in the 650×1110 card box (Onur's model-card size). */
export default function ResultPortfolioCard({
  data = SAMPLE_RESULT_PORTFOLIO_CARD,
  assetBase,
}: {
  data?: ResultPortfolioCardData;
  assetBase?: string;
}) {
  return (
    <article
      className="relative h-[1110px] w-[650px] overflow-clip rounded-2xl font-sans"
      data-card="result-portfolio"
    >
      <ResultPortfolioCardView data={data} assetBase={assetBase} />
    </article>
  );
}
