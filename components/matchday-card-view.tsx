/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/**
 * Swarm Arena "World Cup Day" matchday card — a lean, social-first variant.
 *
 * Borrows the ad format Badi liked: today's slate stacked as white rounded rows
 * on our near-black brand surface, one row per game. Each row is two-tier:
 *   tier 1 — hexagon flags + (live score | "AI Agents analysis" chip)
 *   tier 2 — the swarm's HIGHEST-CONSENSUS bet as a chip, with the agent
 *            consensus, total stake (+ odds) and potential gain.
 *
 * Two tier-1 treatments (`variant`): the live "0–0" scoreboard, or the "AI
 * Agents analysis" buffer that fills and resolves into the pick.
 *
 * One design definition, two render modes (the consensus-card pattern):
 *   - No `anim` → the static still (/static), driven by `variant` + `phase`.
 *   - `anim` (per-row) → the Remotion composition drives every row's buffer,
 *     loading-chip blink, pick fade-in and slot-machine numbers per frame.
 * Same component → the still and the animation can never drift.
 *
 * Reuses the hexagon `Crest` + palette from the consensus card so flags and
 * brand tokens never drift. No "@/" alias imports — Remotion-bundle-safe.
 */
import { Crest } from "./consensus-card-view";

const ASSET = "/swarm-arena-cards/assets";

export type MatchdayMarket = "moneyline" | "btts" | "totals";

/**
 * Two tier-1 treatments to A/B: the live "0–0" scoreboard, or the "AI Agents
 * analysis" buffer that fills and resolves into the pick.
 */
export type MatchdayVariant = "score" | "analysis";

/**
 * Analysis-variant animation frame: "start" = buffer filling, rows show
 * LOADING…; "final" = buffer full, rows reveal the swarm's pick.
 */
export type MatchdayPhase = "start" | "final";

export type MatchdayGame = {
  home: string;
  away: string;
  /** ISO-3166 alpha-2 (or USA/SCT shorthands the Crest resolver understands). */
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  /** Display kickoff, e.g. "20:00 ET". */
  kickoff: string;
  /** The swarm's highest-consensus market on this game. */
  marketType: MatchdayMarket;
  /**
   * Drives the chip copy:
   *   moneyline → the team name to win ("Morocco" → "MOROCCO TO WIN")
   *   btts      → "Yes"  → "BOTH TEAMS TO SCORE"
   *   totals    → "Over" | "Under" (+ `line`) → "UNDER 2.5 GOALS"
   */
  selection: string;
  line?: number | null;
  /** Agents backing the pick / total agents in the swarm. */
  consensusN: number;
  agentsTotal: number;
  /** Total USD staked across the backing agents. */
  stakeUsd: number;
  /** Market-implied probability = the price the pick is staked at, 0..1 (decimal odds = 1 / price). */
  price: number;
  /** Swarm (agent) consensus probability for the pick, 0..1. */
  agentProb: number;
};

export type MatchdayCardData = {
  /** Header: "WORLD CUP DAY {day}". */
  day: number;
  games: MatchdayGame[];
};

/** Sample slate — the four games from the reference ad, with illustrative bets. */
export const SAMPLE_MATCHDAY_CARD: MatchdayCardData = {
  day: 9,
  games: [
    {
      home: "USA", away: "Australia", homeCode: "US", awayCode: "AU",
      homeScore: 0, awayScore: 0, kickoff: "18:00 ET",
      marketType: "moneyline", selection: "USA",
      consensusN: 7, agentsTotal: 8, stakeUsd: 320, price: 0.57, agentProb: 0.71,
    },
    {
      home: "Scotland", away: "Morocco", homeCode: "SCT", awayCode: "MA",
      homeScore: 0, awayScore: 0, kickoff: "18:00 ET",
      marketType: "moneyline", selection: "Morocco",
      consensusN: 6, agentsTotal: 8, stakeUsd: 260, price: 0.46, agentProb: 0.60,
    },
    {
      home: "Brazil", away: "Haiti", homeCode: "BR", awayCode: "HT",
      homeScore: 0, awayScore: 0, kickoff: "21:00 ET",
      marketType: "totals", selection: "Over", line: 2.5,
      consensusN: 8, agentsTotal: 8, stakeUsd: 410, price: 0.55, agentProb: 0.78,
    },
    {
      home: "Turkey", away: "Paraguay", homeCode: "TR", awayCode: "PY",
      homeScore: 0, awayScore: 0, kickoff: "21:00 ET",
      marketType: "btts", selection: "Yes",
      consensusN: 5, agentsTotal: 8, stakeUsd: 185, price: 0.43, agentProb: 0.58,
    },
  ],
};

