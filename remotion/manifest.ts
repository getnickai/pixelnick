/**
 * Server-safe metadata for every animatable composition.
 *
 * This file contains **no Remotion imports** and **no React component refs**,
 * which means it can be imported from React Server Components (e.g. the
 * `/motion` redirect, layout headers, future automation index endpoints).
 *
 * The full registry — which pairs each entry's metadata with its actual React
 * component — lives in `./registry.ts`. The two stay in sync by id.
 *
 * Adding a new animatable component:
 *   1. Add an entry here (server-safe metadata).
 *   2. Add the same id to the `componentBindings` map in `./registry.ts`.
 */
export type MotionEntryMeta = {
  id: string;
  label: string;
  /** Intrinsic frame width in pixels (e.g. 650). */
  width: number;
  /** Intrinsic frame height in pixels (e.g. 1136). */
  height: number;
  fps: number;
  /** Total frames; with fps gives the runtime (150 / 30 = 5s). */
  durationInFrames: number;
};

export const motionManifest: MotionEntryMeta[] = [
  {
    id: "performance-card",
    label: "Performance Card",
    width: 650,
    height: 1136,
    fps: 30,
    durationInFrames: 150,
  },
];

/** Server-safe lookup by id. */
export function getMotionEntryMeta(id: string): MotionEntryMeta | undefined {
  return motionManifest.find((entry) => entry.id === id);
}
