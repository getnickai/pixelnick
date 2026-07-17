/**
 * Props for the NickAI social card (STA-473) — the free-wave brand frame for
 * the weekly X content calendar (distinct from `nickai-og-cover`, which crops
 * the wave into a rounded panel). Light + dark skins; no footer CTA.
 *
 * Must be JSON-serializable (Remotion v4 requirement).
 */
export type NickaiSocialCardTheme = "light" | "dark";

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
  /** Color skin. "dark" is the classic zinc-950 card; "light" is the slate-50 twin. */
  theme?: NickaiSocialCardTheme;
  /**
   * Series label for text-card covers. Canonical set:
   * "Product drop" | "Trading guide" | "Trading analysis" | "Trading insights".
   * Blog posts are not a series — they inherit one of the four above.
   */
  eyebrow: string;
  headline: string;
  /**
   * @deprecated Subtext removed from the card so the title carries the card;
   * the supporting copy lives in the post/thread. Kept optional so older props
   * JSON still parses; ignored at render time.
   */
  subline?: string;
  /**
   * @deprecated Series label is `eyebrow` (rendered as the sole chip under
   * the subline). Kept optional so older props JSON still parses; ignored.
   */
  chips?: string[];
  fill?: NickaiSocialCardFill;
  /**
   * @deprecated Footer removed from the layout; kept optional so older props
   * JSON still parses. Ignored at render time.
   */
  meta?: string;
  /** Wave motif for stills: 1 = the silk wave, 0 hides it. MP4 always uses the
   * baked silk loop. (The old line-fan variant `2` was removed.) */
  wave?: 0 | 1;
  /**
   * false/undefined → PNG still (settled).
   * true → MP4 with the baked landing-page silk loop behind settled/entering copy.
   */
  animate?: boolean;
};

export const nickaiSocialCardDefaultProps: NickaiSocialCardProps = {
  theme: "dark",
  eyebrow: "Product drop",
  headline: "Trade the same event across Kalshi and Polymarket from one workflow",
  subline:
    "Confidence-gated venue matching finds the same market on both books and routes the better price.",
  chips: [],
  fill: { kind: "none" },
  wave: 1,
  animate: false,
};
