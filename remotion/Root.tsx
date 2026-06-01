/**
 * Remotion root — registers every composition for the headless renderer and
 * the Remotion Studio. Kept separate from the Next.js app: the app uses
 * `@remotion/player` against `registry.ts`, while CLI/programmatic renders use
 * this root via `index.ts`.
 *
 * Adding a composition:
 *   1. Add it to `manifest.ts` (server-safe metadata) and `registry.ts` (the
 *      web Player binding) as before.
 *   2. Add a <Composition> here so it's renderable to PNG/MP4.
 */
import "./style.css";
import { Composition } from "remotion";
import { PerformanceCardCard } from "./compositions/performance-card/card-with-font";
import { performanceCardDefaultProps } from "./compositions/performance-card/props";
import { SwarmCardComposition } from "./compositions/swarm-card/composition";
import {
  swarmCardDefaultProps,
  calcSwarmMetadata,
} from "./compositions/swarm-card/props";
import { getMotionEntryMeta } from "./manifest";

const perf = getMotionEntryMeta("performance-card")!;
const swarm = getMotionEntryMeta("swarm-card")!;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="performance-card"
        component={PerformanceCardCard}
        durationInFrames={perf.durationInFrames}
        fps={perf.fps}
        width={perf.width}
        height={perf.height}
        defaultProps={performanceCardDefaultProps}
      />
      <Composition
        id="swarm-card"
        component={SwarmCardComposition}
        durationInFrames={swarm.durationInFrames}
        fps={swarm.fps}
        width={swarm.width}
        height={swarm.height}
        defaultProps={swarmCardDefaultProps}
        calculateMetadata={calcSwarmMetadata}
      />
    </>
  );
};
