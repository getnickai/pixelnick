/**
 * Animated Result + Portfolio card composition — drives the React
 * `ResultPortfolioCardView` (the design source of truth) via its `anim`
 * contract, per `useCurrentFrame()`. Same component as the still, so they
 * can't drift.
 *
 * Choreography mirrors the result card so the family feels consistent: the card
 * cascades in top→bottom (header → meta → teams → score pop → HIT chip → panel
 * → pick strip). Two slot-machine finales land in sequence: first the PAYOUT
 * ("The Swarm Arena Agent banked +$X") free-spins behind a blur then lands,
 * then Nick's CURRENT PORTFOLIO spins and lands on the running bankroll.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import {
  ResultPortfolioCardView,
  SAMPLE_RESULT_PORTFOLIO_CARD,
  SETTLED_RESULT_PORTFOLIO_ANIM,
  type ResultPortfolioAnim,
} from "../../../components/result-portfolio-card-view";
import type { ResultPortfolioCardProps } from "./props";

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
  footer: [196, 214],
  // Payout hero: reels free-spin behind the blur, then blur lifts + they land.
  payoutSpin: [86, 150],
  payoutCount: [150, 182],
  payoutBlur: [150, 180],
  // Portfolio hero: appears, then spins + lands after the payout settles.
  portfolioAppear: [150, 168],
  portfolioSpin: [168, 224],
  portfolioCount: [224, 254],
  portfolioBlur: [224, 252],
} as const;

export const ResultPortfolioCardComposition: React.FC<ResultPortfolioCardProps> = ({
  slide = true,
  data = SAMPLE_RESULT_PORTFOLIO_CARD,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

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

  const anim: ResultPortfolioAnim = {
    ...SETTLED_RESULT_PORTFOLIO_ANIM,
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
    portfolioOpacity: fade(ANIM.portfolioAppear),
    portfolioBlur: (1 - fade(ANIM.portfolioBlur)) * 14,
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
    portfolioNode: (
      <SlidingDigitCount
        targetValue={data.portfolioUsd}
        countWindow={ANIM.portfolioCount}
        spinWindow={[ANIM.portfolioSpin[0], ANIM.portfolioCount[0]]}
        decimals={0}
        prefix="$"
        thousandsSep
        slide={slide}
      />
    ),
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      {/* Soundtrack — same "decisive moment" track as the result card; fades in
          at the start and out over the settle hold so it never clips. Stills
          carry no audio; the MP4 render must pass muted:false. */}
      <Audio
        src={staticFile("audio/decisive-moment.mp3")}
        volume={(f) =>
          interpolate(f, [0, 10, durationInFrames - 26, durationInFrames - 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <ResultPortfolioCardView data={data} assetBase={ASSET} anim={anim} />
    </AbsoluteFill>
  );
};
