import { createTimeline, stagger } from "animejs";

// The default four-word tagline settles at 2,825ms. Pulling the coordinated
// outro forward by 495ms leaves a 250ms readable hold before it exits.
const OUTRO_SHIFT_MS = 495;

export type NickIntroSceneState = {
  glowOpacity: number;
  glowScale: number;
  gridOpacity: number;
};

export type NickIntroMarkState = {
  opacity: number;
  whiteOpacity: number;
  x: number;
  y: number;
  scale: number;
  rotate: number;
  blur: number;
};

export type NickIntroWordmarkState = {
  opacity: number;
  x: number;
  blur: number;
};

export type NickIntroWordState = {
  opacity: number;
  y: number;
  blur: number;
  tracking: number;
};

export type NickIntroAnimation = {
  timeline: ReturnType<typeof createTimeline>;
  scene: NickIntroSceneState;
  mark: NickIntroMarkState;
  wordmark: NickIntroWordmarkState;
  words: NickIntroWordState[];
};

/**
 * Anime.js owns the choreography, while Remotion owns time. The timeline never
 * autoplays: the composition seeks it to the exact millisecond for each frame,
 * keeping Player scrubbing and headless rendering deterministic.
 */
export function createNickIntroAnimation(wordCount: number): NickIntroAnimation {
  const scene: NickIntroSceneState = {
    glowOpacity: 0,
    glowScale: 0.62,
    gridOpacity: 0,
  };

  // x=272.5 places the 144px mark at the centre of the 689px lockup stage.
  const mark: NickIntroMarkState = {
    opacity: 0,
    whiteOpacity: 1,
    x: 272.5,
    y: 10,
    scale: 3.2,
    rotate: -7,
    blur: 28,
  };

  const wordmark: NickIntroWordmarkState = {
    opacity: 0,
    x: -34,
    blur: 14,
  };

  const words: NickIntroWordState[] = Array.from(
    { length: wordCount },
    () => ({
      opacity: 0,
      y: 28,
      blur: 10,
      tracking: 10,
    }),
  );

  const timeline = createTimeline({
    autoplay: false,
    defaults: {
      ease: "outExpo",
    },
  });

  timeline
    // A quiet blue ignition establishes depth before the mark arrives.
    .add(
      scene,
      {
        glowOpacity: 0.78,
        glowScale: 1,
        duration: 1_000,
        ease: "outExpo",
      },
      0,
    )
    .add(
      scene,
      {
        gridOpacity: 0.4,
        duration: 800,
        ease: "outExpo",
      },
      120,
    )
    .add(
      mark,
      {
        opacity: 1,
        y: 0,
        scale: 1.42,
        rotate: -1,
        blur: 0,
        duration: 720,
        ease: "outExpo",
      },
      180,
    )
    .add(
      mark,
      {
        whiteOpacity: 0,
        duration: 640,
        ease: "outExpo",
      },
      260,
    )
    // The mark docks left and opens the exact NickAI vector wordmark.
    .add(
      mark,
      {
        x: 0,
        scale: 1,
        rotate: 0,
        duration: 600,
        ease: "inOutExpo",
      },
      900,
    )
    .add(
      wordmark,
      {
        opacity: 1,
        x: 0,
        blur: 0,
        duration: 700,
        ease: "outExpo",
      },
      1_200,
    )
    // Anime.js staggers each word, rather than treating the line as one block.
    .add(
      words,
      {
        opacity: 1,
        y: 0,
        blur: 0,
        tracking: 0.4,
        delay: stagger(85),
        duration: 720,
        ease: "outExpo",
      },
      1_850,
    )
    // A restrained hold lets the lockup read before the exit accelerates.
    .add(
      scene,
      {
        glowOpacity: 0.58,
        glowScale: 1.055,
        duration: 2_150,
        ease: "inOutSine",
      },
      1_000,
    )
    .add(
      scene,
      {
        gridOpacity: 0,
        glowOpacity: 0,
        glowScale: 1.2,
        duration: 1_200,
        ease: "inExpo",
      },
      3_150 - OUTRO_SHIFT_MS,
    )
    .add(
      words,
      {
        opacity: 0,
        y: -22,
        blur: 10,
        tracking: 4,
        delay: stagger(45),
        duration: 450,
        ease: "inExpo",
      },
      3_570 - OUTRO_SHIFT_MS,
    )
    .add(
      wordmark,
      {
        opacity: 0,
        x: 42,
        blur: 12,
        duration: 520,
        ease: "inExpo",
      },
      3_760 - OUTRO_SHIFT_MS,
    )
    // The mark returns to centre and exits with a restrained scale-down.
    .add(
      mark,
      {
        x: 272.5,
        y: 0,
        scale: 0.72,
        rotate: 6,
        blur: 3,
        opacity: 0,
        duration: 500,
        ease: "inExpo",
      },
      3_930 - OUTRO_SHIFT_MS,
    );

  return { timeline, scene, mark, wordmark, words };
}
