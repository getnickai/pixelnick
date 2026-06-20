/**
 * Animated Matchday (Analysis) composition — drives the React `MatchdayCardView`
 * (the design source of truth) via its per-row `anim` contract, per
 * `useCurrentFrame()`. Same component as /static, so the still and the animation
 * can't drift.
 *
 * Choreography (sequential, chained game-by-game):
 *   For game i, starting at frame i·135 (4.5s @30fps):
 *     0 → 60f (2.0s)   loading bar 10% → 100%; orange LOADING… chip blinks
 *     60 → 75f (0.5s)  pick components fade in (chip swaps to the pick)
 *     75 → 135f (2.0s) numbers slot-machine in (market% · agents% · stake ·
 *                       gain · agents count). The "/Y" shows immediately.
 *   Games before their turn keep blinking LOADING…; after, they hold revealed.
 *   The fully-revealed card holds for 3s at the end (MATCHDAY_HOLD).
 */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import {
  MatchdayCardView,
  SAMPLE_MATCHDAY_CARD,
  asPct,
  potentialUsd,
  type MatchdayAnim,
  type MatchdayRowAnim,
} from "../../../components/matchday-card-view";
import {
  MATCHDAY_BAR_FILL,
  MATCHDAY_FADE,
  MATCHDAY_GAME_FRAMES,
  MATCHDAY_SLOT,
  type MatchdayAnalysisProps,
} from "./props";

const ASSET = staticFile("swarm-arena-cards/assets");

const BLINK_PERIOD = 26; // frames (~0.87s) — LOADING… chip blink

export const MatchdayAnalysisComposition: React.FC<MatchdayAnalysisProps> = ({
  data = SAMPLE_MATCHDAY_CARD,
  slide = true,
}) => {
  const frame = useCurrentFrame();

  // Shared blink (all waiting rows pulse in sync).
  const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((2 * Math.PI * frame) / BLINK_PERIOD));

  const rows: MatchdayRowAnim[] = data.games.map((g, i) => {
    const base = i * MATCHDAY_GAME_FRAMES;
    const barWin = [base, base + MATCHDAY_BAR_FILL] as const;
    const fadeWin = [base + MATCHDAY_BAR_FILL, base + MATCHDAY_BAR_FILL + MATCHDAY_FADE] as const;
    const slotWin = [fadeWin[1], fadeWin[1] + MATCHDAY_SLOT] as const;

    // Resting fill before this game's turn: first game 10%, the rest 1%.
    const startFrac = i === 0 ? 0.1 : 0.01;
    const barFrac = interpolate(frame, barWin, [startFrac, 1], {
      easing: Easing.inOut(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const pickOpacity = interpolate(frame, fadeWin, [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    // Blink while loading, then fade the chip out as the pick fades in.
    const loadingOpacity = frame < fadeWin[0] ? blink : blink * (1 - pickOpacity);

    const reel = (
      targetValue: number,
      opts: { decimals?: number; prefix?: string; suffix?: string; thousandsSep?: boolean } = {},
    ) => (
      <SlidingDigitCount targetValue={targetValue} countWindow={slotWin} slide={slide} {...opts} />
    );

    return {
      barFrac,
      loadingOpacity,
      pickOpacity,
      marketNode: reel(asPct(g.price), { suffix: "%" }),
      agentsNode: reel(asPct(g.agentProb), { suffix: "%" }),
      stakeNode: reel(g.stakeUsd, { prefix: "$", thousandsSep: true }),
      gainNode: reel(potentialUsd(g.stakeUsd, g.price), { prefix: "+$", thousandsSep: true }),
      consensusNode: reel(g.consensusN),
    };
  });

  const anim: MatchdayAnim = { rows };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      <MatchdayCardView data={data} assetBase={ASSET} variant="analysis" anim={anim} />
    </AbsoluteFill>
  );
};
