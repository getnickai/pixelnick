import { redirect } from "next/navigation";
import { staticManifest } from "@/static/manifest";

/** `/static` redirects to the first static visual preview. */
export default function StaticIndex() {
  const first = staticManifest[0];
  if (!first) {
    redirect("/motion");
  }
  redirect(`/static/${first.id}`);
}
