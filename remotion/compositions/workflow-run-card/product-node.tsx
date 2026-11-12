/**
 * The product's workflow node cards, redrawn for Remotion with the app's
 * resolved dark-theme tokens (nickai-app `BaseNodeWrapper`, the start node,
 * `NodeIconTile`, node icons and `--node-{type}` colours). Every state change
 * is driven by the frame, never by CSS animation, so renders are deterministic.
 */
import { Bot, CheckCircle2, Code, LineChart, Loader2, Rss, TrendingUp, Zap } from "lucide-react";
import type { NodeRunState } from "./timeline";
import type { RunNode, RunNodeType } from "./props";

/* nickai-app globals.css, `.dark` block. */
export const TOKENS = {
  surface: "#18181b", // --bg-surface (zinc-900)
  panel: "#09090b", // --bg-white-0 (zinc-950)
  edge: "rgba(255,255,255,0.10)", // dark:border-white/10
  textStrong: "#ffffff",
  textSub: "#a1a1aa", // zinc-400
  primary: "#0178ff",
  primaryRing: "rgba(1,120,255,0.25)",
  success: "#00a63e", // oklch(62.7% 0.194 149.214)
  successRing: "rgba(16,185,129,0.14)",
} as const;

function XLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function PolymarketLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 137 168" fill="none" aria-hidden>
      <path
        d="M136.267 152.495C136.267 159.76 136.267 163.392 133.891 165.192C131.516 166.993 128.019 166.012 121.024 164.049L8.63192 132.51C4.41793 131.328 2.31093 130.737 1.09248 129.129C-0.125977 127.522 -0.125977 125.333 -0.125977 120.957V47.0434C-0.125977 42.6667 -0.125977 40.4783 1.09248 38.8709C2.31093 37.2634 4.41792 36.6722 8.63191 35.4897L121.024 3.95096C128.019 1.98834 131.516 1.00703 133.891 2.80771C136.267 4.60839 136.267 8.24049 136.267 15.5047V152.495ZM27.9043 122.228L120.966 148.345V96.1133L27.9043 122.228ZM15.1738 110.111L108.217 84L15.1738 57.8887V110.111ZM27.9033 45.7725L120.966 71.8877V19.6553L27.9033 45.7725Z"
        fill="currentColor"
      />
    </svg>
  );
}

type NodeLook = {
  /** `--node-{type}` (dark), or primary for the manual trigger. */
  color: string;
  /** Product `nodeSubtitle`: the node type's display name. */
  typeName: string;
  Icon: React.FC<{ size: number }>;
};

function lucide(I: typeof Bot): React.FC<{ size: number }> {
  function LucideNodeIcon({ size }: { size: number }) {
    return <I size={size} strokeWidth={2} />;
  }
  return LucideNodeIcon;
}

const LOOKS: Record<RunNodeType, NodeLook> = {
  start: { color: TOKENS.primary, typeName: "Manual", Icon: lucide(Zap) },
  "twitter-data": { color: "#e6e6e6", typeName: "Twitter Data", Icon: XLogo },
  "stocks-data": { color: "#2b6cee", typeName: "Stocks Data", Icon: lucide(LineChart) },
  "polymarket-data": { color: "#4d73ff", typeName: "Polymarket Data", Icon: PolymarketLogo },
  "price-data": { color: "#db7706", typeName: "Price Data", Icon: lucide(TrendingUp) },
  llm: { color: "#2563eb", typeName: "LLM", Icon: lucide(Bot) },
  "rss-feed": { color: "#e7b008", typeName: "RSS Feed", Icon: lucide(Rss) },
  function: { color: "#8244ee", typeName: "Function", Icon: lucide(Code) },
};

export const lookFor = (type: RunNodeType) => LOOKS[type];

/** `NodeIconTile` (outlined, rounded-full): tinted disc, 20% hairline in the node colour. */
export function NodeTile({ type, size = 32 }: { type: RunNodeType; size?: number }) {
  const { color, Icon } = lookFor(type);
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        color,
        backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      <Icon size={size / 2} />
    </div>
  );
}

/** Running spinner / completed check, frame-driven. */
export function ExecIcon({ state, frame, size = 16 }: { state: NodeRunState; frame: number; size?: number }) {
  if (state === "running") {
    return (
      <span style={{ display: "inline-flex", transform: `rotate(${frame * 14}deg)`, color: TOKENS.primary }}>
        <Loader2 size={size} strokeWidth={2.2} />
      </span>
    );
  }
  if (state === "completed") {
    return (
      <span style={{ display: "inline-flex", color: TOKENS.success }}>
        <CheckCircle2 size={size} strokeWidth={2.2} />
      </span>
    );
  }
  return null;
}

