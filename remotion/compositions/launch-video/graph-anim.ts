/**
 * Shared workflow-graph build + camera animation for the Launch Video.
 *
 * Every workflow reveal in the launch video follows the same product-film
 * grammar: open ZOOMED IN on the graph's first couple of nodes (readable),
 * let the per-node build finish and settle, then PULL THE CAMERA BACK to reveal
 * the whole graph. `buildReveal` drives the per-node/edge stagger; `zoomIntroCamera`
 * drives the focus-then-fit camera move. Both are pure functions of `frame`, so
 * the headless render and the live Player agree frame-for-frame.
 */
import { Easing, interpolate } from "remotion";
import { fitCamera, focusCamera, type Camera } from "../nick-launch-video/graph";
import { topoOrder } from "../workflow-template-card/layout";
import type { TemplateGraph } from "../workflow-template-card/props";
import { progress, POP_EASE, FAST_FADE_EASE } from "./motion";

/** Fast per-node topo stagger across the build window, so the graph "finalizes"
 *  node-by-node with the connectors trailing behind. */
export function buildReveal(
  template: TemplateGraph,
  frame: number,
  start: number,
  duration: number,
) {
  const order = topoOrder(template.nodes, template.edges);
  const perNode = 8;
  const spread = Math.max(1, duration - perNode);
  const step = spread / Math.max(1, order.length - 1);
  const nodeReveal: Record<string, number> = {};
  order.forEach((id, i) => {
    nodeReveal[id] = progress(frame, start + i * step, perNode, POP_EASE);
  });
  // Edges draw with the overall build so connectors trail the nodes.
  const edgeP = progress(frame, start + duration * 0.28, duration * 0.6, FAST_FADE_EASE);
  const edgeReveal: Record<string, number> = {};
  template.edges.forEach((e) => {
    edgeReveal[e.id] = edgeP;
  });
  return { nodeReveal, edgeReveal };
}

const ZOOM_OUT_EASE = Easing.inOut(Easing.cubic);

/**
 * Camera that opens focused on the graph's first ~2 topo nodes (readable), holds
 * while the build settles, then lerps back to a whole-graph fit. Scale and the
 * focus point (fx, fy) all interpolate between the two Camera objects.
 */
export function zoomIntroCamera({
  template,
  vw,
  vh,
  cw,
  ch,
  frame,
  buildStart,
  buildDur,
  holdDur,
  zoomOutDur,
}: {
  template: TemplateGraph;
  /** Viewport (output) size. */
  vw: number;
  vh: number;
  /** Virtual canvas (layout) size. */
  cw: number;
  ch: number;
  frame: number;
  /** Build window (matches the buildReveal args for this workflow). */
  buildStart: number;
  buildDur: number;
  /** Frames to hold on the settled focus before pulling back. */
  holdDur: number;
  /** Duration of the pull-back to the whole-graph fit. */
  zoomOutDur: number;
}): Camera {
  const focusIds = topoOrder(template.nodes, template.edges).slice(0, 2);
  const focus = focusCamera(template, cw, ch, focusIds, 1.15, "rich");
  const fit = fitCamera(vw, vh, cw, ch, 0.9);

  const zoomStart = buildStart + buildDur + holdDur;
  const t = progress(frame, zoomStart, zoomOutDur, ZOOM_OUT_EASE);

  return {
    scale: interpolate(t, [0, 1], [focus.scale, fit.scale]),
    fx: interpolate(t, [0, 1], [focus.fx, fit.fx]),
    fy: interpolate(t, [0, 1], [focus.fy, fit.fy]),
  };
}
