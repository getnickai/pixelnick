/**
 * Props for the animated Matchday (Analysis) composition. `data` is a matchday
 * slate (SAMPLE_MATCHDAY_CARD shape); omit to render the built-in sample.
 */
import type { MatchdayCardData } from "../../../components/matchday-card-view";

export type MatchdayAnalysisProps = {
  data?: MatchdayCardData;
  /** Slot-machine slide on the number count-ups (default true). */
  slide?: boolean;
};

export const matchdayAnalysisDefaultProps: MatchdayAnalysisProps = { slide: true };

// Per-game timeline (30fps). Sequential: each game runs its full reveal, the
// rest blink LOADING… until their turn.
export const MATCHDAY_GAME_FRAMES = 135; // 4.5s = bar fill (2s) + fade (0.5s) + slot (2s)
export const MATCHDAY_BAR_FILL = 60; // 2s — loading bar 10% → 100%
export const MATCHDAY_FADE = 15; // 0.5s — pick components fade in
export const MATCHDAY_SLOT = 60; // 2s — slot-machine number reveal
export const MATCHDAY_HOLD = 90; // 3s — hold the fully-revealed card at the end

/** Total frames for a slate of `games` games. */
export const matchdayDuration = (games: number) =>
  Math.max(1, games) * MATCHDAY_GAME_FRAMES + MATCHDAY_HOLD;