/**
 * Per-row animation state. Supplied by the Remotion composition; when absent the
 * View renders the static still from `variant` + `phase`. Number slots are
 * ReactNodes (e.g. <SlidingDigitCount>) so the composition owns the reels.
 */
export type MatchdayRowAnim = {
  /** Loading bar fill fraction, 0.1 → 1. */
  barFrac: number;
  /** Blinking orange "Loading…" chip opacity (0 once revealed). */
  loadingOpacity: number;
  /** Pick block fade-in, 0 → 1. */
  pickOpacity: number;
  marketNode?: ReactNode;
  agentsNode?: ReactNode;
  stakeNode?: ReactNode;
  gainNode?: ReactNode;
  /** Just the agents count ("X"); the "/Y" is static and shows immediately. */
  consensusNode?: ReactNode;
};

export type MatchdayAnim = { rows: MatchdayRowAnim[] };

// White-row tokens (dark text on white, distinct from the dark-card palette).
const INK = "#0f1729"; // score / consensus numbers
const MUTE = "#8a93a3"; // kickoff + "staked" labels
const HAIR = "#eceef2"; // tier divider
const GAIN = "#2c8a3d"; // potential gain + agents % (readable green on white)
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const oddsStr = (p: number) => `${p.toFixed(2)}/${(1 / p).toFixed(2)}x`;
export const potentialUsd = (stake: number, p: number) => stake * (1 / p - 1);
export const asPct = (p: number) => Math.round(p * 100);

// Reserved bottom height (px) so the row doesn't reflow as LOADING… → pick.
const PICK_MIN_H = 84;

/** Chip copy from the swarm's selected market. */
function chipLabel(g: MatchdayGame): string {
  if (g.marketType === "btts") {
    return String(g.selection).toLowerCase() === "no" ? "Not both to score" : "Both teams to score";
  }
  if (g.marketType === "totals") {
    const dir = String(g.selection).toLowerCase() === "under" ? "Under" : "Over";
    return `${dir} ${g.line ?? 2.5} goals`;
  }
  if (String(g.selection).toLowerCase() === "draw") return "Draw";
  return `${g.selection} to win`;
}

/** Minimal monochrome soccer ball — no emoji, brand-cream on the dark header. */
function BallMark() {
  return (
    <svg viewBox="0 0 64 64" className="size-8 shrink-0" aria-hidden>
      <circle cx="32" cy="32" r="29" fill="#fff8ea" stroke="#0c0a08" strokeWidth="2.5" />
      <path d="M32 17 l13 9.5 -5 15.5 h-16 l-5 -15.5 z" fill="#0c0a08" />
      <g stroke="#0c0a08" strokeWidth="2.4" strokeLinecap="round">
        <line x1="32" y1="17" x2="32" y2="6" />
        <line x1="45" y1="26.5" x2="55" y2="22" />
        <line x1="40" y1="42" x2="47" y2="51" />
        <line x1="24" y1="42" x2="17" y2="51" />
        <line x1="19" y1="26.5" x2="9" y2="22" />
      </g>
    </svg>
  );
}

/** Orange "Loading…" chip — blinks while the agents analyse (animation). */
function LoadingChip() {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.55)]"
      style={{ backgroundImage: "linear-gradient(169deg,#f98051 17%,#e75218 89%)" }}
    >
      Loading…
    </span>
  );
}

