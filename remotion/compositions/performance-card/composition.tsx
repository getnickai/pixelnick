/* eslint-disable @next/next/no-img-element */
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { PerformanceCardProps } from "./props";

const ASSET = "/figma";

/**
 * Animated Remotion composition of the Performance Card.
 *
 * Visually mirrors `components/ai-ready-card.tsx` (the static version stays
 * untouched and continues to render at `/performance-card`). Every entrance is
 * driven by `useCurrentFrame()` so the same component plays in `<Player>` now
 * and is renderable to MP4 / GIF later via Lambda without any rewrites.
 *
 * Timing: 150 frames @ 30 fps = 5s. See inline comments for per-element windows.
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
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // --- Background ---
  // Slow continuous glow pulse, loops every 90 frames (3s @ 30fps).
  const glowOpacity = interpolate(frame % 90, [0, 45, 90], [0.7, 1, 0.7]);

  // Agent illustration fades in early.
  const agentIllustrationOpacity = interpolate(frame, [0, 30], [0, 0.25], {
    extrapolateRight: "clamp",
  });

  // --- Header ---
  // Logo: drops in from above with spring + fades in.
  const logoSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const logoY = interpolate(logoSpring, [0, 1], [-24, 0]);
  const logoOpacity = interpolate(frame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Type pill: spring scale + fade.
  const pillSpring = spring({
    frame: frame - 6,
    fps,
    config: { damping: 11, stiffness: 130 },
  });
  const pillScale = interpolate(pillSpring, [0, 1], [0.6, 1]);
  const pillOpacity = interpolate(frame, [6, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Headline: fade up.
  const headlineOpacity = interpolate(frame, [16, 42], [0, 1], {
    extrapolateRight: "clamp",
  });
  const headlineY = interpolate(frame, [16, 42], [16, 0], {
    extrapolateRight: "clamp",
  });

  // --- PNL section ---
  const pnlLabelOpacity = interpolate(frame, [26, 38], [0, 1], {
    extrapolateRight: "clamp",
  });
  // Count up from 0 to target PNL.
  const pnlValue = interpolate(frame, [30, 68], [0, pnl], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pnlSign = pnl >= 0 ? "+" : "−";
  const pnlAbsFormatted = Math.abs(pnlValue).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Green decorative bar: scales vertically in.
  const barSpring = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const barScaleY = interpolate(barSpring, [0, 1], [0, 1]);

  // Runs & trades dot rows fade in after PNL count.
  const runsOpacity = interpolate(frame, [54, 72], [0, 1], {
    extrapolateRight: "clamp",
  });
  const tradesOpacity = interpolate(frame, [60, 78], [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Profit % section ---
  const profitLabelOpacity = interpolate(frame, [56, 68], [0, 1], {
    extrapolateRight: "clamp",
  });
  const profitValue = interpolate(frame, [60, 88], [0, profitPercent], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const profitOpacity = interpolate(frame, [58, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Meta info rows ---
  const metaRow1Opacity = interpolate(frame, [80, 96], [0, 1], {
    extrapolateRight: "clamp",
  });
  const metaRow2Opacity = interpolate(frame, [88, 104], [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Author block ---
  const builtByOpacity = interpolate(frame, [94, 108], [0, 1], {
    extrapolateRight: "clamp",
  });
  const authorOpacity = interpolate(frame, [100, 118], [0, 1], {
    extrapolateRight: "clamp",
  });
  const authorY = interpolate(frame, [100, 118], [8, 0], {
    extrapolateRight: "clamp",
  });

  // --- CTA ---
  // Opacity-only entrance — DO NOT apply `transform: scale()` to the CTA
  // wrapper. The wrapper contains two touching flex children (the rotated
  // tab SVG and the gradient button body); a transform on the wrapper forces
  // both children onto a single compositing layer and subpixel rendering
  // exposes the seam between them. Plain opacity has no layer side effects.
  const ctaOpacity = interpolate(frame, [110, 130], [0, 1], {
    extrapolateRight: "clamp",
  });

  // --- Line graph wipe (left → right) over almost the full duration ---
  const graphInsetRight = interpolate(frame, [10, 138], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill className="bg-grey-950 overflow-clip">
      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-[-314.95px] top-[195.5px] flex h-[1206px] w-[1191.312px] items-center justify-center"
        style={{ opacity: glowOpacity }}
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

      {/* Agent illustration */}
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
            className="relative inline-flex shrink-0 items-center gap-[9px] self-start rounded-full bg-green-400 px-3 py-0.5"
            style={{
              opacity: pillOpacity,
              transform: `scale(${pillScale})`,
              transformOrigin: "left center",
            }}
          >
            <div className="relative size-6 shrink-0">
              <img
                alt=""
                src={`${ASSET}/icon-wave.svg`}
                className="absolute inset-0 block size-full max-w-none"
              />
            </div>
            <p className="whitespace-nowrap text-base font-semibold uppercase leading-6 text-[#010406]">
              Live Trading Agent
            </p>
          </div>

          {/* Headline */}
          <h1
            className="w-full text-[54px] font-semibold leading-[1.2] text-white"
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
                className="w-full text-2xl font-semibold leading-[1.2] text-white"
                style={{ opacity: pnlLabelOpacity }}
              >
                Total PNL
              </p>
              <div className="relative flex items-center justify-center gap-6">
                {/* Decorative left-edge green bar */}
                {/* NOTE: Tailwind v4 emits the `-translate-y-1/2` class as the
                   standalone `translate` CSS property, NOT as `transform`. So
                   we only need `scaleY` here — applying `translateY(-50%)`
                   inline would double-translate by 20px (half the bar's
                   height). */}
                <div
                  className="absolute -left-[87px] top-1/2 size-10 -translate-y-1/2 rounded-lg bg-green-400"
                  style={{
                    transform: `scaleY(${barScaleY})`,
                  }}
                />
                <p
                  className="whitespace-nowrap text-5xl font-medium leading-[1.4] text-green-400 tabular-nums"
                  style={{ opacity: pnlLabelOpacity }}
                >
                  {pnlSign}${pnlAbsFormatted}
                </p>
                <div className="flex flex-col items-start gap-1">
                  <div
                    className="flex items-center gap-2"
                    style={{ opacity: runsOpacity }}
                  >
                    <div className="relative size-2 shrink-0">
                      <img
                        alt=""
                        src={`${ASSET}/dot-success.svg`}
                        className="absolute inset-0 block size-full max-w-none"
                      />
                    </div>
                    <p className="whitespace-nowrap text-base font-medium leading-[1.4] text-green-400">
                      {runs} Runs
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    style={{ opacity: tradesOpacity }}
                  >
                    <div className="relative size-2 shrink-0">
                      <img
                        alt=""
                        src={`${ASSET}/dot-success.svg`}
                        className="absolute inset-0 block size-full max-w-none"
                      />
                    </div>
                    <p className="whitespace-nowrap text-base font-medium leading-[1.4] text-green-400">
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
                className="w-full text-2xl font-semibold leading-[1.2] text-white"
                style={{ opacity: profitLabelOpacity }}
              >
                Profit %
              </p>
              <div className="flex items-center gap-4">
                <div className="relative h-8 w-[27.429px] shrink-0">
                  <div className="absolute inset-[-6.63%_-7.73%_-4.69%_-7.73%]">
                    <img
                      alt=""
                      src={`${ASSET}/arrow-up.svg`}
                      className="block size-full max-w-none"
                    />
                  </div>
                </div>
                <p className="whitespace-nowrap text-5xl font-medium leading-[1.4] text-white tabular-nums">
                  {profitValue.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex flex-col items-start gap-6">
            <div
              className="flex items-center gap-3"
              style={{ opacity: metaRow1Opacity }}
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
              <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
                Active since {activeSince}
              </p>
            </div>
            <div
              className="flex items-center gap-6"
              style={{ opacity: metaRow2Opacity }}
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
                <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
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
                <p className="whitespace-nowrap text-xl leading-4 text-grey-400">
                  Next run in {nextRun}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Author block */}
      <div
        className="absolute bottom-[45px] left-16 flex flex-col gap-[26px]"
        style={{
          opacity: authorOpacity,
          transform: `translateY(${authorY}px)`,
        }}
      >
        <p
          className="pl-[68px] text-xl leading-4 text-grey-400"
          style={{ opacity: builtByOpacity }}
        >
          Built By:
        </p>
        <div className="flex items-center gap-5">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-full">
            <img
              alt={builderName}
              src={builderAvatar}
              width={48}
              height={48}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
          <p className="w-[219px] text-2xl font-semibold leading-[1.2] text-white">
            {builderName}
          </p>
        </div>
      </div>

      {/* Remix CTA — "Try in NickAI" */}
      <div
        className="absolute bottom-8 left-[404px] flex items-start"
        style={{ opacity: ctaOpacity }}
      >
        {/* Left decorative tab (rotated 180°).
           `marginRight: -4` overlaps the tab onto the body by 4px. The tab
           uses `rotate: 180deg` which creates its own stacking context;
           combined with the Player's display scaling, anti-aliasing along
           the rotated tab's right edge can show a hairline gap against the
           body's left edge. A 4px overlap hides any anti-aliased fringe.
           Both touching edges are flat solid color so no detail is lost. */}
        <div
          className="relative h-[56px] w-[46px] shrink-0 rotate-180"
          style={{ marginRight: -4 }}
        >
          <img
            alt=""
            src={`${ASSET}/cta-tab.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>

        {/* Button body with gradient.
           NOTE: removed `backdrop-blur-[16px]` (vs. the static version). The
           body's base gradient layer is fully opaque cyan (`rgb(48, 197, 255)`
           at 100%), so backdrop-blur is invisible anyway — but it created a
           compositing layer whose left edge produced a visible vertical seam
           against the rotated tab when the Player scales the composition for
           display. Dropping it gives identical visual output and removes the
           seam entirely. */}
        <div
          className="relative flex shrink-0 items-center gap-[9px] rounded-r-[12px] py-4 pr-5"
          style={{
            backgroundImage:
              "linear-gradient(162.836deg, rgba(74, 222, 128, 0.5) 17.138%, rgba(48, 197, 255, 0.5) 89.208%), linear-gradient(90deg, rgb(48, 197, 255) 0%, rgb(48, 197, 255) 100%)",
          }}
        >
          <p className="whitespace-nowrap text-xl font-semibold leading-[1.2] text-grey-950">
            Try in NickAI
          </p>
          <div className="relative size-6 shrink-0">
            <img
              alt=""
              src={`${ASSET}/arrow-right.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>

        {/* Color-dodge overlay across the full CTA */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-[56px] w-[211px] rotate-180"
          style={{ mixBlendMode: "color-dodge" }}
        >
          <img
            alt=""
            src={`${ASSET}/cta-overlay.svg`}
            className="absolute inset-0 block size-full max-w-none"
          />
        </div>
      </div>

      {/* Line graph — wipes in left → right */}
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
    </AbsoluteFill>
  );
};
