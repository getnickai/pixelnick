/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";

const ASSET = "/swarm-arena-cards/assets";
const MODELS_ASSET = `${ASSET}/models`;

/**
 * Swarm Arena model card — the design source of truth for this card (Pixelnick
 * Design). Renders the Figma sample by default (no props → /static preview is
 * unchanged); the Engine kit passes live `data` mapped from /api/swarm-deck.
 *
 * One design definition, two render modes (the performance-card pattern):
 *   - The default export is the settled still — plain DOM, what /static, the
 *     Engine surfaces and in-browser PNG export render.
 *   - `SwarmArenaModelCardView` takes a `SwarmArenaModelCardAnim` so the
 *     Remotion composition (remotion/compositions/swarm-arena-model-card) can
 *     drive every entrance per-frame. Same component → the still and the
 *     animation can never drift.
 *
 * Bundling constraint: this module is pulled into Remotion's webpack via the
 * composition — keep it free of "@/" alias imports and Next-only APIs.
 */
/** A pick: the bet sentence (left, ends "at:") + the price (right-aligned).
 *  e.g. text "Germany vs Curacao, back both teams to score at:", price "0.33". */
export type ModelCardPick = { text: string; price: string };

export type SwarmArenaModelCardData = {
  /** Display name, e.g. "GPT 5.5" / "Kimi K2". */
  name: string;
  /** Monochrome mark URL (rendered black in the white circle). */
  logo?: string;
  /** Fallback avatar when there is no logo: short code + brand color. */
  monogram?: string;
  monogramColor?: string;
  pnlUsd: number;
  profitPct: number;
  equityUsd: number;
  baseUsd: number;
  pickAccuracyPct: number;
  record: string;
  rank: number | string;
  rankOf: number;
  topPick?: ModelCardPick;
  latestPicks: ModelCardPick[];
  /** Equity curve for the background chart (raw values; normalized to fit). */
  spark?: number[];
};

/** The Figma sample (GPT 5.5) — what /static renders, and the design baseline. */
export const SAMPLE_MODEL_CARD: SwarmArenaModelCardData = {
  name: "GPT",
  logo: `${MODELS_ASSET}/chatgpt.svg`,
  pnlUsd: 184,
  profitPct: 27.97,
  equityUsd: 1184,
  baseUsd: 1000,
  pickAccuracyPct: 71,
  record: "17-7",
  rank: 1,
  rankOf: 11,
  topPick: { text: "PSG vs INTER, back both teams to score at:", price: "0.58" },
  latestPicks: [
    { text: "PSG vs INTER, back PSG at:", price: "0.44" },
    { text: "PSG vs INTER, back more than 2.5 goals at:", price: "0.44" },
    { text: "ARSENAL vs MADRID, back ARSENAL at:", price: "0.51" },
  ],
  // Stepped equity curve (plateaus + ramps) for the background chart.
  spark: [1004, 1004, 1188, 1188, 1092, 1092, 1002, 1002, 1190, 1190, 1096, 1184],
};

/**
 * Per-frame animation values. Every animatable element reads its opacity /
 * transform from here. The Remotion composition computes these from
 * `useCurrentFrame()`; the static still omits them and gets `SETTLED_MODEL_CARD_ANIM`
 * (the final, fully-revealed state). When adding a new element to the card,
 * decide whether it animates — if so, add its values here AND to the settled
 * state; if not, it simply renders unanimated.
 */
