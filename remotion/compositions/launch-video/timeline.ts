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
    durationInFrames: 110,
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
      // Typing completes at frame 47. Hold the completed prompt cleanly for
      // 36 frames (1.2s), then let the cursor enter and travel for 10 frames.
      start: 93,
      duration: 10,
    },
    outro: {
      // Begins on the exact frame the click ripple completes.
      start: 103,
      duration: 6,
    },
  },
  chatResponse: {
    // Starts as soon as the composer click ripple completes. Durations mirror
    // the first result-thread beat in NicksiteV2 at playbackRate: 2.
    from: 225,
    durationInFrames: 95,
    shell: {
      start: 0,
      duration: 10,
    },
    userMessage: {
      start: 0,
      duration: 8,
    },
    reasoning: {
      start: 20,
      duration: 7,
    },
    resultCard: {
      start: 31,
      duration: 10,
    },
    chartFill: {
      start: 36,
      duration: 11,
    },
    chartLine: {
      start: 33,
      duration: 23,
    },
    outro: {
      start: 82,
      duration: 8,
    },
  },
  workflowComposer: {
    // NicksiteV2's second focus/typing beat. The original 3400ms type-on runs
    // at playbackRate 2, which maps to 51 frames at 30fps.
    from: 313,
    durationInFrames: 138,
    shell: {
      start: 0,
      duration: 10,
    },
    focus: {
      start: 4,
      duration: 5,
    },
    placeholder: {
      start: 0,
      duration: 1,
    },
    typing: {
      start: 6,
      duration: 51,
    },
    send: {
      // The long request completes at frame 57. Give it a 54-frame (1.8s)
      // cursor-free reading hold before the pointer approaches Send.
      start: 121,
      duration: 10,
    },
    outro: {
      // Begins on the exact frame the click ripple completes.
      start: 131,
      duration: 6,
    },
  },
  workflowResponse: {
    // Workflow-thread responses only. Sidebar/panel/node reveals deliberately
    // remain out of this sequence so they can become the next product beat.
    from: 444,
    durationInFrames: 112,
    shell: {
      start: 0,
      duration: 10,
    },
    userMessage: {
      start: 0,
      duration: 8,
    },
    beforeCreationSteps: {
      start: 20,
      stagger: 4,
      duration: 7,
    },
    createdWorkflow: {
      start: 32,
      duration: 8,
    },
    afterCreationSteps: {
      start: 45,
      stagger: 4,
      duration: 7,
    },
    outro: {
      start: 96,
      duration: 8,
    },
  },
  workflowBuild: {
    // The workflow canvas begins while the response thread is completing its
    // fast fade, keeping the creation result and visual build in one motion.
    from: 548,
    durationInFrames: 105,
    shell: {
      start: 0,
      duration: 11,
    },
    header: {
      start: 2,
      duration: 10,
    },
    nodes: {
      // Each node begins only after the connector leading into it has
      // completed: node → connector → node → connector.
      start: 8,
      stagger: 20,
      duration: 12,
    },
    edges: {
      start: 20,
      stagger: 20,
      duration: 8,
    },
    outro: {
      start: 90,
      duration: 10,
    },
  },
  executeFinale: {
    // The button enters while the workflow canvas is completing its outro.
    // Its click is the transition: button -> energy core -> NickAI lockup.
    from: 638,
    durationInFrames: 148,
    button: {
      start: 3,
      duration: 13,
    },
    cursor: {
      start: 19,
      duration: 15,
    },
    click: {
      start: 34,
      duration: 9,
    },
    logo: {
      // The pill completes its pressed state, shrinks into a circle, then the
      // mark and wordmark assemble in two distinct beats.
      start: 58,
      duration: 24,
    },
    cta: {
      start: 92,
      stagger: 2,
      duration: 12,
    },
    url: {
      start: 104,
      duration: 11,
    },
    outro: {
      start: 137,
      duration: 10,
    },
  },
} as const;

export const LAUNCH_VIDEO_DURATION =
  LAUNCH_VIDEO_TIMELINE.executeFinale.from +
  LAUNCH_VIDEO_TIMELINE.executeFinale.durationInFrames;
