/**
 * Props for the animated SwarmArena Leaderboard composition.
 *
 * `data` drives the ranking (rows, ROI, spark) — defaults to the built-in
 * sample inside the composition when omitted, so the /motion preview is
 * unchanged. JSON-serializable for Remotion `inputProps`.
 */
import type { SwarmArenaLeaderboardCardData } from "../../../components/swarm-arena-leaderboard-card";

export type SwarmArenaLeaderboardCardProps = {
  /** Leaderboard values. Omit to render the built-in sample. */
  data?: SwarmArenaLeaderboardCardData;
};

export const swarmArenaLeaderboardCardDefaultProps: SwarmArenaLeaderboardCardProps = {};
