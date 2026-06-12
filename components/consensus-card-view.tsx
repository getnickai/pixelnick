/* eslint-disable @next/next/no-img-element */
import type { ReactNode } from "react";

/**
 * Swarm Arena "Market vs Agents" consensus card — the design source of truth.
 *
 * One design definition, two render modes (the model-card / performance-card
 * pattern):
 *   - The default export is the settled still — what /static, the Engine
 *     surfaces and in-browser PNG export render.
 *   - `ConsensusCardView` takes a `ConsensusCardAnim` so the Remotion
 *     composition can drive every entrance per-frame. Same component → the still
 *     and the animation can never drift.
 *
 * Visual language = Onur's model card (gradient shell, #fff8ea / #8bce6c,
 * Manrope, glass panel, NickAI footer); content/structure ported from the
 * vanilla `renderMatchConsensusCard`. Data shape mirrors `consensus.json`
 * (STA-419). Bundling constraint: no "@/" alias imports or Next-only APIs — this
 * module is pulled into Remotion's webpack via the composition.
 */
const ASSET = "/swarm-arena-cards/assets";

export type ConsensusAgentRead = { handle: string; fairValue: number; edgePp?: number };

export type ConsensusCardData = {
  home: string;
  away: string;
  homeCode: string;
  awayCode: string;
  competition?: string;
  stage?: string;
  venue?: string;
  kickoff?: string;
  /** "moneyline" | "btts" | "totals". */
  marketType: string;
  /** "Home" | "Away" | "Yes" | "Over" | "Under" … (drives the question/answer copy). */
  selection: string;
  line?: number | null;
  /** Market implied prob 0..1 (Polymarket). */
  marketPrice: number;
  /** Mean agent fair value 0..1. */
  consensus: number;
  /** [min,max] fair value across pickers, 0..1. */
  spread?: [number, number];
  /** Consensus − market, in percentage points. */
  edgePp: number;
  agentsN: number;
  agentsTotal: number;
  perAgent: ConsensusAgentRead[];
};

/** Sample (Germany v Curaçao BTTS) — what /static renders, and the baseline. */
export const SAMPLE_CONSENSUS_CARD: ConsensusCardData = {
  home: "Germany",
  away: "Curaçao",
  homeCode: "DE",
  awayCode: "CW",
  competition: "FIFA World Cup 2026",
  stage: "Group Stage",
  venue: "Reliant Stadium",
  kickoff: "Sun, Jun 14 · 17:00 UTC",
  marketType: "btts",
  selection: "Yes",
  line: null,
  marketPrice: 0.3242,
  consensus: 0.6331,
  spread: [0.6231, 0.6381],
  edgePp: 30.9,
  agentsN: 6,
  agentsTotal: 8,
  perAgent: [
    { handle: "GROK", fairValue: 0.6381 },
    { handle: "DEEPSEEK", fairValue: 0.6381 },
    { handle: "MISTRAL", fairValue: 0.6381 },
    { handle: "KIMI", fairValue: 0.6331 },
    { handle: "GPT", fairValue: 0.6281 },
    { handle: "GEMINI", fairValue: 0.6231 },
  ],
};

/** Per-frame animation values; the static still uses SETTLED (fully revealed). */
export type ConsensusCardAnim = {
  headerOpacity: number;
  headerY: number;
  pillOpacity: number;
  pillScale: number;
  metaOpacity: number;
  teamsOpacity: number;
  teamsY: number;
  questionOpacity: number;
  questionScale: number;
  panelOpacity: number;
  panelY: number;
  /** Market / Swarm bar fill, 0..1 of their final width. */
  marketBarPct: number;
  swarmBarPct: number;
  edgeOpacity: number;
  /** Blur (px) on the edge number — focus-in reveal. */
  edgeBlur: number;
  /** Whole histogram block (track + ghost bars + agent labels) fade-in. */
  breakdownOpacity: number;
  breakdownLabelOpacity: number;
  /** Histogram reveal: bars grow from baseline (0..1) + market line draw (0..1). */
  histBarsPct: number;
  marketLinePct: number;
  footerOpacity: number;
  footerY: number;
  /** Optional animated number nodes (count-up). Static leaves them undefined. */
  marketNode?: ReactNode;
  swarmNode?: ReactNode;
  edgeNode?: ReactNode;
};

