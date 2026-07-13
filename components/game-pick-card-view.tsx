/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/**
 * Swarm Arena "Game Pick" card — the SINGLE-GAME, SINGLE-AGENT sibling of the
 * multi-game `matchday-card-view` slate.
 *
 * Season 2 replaced the 8-model roster with ONE agent ("Nick"), so the slate's
 * "X/Y agents pick" consensus column no longer makes sense — there is only one
 * agent. This card keeps the matchday visual language (near-black brand surface,
 * white rounded card, orange accent + pick chip, the "AI Agents analysis" buffer
 * that fills and resolves into the pick) but shows ONE game filling the card and
 * drops the agents-count column, replacing it with Nick's single-agent identity.
 *
 * Two tier-1 treatments (`variant`): the live "0–0" scoreboard, or the "AI
 * Agents analysis" buffer that fills and resolves into the pick.
 *
 * One design definition, two render modes (the matchday / consensus pattern):
 *   - No `anim` → the static still (/static), driven by `variant` + `phase`.
 *   - `anim` → the Remotion composition drives the buffer, loading-chip blink,
 *     pick fade-in and slot-machine numbers per frame.
 * Same component → the still and the animation can never drift.
 *
 * Reuses the hexagon `Crest` + palette from the consensus card so flags and
 * brand tokens never drift. No "@/" alias imports — Remotion-bundle-safe.
 */
import { Crest } from "./consensus-card-view";

const ASSET = "/swarm-arena-cards/assets";

export type GamePickMarket = "moneyline" | "btts" | "totals";

/** Live scoreboard vs the "AI Agents analysis" buffer that resolves to a pick. */
export type GamePickVariant = "score" | "analysis";

/** Analysis frame: "start" = buffer filling (LOADING…); "final" = pick revealed. */
export type GamePickPhase = "start" | "final";

/** The agent's pick on the game. */
export type GamePickPick = {
  marketType: GamePickMarket;
  /**
   * Drives the chip copy:
   *   moneyline → the team name to win ("Morocco" → "MOROCCO TO WIN")
   *   btts      → "Yes"/"No" → "BOTH TEAMS TO SCORE" / "NOT BOTH TO SCORE"
   *   totals    → "Over" | "Under" (+ `line`) → "UNDER 2.5 GOALS"
   */
  selection: string;
  line?: number | null;
  /** Total USD staked. */
  stakeUsd: number;
  /** Market-implied probability = the price the pick is staked at, 0..1 (decimal odds = 1 / price). */
  price: number;
  /** Agent (Nick) fair-value probability for the pick, 0..1. */
  agentProb: number;
  /** Raw conviction label from the agent ("low" | "medium" | "high" …). */
  conviction?: string;
};

export type GamePickCardData = {
  home: string;
  away: string;
  /** ISO-3166 alpha-2 (or USA/SCT shorthands the Crest resolver understands). */
  homeCode: string;
  awayCode: string;
  homeScore: number;
  awayScore: number;
  competition?: string;
  stage?: string;
  venue?: string;
  /** Display kickoff, e.g. "Sun, Jun 14 · 20:00 ET". */
  kickoff: string;
  /** The agent's pick, or undefined when Nick has no position yet. */
  pick?: GamePickPick;
};

/** Sample — one game, one agent (the matchday USA game, single-agent form). */
export const SAMPLE_GAME_PICK_CARD: GamePickCardData = {
  home: "Morocco",
  away: "Scotland",
  homeCode: "MA",
  awayCode: "SCT",
  homeScore: 0,
  awayScore: 0,
  competition: "FIFA World Cup 2026",
  stage: "Round of 16",
  venue: "MetLife Stadium",
  kickoff: "Tue, Jul 7 · 21:00 ET",
  pick: {
    marketType: "moneyline",
    selection: "Morocco",
    stakeUsd: 260,
    price: 0.46,
    agentProb: 0.6,
    conviction: "high",
  },
};

/**
 * Per-frame animation state. Supplied by the Remotion composition; when absent
 * the View renders the static still from `variant` + `phase`. Number slots are
 * ReactNodes (e.g. <SlidingDigitCount>) so the composition owns the reels.
 */
export type GamePickAnim = {
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
};

// White-card tokens (dark text on white, distinct from the dark-card palette).
const INK = "#0f1729"; // score / stat numbers
const MUTE = "#8a93a3"; // kickoff + "staked" labels
const HAIR = "#eceef2"; // tier divider
const GAIN = "#2c8a3d"; // potential gain + agent % (readable green on white)
const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const oddsStr = (p: number) => `${p.toFixed(2)}/${(1 / p).toFixed(2)}x`;
export const gamePotentialUsd = (stake: number, p: number) => stake * (1 / p - 1);
export const gameAsPct = (p: number) => Math.round(p * 100);

