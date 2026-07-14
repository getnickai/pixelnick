import type { ComponentType } from "react";
import {
  PerformanceCardComposition,
} from "./compositions/performance-card/composition";
import {
  performanceCardDefaultProps,
  type PerformanceCardProps,
} from "./compositions/performance-card/props";
import { SwarmCardComposition } from "./compositions/swarm-card/composition";
import {
  swarmCardDefaultProps,
  type SwarmCardProps,
} from "./compositions/swarm-card/props";
import { SwarmArenaModelCardComposition } from "./compositions/swarm-arena-model-card/composition";
import {
  swarmArenaModelCardDefaultProps,
  type SwarmArenaModelCardProps,
} from "./compositions/swarm-arena-model-card/props";
import { SwarmArenaLeaderboardCardComposition } from "./compositions/swarm-arena-leaderboard-card/composition";
import {
  swarmArenaLeaderboardCardDefaultProps,
  type SwarmArenaLeaderboardCardProps,
} from "./compositions/swarm-arena-leaderboard-card/props";
import { SwarmIntroComposition } from "./compositions/swarm-intro/composition";
import {
  swarmIntroDefaultProps,
  type SwarmIntroProps,
} from "./compositions/swarm-intro/props";
import { ConsensusCardComposition } from "./compositions/consensus-card/composition";
import {
  consensusCardDefaultProps,
  type ConsensusCardProps,
} from "./compositions/consensus-card/props";
import { ResultCardComposition } from "./compositions/result-card/composition";
import {
  resultCardDefaultProps,
  type ResultCardProps,
} from "./compositions/result-card/props";
import { MatchdayAnalysisComposition } from "./compositions/matchday-analysis/composition";
import {
  matchdayAnalysisDefaultProps,
  type MatchdayAnalysisProps,
} from "./compositions/matchday-analysis/props";
import { GamePickCardComposition } from "./compositions/game-pick-card/composition";
import {
  gamePickCardDefaultProps,
  type GamePickCardProps,
} from "./compositions/game-pick-card/props";
import { ResultPortfolioCardComposition } from "./compositions/result-portfolio-card/composition";
import {
  resultPortfolioCardDefaultProps,
  type ResultPortfolioCardProps,
} from "./compositions/result-portfolio-card/props";
import { NickaiSocialCardComposition } from "./compositions/nickai-social-card/composition";
import {
  nickaiSocialCardDefaultProps,
  type NickaiSocialCardProps,
} from "./compositions/nickai-social-card/props";
import { NickaiOgCoverComposition } from "./compositions/nickai-og-cover/composition";
import {
  nickaiOgCoverDefaultProps,
  type NickaiOgCoverProps,
} from "./compositions/nickai-og-cover/props";
import { WorkflowTemplateCardComposition } from "./compositions/workflow-template-card/composition";
import {
  workflowTemplateCardDefaultProps,
  type WorkflowTemplateCardProps,
} from "./compositions/workflow-template-card/props";
import { LaunchVideoComposition } from "./compositions/launch-video/composition";
import {
  launchVideoDefaultProps,
  type LaunchVideoProps,
} from "./compositions/launch-video/props";
import {
  motionManifest,
  type MotionEntryMeta,
} from "./manifest";

/**
 * Full motion registry — metadata from `./manifest.ts` paired with each
 * composition's React component and default props.
 *
 * **Client-only.** Importing this file pulls in `remotion`, which initialises
 * React contexts at module load. That makes it incompatible with React Server
 * Components. Anywhere in a Server Component, import from `./manifest.ts`
 * instead — that file is component-ref-free and safe in RSC.
 *
 * Consumed by:
 *   - `app/motion/[componentId]/page.tsx` (client) to feed `<Player>`
 *   - future automation services (`renderMediaOnLambda({ composition: id })`)
 *
 * Adding a new animatable component:
 *   1. Add an entry to `./manifest.ts` (server-safe metadata).
 *   2. Add a binding below mapping the manifest id → `{ component, defaultProps }`.
 */
export type MotionEntry<P = Record<string, unknown>> = MotionEntryMeta & {
  defaultProps: P;
  component: ComponentType<P>;
};

