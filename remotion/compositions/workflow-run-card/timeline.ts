/**
 * Frames for the Workflow Run Card @ 30fps, timed off the reference cut
 * (9s: fade in, Ready, trigger, three sources in parallel, LLM, Run complete).
 * Pure math, no Remotion imports, so manifest.ts can read the duration.
 */
export const WRC_FPS = 30;

export const WRC = {
  fadeIn: [0, 10] as const,
  /** Pill flips Ready → Running and the trigger starts. */
  triggerStart: 30,
  triggerDone: 50,
  /** Sources start staggered after the trigger completes. */
  sourceStart: 58,
  sourceStagger: 5,
  /** Each source's completion frame, in order. */
  sourceDone: [104, 110, 118],
  finalStart: 126,
  finalDone: 176,
  /** Pill flips to Run complete; the success banner slides in. */
  complete: 180,
} as const;

export const WRC_DURATION = 272;

/** Frames of the optional hook intro before the run (prompt typed, then sent). */
export const WRC_HOOK = 96;

export type NodeRunState = "idle" | "running" | "completed";

export function runState(frame: number, start: number, done: number): NodeRunState {
  if (frame < start) return "idle";
  if (frame < done) return "running";
  return "completed";
}

export function sourceStartFrame(i: number): number {
  return WRC.sourceStart + i * WRC.sourceStagger;
}

export function sourceDoneFrame(i: number): number {
  return WRC.sourceDone[i] ?? WRC.sourceDone[WRC.sourceDone.length - 1];
}