/** Chip copy from the agent's selected market. */
function chipLabel(pick: GamePickPick): string {
  if (pick.marketType === "btts") {
    return String(pick.selection).toLowerCase() === "no" ? "Not both to score" : "Both teams to score";
  }
  if (pick.marketType === "totals") {
    const dir = String(pick.selection).toLowerCase() === "under" ? "Under" : "Over";
    return `${dir} ${pick.line ?? 2.5} goals`;
  }
  if (String(pick.selection).toLowerCase() === "draw") return "Draw";
  return `${pick.selection} to win`;
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

/** Orange "Loading…" chip — blinks while the agent analyses (animation). */
function LoadingChip() {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.55)]"
      style={{ backgroundImage: "linear-gradient(169deg,#f98051 17%,#e75218 89%)" }}
    >
      Loading…
    </span>
  );
}

/** Nick's single-agent identity tag — replaces the slate's "X/Y agents" count. */
function AgentTag() {
  return (
    <span
      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-[12px] font-bold uppercase tracking-[0.14em]"
      style={{ background: "#10141c", color: "#fff8ea" }}
    >
      <span className="size-1.5 rounded-full" style={{ background: "#9ec46a" }} />
      Nick · Swarm Arena Agent
    </span>
  );
}

/** The agent found no edge to bet — same orange chip as a pick. */
function NoPickBlock() {
  return (
    <div className="flex flex-col items-center gap-4">
      <AgentTag />
      <span
        className="inline-flex items-center whitespace-nowrap rounded-full px-5 py-2.5 text-[15px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.55)]"
        style={{ backgroundImage: "linear-gradient(169deg,#f98051 17%,#e75218 89%)" }}
      >
        No edge found
      </span>
    </div>
  );
}

/** The agent's pick — identity tag + chip + market/agent + stake/odds + gain. */
function PickBlock({ pick, a }: { pick: GamePickPick; a?: GamePickAnim }) {
  return (
    <div className="flex flex-col items-center gap-6">
      <AgentTag />

      {/* The pick chip — hero */}
      <span
        className="inline-flex w-fit items-center whitespace-nowrap rounded-full px-7 py-3.5 text-[22px] font-extrabold uppercase tracking-wide text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.55)]"
        style={{ backgroundImage: "linear-gradient(169deg,#f98051 17%,#e75218 89%)" }}
      >
        {chipLabel(pick)}
      </span>

      {/* Market vs Agent stat tiles */}
      <div className="grid w-full grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border py-4" style={{ borderColor: HAIR, background: "#f7f8fa" }}>
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTE }}>Market</span>
          <span className="font-mono text-[34px] font-extrabold leading-none tabular-nums" style={{ color: INK }}>
            {a?.marketNode ?? `${gameAsPct(pick.price)}%`}
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 rounded-2xl border py-4" style={{ borderColor: "rgba(44,138,61,0.35)", background: "rgba(44,138,61,0.08)" }}>
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: MUTE }}>Nick</span>
          <span className="font-mono text-[34px] font-extrabold leading-none tabular-nums" style={{ color: GAIN }}>
            {a?.agentsNode ?? `${gameAsPct(pick.agentProb)}%`}
          </span>
        </div>
      </div>

      {/* Stake / odds + potential gain */}
      <div className="flex flex-col items-center gap-1.5">
        <div className="whitespace-nowrap font-mono leading-none">
          <span className="text-[24px] font-extrabold tabular-nums" style={{ color: INK }}>{a?.stakeNode ?? usd(pick.stakeUsd)}</span>
          <span className="text-[13px]" style={{ color: MUTE }}> staked at {oddsStr(pick.price)}</span>
        </div>
        <div className="whitespace-nowrap font-mono text-[17px] font-bold tabular-nums" style={{ color: GAIN }}>
          {a?.gainNode ?? `+${usd(gamePotentialUsd(pick.stakeUsd, pick.price))}`} if it hits
        </div>
      </div>
    </div>
  );
}