type ComponentBinding<P = unknown> = {
  component: ComponentType<P>;
  defaultProps: P;
};

const componentBindings: Record<string, ComponentBinding> = {
  "performance-card": {
    component: PerformanceCardComposition,
    defaultProps: performanceCardDefaultProps,
  } as ComponentBinding<PerformanceCardProps> as ComponentBinding,
  "swarm-card": {
    component: SwarmCardComposition,
    defaultProps: swarmCardDefaultProps,
  } as ComponentBinding<SwarmCardProps> as ComponentBinding,
  "swarm-arena-model-card": {
    component: SwarmArenaModelCardComposition,
    defaultProps: swarmArenaModelCardDefaultProps,
  } as ComponentBinding<SwarmArenaModelCardProps> as ComponentBinding,
  "swarm-arena-leaderboard-card": {
    component: SwarmArenaLeaderboardCardComposition,
    defaultProps: swarmArenaLeaderboardCardDefaultProps,
  } as ComponentBinding<SwarmArenaLeaderboardCardProps> as ComponentBinding,
  "swarm-intro": {
    component: SwarmIntroComposition,
    defaultProps: swarmIntroDefaultProps,
  } as ComponentBinding<SwarmIntroProps> as ComponentBinding,
  "consensus-card": {
    component: ConsensusCardComposition,
    defaultProps: consensusCardDefaultProps,
  } as ComponentBinding<ConsensusCardProps> as ComponentBinding,
  "result-card": {
    component: ResultCardComposition,
    defaultProps: resultCardDefaultProps,
  } as ComponentBinding<ResultCardProps> as ComponentBinding,
  "matchday-analysis": {
    component: MatchdayAnalysisComposition,
    defaultProps: matchdayAnalysisDefaultProps,
  } as ComponentBinding<MatchdayAnalysisProps> as ComponentBinding,
  "game-pick-card": {
    component: GamePickCardComposition,
    defaultProps: gamePickCardDefaultProps,
  } as ComponentBinding<GamePickCardProps> as ComponentBinding,
  "result-portfolio-card": {
    component: ResultPortfolioCardComposition,
    defaultProps: resultPortfolioCardDefaultProps,
  } as ComponentBinding<ResultPortfolioCardProps> as ComponentBinding,
  "nickai-social-card": {
    component: NickaiSocialCardComposition,
    defaultProps: nickaiSocialCardDefaultProps,
  } as ComponentBinding<NickaiSocialCardProps> as ComponentBinding,
  "workflow-template-card": {
    component: WorkflowTemplateCardComposition,
    defaultProps: workflowTemplateCardDefaultProps,
  } as ComponentBinding<WorkflowTemplateCardProps> as ComponentBinding,
  "nickai-og-cover": {
    component: NickaiOgCoverComposition,
    defaultProps: nickaiOgCoverDefaultProps,
  } as ComponentBinding<NickaiOgCoverProps> as ComponentBinding,
  "launch-video": {
    component: LaunchVideoComposition,
    defaultProps: launchVideoDefaultProps,
  } as ComponentBinding<LaunchVideoProps> as ComponentBinding,
};

export const motionRegistry: MotionEntry[] = motionManifest
  .map((meta) => {
    const binding = componentBindings[meta.id];
    if (!binding) {
      // Manifest entry without a binding (e.g. composition is planned but not
      // yet built). Skip it — the sidebar can still list it from the manifest,
      // and `getMotionEntry` returns undefined so the Player page 404s cleanly.
      if (typeof console !== "undefined") {
        console.warn(
          `motionRegistry: manifest entry "${meta.id}" has no component ` +
            `binding. Add one in remotion/registry.ts to make it playable.`,
        );
      }
      return null;
    }
    return { ...meta, ...binding } as MotionEntry;
  })
  .filter((entry): entry is MotionEntry => entry !== null);

/** Client-side lookup that includes the component reference. */
export function getMotionEntry(id: string): MotionEntry | undefined {
  return motionRegistry.find((entry) => entry.id === id);
}
