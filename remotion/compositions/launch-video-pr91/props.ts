import {
  launchVideoDefaultProps,
  type LaunchVideoProps,
} from "../launch-video/props";

/** Text inputs shared with the original Launch Video. Product data is fixed. */
export type LaunchVideoProductCutProps = LaunchVideoProps;

export const launchVideoProductCutDefaultProps: LaunchVideoProductCutProps = {
  ...launchVideoDefaultProps,
  chatPrompt: "Pull NVDA price and give me the daily chart",
  ctaHeadline: "Try it for free now",
  ctaUrl: "getnick.ai",
};
