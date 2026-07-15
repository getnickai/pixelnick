/**
 * Props + shared constants for the Nick launch video (16:9, 40s).
 *
 * Three real library workflows carry the "cross-asset" story: crypto (BTC),
 * AI-consensus, and equities (Mag-7). Prompts are the templates' own first-person
 * prompts. The stills composition renders any single screen for design review.
 */
import { TEMPLATES } from "../workflow-template-card/data/templates.generated";
import type { TemplateGraph } from "../workflow-template-card/props";

export const NICK_LAUNCH_FPS = 30;
export const NICK_LAUNCH_W = 1920;
// 1200 to match Onur's launch-video canvas (16:10) that these screens graft into.
export const NICK_LAUNCH_H = 1200;

export type LaunchWorkflow = { template: TemplateGraph; prompt: string };

export const LAUNCH_WORKFLOWS: LaunchWorkflow[] = [
  { template: TEMPLATES["btc-buy-the-dip"], prompt: "Automate my BTC dip buying" },
  {
    template: TEMPLATES["multi-llm-consensus-trader-paper-trading"],
    prompt: "Trade on multi-LLM consensus",
  },
  {
    template: TEMPLATES["mag-7-stock-rotator-daily-paper-trading"],
    prompt: "Rotate the Magnificent 7 daily",
  },
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
