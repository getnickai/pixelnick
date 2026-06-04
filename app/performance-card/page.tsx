import { redirect } from "next/navigation";

/** Legacy URL — static previews live under `/static`. */
export default function PerformanceCardRedirect() {
  redirect("/static/performance-card");
}
