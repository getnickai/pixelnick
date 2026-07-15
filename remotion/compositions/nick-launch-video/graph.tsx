/**
 * Landscape full-workflow graph renderer for the Nick launch video.
 *
 * Draws the ENTIRE workflow as full node cards (colored icon tile + type label +
 * node name) — the anatomy of a real NickAI builder node, not the icon-only
 * mini-canvas chip. The graph is laid out on a large VIRTUAL CANVAS (cw×ch);
 * a camera then maps a canvas point to the viewport centre at a chosen scale and
 * clips to the viewport, exactly like panning/zooming the real builder. So the
 * build animation opens zoomed-in on the first nodes (readable), then pulls the
 * camera back to reveal the whole graph. `nodeReveal`/`edgeReveal` (0..1 by id)
 * drive the build-in; both default to 1 (settled).
 */
import { Check } from "lucide-react";
import { edgePath, layoutGraph } from "../workflow-template-card/layout";
import { getGlyph } from "../workflow-template-card/node-glyphs";
import type { TemplateGraph, TemplateNodeData } from "../workflow-template-card/props";

export type Camera = {
  /** Zoom factor (1 = canvas px shown 1:1 in the viewport). */
  scale: number;
  /** Canvas-space point that lands at the viewport centre. */
  fx: number;
  fy: number;
};

export type RunStatus = "completed" | "running";
const RUN_GREEN = "#1fc16b";
const RUN_BLUE = "#2b7fff";

const NODE_W = 210;
const NODE_H = 66;

/** One workflow node, drawn like a real builder node: icon tile + labels. When
 *  `status` is set the node reads as executed (green + check) or running (blue). */
export function WorkflowNodeCard({ node, status }: { node: TemplateNodeData; status?: RunStatus }) {
  const g = getGlyph(node.type);
  const Icon = g.Icon;
  const tile = 42;
  const border = status === "completed" ? RUN_GREEN : status === "running" ? RUN_BLUE : g.border;
  const glow = status === "completed" ? RUN_GREEN : status === "running" ? RUN_BLUE : g.icon;
  return (
    <div
      style={{
        position: "relative",
        width: NODE_W,
        height: NODE_H,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "0 14px",
        borderRadius: 18,
        border: `2px solid ${border}`,
        backgroundColor: "#0f1216",
        boxShadow: `0 16px 44px -18px ${glow}66, inset 0 0 0 1px rgba(255,255,255,0.05)`,
      }}
    >
      {status === "completed" ? (
        <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: 999, backgroundColor: RUN_GREEN, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px #0f1216" }}>
          <Check size={13} color="#04140a" strokeWidth={3.5} />
        </div>
      ) : status === "running" ? (
        <div style={{ position: "absolute", top: -7, right: -7, width: 16, height: 16, borderRadius: 999, backgroundColor: RUN_BLUE, boxShadow: `0 0 0 3px #0f1216, 0 0 12px ${RUN_BLUE}` }} />
      ) : null}
      <div
        style={{
          width: tile,
          height: tile,
          flexShrink: 0,
          borderRadius: 12,
          backgroundColor: `${g.icon}22`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={24} color={g.icon} strokeWidth={2.3} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: g.icon,
          }}
        >
          {g.typeLabel}
        </div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            lineHeight: 1.15,
            color: "#fff",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {node.label}
        </div>
      </div>
    </div>
  );
}

function graphLayout(template: TemplateGraph, cw: number, ch: number) {
  return layoutGraph(template.nodes, { width: cw, height: ch, padding: Math.max(NODE_W, NODE_H) * 0.7 });
}

/** Camera that fits the whole canvas into the viewport (with margin). */
export function fitCamera(vw: number, vh: number, cw: number, ch: number, margin = 0.92): Camera {
  const scale = Math.min(vw / cw, vh / ch) * margin;
  return { scale, fx: cw / 2, fy: ch / 2 };
}

/** Camera focused on the centroid of the given node ids at a chosen scale. */
export function focusCamera(
  template: TemplateGraph,
  cw: number,
  ch: number,
  ids: string[],
  scale: number,
): Camera {
  const layout = graphLayout(template, cw, ch);
  const pts = ids.map((id) => layout.nodeById[id]).filter(Boolean);
  if (!pts.length) return { scale, fx: cw / 2, fy: ch / 2 };
  return {
    scale,
    fx: pts.reduce((a, p) => a + p.cx, 0) / pts.length,
    fy: pts.reduce((a, p) => a + p.cy, 0) / pts.length,
  };
}

export function WorkflowGraph({
  template,
  vw,
  vh,
  cw = 2600,
  ch = 1200,
  camera,
  nodeReveal,
  edgeReveal,
  statusById,
}: {
  template: TemplateGraph;
  /** Viewport (output) size. */
  vw: number;
  vh: number;
  /** Virtual canvas (layout) size. */
  cw?: number;
  ch?: number;
  camera?: Camera;
  nodeReveal?: Record<string, number>;
  edgeReveal?: Record<string, number>;
  statusById?: Record<string, RunStatus>;
}) {
  const layout = graphLayout(template, cw, ch);
  const cam = camera ?? fitCamera(vw, vh, cw, ch);
  const tx = vw / 2 - cam.fx * cam.scale;
  const ty = vh / 2 - cam.fy * cam.scale;

  return (
    <div style={{ position: "relative", width: vw, height: vh, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          width: cw,
          height: ch,
          transform: `translate(${tx}px, ${ty}px) scale(${cam.scale})`,
          transformOrigin: "0 0",
        }}
      >
        <svg width={cw} height={ch} style={{ position: "absolute", inset: 0, overflow: "visible" }} aria-hidden>
          {template.edges.map((e) => {
            const src = layout.nodeById[e.source];
            const tgt = layout.nodeById[e.target];
            if (!src || !tgt) return null;
            const reveal = edgeReveal?.[e.id] ?? 1;
            return (
              <path
                key={e.id}
                d={edgePath(src.cx, src.cy, tgt.cx, tgt.cy)}
                fill="none"
                stroke="rgba(255,255,255,0.20)"
                strokeWidth={2.5}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - reveal}
              />
            );
          })}
        </svg>
        {layout.nodes.map((n) => {
          const reveal = nodeReveal?.[n.id] ?? 1;
          return (
            <div
              key={n.id}
              style={{
                position: "absolute",
                left: n.cx - NODE_W / 2,
                top: n.cy - NODE_H / 2,
                opacity: reveal,
                transform: `scale(${0.7 + 0.3 * reveal})`,
                transformOrigin: "center center",
              }}
            >
              <WorkflowNodeCard node={n} status={statusById?.[n.id]} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
