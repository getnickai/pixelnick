/** Server-safe timing for the expanded PR #91 product-cut variation. */
export const LAUNCH_VIDEO_PR91_WIDTH = 1920;
export const LAUNCH_VIDEO_PR91_HEIGHT = 1200;
export const LAUNCH_VIDEO_PR91_FPS = 30;

export const LAUNCH_VIDEO_TIMELINE = {
  // The current launch-video is nested and cropped before its Execute finale.
  core: {
    from: 0,
    durationInFrames: 658,
    freezeAt: 634,
    hold: { start: 634, duration: 12 },
    outro: { start: 646, duration: 12 },
  },
  workflowMontage: {
    from: 658,
    durationInFrames: 380,
    intro: { start: 0, duration: 10 },
    swap2: { start: 6, duration: 12 },
    type2: { start: 8, duration: 38 },
    // The centered composer clicks first, then docks after its spring rebound.
    dock2: { start: 82, duration: 16 },
    build2: { start: 98, duration: 72 },
    swap3: { start: 190, duration: 14 },
    type3: { start: 204, duration: 38 },
    build3: { start: 272, duration: 72 },
    outro: { start: 368, duration: 12 },
  },
  productShell: {
    from: 1038,
    durationInFrames: 96,
    canvas: { start: 0, duration: 10 },
    shell: { start: 8, duration: 16 },
    intro: { start: 22, duration: 10 },
    cards: { start: 30, stagger: 12, duration: 14 },
    outro: { start: 86, duration: 10 },
  },
  execution: {
    from: 1122,
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
    from: 1310,
    durationInFrames: 420,
    grid: {
      start: 20,
      stagger: 4,
      duration: 14,
      // Mirror the entrance cadence so the wall resolves item by item before
      // the venue band takes over, instead of disappearing as one flat layer.
      outro: { start: 94, stagger: 1.5, duration: 10 },
    },
    soften: { start: 92, duration: 16 },
    venues: {
      start: 124,
      duration: 14,
      logos: { start: 136, stagger: 3, duration: 14 },
      outro: {
        start: 180,
        stagger: 1.8,
        duration: 9,
        titleDelay: 14,
        titleDuration: 11,
      },
    },
    statement: { start: 206, duration: 18 },
    sponsor: { start: 276, duration: 14 },
    logo: { start: 294, duration: 26 },
    cta: { start: 326, stagger: 2, duration: 14 },
    url: { start: 338, duration: 12 },
    outro: { start: 408, duration: 12 },
  },
} as const;

export const LAUNCH_VIDEO_PR91_DURATION =
  LAUNCH_VIDEO_TIMELINE.finale.from +
  LAUNCH_VIDEO_TIMELINE.finale.durationInFrames;
