/**
 * Shared motion language for the Launch Video, extracted so the grafted product
 * beats animate with the exact same feel as Onur's original sequences.
 *
 * Product-film curves: a quick controlled overshoot for entrances, a sharper
 * accelerating exit. Opacity is always clamped separately from transform.
 */
import { Easing, interpolate } from "remotion";

export const POP_EASE = Easing.bezier(0.18, 1.18, 0.32, 1);
export const FAST_FADE_EASE = Easing.out(Easing.cubic);
export const OUTRO_EASE = Easing.in(Easing.cubic);

/** 0 before `start`, 1 after `start + duration`, eased in between. */
export const progress = (
  frame: number,
  start: number,
  duration: number,
  easing: (value: number) => number,
): number => {
  if (frame <= start) return 0;
  if (frame >= start + duration) return 1;

  return interpolate(frame, [start, start + duration], [0, 1], {
    easing,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};
