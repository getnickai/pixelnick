/* eslint-disable @next/next/no-img-element */
import type { CSSProperties, ReactNode } from "react";
// Relative (not "@/") import: this view is bundled by Remotion's webpack (via
// the composition) for headless generation, which doesn't resolve the "@/" alias.
import type { PerformanceCardProps } from "../remotion/compositions/performance-card/props";

const ASSET = "/figma";

/** Decorative bottom chart stroke (`line-graph.svg`). Flip to `false` to hide. */
const SHOW_DECORATIVE_LINE_GRAPH = true;

/**
 * Per-frame animation values for the performance card. Every animatable element
 * reads its opacity / transform from here. The Remotion composition computes
 * these from `useCurrentFrame()`; the static still (`AiReadyCard`) omits them
 * and gets `SETTLED_ANIM` (the final, fully-revealed state).
 */
export type PerformanceCardAnim = {
  glowOverlayOpacity: number;
  glowSvgOpacity: number;
  agentIllustrationOpacity: number;
  logoOpacity: number;
  logoY: number;
  pillOpacity: number;
  pillScale: number;
  headlineOpacity: number;
  headlineY: number;
  pnlLabelOpacity: number;
  barOpacity: number;
  barScaleX: number;
  barScaleY: number;
  runsOpacity: number;
  tradesOpacity: number;
  profitOpacity: number;
  profitLabelOpacity: number;
  metaRow1Opacity: number;
  metaRow1Y: number;
  metaRow2Opacity: number;
  metaRow2Y: number;
  builtByOpacity: number;
  authorOpacity: number;
  authorY: number;
  ctaOpacity: number;
  graphInsetRight: number;
  /**
   * Number render nodes. The composition passes animated <SlidingDigitCount>
   * here; the static still leaves them undefined and the view renders the
   * final formatted value (matching SlidingDigitCount's settled output).
   */
  pnlNode?: ReactNode;
  profitNode?: ReactNode;
};

/** Final, fully-revealed state — used by the static still and as the baseline. */
export const SETTLED_ANIM: PerformanceCardAnim = {
  glowOverlayOpacity: 0.14,
  glowSvgOpacity: 1,
  agentIllustrationOpacity: 0.1,
  logoOpacity: 1,
  logoY: 0,
  pillOpacity: 1,
  pillScale: 1,
  headlineOpacity: 1,
  headlineY: 0,
  pnlLabelOpacity: 1,
  barOpacity: 1,
  barScaleX: 1,
  barScaleY: 1,
  runsOpacity: 1,
  tradesOpacity: 1,
  profitOpacity: 1,
  profitLabelOpacity: 1,
  metaRow1Opacity: 1,
  metaRow1Y: 0,
  metaRow2Opacity: 1,
  metaRow2Y: 0,
  builtByOpacity: 1,
  authorOpacity: 1,
  authorY: 0,
  ctaOpacity: 1,
  graphInsetRight: 0,
};

/** Settled PNL text: "$3,275.12" — abs value, commas, 2dp. Loss is signalled by
 *  the down-arrow icon (matches <SlidingDigitCount> without showSign). */
