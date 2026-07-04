/**
 * Deterministic graph layout helpers for the Workflow Template Card.
 *
 * Editor positions are arbitrary units; `layoutGraph` normalizes them into a
 * pixel box (the graph area). No React Flow at render time — everything here is
 * pure math so the headless render and the live Player agree frame-for-frame.
 */
import type { TemplateEdgeData, TemplateNodeData } from "./props";

export type LaidOutNode = TemplateNodeData & {
  /** Node centre within the graph box, in px. */
  cx: number;
  cy: number;
};

export type GraphLayout = {
  nodes: LaidOutNode[];
  nodeById: Record<string, LaidOutNode>;
  width: number;
  height: number;
};

export function layoutGraph(
  nodes: TemplateNodeData[],
  { width, height, padding = 40 }: { width: number; height: number; padding?: number },
): GraphLayout {
  const xs = nodes.map((n) => n.position.x);
  const ys = nodes.map((n) => n.position.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const laid: LaidOutNode[] = nodes.map((n) => ({
    ...n,
    cx: padding + ((n.position.x - minX) / spanX) * innerW,
    cy: padding + ((n.position.y - minY) / spanY) * innerH,
  }));

  const nodeById: Record<string, LaidOutNode> = {};
  for (const n of laid) nodeById[n.id] = n;

  return { nodes: laid, nodeById, width, height };
}

/** Cubic-bezier edge path (React-Flow-ish) between two node centres. */
export function edgePath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.max(Math.abs(tx - sx) * 0.5, 24);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

/**
 * Topological order (Kahn's algorithm). Deterministic: ties break by the
 * node's original array index, so the conveyor always walks the graph the
 * same way. Any nodes left by a cycle are appended in original order.
 */
export function topoOrder(
  nodes: TemplateNodeData[],
  edges: TemplateEdgeData[],
): string[] {
  const indexOf = new Map<string, number>(nodes.map((n, i) => [n.id, i]));
  const indegree = new Map<string, number>(nodes.map((n) => [n.id, 0]));
  const outgoing = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const e of edges) {
    if (!indexOf.has(e.source) || !indexOf.has(e.target)) continue;
    indegree.set(e.target, (indegree.get(e.target) ?? 0) + 1);
    outgoing.get(e.source)!.push(e.target);
  }

  const ready = nodes.filter((n) => (indegree.get(n.id) ?? 0) === 0).map((n) => n.id);
  const order: string[] = [];
  const seen = new Set<string>();

  while (ready.length > 0) {
    ready.sort((a, b) => (indexOf.get(a)! - indexOf.get(b)!));
    const id = ready.shift()!;
    if (seen.has(id)) continue;
    seen.add(id);
    order.push(id);
    for (const next of outgoing.get(id) ?? []) {
      indegree.set(next, (indegree.get(next) ?? 0) - 1);
      if ((indegree.get(next) ?? 0) <= 0 && !seen.has(next)) ready.push(next);
    }
  }

  for (const n of nodes) if (!seen.has(n.id)) order.push(n.id);
  return order;
}
