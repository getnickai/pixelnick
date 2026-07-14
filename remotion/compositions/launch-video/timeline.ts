/**
 * Shared, server-safe timing and canvas metadata for the Launch Video.
 *
 * Keep sequence boundaries here so future scenes can extend the composition
 * without coupling the manifest to React or Remotion imports.
 */
export const LAUNCH_VIDEO_WIDTH = 1920;
export const LAUNCH_VIDEO_HEIGHT = 1200;
export const LAUNCH_VIDEO_FPS = 30;

export const LAUNCH_VIDEO_TIMELINE = {
  opening: {
    from: 0,
    durationInFrames: 75,
    icons: {
      start: 0,
      stagger: 0.7,
      duration: 12,
      outroStart: 54,
      outroStagger: 0.18,
      outroDuration: 6,
    },
    headline: {
      start: 5,
      stagger: 0.5,
      duration: 13,
      // The final intro glyph settles at frame 25, giving an exact 30-frame
      // (1-second) readable hold before the headline outro begins.
      outroStart: 55,
      outroStagger: 0.18,
      outroDuration: 6,
    },
  },
  productStatement: {
    // Starts as the last opening glyphs finish accelerating left. The slight
    // overlap preserves one continuous product-film move without letting the
    // two centred statements visibly collide.
    from: 63,
    durationInFrames: 66,
    title: {
      start: 0,
      stagger: 2.2,
      duration: 11,
    },
    subline: {
      start: 8,
      stagger: 0.8,
      duration: 10,
    },
    // With the default six-word subline, the last word finishes at local
    // frame 22, followed by an exact 30-frame (1-second) readable hold.
    outro: {
      start: 52,
      duration: 7,
    },
  },
  chatComposer: {
    // Begins as the last product-statement words complete their fast exit.
    from: 122,
    durationInFrames: 78,
    shell: {
      start: 0,
      duration: 12,
    },
    focus: {
      start: 7,
      duration: 8,
    },
    placeholder: {
      start: 9,
      duration: 5,
    },
    typing: {
      start: 11,
      duration: 36,
    },
    send: {
      start: 43,
      duration: 10,
    },
    outro: {
      start: 66,
      duration: 8,
    },
  },
} as const;

export const LAUNCH_VIDEO_DURATION =
  LAUNCH_VIDEO_TIMELINE.chatComposer.from +
  LAUNCH_VIDEO_TIMELINE.chatComposer.durationInFrames;