/** The swarm's pick — market vs agents · chip + stake/odds · consensus count. */
function PickBlock({ g, a }: { g: MatchdayGame; a?: MatchdayRowAnim }) {
  return (
    <div className="grid grid-cols-3 items-center gap-2">
      {/* left — market % vs agents % */}
      <div className="flex flex-col gap-1.5 font-mono">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTE }}>Market</span>
          <span className="text-[15px] font-bold tabular-nums" style={{ color: INK }}>{a?.marketNode ?? `${asPct(g.price)}%`}</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: MUTE }}>Agents</span>
          <span className="text-[15px] font-bold tabular-nums" style={{ color: GAIN }}>{a?.agentsNode ?? `${asPct(g.agentProb)}%`}</span>
        </div>
      </div>

      {/* middle — the pick chip + stake/odds + potential gain */}
      <div className="flex flex-col items-center gap-1.5">
        <span
          className="inline-flex w-fit items-center whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.55)]"
          style={{ backgroundImage: "linear-gradient(169deg,#f98051 17%,#e75218 89%)" }}
        >
          {chipLabel(g)}
        </span>
        <div className="whitespace-nowrap font-mono leading-none">
          <span className="text-[18px] font-extrabold tabular-nums" style={{ color: INK }}>{a?.stakeNode ?? usd(g.stakeUsd)}</span>
          <span className="text-[11px]" style={{ color: MUTE }}> staked at {oddsStr(g.price)}</span>
        </div>
        <div className="whitespace-nowrap font-mono text-[14.4px] font-bold tabular-nums" style={{ color: GAIN }}>
          {a?.gainNode ?? `+${usd(potentialUsd(g.stakeUsd, g.price))}`} if it hits
        </div>
      </div>

      {/* right — agent consensus count */}
      <div className="flex flex-col items-end">
        <span className="text-[30px] font-extrabold leading-none tabular-nums" style={{ color: INK }}>
          {a?.consensusNode ?? g.consensusN}
          <span className="text-[18px]" style={{ color: "#aab2c0" }}>/{g.agentsTotal}</span>
        </span>
        <span className="mt-1 font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.2em]" style={{ color: MUTE }}>
          agents
        </span>
        <span className="font-mono text-[10px] font-semibold uppercase leading-tight tracking-[0.2em]" style={{ color: MUTE }}>
          pick
        </span>
      </div>
    </div>
  );
}

