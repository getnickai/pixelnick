/**
 * Workflow Run Card: a workflow executing once, on the product's own node cards.
 *
 * Beats (frames in `timeline.ts`): fade in on Ready, the trigger runs, the
 * sources run in parallel, the final node runs, then Run complete with the
 * success banner. The run list under the graph mirrors each node's state at a
 * legible size. Chrome (glow, logo, pill, headline, CTA) matches
 * `WorkflowTemplateCardView` so the two formats read as one family.
 */
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { CheckCircle2 } from "lucide-react";
import {
  CARD_H,
  CARD_W,
  ExecIcon,
  HANDLE_Y,
  NodeTile,
  ProductNodeCard,
  START_D,
  StartNode,
  TOKENS,
} from "./product-node";
import type { RunNode, WorkflowRunCardProps } from "./props";
import {
  WRC,
  type NodeRunState,
  runState,
  sourceDoneFrame,
  sourceStartFrame,
} from "./timeline";

const asset = (name: string) => staticFile(`figma/${name}`);

/* ── Graph geometry, in canvas units (drawn at GRAPH_SCALE) ───────────────── */
const GRAPH_SCALE = 0.9;
const GRAPH_LEFT = 32;
const GRAPH_TOP = 306;
const CANVAS_W = 651;
const SOURCE_X = 117;
const FINAL_X = CANVAS_W - CARD_W;
const SOURCE_GAP = 15;
const sourceTop = (i: number) => i * (CARD_H + SOURCE_GAP);
/** The trigger and final node sit on the middle source's handle line. */
const MID_HANDLE_Y = sourceTop(1) + HANDLE_Y;
const START_TOP = MID_HANDLE_Y - START_D / 2;
const FINAL_TOP = sourceTop(1);
const CANVAS_H = sourceTop(2) + CARD_H;

/* ── Run list ─────────────────────────────────────────────────────────────── */
const LIST_TOP = 650;
const ROW_H = 56;
const BANNER_TOP = LIST_TOP + ROW_H * 5 + 14;

const clamp01 = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

/** React Flow's default bezier between two handles. */
function edgePath(sx: number, sy: number, tx: number, ty: number): string {
  const dx = Math.max(Math.abs(tx - sx) * 0.5, 24);
  return `M ${sx} ${sy} C ${sx + dx} ${sy}, ${tx - dx} ${ty}, ${tx} ${ty}`;
}

function Edge({ d, state, frame }: { d: string; state: NodeRunState; frame: number }) {
  const color =
    state === "completed" ? TOKENS.success : state === "running" ? TOKENS.primary : "rgba(255,255,255,0.16)";
  return (
    <g>
      {state === "running" ? (
        <path d={d} fill="none" stroke={TOKENS.primary} strokeWidth={8} strokeOpacity={0.18} />
      ) : null}
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={state === "running" ? "6 6" : undefined}
        strokeDashoffset={state === "running" ? -frame * 1.2 : undefined}
      />
    </g>
  );
}

type StatusKind = "ready" | "running" | "complete";

const PILL: Record<StatusKind, { label: string; bg: string }> = {
  ready: { label: "Ready", bg: "rgba(1,120,255,0.55)" },
  running: { label: "Running", bg: TOKENS.primary },
  complete: { label: "Run complete", bg: "#00a63e" },
};

