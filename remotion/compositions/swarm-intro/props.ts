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
};

export const swarmIntroDefaultProps: SwarmIntroProps = {
  wordmark: "Swarm Arena",
};
