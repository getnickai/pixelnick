import {
  performanceCardDefaultProps,
  type PerformanceCardProps,
} from "@/remotion/compositions/performance-card/props";
import { PerformanceCardView } from "./performance-card-view";

/**
 * Static performance card — the settled still of the single design source.
 *
 * Renders `PerformanceCardView` (the one design definition, shared with the
 * Remotion composition) in its fully-revealed state as PLAIN HTML. Because it's
 * plain DOM (no Remotion runtime), html-to-image can rasterise it to a PNG —
 * which is what the gallery download, `/embed`, and `/static` need. The animated
 * version (MP4 + `<Player>`) is the same `PerformanceCardView` driven per frame
 * by the composition, so the still and the animation can never drift.
 *
 * The outer `<article>` is the 650×1136 sizing/clip box; the view fills it.
 * Accepts an optional partial props override; defaults to the sample data so
 * prop-less call sites (`/embed`, `/static`) keep working.
 */
export default function AiReadyCard(props: Partial<PerformanceCardProps> = {}) {
  const merged: PerformanceCardProps = { ...performanceCardDefaultProps, ...props };

  return (
    <article
      className="relative w-[650px] h-[1136px] overflow-clip rounded-2xl bg-primary-1000 font-sans"
      data-node-id="187:3"
    >
      <PerformanceCardView props={merged} />
    </article>
  );
}
