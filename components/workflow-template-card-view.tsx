/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";
// Relative (not "@/") imports: this view is bundled by Remotion's webpack (via
// the composition) for headless generation, which doesn't resolve the "@/" alias.
import { Settings } from "lucide-react";
import type { WorkflowTemplateCardProps } from "../remotion/compositions/workflow-template-card/props";
import { edgePath, layoutGraph } from "../remotion/compositions/workflow-template-card/layout";
import { getGlyph } from "../remotion/compositions/workflow-template-card/node-glyphs";
import { toolsCalledFor } from "../remotion/compositions/workflow-template-card/timeline";

const ASSET = "/figma";

/** Graph-box geometry (px within the card content column). */
const GRAPH = { width: 560, height: 300, padding: 46, chip: 48, icon: 26 } as const;

/**
 * Per-frame animation values. Every animatable element reads opacity / offset
 * from here. The Remotion composition computes these from `useCurrentFrame()`;
 * the static still (`components/workflow-template-card.tsx`) omits them and
 * gets `SETTLED_ANIM` (the final, fully-revealed zoom-out state).
 */
export type WorkflowTemplateCardAnim = {
  glowOpacity: number;
  /** Organic wave lines (`agent-illustration.svg`) — matches performance card. */
  agentIllustrationOpacity: number;
  logoOpacity: number;
  logoY: number;
  pillOpacity: number;
  pillScale: number;
  headlineOpacity: number;
  headlineY: number;
  /** 0 → hidden, 1 → fully revealed. Applied to graph + description + CTA. */
  graphOpacity: number;
  /** Graph zoom (mini-canvas grows into place during the zoom-out). Default 1. */
  graphScale?: number;
  /** Override graph vertical position (default 360). */
  graphTop?: number;
  /** Override description block top (default 712). */
  descriptionTop?: number;
  /** Override meta row top (default 832). */
  metaTop?: number;
  /** When false, hide the template name headline (animated payoff keeps the chat box). */
  showHeadline?: boolean;
  /** When true, render Nick's first-person description instead of the poster copy. */
  nickVoice?: boolean;
  descriptionOpacity: number;
  metaOpacity: number;
  ctaOpacity: number;
  /** Footer line-graph wipe (100 = hidden, 0 = fully revealed). */
  graphInsetRight?: number;
  /** Per-node reveal 0..1, keyed by node id (defaults to 1 when absent). */
  nodeReveal?: Record<string, number>;
  /** Per-edge draw 0..1, keyed by edge id (defaults to 1 when absent). */
  edgeReveal?: Record<string, number>;
};

export const SETTLED_ANIM: WorkflowTemplateCardAnim = {
  glowOpacity: 1,
  agentIllustrationOpacity: 0.1,
  logoOpacity: 1,
  logoY: 0,
  pillOpacity: 1,
  pillScale: 1,
  headlineOpacity: 1,
  headlineY: 0,
  graphOpacity: 1,
  descriptionOpacity: 1,
  metaOpacity: 1,
  ctaOpacity: 1,
  graphInsetRight: 0,
};

/**
 * The Workflow Template Card design — the SINGLE source of truth, as plain DOM.
 *
 * Settled state = the zoom-out payoff / static poster: the template's real
 * graph as mini-canvas glyph chips, under the NickAI chrome (logo, glow,
 * background), with the name, description, and a "Try for free" footer CTA.
 * The animated composition drives the same view per frame.
 */