function stateShell(state: NodeRunState): React.CSSProperties {
  if (state === "running") {
    return {
      borderColor: TOKENS.primary,
      boxShadow: `0 0 0 3px ${TOKENS.primaryRing}, 0 0 36px rgba(1,120,255,0.35)`,
    };
  }
  if (state === "completed") {
    return { borderColor: TOKENS.success, boxShadow: `0 0 0 3px ${TOKENS.successRing}` };
  }
  return { borderColor: TOKENS.edge, boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.5)" };
}

export const CARD_W = 240;
export const CARD_H = 100;
/** Handles sit on the summary row's centre line (2px pad + 18px). */
export const HANDLE_Y = 20;
export const START_D = 64;

/** `BaseNodeWrapper`: summary tray over a raised panel with tile, title and type. */
export function ProductNodeCard({ node, state, frame }: { node: RunNode; state: NodeRunState; frame: number }) {
  const look = lookFor(node.type);
  return (
    <div
      className="relative flex flex-col"
      style={{
        width: CARD_W,
        height: CARD_H,
        padding: 2,
        borderRadius: 14,
        border: "1.75px solid",
        backgroundColor: TOKENS.surface,
        ...stateShell(state),
      }}
    >
      {state !== "idle" ? (
        <div className="absolute z-20" style={{ top: 10, right: 12 }}>
          <ExecIcon state={state} frame={frame} />
        </div>
      ) : null}
      <div className="relative" style={{ padding: "8px 12px", paddingRight: state !== "idle" ? 32 : 12 }}>
        <div className="truncate text-[12px] font-medium leading-5" style={{ color: TOKENS.textSub }}>
          {node.value}
        </div>
        <Handle side="left" />
        <Handle side="right" />
      </div>
      <div
        className="relative flex flex-1 items-center gap-3"
        style={{
          borderRadius: 10.25,
          backgroundColor: TOKENS.panel,
          padding: 12,
          boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.3)",
        }}
      >
        <NodeTile type={node.type} />
        <div className="flex min-w-0 flex-col gap-1">
          <div className="truncate text-[14px] font-semibold leading-4" style={{ color: TOKENS.textStrong }}>
            {node.title}
          </div>
          <div className="truncate text-[12px] leading-4" style={{ color: TOKENS.textSub }}>
            {look.typeName}
          </div>
        </div>
      </div>
    </div>
  );
}

export const COMPACT_W = 196;
export const COMPACT_H = 32;

/** Compact layout (big workflows): the card's raised panel only, tile + title, same state shell. */
export function CompactNodeCard({ node, state, frame }: { node: RunNode; state: NodeRunState; frame: number }) {
  return (
    <div
      className="relative flex items-center gap-2"
      style={{
        width: COMPACT_W,
        height: COMPACT_H,
        padding: "0 10px 0 5px",
        borderRadius: 10,
        border: "1.5px solid",
        backgroundColor: TOKENS.panel,
        ...stateShell(state),
      }}
    >
      <NodeTile type={node.type} size={22} />
      <div className="min-w-0 flex-1 truncate text-[12.5px] font-semibold leading-4" style={{ color: TOKENS.textStrong }}>
        {node.title}
      </div>
      {state !== "idle" ? <ExecIcon state={state} frame={frame} size={14} /> : null}
      <Handle side="left" />
      <Handle side="right" />
    </div>
  );
}

function Handle({ side }: { side: "left" | "right" }) {
  return (
    <span
      className="absolute rounded-full"
      style={{
        top: "50%",
        [side]: -6,
        width: 8,
        height: 8,
        transform: "translateY(-50%)",
        backgroundColor: TOKENS.textStrong,
        border: `1.5px solid ${TOKENS.panel}`,
      }}
    />
  );
}

/** The start node: a 64px circle in the cards' finish, label underneath. */
export function StartNode({ node, state, frame }: { node: RunNode; state: NodeRunState; frame: number }) {
  return (
    <div className="relative" style={{ width: START_D, height: START_D }}>
      {state !== "idle" ? (
        <div className="absolute z-20" style={{ top: -4, right: -4 }}>
          <ExecIcon state={state} frame={frame} />
        </div>
      ) : null}
      <div
        className="flex items-center justify-center rounded-full"
        style={{
          width: START_D,
          height: START_D,
          padding: 1,
          border: "1.75px solid",
          backgroundColor: TOKENS.surface,
          ...stateShell(state),
        }}
      >
        <div
          className="flex size-full items-center justify-center rounded-full"
          style={{ backgroundColor: TOKENS.panel }}
        >
          <NodeTile type="start" size={36} />
        </div>
      </div>
      <span
        className="absolute rounded-full"
        style={{
          top: "50%",
          right: -4,
          width: 8,
          height: 8,
          transform: "translateY(-50%)",
          backgroundColor: TOKENS.textStrong,
          border: `1.5px solid ${TOKENS.panel}`,
        }}
      />
      <div
        className="absolute left-1/2 whitespace-nowrap text-[14px] font-semibold leading-4"
        style={{ top: START_D + 8, transform: "translateX(-50%)", color: TOKENS.textStrong }}
      >
        {node.detail}
      </div>
    </div>
  );
}
