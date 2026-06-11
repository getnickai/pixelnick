import { redirect } from "next/navigation";
import { engineManifest } from "@/engine/manifest";

/** `/engine` redirects to the first engine surface. */
export default function EngineIndex() {
  const first = engineManifest[0];
  if (!first) {
    redirect("/static");
  }
  redirect(`/engine/${first.id}`);
}
