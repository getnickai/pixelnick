/**
 * Server-safe metadata for static (non-animated) share visuals.
 *
 * No Remotion imports — safe for Server Components, sidebars, and redirects.
 * Keep ids in sync with routes under `/static/[id]`.
 */
export type StaticEntryMeta = {
  id: string;
  label: string;
  width: number;
  height: number;
};

export const staticManifest: StaticEntryMeta[] = [
  {
    id: "performance-card",
    label: "Performance Card",
    width: 650,
    height: 1136,
  },
  {
    id: "swarm-arena-model-card",
    label: "SwarmArena Model Card",
    width: 650,
    height: 1110,
  },
  {
    id: "consensus-card",
    label: "Consensus Card",
    width: 650,
    height: 1110,
  },
  {
    id: "result-card",
    label: "Result Card",
    width: 650,
    height: 1110,
  },
  {
    id: "swarm-arena-leaderboard-card",
    label: "SwarmArena Leaderboard",
    width: 650,
    height: 1150,
  },
  {
    id: "matchday-card",
    label: "Matchday Card",
    width: 650,
    height: 1156,
  },
  {
    id: "matchday-card-analysis-start",
    label: "Matchday (Analysis · Start)",
    width: 650,
    height: 1156,
  },
  {
    id: "matchday-card-analysis-final",
    label: "Matchday (Analysis · Final)",
    width: 650,
    height: 1156,
  },
];

export function getStaticEntryMeta(id: string): StaticEntryMeta | undefined {
  return staticManifest.find((entry) => entry.id === id);
}
