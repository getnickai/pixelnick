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
  /** Keep the preserved icon field available for later launch-video scenes. */
  showBackgroundIcons: boolean;
};

export const launchVideoDefaultProps: LaunchVideoProps = {
  headline: "Introducing Nick",
  productHeadline: "Nick trades",
  productHeadlineAccent: "anything",
  productSubline: "Crypto, stocks, prediction markets. One agent.",
  chatPrompt: "Pull NVDA — price and give me the daily chart",
  showBackgroundIcons: false,
};
