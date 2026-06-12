import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  SAMPLE_LEADERBOARD,
  SETTLED_LEADERBOARD_ANIM,
  SwarmArenaLeaderboardCardView,
  type SwarmArenaLeaderboardCardAnim,
} from "../../../components/swarm-arena-leaderboard-card";
import type { SwarmArenaLeaderboardCardProps } from "./props";

// staticFile() so assets resolve in BOTH the web Player and headless renders.
const ASSET = staticFile("swarm-arena-cards/assets");
const toStatic = (url?: string) =>
  url && url.startsWith("/") ? staticFile(url.replace(/^\/+/, "")) : url;

/**
 * Master timeline (30fps). The frame chrome (header, title, panel) cascades in
 * first; then the ranking reveals BOTTOM-UP — last place first, climbing to the
 * #1 winner LAST for the reveal. Footer + spark land after the champion.
 */
const ANIM = {
  header: [0, 14] as const,
  livePill: [8, 22] as const,
  livePillSpringStart: 8,
  title: [6, 24] as const,
  sub: [16, 30] as const,
  panel: [22, 38] as const,

  // Row reveal (bottom-up). Each row i appears in reverse-rank order.
  rowsStart: 42,
  rowStagger: 11,
  rowFade: 16,
  rowBarLag: 5,
  rowBarLen: 16,

  sparkFade: [120, 150] as const,
  sparkReveal: [60, 150] as const,
  builtOn: [150, 164] as const,
  cta: [156, 172] as const,
  ctaSpringStart: 156,
} as const;

export const SwarmArenaLeaderboardCardComposition: React.FC<
  SwarmArenaLeaderboardCardProps
> = ({ data = SAMPLE_LEADERBOARD }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const N = data.rows.length;

  const fade = (w: readonly [number, number]) =>
    interpolate(frame, w, [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const rise = (w: readonly [number, number], dy = 12) =>
    interpolate(frame, w, [dy, 0], {
      easing: Easing.out(Easing.exp),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const springFrom = (start: number, config: { damping: number; stiffness: number }) =>
    spring({ frame: frame - start, fps, config });

  // Reverse stagger: display index 0 = #1 winner (reveals LAST);
  // index N-1 = last place (reveals FIRST).
  const rowOpacities: number[] = [];
  const rowY: number[] = [];
  const barScaleX: number[] = [];
  for (let i = 0; i < N; i++) {
    const order = N - 1 - i; // 0 = first to appear
    const start = ANIM.rowsStart + order * ANIM.rowStagger;
    const win: readonly [number, number] = [start, start + ANIM.rowFade];
    rowOpacities[i] = fade(win);
    rowY[i] = rise(win, 18);
    barScaleX[i] = interpolate(
      frame,
      [start + ANIM.rowBarLag, start + ANIM.rowBarLag + ANIM.rowBarLen],
      [0, 1],
      { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
    );
  }

  const livePillSpring = springFrom(ANIM.livePillSpringStart, { damping: 12, stiffness: 150 });
  const ctaSpring = springFrom(ANIM.ctaSpringStart, { damping: 14, stiffness: 120 });

  const anim: SwarmArenaLeaderboardCardAnim = {
    ...SETTLED_LEADERBOARD_ANIM,
    headerOpacity: fade(ANIM.header),
    headerY: rise(ANIM.header, -16),
    livePillOpacity: fade(ANIM.livePill),
    livePillScale: interpolate(livePillSpring, [0, 1], [0.6, 1]),
    titleOpacity: fade(ANIM.title),
    titleY: rise(ANIM.title, 14),
    subOpacity: fade(ANIM.sub),
    panelOpacity: fade(ANIM.panel),
    panelY: rise(ANIM.panel, 16),
    rowOpacities,
    rowY,
    barScaleX,
    builtOnOpacity: fade(ANIM.builtOn),
    ctaOpacity: fade(ANIM.cta),
    ctaY: interpolate(ctaSpring, [0, 1], [16, 0]),
    sparkOpacity: fade(ANIM.sparkFade),
    sparkRevealRightPct: interpolate(frame, ANIM.sparkReveal, [100, 0], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  };

  return (
    <AbsoluteFill className="overflow-clip font-sans">
      <SwarmArenaLeaderboardCardView
        data={{ ...data, rows: data.rows.map((r) => ({ ...r, logo: toStatic(r.logo) })) }}
        assetBase={ASSET}
        anim={anim}
      />
    </AbsoluteFill>
  );
};
