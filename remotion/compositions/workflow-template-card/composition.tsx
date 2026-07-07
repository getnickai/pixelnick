/**
 * Workflow Template Card — animated composition.
 *
 * Beats (see `timeline.ts` for exact frames):
 *   1. Prompt   — Nick-style chat input centre, caret blink, first-person prompt
 *                 types in (text + blue send button on one row).
 *   2. Lift     — chat box + "Nick is thinking…" under it spring up together.
 *   3. Building — status becomes "Nick is building…" when the conveyor starts.
 *   4. Ready    — "Nick is ready to execute"; mini-canvas fades in underneath.
 *   5. Conveyor — hero node cards pop centre in topological order, then slide
 *                 left, dim to ~30% and spill off-frame as the next arrives.
 *                 Pacing accelerates (accelerando) so long graphs still fit.
 *
 * The zoom-out payoff (settled graph + description + CTA) lands in CP3 by
 * revealing the `WorkflowTemplateCardView` base layer that renders underneath.
 */
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ArrowUp, Check, Settings, ShieldCheck } from "lucide-react";
// Relative imports: this file is bundled by Remotion's webpack, which doesn't
// resolve the "@/" alias.
import {
  SETTLED_ANIM,
  WorkflowTemplateCardView,
  type WorkflowTemplateCardAnim,
} from "../../../components/workflow-template-card-view";
import { getGlyph } from "./node-glyphs";
import { topoOrder } from "./layout";
import type { TemplateNodeData, WorkflowTemplateCardProps } from "./props";
import {
  WTC_ANIM,
  toolsCalledFor,
  wtcLastHeroIndex,
  wtcNodeArrival,
  wtcZoomWindow,
} from "./timeline";

/* ── Conveyor geometry (portrait 650×1136) ───────────────────────────────── */
const HERO_W = 404;
const HERO_H = 116;
const SLOT = 414; // horizontal spacing → previous card spills to ~30% visible
const CONV_Y = 600; // conveyor centreline
const GRAPH_CENTER_Y = 510; // settled mini-canvas centre (View graph: top 360, h 300)

/* ── Intro geometry (Nick app chat input) ─────────────────────────────────── */
const BOX_W = 520;
const BOX_H = 64;
const SEND = 40;
const BOX_CY = 430;
const HEAD_LEFT = 64;
const HEAD_TOP = 190;
const STATUS_GAP = 14;
const STATUS_H = 30; // status text line height
const TOOLROW_GAP = 12; // gap: status text → tool-call row
const TOOLROW_H = 40; // tool-call row height (persists into the settle)
/** Tool-call row sits under the status line; both lift with the chat box. */
const toolRowTopFor = (statusTop: number) => statusTop + STATUS_H + TOOLROW_GAP;
/** Payoff layout — graph + copy tuck under the chat box + status + tool row. */
const END_GRAPH_TOP =
  HEAD_TOP + BOX_H + STATUS_GAP + STATUS_H + TOOLROW_GAP + TOOLROW_H + 24;
const END_META_TOP = END_GRAPH_TOP + 300 + 24;
const END_DESC_TOP = END_META_TOP + 86;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/* ── Tool-call reel ───────────────────────────────────────────────────────── */
const CHIP_H = 52; // height of one "1 tool call" chip (the reel viewport)

/** One completed tool call: cog + "1 tool call" left, green Completed chip right.
    Identical every cycle — the reel makes them stream past like live activity. */
function ToolChip() {
  return (
    <div
      className="flex items-center justify-between rounded-xl border border-zinc-800 px-4"
      style={{ height: CHIP_H, backgroundColor: "rgba(15,18,20,0.85)" }}
    >
      <span className="flex items-center gap-3 font-sans text-[19px] font-medium text-white">
        <Settings size={18} color="#a1a1aa" strokeWidth={2} aria-hidden />
        <span>1 tool call</span>
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2.5 py-1 text-[14px] font-semibold text-green-400">
        <Check size={14} strokeWidth={3} aria-hidden />
        Completed
      </span>
    </div>
  );
}

/** Final reel chip: the workflow passed validation. Green check icon left,
    "Workflow validated" + a green "Ready" chip right. Rests at the settle. */