function RunRow({ node, state, start, frame }: { node: RunNode; state: NodeRunState; start: number; frame: number }) {
  const t = interpolate(frame, [start, start + 8], [0, 1], clamp01);
  return (
    <div
      className="absolute left-16 right-16 flex items-center gap-4"
      style={{ height: ROW_H, opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}
    >
      <NodeTile type={node.type} size={36} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[19px] font-semibold leading-6 text-white">{node.title}</div>
        {state === "completed" && node.output ? (
          <div className="truncate text-[14px] font-medium leading-5" style={{ color: TOKENS.success }}>
            {node.output}
          </div>
        ) : (
          <div className="truncate text-[14px] leading-5" style={{ color: TOKENS.textSub }}>
            {node.detail}
          </div>
        )}
      </div>
      <ExecIcon state={state} frame={frame} size={24} />
    </div>
  );
}

export const WorkflowRunCardComposition: React.FC<WorkflowRunCardProps> = ({
  name,
  trigger,
  sources,
  final,
  cta,
  link,
}) => {
  const frame = useCurrentFrame();

  const triggerState = runState(frame, WRC.triggerStart, WRC.triggerDone);
  const sourceStates = sources.map((_, i) => runState(frame, sourceStartFrame(i), sourceDoneFrame(i)));
  const finalState = runState(frame, WRC.finalStart, WRC.finalDone);
  const status: StatusKind =
    frame >= WRC.complete ? "complete" : frame >= WRC.triggerStart ? "running" : "ready";

  const fade = interpolate(frame, WRC.fadeIn as unknown as number[], [0, 1], clamp01);
  const pillPop = (at: number) =>
    1 + 0.08 * Math.max(0, 1 - Math.abs(frame - at - 3) / 4);
  const pillScale = status === "complete" ? pillPop(WRC.complete) : pillPop(WRC.triggerStart);
  const banner = interpolate(frame, [WRC.complete + 2, WRC.complete + 12], [0, 1], clamp01);

  const startOut = { x: START_D, y: MID_HANDLE_Y };
  const finalIn = { x: FINAL_X, y: FINAL_TOP + HANDLE_Y };

  const rows: { node: RunNode; state: NodeRunState; start: number }[] = [
    { node: trigger, state: triggerState, start: WRC.triggerStart },
    ...sources.map((node, i) => ({ node, state: sourceStates[i], start: sourceStartFrame(i) })),
    { node: final, state: finalState, start: WRC.finalStart },
  ];
  const nodeCount = rows.length;

  return (
    <AbsoluteFill className="overflow-clip bg-primary-1000 font-sans">
      <AbsoluteFill style={{ opacity: fade }}>
        {/* Brand glow, as on the template card. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_42%,var(--color-primary-500)_0%,transparent_60%)]"
          style={{ opacity: 0.16 }}
          aria-hidden
        />
        <div className="pointer-events-none absolute left-[-314.95px] top-[195.5px] h-[1206px] w-[1191.312px] opacity-90" aria-hidden>
          <div className="-scale-y-100">
            <div className="absolute inset-[-41.01%_-41.51%]">
              <Img alt="" src={asset("background-glow.svg")} className="block size-full max-w-none" />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="absolute left-16 top-[63px] h-[30px] w-[140.211px]">
          <Img alt="NickAI" src={asset("logo.svg")} className="block size-full max-w-none" />
        </div>

        {/* Status pill + headline */}
        <div className="absolute left-16 right-16 top-[140px] flex flex-col gap-4">
          <div
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full px-3.5 py-1.5"
            style={{ backgroundColor: PILL[status].bg, transform: `scale(${pillScale})`, transformOrigin: "left center" }}
          >
            <span className="size-2 rounded-full bg-white" />
            <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-white">{PILL[status].label}</span>
          </div>
          <h1 className="font-heading text-[40px] font-semibold leading-[1.1] text-white">{name}</h1>
        </div>

        {/* Canvas: the product's node cards, wired as on the builder. */}
        <div
          className="absolute"
          style={{
            left: GRAPH_LEFT,
            top: GRAPH_TOP,
            width: CANVAS_W,
            height: CANVAS_H,
            transform: `scale(${GRAPH_SCALE})`,
            transformOrigin: "top left",
          }}
        >
          <svg className="absolute inset-0 overflow-visible" width={CANVAS_W} height={CANVAS_H} aria-hidden>
            {sources.map((_, i) => (
              <Edge
                key={`in-${i}`}
                d={edgePath(startOut.x, startOut.y, SOURCE_X, sourceTop(i) + HANDLE_Y)}
                state={sourceStates[i]}
                frame={frame}
              />
            ))}
            {sources.map((_, i) => (
              <Edge
                key={`out-${i}`}
                d={edgePath(SOURCE_X + CARD_W, sourceTop(i) + HANDLE_Y, finalIn.x, finalIn.y)}
                state={finalState}
                frame={frame}
              />
            ))}
          </svg>

          <div className="absolute" style={{ left: 0, top: START_TOP }}>
            <StartNode node={trigger} state={triggerState} frame={frame} />
          </div>
          {sources.map((node, i) => (
            <div key={node.title} className="absolute" style={{ left: SOURCE_X, top: sourceTop(i) }}>
              <ProductNodeCard node={node} state={sourceStates[i]} frame={frame} />
            </div>
          ))}
          <div className="absolute" style={{ left: FINAL_X, top: FINAL_TOP }}>
            <ProductNodeCard node={final} state={finalState} frame={frame} />
          </div>
        </div>

        {/* Run list */}
        <div className="absolute inset-x-0" style={{ top: LIST_TOP }}>
          {rows.map((r, i) => (
            <div key={r.node.title} className="absolute inset-x-0" style={{ top: i * ROW_H }}>
              <RunRow node={r.node} state={r.state} start={r.start} frame={frame} />
            </div>
          ))}
        </div>

        {/* Success banner */}
        <div
          className="absolute left-16 right-16 flex items-center justify-between rounded-xl px-4"
          style={{
            top: BANNER_TOP,
            height: 46,
            opacity: banner,
            transform: `translateY(${(1 - banner) * 12}px)`,
            backgroundColor: "rgba(0,166,62,0.08)",
            border: "1px solid rgba(0,166,62,0.4)",
          }}
        >
          <span className="flex items-center gap-3 text-[16px] font-semibold text-white">
            <CheckCircle2 size={20} color={TOKENS.success} strokeWidth={2.2} />
            Workflow executed successfully
          </span>
          <span className="text-[14px]" style={{ color: TOKENS.textSub }}>
            {nodeCount} of {nodeCount} nodes
          </span>
        </div>

        {/* CTA, as on the template card. */}
        <div className="absolute bottom-[45px] left-16 z-10 w-[520px]">
          {link && (
            <p className="mb-2 break-all text-[13px] font-medium leading-4 text-primary-300" style={{ opacity: banner }}>
              {link.replace(/^https?:\/\//, "")}
            </p>
          )}
          <div className="flex items-stretch">
            <div className="relative h-[56px] w-[46px] shrink-0 rotate-180">
              <Img alt="" src={asset("cta-tab.svg")} className="absolute inset-0 block size-full max-w-none" />
            </div>
            <div
              className="relative -ml-[2px] flex flex-1 items-center justify-center gap-[9px] rounded-r-[12px] px-4 text-white"
              style={{ backgroundColor: "#0178FF" }}
            >
              <p className="whitespace-nowrap text-[18px] font-semibold leading-[1.2]">{cta}</p>
              <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M13 18L19 12L13 6M18.5 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
