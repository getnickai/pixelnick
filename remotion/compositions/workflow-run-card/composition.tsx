/**
 * Workflow Run Card: a workflow executing once, on the product's own node cards.
 *
 * Beats (frames in `timeline.ts`): fade in on Ready, the trigger runs, the
 * sources run in parallel, the final node runs, then Run complete with the
 * success banner. The run list under the graph mirrors each node's state at a
 * legible size. Chrome (glow, logo, pill, headline, CTA) matches
 * `WorkflowTemplateCardView` so the two formats read as one family.
 */
import { AbsoluteFill, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { ArrowUp, Check, CheckCircle2 } from "lucide-react";
import {
  CARD_H,
  CARD_W,
  COMPACT_H,
  COMPACT_W,
  CompactNodeCard,
  ExecIcon,
  HANDLE_Y,
  NodeTile,
  ProductNodeCard,
  START_D,
  StartNode,
  TOKENS,
} from "./product-node";
import { WRC_SIZE, isCompact, type RunNode, type WorkflowRunCardProps } from "./props";
import {
  WRC,
  WRC_HOOK,
  compactPlan,
  type NodeRunState,
  runState,
  sourceDoneFrame,
  sourceStartFrame,
} from "./timeline";

const asset = (name: string) => staticFile(`figma/${name}`);

/* ── Graph geometry, in canvas units (drawn at GRAPH_SCALE) ───────────────── */
/* ── Square stage: laid out at 960, scaled up to the 1080 output ──────────── */
const STAGE = 960;
const PAD = 56;
/** Graph (left column) and run list (right column) start here. */
const COL_TOP = 270;
const LEFT_W = 470;
const LIST_X = 548;
const LIST_W = STAGE - LIST_X - PAD;
/** Room for the run list; rows shrink (and outputs drop to one line) past ~7 rows. */
const LIST_AREA_H = 610;

const GRAPH_SCALE = 0.72;
const GRAPH_LEFT = PAD;
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

/* ── Compact layout (more than 3 sources or a middle node), drawn at COMPACT_SCALE ── */
const COMPACT_SCALE = 0.9;
const COMPACT_GAP = 5;
const COMPACT_SRC_X = 92;
const COMPACT_COL3_X = 326;
const compactColH = (n: number) => n * COMPACT_H + (n - 1) * COMPACT_GAP;

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

/** Trigger → a column of compact source cards → optional middle node → final node, as on the builder. */
function CompactGraph({
  trigger,
  sources,
  middle,
  final,
  states,
  frame,
  top,
}: {
  trigger: RunNode;
  sources: RunNode[];
  middle?: RunNode;
  final: RunNode;
  states: { trigger: NodeRunState; sources: NodeRunState[]; middle: NodeRunState; final: NodeRunState };
  frame: number;
  top: number;
}) {
  const colH = compactColH(sources.length);
  const mid = colH / 2;
  const srcY = (i: number) => i * (COMPACT_H + COMPACT_GAP);
  const middleY = middle ? mid - COMPACT_H - 26 : 0;
  const finalY = middle ? mid + 26 : mid - COMPACT_H / 2;
  const fanInY = (middle ? middleY : finalY) + COMPACT_H / 2;
  const col3Mid = COMPACT_COL3_X + COMPACT_W / 2;
  return (
    <div
      className="absolute"
      style={{ left: PAD, top, width: 522, height: colH, transform: `scale(${COMPACT_SCALE})`, transformOrigin: "top left" }}
    >
      <svg className="absolute inset-0 overflow-visible" width={522} height={colH} aria-hidden>
        {sources.map((_, i) => (
          <Edge
            key={`in-${i}`}
            d={edgePath(START_D + 4, mid, COMPACT_SRC_X, srcY(i) + COMPACT_H / 2)}
            state={states.sources[i]}
            frame={frame}
          />
        ))}
        {sources.map((_, i) => (
          <Edge
            key={`out-${i}`}
            d={edgePath(COMPACT_SRC_X + COMPACT_W, srcY(i) + COMPACT_H / 2, COMPACT_COL3_X, fanInY)}
            state={middle ? states.middle : states.final}
            frame={frame}
          />
        ))}
        {middle ? (
          <Edge d={`M ${col3Mid} ${middleY + COMPACT_H} L ${col3Mid} ${finalY}`} state={states.final} frame={frame} />
        ) : null}
      </svg>
      <div className="absolute" style={{ left: 0, top: mid - START_D / 2 }}>
        <StartNode node={trigger} state={states.trigger} frame={frame} />
      </div>
      {sources.map((node, i) => (
        <div key={node.title} className="absolute" style={{ left: COMPACT_SRC_X, top: srcY(i) }}>
          <CompactNodeCard node={node} state={states.sources[i]} frame={frame} />
        </div>
      ))}
      {middle ? (
        <div className="absolute" style={{ left: COMPACT_COL3_X, top: middleY }}>
          <CompactNodeCard node={middle} state={states.middle} frame={frame} />
        </div>
      ) : null}
      <div className="absolute" style={{ left: COMPACT_COL3_X, top: finalY }}>
        <CompactNodeCard node={final} state={states.final} frame={frame} />
      </div>
    </div>
  );
}

type StatusKind = "ready" | "running" | "complete";

const PILL: Record<StatusKind, { label: string; bg: string }> = {
  ready: { label: "Ready", bg: "rgba(1,120,255,0.55)" },
  running: { label: "Running", bg: TOKENS.primary },
  complete: { label: "Run complete", bg: "#00a63e" },
};

function RunRow({
  node,
  state,
  start,
  frame,
  height,
}: {
  node: Omit<RunNode, "value">;
  state: NodeRunState;
  start: number;
  frame: number;
  height: number;
}) {
  const t = interpolate(frame, [start, start + 8], [0, 1], clamp01);
  const done = state === "completed" && node.output;
  // Two lines for the output when the row has room, so real results don't truncate.
  const clamp = height >= 70 ? 2 : 1;
  return (
    <div
      className="absolute inset-x-0 flex items-center gap-3.5"
      style={{ height, opacity: t, transform: `translateY(${(1 - t) * 10}px)` }}
    >
      <NodeTile type={node.type} size={38} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[20px] font-semibold leading-[26px] text-white">{node.title}</div>
        <div
          className="overflow-hidden text-[16px] leading-5"
          style={{
            color: done ? TOKENS.success : TOKENS.textSub,
            fontWeight: done ? 500 : 400,
            display: "-webkit-box",
            WebkitBoxOrient: "vertical",
            WebkitLineClamp: clamp,
          }}
        >
          {done ? node.output : node.detail}
        </div>
      </div>
      <ExecIcon state={state} frame={frame} size={24} />
    </div>
  );
}

/** Optional opening: the hook in big type over the prompt being typed to Nick, then sent. */
function HookIntro({ hook, prompt }: { hook: string; prompt: string }) {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, 8], [0, 1], { ...clamp01, easing: Easing.bezier(0.23, 1, 0.32, 1) });
  const exit = interpolate(frame, [WRC_HOOK, WRC_HOOK + 12], [1, 0], clamp01);
  const typed = Math.floor(interpolate(frame, [12, 50], [0, prompt.length], clamp01));
  const sent = frame >= 80;
  const press = interpolate(frame, [76, 80, 84], [1, 0.94, 1], clamp01);
  // Longest word must fit the 784px inner width (~0.6em per capital); long hooks drop to 84px.
  const longest = Math.max(...hook.split(" ").map((w) => w.length));
  const size = Math.min(hook.length > 16 ? 84 : 112, Math.floor(760 / (0.6 * longest)));

  return (
    <AbsoluteFill className="bg-primary-1000 font-sans" style={{ opacity: exit }}>
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_42%,var(--color-primary-500)_0%,transparent_60%)]"
        style={{ opacity: 0.16 }}
        aria-hidden
      />
      <div className="absolute left-[56px] top-[52px] h-[30px] w-[140.211px]">
        <Img alt="NickAI" src={asset("logo.svg")} className="block size-full max-w-none" />
      </div>
      <div
        className="absolute left-[56px] right-[56px] top-1/2 rounded-[24px] border border-white/15 bg-white/[0.025] p-10"
        style={{ opacity: enter, transform: `translateY(-50%) scale(${0.97 + enter * 0.03})` }}
      >
        <p className="mb-6 text-[13px] font-semibold uppercase tracking-[0.16em] text-primary-300">Prompt to Nick</p>
        <h1
          className="font-heading font-bold uppercase leading-[0.95] tracking-[-0.045em] text-white"
          style={{ fontSize: size }}
        >
          {hook}
        </h1>
        <p className="mt-7 min-h-[86px] text-[34px] font-medium leading-[1.35] tracking-[-0.02em] text-zinc-200">
          {prompt.slice(0, typed)}
          <span
            className="ml-1 inline-block h-[29px] w-[3px] translate-y-1 bg-primary-400"
            style={{ opacity: !sent && (frame < 50 || Math.floor(frame / 9) % 2 === 0) ? 1 : 0 }}
          />
        </p>
        <div className="mt-6 flex justify-end">
          <div
            className="flex size-12 items-center justify-center rounded-full bg-primary-500 text-white"
            style={{ transform: `scale(${press})` }}
          >
            {sent ? <Check size={26} strokeWidth={2.5} /> : <ArrowUp size={26} strokeWidth={2.5} />}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/** With a `hook`, the intro plays first and the run starts WRC_HOOK frames later. */
