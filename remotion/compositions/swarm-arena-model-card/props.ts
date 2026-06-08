/**
 * Props for the animated SwarmArena Model Card composition.
 *
 * The card's data is currently hard-coded inside the composition (mirroring the
 * static `components/swarm-arena-model-card.tsx`). The only live input is the
 * count-up display style, shared with the Performance Card via the `/motion`
 * page's toggle. Kept JSON-serializable for Remotion `inputProps`.
 */
export type SwarmArenaModelCardProps = {
  /**
   * Numeric count-up style for PNL / profit. `true` (default) = slot-machine
   * slide; `false` = per-frame digit snap. Toggled live from the `/motion` page.
   */
  slide?: boolean;
};

export const swarmArenaModelCardDefaultProps: SwarmArenaModelCardProps = {
  slide: true,
};
