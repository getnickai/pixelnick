/**
 * Node glyph map — the single source of truth for how each workflow node type
 * is drawn (colour + icon + short label). Shared by the hero cards (conveyor)
 * and the mini-canvas chips (zoom-out), so the colour identity of a node type
 * is identical at every scale.
 *
 * Palette is pinned to the NickAI Figma design tokens (Tailwind v4 scale):
 * border = <color>-400, icon = <color>-500. This matches the library card
 * mini-canvas assignments (start=blue, price=cyan, function=orange,
 * conditional=yellow, exchange/portfolio=green, email=red, llm=purple, …).
 */
import {
  CandlestickChart,
  Code,
  Cpu,
  Database,
  DollarSign,
  GitBranch,
  LineChart,
  Mail,
  MessageSquare,
  Send,
  TrendingUp,
  Zap,
} from "lucide-react";

type IconComponent = React.ComponentType<{
  size?: number | string;
  strokeWidth?: number;
  color?: string;
  className?: string;
}>;

export type NodeGlyph = {
  /** Short human label for the node *type* (hero-card subtitle fallback). */
  typeLabel: string;
  /** Tailwind colour name — documentation only. */
  colorName: string;
  /** Accent / border colour — Tailwind v4 <color>-400. */
  border: string;
  /** Icon + strong accent — Tailwind v4 <color>-500. */
  icon: string;
  Icon: IconComponent;
};

const FALLBACK: NodeGlyph = {
  typeLabel: "Node",
  colorName: "grey",
  border: "#858a93",
  icon: "#696f77",
  Icon: Code,
};

export const NODE_GLYPHS: Record<string, NodeGlyph> = {
  start: { typeLabel: "Trigger", colorName: "blue", border: "#51a2ff", icon: "#2b7fff", Icon: Zap },
  "price-data": { typeLabel: "Price Data", colorName: "cyan", border: "#00d3f2", icon: "#00b8db", Icon: TrendingUp },
  portfolio: { typeLabel: "Portfolio", colorName: "green", border: "#05df72", icon: "#00c951", Icon: DollarSign },
  exchange: { typeLabel: "Exchange", colorName: "green", border: "#05df72", icon: "#00c951", Icon: DollarSign },
  function: { typeLabel: "Function", colorName: "orange", border: "#ff8904", icon: "#ff6900", Icon: Code },
  conditional: { typeLabel: "Condition", colorName: "yellow", border: "#fcc800", icon: "#efb100", Icon: GitBranch },
  "email-notification": { typeLabel: "Email", colorName: "red", border: "#ff6467", icon: "#fb2c36", Icon: Mail },
  llm: { typeLabel: "LLM", colorName: "purple", border: "#c27aff", icon: "#ad46ff", Icon: Cpu },
  coinglass: { typeLabel: "Coinglass", colorName: "emerald", border: "#00d492", icon: "#00bc7d", Icon: CandlestickChart },
  "chart-image": { typeLabel: "Chart", colorName: "pink", border: "#fb64b6", icon: "#f6339a", Icon: LineChart },
  "discord-notification": { typeLabel: "Discord", colorName: "indigo", border: "#7c86ff", icon: "#615fff", Icon: MessageSquare },
  "telegram-notification": { typeLabel: "Telegram", colorName: "sky", border: "#00bcff", icon: "#00a6f4", Icon: Send },
  "slack-notification": { typeLabel: "Slack", colorName: "purple", border: "#c27aff", icon: "#ad46ff", Icon: MessageSquare },
  "stocks-data": { typeLabel: "Stocks", colorName: "blue", border: "#51a2ff", icon: "#2b7fff", Icon: Database },
  polymarket: { typeLabel: "Polymarket", colorName: "violet", border: "#a684ff", icon: "#8e51ff", Icon: TrendingUp },
  storage: { typeLabel: "Storage", colorName: "slate", border: "#90a1b9", icon: "#62748e", Icon: Database },
};

export function getGlyph(type: string): NodeGlyph {
  return NODE_GLYPHS[type] ?? FALLBACK;
}
