/**
 * Props for the Swarm Intro composition (animated SwarmArena logo sting).
 *
 * The visual design is fixed (Figma node 373:1485 in "NickAI — Social
 * Sharing"); the only input is the wordmark text so future variants (e.g.
 * localized or product-specific stings) can reuse the same choreography.
 * Kept JSON-serializable for Remotion `inputProps`.
 */
export type SwarmIntroProps = {
  /** Wordmark revealed letter-by-letter after the mark docks. */
  wordmark?: string;
  /**
   * Count-up display style for the Act 4 live-agent card (PNL / profit).
   * `true` (default) = slot-machine slide; `false` = per-frame digit snap.
   * Shared with the other compositions via the `/motion` page toggle.
   */
  slide?: boolean;
};

export const swarmIntroDefaultProps: SwarmIntroProps = {
  wordmark: "Swarm Arena",
  slide: true,
};