function GameRow({
  g,
  index,
  assetBase,
  variant,
  phase,
  rowAnim,
}: {
  g: MatchdayGame;
  index: number;
  assetBase: string;
  variant: MatchdayVariant;
  phase: MatchdayPhase;
  rowAnim?: MatchdayRowAnim;
}) {
  const analysis = variant === "analysis";
  const a = rowAnim;
  // Resolve display state from the anim (composition) or the static phase.
  // Resting bar fill before a game's turn: first game 10%, the rest 1%.
  const restFrac = index === 0 ? 0.1 : 0.01;
  const barFrac = a ? a.barFrac : phase === "final" ? 1 : restFrac;
  const loadingOpacity = a ? a.loadingOpacity : phase === "start" ? 1 : 0;
  const pickOpacity = a ? a.pickOpacity : phase === "start" ? 0 : 1;

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-white shadow-[0_14px_30px_-12px_rgba(0,0,0,0.55)]">
      {/* brand accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-1.5"
        style={{ background: "linear-gradient(180deg,#f98051,#e75218)" }}
      />
      <div className="pl-8 pr-6 py-4">
        {/* tier 1 — flags + (live score | analysis chip) */}
        <div className="flex items-center justify-between gap-3">
          <Crest code={g.homeCode} assetBase={assetBase} />
          {analysis ? (
            <span
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-[0.1em]"
              style={{ background: "#10141c", color: "#fff8ea" }}
            >
              <span className="size-1.5 rounded-full" style={{ background: "#9ec46a" }} />
              AI Agents analysis
            </span>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-3 leading-none" style={{ color: INK }}>
                <span className="text-[52px] font-extrabold tabular-nums">{g.homeScore}</span>
                <span className="text-[30px] font-bold" style={{ color: "#b8bfca" }}>–</span>
                <span className="text-[52px] font-extrabold tabular-nums">{g.awayScore}</span>
              </div>
              <span className="mt-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTE }}>
                {g.kickoff}
              </span>
            </div>
          )}
          <Crest code={g.awayCode} assetBase={assetBase} />
        </div>

        {/* separator — hairline for score, progress bar for analysis */}
        {analysis ? (
          <div className="my-3 h-2 w-full overflow-hidden rounded-full" style={{ background: "#eceef2" }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${barFrac * 100}%`, backgroundImage: "linear-gradient(90deg,#9ec46a,#4f9c2e)" }}
            />
          </div>
        ) : (
          <div className="my-3 border-t" style={{ borderColor: HAIR }} />
        )}

        {/* bottom — score variant always shows the pick; analysis crossfades
            the blinking LOADING… chip into the revealed pick */}
        {!analysis ? (
          <PickBlock g={g} />
        ) : a ? (
          <div className="relative" style={{ minHeight: PICK_MIN_H }}>
            <div className="absolute inset-x-0 top-0 flex justify-center" style={{ opacity: loadingOpacity }}>
              <LoadingChip />
            </div>
            <div style={{ opacity: pickOpacity }}>
              <PickBlock g={g} a={a} />
            </div>
          </div>
        ) : phase === "start" ? (
          <div className="flex justify-center py-1.5">
            <LoadingChip />
          </div>
        ) : (
          <PickBlock g={g} />
        )}
      </div>
    </div>
  );
}

export function MatchdayCardView({
  data,
  assetBase = ASSET,
  variant = "score",
  phase = "final",
  anim,
}: {
  data: MatchdayCardData;
  assetBase?: string;
  variant?: MatchdayVariant;
  phase?: MatchdayPhase;
  anim?: MatchdayAnim;
}) {
  return (
    <>
      {/* near-black brand surface (shared with the consensus card) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />
      <div className="pointer-events-none absolute left-[-120px] top-[770px] h-[471px] w-[412px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      <div className="absolute inset-x-0 top-0 flex h-full flex-col px-6 pt-7 pb-7 font-sans">
        {/* header */}
        <div className="mb-5 flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0c0f17]/80 px-6 py-3">
          <div className="flex items-center gap-3">
            <BallMark />
            <p className="text-[23px] font-extrabold uppercase tracking-wide leading-none text-[#fff8ea]">
              World Cup Day {data.day}
            </p>
          </div>
          <img alt="Swarm Arena" src={`${assetBase}/logos/swarm-arena.svg`} className="h-6 w-[21px] shrink-0 opacity-80" />
        </div>

        {/* slate */}
        <div className="flex flex-1 flex-col justify-center gap-4">
          {data.games.map((g, i) => (
            <GameRow
              key={`${g.homeCode}-${g.awayCode}-${i}`}
              g={g}
              index={i}
              assetBase={assetBase}
              variant={variant}
              phase={phase}
              rowAnim={anim?.rows[i]}
            />
          ))}
        </div>
      </div>
    </>
  );
}

/** Static still — wraps the View in the 650×1156 card box. */
export default function MatchdayCard({
  data = SAMPLE_MATCHDAY_CARD,
  assetBase,
  variant = "score",
  phase = "final",
}: {
  data?: MatchdayCardData;
  assetBase?: string;
  variant?: MatchdayVariant;
  phase?: MatchdayPhase;
}) {
  return (
    <article
      className="relative h-[1156px] w-[650px] overflow-clip rounded-2xl font-sans"
      data-card={variant === "analysis" ? `matchday-analysis-${phase}` : "matchday"}
    >
      <MatchdayCardView data={data} assetBase={assetBase} variant={variant} phase={phase} />
    </article>
  );
}
