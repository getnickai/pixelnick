import { createTimeline, stagger } from "animejs";

export type NickOutroSceneState = {
  glowOpacity: number;
  glowScale: number;
  gridOpacity: number;
};

export type NickOutroLayerState = {
  opacity: number;
  y: number;
  scale: number;
  blur: number;
};

export type NickOutroMarkState = NickOutroLayerState & {
  x: number;
  rotate: number;
};

export type NickOutroWordmarkState = {
  opacity: number;
  x: number;
  blur: number;
};

export type NickOutroWordState = NickOutroLayerState & {
  tracking: number;
};

export type NickOutroAnimation = {
  timeline: ReturnType<typeof createTimeline>;
  scene: NickOutroSceneState;
  sponsor: NickOutroLayerState;
  mark: NickOutroMarkState;
  wordmark: NickOutroWordmarkState;
  words: NickOutroWordState[];
  url: NickOutroLayerState;
};

/**
 * Product Cut's identity hierarchy, rebuilt with Nick Intro's overlapping
 * Anime.js motion language. Remotion seeks this paused timeline frame-by-frame.
 */
export function createNickOutroAnimation(
  wordCount: number,
): NickOutroAnimation {
  const scene: NickOutroSceneState = {
    glowOpacity: 0,
    glowScale: 0.78,
    gridOpacity: 0,
  };

  const sponsor: NickOutroLayerState = {
    opacity: 0,
    y: 14,
    scale: 0.965,
    blur: 8,
  };

  const mark: NickOutroMarkState = {
    opacity: 0,
    x: 0,
    y: 12,
    scale: 1.18,
    rotate: -4,
    blur: 18,
  };

  const wordmark: NickOutroWordmarkState = {
    opacity: 0,
    x: -26,
    blur: 12,
  };

  const words: NickOutroWordState[] = Array.from(
    { length: wordCount },
    () => ({
      opacity: 0,
      y: 26,
      scale: 0.975,
      blur: 10,
      tracking: 8,
    }),
  );

  const url: NickOutroLayerState = {
    opacity: 0,
    y: 18,
    scale: 0.97,
    blur: 7,
  };

  const timeline = createTimeline({
    autoplay: false,
    defaults: {
      ease: "outExpo",
    },
  });

  timeline
    .add(
      scene,
      {
        glowOpacity: 0.62,
        glowScale: 1,
        duration: 1_050,
        ease: "outExpo",
      },
      0,
    )
    .add(
      scene,
      {
        gridOpacity: 0.28,
        duration: 900,
        ease: "outExpo",
      },
      100,
    )
    .add(
      sponsor,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        blur: 0,
        duration: 700,
        ease: "outExpo",
      },
      150,
    )
    .add(
      mark,
      {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        rotate: 0,
        blur: 0,
        duration: 760,
        ease: "outExpo",
      },
      430,
    )
    .add(
      wordmark,
      {
        opacity: 1,
        x: 0,
        blur: 0,
        duration: 760,
        ease: "outExpo",
      },
      780,
    )
    .add(
      words,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        blur: 0,
        tracking: 0.5,
        delay: stagger(85),
        duration: 680,
        ease: "outExpo",
      },
      1_300,
    )
    .add(
      url,
      {
        opacity: 1,
        y: 0,
        scale: 1,
        blur: 0,
        duration: 560,
        ease: "outExpo",
      },
      1_900,
    )
    .add(
      scene,
      {
        glowOpacity: 0,
        glowScale: 1.14,
        gridOpacity: 0,
        duration: 1_050,
        ease: "inExpo",
      },
      3_350,
    )
    .add(
      url,
      {
        opacity: 0,
        y: 16,
        scale: 0.985,
        blur: 7,
        duration: 400,
        ease: "inExpo",
      },
      3_350,
    )
    .add(
      words,
      {
        opacity: 0,
        y: -20,
        scale: 0.985,
        blur: 9,
        tracking: 4,
        delay: stagger(45),
        duration: 450,
        ease: "inExpo",
      },
      3_420,
    )
    .add(
      sponsor,
      {
        opacity: 0,
        y: -12,
        scale: 0.985,
        blur: 7,
        duration: 420,
        ease: "inExpo",
      },
      3_550,
    )
    .add(
      wordmark,
      {
        opacity: 0,
        x: 34,
        blur: 12,
        duration: 520,
        ease: "inExpo",
      },
      3_650,
    )
    .add(
      mark,
      {
        opacity: 0,
        x: 196.68,
        y: 0,
        scale: 0.8,
        rotate: 5,
        blur: 4,
        duration: 650,
        ease: "inExpo",
      },
      3_750,
    );

  return { timeline, scene, sponsor, mark, wordmark, words, url };
}
