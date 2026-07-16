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

/** Node card design. `compact` = our icon-tile + type + name (scaled up for
 *  readability). `rich` = Onur's second-20 look: title + colored type badge +
 *  a one-line subtitle. Both draw inside the same camera engine. */
export type NodeVariant = "compact" | "rich" | "cinematic";
const NODE_DIMS: Record<NodeVariant, { w: number; h: number }> = {
  compact: { w: 300, h: 96 },
  rich: { w: 392, h: 120 },
  cinematic: { w: 520, h: 142 },
};
export const nodeDims = (variant: NodeVariant = "compact") => NODE_DIMS[variant];

/** One workflow node, drawn like a real builder node. When `status` is set the
 *  node reads as executed (green + check) or running (blue). */
export function WorkflowNodeCard({
  node,
  status,
  variant = "compact",
}: {
  node: TemplateNodeData;
  status?: RunStatus;
  variant?: NodeVariant;
}) {
  const g = getGlyph(node.type);
  const Icon = g.Icon;
  const { w, h } = NODE_DIMS[variant];
  const border = status === "completed" ? RUN_GREEN : status === "running" ? RUN_BLUE : g.border;
  const glow = status === "completed" ? RUN_GREEN : status === "running" ? RUN_BLUE : g.icon;

  const StatusBadge =
    status === "completed" ? (
      <div style={{ position: "absolute", top: -8, right: -8, width: 22, height: 22, borderRadius: 999, backgroundColor: RUN_GREEN, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 3px #0f1216" }}>
        <Check size={14} color="#04140a" strokeWidth={3.5} />
      </div>
    ) : status === "running" ? (
      <div style={{ position: "absolute", top: -7, right: -7, width: 17, height: 17, borderRadius: 999, backgroundColor: RUN_BLUE, boxShadow: `0 0 0 3px #0f1216, 0 0 12px ${RUN_BLUE}` }} />
    ) : null;

  const shell: React.CSSProperties = {
    position: "relative",
    width: w,
    height: h,
    borderRadius: 20,
    border: `2px solid ${border}`,
    backgroundColor: "#0f1216",
    boxShadow: `0 16px 44px -18px ${glow}66, inset 0 0 0 1px rgba(255,255,255,0.05)`,
  };

  if (variant === "cinematic") {
    const cinematicShell: React.CSSProperties = {
      ...shell,
      borderRadius: 28,
      border: `2px solid ${status ? border : "#242832"}`,
      backgroundColor: "#05070b",
      boxShadow: status
        ? `0 18px 42px -22px ${glow}80`
        : "0 20px 45px rgba(0, 0, 0, 0.22)",
      padding: "28px 34px 24px",
    };

    return (
      <div style={cinematicShell}>
        {StatusBadge}
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: -10,
            top: "50%",
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#626673",
            transform: "translateY(-50%)",
          }}
        />
        <span
          aria-hidden
          style={{
            position: "absolute",
            right: -10,
            top: "50%",
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#626673",
            transform: "translateY(-50%)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 18,
          }}
        >
          <div
            style={{
              minWidth: 0,
              overflow: "hidden",
              color: "#fafafa",
              fontSize: 32,
              fontWeight: 600,
              lineHeight: 1.2,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {node.label}
          </div>
          <span
            style={{
              flexShrink: 0,
              padding: "8px 14px",
              borderRadius: 13,
              color: g.icon,
              backgroundColor: `${g.icon}20`,
              fontSize: 18,
              fontWeight: 650,
              lineHeight: 1,
              letterSpacing: 0.3,
              textTransform: "uppercase",
            }}
          >
            {g.typeLabel}
          </span>
        </div>
        {node.subtitle ? (
          <div
            style={{
              marginTop: 22,
              overflow: "hidden",
              color: "#777985",
              fontSize: 25,
              fontWeight: 500,
              lineHeight: 1,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {node.subtitle}
          </div>
        ) : null}
      </div>
    );
  }

  if (variant === "rich") {
    const tile = 54;
    // Badge sits ABOVE the title on its own row so the node name always gets the
    // full card width (no truncation from a same-row badge).
    return (
      <div style={{ ...shell, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
        {StatusBadge}
        <div style={{ width: tile, height: tile, flexShrink: 0, borderRadius: 14, backgroundColor: `${g.icon}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={28} color={g.icon} strokeWidth={2.3} />
        </div>
        <div style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
          <span style={{ alignSelf: "flex-start", padding: "3px 9px", borderRadius: 999, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: g.icon, backgroundColor: `${g.icon}1f` }}>{g.typeLabel}</span>
          <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.1, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.label}</div>
          {node.subtitle ? (
            <div style={{ fontSize: 13, fontWeight: 500, color: "#8b93a2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.subtitle}</div>
          ) : null}
        </div>
      </div>
    );
  }

  // compact
  const tile = 56;
  return (
    <div style={{ ...shell, display: "flex", alignItems: "center", gap: 14, padding: "0 18px" }}>
      {StatusBadge}
      <div style={{ width: tile, height: tile, flexShrink: 0, borderRadius: 14, backgroundColor: `${g.icon}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={30} color={g.icon} strokeWidth={2.3} />
      </div>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: g.icon }}>{g.typeLabel}</div>
        <div style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.15, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{node.label}</div>
      </div>
    </div>
  );
}

function graphLayout(template: TemplateGraph, cw: number, ch: number, variant: NodeVariant = "compact") {
  const { w, h } = NODE_DIMS[variant];
  return layoutGraph(template.nodes, { width: cw, height: ch, padding: Math.max(w, h) * 0.7 });
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
  variant: NodeVariant = "compact",
): Camera {
  const layout = graphLayout(template, cw, ch, variant);
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
  cw = 3600,
  ch = 1700,
  camera,
  nodeReveal,
  edgeReveal,
  statusById,
  nodeVariant = "rich",
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
  nodeVariant?: NodeVariant;
}) {
  const layout = graphLayout(template, cw, ch, nodeVariant);
  const { w: NW, h: NH } = nodeDims(nodeVariant);
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
                d={edgePath(
                  src.cx + NW / 2,
                  src.cy,
                  tgt.cx - NW / 2,
                  tgt.cy,
                )}
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
          const visibleReveal = Math.max(0, Math.min(1, reveal));
          const entranceScale =
            nodeVariant === "cinematic"
              ? 0.955 + 0.045 * reveal
              : 0.7 + 0.3 * reveal;
          const entranceY =
            nodeVariant === "cinematic" ? (1 - reveal) * 24 : 0;
          return (
            <div
              key={n.id}
              style={{
                position: "absolute",
                left: n.cx - NW / 2,
                top: n.cy - NH / 2,
                opacity: visibleReveal,
                filter:
                  nodeVariant === "cinematic" && visibleReveal < 1
                    ? `blur(${(1 - visibleReveal) * 5}px)`
                    : undefined,
                transform: `translateY(${entranceY}px) scale(${entranceScale})`,
                transformOrigin: "center center",
              }}
            >
              <WorkflowNodeCard node={n} status={statusById?.[n.id]} variant={nodeVariant} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
