"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import dynamic from "next/dynamic";
import { getMotionEntry } from "@/remotion/registry";

// Skip SSR for the Player: "use client" still prerenders on the server in
// Next.js App Router, which outputs a static frame-0 snapshot. That snapshot
// conflicts with Remotion's autoPlay loop on hydration. ssr:false ensures the
// Player mounts fresh on the client only, so autoPlay fires cleanly.
const PlayerHost = dynamic(
  () => import("./player-host").then((m) => m.PlayerHost),
  { ssr: false }
);

export default function MotionPlayerPage({
  params,
}: {
  params: Promise<{ componentId: string }>;
}) {
  const { componentId } = use(params);
  const entry = getMotionEntry(componentId);
  if (!entry) notFound();

  return <PlayerHost key={componentId} entry={entry} />;
}
