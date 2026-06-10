import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
// Relative (not "@/") import: this composition is bundled by Remotion's webpack
// for headless generation, which doesn't resolve Next.js's "@/" path alias.
import { PerformanceCardView, type PerformanceCardAnim } from "../../../components/performance-card-view";
import type { PerformanceCardProps } from "./props";

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
 * This is the SINGLE design source for the performance card. It is rendered:
 *   - to PNG/MP4 by the generation pipeline (`scripts/generate-cards.ts`),
 *   - live and animated in `<Player>` (`/motion`, `/trading-cards` kit),
 *   - as a settled still via `<Thumbnail>` (`components/ai-ready-card.tsx`,
 *     used by `/embed`, `/static`, and the `/trading-cards/history` gallery).
 * A design change here flows to all of them — nothing repaints it separately.
 * Every entrance is driven by `useCurrentFrame()` so the same component plays
 * in `<Player>` and renders headless to MP4 / GIF via Lambda without rewrites.
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

  // Loss styling (rotated arrow + red profit number) is handled inside
  // PerformanceCardView from `profitPercent`; the count-up sign is rendered by
  // SlidingDigitCount via `showSign`.

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

  // Bundle every per-frame value for the shared design view. The slot-machine
  // count-ups are passed as <SlidingDigitCount> nodes (Remotion-context only);
  // the static still omits `anim` and renders the settled formatted numbers.
  const anim: PerformanceCardAnim = {
    glowOverlayOpacity,
    glowSvgOpacity,
    agentIllustrationOpacity,
    logoOpacity,
    logoY,
    pillOpacity,
    pillScale,
    headlineOpacity,
    headlineY,
    pnlLabelOpacity,
    barOpacity,
    barScaleX: barFinalScaleX,
    barScaleY: barFinalScaleY,
    runsOpacity,
    tradesOpacity,
    profitOpacity,
    profitLabelOpacity,
    metaRow1Opacity,
    metaRow1Y,
    metaRow2Opacity,
    metaRow2Y,
    builtByOpacity,
    authorOpacity,
    authorY,
    ctaOpacity,
    graphInsetRight,
    pnlNode: (
      <SlidingDigitCount
        targetValue={pnl}
        countWindow={ANIM.pnlCount}
        decimals={2}
        prefix="$"
        slide={slide}
      />
    ),
    profitNode: (
      <SlidingDigitCount
        targetValue={profitPercent}
        countWindow={ANIM.profitCount}
        decimals={2}
        suffix="%"
        showSign
        slide={slide}
      />
    ),
  };

  return (
    <AbsoluteFill>
      <PerformanceCardView
        props={{
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
          slide,
        }}
        anim={anim}
      />
    </AbsoluteFill>
  );
};
