/**
 * Animated Result ("won pick") card composition — drives the React
 * `ResultCardView` (the design source of truth) via its `anim` contract, per
 * `useCurrentFrame()`. Same component as the still, so they can't drift.
 *
 * Choreography mirrors the consensus card so the two feel like one family:
 * the card cascades in top→bottom (header → meta → teams → score pop → HIT
 * chip → panel → pick strip → per-agent bars grow → footer). The PAYOUT
 * ("agents banked +$X") is the finale hero: it sits BLURRED while its
 * slot-machine reels free-spin, then the blur lifts and the reels decelerate
 * and land on the real dollar figure (the model-card reveal pattern).
 */
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
  ResultCardView,
  SAMPLE_RESULT_CARD,
  SETTLED_RESULT_ANIM,
  type ResultCardAnim,
} from "../../../components/result-card-view";
import type { ResultCardProps } from "./props";

const ASSET = staticFile("swarm-arena-cards/assets");

const ANIM = {
  header: [0, 14],
  pill: [10, 24],
  meta: [16, 30],
  teams: [22, 40],
  score: [34, 54], // final score pops after the teams settle
  hit: [46, 66], // HIT / MISS chip
  panel: [58, 78],
  stats: [72, 100], // pick + entry strip
  payoutRow: [84, 102], // payout callout box fades in
  breakdownAppear: [88, 104],
  breakdownLabel: [108, 122],
  hist: [116, 162], // per-agent bars grow
  footer: [158, 176],
  // Payout hero: reels free-spin behind the blur, then the blur lifts and they
  // decelerate + land on the value (slot → stop on the result).
  payoutSpin: [86, 200],
  payoutCount: [200, 236], // land window (= where blur clears)
  payoutBlur: [200, 234], // blur 14px → 0
} as const;

export const ResultCardComposition: React.FC<ResultCardProps> = ({
  slide = true,
  data = SAMPLE_RESULT_CARD,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fade = (w: readonly [number, number]) =>
    interpolate(frame, w, [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const rise = (w: readonly [number, number], dy = 12) =>
    interpolate(frame, w, [dy, 0], {
      easing: Easing.out(Easing.exp),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const springFrom = (start: number, cfg: { damping: number; stiffness: number }) =>
    spring({ frame: frame - start, fps, config: cfg });

  const pillScale = interpolate(springFrom(ANIM.pill[0], { damping: 12, stiffness: 150 }), [0, 1], [0.6, 1]);
  const scoreScale = interpolate(springFrom(ANIM.score[0], { damping: 11, stiffness: 160 }), [0, 1], [0.7, 1]);
  const hitScale = interpolate(springFrom(ANIM.hit[0], { damping: 12, stiffness: 150 }), [0, 1], [0.7, 1]);

  const anim: ResultCardAnim = {
    ...SETTLED_RESULT_ANIM,
    headerOpacity: fade(ANIM.header),
    headerY: rise(ANIM.header),
    pillOpacity: fade(ANIM.pill),
    pillScale,
    metaOpacity: fade(ANIM.meta),
    teamsOpacity: fade(ANIM.teams),
    teamsY: rise(ANIM.teams),
    scoreOpacity: fade(ANIM.score),
    scoreScale,
    hitOpacity: fade(ANIM.hit),
    hitScale,
    panelOpacity: fade(ANIM.panel),
    panelY: rise(ANIM.panel, 16),
    statsPct: fade(ANIM.stats),
    payoutOpacity: fade(ANIM.payoutRow),
    payoutBlur: (1 - fade(ANIM.payoutBlur)) * 14,
    breakdownOpacity: fade(ANIM.breakdownAppear),
    breakdownLabelOpacity: fade(ANIM.breakdownLabel),
    histBarsPct: fade(ANIM.hist),
    footerOpacity: fade(ANIM.footer),
    footerY: rise(ANIM.footer, 10),
    payoutNode: (
      <SlidingDigitCount
        targetValue={Math.abs(data.totalPnl)}
        countWindow={ANIM.payoutCount}
        spinWindow={[ANIM.payoutSpin[0], ANIM.payoutCount[0]]}
        decimals={0}
        prefix={data.totalPnl >= 0 ? "+$" : "−$"}
        slide={slide}
      />
    ),
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      <ResultCardView data={data} assetBase={ASSET} anim={anim} />
    </AbsoluteFill>
  );
};