function formatPnl(pnl: number): string {
  return `$${Math.abs(pnl).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Settled profit text: "+27.97%" / "−3.28%" (U+2212 minus, matches showSign). */
function formatProfit(p: number): string {
  const sign = p < 0 ? "−" : "+";
  return `${sign}${Math.abs(p).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}%`;
}

/**
 * The performance card design — the SINGLE source of truth, as plain DOM.
 *
 * Rendered two ways:
 *   - Static still: `components/ai-ready-card.tsx` renders this with the default
 *     `SETTLED_ANIM`, so it's plain HTML that html-to-image can rasterise to a
 *     PNG (gallery thumbnails, `/embed`, `/static`, the download button).
 *   - Animated: `remotion/.../performance-card/composition.tsx` renders this
 *     every frame with computed `anim` values + <SlidingDigitCount> number
 *     nodes (the `<Player>` preview, MP4 generation).
 *
 * Edit the design here once; both the live preview and every generated card
 * update. The card fills its positioned parent (a 650×1136 `<article>` for the
 * still, an `<AbsoluteFill>` for Remotion).
 */
export function PerformanceCardView({
  props,
  anim = SETTLED_ANIM,
}: {
  props: PerformanceCardProps;
  anim?: PerformanceCardAnim;
}) {
  const {
    agentName,
    pnl,
    profitPercent,
    runs,
    trades,
    builderName,
    builderAvatar,
    activeSince,
    nodes,
    nextRun,
  } = props;

  const isLossPercent = profitPercent < 0;
  // Loss polarity drives the colour: green when up, red when down. The PNL chip
  // (bar + icon + value pill) keys off the PNL value; the profit arrow + number
  // key off profit %. They agree in sign in practice but are derived independently.
  const isLossPnl = pnl < 0;
  const pnlFill = isLossPnl ? "bg-red-600" : "bg-green-600";
  const profitColor = isLossPercent ? "text-red-500" : "text-white";
  const pnlNode = anim.pnlNode ?? formatPnl(pnl);
  const profitNode = anim.profitNode ?? formatProfit(profitPercent);

  return (
    <div className="absolute inset-0 overflow-clip bg-primary-1000 font-sans">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_70%_38%,var(--color-primary-500)_0%,transparent_62%)]"
        style={{ opacity: anim.glowOverlayOpacity }}
        aria-hidden
      />

      {/* Background glow (blob SVG) */}
      <div
        className="pointer-events-none absolute left-[-314.95px] top-[195.5px] flex h-[1206px] w-[1191.312px] items-center justify-center"
        style={{ opacity: anim.glowSvgOpacity }}
      >
        <div className="-scale-y-100">
          <div className="relative h-[1206px] w-[1191.312px]">
            <div className="absolute inset-[-41.01%_-41.51%]">
              <img
                alt=""
                src={`${ASSET}/background-glow.svg`}
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Agent illustration (organic wave blob) */}
      <div
        className="pointer-events-none absolute left-[-326px] top-[-222px] flex h-[865px] w-[1347px] items-center justify-center"
        style={{ opacity: anim.agentIllustrationOpacity }}
      >
        <div className="-rotate-90 -scale-y-100">
          <div className="relative h-[1347px] w-[865px]">
            <img
              alt=""
              src={`${ASSET}/agent-illustration.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div
        className="absolute left-16 top-[63px] h-[30px] w-[140.211px]"
        style={{ opacity: anim.logoOpacity, transform: `translateY(${anim.logoY}px)` }}
      >
        <div className="absolute inset-[0_-2.32%_0_0]">
          <img alt="NickAI" src={`${ASSET}/logo.svg`} className="block size-full max-w-none" />
        </div>
      </div>

      {/* Card content stack. The vertical-centering offset is an INLINE style
          (not a `-translate-y-[calc(...)]` arbitrary class): that class is
          invalid CSS without underscore-spaces, so the production Tailwind build
          drops it (transform: none) and the un-shifted content collides with the
          footer. Inline style parses correctly and can't be purged. */}
      <div
        className="absolute left-16 top-1/2 flex w-[522px] flex-col gap-[72px]"
        style={{ transform: "translateY(calc(-50% - 30.5px))" }}
      >
        {/* Top: Type indicator + headline */}
        <div className="flex w-full flex-col gap-4">
          {/* Type indicator pill */}
          <div
            className="relative inline-flex shrink-0 items-center gap-[9px] self-start rounded-full bg-green-600 px-3 py-0.5 font-sans text-white"
            style={{
              opacity: anim.pillOpacity,
              transform: `scale(${anim.pillScale})`,
              transformOrigin: "left center",
            }}
          >
            <svg
              className="size-6 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden
            >
              <path
                d="M12 14C13.1046 14 14 13.1046 14 12C14 10.8954 13.1046 10 12 10C10.8954 10 10 10.8954 10 12C10 13.1046 10.8954 14 12 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 8C6.5 9 6 10.5 6 12C6 13.5 6.5 15 7.5 16"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M4.5 6C3 7.5 2 9.5 2 12C2 14.5 3 16.5 4.5 18"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.5 16C17.5 15 18 13.5 18 12C18 10.5 17.5 9 16.5 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M19.5 18C21 16.5 22 14.5 22 12C22 9.5 21 7.5 19.5 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <p className="whitespace-nowrap text-base font-semibold uppercase leading-6">
              Live Trading Agent
            </p>
          </div>

          {/* Headline */}
          <h1
            className="w-full font-heading text-[54px] font-semibold leading-[1.2] text-white"
            style={{ opacity: anim.headlineOpacity, transform: `translateY(${anim.headlineY}px)` }}
          >
            {agentName}
          </h1>
        </div>

        {/* Bottom: metrics + meta */}
        <div className="flex w-full flex-col gap-16">
          {/* Metrics row */}
          <div className="flex w-full flex-col items-start justify-center gap-14">
            {/* Total PNL */}
            <div className="relative flex w-full flex-col items-start gap-4">
              <p
                className="w-full font-heading text-2xl font-semibold leading-[1.2] text-white"
                style={{ opacity: anim.pnlLabelOpacity }}
              >
                Total PNL
              </p>
              <div className="relative flex items-center justify-center gap-6">
                {/* Decorative left-edge green bar */}
                <div
                  className={`absolute -left-[87px] top-0 bottom-0 w-10 rounded-none rounded-r-3xl ${pnlFill}`}
                  style={{
                    opacity: anim.barOpacity,
                    transform: `scale(${anim.barScaleX}, ${anim.barScaleY})`,
                    transformOrigin: "center left",
                    backfaceVisibility: "hidden",
                  }}
                />
                <div className="inline-flex items-center gap-1" style={{ opacity: anim.pnlLabelOpacity }}>
                  <span
                    className={`grid size-[3.75rem] shrink-0 place-items-center rounded-4xl rounded-r-lg ${pnlFill} text-white`}
                    aria-hidden
                  >
                    {pnl < 0 ? (
                      <svg
                        className="size-9 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          d="M4 12H20"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-9 shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M12 2.75C12.6904 2.75 13.25 3.30964 13.25 4V10.75H20C20.6904 10.75 21.25 11.3096 21.25 12C21.25 12.6904 20.6904 13.25 20 13.25H13.25V20C13.25 20.6904 12.6904 21.25 12 21.25C11.3096 21.25 10.75 20.6904 10.75 20V13.25H4C3.30964 13.25 2.75 12.6904 2.75 12C2.75 11.3096 3.30964 10.75 4 10.75H10.75V4C10.75 3.30964 11.3096 2.75 12 2.75Z"
                          fill="currentColor"
                        />
                      </svg>
                    )}
                  </span>
                  <span className={`inline-flex h-[3.75rem] items-center whitespace-nowrap rounded-4xl rounded-l-lg ${pnlFill} px-6 font-heading text-5xl font-medium leading-none text-white`}>
                    {pnlNode}
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div className="flex items-center gap-2" style={{ opacity: anim.runsOpacity }}>
                    <div className="size-2 shrink-0 rounded-full bg-white" />
                    <p className="whitespace-nowrap font-sans text-base font-medium leading-[1.4] text-white">
                      {runs} Runs
                    </p>
                  </div>
                  <div className="flex items-center gap-2" style={{ opacity: anim.tradesOpacity }}>
                    <div className="size-2 shrink-0 rounded-full bg-white" />
                    <p className="whitespace-nowrap font-sans text-base font-medium leading-[1.4] text-white">
                      {trades} Trades
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Profit % */}
            <div
              className="flex w-[219px] flex-col items-start gap-3"
              style={{ opacity: anim.profitOpacity }}
            >
              <p
                className="w-full font-heading text-2xl font-semibold leading-[1.2] text-white"
                style={{ opacity: anim.profitLabelOpacity }}
              >
                Profit %
              </p>
              <div className={`flex items-center gap-4 ${profitColor}`}>
                <div
                  className="relative h-8 w-[27.429px] shrink-0"
                  style={{ transform: isLossPercent ? "rotate(180deg)" : undefined }}
                >
                  {/* Inline (not <img>) so the arrow inherits currentColor — white on
                      a gain, red on a loss — instead of the SVG's baked-in fill. */}
                  <div className="absolute inset-[-6.63%_-7.73%_-4.69%_-7.73%]">
                    <svg
                      viewBox="0 0 31.6712 35.6213"
                      fill="none"
                      preserveAspectRatio="none"
                      className="block size-full max-w-none"
                      aria-hidden
                    >
                      <path
                        d="M29.5499 15.8356L15.8356 2.12132L2.12132 15.8356M15.8356 3.26418V34.1213"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="square"
                      />
                    </svg>
                  </div>
                </div>
                <p className="whitespace-nowrap font-heading text-5xl font-medium leading-[1.4]">
                  {profitNode}
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col items-start gap-6 font-sans">
            <div
              className="flex items-center gap-3"
              style={{ opacity: anim.metaRow1Opacity, transform: `translateY(${anim.metaRow1Y}px)` }}
            >
              <div className="relative h-5 w-[18px] shrink-0">
                <div className="absolute inset-[-3.75%_-4.17%]">
                  <img alt="" src={`${ASSET}/icon-calendar.svg`} className="block size-full max-w-none" />
                </div>
              </div>
              <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                Active since {activeSince}
              </p>
            </div>
            <div
              className="flex items-center gap-6"
              style={{ opacity: anim.metaRow2Opacity, transform: `translateY(${anim.metaRow2Y}px)` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-[16.67px] w-[20.837px] shrink-0">
                  <div className="absolute inset-[-4.5%_-3.6%]">
                    <img alt="" src={`${ASSET}/icon-nodes.svg`} className="block size-full max-w-none" />
                  </div>
                </div>
                <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">{nodes} nodes</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative size-5 shrink-0">
                  <img
                    alt=""
                    src={`${ASSET}/icon-clock.svg`}
                    className="absolute inset-0 block size-full max-w-none"
                  />
                </div>
                <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                  Next run in {nextRun}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: author + CTA share one row so the pill stays beside the builder */}
      <div
        className="absolute bottom-[45px] left-16 right-10 flex flex-col gap-[26px]"
        style={{ opacity: anim.authorOpacity, transform: `translateY(${anim.authorY}px)` }}
      >
        <p
          className="pl-[68px] font-sans text-xl leading-4 text-zinc-400"
          style={{ opacity: anim.builtByOpacity }}
        >
          Built By:
        </p>
        <div className="flex w-full items-center">
          <div className="flex min-w-0 items-center gap-5">
            <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
              <img
                alt={builderName}
                src={builderAvatar}
                width={48}
                height={48}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
            <p className="w-[219px] shrink-0 font-heading text-2xl font-semibold leading-[1.2] text-white">
              {builderName}
            </p>
          </div>
          <div className="ml-auto shrink-0" style={{ opacity: anim.ctaOpacity }}>
            <div className="relative flex items-start">
              {/* Left decorative tab (rotated 180°) */}
              <div className="relative h-[56px] w-[46px] shrink-0 rotate-180">
                <img alt="" src={`${ASSET}/cta-tab.svg`} className="absolute inset-0 block size-full max-w-none" />
              </div>
              {/* Button body — solid brand blue, matching the tab.
                  -ml-[2px] overlaps the tab so no background seam shows between them. */}
              <div
                className="relative -ml-[2px] flex shrink-0 items-center gap-[9px] rounded-r-[12px] py-4 pr-5 text-white"
                style={{ backgroundColor: "#0178FF" }}
              >
                <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">Try in NickAI</p>
                <svg
                  className="size-6 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden
                >
                  <path
                    d="M13 18L19 12L13 6M18.5 12H5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="square"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {SHOW_DECORATIVE_LINE_GRAPH ? (
        /* Line graph — wipes in left → right */
        <div
          className="pointer-events-none absolute -bottom-10 left-[-270px] h-[329.506px] w-[1389.202px]"
          style={
            {
              clipPath: `inset(0 ${anim.graphInsetRight}% 0 0)`,
              WebkitClipPath: `inset(0 ${anim.graphInsetRight}% 0 0)`,
            } as CSSProperties
          }
        >
          <div className="absolute inset-[-0.15%_0]">
            <img alt="" src={`${ASSET}/line-graph.svg`} className="block size-full max-w-none" />
          </div>
        </div>
      ) : null}
    </div>
  );
}