export const SETTLED_CONSENSUS_ANIM: ConsensusCardAnim = {
  headerOpacity: 1,
  headerY: 0,
  pillOpacity: 1,
  pillScale: 1,
  metaOpacity: 1,
  teamsOpacity: 1,
  teamsY: 0,
  questionOpacity: 1,
  questionScale: 1,
  panelOpacity: 1,
  panelY: 0,
  marketBarPct: 1,
  swarmBarPct: 1,
  edgeOpacity: 1,
  edgeBlur: 0,
  breakdownOpacity: 1,
  breakdownLabelOpacity: 1,
  histBarsPct: 1,
  marketLinePct: 1,
  footerOpacity: 1,
  footerY: 0,
};

// Palette (Onur's model card tokens) + the consensus bar/line colors.
const CREAM = "#fff8ea";
const DIM = "#8a8174";
const FAINT = "#7e7568";
const BAR = "#9ec46a"; // swarm bars (lighter green, max contrast)
const LINE = "#db5a1e"; // market reference line (saturated orange)
const INSET = "rgba(255,248,234,0.08)"; // track / ghost bars

// Fixed agent order + branding (inlined so the View stays Remotion-bundle-safe).
const AGENT_META: Record<string, { code: string; short: string; color: string }> = {
  GPT: { code: "GPT", short: "GPT", color: "#a89a86" },
  CLAUDE: { code: "CL", short: "Claude", color: "#cc785c" },
  GEMINI: { code: "GEM", short: "Gemini", color: "#6f8fd6" },
  GROK: { code: "GRK", short: "Grok", color: "#b9a07a" },
  DEEPSEEK: { code: "DS", short: "DeepSeek", color: "#5570e6" },
  QWEN: { code: "QW", short: "Qwen", color: "#7c5cff" },
  KIMI: { code: "KMI", short: "Kimi", color: "#9b7bd4" },
  MISTRAL: { code: "MST", short: "Mistral", color: "#d9772f" },
};
const ALL_HANDLES = ["GPT", "CLAUDE", "GEMINI", "GROK", "DEEPSEEK", "QWEN", "KIMI", "MISTRAL"];
const metaOf = (h: string) => AGENT_META[h] ?? { code: h.slice(0, 3), short: h, color: "#9a8f7e" };

const pct = (x: number) => Math.round(x * 100);

const MARKET_PILL: Record<string, string> = {
  moneyline: "Who Wins",
  btts: "Both Teams To Score",
  totals: "Over / Under",
};

/** Bet copy derived from the market type (question chip + affirmative answer). */
function betCopy(d: ConsensusCardData) {
  const pickedTeam = d.selection === "Away" ? d.away : d.selection === "Home" ? d.home : null;
  const overUnder = String(d.selection).toLowerCase() === "under" ? "Fewer" : "More";
  if (d.marketType === "btts") {
    return { question: "Will both teams score?", answer: "Yes, both teams will score" };
  }
  if (d.marketType === "totals") {
    return {
      question: `${overUnder} than ${d.line} goals?`,
      answer: `Yes, ${overUnder.toLowerCase()} than ${d.line} goals`,
    };
  }
  return {
    question: pickedTeam ? `Will ${pickedTeam} win?` : "Match winner?",
    answer: pickedTeam ? `Yes, ${pickedTeam} will win` : "Yes",
  };
}

/** ISO-3166 alpha-2 code → regional-indicator flag emoji (DE → 🇩🇪). */
function codeToFlag(code: string): string {
  const cc = (code || "").toUpperCase().replace(/[^A-Z]/g, "");
  if (cc.length !== 2) return "";
  return String.fromCodePoint(...[...cc].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));
}

/** Shield crest — flag + code on a dark glass shield (match-card family). */
function Crest({ code }: { code: string }) {
  const flag = codeToFlag(code);
  const gid = `crest-${code}`;
  return (
    <div className="relative grid size-[68px] shrink-0 place-items-center">
      <svg viewBox="0 0 64 76" className="absolute inset-0 size-full" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2a201b" />
            <stop offset="100%" stopColor="#16110e" />
          </linearGradient>
        </defs>
        <path
          d="M32 2 L60 12 V40 C60 58 47 68 32 74 C17 68 4 58 4 40 V12 Z"
          fill={`url(#${gid})`}
          stroke="rgba(255,248,234,0.18)"
          strokeWidth="1.5"
        />
      </svg>
      <div className="relative flex flex-col items-center gap-0.5">
        <span className="text-[22px] leading-none">{flag}</span>
        <span className="font-mono text-[10px] font-bold tracking-wide text-[#fff8ea]">{code}</span>
      </div>
    </div>
  );
}

