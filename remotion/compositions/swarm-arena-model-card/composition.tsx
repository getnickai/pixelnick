import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import {
  SAMPLE_MODEL_CARD,
  SETTLED_MODEL_CARD_ANIM,
  SwarmArenaModelCardView,
  type SwarmArenaModelCardAnim,
} from "../../../components/swarm-arena-model-card";
import type { SwarmArenaModelCardProps } from "./props";

// staticFile() so assets resolve in BOTH the web Player and headless CLI/MP4
// renders. A bare "/swarm-arena-cards/..." only resolves against the page
// origin (Player); a headless render serves assets through the bundler. The
// base prepends remotion_staticBase; sub-paths concatenate correctly. (STA-417)
const ASSET = staticFile("swarm-arena-cards/assets");

/** Agent logo URLs arrive as public paths in the deck data; route them through
 *  staticFile() so they resolve in a headless render. */
const toStatic = (url?: string) =>
  url && url.startsWith("/") ? staticFile(url.replace(/^\/+/, "")) : url;

/**
 * Master timeline (30fps). Each window is [startFrame, endFrame]; the element
 * ramps "off" → "on". Spring entrances use a single *SpringStart frame. The
 * backdrop (gradient + watermarks + progressive blur) is present from frame 0;
 * only the content cascades in. Stagger = the gap between consecutive starts.
 */
const ANIM = {
  // Looping accent-bar breathe (matches the static bar).
  barPulsePeriod: 22,
  barPulseStart: 70,
  barPulseFadeIn: 12,

  // Entrance windows [start, end]
  header: [0, 14],
  rank: [8, 22], // hexagon
  rankNum: [15, 29], // "1" stamps in after the hexagon
  rankRibbon: [21, 37], // ribbon banner sweeps on last
  tagDot: [10, 22],
  tagPill: [15, 27],
  tagWorld: [20, 32],
  avatar: [16, 30],
  modelName: [20, 46],
  // PNL + Profit appear early as BLURRED placeholders (opacity in with the
  // cascade), then focus in + roll up as the FINALE. metricBlur clears the blur
  // and the count-ups are synced to it.
  pnlLabel: [32, 46],
  pnlValue: [36, 48], // opacity ramp for the blurred placeholder
  profitLabel: [46, 60],
  profitOpacity: [50, 64], // arrow + value placeholder fade in (blurred)
  metricBlur: [162, 206], // blur 14px → 0: the finale focus-in for both metrics
  pnlCount: [162, 206], // slot-machine roll synced to the blur removal
  profitCount: [162, 206],
  equity: [64, 82],
  // Background equity curve — the closing flourish: starts ~0.5s (15f) before
  // the blur lifts (metricBlur@162) and finishes LAST, once everything settled.
  sparkFade: [138, 152],
  sparkReveal: [147, 222],
  glassPanel: [78, 98],
  stat1: [94, 108],
  stat2: [98, 112],
  stat3: [102, 116],
  topPick: [110, 126],
  pick1: [120, 134],
  pick2: [124, 138],
  pick3: [128, 142],
  builtOn: [134, 150],
  cta: [142, 160],

  // Spring entrance starts
  headerSpringStart: 0,
  rankSpringStart: 8,
  rankNumSpringStart: 15,
  rankRibbonSpringStart: 21,
  tagDotSpringStart: 10,
  tagPillSpringStart: 15,
  avatarSpringStart: 18,
  glassSpringStart: 78,
  barSpringStart: 40,
} as const;

/**
 * Animated Remotion composition of the SwarmArena Model Card.
 *
 * Renders the Design component itself — `SwarmArenaModelCardView` from
 * `components/swarm-arena-model-card.tsx` — driving its anim contract from
 * `useCurrentFrame()`, so a design edit shows up here, in /static, in the
 * Engine surfaces and in generated MP4s with no extra work. All timing lives
 * in the `ANIM` block above.
 */
export const SwarmArenaModelCardComposition: React.FC<
  SwarmArenaModelCardProps
