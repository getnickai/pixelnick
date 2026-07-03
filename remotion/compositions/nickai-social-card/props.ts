/**
 * Props for the NickAI social card (STA-473) — the brand frame for the weekly
 * X content calendar. Brand-dark variant of the V2 system: zinc-950 canvas,
 * #0178FF primary, Duplet headlines, Manrope UI, blue-wave motif.
 *
 * Must be JSON-serializable (Remotion v4 requirement).
 */
export type NickaiSocialCardFill =
  | {
      kind: "bigNumber";
      /** Pre-formatted display value, e.g. "+18.4%" or "24". */
      value: string;
      label: string;
      /** Small print under the label, e.g. period + data source. */
      caption?: string;
      /** Number color: brand blue (default), or semantic P&L green/red. */
      tone?: "accent" | "positive" | "negative";
    }
  | {
      /** Path under /public (e.g. "/nickai-social/illus.png") or a URL. */
      kind: "illustration";
      src: string;
    }
  | { kind: "none" };

export type NickaiSocialCardProps = {
  /** Series label, e.g. "NEW IN NICK", "BLUEPRINT", "LIVE RESULTS". */
  eyebrow: string;
  headline: string;
  subline?: string;
  /** Small pill labels, e.g. the enabling nodes. Keep to ≤3. */
  chips?: string[];
  fill?: NickaiSocialCardFill;
  /** Footer-left small print, e.g. source note. */
  meta?: string;
  /** Wave motif variant; 0 hides it. */
  wave?: 0 | 1 | 2;
  /** CP2 motion contract: false/undefined renders the settled still. */
  animate?: boolean;
};

export const nickaiSocialCardDefaultProps: NickaiSocialCardProps = {
  eyebrow: "New in Nick",
  headline: "Trade the same event across Kalshi and Polymarket from one workflow",
  subline:
    "Confidence-gated venue matching finds the same market on both books and routes the better price.",
  chips: ["Kalshi node", "Polymarket node"],
  fill: { kind: "none" },
  meta: "Nick v0.2.1",
  wave: 1,
  animate: false,
};