export function ConsensusCardView({
  data,
  assetBase = ASSET,
  anim = SETTLED_CONSENSUS_ANIM,
}: {
  data: ConsensusCardData;
  assetBase?: string;
  anim?: ConsensusCardAnim;
}) {
  const market = pct(data.marketPrice);
  const swarm = pct(data.consensus);
  const { question, answer } = betCopy(data);
  const picks = new Map(data.perAgent.map((a) => [a.handle, a.fairValue]));
  const HIST_H = 170; // px — histogram track height
  const rangeTxt =
    data.spread && data.spread[0] !== data.spread[1]
      ? ` within a ${pct(data.spread[0])}–${pct(data.spread[1])}% range`
      : "";

  return (
    <>
      {/* Card surface gradient (Onur's shell) + decorative watermark */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />
      <div className="pointer-events-none absolute left-[-120px] top-[770px] h-[471px] w-[412px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      {/* Content stack */}
      <div className="absolute inset-x-0 top-0 flex h-full flex-col gap-7 px-14 pt-14 pb-10 font-sans">
        {/* Header: wordmark + market pill */}
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
            {MARKET_PILL[data.marketType] ?? "Market vs Swarm"}
          </div>
        </div>

        {/* Eyebrow: competition · stage + venue · kickoff */}
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

        {/* Teams VS */}
        <div
          className="flex items-center justify-between"
          style={{ opacity: anim.teamsOpacity, transform: `translateY(${anim.teamsY}px)` }}
        >
          <div className="flex items-center gap-3.5">
            <Crest code={data.homeCode} />
            <span className="text-2xl font-semibold text-[#fff8ea]">{data.home}</span>
          </div>
          <span className="font-mono text-base font-bold" style={{ color: FAINT }}>VS</span>
          <div className="flex flex-row-reverse items-center gap-3.5">
            <Crest code={data.awayCode} />
            <span className="text-2xl font-semibold text-[#fff8ea]">{data.away}</span>
          </div>
        </div>

        {/* Question chip — hero element, copper, glowing */}
        <div className="flex justify-center" style={{ opacity: anim.questionOpacity, transform: `scale(${anim.questionScale})` }}>
          <span className="rounded-full border border-[#f0935f]/70 bg-gradient-to-b from-[#e08060]/35 to-[#e08060]/15 px-7 py-3 text-[24px] font-bold leading-none text-[#fff8ea] shadow-[0_0_30px_rgba(224,128,96,0.30)]">
            {question}
          </span>
        </div>

        {/* Market vs Swarm panel */}
        <div
          className="flex flex-col gap-5 rounded-2xl bg-[rgba(10,10,6,0.5)] p-7 backdrop-blur-[24px]"
          style={{ opacity: anim.panelOpacity, transform: `translateY(${anim.panelY}px)` }}
        >
          <p className="text-center text-base font-bold uppercase tracking-[0.06em] text-[#fff8ea]">{answer}</p>

          {/* Market bar */}
          <Bar label="Market" valuePct={market} fillPct={anim.marketBarPct} color={DIM} strong={false} />
          {/* Swarm bar */}
          <Bar
            label={`Swarm ${data.agentsN}/${data.agentsTotal}`}
            valuePct={swarm}
            fillPct={anim.swarmBarPct}
            color={BAR}
            strong
          />

          {/* Edge callout */}
          <div
            className="mt-1 flex items-center justify-between rounded-xl border border-[#3c3a34] bg-[#26241d] px-5 py-4"
            style={{ opacity: anim.edgeOpacity }}
          >
            <span className="text-[15px] font-semibold text-[#fff8ea]">Swarm Arena agents see value</span>
            <span
              className="font-mono text-[34px] font-extrabold leading-none"
              style={{ color: BAR, filter: `blur(${anim.edgeBlur}px)` }}
            >
              {anim.edgeNode ?? (
                <>
                  {data.edgePp > 0 ? "+" : ""}
                  {data.edgePp}
                </>
              )}
              <span className="text-[15px] font-bold">pp</span>
            </span>
          </div>
        </div>

        {/* Per-agent histogram breakdown */}
        <div style={{ opacity: anim.breakdownOpacity }}>
          <div
            className="mb-3 text-center font-mono text-xs font-semibold uppercase tracking-[0.14em]"
            style={{ color: DIM, opacity: anim.breakdownLabelOpacity }}
          >
            {data.agentsN} of {data.agentsTotal} agents backing this pick{rangeTxt}
          </div>
          <div className="relative flex items-end gap-2.5" style={{ height: HIST_H }}>
            {ALL_HANDLES.map((h) => {
              const v = picks.get(h);
              const on = v != null;
              const full = on ? Math.round(v! * 100) : 6;
              const hPct = full * anim.histBarsPct;
              return (
                <div key={h} className="relative h-full flex-1">
                  <div
                    className="absolute inset-x-0 bottom-0 rounded-t-[3px]"
                    style={{ height: `${hPct}%`, minHeight: 4, background: on ? BAR : INSET, opacity: on ? 1 : 0.5 }}
                  />
                  {on ? (
                    <span
                      className="absolute inset-x-0 text-center font-mono text-[12px] font-bold"
                      style={{ bottom: `calc(${hPct}% + 5px)`, color: BAR, opacity: anim.histBarsPct }}
                    >
                      {full}
                    </span>
                  ) : null}
                </div>
              );
            })}
            {/* Market reference line + labelled tag */}
            <div
              className="absolute left-0"
              style={{ bottom: `${(market / 100) * HIST_H}px`, width: `${anim.marketLinePct * 100}%`, borderTop: `2.5px dashed ${LINE}` }}
            />
            <div
              className="absolute right-0 rounded bg-[#16110e]/85 px-1.5 py-0.5 font-mono text-[12px] font-bold"
              style={{ bottom: `${(market / 100) * HIST_H}px`, color: LINE, transform: "translateY(-130%)", opacity: anim.marketLinePct }}
            >
              market {market}%
            </div>
          </div>
          <div className="mt-2 flex gap-2.5">
            {ALL_HANDLES.map((h) => {
              const on = picks.has(h);
              return (
                <span
                  key={h}
                  className="flex-1 truncate text-center font-mono text-[10.5px] font-semibold"
                  style={{ color: on ? DIM : FAINT, opacity: on ? 1 : 0.55 }}
                >
                  {metaOf(h).short}
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex-1" />

        {/* Footer: microcopy + Built On (left) + CTA (right) */}
        <div style={{ opacity: anim.footerOpacity, transform: `translateY(${anim.footerY}px)` }}>
          <p className="mb-3 font-mono text-[12px]" style={{ color: FAINT }}>
            Market = Polymarket · Swarm = mean agent fair value · swarmarena.ai
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

/** One Market/Swarm bar row (label · track · %). */
function Bar({
  label,
  valuePct,
  fillPct,
  color,
  strong,
}: {
  label: string;
  valuePct: number;
  fillPct: number;
  color: string;
  strong: boolean;
}) {
  return (
    <div className="flex items-center gap-3.5">
      <span className="w-[5.4em] font-mono text-[11px] font-bold uppercase tracking-[0.04em]" style={{ color: DIM }}>
        {label}
      </span>
      <span className="block h-[1.35em] flex-1 overflow-hidden rounded-md" style={{ background: INSET }}>
        <span className="block h-full" style={{ width: `${valuePct * fillPct}%`, background: color }} />
      </span>
      <span className="w-[2.9em] text-right font-mono text-[17px] font-bold" style={{ color: strong ? color : CREAM }}>
        {valuePct}%
      </span>
    </div>
  );
}

/** Static still — wraps the View in the 650×1110 card box (Onur's model-card size). */
export default function ConsensusCard({
  data = SAMPLE_CONSENSUS_CARD,
  assetBase,
}: {
  data?: ConsensusCardData;
  assetBase?: string;
}) {
  return (
    <article
      className="relative h-[1110px] w-[650px] overflow-clip rounded-2xl font-sans"
      data-card="consensus"
    >
      <ConsensusCardView data={data} assetBase={assetBase} />
    </article>
  );
}