function ValidatedChip() {
  return (
    <div
      className="flex items-center justify-between rounded-xl border px-4"
      style={{ height: CHIP_H, backgroundColor: "rgba(15,18,20,0.85)", borderColor: "rgba(0,201,80,0.4)" }}
    >
      <span className="flex items-center gap-3 font-sans text-[19px] font-medium text-white">
        <ShieldCheck size={20} color="#00c950" strokeWidth={2.2} aria-hidden />
        <span>Workflow validated</span>
      </span>
      <span className="inline-flex items-center gap-1 rounded-md bg-green-500/15 px-2.5 py-1 text-[14px] font-semibold text-green-400">
        <Check size={14} strokeWidth={3} aria-hidden />
        Ready
      </span>
    </div>
  );
}

/** Opacity as a function of the node's fractional slot offset `r = index − a`. */
function slotOpacity(r: number): number {
  if (r >= 0) {
    // Upcoming/arriving: fades in over the last 0.55 slot into centre.
    return clamp((0.55 - r) / 0.55, 0, 1);
  }
  // Past: dims 1 → 0.3 across one slot, then fades out as it leaves frame.
  const dim = clamp(1 + r * 0.7, 0.3, 1);
  const fade = clamp((r + 1.9) / 0.9, 0, 1);
  return dim * fade;
}

/** Scale as a function of slot offset — centre is largest. */
function slotScale(r: number): number {
  return 1 - Math.min(Math.abs(r), 1) * 0.16;
}

/**
 * Fractional "active" index over time, eased between arrivals (accelerando).
 * `firstDwell` holds the belt pinned on node 0 for that many frames after it
 * arrives, so the opening node truly sits centre before the conveyor eases it
 * away (a real highlight, not just a slower drift).
 */
function activeIndex(frame: number, arrivals: number[], firstDwell = 0): number {
  const n = arrivals.length;
  if (n === 0) return 0;
  if (frame <= arrivals[0]) return 0;
  for (let k = 0; k < n - 1; k++) {
    if (frame < arrivals[k + 1]) {
      const start = k === 0 ? arrivals[0] + firstDwell : arrivals[k];
      if (frame <= start) return k; // dwell: hold on node k
      const raw = (frame - start) / (arrivals[k + 1] - start);
      return k + raw * raw * (3 - 2 * raw); // smoothstep
    }
  }
  return n - 1;
}

