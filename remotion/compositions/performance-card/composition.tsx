/* eslint-disable @next/next/no-img-element */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import type { PerformanceCardProps } from "./props";

const ASSET = "/figma";

/** Decorative bottom chart stroke (`line-graph.svg`). Flip to `true` to restore. */
const SHOW_DECORATIVE_LINE_GRAPH = true;

/**
 * Master timeline for the Performance Card animation. Tweak entrance timings
 * by editing this block only — every animation below references these values.
 *
 * Each window is `[startFrame, endFrame]`; the animation ramps from "off" at
 * `start` to "on" at `end`. Spring entrances use a single `*SpringStart` frame
 * (the spring physics define the curve; this is just when it kicks off).
 *
 * Composition runs 270 frames @ 30fps = 9s (~5s entrances + 4s hold for pulse).
 * Frame 0 is the first visible frame.
 *
 * Stagger guide: the difference between two consecutive `start` frames is the
 * delay between those elements. e.g. `pill[0] - logo[0]` = 6 frames ≈ 200ms.
 */
const ANIM = {
  glowPulsePeriod: 90,
  /** Decorative PNL bar breathe cycle (frames @ 30fps). */
  barPulsePeriod: 22,
  /** Frames after bar spring starts before pulse fades in. */
  barPulseStart: 50,
  /** Frames to ease pulse in (avoids blink when pulse engages). */
  barPulseFadeIn: 12,

  agentIllustration: [0, 30],

  // Entrance windows [startFrame, endFrame]
  logoOpacity:       [0, 12],
  pillOpacity:       [6, 22],
  headline:          [16, 42],   // shared by opacity + Y translate
  pnlLabel:          [26, 38],
  pnlCount:          [30, 68],
  runsDot:           [54, 72],
  tradesDot:         [60, 78],
  profitLabel:       [56, 68],
  profitCount:       [60, 88],
  profitOpacity:     [58, 70],
  metaRow1:          [80, 96],
  metaRow2:          [88, 104],
  builtBy:           [94, 108],
  author:            [100, 118], // shared by opacity + Y translate
  cta:               [110, 130],
  graphWipe:         [70, 114],  // ~1.5s with ease-out, starts after PNL count settles

  // Spring entrance start frames — the spring config (damping / stiffness)
  // controls the curve; these say *when* each spring begins.
  logoSpringStart: 0,
  pillSpringStart: 6,
  barSpringStart:  30,
} as const;

/**
 * Animated Remotion composition of the Performance Card.
 *
 * Visually mirrors `components/ai-ready-card.tsx` (the static version stays
 * untouched and continues to render at `/performance-card`). Every entrance is
 * driven by `useCurrentFrame()` so the same component plays in `<Player>` now
 * and is renderable to MP4 / GIF later via Lambda without any rewrites.
 *
 * All timing lives in the `ANIM` block above.
 */
