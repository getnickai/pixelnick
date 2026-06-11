/**
 * Props for the animated SwarmArena Model Card composition.
 *
 * `data` drives the card values (name, logo, PNL, picks, …) — defaults to the
 * Figma sample inside the composition when omitted, so the /motion preview is
 * unchanged. The render pipeline passes a live deck agent mapped via
 * `lib/swarm-card-data` toCardData. `slide` is the count-up display style.
 * Kept JSON-serializable for Remotion `inputProps`.
 */
import type { SwarmArenaModelCardData } from "../../../components/swarm-arena-model-card";

export type SwarmArenaModelCardProps = {
  /** Card values. Omit to render the built-in Figma sample (GPT 5.5). */
  data?: SwarmArenaModelCardData;
  /**
   * Numeric count-up style for PNL / profit. `true` (default) = slot-machine
   * slide; `false` = per-frame digit snap. Toggled live from the `/motion` page.
   */
  slide?: boolean;
};

export const swarmArenaModelCardDefaultProps: SwarmArenaModelCardProps = {
  slide: true,
};