export const WorkflowRunCardComposition: React.FC<WorkflowRunCardProps> = (props) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill className="bg-primary-1000">
      <div
        className="absolute left-0 top-0"
        style={{ width: STAGE, height: STAGE, transform: `scale(${WRC_SIZE[0] / STAGE})`, transformOrigin: "top left" }}
      >
        {props.hook ? (
          <>
            <Sequence from={WRC_HOOK}>
              <RunCard {...props} />
            </Sequence>
            {frame < WRC_HOOK + 12 && <HookIntro hook={props.hook} prompt={props.prompt ?? ""} />}
          </>
        ) : (
          <RunCard {...props} />
        )}
      </div>
    </AbsoluteFill>
  );
};

const RunCard: React.FC<WorkflowRunCardProps> = ({
  name,
  trigger,
  sources,
  final,
  middle,
  rows: logRows,
  cta,
  link,
}) => {
  const frame = useCurrentFrame();
  const compact = isCompact({ sources, middle });
  const plan = compact
    ? compactPlan(sources.length)
    : {
        triggerStart: WRC.triggerStart,
        triggerDone: WRC.triggerDone,
        sources: sources.map((_, i) => [sourceStartFrame(i), sourceDoneFrame(i)] as const),
        middle: null,
        final: [WRC.finalStart, WRC.finalDone] as const,
        complete: WRC.complete,
      };

  const triggerState = runState(frame, plan.triggerStart, plan.triggerDone);
  const sourceStates = plan.sources.map((w) => runState(frame, w[0], w[1]));
  const middleState = middle && plan.middle ? runState(frame, plan.middle[0], plan.middle[1]) : "idle";
  const finalState = runState(frame, plan.final[0], plan.final[1]);
  const status: StatusKind =
    frame >= plan.complete ? "complete" : frame >= plan.triggerStart ? "running" : "ready";

  const fade = interpolate(frame, WRC.fadeIn as unknown as number[], [0, 1], clamp01);
  const pillPop = (at: number) =>
    1 + 0.08 * Math.max(0, 1 - Math.abs(frame - at - 3) / 4);
  const pillScale = status === "complete" ? pillPop(plan.complete) : pillPop(plan.triggerStart);
  const banner = interpolate(frame, [plan.complete + 2, plan.complete + 12], [0, 1], clamp01);

  const startOut = { x: START_D, y: MID_HANDLE_Y };
  const finalIn = { x: FINAL_X, y: FINAL_TOP + HANDLE_Y };

  const groupState = (idx: number[]): NodeRunState =>
    idx.every((i) => sourceStates[i] === "completed")
      ? "completed"
      : idx.some((i) => sourceStates[i] !== "idle")
        ? "running"
        : "idle";
  const rows: { node: Omit<RunNode, "value">; state: NodeRunState; start: number }[] = logRows
    ? logRows.map((r) =>
        r.step === "trigger"
          ? { node: r, state: triggerState, start: plan.triggerStart }
          : r.step === "middle"
            ? { node: r, state: middleState, start: plan.middle ? plan.middle[0] : plan.final[0] }
            : r.step === "final"
              ? { node: r, state: finalState, start: plan.final[0] }
              : { node: r, state: groupState(r.step), start: plan.sources[r.step[0]][0] },
      )
    : [
        { node: trigger, state: triggerState, start: plan.triggerStart },
        ...sources.map((node, i) => ({ node, state: sourceStates[i], start: plan.sources[i][0] })),
        ...(middle && plan.middle ? [{ node: middle, state: middleState, start: plan.middle[0] }] : []),
        { node: final, state: finalState, start: plan.final[0] },
      ];
  const rowH = Math.min(76, Math.floor(LIST_AREA_H / rows.length));
  // Left block (graph + banner) is centred on the run list's height.
  const graphH = compact ? compactColH(sources.length) * COMPACT_SCALE : CANVAS_H * GRAPH_SCALE;
  const graphTop = COL_TOP + Math.max(0, (rowH * rows.length - graphH - 74) / 2);
  const bannerTop = graphTop + graphH + 28;
  const nodeCount = sources.length + (middle ? 3 : 2);

  return (
    <AbsoluteFill className="overflow-clip bg-primary-1000 font-sans">
      <AbsoluteFill style={{ opacity: fade }}>
        {/* Brand glow, as on the template card. */}
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_42%,var(--color-primary-500)_0%,transparent_60%)]"
          style={{ opacity: 0.16 }}
          aria-hidden
        />
        <div className="pointer-events-none absolute left-[-115px] top-[-123px] h-[1206px] w-[1191.312px] opacity-90" aria-hidden>
          <div className="-scale-y-100">
            <div className="absolute inset-[-41.01%_-41.51%]">
              <Img alt="" src={asset("background-glow.svg")} className="block size-full max-w-none" />
            </div>
          </div>
        </div>

        {/* Logo */}
        <div className="absolute left-[56px] top-[52px] h-[30px] w-[140.211px]">
          <Img alt="NickAI" src={asset("logo.svg")} className="block size-full max-w-none" />
        </div>

        {/* Status pill + headline */}
        <div className="absolute left-[56px] right-[56px] top-[116px] flex flex-col gap-4">
          <div
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-full px-3.5 py-1.5"
            style={{ backgroundColor: PILL[status].bg, transform: `scale(${pillScale})`, transformOrigin: "left center" }}
          >
            <span className="size-2 rounded-full bg-white" />
            <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-white">{PILL[status].label}</span>
          </div>
          <h1 className="font-heading text-[44px] font-semibold leading-[1.1] text-white">{name}</h1>
        </div>

        {compact ? (
          <CompactGraph
            trigger={trigger}
            sources={sources}
            middle={middle}
            final={final}
            states={{ trigger: triggerState, sources: sourceStates, middle: middleState, final: finalState }}
            frame={frame}
            top={graphTop}
          />
        ) : (
          <>
        {/* Canvas: the product's node cards, wired as on the builder. */}
        <div
          className="absolute"
          style={{
            left: GRAPH_LEFT,
            top: graphTop,
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

          </>
        )}

        {/* Run list (right column) */}
        <div className="absolute" style={{ left: LIST_X, width: LIST_W, top: COL_TOP }}>
          {rows.map((r, i) => (
            <div key={r.node.title} className="absolute inset-x-0" style={{ top: i * rowH }}>
              <RunRow node={r.node} state={r.state} start={r.start} frame={frame} height={rowH} />
            </div>
          ))}
        </div>

        {/* Success banner */}
        <div
          className="absolute flex items-center justify-between rounded-xl px-4"
          style={{
            left: PAD,
            width: LEFT_W,
            top: bannerTop,
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
        <div className="absolute bottom-[52px] left-[56px] z-10" style={{ width: LEFT_W }}>
          {link && (
            <p className="mb-2 break-all text-[15px] font-medium leading-5 text-primary-300" style={{ opacity: banner }}>
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