export type SwarmArenaModelCardAnim = {
  headerOpacity: number;
  headerY: number;
  rankHexOpacity: number;
  rankHexScale: number;
  rankNumOpacity: number;
  rankNumScale: number;
  rankRibbonOpacity: number;
  rankRibbonScale: number;
  tagDotOpacity: number;
  tagDotScale: number;
  tagPillOpacity: number;
  tagPillScale: number;
  tagWorldOpacity: number;
  tagWorldY: number;
  avatarOpacity: number;
  avatarScale: number;
  modelNameOpacity: number;
  modelNameY: number;
  pnlLabelOpacity: number;
  pnlValueOpacity: number;
  /** Blur (px) on the PNL value — held high, then cleared for the focus-in reveal. */
  pnlBlur: number;
  /** Accent bar next to the PNL value (the composition adds a breathe pulse). */
  barScaleX: number;
  barScaleY: number;
  profitLabelOpacity: number;
  profitRowOpacity: number;
  /** Blur (px) on the Profit row — focus-in reveal, in sync with the PNL value. */
  profitBlur: number;
  /** 0..1 progress — the view multiplies by the divider's resting 0.12. */
  dividerOpacity: number;
  equityOpacity: number;
  equityY: number;
  glassOpacity: number;
  glassY: number;
  statOpacities: [number, number, number];
  topPickOpacity: number;
  picksLabelOpacity: number;
  /** Per latest-pick row; a missing index renders fully visible. */
  pickRowOpacities: number[];
  builtOnOpacity: number;
  builtOnY: number;
  ctaOpacity: number;
  ctaY: number;
  /** Background spark chart: fade + left→right wipe (inset from the right, %). */
  sparkOpacity: number;
  sparkRevealRightPct: number;
  /**
   * Number render nodes. The composition passes animated <SlidingDigitCount>
   * here; the static still leaves them undefined and the view renders the
   * final formatted value.
   */
  pnlNode?: ReactNode;
  profitNode?: ReactNode;
};

/** Final, fully-revealed state — used by the static still and as the baseline. */
export const SETTLED_MODEL_CARD_ANIM: SwarmArenaModelCardAnim = {
  headerOpacity: 1,
  headerY: 0,
  rankHexOpacity: 1,
  rankHexScale: 1,
  rankNumOpacity: 1,
  rankNumScale: 1,
  rankRibbonOpacity: 1,
  rankRibbonScale: 1,
  tagDotOpacity: 1,
  tagDotScale: 1,
  tagPillOpacity: 1,
  tagPillScale: 1,
  tagWorldOpacity: 1,
  tagWorldY: 0,
  avatarOpacity: 1,
  avatarScale: 1,
  modelNameOpacity: 1,
  modelNameY: 0,
  pnlLabelOpacity: 1,
  pnlValueOpacity: 1,
  pnlBlur: 0,
  barScaleX: 1,
  barScaleY: 1,
  profitLabelOpacity: 1,
  profitRowOpacity: 1,
  profitBlur: 0,
  dividerOpacity: 1,
  equityOpacity: 1,
  equityY: 0,
  glassOpacity: 1,
  glassY: 0,
  statOpacities: [1, 1, 1],
  topPickOpacity: 1,
  picksLabelOpacity: 1,
  pickRowOpacities: [1, 1, 1],
  builtOnOpacity: 1,
  builtOnY: 0,
  ctaOpacity: 1,
  ctaY: 0,
  sparkOpacity: 1,
  sparkRevealRightPct: 0,
};

const GREEN = "#8bce6c";
const ROSE = "#ff6b6b";

const fmtMoney = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

/* ───────────────────────── Background spark chart ─────────────────────────
   Recharts-style "rounded step": straight segments between points with every
   elbow rounded by an arc (the snippet's A8,8 corners). Pure SVG — no chart
   dependency; the path is generated from the raw spark values. */

function roundedSparkPath(pts: { x: number; y: number }[], r: number): string {
  if (pts.length < 2) return "";
  const f = (n: number) => +n.toFixed(2);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const p = pts[i];
    const next = pts[i + 1];
    const v1 = { x: p.x - prev.x, y: p.y - prev.y };
    const v2 = { x: next.x - p.x, y: next.y - p.y };
    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    if (!l1 || !l2) continue;
    // Proper tangent fillet: the trim distance follows the turn angle
    // (d = r·tan(φ/2)). A fixed trim turns shallow elbows into semicircle
    // bumps — the arc's chord outgrows what the radius can span.
    const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)));
    const phi = Math.acos(cos); // turn angle: 0 = straight on
    if (phi < 0.05) continue; // < ~3° → effectively straight
    let trim = r * Math.tan(phi / 2);
    let rr = r;
    const trimMax = Math.min(l1, l2) / 2;
    if (trim > trimMax) {
      trim = trimMax;
      rr = trim / Math.tan(phi / 2);
    }
    const entry = { x: p.x - (v1.x / l1) * trim, y: p.y - (v1.y / l1) * trim };
    const exit = { x: p.x + (v2.x / l2) * trim, y: p.y + (v2.y / l2) * trim };
    const sweep = v1.x * v2.y - v1.y * v2.x > 0 ? 1 : 0;
    d += `L${f(entry.x)},${f(entry.y)}A${f(rr)},${f(rr)},0,0,${sweep},${f(exit.x)},${f(exit.y)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${f(last.x)},${f(last.y)}`;
  return d;
}

