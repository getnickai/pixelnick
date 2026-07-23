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
import { ResultCardComposition } from "./compositions/result-card/composition";
import { resultCardDefaultProps } from "./compositions/result-card/props";
import { SwarmArenaLeaderboardCardComposition } from "./compositions/swarm-arena-leaderboard-card/composition";
import { swarmArenaLeaderboardCardDefaultProps } from "./compositions/swarm-arena-leaderboard-card/props";
import { MatchdayAnalysisComposition } from "./compositions/matchday-analysis/composition";
import { matchdayAnalysisDefaultProps } from "./compositions/matchday-analysis/props";
import { GamePickCardComposition } from "./compositions/game-pick-card/composition";
import { gamePickCardDefaultProps } from "./compositions/game-pick-card/props";
import { ResultPortfolioCardComposition } from "./compositions/result-portfolio-card/composition";
import { resultPortfolioCardDefaultProps } from "./compositions/result-portfolio-card/props";
import { NickaiSocialCardComposition } from "./compositions/nickai-social-card/composition";
import { nickaiSocialCardDefaultProps } from "./compositions/nickai-social-card/props";
import { NickaiOgCoverComposition } from "./compositions/nickai-og-cover/composition";
import { nickaiOgCoverDefaultProps } from "./compositions/nickai-og-cover/props";
import { WorkflowTemplateCardCard } from "./compositions/workflow-template-card/card-with-font";
import {
  workflowTemplateCardDefaultProps,
  calcWorkflowTemplateMetadata,
} from "./compositions/workflow-template-card/props";
import { LaunchVideoComposition } from "./compositions/launch-video/composition";
import { launchVideoDefaultProps } from "./compositions/launch-video/props";
import { LaunchVideoProductCutComposition } from "./compositions/launch-video-pr91/composition";
import { launchVideoProductCutDefaultProps } from "./compositions/launch-video-pr91/props";
import { NickIntroComposition } from "./compositions/nick-intro/composition";
import { nickIntroDefaultProps } from "./compositions/nick-intro/props";
import { getMotionEntryMeta } from "./manifest";

