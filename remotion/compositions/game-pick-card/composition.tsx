/**
 * Animated Game Pick composition — drives the React `GamePickCardView` (the
 * design source of truth) via its `anim` contract, per `useCurrentFrame()`.
 * Same component as /static, so the still and the animation can't drift.
 *
 * Choreography (single game):
 *   0 → 60f (2.0s)   loading bar 10% → 100%; orange LOADING… chip blinks
 *   60 → 75f (0.5s)  pick components fade in (chip swaps to the pick)
 *   75 → 135f (2.0s) numbers slot-machine in (market% · Nick% · stake · gain)
 *   135 → 210f       the fully-revealed card holds.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import {
  GamePickCardView,
  SAMPLE_GAME_PICK_CARD,
  gameAsPct,
  gamePotentialUsd,
  type GamePickAnim,
} from "../../../components/game-pick-card-view";
import {
  GAMEPICK_BAR_FILL,
  GAMEPICK_FADE,
  GAMEPICK_SLOT,
  type GamePickCardProps,
} from "./props";

const ASSET = staticFile("swarm-arena-cards/assets");

const BLINK_PERIOD = 26; // frames (~0.87s) — LOADING… chip blink

export const GamePickCardComposition: React.FC<GamePickCardProps> = ({
  data = SAMPLE_GAME_PICK_CARD,
  slide = true,
}) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin((2 * Math.PI * frame) / BLINK_PERIOD));

  const barWin = [0, GAMEPICK_BAR_FILL] as const;
  const fadeWin = [GAMEPICK_BAR_FILL, GAMEPICK_BAR_FILL + GAMEPICK_FADE] as const;
  const slotWin = [fadeWin[1], fadeWin[1] + GAMEPICK_SLOT] as const;

  const barFrac = interpolate(frame, barWin, [0.1, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pickOpacity = interpolate(frame, fadeWin, [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const loadingOpacity = frame < fadeWin[0] ? blink : blink * (1 - pickOpacity);

  const reel = (
    targetValue: number,
    opts: { decimals?: number; prefix?: string; suffix?: string; thousandsSep?: boolean } = {},
  ) => <SlidingDigitCount targetValue={targetValue} countWindow={slotWin} slide={slide} {...opts} />;

  const p = data.pick;
  const anim: GamePickAnim = {
    barFrac,
    loadingOpacity,
    pickOpacity,
    marketNode: p ? reel(gameAsPct(p.price), { suffix: "%" }) : undefined,
    agentsNode: p ? reel(gameAsPct(p.agentProb), { suffix: "%" }) : undefined,
    stakeNode: p ? reel(p.stakeUsd, { prefix: "$", thousandsSep: true }) : undefined,
    gainNode: p ? reel(gamePotentialUsd(p.stakeUsd, p.price), { prefix: "+$", thousandsSep: true }) : undefined,
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      {/* Soundtrack — same pre-game stadium groove as the game/matchday cards;
          fades in at the start and out over the settle hold so it never clips.
          Stills carry no audio; the MP4 render must pass muted:false. */}
      <Audio
        src={staticFile("audio/stadium-groove.mp3")}
        volume={(f) =>
          interpolate(f, [0, 10, durationInFrames - 26, durationInFrames - 1], [0, 1, 1, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })
        }
      />
      <GamePickCardView data={data} assetBase={ASSET} variant="analysis" anim={anim} />
    </AbsoluteFill>
  );
};
