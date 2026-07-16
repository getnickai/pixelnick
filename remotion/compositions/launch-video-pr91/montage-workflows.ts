import { MONTAGE_WORKFLOWS, type LaunchWorkflow } from "../nick-launch-video/props";
import { topoOrder } from "../workflow-template-card/layout";
import type { TemplateGraph } from "../workflow-template-card/props";

export type LeanMontageWorkflow = LaunchWorkflow & {
  canvasW: number;
  canvasH: number;
};

/**
 * The source templates carry editor coordinates, including intentional overlap.
 * The product cut uses a consistent topological layout so every graph keeps the
 * same generous spacing and cinematic card language from build through docking.
 */
function leanOutTemplate(template: TemplateGraph): TemplateGraph {
  const order = topoOrder(template.nodes, template.edges);
  const rankById = new Map(template.nodes.map((node) => [node.id, 0]));
  const sourceIndex = new Map(template.nodes.map((node, index) => [node.id, index]));

  for (const id of order) {
    const rank = rankById.get(id) ?? 0;
    for (const edge of template.edges) {
      if (edge.source !== id) continue;
      rankById.set(edge.target, Math.max(rankById.get(edge.target) ?? 0, rank + 1));
    }
  }

  const layers = new Map<number, typeof template.nodes>();
  for (const node of template.nodes) {
    const rank = rankById.get(node.id) ?? 0;
    const layer = layers.get(rank) ?? [];
    layer.push(node);
    layers.set(rank, layer);
  }

  const positioned = new Map<string, { x: number; y: number }>();
  const ranks = [...layers.keys()].sort((a, b) => a - b);
  let column = 0;
  const maxRowsPerColumn = 4;

  ranks.forEach((rank) => {
    const layer = [...(layers.get(rank) ?? [])].sort((a, b) => {
      const byY = a.position.y - b.position.y;
      return byY || (sourceIndex.get(a.id) ?? 0) - (sourceIndex.get(b.id) ?? 0);
    });

    layer.forEach((node, index) => {
      const subcolumn = Math.floor(index / maxRowsPerColumn);
      const withinColumn = index % maxRowsPerColumn;
      const columnSize = Math.min(
        maxRowsPerColumn,
        layer.length - subcolumn * maxRowsPerColumn,
      );
      positioned.set(node.id, {
        x: column + subcolumn,
        y: withinColumn - (columnSize - 1) / 2,
      });
    });

    column += Math.max(1, Math.ceil(layer.length / maxRowsPerColumn));
  });

  return {
    ...template,
    nodes: template.nodes.map((node) => ({
      ...node,
      position: positioned.get(node.id) ?? node.position,
    })),
  };
}

export const LEAN_MONTAGE_WORKFLOWS: LeanMontageWorkflow[] = MONTAGE_WORKFLOWS.map(
  (workflow) => ({
    ...workflow,
    template: leanOutTemplate(workflow.template),
  }),
).map((workflow) => {
  const ranks = new Set(workflow.template.nodes.map((node) => node.position.x));
  const layerCounts = new Map<number, number>();
  workflow.template.nodes.forEach((node) => {
    layerCounts.set(node.position.x, (layerCounts.get(node.position.x) ?? 0) + 1);
  });
  const maxLayerSize = Math.max(1, ...layerCounts.values());

  return {
    ...workflow,
    // Cinematic cards are 520×142. Preserve approximately 100px horizontal
    // and 78px vertical air between neighbouring cards.
    canvasW: 728 + Math.max(0, ranks.size - 1) * 620,
    canvasH: 728 + Math.max(0, maxLayerSize - 1) * 220,
  };
});

/** The exact Mag 7 graph shown immediately after its composer prompt. */
export const PRODUCT_CUT_MAG7_WORKFLOW = LEAN_MONTAGE_WORKFLOWS[1];

/** Shared full-screen viewport used immediately before the product-shell dock. */
export const PRODUCT_CUT_MONTAGE_VIEWPORT = {
  left: 100,
  top: 28,
  width: 1720,
  height: 820,
} as const;
