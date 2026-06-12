import { notFound } from "next/navigation";
import AiReadyCard from "@/components/ai-ready-card";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import ConsensusCard from "@/components/consensus-card-view";
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

  notFound();
}
