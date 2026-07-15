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
import { fitCamera, nodeDims, type Camera, type NodeVariant } from "../nick-launch-video/graph";
import { layoutGraph, topoOrder } from "../workflow-template-card/layout";
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
 * Camera that frames the given nodes' FULL bounding box (node card size
 * included) inside the viewport with padding, then centers on that box. Unlike a
 * fixed focus scale, the scale is derived from the box so the opening shot always
 * keeps the first nodes fully in view — never clipped at the edges — whether the
 * canvas is the tight hero board or the large montage canvas.
 *
 * `margin` is the fraction of the viewport the box is allowed to fill (0.6 leaves
 * ~40% padding). Scale is clamped to [whole-graph fit, `maxScale`] so a tiny box
 * cannot zoom in absurdly and the intro never zooms out past the full graph.
 */
function focusFitCamera(
  template: TemplateGraph,
  cw: number,
  ch: number,
  vw: number,
  vh: number,
  ids: string[],
  variant: NodeVariant,
  margin: number,
  maxScale: number,
): Camera {
  const { w, h } = nodeDims(variant);
  const layout = layoutGraph(template.nodes, {
    width: cw,
    height: ch,
    padding: Math.max(w, h) * 0.7,
  });
  const pts = ids.map((id) => layout.nodeById[id]).filter(Boolean);
  const full = fitCamera(vw, vh, cw, ch, 0.9);
  if (!pts.length) return full;

  const minX = Math.min(...pts.map((p) => p.cx)) - w / 2;
  const maxX = Math.max(...pts.map((p) => p.cx)) + w / 2;
  const minY = Math.min(...pts.map((p) => p.cy)) - h / 2;
  const maxY = Math.max(...pts.map((p) => p.cy)) + h / 2;
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);

  const fitScale = Math.min(vw / bw, vh / bh) * margin;
  const scale = Math.min(maxScale, Math.max(full.scale, fitScale));
  return { scale, fx: (minX + maxX) / 2, fy: (minY + maxY) / 2 };
}

/**
 * Camera that opens focused on the graph's first ~`focusCount` topo nodes
 * (framed fully in view via `focusFitCamera`), holds while the build settles,
 * then lerps back to a whole-graph fit. Scale and the focus point (fx, fy) all
 * interpolate between the two Camera objects.
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
  focusCount = 2,
  focusMargin = 0.6,
  maxFocusScale = 1.7,
  variant = "rich",
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
  /** How many leading topo nodes the opening frames on (default 2). */
  focusCount?: number;
  /** Fraction of the viewport the focus box fills (default 0.6 = ~40% padding). */
  focusMargin?: number;
  /** Hard cap on the opening zoom so a tiny box cannot zoom in absurdly. */
  maxFocusScale?: number;
  /** Node card variant used for the layout + box math (default "rich"). */
  variant?: NodeVariant;
}): Camera {
  const focusIds = topoOrder(template.nodes, template.edges).slice(0, focusCount);
  const focus = focusFitCamera(template, cw, ch, vw, vh, focusIds, variant, focusMargin, maxFocusScale);
  const fit = fitCamera(vw, vh, cw, ch, 0.9);

  const zoomStart = buildStart + buildDur + holdDur;
  const t = progress(frame, zoomStart, zoomOutDur, ZOOM_OUT_EASE);

  return {
    scale: interpolate(t, [0, 1], [focus.scale, fit.scale]),
    fx: interpolate(t, [0, 1], [focus.fx, fit.fx]),
    fy: interpolate(t, [0, 1], [focus.fy, fit.fy]),
  };
}
