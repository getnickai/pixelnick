/**
 * The hero workflow (STA-494), authored as a TemplateGraph so it renders on the
 * same camera engine + rich node design as every other workflow. Mirrors the
 * chat prompt in the launch video: "buy $50 of NVDA every 12h when it's below
 * $200, on paper trading".
 */
import type { TemplateGraph } from "../workflow-template-card/props";

export const NVDA_HERO_TEMPLATE: TemplateGraph = {
  slug: "nvda-dca-below-200",
  name: "NVDA · Buy below $200",
  description: "Buy $50 of NVDA every 12 hours when the price is below $200, on paper trading.",
  nickDescription: "I buy $50 of NVDA every 12 hours whenever it dips below $200.",
  prompt: "Create a workflow to buy $50 of shares every 12 hours when NVDA is below $200. Use my paper trading wallet",
  nodes: [
    { id: "trigger", type: "start", label: "Daily Trigger", subtitle: "Every 12 hours", position: { x: 0, y: 200 } },
    { id: "price", type: "price-data", label: "NVDA Price", subtitle: "NVDA · latest", position: { x: 340, y: 200 } },
    { id: "cond", type: "conditional", label: "Below $200?", subtitle: "price < 200", position: { x: 680, y: 200 } },
    { id: "buy", type: "exchange", label: "Buy $50 NVDA", subtitle: "Paper trading", position: { x: 1020, y: 200 } },
  ],
  edges: [
    { id: "e1", source: "trigger", target: "price" },
    { id: "e2", source: "price", target: "cond" },
    { id: "e3", source: "cond", target: "buy" },
  ],
};
