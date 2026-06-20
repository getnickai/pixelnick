import { notFound } from "next/navigation";
import AiReadyCard from "@/components/ai-ready-card";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import ConsensusCard from "@/components/consensus-card-view";
import ResultCard from "@/components/result-card-view";
import SwarmArenaLeaderboardCard from "@/components/swarm-arena-leaderboard-card";
import MatchdayCard from "@/components/matchday-card-view";
import { StaticVisualHost } from "@/components/static-visual-host";
import { getStaticEntryMeta } from "@/static/manifest";

export default async function StaticVisualPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = getStaticEntryMeta(id);
  if (!entry) notFound();

  if (id === "performance-card") {
    return (
      <StaticVisualHost entry={entry}>
        <AiReadyCard />
      </StaticVisualHost>
    );
  }

  if (id === "swarm-arena-model-card") {
    return (
      <StaticVisualHost entry={entry}>
        <SwarmArenaModelCard />
      </StaticVisualHost>
    );
  }

  if (id === "consensus-card") {
    return (
      <StaticVisualHost entry={entry}>
        <ConsensusCard />
      </StaticVisualHost>
    );
  }

  if (id === "result-card") {
    return (
      <StaticVisualHost entry={entry}>
        <ResultCard />
      </StaticVisualHost>
    );
  }

  if (id === "swarm-arena-leaderboard-card") {
    return (
      <StaticVisualHost entry={entry}>
        <SwarmArenaLeaderboardCard />
      </StaticVisualHost>
    );
  }

  if (id === "matchday-card") {
    return (
      <StaticVisualHost entry={entry}>
        <MatchdayCard />
      </StaticVisualHost>
    );
  }

  if (id === "matchday-card-analysis-start") {
    return (
      <StaticVisualHost entry={entry}>
        <MatchdayCard variant="analysis" phase="start" />
      </StaticVisualHost>
    );
  }

  if (id === "matchday-card-analysis-final") {
    return (
      <StaticVisualHost entry={entry}>
        <MatchdayCard variant="analysis" phase="final" />
      </StaticVisualHost>
    );
  }

  notFound();
}
