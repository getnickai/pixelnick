/**
 * Props for the NickAI OG cover template (`nickai-og-cover`).
 *
 * A reusable, parameterized 1200x630 cover image that reproduces the hand-made
 * getnick.ai/og.png as an editable template with two color themes and NO CTA.
 *
 * Layout: brand logo (mark + "NickAI" wordmark) top-left, a two-line display
 * headline and a one-line subhead on the left, and a rounded-corner panel
 * cropping a blue wave image on the right. The `light` theme pixel-matches the
 * reference; `dark` is the same layout in a zinc-950 skin with the dark wave.
 *
 * Must be JSON-serializable (Remotion v4 requirement).
 */
import {
  defaultNickaiOgShapeId,
  type NickaiOgShapeId,
} from "./shapes";

export type NickaiOgCoverTheme = "light" | "dark";
export type NickaiOgCoverVariant = "primary" | "secondary";
export type NickaiOgShapeSize = "small" | "default" | "large";

export type NickaiOgCoverProps = {
  /** Color skin. "light" reproduces og.png; "dark" is the zinc-950 variant. */
  theme: NickaiOgCoverTheme;
  /** Layout family. Secondary starts as a duplicate and can evolve safely. */
  variant: NickaiOgCoverVariant;
  /** Square-normalised artwork displayed in the right-side panel. */
  shapeId: NickaiOgShapeId;
  /** Display size of the selected artwork. */
  shapeSize: NickaiOgShapeSize;
  /** The single line of cover text. One sentence, no subtext; the rest of the
   * context lives in the post/blog, not on the cover card. */
  headline: string;
};

export const nickaiOgCoverDefaultProps: NickaiOgCoverProps = {
  theme: "light",
  variant: "primary",
  shapeId: defaultNickaiOgShapeId,
  shapeSize: "default",
  headline:
    "Prediction Market Automation: AI Bots, Agents & Tools Compared (2026)",
};
