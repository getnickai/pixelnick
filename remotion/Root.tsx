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
import { SwarmIntroComposition } from "./compositions/swarm-intro/composition";
import { swarmIntroDefaultProps } from "./compositions/swarm-intro/props";
import { SwarmArenaModelCardComposition } from "./compositions/swarm-arena-model-card/composition";
import { swarmArenaModelCardDefaultProps } from "./compositions/swarm-arena-model-card/props";
import { ConsensusCardComposition } from "./compositions/consensus-card/composition";
import { consensusCardDefaultProps } from "./compositions/consensus-card/props";
import { getMotionEntryMeta } from "./manifest";

const perf = getMotionEntryMeta("performance-card")!;
const swarm = getMotionEntryMeta("swarm-card")!;
const intro = getMotionEntryMeta("swarm-intro")!;
const modelAnim = getMotionEntryMeta("swarm-arena-model-card")!;
const consensus = getMotionEntryMeta("consensus-card")!;

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
      <Composition
        id="swarm-intro"
        component={SwarmIntroComposition}
        durationInFrames={intro.durationInFrames}
        fps={intro.fps}
        width={intro.width}
        height={intro.height}
        defaultProps={swarmIntroDefaultProps}
      />
      {/* The full per-element animated model card (the /motion preview design),
          data-driven. Registered here so it renders to PNG (settled frame) +
          MP4 via the CLI, fed live agents by generate-swarm-cards. (STA-417) */}
      <Composition
        id="swarm-arena-model-card"
        component={SwarmArenaModelCardComposition}
        durationInFrames={modelAnim.durationInFrames}
        fps={modelAnim.fps}
        width={modelAnim.width}
        height={modelAnim.height}
        defaultProps={swarmArenaModelCardDefaultProps}
      />
      {/* Animated Market-vs-Agents consensus card (STA-421). */}
      <Composition
        id="consensus-card"
        component={ConsensusCardComposition}
        durationInFrames={consensus.durationInFrames}
        fps={consensus.fps}
        width={consensus.width}
        height={consensus.height}
        defaultProps={consensusCardDefaultProps}
      />
    </>
  );
};