export function GamePickCardView({
  data,
  assetBase = ASSET,
  variant = "score",
  phase = "final",
  anim,
}: {
  data: GamePickCardData;
  assetBase?: string;
  variant?: GamePickVariant;
  phase?: GamePickPhase;
  anim?: GamePickAnim;
}) {
  const analysis = variant === "analysis";
  const a = anim;
  const barFrac = a ? a.barFrac : phase === "final" ? 1 : 0.1;
  const loadingOpacity = a ? a.loadingOpacity : phase === "start" ? 1 : 0;
  const pickOpacity = a ? a.pickOpacity : phase === "start" ? 0 : 1;
  const reveal = data.pick ? <PickBlock pick={data.pick} a={a} /> : <NoPickBlock />;

  return (
    <>
      {/* near-black brand surface (shared with the matchday / consensus card) */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />
      <div className="pointer-events-none absolute left-[-120px] top-[770px] h-[471px] w-[412px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      <div className="absolute inset-x-0 top-0 flex h-full flex-col px-6 pt-7 pb-8 font-sans">
        {/* header */}
        <div className="mb-6 flex items-center justify-between rounded-[20px] border border-white/10 bg-[#0c0f17]/80 px-6 py-3">
          <div className="flex items-center gap-3">
            <BallMark />
            <p className="text-[22px] font-extrabold uppercase tracking-wide leading-none text-[#fff8ea]">
              Match Pick
            </p>
          </div>
          <img alt="Swarm Arena" src={`${assetBase}/logos/swarm-arena.svg`} className="h-6 w-[21px] shrink-0 opacity-80" />
        </div>

        {/* single game card */}
        <div className="flex flex-1 flex-col justify-center">
          <div className="relative overflow-hidden rounded-[32px] bg-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)]">
            {/* brand accent bar */}
            <div className="absolute inset-y-0 left-0 w-1.5" style={{ background: "linear-gradient(180deg,#f98051,#e75218)" }} />

            <div className="px-9 pt-8 pb-9">
              {/* eyebrow — competition · stage */}
              <div className="mb-6 text-center font-mono text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: MUTE }}>
                {data.competition ?? "FIFA World Cup 2026"}
                {data.stage ? ` · ${data.stage}` : ""}
              </div>

              {/* tier 1 — crests + (live score | analysis chip) + names */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-1 flex-col items-center gap-2.5">
                  <Crest code={data.homeCode} assetBase={assetBase} />
                  <span className="text-center text-[18px] font-bold leading-tight" style={{ color: INK }}>{data.home}</span>
                </div>

                {analysis ? (
                  <div className="mt-4 flex flex-col items-center">
                    <span
                      className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold uppercase tracking-[0.1em]"
                      style={{ background: "#10141c", color: "#fff8ea" }}
                    >
                      <span className="size-1.5 rounded-full" style={{ background: "#9ec46a" }} />
                      AI analysis
                    </span>
                    <span className="mt-3 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTE }}>{data.kickoff}</span>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-col items-center">
                    <div className="flex items-baseline gap-3 leading-none" style={{ color: INK }}>
                      <span className="text-[56px] font-extrabold tabular-nums">{data.homeScore}</span>
                      <span className="text-[32px] font-bold" style={{ color: "#b8bfca" }}>–</span>
                      <span className="text-[56px] font-extrabold tabular-nums">{data.awayScore}</span>
                    </div>
                    <span className="mt-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: MUTE }}>{data.kickoff}</span>
                  </div>
                )}

                <div className="flex flex-1 flex-col items-center gap-2.5">
                  <Crest code={data.awayCode} assetBase={assetBase} />
                  <span className="text-center text-[18px] font-bold leading-tight" style={{ color: INK }}>{data.away}</span>
                </div>
              </div>

              {/* separator — progress bar for analysis, hairline for score */}
              {analysis ? (
                <div className="my-7 h-2.5 w-full overflow-hidden rounded-full" style={{ background: "#eceef2" }}>
                  <div className="h-full rounded-full" style={{ width: `${barFrac * 100}%`, backgroundImage: "linear-gradient(90deg,#9ec46a,#4f9c2e)" }} />
                </div>
              ) : (
                <div className="my-7 border-t" style={{ borderColor: HAIR }} />
              )}

              {/* reveal — analysis crossfades LOADING… into the pick */}
              {!analysis ? (
                reveal
              ) : a ? (
                <div className="relative" style={{ minHeight: 300 }}>
                  <div className="absolute inset-x-0 top-0 flex justify-center" style={{ opacity: loadingOpacity }}>
                    <LoadingChip />
                  </div>
                  <div style={{ opacity: pickOpacity }}>{reveal}</div>
                </div>
              ) : phase === "start" ? (
                <div className="flex justify-center py-3">
                  <LoadingChip />
                </div>
              ) : (
                reveal
              )}
            </div>
          </div>
        </div>

        {/* footer microcopy */}
        <p className="mt-6 text-center font-mono text-[12px]" style={{ color: "#7e7568" }}>
          Market = Polymarket · Nick = one agent, multi-model consensus · swarmarena.ai
        </p>
      </div>
    </>
  );
}

/** Static still — wraps the View in the 650×1156 card box. */
export default function GamePickCard({
  data = SAMPLE_GAME_PICK_CARD,
  assetBase,
  variant = "score",
  phase = "final",
}: {
  data?: GamePickCardData;
  assetBase?: string;
  variant?: GamePickVariant;
  phase?: GamePickPhase;
}) {
  return (
    <article
      className="relative h-[1156px] w-[650px] overflow-clip rounded-2xl font-sans"
      data-card={variant === "analysis" ? `game-pick-analysis-${phase}` : "game-pick"}
    >
      <GamePickCardView data={data} assetBase={assetBase} variant={variant} phase={phase} />
    </article>
  );
}
