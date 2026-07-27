import {
  AbsoluteFill,
  interpolate,
  OffthreadVideo,
  Series,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { NickIntroComposition } from "../nick-intro/composition";
import { NickOutroComposition } from "../nick-outro/composition";
import type { Wrapper16x9Props } from "./props";
import {
  WRAPPER_16_9_INTRO_DURATION,
  WRAPPER_16_9_OUTRO_DURATION,
} from "./timeline";

const isAbsoluteUrl = (src: string) =>
  /^https?:\/\//i.test(src) || src.startsWith("data:") || src.startsWith("blob:");

/** Body fade lengths at 30fps: ~0.4s up, ~0.5s down. Applied to picture AND sound. */
const BODY_FADE_IN = 12;
const BODY_FADE_OUT = 15;

/**
 * The wrapped video, fading up from black (picture + audio) as it enters and
 * back to black as it hands off to the outro. `useCurrentFrame()` here is local
 * to the body Series.Sequence (0 … durationInFrames-1), and OffthreadVideo's
 * `volume` callback gets the same sequence-local frame — so one curve drives
 * both the opacity and the audio gain.
 */
const BodyVideo: React.FC<{ src: string; durationInFrames: number }> = ({
  src,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  // Skip the fade on a body too short to hold both ramps (keeps interpolate's
  // input range strictly increasing).
  const hasFade = durationInFrames >= BODY_FADE_IN + BODY_FADE_OUT + 1;
  const fadeCurve = (f: number) =>
    hasFade
      ? interpolate(
          f,
          [
            0,
            BODY_FADE_IN,
            durationInFrames - BODY_FADE_OUT,
            durationInFrames,
          ],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        )
      : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <OffthreadVideo
        src={src}
        volume={fadeCurve}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          opacity: fadeCurve(frame),
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Wrapper 16:9 — Nick Intro → wrapped video → Nick Outro, concatenated on a
 * single 1920×1080 @ 30fps timeline via `<Series>`.
 *
 * The body plays through `<OffthreadVideo>` (frame-accurate in the headless
 * renderer), centred with `object-fit: contain` on a black stage so a source
 * that is not exactly 16:9 is letterboxed rather than stretched. It fades up
 * from / down to black (picture + audio) at the two seams so the branded ends
 * join the video cleanly instead of hard-cutting.
 */
export const Wrapper16x9Composition: React.FC<Wrapper16x9Props> = ({
  videoSrc,
  bodyDurationInFrames,
  introTagline,
  ctaHeadline,
  ctaUrl,
}) => {
  const body = Math.max(1, Math.round(bodyDurationInFrames));
  const src = isAbsoluteUrl(videoSrc) ? videoSrc : staticFile(videoSrc);

  return (
    <AbsoluteFill style={{ backgroundColor: "#050608" }}>
      <Series>
        <Series.Sequence durationInFrames={WRAPPER_16_9_INTRO_DURATION}>
          <NickIntroComposition tagline={introTagline} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={body}>
          <BodyVideo src={src} durationInFrames={body} />
        </Series.Sequence>

        <Series.Sequence durationInFrames={WRAPPER_16_9_OUTRO_DURATION}>
          <NickOutroComposition ctaHeadline={ctaHeadline} ctaUrl={ctaUrl} />
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
