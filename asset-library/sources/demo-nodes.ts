/** Static workflow graph data recreated from Figma Frame 3 (the demo canvas). */

export type NodeKind = "start" | "price-data" | "condition" | "notification";

export interface DemoNode {
  id: string;
  title: string;
  badge: string;
  kind: NodeKind;
  subtitle: string;
  /** top-left position + width within the BOARD coordinate space (px) */
  x: number;
  y: number;
  w: number;
}

export interface DemoEdge {
  id: string;
  d: string;
  label?: string;
  labelX?: number;
  labelY?: number;
}

/** Internal coordinate space for the workflow board; scales to fit its container. */
export const BOARD = { w: 660, h: 520 } as const;
export const NODE_H = 66;

export const DEMO_NODES: DemoNode[] = [
  {
    id: "start",
    title: "Start",
    badge: "START",
    kind: "start",
    subtitle: "Runs every 5 minutes",
    x: 96,
    y: 18,
    w: 214,
  },
  {
    id: "price",
    title: "BTC Price",
    badge: "PRICE-DATA",
    kind: "price-data",
    subtitle: "Fetches BTC/USD from CoinGecko",
    x: 40,
    y: 210,
    w: 236,
  },
  {
    id: "cond",
    title: "Below $80K?",
    badge: "CONDITION",
    kind: "condition",
    subtitle: "price < 80,000",
    x: 386,
    y: 210,
    w: 214,
  },
  {
    id: "email",
    title: "BTC Alert Email",
    badge: "NOTIFICATION",
    kind: "notification",
    subtitle: "Send price + 24h stats",
    x: 150,
    y: 402,
    w: 236,
  },
];

export const DEMO_EDGES: DemoEdge[] = [
  // Start -> BTC Price
  { id: "e1", d: "M 203 84 C 203 150 158 150 158 210" },
  // BTC Price -> Below $80K?
  { id: "e2", d: "M 276 243 C 330 243 340 243 386 243" },
  // Below $80K? -> BTC Alert Email (true branch)
  {
    id: "e3",
    d: "M 493 276 C 493 360 300 336 268 402",
    label: "true",
    labelX: 404,
    labelY: 340,
  },
];

export const BADGE_STYLES: Record<NodeKind, string> = {
  start:
    "bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/12 dark:text-emerald-400",
  "price-data":
    "bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/12 dark:text-indigo-400",
  condition:
    "bg-zinc-500/12 text-zinc-500 dark:bg-zinc-400/12 dark:text-zinc-300",
  notification:
    "bg-purple-500/12 text-purple-600 dark:bg-purple-400/12 dark:text-purple-400",
};
