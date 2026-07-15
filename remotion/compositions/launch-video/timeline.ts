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
    // Half of one continuous reflow: "Introducing Nick" lands centered, then
    // "Introducing" collapses out while "Nick" slides left and "trades" +
    // "anything" expand in to its right, settling as "Nick trades anything".
    // ProductStatement (below) picks up that settled title seamlessly.
    from: 0,
    durationInFrames: 78,
    icons: {
      start: 0,
      stagger: 0.7,
      duration: 12,
      outroStart: 54,
      outroStagger: 0.18,
      outroDuration: 6,
    },
    // Local-frame beats for the reflow choreography (absolute within this beat).
    reflow: {
      // "Introducing Nick" pops in centered.
      enterStart: 4,
      enterDuration: 14,
      // "Introducing" collapses + fades; "Nick" slides left (layout-driven).
      collapseStart: 30,
      collapseDuration: 18,
      // "trades" + "anything" expand + fade in to the right of "Nick".
      expandStart: 38,
      expandDuration: 20,
    },
  },
  productStatement: {
    // Second half of the same continuous reflow: opens on the already-settled
    // "Nick trades anything" (identical layout to where opening handed off, so
    // the overlap is seamless), reveals the subline, holds, then exits.
    from: 66,
    durationInFrames: 62,
    subline: {
      start: 6,
      stagger: 0.8,
      duration: 10,
    },
    // Readable hold, then the whole title + subline group exits.
    outro: {
      start: 44,
      duration: 8,
    },
  },
  chatComposer: {
    // Begins as the product-statement title exits.
    from: 120,
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
      // Typing completes at frame 47. Cut the dead hold: the cursor enters and
      // travels almost immediately, clicking Send at ~frame 60.
      start: 60,
      duration: 10,
    },
    outro: {
      // Begins on the exact frame the click ripple completes.
      start: 70,
      duration: 6,
    },
  },
  chatResponse: {
    // Starts as soon as the composer click ripple completes. Durations mirror
    // the first result-thread beat in NicksiteV2 at playbackRate: 2.
    from: 190,
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
    from: 278,
    durationInFrames: 90,
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
      // The long request completes at frame 57. Cut the dead hold: the pointer
      // approaches and clicks Send at ~frame 72.
      start: 72,
      duration: 10,
    },
    outro: {
      // Begins on the exact frame the click ripple completes.
      start: 82,
      duration: 6,
    },
  },
  workflowResponse: {
    // Workflow-thread responses only. Sidebar/panel/node reveals deliberately
    // remain out of this sequence so they can become the next product beat.
    from: 361,
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
    // A highlight-click on the "created workflow" widget card in the last
    // frames of the beat: cursor arrives, ripple + glow, brief scale-down press.
    widgetClick: {
      start: 78,
      duration: 16,
    },
    outro: {
      start: 96,
      duration: 8,
    },
  },
  workflowBuild: {
    // The workflow canvas begins while the response thread is completing its
    // fast fade, keeping the creation result and visual build in one motion.
    from: 466,
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
  // ── Grafted product beats (STA-494): montage → grid → product shell →
  // execution logs. Each starts a few frames before the previous ends so the
  // product-film motion never visibly stops. Sub-slots are local frames.
  workflowMontage: {
    // The NVDA hero build (workflowBuild) is workflow #1. Here two MORE
    // workflows finalize fast: swap the composer prompt, the new graph pops in
    // already-built (no slow node-by-node build), twice.
    from: 564,
    durationInFrames: 156,
    intro: { start: 0, duration: 10 },
    swap2: { start: 6, duration: 12 }, // prompt swaps to workflow #2
    build2: { start: 20, duration: 22 }, // workflow #2 finalizes (fast pop)
    swap3: { start: 74, duration: 12 }, // prompt swaps to workflow #3
    build3: { start: 88, duration: 22 }, // workflow #3 finalizes
    outro: { start: 146, duration: 10 },
  },
  // Deprecated: the standalone three-workflow grid beat has been folded into the
  // finale (executeFinale now opens on a four-workflow grid). This slot is no
  // longer sequenced in the composition; it remains only so the now-unused
  // beat-grid.tsx module keeps type-checking.
  workflowGrid: {
    from: 794,
    durationInFrames: 96,
    shell: { start: 0, duration: 12 },
    cards: { start: 4, stagger: 5, duration: 14 },
    tagline: { start: 30, duration: 14 },
    outro: { start: 86, duration: 10 },
  },
  productShell: {
    // Match-cut: the hero workflow docks into the right builder pane while the
    // chat rail wipes in from the left and the widget cards stream into the
    // thread (SpaceX + NVDA price cards, then the portfolio card). Trimmed hold:
    // the UX settles then hands straight to the execution zoom (no long linger).
    from: 713,
    durationInFrames: 92,
    shell: { start: 0, duration: 14 }, // panels wipe in
    canvas: { start: 2, duration: 16 }, // workflow settles in the right pane
    intro: { start: 16, duration: 10 }, // assistant line
    cards: { start: 22, stagger: 12, duration: 14 }, // spacex, nvda, portfolio
    outro: { start: 82, duration: 10 },
  },
  execution: {
    // The full product UX is briefly visible, then the camera pushes onto the
    // top-right "Run Now" control → it presses → the Execution Logs panel opens
    // and rows stream → the run completes: the camera pulls back to center and a
    // "Workflow executed successfully" banner + an AAPL trade-fill confirmation
    // card animate in on top.
    from: 797,
    durationInFrames: 176,
    zoomIn: { start: 0, duration: 16 }, // camera pushes toward Run Now
    press: { start: 14, duration: 8 }, // Run Now clicked
    logsOpen: { start: 22, duration: 16 }, // logs panel slides up, nodes light
    scroll: { start: 40, duration: 60 }, // rows stream up while running
    finish: { start: 100, duration: 22 }, // run completes; camera pulls back to center
    confirm: { start: 118, duration: 20 }, // success banner + AAPL trade card in
    outro: { start: 166, duration: 10 },
  },
  executeFinale: {
    // The finale opens on the hero workflow (NVDA) large + centered; it then
    // flies to its top-left slot while the other seven workflows populate a
    // 2-row × 4-col grid around it. The whole grid then softens (contrast down)
    // and the Execute button layers in on top. Its click is the transition:
    // grid + button -> energy core -> NickAI lockup + CTA.
    from: 965,
    durationInFrames: 262,
    heroIn: {
      // Hero workflow enters large + centered.
      start: 2,
      duration: 16,
    },
    heroFly: {
      // Hero flies from center to its top-left grid slot.
      start: 18,
      duration: 24,
    },
    grid: {
      // The other seven cards stagger in (both rows) as the hero flies.
      start: 22,
      stagger: 5,
      duration: 16,
    },
    soften: {
      // The settled grid dims + desaturates so the button reads on top.
      start: 58,
      duration: 14,
    },
    button: {
      // Layers in on top of the softened grid, screen-centered.
      start: 62,
      duration: 14,
    },
    cursor: {
      start: 84,
      duration: 16,
    },
    click: {
      start: 106,
      duration: 9,
    },
    logo: {
      start: 116,
      duration: 26,
    },
    cta: {
      start: 148,
      stagger: 2,
      duration: 14,
    },
    url: {
      start: 160,
      duration: 12,
    },
    outro: {
      start: 250,
      duration: 12,
    },
  },
} as const;

export const LAUNCH_VIDEO_DURATION =
  LAUNCH_VIDEO_TIMELINE.executeFinale.from +
  LAUNCH_VIDEO_TIMELINE.executeFinale.durationInFrames;
