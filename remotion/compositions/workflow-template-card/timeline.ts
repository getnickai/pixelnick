/**
 * Pure timeline math for the Workflow Template Card — NO Remotion / React
 * imports, so it's safe to import from the server-safe `manifest.ts` as well
 * as the composition. Keeps runtime frames and metadata duration in sync.
 *
 * All windows are `[startFrame, endFrame]` @ 30fps. Frame 0 is first visible.
 */
export const WTC_FPS = 30;

export const WTC_ANIM = {
  /** Logo drop-in. */
  logoIn: [0, 12] as [number, number],
  /** Chat box fade-in. */
  boxIn: [0, 14] as [number, number],
  /** Prompt typing window. */
  typing: [14, 66] as [number, number],
  /** Status line ("Nick is thinking…") fades in under the chat box once typing completes. */
  statusIn: 66,
  /** Send-button "click" pulse once typing completes. */
  sendClick: [66, 78] as [number, number],
  /** Chat box + status line spring up under the header. */
  lift: [96, 126] as [number, number],
  /** First hero node arrives centre here (soon after the lift settles). */
  conveyorStart: 140,
  /**
   * Extra frames the OPENING node holds centre before the second node arrives,
   * on top of `beatBase`. Gives the viewer a beat to register "this is the
   * first node / the start of the workflow" before the conveyor gets going.
   */
  firstHold: 44,
  /**
   * Accelerando. The first three nodes share `beatBase` (constant tempo);
   * starting at the 3rd node, each subsequent beat shortens by 30%
   * (× `beatRatio`), compounding toward the end. `beatFloor` keeps the late,
   * fast beats perceptible.
   */
  beatBase: 30,
  beatRatio: 0.7,
  beatFloor: 5,
  /** Zoom-out: conveyor recedes; mini-canvas + name + description + CTA arrive. */
  zoomDur: 46,
  /** Settle hold on the finished poster — extra 2s after the payoff lands. */
  settleHold: 52 + 60,
} as const;

/**
 * Gap (frames) before node `k+1` arrives. k = 0,1 → base tempo (nodes 0..2
 * share it); k ≥ 2 → base × ratio^(k−1), i.e. the acceleration starts at the
 * 3rd node and compounds 30% per node, floored so it stays visible.
 */
export function wtcBeat(k: number): number {
  // Opening node lingers: base tempo + firstHold before node 2 arrives.
  if (k === 0) return WTC_ANIM.beatBase + WTC_ANIM.firstHold;
  if (k < 2) return WTC_ANIM.beatBase;
  return Math.max(
    WTC_ANIM.beatFloor,
    Math.round(WTC_ANIM.beatBase * WTC_ANIM.beatRatio ** (k - 1)),
  );
}

/** Frame at which node `index` (0-based, in conveyor order) reaches centre. */
export function wtcNodeArrival(index: number): number {
  let f = WTC_ANIM.conveyorStart;
  for (let k = 0; k < index; k++) f += wtcBeat(k);
  return f;
}

/**
 * Index of the last node that gets a centred hero beat. The zoom-out begins
 * *before* the final node would arrive, so that node is revealed inside the
 * mini-canvas rather than as its own card.
 */
export function wtcLastHeroIndex(nodeCount: number): number {
  return Math.max(nodeCount - 2, 0);
}

/** Frame the last hero node reaches centre. */
export function wtcConveyorEnd(nodeCount: number): number {
  return wtcNodeArrival(wtcLastHeroIndex(nodeCount));
}

/**
 * [start, end] frames of the zoom-out (conveyor → settled poster). The pull-back
 * begins one node *before* the last hero node reaches centre, so that node
 * slides in while the camera is already receding — the conveyor never stops.
 */
export function wtcZoomWindow(nodeCount: number): [number, number] {
  const start = wtcNodeArrival(Math.max(wtcLastHeroIndex(nodeCount) - 1, 0));
  return [start, start + WTC_ANIM.zoomDur];
}

/** Total frames for a graph of `nodeCount` nodes. */
export function wtcDuration(nodeCount: number): number {
  return wtcZoomWindow(nodeCount)[1] + WTC_ANIM.settleHold;
}

/**
 * Tool calls a template makes = nodes × 2.4, rounded up. Drives both the
 * settled "N tools called" meta row and the live counter that climbs during
 * the build. Shared so the two never disagree.
 */
export function toolsCalledFor(nodeCount: number): number {
  return Math.ceil(nodeCount * 2.4);
}
