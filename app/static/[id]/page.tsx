import { notFound } from "next/navigation";
import AiReadyCard from "@/components/ai-ready-card";
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
    return <AiReadyCard />;
  }

  notFound();
}
