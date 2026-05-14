/**
 * Props for the animated Performance Card composition.
 *
 * Must be JSON-serializable (Remotion v4 requirement): no functions, no class
 * instances, no symbols. Strings, numbers, booleans, plain objects/arrays only.
 */
export type PerformanceCardProps = {
  agentName: string;
  /** PNL in USD, e.g. 4012.95 */
  pnl: number;
  /** Profit percent, e.g. 27.97 */
  profitPercent: number;
  runs: number;
  trades: number;
  builderName: string;
  /** Path under /public, e.g. "/figma/avatar-franklin.png" */
  builderAvatar: string;
  /** Pre-formatted display string, e.g. "16 Mar 17,2026" */
  activeSince: string;
  nodes: number;
  /** Pre-formatted display string, e.g. "6h 2m" */
  nextRun: string;
  /**
   * Numeric count-up style. `true` (default) = slot-machine slide;
   * `false` = simple per-frame digit snap (web counter style).
   * Toggled live from the `/motion` page via the vertical icon toggle
   * next to the Player.
   */
  slide?: boolean;
};

/**
 * Sample data used as `defaultProps` in the registry. Mirrors the values
 * currently hard-coded in the static `components/ai-ready-card.tsx`.
 */
export const performanceCardDefaultProps: PerformanceCardProps = {
  agentName: "Mag 7 Rotator V2 — Rotation 25% Cap",
  pnl: 4012.95,
  profitPercent: 27.97,
  runs: 12,
  trades: 26,
  builderName: "Franklin",
  builderAvatar: "/figma/avatar-franklin.png",
  activeSince: "16 Mar 17,2026",
  nodes: 9,
  nextRun: "6h 2m",
  slide: true,
};