/** Editor-style hero card: colored icon tile + type label + node label. */
function HeroCard({ node }: { node: TemplateNodeData }) {
  const g = getGlyph(node.type);
  const Icon = g.Icon;
  return (
    <div
      className="flex h-full w-full items-center gap-4 rounded-2xl border-[3px] px-5"
      style={{
        borderColor: g.border,
        backgroundColor: "#0F1214",
        boxShadow: `0 24px 70px -18px ${g.icon}66, inset 0 0 0 1px rgba(255,255,255,0.04)`,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-center rounded-xl"
        style={{ width: 64, height: 64, backgroundColor: `${g.icon}24` }}
      >
        <Icon size={34} color={g.icon} strokeWidth={2.3} />
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-[11px] font-semibold uppercase tracking-[0.14em]"
          style={{ color: g.icon }}
        >
          {g.typeLabel}
        </div>
        <div className="truncate font-sans text-[25px] font-semibold leading-tight text-white">
          {node.label}
        </div>
        {node.subtitle ? (
          <div className="truncate text-[15px] leading-tight text-zinc-400">{node.subtitle}</div>
        ) : null}
      </div>
    </div>
  );
}

export const WorkflowTemplateCardComposition: React.FC<WorkflowTemplateCardProps> = (props) => {
  const frame = useCurrentFrame();
  const { width, durationInFrames } = useVideoConfig();
  const { template } = props;
  const centerX = width / 2;

  /* ── Conveyor order + timeline ─────────────────────────────────────────── */
  const byId = new Map(template.nodes.map((n) => [n.id, n] as const));
  const ordered = topoOrder(template.nodes, template.edges)
    .map((id) => byId.get(id))
    .filter((n): n is TemplateNodeData => Boolean(n));
  const arrivals = ordered.map((_, k) => wtcNodeArrival(k));
  // Belt stops at the last hero node; the final node is revealed by the
  // zoom-out (inside the mini-canvas), never as its own centred card.
  const lastHero = wtcLastHeroIndex(ordered.length);
  const a = Math.min(activeIndex(frame, arrivals, WTC_ANIM.firstHold), lastHero);
  const conveyorGate = clamp((frame - WTC_ANIM.conveyorStart + 2) / 10, 0, 1);
  const finalTools = toolsCalledFor(template.nodes.length);

  /* ── Zoom-out: conveyor recedes → settled mini-canvas poster ───────────── */
  const [zs, ze] = wtcZoomWindow(ordered.length);
  const zoomP = interpolate(frame, [zs, ze], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const conveyorOpacity = interpolate(zoomP, [0, 0.5], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const conveyorScale = interpolate(zoomP, [0, 0.7], [1, 0.45], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // Keep the belt sliding left as it recedes, so the accelerando flows straight
  // into the pull-back instead of parking on the final card.
  const conveyorDrift = interpolate(zoomP, [0, 1], [0, SLOT * 0.7], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ── Tool-call reel — identical "1 tool call" chips stream up. Cadence is an
        accelerando over the build (slow first, faster later) to match the node
        conveyor; ~half as many cycles as calls. Rests on a chip once settled. */
  const toolCycles = Math.max(1, Math.ceil(finalTools / 2));
  const reelT = clamp((frame - WTC_ANIM.conveyorStart) / (zs - WTC_ANIM.conveyorStart), 0, 1);
  const reelPhase = toolCycles * reelT ** 1.8;
  const reelFrac = reelPhase - Math.floor(reelPhase);
  const reelSlideRaw = clamp((reelFrac - 0.6) / 0.4, 0, 1); // dwell, then quick slide
  const reelSlide = reelT >= 1 ? 0 : reelSlideRaw * reelSlideRaw * (3 - 2 * reelSlideRaw);
  // Once the reel reaches its final cycle, the chip rising from below is the
  // "Workflow validated" chip; it lands and rests through the settle.
  const reelAtRest = reelT >= 1;
  const reelFinalCycle = reelPhase >= toolCycles - 1;
  // "Click" pop as the validated chip lands (at zs): quick press-in, then a
  // slight overshoot back, with a green glow flash — makes it stand out.
  const validateClick = interpolate(frame, [zs, zs + 3, zs + 11, zs + 18], [1, 0.93, 1.03, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const validateGlow = interpolate(frame, [zs, zs + 2, zs + 26], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  /* ── Phase scalars ─────────────────────────────────────────────────────── */
  const liftP = interpolate(frame, WTC_ANIM.lift, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const boxIntroOpacity = interpolate(frame, WTC_ANIM.boxIn, [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const promptLen = template.prompt.length;
  const typedCount = Math.round(
    interpolate(frame, WTC_ANIM.typing, [0, promptLen], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  const typed = template.prompt.slice(0, clamp(typedCount, 0, promptLen));
  const caretVisible =
    frame < WTC_ANIM.typing[1] && frame < WTC_ANIM.lift[0] && Math.floor(frame / 9) % 2 === 0;

  const [sendClickStart, sendClickEnd] = WTC_ANIM.sendClick;
  const sendScale = interpolate(
    frame,
    [sendClickStart, sendClickStart + 5, sendClickEnd],
    [1, 1.22, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );

  const statusDots = ".".repeat((Math.floor(frame / 10) % 3) + 1);

  // Whole chat box lifts centre → headline slot (chrome stays intact).
  const boxLeftStart = centerX - BOX_W / 2;
  const boxTopStart = BOX_CY - BOX_H / 2;
  const boxLeftEnd = HEAD_LEFT;
  const boxTopEnd = HEAD_TOP;
  const boxLeft = interpolate(liftP, [0, 1], [boxLeftStart, boxLeftEnd]);
  const boxTop = interpolate(liftP, [0, 1], [boxTopStart, boxTopEnd]);
  const statusTop = boxTop + BOX_H + STATUS_GAP;
  const statusLeft = boxLeft;

  /* ── Base chrome (logo, glow, green pill) via the shared view ──────────── */
  const baseAnim: WorkflowTemplateCardAnim = {
    ...SETTLED_ANIM,
    glowOpacity: interpolate(frame, [0, 24], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    agentIllustrationOpacity: interpolate(frame, [0, 30], [0, 0.1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    logoOpacity: interpolate(frame, WTC_ANIM.logoIn, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    logoY: interpolate(frame, WTC_ANIM.logoIn, [-16, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    pillOpacity: interpolate(frame, [zs, zs + 14], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    pillScale: interpolate(frame, [zs, zs + 14], [0.85, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.back(2)),
    }),
    // Payoff: mini-canvas + Nick-voice description appear under the chat box.
    // Template name headline stays hidden — the prompt box is the hero.
    headlineOpacity: 0,
    headlineY: 0,
    showHeadline: false,
    nickVoice: true,
    graphTop: END_GRAPH_TOP,
    descriptionTop: END_DESC_TOP,
    metaTop: END_META_TOP,
    graphOpacity: interpolate(zoomP, [0.12, 0.75], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    graphScale: interpolate(zoomP, [0.12, 0.85], [0.86, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
    descriptionOpacity: interpolate(zoomP, [0.5, 0.95], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    metaOpacity: interpolate(zoomP, [0.55, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    ctaOpacity: interpolate(zoomP, [0.68, 1], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
    graphInsetRight: interpolate(frame, [zs + 8, ze], [100, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  };

  const boxOpacity = boxIntroOpacity;
  const promptInBox = frame >= WTC_ANIM.typing[1] ? template.prompt : typed;

  const statusOpacity = interpolate(
    frame,
    [WTC_ANIM.statusIn + 4, WTC_ANIM.statusIn + 14],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  const statusLabel =
    frame >= zs
      ? "Nick is ready to execute your strategy"
      : frame >= WTC_ANIM.conveyorStart
        ? `Nick is building${statusDots}`
        : `Nick is thinking${statusDots}`;

  return (
    <AbsoluteFill className="font-sans">
      {/* Soundtrack — fades in at the start and out over the settle hold so it
          never clips. Stills (renderStill) carry no audio; the MP4 render must
          pass muted:false (see scripts/render-wtc.ts). */}
      <Audio
        src={staticFile("audio/workflow-template-card.mp3")}
        volume={(f) =>
          interpolate(
            f,
            [0, 10, durationInFrames - 26, durationInFrames - 1],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
      <WorkflowTemplateCardView props={props} anim={baseAnim} />

      {/* ── Nick-style chat input — types in centre, lifts up as a box ────── */}
      <div
        className="absolute flex items-center gap-3 rounded-2xl border bg-black px-4"
        style={{
          left: boxLeft,
          top: boxTop,
          width: BOX_W,
          height: BOX_H,
          opacity: boxOpacity,
          borderColor: "rgba(1, 120, 255, 0.75)",
          boxShadow: "0 0 0 3px rgba(1, 120, 255, 0.08), 0 24px 60px -24px rgba(1, 120, 255, 0.35)",
        }}
      >
        <div className="min-w-0 flex-1 truncate font-sans font-normal leading-snug text-white" style={{ fontSize: 22 }}>
          {promptInBox}
          {caretVisible ? <span style={{ color: "#0178FF" }}>▍</span> : null}
        </div>
        <div
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: SEND,
            height: SEND,
            backgroundColor: "#0178FF",
            transform: `scale(${sendScale})`,
            transformOrigin: "center center",
            boxShadow: sendScale > 1.05 ? "0 0 0 4px rgba(1,120,255,0.25)" : undefined,
          }}
          aria-hidden
        >
          <ArrowUp size={20} color="#ffffff" strokeWidth={2.5} />
        </div>
      </div>

      {/* ── Status line — under chat box, lifts with it, phases with the build ─ */}
      {statusOpacity > 0.01 ? (
        <div
          className="absolute font-sans text-[22px] font-medium text-zinc-400"
          style={{ left: statusLeft, top: statusTop, opacity: statusOpacity }}
        >
          {statusLabel}
        </div>
      ) : null}

      {/* ── Tool-call counter — climbs on a slot-machine reel as nodes appear,
            then holds at the final count. "N tool calls" + green Completed
            chip on one row (Nick's live reasoning). Persists into the settle. */}
      {frame >= WTC_ANIM.conveyorStart - 2 ? (
        <div
          className="absolute overflow-hidden rounded-xl"
          style={{
            left: statusLeft,
            top: toolRowTopFor(statusTop),
            width: BOX_W,
            height: CHIP_H,
            transform: `scale(${validateClick})`,
            transformOrigin: "center center",
            boxShadow:
              validateGlow > 0.01
                ? `0 0 0 2px rgba(0,201,80,${0.5 * validateGlow}), 0 16px 46px -10px rgba(0,201,80,${0.55 * validateGlow})`
                : undefined,
            opacity: interpolate(
              frame,
              [WTC_ANIM.conveyorStart - 2, WTC_ANIM.conveyorStart + 10],
              [0, 1],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            ),
          }}
        >
          {/* Two chips stacked; sliding the column up by one chip height and
              looping makes a fresh chip rise from below. The final cycle rises
              a "Workflow validated" chip, which rests through the settle. */}
          <div style={{ transform: `translateY(${-CHIP_H * reelSlide}px)` }}>
            {reelAtRest ? <ValidatedChip /> : <ToolChip />}
            {reelFinalCycle ? <ValidatedChip /> : <ToolChip />}
          </div>
        </div>
      ) : null}

      {/* ── Conveyor group (recedes + fades on zoom-out) ──────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          opacity: conveyorOpacity,
          transform: `translateX(${-conveyorDrift}px) scale(${conveyorScale})`,
          transformOrigin: `${centerX}px ${GRAPH_CENTER_Y}px`,
        }}
      >
        {/* edges (behind cards) */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={width}
          height="100%"
          style={{ overflow: "visible" }}
          aria-hidden
        >
          {ordered.slice(0, -1).map((node, i) => {
          const xi = centerX + (i - a) * SLOT;
          const xj = centerX + (i + 1 - a) * SLOT;
          const x1 = xi + HERO_W / 2 - 4;
          const x2 = xj - HERO_W / 2 + 4;
          const len = x2 - x1;
          if (len <= 8) return null;
          const opacity =
            interpolate(a, [i - 0.05, i + 0.45, i + 1.05, i + 1.7], [0, 0.5, 0.5, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }) * conveyorGate;
          if (opacity < 0.01) return null;
          const drawP = clamp(a - i, 0, 1);
          const chevron = clamp((drawP - 0.55) / 0.3, 0, 1);
          return (
            <g key={`edge-${node.id}`} opacity={opacity}>
              <line
                x1={x1}
                y1={CONV_Y}
                x2={x2}
                y2={CONV_Y}
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeDasharray={len}
                strokeDashoffset={len * (1 - drawP)}
              />
              <path
                d={`M ${x2 - 12} ${CONV_Y - 7} L ${x2} ${CONV_Y} L ${x2 - 12} ${CONV_Y + 7}`}
                fill="none"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={chevron}
              />
              </g>
            );
          })}
        </svg>

        {/* hero node cards */}
        {ordered.map((node, i) => {
          const r = i - a;
          const opacity = slotOpacity(r) * conveyorGate;
          if (opacity < 0.005) return null;
          // Opening node is rendered larger while it's centre, then eases back
          // to normal size as the belt moves past it — a clear "this is the
          // first node" signal to match its longer hold (see timeline firstHold).
          const firstBoost =
            i === 0
              ? interpolate(a, [0, 1], [1.18, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })
              : 1;
          const scale = slotScale(r) * firstBoost;
          const x = centerX + r * SLOT;
          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: x - HERO_W / 2,
                top: CONV_Y - HERO_H / 2,
                width: HERO_W,
                height: HERO_H,
                opacity,
                transform: `scale(${scale})`,
                zIndex: Math.round(200 - Math.abs(r) * 20),
              }}
            >
              <HeroCard node={node} />
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
