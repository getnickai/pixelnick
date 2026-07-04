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
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { ArrowUp } from "lucide-react";
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
import { WTC_ANIM, wtcLastHeroIndex, wtcNodeArrival, wtcZoomWindow } from "./timeline";

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
/** Payoff layout — graph + copy tuck under the lifted chat box + status. */
const END_GRAPH_TOP = HEAD_TOP + BOX_H + STATUS_GAP + 28 + 20;
const END_META_TOP = END_GRAPH_TOP + 300 + 24;
const END_DESC_TOP = END_META_TOP + 40;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

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

/** Fractional "active" index over time, eased between arrivals (accelerando). */
function activeIndex(frame: number, arrivals: number[]): number {
  const n = arrivals.length;
  if (n === 0) return 0;
  if (frame <= arrivals[0]) return 0;
  for (let k = 0; k < n - 1; k++) {
    if (frame < arrivals[k + 1]) {
      const raw = (frame - arrivals[k]) / (arrivals[k + 1] - arrivals[k]);
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
  const { width } = useVideoConfig();
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
  const a = Math.min(activeIndex(frame, arrivals), lastHero);
  const conveyorGate = clamp((frame - WTC_ANIM.conveyorStart + 2) / 10, 0, 1);

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
      ? "Nick is ready to execute"
      : frame >= WTC_ANIM.conveyorStart
        ? `Nick is building${statusDots}`
        : `Nick is thinking${statusDots}`;

  return (
    <AbsoluteFill className="font-sans">
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
          const scale = slotScale(r);
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