export const PerformanceCardComposition: React.FC<PerformanceCardProps> = ({
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
  slide = true,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Performance polarity ---
  // Profit % renders white by default; on a loss we rotate its arrow 180° and
  // turn the number red so a loss reads at a glance. (PNL itself signals loss
  // via the down-arrow icon next to its value.) The signed value with leading
  // "-" is rendered by SlidingDigitCount via `showSign`.
  const isLossPercent = profitPercent < 0;

  // --- Background ---
  // Slow continuous glow pulse — loops every `glowPulsePeriod` frames.
  // Two layers: a soft overlay tint and a brighter SVG glow.
  const glowOverlayOpacity = interpolate(
    frame % ANIM.glowPulsePeriod,
    [0, ANIM.glowPulsePeriod / 2, ANIM.glowPulsePeriod],
    [0.1, 0.16, 0.1],
  );

  const glowSvgOpacity = interpolate(
    frame % ANIM.glowPulsePeriod,
    [0, ANIM.glowPulsePeriod / 2, ANIM.glowPulsePeriod],
    [0.7, 1, 0.7],
  );

  const agentIllustrationOpacity = interpolate(
    frame,
    ANIM.agentIllustration,
    [0, 0.1],
    { extrapolateRight: "clamp" },
  );

  // --- Header ---
  // Logo: drops in from above with spring + fades in.
  const logoSpring = spring({
    frame: frame - ANIM.logoSpringStart,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const logoY = interpolate(logoSpring, [0, 1], [-24, 0]);
  const logoOpacity = interpolate(frame, ANIM.logoOpacity, [0, 1], {
    extrapolateRight: "clamp",
  });

  // Type pill: spring scale + fade.
  const pillSpring = spring({
    frame: frame - ANIM.pillSpringStart,
    fps,
    config: { damping: 11, stiffness: 130 },
  });
  const pillScale = interpolate(pillSpring, [0, 1], [0.6, 1]);
  const pillOpacity = interpolate(frame, ANIM.pillOpacity, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline: fade up.
  const headlineOpacity = interpolate(frame, ANIM.headline, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, ANIM.headline, [16, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- PNL section ---
  const pnlLabelOpacity = interpolate(frame, ANIM.pnlLabel, [0, 1], {
    extrapolateRight: "clamp",
  });
  // PNL count-up is rendered by <SlidingDigitCount> below, which computes the
  // value internally from `targetValue` + `countWindow` so each digit can be
  // spring-tracked for the slot-machine slide effect.

  // Green decorative bar: scales vertically in.
  const barSpring = spring({
    frame: frame - ANIM.barSpringStart,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const barScaleY = Math.min(interpolate(barSpring, [0, 1], [0, 1]), 1);

  const pulseElapsed = Math.max(0, frame - ANIM.barPulseStart);
  const barPulseMix = interpolate(
    frame,
    [ANIM.barPulseStart, ANIM.barPulseStart + ANIM.barPulseFadeIn],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const barPulseWave = Math.sin(
    (pulseElapsed / ANIM.barPulsePeriod) * Math.PI * 2,
  );
  const barPulseOpacity = 0.92 + 0.08 * barPulseWave;
  /** Uniform breathe — anchored on the flat left edge via `center left`. */
  const barPulseScale = 1 + 0.05 * barPulseWave;
  const barPulseAmount = 1 + (barPulseScale - 1) * barPulseMix;
  const barOpacity = 1 + (barPulseOpacity - 1) * barPulseMix;
  const barFinalScaleX = barPulseAmount;
  const barFinalScaleY = barScaleY * barPulseAmount;

  // Runs & trades dot rows fade in after PNL count.
  const runsOpacity = interpolate(frame, ANIM.runsDot, [0, 1], {
    extrapolateRight: "clamp",
  });
  const tradesOpacity = interpolate(frame, ANIM.tradesDot, [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Profit % section ---
  const profitLabelOpacity = interpolate(frame, ANIM.profitLabel, [0, 1], {
    extrapolateRight: "clamp",
  });
  // Profit % count-up rendered by <SlidingDigitCount>; value computed internally.
  const profitOpacity = interpolate(frame, ANIM.profitOpacity, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // --- Meta info rows ---
  const metaRow1Opacity = interpolate(frame, ANIM.metaRow1, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const metaRow1Y = interpolate(frame, ANIM.metaRow1, [12, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const metaRow2Opacity = interpolate(frame, ANIM.metaRow2, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const metaRow2Y = interpolate(frame, ANIM.metaRow2, [12, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Author block ---
  const builtByOpacity = interpolate(frame, ANIM.builtBy, [0, 1], {
    extrapolateRight: "clamp",
  });
  const authorOpacity = interpolate(frame, ANIM.author, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });
  const authorY = interpolate(frame, ANIM.author, [8, 0], {
    easing: Easing.out(Easing.exp),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- CTA ---
  // Opacity-only entrance — DO NOT apply `transform: scale()` to the CTA
  // wrapper. The wrapper contains two touching flex children (the rotated
  // tab SVG and the gradient button body); a transform on the wrapper forces
  // both children onto a single compositing layer and subpixel rendering
  // exposes the seam between them. Plain opacity has no layer side effects.
  const ctaOpacity = interpolate(frame, ANIM.cta, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateRight: "clamp",
  });

  // --- Line graph wipe (left → right).
  // `Easing.out(Easing.cubic)` starts the wipe immediately (responsive) and
  // decelerates into the final position (natural "arrival"). Linear felt
  // robotic; ease-out makes the line feel like it's being drawn by hand.
  const graphInsetRight = interpolate(frame, ANIM.graphWipe, [100, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-primary-1000 font-sans overflow-clip">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_65%_at_70%_38%,var(--color-primary-500)_0%,transparent_62%)]"
        style={{ opacity: glowOverlayOpacity }}
        aria-hidden
      />

      {/* Background glow (blob SVG) */}
      <div
        className="pointer-events-none absolute left-[-314.95px] top-[195.5px] flex h-[1206px] w-[1191.312px] items-center justify-center"
        style={{ opacity: glowSvgOpacity }}
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
        style={{ opacity: agentIllustrationOpacity }}
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
        style={{
          opacity: logoOpacity,
          transform: `translateY(${logoY}px)`,
        }}
      >
        <div className="absolute inset-[0_-2.32%_0_0]">
          <img
            alt="NickAI"
            src={`${ASSET}/logo.svg`}
            className="block size-full max-w-none"
          />
        </div>
      </div>

      {/* Card content stack */}
      <div className="absolute left-16 top-1/2 flex w-[522px] -translate-y-[calc(50%+30.5px)] flex-col gap-[72px]">
        {/* Top: Type indicator + headline */}
        <div className="flex w-full flex-col gap-4">
          {/* Type indicator pill */}
          <div
            className="relative inline-flex shrink-0 items-center gap-[9px] self-start rounded-full bg-green-600 px-3 py-0.5 font-sans text-white"
            style={{
              opacity: pillOpacity,
              transform: `scale(${pillScale})`,
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
            style={{
              opacity: headlineOpacity,
              transform: `translateY(${headlineY}px)`,
            }}
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
                style={{ opacity: pnlLabelOpacity }}
              >
                Total PNL
              </p>
              <div className="relative flex items-center justify-center gap-6">
                {/* Decorative left-edge green bar */}
                <div
                  className="absolute -left-[87px] top-0 bottom-0 w-10 rounded-none rounded-r-3xl bg-green-600"
                  style={{
                    opacity: barOpacity,
                    transform: `scale(${barFinalScaleX}, ${barFinalScaleY})`,
                    transformOrigin: "center left",
                    backfaceVisibility: "hidden",
                  }}
                />
                <div
                  className="inline-flex items-center gap-1"
                  style={{ opacity: pnlLabelOpacity }}
                >
                  <span
                    className="grid size-[3.75rem] shrink-0 place-items-center rounded-4xl rounded-r-lg bg-green-600 text-white"
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
                  <span className="inline-flex h-[3.75rem] items-center whitespace-nowrap rounded-4xl rounded-l-lg bg-green-600 px-6 font-heading text-5xl font-medium leading-none text-white">
                    <SlidingDigitCount
                      targetValue={pnl}
                      countWindow={ANIM.pnlCount}
                      decimals={2}
                      prefix="$"
                      slide={slide}
                    />
                  </span>
                </div>
                <div className="flex flex-col items-start gap-1">
                  <div
                    className="flex items-center gap-2"
                    style={{ opacity: runsOpacity }}
                  >
                    <div className="size-2 shrink-0 rounded-full bg-white" />
                    <p className="whitespace-nowrap font-sans text-base font-medium leading-[1.4] text-white">
                      {runs} Runs
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    style={{ opacity: tradesOpacity }}
                  >
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
              style={{ opacity: profitOpacity }}
            >
              <p
                className="w-full font-heading text-2xl font-semibold leading-[1.2] text-white"
                style={{ opacity: profitLabelOpacity }}
              >
                Profit %
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="relative h-8 w-[27.429px] shrink-0"
                  style={{
                    transform: isLossPercent ? "rotate(180deg)" : undefined,
                  }}
                >
                  <div className="absolute inset-[-6.63%_-7.73%_-4.69%_-7.73%]">
                    <img
                      alt=""
                      src={`${ASSET}/arrow-up.svg`}
                      className="block size-full max-w-none"
                    />
                  </div>
                </div>
                <p
                  className={`whitespace-nowrap font-heading text-5xl font-medium leading-[1.4] ${
                    isLossPercent ? "text-red-500" : "text-white"
                  }`}
                >
                  <SlidingDigitCount
                    targetValue={profitPercent}
                    countWindow={ANIM.profitCount}
                    decimals={2}
                    suffix="%"
                    showSign
                    slide={slide}
                  />
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col items-start gap-6 font-sans">
            <div
              className="flex items-center gap-3"
              style={{
                opacity: metaRow1Opacity,
                transform: `translateY(${metaRow1Y}px)`,
              }}
            >
              <div className="relative h-5 w-[18px] shrink-0">
                <div className="absolute inset-[-3.75%_-4.17%]">
                  <img
                    alt=""
                    src={`${ASSET}/icon-calendar.svg`}
                    className="block size-full max-w-none"
                  />
                </div>
              </div>
              <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                Active since {activeSince}
              </p>
            </div>
            <div
              className="flex items-center gap-6"
              style={{
                opacity: metaRow2Opacity,
                transform: `translateY(${metaRow2Y}px)`,
              }}
            >
              <div className="flex items-center gap-3">
                <div className="relative h-[16.67px] w-[20.837px] shrink-0">
                  <div className="absolute inset-[-4.5%_-3.6%]">
                    <img
                      alt=""
                      src={`${ASSET}/icon-nodes.svg`}
                      className="block size-full max-w-none"
                    />
                  </div>
                </div>
                <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
                  {nodes} nodes
                </p>
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

      {/* Footer: author + CTA share one row so the pill stays beside Franklin */}
      <div
        className="absolute bottom-[45px] left-16 right-10 flex flex-col gap-[26px]"
        style={{
          opacity: authorOpacity,
          transform: `translateY(${authorY}px)`,
        }}
      >
        <p
          className="pl-[68px] font-sans text-xl leading-4 text-zinc-400"
          style={{ opacity: builtByOpacity }}
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
          <div className="ml-auto shrink-0" style={{ opacity: ctaOpacity }}>
            <div className="relative flex items-start">
              {/* Left decorative tab (rotated 180°) */}
              <div className="relative h-[56px] w-[46px] shrink-0 rotate-180">
                <img
                  alt=""
                  src={`${ASSET}/cta-tab.svg`}
                  className="absolute inset-0 block size-full max-w-none"
                />
              </div>

              {/* Button body — solid brand blue, matching the tab.
                  -ml-[2px] overlaps the tab so no background seam shows between them. */}
              <div
                className="relative -ml-[2px] flex shrink-0 items-center gap-[9px] rounded-r-[12px] py-4 pr-5 text-white"
                style={{ backgroundColor: "#0178FF" }}
              >
                <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
                  Try in NickAI
                </p>
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
          style={{
            clipPath: `inset(0 ${graphInsetRight}% 0 0)`,
            WebkitClipPath: `inset(0 ${graphInsetRight}% 0 0)`,
          }}
        >
          <div className="absolute inset-[-0.15%_0]">
            <img
              alt=""
              src={`${ASSET}/line-graph.svg`}
              className="block size-full max-w-none"
            />
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
