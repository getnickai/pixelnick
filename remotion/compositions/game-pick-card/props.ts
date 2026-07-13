/**
 * Props for the animated Game Pick composition. `data` is a single-game record
 * (SAMPLE_GAME_PICK_CARD shape); omit to render the built-in sample.
 */
import type { GamePickCardData } from "../../../components/game-pick-card-view";

export type GamePickCardProps = {
  data?: GamePickCardData;
  /** Slot-machine slide on the number count-ups (default true). */
  slide?: boolean;
};

export const gamePickCardDefaultProps: GamePickCardProps = { slide: true };

// Single-game timeline (30fps): the "AI analysis" buffer fills, the pick fades
// in, the numbers slot in, then the revealed card holds.
export const GAMEPICK_BAR_FILL = 60; // 2s — loading bar 10% → 100%
export const GAMEPICK_FADE = 15; // 0.5s — pick components fade in
export const GAMEPICK_SLOT = 60; // 2s — slot-machine number reveal
export const GAMEPICK_HOLD = 75; // 2.5s — hold the fully-revealed card

/** Total frames for the single-game reveal. */
export const gamePickDuration =
  GAMEPICK_BAR_FILL + GAMEPICK_FADE + GAMEPICK_SLOT + GAMEPICK_HOLD;
