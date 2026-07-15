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
  const perNode = 10;
  const spread = Math.max(1, duration - perNode);
  const step = spread / Math.max(1, order.length - 1);
  const nodeReveal: Record<string, number> = {};
  order.forEach((id, i) => {
    nodeReveal[id] = progress(frame, start + i * step, perNode, POP_EASE);
  });
  const indexById = new Map(order.map((id, index) => [id, index]));
  // Every connector follows its own downstream node instead of arriving as one
  // late overlay. The source is already present, the curve draws, and the
  // target settles while that curve completes.
  const edgeReveal: Record<string, number> = {};
  template.edges.forEach((e) => {
    const sourceIndex = indexById.get(e.source) ?? 0;
    const targetIndex = indexById.get(e.target) ?? sourceIndex + 1;
    const edgeStart = start + Math.max(sourceIndex, targetIndex) * step + 5;
    edgeReveal[e.id] = progress(frame, edgeStart, 8, FAST_FADE_EASE);
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

/**
 * Expands the camera's fitted bounds along with the topological build. The
 * framing always anticipates the next node, so a card never enters as a clipped
 * fragment at a viewport edge. This gives the montage a smooth pan/pull-back
 * without sacrificing complete node silhouettes.
 */
export function progressiveBuildCamera({
  template,
  vw,
  vh,
  cw,
  ch,
  frame,
  buildStart,
  buildDur,
  variant = "cinematic",
  margin = 0.76,
  maxScale = 1.12,
  focusCount = 5,
  overviewScale = 0.55,
}: {
  template: TemplateGraph;
  vw: number;
  vh: number;
  cw: number;
  ch: number;
  frame: number;
  buildStart: number;
  buildDur: number;
  variant?: NodeVariant;
  margin?: number;
  maxScale?: number;
  focusCount?: number;
  overviewScale?: number;
}): Camera {
  const order = topoOrder(template.nodes, template.edges);
  const { w, h } = nodeDims(variant);
  const layout = layoutGraph(template.nodes, {
    width: cw,
    height: ch,
    padding: Math.max(w, h) * 0.7,
  });
  const full = fitCamera(vw, vh, cw, ch, 0.92);

  const fitPrefix = (count: number): Camera => {
    const points = order
      .slice(0, Math.max(1, Math.min(order.length, count)))
      .map((id) => layout.nodeById[id])
      .filter(Boolean);
    if (!points.length) return full;

    const minX = Math.min(...points.map((point) => point.cx)) - w / 2;
    const maxX = Math.max(...points.map((point) => point.cx)) + w / 2;
    const minY = Math.min(...points.map((point) => point.cy)) - h / 2;
    const maxY = Math.max(...points.map((point) => point.cy)) + h / 2;
    const scale = Math.min(
      maxScale,
      Math.max(
        full.scale,
        Math.min(vw / Math.max(1, maxX - minX), vh / Math.max(1, maxY - minY)) * margin,
      ),
    );

    return {
      scale,
      fx: (minX + maxX) / 2,
      fy: (minY + maxY) / 2,
    };
  };

  const deliberateCount = Math.max(1, Math.min(focusCount, order.length));
  const focusDuration = buildDur * 0.52;
  const focusRaw = interpolate(
    frame,
    [buildStart, buildStart + focusDuration],
    [0, Math.max(0, deliberateCount - 1)],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const focusStage = Math.min(deliberateCount - 1, Math.floor(focusRaw));
  const focusLocal = Easing.inOut(Easing.cubic)(focusRaw - focusStage);
  const focusFrom = fitPrefix(focusStage + 1);
  const focusTo = fitPrefix(Math.min(deliberateCount, focusStage + 2));
  const focused: Camera = {
    scale: interpolate(focusLocal, [0, 1], [focusFrom.scale, focusTo.scale]),
    fx: interpolate(focusLocal, [0, 1], [focusFrom.fx, focusTo.fx]),
    fy: interpolate(focusLocal, [0, 1], [focusFrom.fy, focusTo.fy]),
  };

  const allPoints = order.map((id) => layout.nodeById[id]).filter(Boolean);
  const minX = Math.min(...allPoints.map((point) => point.cx)) - w / 2;
  const minY = Math.min(...allPoints.map((point) => point.cy)) - h / 2;
  const maxY = Math.max(...allPoints.map((point) => point.cy)) + h / 2;
  // Keep the overview large enough to read. It is allowed to extend beyond the
  // right edge, but the full left side remains locked to an 80px safe margin.
  const readableScale = Math.max(
    full.scale,
    Math.min(overviewScale, (vh / Math.max(1, maxY - minY)) * 0.9),
  );
  const overview: Camera = {
    scale: readableScale,
    fx: minX + (vw / 2 - 60) / readableScale,
    fy: (minY + maxY) / 2,
  };

  const pullBack = progress(
    frame,
    buildStart + focusDuration,
    buildDur - focusDuration,
    Easing.inOut(Easing.cubic),
  );

  return {
    scale: interpolate(pullBack, [0, 1], [focused.scale, overview.scale]),
    fx: interpolate(pullBack, [0, 1], [focused.fx, overview.fx]),
    fy: interpolate(pullBack, [0, 1], [focused.fy, overview.fy]),
  };
}
