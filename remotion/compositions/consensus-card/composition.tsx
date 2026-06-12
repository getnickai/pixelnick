/**
 * Animated Consensus Card composition — drives the React `ConsensusCardView`
 * (the design source of truth) via its `anim` contract, per `useCurrentFrame()`.
 * Same component as /static, so the still and the animation can't drift.
 *
 * Choreography: the card cascades in top→bottom (header → meta → teams →
 * question → panel → bars grow → histogram bars grow + market line draws →
 * footer). The EDGE ("agents see value +Xpp") is the finale hero: it sits
 * BLURRED while its slot-machine reels free-spin, then the blur lifts and the
 * reels decelerate and land on the real value (the model-card reveal pattern).
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
  ConsensusCardView,
  SAMPLE_CONSENSUS_CARD,
  SETTLED_CONSENSUS_ANIM,
  type ConsensusCardAnim,
} from "../../../components/consensus-card-view";
import type { ConsensusCardProps } from "./props";

const ASSET = staticFile("swarm-arena-cards/assets");

const ANIM = {
  header: [0, 14],
  pill: [10, 24],
  meta: [16, 30],
  teams: [22, 40],
  question: [34, 54],
  panel: [46, 66],
  bars: [60, 96], // Market + Swarm bars grow
  edgeRow: [72, 90], // edge callout box fades in
  breakdownLabel: [98, 112],
  hist: [106, 152], // histogram bars grow + market line draws
  footer: [150, 168],
  // Edge hero: reels free-spin behind the blur, then the blur lifts and they
  // decelerate + land on the value (slot → stop on the result).
  edgeSpin: [74, 196],
  edgeCount: [196, 232], // land window (= where blur clears)
  edgeBlur: [196, 230], // blur 14px → 0
} as const;

export const ConsensusCardComposition: React.FC<ConsensusCardProps> = ({
  slide = true,
  data = SAMPLE_CONSENSUS_CARD,
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
  const questionScale = interpolate(springFrom(ANIM.question[0], { damping: 12, stiffness: 150 }), [0, 1], [0.7, 1]);

  const anim: ConsensusCardAnim = {
    ...SETTLED_CONSENSUS_ANIM,
    headerOpacity: fade(ANIM.header),
    headerY: rise(ANIM.header),
    pillOpacity: fade(ANIM.pill),
    pillScale,
    metaOpacity: fade(ANIM.meta),
    teamsOpacity: fade(ANIM.teams),
    teamsY: rise(ANIM.teams),
    questionOpacity: fade(ANIM.question),
    questionScale,
    panelOpacity: fade(ANIM.panel),
    panelY: rise(ANIM.panel, 16),
    marketBarPct: fade(ANIM.bars),
    swarmBarPct: fade(ANIM.bars),
    edgeOpacity: fade(ANIM.edgeRow),
    edgeBlur: (1 - fade(ANIM.edgeBlur)) * 14,
    breakdownLabelOpacity: fade(ANIM.breakdownLabel),
    histBarsPct: fade(ANIM.hist),
    marketLinePct: fade(ANIM.hist),
    footerOpacity: fade(ANIM.footer),
    footerY: rise(ANIM.footer, 10),
    edgeNode: (
      <SlidingDigitCount
        targetValue={Math.abs(data.edgePp)}
        countWindow={ANIM.edgeCount}
        spinWindow={[ANIM.edgeSpin[0], ANIM.edgeCount[0]]}
        decimals={1}
        prefix={data.edgePp > 0 ? "+" : "-"}
        slide={slide}
      />
    ),
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      <ConsensusCardView data={data} assetBase={ASSET} anim={anim} />
    </AbsoluteFill>
  );
};
