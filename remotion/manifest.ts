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
    // Animated version of the SwarmArena Model Card — drives the Design
    // component itself (components/swarm-arena-model-card.tsx) via its anim
    // contract, so the canvas is the card's native size. 8s @ 30fps: ~5.3s
    // staggered entrance + hold for the accent-bar breathe loop.
    id: "swarm-arena-model-card",
    label: "SwarmArena Model Card",
    width: 650,
    height: 1110,
    fps: 30,
    durationInFrames: 240,
  },
  {
    // Animated Market-vs-Agents consensus card — drives the React
    // ConsensusCardView via its anim contract. Cascade in + the edge "agents
    // see value" reveal (blurred slot-spin → blur lifts → reels land). 8s.
    id: "consensus-card",
    label: "Consensus Card",
    width: 650,
    height: 1110,
    fps: 30,
    durationInFrames: 240,
  },
  {
    // Animated settled "won pick" result card — the after-the-whistle sibling
    // of the consensus card. Same shell; swaps Market-vs-Swarm for the final
    // score (in the teams row), a HIT/MISS chip, and a "banked +$X" payout
    // hero (blurred slot-spin → blur lifts → reels land) + per-agent $ bars. 8s.
    id: "result-card",
    label: "Result Card",
    width: 650,
    height: 1110,
    fps: 30,
    durationInFrames: 240,
  },
  {
    // Animated leaderboard — frame chrome cascades in, then the ranking reveals
    // bottom-up (last place first → #1 winner last), footer + spark after.
    // ~7s @ 30fps: ~5.7s reveal + hold on the champion.
    id: "swarm-arena-leaderboard-card",
    label: "SwarmArena Leaderboard",
    width: 650,
    height: 1150,
    fps: 30,
    durationInFrames: 210,
  },
  {
    // SwarmArena intro sting, four acts (Figma 373:1485 → 376:1644 →
    // 376:1656 → model card): the mark fade-zooms in and docks into the
    // "Swarm Arena" lockup; the lockup exits left (the mark flying to the
    // top-left corner) while "AI Agents / Compete" letters in; the statement
    // swaps to "For Predicting / World Cup '26" as seven AI-model logos
    // assemble into a rotating orbit; then it cuts to the live-agent card's
    // top section (staggered cascade, PNL/Profit counting up). The orange
    // mark stays pinned top-left across all acts. Ease-in-out throughout.
    // 12.5s (Act 3 orbit holds an extra 1.5s before the Act 4 cut).
    id: "swarm-intro",
    label: "Swarm Intro",
    width: 650,
    height: 600,
    fps: 30,
    durationInFrames: 375,
  },
];

/** Server-safe lookup by id. */
export function getMotionEntryMeta(id: string): MotionEntryMeta | undefined {
  return motionManifest.find((entry) => entry.id === id);
}
