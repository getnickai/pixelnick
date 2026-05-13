import { redirect } from "next/navigation";
import { motionManifest } from "@/remotion/manifest";

/**
 * `/motion` itself has no UI — it redirects to the first registry entry so
 * users always land on a component preview.
 *
 * Imports the server-safe `motionManifest` (no `remotion` package, no React
 * contexts) so this Server Component renders cleanly without bailing out.
 */
export default function MotionIndex() {
  const first = motionManifest[0];
  if (!first) {
    // Manifest is empty — nothing to preview. Bail to the main dashboard.
    redirect("/performance-card");
  }
  redirect(`/motion/${first.id}`);
}
