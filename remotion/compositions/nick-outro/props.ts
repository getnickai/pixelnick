/** JSON-serializable inputs for the Nick Outro composition. */
export type NickOutroProps = {
  ctaHeadline: string;
  ctaUrl: string;
};

export const nickOutroDefaultProps: NickOutroProps = {
  ctaHeadline: "Try it for free now",
  ctaUrl: "getnick.ai",
};
