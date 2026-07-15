/**
 * Props + shared constants for the Nick launch video (16:9, 40s).
 *
 * Three real library workflows carry the "cross-asset" story: crypto (BTC),
 * AI-consensus, and equities (Mag-7). Prompts are the templates' own first-person
 * prompts. The stills composition renders any single screen for design review.
 */
import { TEMPLATES } from "../workflow-template-card/data/templates.generated";
import type { TemplateGraph } from "../workflow-template-card/props";
import { NVDA_HERO_TEMPLATE } from "./nvda-template";

export const NICK_LAUNCH_FPS = 30;
export const NICK_LAUNCH_W = 1920;
// 1200 to match Onur's launch-video canvas (16:10) that these screens graft into.
export const NICK_LAUNCH_H = 1200;

export type LaunchWorkflow = { template: TemplateGraph; prompt: string; name?: string };

/** Display name for a workflow (clean override, else the template's own name). */
export const wfName = (w: LaunchWorkflow) => w.name ?? w.template.name;

export const LAUNCH_WORKFLOWS: LaunchWorkflow[] = [
  { template: TEMPLATES["btc-buy-the-dip"], prompt: "Automate my BTC dip buying", name: "BTC Buy the Dip" },
  {
    template: TEMPLATES["multi-llm-consensus-trader-paper-trading"],
    prompt: "Trade on multi-LLM consensus",
    name: "Multi-LLM Consensus Trader",
  },
  {
    template: TEMPLATES["mag-7-stock-rotator-daily-paper-trading"],
    prompt: "Rotate the Magnificent 7 daily",
    name: "Mag 7 Stock Rotator",
  },
];

/** The two workflows the montage builds (after the NVDA hero), each with the
 *  same zoom-in-then-out build animation. Clean display names. */
export const MONTAGE_WORKFLOWS: LaunchWorkflow[] = [
  LAUNCH_WORKFLOWS[1], // Multi-LLM Consensus Trader
  LAUNCH_WORKFLOWS[2], // Mag 7 Stock Rotator
];

/** Top row of the finale grid: the built hero (NVDA) plus the library trio.
 *  The hero (index 0) is the workflow that enters big + centered, then flies to
 *  its top-left slot while the rest of the grid populates around it. */
export const GRID_WORKFLOWS: LaunchWorkflow[] = [
  { template: NVDA_HERO_TEMPLATE, prompt: NVDA_HERO_TEMPLATE.prompt, name: "NVDA · Buy below $200" },
  LAUNCH_WORKFLOWS[0], // BTC Buy the Dip
  LAUNCH_WORKFLOWS[1], // Multi-LLM Consensus Trader
  LAUNCH_WORKFLOWS[2], // Mag 7 Stock Rotator
];

/** Second row of the finale grid: four MORE workflows across other domains, to
 *  show the breadth ("Nick trades anything"). Distinct graph shapes, clean
 *  domain names: two prediction-market, one copy-trading, one news. */
export const GRID_WORKFLOWS_2: LaunchWorkflow[] = [
  { template: TEMPLATES["polymarket-signal-scanner"], prompt: "", name: "Polymarket Election Edge" },
  { template: TEMPLATES["top-movers-scanner-paper-trading"], prompt: "", name: "Kalshi Event Trader" },
  { template: TEMPLATES["btc-momentum-consensus"], prompt: "", name: "Copy the Whales" },
  { template: TEMPLATES["equity-news-catalyst-monitor"], prompt: "", name: "News Catalyst Alerts" },
];

/** Intro copy. */
export const INTRO_TITLE = "Introducing Nick";
export const VALUEPROP = "Nick trades anything.";

/** Payoff tagline (Badi's wording, verbatim). */
export const TAGLINE = "Nick, trading agent, cross platform, cross assets, non custodial";

/** CTA — canonical public CTA for Nick. */
export const CTA_LINE = "Try it for free now";
export const CTA_URL = "getnick.ai";

export type LaunchScreen =
  | "intro"
  | "valueprop"
  | "prompt"
  | "workflow-zoom"
  | "workflow-0"
  | "workflow-1"
  | "workflow-2"
  | "grid"
  | "product"
  | "execution"
  | "execution-logs"
  | "cta";

export const ALL_SCREENS: LaunchScreen[] = [
  "intro",
  "valueprop",
  "prompt",
  "workflow-zoom",
  "workflow-0",
  "workflow-1",
  "workflow-2",
  "grid",
  "product",
  "execution",
  "execution-logs",
  "cta",
];

export type NickLaunchStillProps = { screen: LaunchScreen };

export const nickLaunchStillDefaultProps: NickLaunchStillProps = {
  screen: "workflow-0",
};
