import type { CalculateMetadataFunction } from "remotion";
import {
  WRAPPER_16_9_DEFAULT_BODY_DURATION,
  WRAPPER_16_9_INTRO_DURATION,
  WRAPPER_16_9_OUTRO_DURATION,
} from "./timeline";

/** JSON-serializable inputs for the Wrapper 16:9 composition. */
export type Wrapper16x9Props = {
  /**
   * The video to wrap. Either a `staticFile()`-relative path under `public/`
   * (e.g. "wrapper-input/clip.mp4") or an absolute `http(s):`/`data:` URL.
   */
  videoSrc: string;
  /**
   * Length of the wrapped video in frames at the composition fps (30). The
   * render script measures the source file and passes the real value; the
   * default is only the Studio-preview placeholder.
   */
  bodyDurationInFrames: number;
  /** Intro tagline (passed through to the Nick Intro bookend). */
  introTagline: string;
  /** Outro CTA headline + URL (passed through to the Nick Outro bookend). */
  ctaHeadline: string;
  ctaUrl: string;
};

export const wrapper16x9DefaultProps: Wrapper16x9Props = {
  // A shipped landscape clip so the Studio preview has something to play
  // before you point it at your own file via the render script.
  videoSrc: "workflow-templates/btc-buy-the-dip.mp4",
  bodyDurationInFrames: WRAPPER_16_9_DEFAULT_BODY_DURATION,
  introTagline: "The agentic trading platform",
  ctaHeadline: "Try it for free now",
  ctaUrl: "getnick.ai",
};

/**
 * Total runtime = intro + body + outro. Pure arithmetic on the props, so it
 * resolves identically in Studio and in the headless renderer (no async media
 * probe here — the render script measures the file and feeds the frame count).
 */
export const calcWrapper16x9Metadata: CalculateMetadataFunction<
  Wrapper16x9Props
> = ({ props }) => {
  const body = Math.max(1, Math.round(props.bodyDurationInFrames));
  return {
    durationInFrames:
      WRAPPER_16_9_INTRO_DURATION + body + WRAPPER_16_9_OUTRO_DURATION,
  };
};
