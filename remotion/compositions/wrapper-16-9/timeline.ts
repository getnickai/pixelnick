/**
 * Wrapper 16:9 — timing constants.
 *
 * The bookend clips (Nick Intro + Nick Outro) are already 1920×1080 @ 30fps,
 * so the wrapper adopts the same canvas and framerate: intro → body → outro
 * concatenate with no reframing or resampling of the branded ends.
 *
 * The body (the wrapped video) has no fixed length — its frame count is
 * measured from the source file by `scripts/render-wrapper.ts` and passed in
 * as `bodyDurationInFrames`. `WRAPPER_16_9_DEFAULT_BODY_DURATION` is only the
 * placeholder used for the Studio preview before a real video is measured.
 */
import { NICK_INTRO_DURATION } from "../nick-intro/timeline";
import { NICK_OUTRO_DURATION } from "../nick-outro/timeline";

export const WRAPPER_16_9_WIDTH = 1920;
export const WRAPPER_16_9_HEIGHT = 1080;
export const WRAPPER_16_9_FPS = 30;

export const WRAPPER_16_9_INTRO_DURATION = NICK_INTRO_DURATION;
export const WRAPPER_16_9_OUTRO_DURATION = NICK_OUTRO_DURATION;

/** Studio-preview fallback for the body segment (5s @ 30fps). */
export const WRAPPER_16_9_DEFAULT_BODY_DURATION = 150;
