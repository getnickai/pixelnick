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
  /** Total frames; with fps gives the runtime (270 / 30 = 9s). */
  durationInFrames: number;
};

/** Extra tail after entrances finish — bar pulse / glow hold (30fps). */
export const PERFORMANCE_CARD_HOLD_FRAMES = 120;

export const motionManifest: MotionEntryMeta[] = [
  {
    id: "performance-card",
    label: "Performance Card",
    width: 650,
    height: 1136,
    fps: 30,
    durationInFrames: 150 + PERFORMANCE_CARD_HOLD_FRAMES,
  },
  {
    // Swarm Arena share card. Intrinsic size is the portrait default; the
    // actual frame size is overridden per-render from the `size` prop via
    // calculateMetadata. A still, so durationInFrames = 1.
    id: "swarm-card",
    label: "Swarm Arena Card",
    width: 650,
    height: 1136,
    fps: 30,
    durationInFrames: 1,
  },
  {
    // Animated version of the new SwarmArena Model Card design (React-based,
    // mirrors components/swarm-arena-model-card.tsx). 8s @ 30fps: ~5.3s
    // staggered entrance + hold for the accent-bar breathe loop.
    id: "swarm-arena-model-card",
    label: "SwarmArena Model Card",
    width: 650,
    height: 1050,
    fps: 30,
    durationInFrames: 240,
  },
  {
    // SwarmArena intro sting, three acts (Figma 373:1485 → 376:1644 →
    // 376:1656): the mark fade-zooms in and docks into the "Swarm Arena"
    // lockup; the lockup exits left while "AI Agents / Compete" letters in;
    // then the statement swaps to "For Predicting / World Cup '26" as seven
    // AI-model logos assemble into a rotating orbit. Ease-in-out throughout
    // (cubic opening zoom, expo elsewhere). 8.4s @ 30fps.
    id: "swarm-intro",
    label: "Swarm Intro",
    width: 650,
    height: 600,
    fps: 30,
    durationInFrames: 252,
  },
];

/** Server-safe lookup by id. */
export function getMotionEntryMeta(id: string): MotionEntryMeta | undefined {
  return motionManifest.find((entry) => entry.id === id);
}
