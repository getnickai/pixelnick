/**
 * Props for the Workflow Run Card: a workflow's graph, drawn with the product's
 * own node cards, executing once (Ready → Running → Run complete).
 *
 * JSON-serializable (Remotion v4). The graph is fixed in shape: one trigger,
 * up to three parallel data nodes, one final node (usually the LLM).
 */
import { WRC_FPS, WRC_DURATION, WRC_HOOK } from "./timeline";

/** Node types the card knows how to draw (product `iconType`s). */
export type RunNodeType =
  | "start"
  | "twitter-data"
  | "stocks-data"
  | "polymarket-data"
  | "price-data"
  | "llm";

export type RunNode = {
  type: RunNodeType;
  /** Card title and run-list title, e.g. "Jensen / Nvidia on X". */
  title: string;
  /** Run-list second line, e.g. "Jensen Huang · @nvidia". */
  detail: string;
  /** The card's summary row (product `NodeValue`), e.g. "Recent · from:nvidia". */
  value: string;
  /** Real result line from an actual run, e.g. "Nov 19 listing: 88.7%". Replaces `detail` once the node completes. Never invent it. */
  output?: string;
};

export type WorkflowRunCardProps = {
  name: string;
  trigger: RunNode;
  /** Run in parallel after the trigger; 1–3 nodes. */
  sources: RunNode[];
  /** Runs once every source completes. */
  final: RunNode;
  cta: string;
  /** Public share link (app.getnick.ai/workflow/share/<token>), printed above the CTA. */
  link?: string;
  /** Opening hook in big type, e.g. "The Huang Drama Money Maker". Adds WRC_HOOK frames before the run. */
  hook?: string;
  /** Prompt typed under the hook, e.g. "Track the Huang drama for me." */
  prompt?: string;
};

export const workflowRunCardDefaultProps: WorkflowRunCardProps = {
  name: "Jensen Huang Nvidia Turmoil workflow",
  trigger: { type: "start", title: "Manual scan", detail: "Manual", value: "Manual" },
  sources: [
    {
      type: "twitter-data",
      title: "Jensen / Nvidia on X",
      detail: "Jensen Huang · @nvidia",
      value: "Recent · Jensen Huang · @nvidia",
    },
    {
      type: "stocks-data",
      title: "NVDA + AI supply chain",
      detail: "NVDA · AVGO · TSM · VRT",
      value: "NVDA · AVGO · TSM · VRT",
    },
    {
      type: "polymarket-data",
      title: "Nvidia prediction markets",
      detail: "Polymarket",
      value: "Polymarket · Nvidia",
    },
  ],
  final: {
    type: "llm",
    title: "Catalyst trade decision brief",
    detail: "openai/gpt-5.6-sol",
    value: "openai/gpt-5.6-sol",
  },
  cta: "Remix this agent, try Nick for free",
};

export const WRC_SIZE = [650, 1136] as const;

export function calcWorkflowRunMetadata({ props }: { props?: WorkflowRunCardProps } = {}) {
  return {
    width: WRC_SIZE[0],
    height: WRC_SIZE[1],
    durationInFrames: WRC_DURATION + (props?.hook ? WRC_HOOK : 0),
    fps: WRC_FPS,
  };
}