const SPARK_W = 650;
const SPARK_H = 410;
/** The line stays in the card's bottom region (band sits at y 700 — peaks at
 *  ~790 emerge from behind the glass panel's lower edge, and the curve fades
 *  out under the bottom progressive blur). */
const SPARK_TOP = 90;
const SPARK_BOT = SPARK_H - 60;

function SparkChartPlot({ spark, accent }: { spark: number[]; accent: string }) {
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const range = max - min;
  const y = (v: number) =>
    range ? SPARK_BOT - ((v - min) / range) * (SPARK_BOT - SPARK_TOP) : (SPARK_TOP + SPARK_BOT) / 2;
  const pts = spark.map((v, i) => ({ x: (i / (spark.length - 1)) * SPARK_W, y: y(v) }));
  const d = roundedSparkPath(pts, 30);
  const fillId = `sa-spark-${accent.replace("#", "")}`;
  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          {/* Same fall-off as the HTML card's ridge fill (0.34 → 0). */}
          <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d}L${SPARK_W},${SPARK_BOT}L0,${SPARK_BOT}Z`} fill={`url(#${fillId})`} />
      <path d={d} stroke={accent} strokeOpacity="0.9" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The card's content — every absolutely-positioned layer inside the 650×1110
 * box. The host provides the box: the static still wraps it in an <article>
 * (below); the Remotion composition wraps it in an <AbsoluteFill> and drives
 * `anim` per frame.
 */
export function SwarmArenaModelCardView({
  data,
  assetBase = ASSET,
  anim = SETTLED_MODEL_CARD_ANIM,
}: {
  data: SwarmArenaModelCardData;
  assetBase?: string;
  anim?: SwarmArenaModelCardAnim;
}) {
  const pos = data.pnlUsd >= 0;
  const accent = pos ? GREEN : ROSE;
  const sparkClip: CSSProperties =
    anim.sparkRevealRightPct > 0
      ? { clipPath: `inset(0 ${anim.sparkRevealRightPct}% 0 0)` }
      : {};

  return (
    <>
      {/* Card surface gradient — the single source of truth for the background,
          shared by the static still and the Remotion composition. Sits behind
          every layer (the watermarks blend over it; the panel/footer blurs
          sample it). Hosts (article / AbsoluteFill) own only size + clipping. */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />

      {/* Decorative logo-shape watermark — bottom left (behind content, so the
          glass panel's backdrop-blur and the bottom progressive blur both bite on it) */}
      <div className="pointer-events-none absolute left-[-127.46px] top-[766.37px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${assetBase}/logoshp-bottom.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>

      {/* Decorative logo-shape watermark — top right (behind content) */}
      <div className="pointer-events-none absolute left-[318px] top-[-284.61px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${assetBase}/logoshp-top.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>

      {/* Background equity chart — rounded-step spark over a dashed grid.
          Sits behind the content stack (the glass panel's backdrop-blur frosts
          the section it overlaps, like the watermarks); crisp in the open
          strips. Tick labels render separately after the blur band. */}
      {data.spark && data.spark.length > 1 ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-[700px]"
          style={{ opacity: anim.sparkOpacity, ...sparkClip }}
        >
          <SparkChartPlot spark={data.spark} accent={accent} />
        </div>
      ) : null}

      {/* Header — Swarm Arena lockup */}
      <div
        className="absolute left-16 top-[57px] flex items-center gap-5"
        style={{
          opacity: anim.headerOpacity,
          transform: `translateY(${anim.headerY}px)`,
        }}
      >
        <img
          alt=""
          src={`${assetBase}/logos/swarm-arena.svg`}
          className="h-10 w-[35.012px] shrink-0"
        />
        <p className="font-sans text-2xl font-bold uppercase leading-none text-[#fff8ea]">
          Swarm Arena
        </p>
      </div>

      {/* Main content stack */}
      <div className="absolute left-16 top-[169px] flex w-[522px] flex-col gap-16">
        {/* Top: tags + model */}
        <div className="flex w-full flex-col gap-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="size-[27px] shrink-0 rounded-full bg-[#8bce6c]"
                style={{
                  opacity: anim.tagDotOpacity,
                  transform: `scale(${anim.tagDotScale})`,
                }}
              />
              <div
                className="flex items-center justify-center rounded-full bg-[#8bce6c] px-3 py-1"
                style={{
                  opacity: anim.tagPillOpacity,
                  transform: `scale(${anim.tagPillScale})`,
                  transformOrigin: "left center",
                }}
              >
                <p className="text-base font-semibold uppercase leading-[1.2] text-[#161210]">
                  Live Agent
                </p>
              </div>
            </div>
            <p
              className="text-base font-semibold uppercase leading-[1.2] text-[#ED6A4C]"
              style={{
                opacity: anim.tagWorldOpacity,
                transform: `translateY(${anim.tagWorldY}px)`,
              }}
            >
              World Cup
            </p>
          </div>

          <div className="flex w-full items-center gap-5">
            {data.logo ? (
              <div
                className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full bg-white"
                style={{
                  opacity: anim.avatarOpacity,
                  transform: `scale(${anim.avatarScale})`,
                }}
              >
                <img alt={data.name} src={data.logo} className="size-[39px]" />
              </div>
            ) : (
              <div
                className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full font-mono text-[22px] font-bold"
                style={{
                  background: `${data.monogramColor ?? "#8a8174"}22`,
                  border: `1px solid ${data.monogramColor ?? "#8a8174"}66`,
                  color: data.monogramColor ?? "#fff8ea",
                  opacity: anim.avatarOpacity,
                  transform: `scale(${anim.avatarScale})`,
                }}
              >
                {data.monogram ?? data.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p
              className="min-w-0 flex-1 font-heading text-[54px] font-semibold leading-[1.2] text-[#fff8ea]"
              style={{
                opacity: anim.modelNameOpacity,
                transform: `translateY(${anim.modelNameY}px)`,
              }}
            >
              {data.name}
            </p>
          </div>
        </div>

        {/* Bottom: metrics + glass panel */}
        <div className="flex w-full flex-col gap-12">
          {/* Metrics */}
          <div className="flex w-full flex-col justify-center gap-6">
            <div className="flex w-full items-start gap-8">
              {/* Season PNL */}
              <div className="flex flex-1 flex-col gap-4">
                <p
                  className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90"
                  style={{ opacity: anim.pnlLabelOpacity }}
                >
                  Season PNL
                </p>
                <div className="relative">
                  <p
                    className="font-heading text-[54px] font-semibold leading-none tracking-[1px]"
                    style={{
                      opacity: anim.pnlValueOpacity,
                      color: accent,
                      filter: `blur(${anim.pnlBlur}px)`,
                    }}
                  >
                    {anim.pnlNode ?? (
                      <>
                        {pos ? "+" : "−"}
                        {fmtMoney(data.pnlUsd)}
                      </>
                    )}
                  </p>
                  {/* Accent bar, centered on the value, bleeding off the left edge */}
                  <div
                    className="absolute top-1/2 -left-[86px] h-[41px] w-[39px] rounded-lg"
                    style={{
                      background: accent,
                      transform: `translateY(-50%) scale(${anim.barScaleX}, ${anim.barScaleY})`,
                      transformOrigin: "left center",
                    }}
                  />
                </div>
              </div>

              {/* Profit % */}
              <div className="flex flex-1 flex-col gap-4">
                <p
                  className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90"
                  style={{ opacity: anim.profitLabelOpacity }}
                >
                  Profit %
                </p>
                <div
                  className="flex items-center gap-4"
                  style={{ opacity: anim.profitRowOpacity, filter: `blur(${anim.profitBlur}px)` }}
                >
                  <img
                    alt=""
                    src={`${assetBase}/arrow-up.svg`}
                    className={`h-10 w-[34.29px] shrink-0${pos ? "" : " rotate-180"}`}
                  />
                  <p className="whitespace-nowrap font-heading text-[54px] font-semibold leading-none tracking-[1px] text-[#fff8ea]">
                    {anim.profitNode ?? `${Math.abs(data.profitPct).toFixed(2)}%`}
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-[0.97px] w-full bg-[#fff8ea]"
              style={{ opacity: anim.dividerOpacity * 0.12 }}
            />

            {/* Equity */}
            <div
              className="flex w-full items-center justify-between"
              style={{
                opacity: anim.equityOpacity,
                transform: `translateY(${anim.equityY}px)`,
              }}
            >
              <div className="flex items-end gap-3">
                <p className="text-[28px] font-semibold leading-none text-[#fff8ea]">
                  {fmtMoney(data.equityUsd)}
                </p>
                <p className="pb-1 text-xl font-normal leading-4 text-[#8a8174]">
                  Equity
                </p>
              </div>
              <p className="text-xl font-normal leading-4 text-[#8a8174]">
                <span className="font-semibold text-[#fff8ea]">{fmtMoney(data.baseUsd)}</span> base
              </p>
            </div>
          </div>

          {/* Glass stats panel */}
          <div
            className="flex w-full flex-col gap-9 rounded-2xl bg-[rgba(10,10,6,0.5)] p-8 backdrop-blur-[24px]"
            style={{
              opacity: anim.glassOpacity,
              transform: `translateY(${anim.glassY}px)`,
            }}
          >
            <div className="flex w-full items-center gap-9">
              <Stat
                label="Pick Accuracy"
                value={`${Math.round(data.pickAccuracyPct)}%`}
                opacity={anim.statOpacities[0]}
              />
              <Stat label="Record" value={data.record} opacity={anim.statOpacities[1]} />
              <Stat
                label="Rank"
                value={`#${data.rank} / ${data.rankOf}`}
                opacity={anim.statOpacities[2]}
              />
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              {/* Top pick — bet sentence left, price right-aligned */}
              <div className="flex w-full flex-col gap-1.5" style={{ opacity: anim.topPickOpacity }}>
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Top Pick
                </p>
                <div className="flex w-full items-baseline justify-between gap-3 text-[15px] font-bold leading-snug text-[#8bce6c]">
                  <span className="flex-1">{data.topPick?.text ?? "No open picks"}</span>
                  <span className="shrink-0 text-right tabular-nums">{data.topPick?.price ?? "—"}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full py-[7px]" style={{ opacity: anim.topPickOpacity }}>
                <div className="h-[0.97px] w-full bg-[#2e2c26]" />
              </div>

              {/* Latest picks — one full bet sentence per line */}
              <div className="flex w-full flex-col gap-1.5">
                <p
                  className="text-xs font-semibold uppercase leading-none text-[#8a8174]"
                  style={{ opacity: anim.picksLabelOpacity }}
                >
                  Latest Picks
                </p>
                <div className="flex w-full flex-col gap-2 text-[14px] font-semibold leading-snug text-[#fff8ea]">
                  {data.latestPicks.length ? (
                    data.latestPicks.map((pick, i) => (
                      <div
                        key={`${pick.text}-${i}`}
                        className="flex w-full items-baseline justify-between gap-3"
                        style={{ opacity: anim.pickRowOpacities[i] ?? 1 }}
                      >
                        <span className="flex-1">{pick.text}</span>
                        <span className="shrink-0 text-right tabular-nums">{pick.price}</span>
                      </div>
                    ))
                  ) : (
                    <p
                      className="text-[#8a8174]"
                      style={{ opacity: anim.pickRowOpacities[0] ?? 1 }}
                    >
                      No picks yet
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive blur — bottom band (Figma: progressiveblur 354:44, ~169px).
          Layered backdrop-blur passes, each masked to fade out toward the top so
          blur ramps up to the bottom edge. Sits above the backdrop/watermark but
          below the footer so BUILT ON / NickAI / CTA stay crisp. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[290px] overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-[76%] backdrop-blur-[4px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[56%] backdrop-blur-[8px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[36%] backdrop-blur-[16px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>

      {/* Footer — built-on credit */}
      <div
        className="absolute left-[77px] top-[997px] flex w-[119.219px] flex-col gap-0.5"
        style={{
          opacity: anim.builtOnOpacity,
          transform: `translateY(${anim.builtOnY}px)`,
        }}
      >
        <p className="font-mono text-[11.5px] font-normal uppercase leading-none tracking-[2px] text-[#7e7568]">
          Built On
        </p>
        <img
          alt="NickAI"
          src={`${assetBase}/NickAI-wordmark-white.svg`}
          className="h-[28.39px] w-[119.219px]"
        />
      </div>

      {/* Footer — CTA */}
      <div
        className="absolute left-[314px] top-[993px] flex items-center gap-[9px] rounded-xl px-5 py-4 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(169.388deg, #ED6A4C 17.138%, #DC4416 89.208%)",
          opacity: anim.ctaOpacity,
          transform: `translateY(${anim.ctaY}px)`,
        }}
      >
        <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
          View on Swarm Arena
        </p>
        <svg
          className="size-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Rank badge — glossy hexagon + rank number + RANK ribbon, top-right */}
      <div className="absolute left-[472px] top-[61.5px] size-[106.408px]">
        <div
          className="absolute inset-0"
          style={{
            opacity: anim.rankHexOpacity,
            transform: `scale(${anim.rankHexScale})`,
            transformOrigin: "center",
          }}
        >
          <div className="absolute inset-[2.33%_6.7%]">
            <img
              alt=""
              src={`${assetBase}/rank-hex.svg`}
              className="block size-full max-w-none"
            />
          </div>
          <div className="absolute left-[4.85px] top-[4.85px] size-[96.706px] mix-blend-screen">
            <div className="absolute inset-[1.92%_6.7%]">
              <img
                alt=""
                src={`${assetBase}/rank-hex-overlay.svg`}
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>

        {/* RANK ribbon — banner across the hexagon's lower third */}
        <div
          className="absolute left-[-16.3px] top-[52px] h-[50px] w-[139px]"
          style={{
            opacity: anim.rankRibbonOpacity,
            transform: `scale(${anim.rankRibbonScale})`,
            transformOrigin: "center",
          }}
        >
          <img alt="" src={`${assetBase}/rank-ribbon.svg`} className="block size-full" />
          <div className="absolute inset-x-0 top-0 flex h-[31px] items-center justify-center">
            <span className="font-heading text-[18px] font-bold uppercase leading-none text-[#0d0907]">
              Rank
            </span>
          </div>
        </div>

        {/* Rank number — centered in the upper hexagon, above the ribbon */}
        <div
          className="absolute inset-x-0 top-0 flex h-[76px] items-center justify-center"
          style={{
            opacity: anim.rankNumOpacity,
            transform: `scale(${anim.rankNumScale})`,
          }}
        >
          <span className="font-heading text-[48px] font-bold leading-none tracking-[1px] text-[#fff8ea]">
            {data.rank}
          </span>
        </div>
      </div>
    </>
  );
}

/**
 * Static performance still — the settled state of the single design source,
 * as plain DOM (html-to-image can rasterise it). The animated version is the
 * same view driven per frame by the Remotion composition.
 */
export default function SwarmArenaModelCard({
  data = SAMPLE_MODEL_CARD,
  assetBase = ASSET,
}: {
  data?: SwarmArenaModelCardData;
  /**
   * Base URL for the card's chrome assets (logo marks, rank hex, arrow,
   * wordmark). Defaults to the public path, which resolves against the origin
   * in the browser (app / Player). Headless Remotion renders pass a
   * `staticFile()`-prefixed base so the bundler serves them. (STA-417)
   */
  assetBase?: string;
}) {
  return (
    <article
      className="relative h-[1110px] w-[650px] overflow-clip rounded-2xl font-sans"
      data-node-id="350:124"
    >
      <SwarmArenaModelCardView data={data} assetBase={assetBase} />
    </article>
  );
}

function Stat({
  label,
  value,
  opacity = 1,
}: {
  label: string;
  value: string;
  opacity?: number;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1" style={{ opacity }}>
      <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
        {label}
      </p>
      <p className="text-[28px] font-bold leading-none text-[#fff8ea]">{value}</p>
    </div>
  );
}
