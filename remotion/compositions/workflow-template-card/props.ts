/**
 * Props for the Workflow Template Card composition.
 *
 * Must be JSON-serializable (Remotion v4): strings, numbers, booleans, plain
 * objects/arrays only. The graph is a trimmed copy of a library template
 * definition (`~/nickai-content/.../template-definitions/*.json`): just the
 * shape the card needs — node id/type/label/position + edge source/target.
 */
import { TEMPLATES } from "./data/templates.generated";
import { WTC_FPS, wtcDuration } from "./timeline";

export type TemplateNodeData = {
  id: string;
  /** Node type key, e.g. "start", "price-data", "conditional". */
  type: string;
  /** Node instance label, e.g. "Daily Trigger". */
  label: string;
  /** Optional one-line hero-card subtitle, e.g. "Daily · 21:30". */
  subtitle?: string;
  /** Editor canvas position (arbitrary units; normalized at layout time). */
  position: { x: number; y: number };
};

export type TemplateEdgeData = {
  id: string;
  source: string;
  target: string;
};

export type TemplateGraph = {
  slug: string;
  name: string;
  /** Short marketing description shown under the graph on the static poster. */
  description: string;
  /** Nick's first-person voice on the animated payoff ("I made a strategy that…"). */
  nickDescription: string;
  /** First-person prompt typed in the intro, e.g. "Automate my BTC dip buying". */
  prompt: string;
  nodes: TemplateNodeData[];
  edges: TemplateEdgeData[];
};

export type WorkflowRatio = "portrait" | "landscape";

export type WorkflowTemplateCardProps = {
  template: TemplateGraph;
  /** Portrait (650×1136, IG) default; landscape (1280×720, 16:9 / X). */
  ratio?: WorkflowRatio;
};

/**
 * Frame size per ratio. NOTE: only `portrait` is laid out today — the View +
 * conveyor geometry are portrait-hardcoded. `landscape` is reserved for a
 * follow-up two-column (text left / graph right) redesign.
 */
export const WTC_SIZES: Record<WorkflowRatio, readonly [number, number]> = {
  portrait: [650, 1136],
  landscape: [1280, 720],
};

/** Sample data — registry `defaultProps` and the settled-still fallback. */
export const workflowTemplateCardDefaultProps: WorkflowTemplateCardProps = {
  template: TEMPLATES["btc-buy-the-dip"],
  ratio: "portrait",
};

/**
 * Remotion `calculateMetadata` — the frame size comes from `ratio` and the
 * runtime from the graph's node count (accelerando + zoom-out), so every
 * template gets a correctly-sized, correctly-timed render without per-entry
 * manifest edits.
 */
export function calcWorkflowTemplateMetadata({ props }: { props: WorkflowTemplateCardProps }) {
  const [width, height] = WTC_SIZES[props.ratio ?? "portrait"] ?? WTC_SIZES.portrait;
  const nodeCount = props.template?.nodes?.length ?? 0;
  return { width, height, durationInFrames: wtcDuration(nodeCount), fps: WTC_FPS };
}
