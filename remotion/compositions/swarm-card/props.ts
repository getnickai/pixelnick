/**
 * Props for the Swarm Arena share-card composition.
 *
 * One composition renders ONE card. The card engine (window.SA) is data-driven:
 * pass a `deck` (agents + match, already mapped from the bucket) and a spec
 * (which card, which agent, which layout/theme/size). If `deck` is omitted the
 * engine falls back to its built-in sample data, which is handy in Studio.
 *
 * Everything here is plain JSON so it can ride in Remotion `inputProps`.
 */
import type { SwarmDeck } from "../../../data/swarm-output";

export type SwarmCardKind = "agent" | "match" | "leaderboard";
export type SwarmAgentLayout = "editorial" | "hero" | "scoreboard" | "terminal";
export type SwarmTheme = "dark" | "light";
export type SwarmSize = "portrait" | "story" | "square" | "og";

/** Pixel dimensions per size, matching the engine's `frame()` sizing table. */
export const SWARM_SIZES: Record<SwarmSize, [number, number]> = {
  portrait: [650, 1136],
  story: [1080, 1920],
  square: [1080, 1080],
  og: [1200, 630],
};

export type SwarmCardProps = {
  card: SwarmCardKind;
  /** Agent handle for `card: "agent"` (ignored otherwise). */
  handle?: string;
  /** Agent layout for `card: "agent"` (ignored otherwise). */
  layout?: SwarmAgentLayout;
  theme: SwarmTheme;
  size: SwarmSize;
  /** Resolved data. Omit to use the engine's built-in sample deck. */
  deck?: SwarmDeck;
};

export const swarmCardDefaultProps: SwarmCardProps = {
  card: "agent",
  handle: "GROK",
  layout: "editorial",
  theme: "dark",
  size: "portrait",
};

/** Composition length for the animated card: 5s at 30fps. The card holds
 *  after its entrance cascade; the PNG still is rendered at the final frame. */
export const SWARM_FPS = 30;
export const SWARM_DURATION_FRAMES = 150;

/** Remotion `calculateMetadata` — set the frame size from the `size` prop. */
export function calcSwarmMetadata({ props }: { props: SwarmCardProps }) {
  const [width, height] = SWARM_SIZES[props.size] ?? SWARM_SIZES.portrait;
  return { width, height, durationInFrames: SWARM_DURATION_FRAMES, fps: SWARM_FPS };
}
