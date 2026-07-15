/** Server-safe timing for the expanded PR #91 product-cut variation. */
export const LAUNCH_VIDEO_PR91_WIDTH = 1920;
export const LAUNCH_VIDEO_PR91_HEIGHT = 1200;
export const LAUNCH_VIDEO_PR91_FPS = 30;

export const LAUNCH_VIDEO_TIMELINE = {
  // The current launch-video is nested and cropped before its Execute finale.
  core: { from: 0, durationInFrames: 638 },
  workflowMontage: {
    from: 628,
    durationInFrames: 156,
    intro: { start: 0, duration: 10 },
    swap2: { start: 6, duration: 12 },
    build2: { start: 20, duration: 22 },
    swap3: { start: 74, duration: 12 },
    build3: { start: 88, duration: 22 },
    outro: { start: 146, duration: 10 },
  },
  productShell: {
    from: 777,
    durationInFrames: 96,
    canvas: { start: 0, duration: 10 },
    shell: { start: 8, duration: 16 },
    intro: { start: 22, duration: 10 },
    cards: { start: 30, stagger: 12, duration: 14 },
    outro: { start: 86, duration: 10 },
  },
  execution: {
    from: 861,
    durationInFrames: 196,
    button: { start: 6, duration: 14 },
    cursor: { start: 22, duration: 16 },
    click: { start: 42, duration: 9 },
    logsOpen: { start: 50, duration: 16 },
    scroll: { start: 62, duration: 56 },
    finish: { start: 118, duration: 20 },
    confirm: { start: 134, duration: 20 },
    fadeUX: { start: 162, duration: 24 },
    outro: { start: 188, duration: 8 },
  },
  finale: {
    from: 1049,
    durationInFrames: 344,
    grid: { start: 20, stagger: 4, duration: 14 },
    soften: { start: 92, duration: 16 },
    statement: { start: 130, duration: 18 },
    logo: { start: 218, duration: 26 },
    cta: { start: 250, stagger: 2, duration: 14 },
    url: { start: 262, duration: 12 },
    outro: { start: 332, duration: 12 },
  },
} as const;

export const LAUNCH_VIDEO_PR91_DURATION =
  LAUNCH_VIDEO_TIMELINE.finale.from +
  LAUNCH_VIDEO_TIMELINE.finale.durationInFrames;