const perf = getMotionEntryMeta("performance-card")!;
const swarm = getMotionEntryMeta("swarm-card")!;
const intro = getMotionEntryMeta("swarm-intro")!;
const modelAnim = getMotionEntryMeta("swarm-arena-model-card")!;
const consensus = getMotionEntryMeta("consensus-card")!;
const result = getMotionEntryMeta("result-card")!;
const leaderboardAnim = getMotionEntryMeta("swarm-arena-leaderboard-card")!;
const matchdayAnim = getMotionEntryMeta("matchday-analysis")!;
const gamePickAnim = getMotionEntryMeta("game-pick-card")!;
const resultPortfolioAnim = getMotionEntryMeta("result-portfolio-card")!;
const nickaiSocial = getMotionEntryMeta("nickai-social-card")!;
const nickaiOgCover = getMotionEntryMeta("nickai-og-cover")!;
const workflowTemplate = getMotionEntryMeta("workflow-template-card")!;
const launchVideo = getMotionEntryMeta("launch-video")!;
const launchVideoProductCut = getMotionEntryMeta("launch-video-pr91")!;
const nickIntro = getMotionEntryMeta("nick-intro")!;

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
      {/* Animated settled "won pick" result card — sibling of the consensus
          card; final score + HIT chip + banked-$ payout + per-agent bars. */}
      <Composition
        id="result-card"
        component={ResultCardComposition}
        durationInFrames={result.durationInFrames}
        fps={result.fps}
        width={result.width}
        height={result.height}
        defaultProps={resultCardDefaultProps}
      />
      {/* Animated leaderboard in the model-card design (PR #30). Registered
          here so it renders to PNG (settled frame) + MP4 via the CLI, fed the
          live ranked deck by generate-swarm-cards (--card=leaderboard). */}
      <Composition
        id="swarm-arena-leaderboard-card"
        component={SwarmArenaLeaderboardCardComposition}
        durationInFrames={leaderboardAnim.durationInFrames}
        fps={leaderboardAnim.fps}
        width={leaderboardAnim.width}
        height={leaderboardAnim.height}
        defaultProps={swarmArenaLeaderboardCardDefaultProps}
      />
      {/* Animated Matchday (Analysis) — slate buffers fill then resolve into
          the swarm's picks with slot-machine numbers, game by game. */}
      <Composition
        id="matchday-analysis"
        component={MatchdayAnalysisComposition}
        durationInFrames={matchdayAnim.durationInFrames}
        fps={matchdayAnim.fps}
        width={matchdayAnim.width}
        height={matchdayAnim.height}
        defaultProps={matchdayAnalysisDefaultProps}
      />
      {/* Animated Game Pick — single-game, single-agent sibling of the matchday
          slate; the "AI analysis" buffer fills then resolves into Nick's pick
          with slot-machine numbers. */}
      <Composition
        id="game-pick-card"
        component={GamePickCardComposition}
        durationInFrames={gamePickAnim.durationInFrames}
        fps={gamePickAnim.fps}
        width={gamePickAnim.width}
        height={gamePickAnim.height}
        defaultProps={gamePickCardDefaultProps}
      />
      {/* Animated Result + Portfolio — single-agent sibling of the result card;
          final score + HIT chip + banked-$ payout, then Nick's current
          portfolio spins + lands on the running bankroll. */}
      <Composition
        id="result-portfolio-card"
        component={ResultPortfolioCardComposition}
        durationInFrames={resultPortfolioAnim.durationInFrames}
        fps={resultPortfolioAnim.fps}
        width={resultPortfolioAnim.width}
        height={resultPortfolioAnim.height}
        defaultProps={resultPortfolioCardDefaultProps}
      />
      {/* NickAI social card (STA-473) — brand-dark frame for the weekly X
          content calendar, rendered to PNG/MP4 by render-nickai-social. */}
      <Composition
        id="nickai-social-card"
        component={NickaiSocialCardComposition}
        durationInFrames={nickaiSocial.durationInFrames}
        fps={nickaiSocial.fps}
        width={nickaiSocial.width}
        height={nickaiSocial.height}
        defaultProps={nickaiSocialCardDefaultProps}
      />
      {/* NickAI OG cover — reusable 1200x630 cover-image template (light +
          dark, no CTA) reproducing getnick.ai/og.png. Still (1 frame). */}
      <Composition
        id="nickai-og-cover"
        component={NickaiOgCoverComposition}
        durationInFrames={nickaiOgCover.durationInFrames}
        fps={nickaiOgCover.fps}
        width={nickaiOgCover.width}
        height={nickaiOgCover.height}
        defaultProps={nickaiOgCoverDefaultProps}
      />
      {/* Workflow Template Card (library "Blueprint" video) — prompt types in →
          lifts to headline → node conveyor (accelerando) → CP3 zoom-out. */}
      <Composition
        id="workflow-template-card"
        component={WorkflowTemplateCardCard}
        durationInFrames={workflowTemplate.durationInFrames}
        fps={workflowTemplate.fps}
        width={workflowTemplate.width}
        height={workflowTemplate.height}
        defaultProps={workflowTemplateCardDefaultProps}
        calculateMetadata={calcWorkflowTemplateMetadata}
      />
      {/* Launch Video — 16:10 campaign film. The Duplet title and product
          statement flow through market data, workflow responses, and the
          standalone four-node workflow build. */}
      <Composition
        id="launch-video"
        component={LaunchVideoComposition}
        durationInFrames={launchVideo.durationInFrames}
        fps={launchVideo.fps}
        width={launchVideo.width}
        height={launchVideo.height}
        defaultProps={launchVideoDefaultProps}
      />
      <Composition
        id="launch-video-pr91"
        component={LaunchVideoProductCutComposition}
        durationInFrames={launchVideoProductCut.durationInFrames}
        fps={launchVideoProductCut.fps}
        width={launchVideoProductCut.width}
        height={launchVideoProductCut.height}
        defaultProps={launchVideoProductCutDefaultProps}
      />
      <Composition
        id="nick-intro"
        component={NickIntroComposition}
        durationInFrames={nickIntro.durationInFrames}
        fps={nickIntro.fps}
        width={nickIntro.width}
        height={nickIntro.height}
        defaultProps={nickIntroDefaultProps}
      />
    </>
  );
};
