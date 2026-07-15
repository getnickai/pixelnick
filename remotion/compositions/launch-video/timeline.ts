/**
 * Shared, server-safe timing and canvas metadata for the Launch Video.
 *
 * Keep sequence boundaries here so future scenes can extend the composition
 * without coupling the manifest to React or Remotion imports.
 */
export const LAUNCH_VIDEO_WIDTH = 1920;
export const LAUNCH_VIDEO_HEIGHT = 1200;
export const LAUNCH_VIDEO_FPS = 30;

// ── Finale grid layout ───────────────────────────────────────────────────────
// Shared so the execution beat can pre-place the AAPL confirmation at its EXACT
// final resting slot (so there is no move at the execution → finale hand-off).
// The middle row of three widgets shares one height; each width follows its card
// aspect; the four-workflow rows above/below span the same width + edges.
const FG_MID_H = 360;
const FG_MID_GAP = 48;
const FG_ASPECT = { portfolio: 1.15, trade: 1.74, price: 1.271 };
const FG_WP = Math.round(FG_MID_H * FG_ASPECT.portfolio); // 414
const FG_WA = Math.round(FG_MID_H * FG_ASPECT.trade); // 626
const FG_WS = Math.round(FG_MID_H * FG_ASPECT.price); // 458
const FG_ROW_W = FG_WP + FG_WA + FG_WS + FG_MID_GAP * 2; // 1594
const FG_LEFT = Math.round((1920 - FG_ROW_W) / 2); // 163
const FG_WF_GAP = 22;
export const FINALE_GRID = {
  midH: FG_MID_H,
  midGap: FG_MID_GAP,
  // Whole arrangement sits low enough that the top-left NickAI lockup never
  // overlaps the first workflow card (free space at the bottom absorbs it).
  midCy: 540,
  wPortfolio: FG_WP,
  wAapl: FG_WA,
  wSpacex: FG_WS,
  rowW: FG_ROW_W,
  left: FG_LEFT,
  cxPortfolio: FG_LEFT + FG_WP / 2,
  cxAapl: FG_LEFT + FG_WP + FG_MID_GAP + FG_WA / 2,
  cxSpacex: FG_LEFT + FG_WP + FG_MID_GAP + FG_WA + FG_MID_GAP + FG_WS / 2,
  wfGap: FG_WF_GAP,
  wfW: (FG_ROW_W - FG_WF_GAP * 3) / 4, // 382
  wfH: 214,
  topY: 116,
  botY: 750,
  bandTop: 1008,
} as const;

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
    durationInFrames: 90,
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
      // The box appears, then holds ~0.4s (12f) before typing begins.
      start: 23,
      duration: 36,
    },
    send: {
      // Typing completes at frame 59; the cursor travels and clicks Send.
      start: 72,
      duration: 10,
    },
    outro: {
      // Begins on the exact frame the click ripple completes.
      start: 82,
      duration: 6,
    },
  },
  chatResponse: {
    // Starts as soon as the composer click ripple completes. Durations mirror
    // the first result-thread beat in NicksiteV2 at playbackRate: 2.
    from: 202,
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
    from: 290,
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
    from: 373,
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
    from: 478,
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
    from: 576,
    // +30f (1s) of extra hold so each fully-built workflow lingers on screen.
    durationInFrames: 186,
    intro: { start: 0, duration: 10 },
    swap2: { start: 6, duration: 12 }, // prompt swaps to workflow #2
    build2: { start: 20, duration: 22 }, // workflow #2 finalizes (fast pop)
    swap3: { start: 89, duration: 12 }, // prompt swaps to workflow #3 (+15 hold on A)
    build3: { start: 103, duration: 22 }, // workflow #3 finalizes
    outro: { start: 176, duration: 10 }, // +15 hold on B before handoff
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
    // Shifted +30 (montage got longer). Ends exactly on execution.from (869) —
    // NO overlap (that overlap was the residual s24 blink). The dock is also
    // slowed by ~1s (see beat-product-shell) so the workflow slide reads clearly.
    from: 755,
    durationInFrames: 114,
    // Workflow-first: the docked workflow canvas settles in immediately (it is
    // the montage graph arriving at its final position), THEN the product UX
    // wipes in around it (chat rail + panel), then the thread + cards stream.
    canvas: { start: 0, duration: 10 }, // workflow settles in the right pane first
    shell: { start: 40, duration: 16 }, // chat rail + panel wipe in (after the slow dock)
    intro: { start: 58, duration: 10 }, // assistant line
    cards: { start: 68, stagger: 12, duration: 14 }, // spacex, nvda, portfolio
    outro: { start: 104, duration: 10 },
  },
  execution: {
    // The full product UX is visible, then a big blue "Execute" button appears
    // in the middle. The pointer clicks it → the camera zooms into the canvas as
    // the workflow nodes turn green and the Execution Logs stream → the run
    // completes → the camera pulls back and a "Workflow executed successfully"
    // banner + an AAPL trade-fill confirmation card animate in → the product UX
    // fades to dark around the trade card, handing off to the finale grid.
    from: 869,
    durationInFrames: 196,
    button: { start: 6, duration: 14 }, // blue Execute button fades in, centered
    cursor: { start: 22, duration: 16 }, // pointer moves to the button
    click: { start: 42, duration: 9 }, // click -> triggers the run
    logsOpen: { start: 50, duration: 16 }, // logs panel opens, nodes start going green
    scroll: { start: 62, duration: 56 }, // rows stream + nodes green; camera zoomed on canvas
    finish: { start: 118, duration: 20 }, // all nodes green; camera pulls back to center
    confirm: { start: 134, duration: 20 }, // success banner + AAPL trade card in
    fadeUX: { start: 162, duration: 24 }, // product UX fades to dark around the trade card
    outro: { start: 188, duration: 8 },
  },
  executeFinale: {
    // The finale opens on the AAPL confirmation centered (handed off, still lit,
    // from the execution beat). Workflows assemble in rows above/below, the
    // price/portfolio widgets flank it, and the supported-venue logos band sits
    // beneath. The wall then softens + fades, a two-line strategy statement
    // resolves, and finally the NickAI lockup + CTA.
    // Shifted +60 (montage +30, dock +30). Extended +78 for the "Backed by
    // Galaxy" credit that now plays between the lockup and the CTA.
    from: 1057,
    durationInFrames: 437,
    grid: {
      // The workflows + widgets stagger in around the centered AAPL card.
      start: 20,
      stagger: 4,
      duration: 14,
    },
    soften: {
      // The settled full wall HOLDS (+0.5s), then fades out in ONE smooth eased
      // ramp (30f) — dim + desaturate + fade together, no two-stage hitch.
      start: 107,
      duration: 30,
    },
    statement: {
      // Two lines resolve one AFTER the other: line 1 ("Describe any strategy
      // you want") first, then line 2 ("Nick builds, tests and runs it for you").
      start: 145,
      duration: 16,
      line2Start: 171,
      line2Duration: 16,
    },
    logo: {
      start: 233,
      duration: 26,
    },
    galaxy: {
      // "Backed by Galaxy" credit: fades in after the lockup resolves, holds,
      // then retires as the CTA fades in.
      start: 267,
      duration: 18,
      out: 331,
      outDuration: 14,
    },
    cta: {
      start: 351,
      stagger: 2,
      duration: 14,
    },
    url: {
      start: 363,
      duration: 12,
    },
    outro: {
      start: 425,
      duration: 12,
    },
  },
} as const;

export const LAUNCH_VIDEO_DURATION =
  LAUNCH_VIDEO_TIMELINE.executeFinale.from +
  LAUNCH_VIDEO_TIMELINE.executeFinale.durationInFrames;