> = ({ slide = true, data = SAMPLE_MODEL_CARD }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pos = data.pnlUsd >= 0;

  // Cubic-out opacity fade over a [start, end] window.
  const fade = (w: readonly [number, number]) =>
    interpolate(frame, w, [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  // Smooth (non-bouncy) rise — general content cascade (pairs with fade()).
  const rise = (w: readonly [number, number], dy = 12) =>
    interpolate(frame, w, [dy, 0], {
      easing: Easing.out(Easing.exp),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  // Spring progress from a start frame (with overshoot).
  const springFrom = (
    start: number,
    config: { damping: number; stiffness: number },
  ) => spring({ frame: frame - start, fps, config });

  // Header lockup — spring drop + fade.
  const headerSpring = springFrom(ANIM.headerSpringStart, {
    damping: 14,
    stiffness: 110,
  });

  // Tags — staggered: dot, then LIVE AGENT pill, then WORLD CUP.
  const tagDotSpring = springFrom(ANIM.tagDotSpringStart, {
    damping: 12,
    stiffness: 150,
  });
  const tagPillSpring = springFrom(ANIM.tagPillSpringStart, {
    damping: 12,
    stiffness: 140,
  });

  // Model avatar — spring scale.
  const avatarSpring = springFrom(ANIM.avatarSpringStart, {
    damping: 12,
    stiffness: 130,
  });

  // Rank badge — staggered pop: hexagon, then the number, then the ribbon.
  const rankSpring = springFrom(ANIM.rankSpringStart, {
    damping: 11,
    stiffness: 150,
  });
  const rankNumSpring = springFrom(ANIM.rankNumSpringStart, {
    damping: 10,
    stiffness: 180,
  });
  const rankRibbonSpring = springFrom(ANIM.rankRibbonSpringStart, {
    damping: 13,
    stiffness: 160,
  });

  // Glass panel — springs up as one unit; its contents just ride it.
  const glassSpring = springFrom(ANIM.glassSpringStart, {
    damping: 14,
    stiffness: 110,
  });

  // Accent bar — vertical scale-in spring + looping breathe (scale pulse).
  const barSpring = springFrom(ANIM.barSpringStart, {
    damping: 12,
    stiffness: 140,
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
  const barPulseAmount = 1 + 0.05 * barPulseWave * barPulseMix;

  const anim: SwarmArenaModelCardAnim = {
    ...SETTLED_MODEL_CARD_ANIM,
    headerOpacity: fade(ANIM.header),
    headerY: interpolate(headerSpring, [0, 1], [-20, 0]),
    rankHexOpacity: fade(ANIM.rank),
    rankHexScale: interpolate(rankSpring, [0, 1], [0.3, 1]),
    rankNumOpacity: fade(ANIM.rankNum),
    rankNumScale: interpolate(rankNumSpring, [0, 1], [0.4, 1]),
    rankRibbonOpacity: fade(ANIM.rankRibbon),
    rankRibbonScale: interpolate(rankRibbonSpring, [0, 1], [0.6, 1]),
    tagDotOpacity: fade(ANIM.tagDot),
    tagDotScale: interpolate(tagDotSpring, [0, 1], [0.4, 1]),
    tagPillOpacity: fade(ANIM.tagPill),
    tagPillScale: interpolate(tagPillSpring, [0, 1], [0.6, 1]),
    tagWorldOpacity: fade(ANIM.tagWorld),
    tagWorldY: rise(ANIM.tagWorld, 6),
    avatarOpacity: fade(ANIM.avatar),
    avatarScale: interpolate(avatarSpring, [0, 1], [0.5, 1]),
    modelNameOpacity: fade(ANIM.modelName),
    modelNameY: rise(ANIM.modelName),
    pnlLabelOpacity: fade(ANIM.pnlLabel),
    pnlValueOpacity: fade(ANIM.pnlValue),
    pnlBlur: (1 - fade(ANIM.metricBlur)) * 14,
    barScaleX: barPulseAmount,
    barScaleY: barScaleY * barPulseAmount,
    profitLabelOpacity: fade(ANIM.profitLabel),
    profitRowOpacity: fade(ANIM.profitOpacity),
    profitBlur: (1 - fade(ANIM.metricBlur)) * 14,
    dividerOpacity: fade(ANIM.equity),
    equityOpacity: fade(ANIM.equity),
    equityY: rise(ANIM.equity),
    glassOpacity: fade(ANIM.glassPanel),
    glassY: interpolate(glassSpring, [0, 1], [24, 0]),
    statOpacities: [fade(ANIM.stat1), fade(ANIM.stat2), fade(ANIM.stat3)],
    topPickOpacity: fade(ANIM.topPick),
    picksLabelOpacity: fade(ANIM.pick1),
    pickRowOpacities: data.latestPicks.length
      ? data.latestPicks.map((_, i) =>
          fade([ANIM.pick1, ANIM.pick2, ANIM.pick3][Math.min(i, 2)]),
        )
      : [fade(ANIM.pick1)],
    builtOnOpacity: fade(ANIM.builtOn),
    builtOnY: rise(ANIM.builtOn, 10),
    ctaOpacity: fade(ANIM.cta),
    ctaY: rise(ANIM.cta, 10),
    sparkOpacity: fade(ANIM.sparkFade),
    sparkRevealRightPct: interpolate(frame, ANIM.sparkReveal, [100, 0], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    pnlNode: (
      <SlidingDigitCount
        targetValue={Math.abs(data.pnlUsd)}
        countWindow={ANIM.pnlCount}
        decimals={0}
        prefix={pos ? "+$" : "-$"}
        slide={slide}
      />
    ),
    profitNode: (
      <SlidingDigitCount
        targetValue={Math.abs(data.profitPct)}
        countWindow={ANIM.profitCount}
        decimals={2}
        suffix="%"
        slide={slide}
      />
    ),
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      <SwarmArenaModelCardView
        data={{ ...data, logo: toStatic(data.logo) }}
        assetBase={ASSET}
        anim={anim}
      />
    </AbsoluteFill>
  );
};
