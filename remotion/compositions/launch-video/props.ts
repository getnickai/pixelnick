/** JSON-serializable inputs for the Launch Video composition. */
export type LaunchVideoProps = {
  /** Opening statement revealed character-by-character. */
  headline: string;
  /** White lead-in for the second product statement. */
  productHeadline: string;
  /** Brand-blue emphasis in the second product statement. */
  productHeadlineAccent: string;
  /** Supporting copy under the second product statement. */
  productSubline: string;
  /** Prompt typed into the launch video's chat composer sequence. */
  chatPrompt: string;
  /** Workflow request typed after the first market-data response. */
  workflowPrompt: string;
  /** Final call-to-action shown after executing the workflow. */
  ctaHeadline: string;
  /** Final product URL. */
  ctaUrl: string;
  /** Music bed path under public/ (swap to compare soundtracks). */
  musicTrack: string;
  /** Keep the preserved icon field available for later launch-video scenes. */
  showBackgroundIcons: boolean;
};

export const launchVideoDefaultProps: LaunchVideoProps = {
  headline: "Introducing Nick",
  productHeadline: "Nick trades",
  productHeadlineAccent: "anything",
  productSubline: "Crypto, stocks, prediction markets. One agent.",
  chatPrompt: "Pull NVDA, price and the daily chart",
  workflowPrompt:
    "Create a workflow to buy $50 of shares every 12 hours when NVDA is below $200. Use my paper trading wallet",
  ctaHeadline: "Try it for free now",
  ctaUrl: "getnick.ai",
  musicTrack: "audio/nick-performance-highlight.mp3",
  showBackgroundIcons: false,
};