export function WorkflowTemplateCardView({
  props,
  anim = SETTLED_ANIM,
}: {
  props: WorkflowTemplateCardProps;
  anim?: WorkflowTemplateCardAnim;
}) {
  const { template } = props;
  const layout = layoutGraph(template.nodes, {
    width: GRAPH.width,
    height: GRAPH.height,
    padding: GRAPH.padding,
  });
  const graphTop = anim.graphTop ?? 360;
  const metaTop = anim.metaTop ?? 712;
  const descriptionTop = anim.descriptionTop ?? 752;
  const bodyCopy = anim.nickVoice
    ? template.nickDescription || template.description
    : template.description;

  return (
    <div className="absolute inset-0 overflow-clip bg-primary-1000 font-sans">
      {/* Brand radial glow */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_42%,var(--color-primary-500)_0%,transparent_60%)]"
        style={{ opacity: 0.16 * anim.glowOpacity }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-[-314.95px] top-[195.5px] h-[1206px] w-[1191.312px]"
        style={{ opacity: 0.9 * anim.glowOpacity }}
        aria-hidden
      >
        <div className="-scale-y-100">
          <div className="absolute inset-[-41.01%_-41.51%]">
            <img alt="" src={`${ASSET}/background-glow.svg`} className="block size-full max-w-none" />
          </div>
        </div>
      </div>

      {/* Agent illustration — organic line shapes (same layer as performance card) */}
      <div
        className="pointer-events-none absolute left-[-326px] top-[-222px] flex h-[865px] w-[1347px] items-center justify-center"
        style={{ opacity: anim.agentIllustrationOpacity }}
        aria-hidden
      >
        <div className="-rotate-90 -scale-y-100">
          <div className="relative h-[1347px] w-[865px]">
            <img
              alt=""
              src={`${ASSET}/agent-illustration.svg`}
              className="absolute inset-0 block size-full max-w-none"
            />
          </div>
        </div>
      </div>

      {/* Logo */}
      <div
        className="absolute left-16 top-[63px] h-[30px] w-[140.211px]"
        style={{ opacity: anim.logoOpacity, transform: `translateY(${anim.logoY}px)` }}
      >
        <img alt="NickAI" src={`${ASSET}/logo.svg`} className="block size-full max-w-none" />
      </div>

      {/* Header: type pill + name */}
      <div className="absolute left-16 right-16 top-[150px] flex flex-col gap-4">
        <div
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-green-600 px-3.5 py-1.5"
          style={{
            opacity: anim.pillOpacity,
            transform: `scale(${anim.pillScale})`,
            transformOrigin: "left center",
          }}
        >
          <span className="size-2 rounded-full bg-white" />
          <span className="whitespace-nowrap text-sm font-semibold tracking-wide text-white">
            Live trading agent
          </span>
        </div>
        <h1
          className="font-heading text-[46px] font-semibold leading-[1.1] text-white"
          style={{
            opacity: (anim.showHeadline ?? true) ? anim.headlineOpacity : 0,
            transform: `translateY(${anim.headlineY}px)`,
          }}
        >
          {template.name}
        </h1>
      </div>

      {/* Graph — the real template topology as glyph chips */}
      <div
        className="absolute left-1/2"
        style={{
          top: graphTop,
          width: GRAPH.width,
          height: GRAPH.height,
          opacity: anim.graphOpacity,
          transform: `translateX(-50%) scale(${anim.graphScale ?? 1})`,
          transformOrigin: "center center",
        }}
      >
        <svg
          width={GRAPH.width}
          height={GRAPH.height}
          className="absolute inset-0"
          style={{ overflow: "visible" }}
          aria-hidden
        >
          {template.edges.map((e) => {
            const s = layout.nodeById[e.source];
            const t = layout.nodeById[e.target];
            if (!s || !t) return null;
            const reveal = anim.edgeReveal?.[e.id] ?? 1;
            return (
              <path
                key={e.id}
                d={edgePath(s.cx, s.cy, t.cx, t.cy)}
                fill="none"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth={2}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - reveal}
              />
            );
          })}
        </svg>

        {layout.nodes.map((n) => {
          const glyph = getGlyph(n.type);
          const Icon = glyph.Icon;
          const reveal = anim.nodeReveal?.[n.id] ?? 1;
          return (
            <div
              key={n.id}
              className="absolute flex items-center justify-center rounded-[14px] border-2 shadow-lg"
              style={{
                left: n.cx - GRAPH.chip / 2,
                top: n.cy - GRAPH.chip / 2,
                width: GRAPH.chip,
                height: GRAPH.chip,
                borderColor: glyph.border,
                backgroundColor: "#131516",
                opacity: reveal,
                transform: `scale(${0.6 + 0.4 * reveal})`,
              }}
            >
              <Icon size={GRAPH.icon} color={glyph.icon} strokeWidth={2.4} />
            </div>
          );
        })}
      </div>

      {/* Meta — node count + tools called, stacked under the graph */}
      <div
        className="absolute left-16 flex flex-col gap-3"
        style={{ top: metaTop, opacity: anim.metaOpacity }}
      >
        <div className="flex items-center gap-3">
          <div className="relative h-[16.67px] w-[20.837px] shrink-0">
            <img alt="" src={`${ASSET}/icon-nodes.svg`} className="block size-full max-w-none" />
          </div>
          <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
            {template.nodes.length} nodes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Settings size={20} className="shrink-0 text-zinc-400" strokeWidth={2} aria-hidden />
          <p className="whitespace-nowrap text-xl leading-4 text-zinc-400">
            {toolsCalledFor(template.nodes.length)} tools called
          </p>
        </div>
      </div>

      {/* Description */}
      <div
        className="absolute left-16 right-16"
        style={{ top: descriptionTop, opacity: anim.descriptionOpacity }}
      >
        <p className="text-[22px] leading-[1.45] text-zinc-400">{bodyCopy}</p>
      </div>

      {/* Footer CTA — full-width brand button (perf-card tab + brand body).
          Copy: "Start your agentic trading, try Nick for free". No footer
          caption and no decorative line graph on this card. */}
      {/* Width matches the chat input box up top (520px, same left edge). */}
      <div className="absolute bottom-[45px] left-16 z-10 w-[520px]" style={{ opacity: anim.ctaOpacity }}>
        <div className="flex items-stretch">
          <div className="relative h-[56px] w-[46px] shrink-0 rotate-180">
            <img alt="" src={`${ASSET}/cta-tab.svg`} className="absolute inset-0 block size-full max-w-none" />
          </div>
          <div
            className="relative -ml-[2px] flex flex-1 items-center justify-center gap-[9px] rounded-r-[12px] px-4 text-white"
            style={{ backgroundColor: "#0178FF" }}
          >
            <p className="whitespace-nowrap text-[18px] font-semibold leading-[1.2]">
              Create your trading agent today, try Nick for free
            </p>
            <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M13 18L19 12L13 6M18.5 12H5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export type { CSSProperties };
