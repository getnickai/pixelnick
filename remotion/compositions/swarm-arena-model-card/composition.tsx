/* eslint-disable @next/next/no-img-element */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SlidingDigitCount } from "../_shared/sliding-digit-count";
import type { SwarmArenaModelCardProps } from "./props";

// staticFile() so assets resolve in BOTH the web Player and headless CLI/MP4
// renders. A bare "/swarm-arena-cards/..." only resolves against the page
// origin (Player); a headless render serves assets through the bundler. The
// base prepends remotion_staticBase; sub-paths concatenate correctly. (STA-417)
const ASSET = staticFile("swarm-arena-cards/assets");
const MODELS_ASSET = `${ASSET}/models`;

const MODELS = {
  chatgpt: { logo: `${MODELS_ASSET}/chatgpt.svg`, name: "GPT 5.5" },
  claude: { logo: `${MODELS_ASSET}/claude.svg`, name: "Claude 4.5" },
  kimi: { logo: `${MODELS_ASSET}/kimi.svg`, name: "Kimi K2" },
  glm: { logo: `${MODELS_ASSET}/glm.svg`, name: "GLM-4.6" },
  google: { logo: `${MODELS_ASSET}/google.svg`, name: "Gemini 2.5" },
} as const;

/** Hardcoded to the Figma sample (GPT 5.5), mirroring the static card. */
const MODEL: keyof typeof MODELS = "chatgpt";

const LATEST_PICKS = [
  { label: "BACK PSG at:", value: "0.44" },
  { label: "Dembélé at:", value: "0.44" },
  { label: "Over 2.5 at:", value: "0.44" },
];

/** Rank shown inside the hexagon badge (matches the "Rank" stat: #1 / 11). */
const RANK = "1";

/**
 * Master timeline (30fps). Each window is [startFrame, endFrame]; the element
 * ramps "off" → "on". Spring entrances use a single *SpringStart frame. The
 * backdrop (gradient + watermarks + progressive blur) is present from frame 0;
 * only the content cascades in. Stagger = the gap between consecutive starts.
 */
const ANIM = {
  // Looping accent-bar breathe (matches the static bar).
  barPulsePeriod: 22,
  barPulseStart: 70,
  barPulseFadeIn: 12,

  // Entrance windows [start, end]
  header: [0, 14],
  rank: [8, 22], // hexagon
  rankNum: [15, 29], // "1" stamps in after the hexagon
  rankRibbon: [21, 37], // ribbon banner sweeps on last
  tagDot: [10, 22],
  tagPill: [15, 27],
  tagWorld: [20, 32],
  avatar: [16, 30],
  modelName: [20, 46],
  pnlLabel: [32, 46],
  pnlValue: [36, 48], // fade the value in as the count starts (no "+$0" flash)
  pnlCount: [36, 78],
  profitLabel: [46, 60],
  profitOpacity: [50, 64], // arrow + value; starts with the count
  profitCount: [50, 92],
  equity: [64, 82],
  glassPanel: [78, 98],
  stat1: [94, 108],
  stat2: [98, 112],
  stat3: [102, 116],
  topPick: [110, 126],
  pick1: [120, 134],
  pick2: [124, 138],
  pick3: [128, 142],
  builtOn: [134, 150],
  cta: [142, 160],

  // Spring entrance starts
  headerSpringStart: 0,
  rankSpringStart: 8,
  rankNumSpringStart: 15,
  rankRibbonSpringStart: 21,
  tagDotSpringStart: 10,
  tagPillSpringStart: 15,
  avatarSpringStart: 18,
  barSpringStart: 40,
} as const;

/**
 * Animated Remotion composition of the SwarmArena Model Card.
 *
 * Visually mirrors `components/swarm-arena-model-card.tsx` (the static version
 * stays untouched at `/static/swarm-arena-model-card`). Every entrance is driven
 * by `useCurrentFrame()`, so the same component plays in `<Player>` and renders
 * headless via Lambda. All timing lives in the `ANIM` block above.
 */
export const SwarmArenaModelCardComposition: React.FC<
  SwarmArenaModelCardProps
> = ({ slide = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const model = MODELS[MODEL];

  // Cubic-out opacity fade over a [start, end] window.
  const fade = (w: readonly [number, number]) =>
    interpolate(frame, w, [0, 1], {
      easing: Easing.out(Easing.cubic),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  // Smooth (non-bouncy) rise + fade — general content cascade.
  const upStyle = (w: readonly [number, number], dy = 12) => ({
    opacity: fade(w),
    transform: `translateY(${interpolate(frame, w, [dy, 0], {
      easing: Easing.out(Easing.exp),
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })}px)`,
  });

  // Spring rise + fade (with overshoot) — for the glass "dark rounded
  // container", which springs up as one unit; its contents just ride it.
  const springUp = (w: readonly [number, number], dy = 24) => {
    const s = spring({
      frame: frame - w[0],
      fps,
      config: { damping: 14, stiffness: 110 },
    });
    return {
      opacity: fade(w),
      transform: `translateY(${interpolate(s, [0, 1], [dy, 0])}px)`,
    };
  };

  // Header lockup — spring drop + fade.
  const headerSpring = spring({
    frame: frame - ANIM.headerSpringStart,
    fps,
    config: { damping: 14, stiffness: 110 },
  });
  const headerY = interpolate(headerSpring, [0, 1], [-20, 0]);

  // Tags — staggered: dot, then LIVE AGENT pill, then WORLD CUP.
  const tagDotSpring = spring({
    frame: frame - ANIM.tagDotSpringStart,
    fps,
    config: { damping: 12, stiffness: 150 },
  });
  const tagDotScale = interpolate(tagDotSpring, [0, 1], [0.4, 1]);
  const tagPillSpring = spring({
    frame: frame - ANIM.tagPillSpringStart,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const tagPillScale = interpolate(tagPillSpring, [0, 1], [0.6, 1]);

  // Model avatar — spring scale.
  const avatarSpring = spring({
    frame: frame - ANIM.avatarSpringStart,
    fps,
    config: { damping: 12, stiffness: 130 },
  });
  const avatarScale = interpolate(avatarSpring, [0, 1], [0.5, 1]);

  // Rank badge — staggered pop: hexagon, then the "1", then the ribbon.
  const rankSpring = spring({
    frame: frame - ANIM.rankSpringStart,
    fps,
    config: { damping: 11, stiffness: 150 },
  });
  const rankScale = interpolate(rankSpring, [0, 1], [0.3, 1]);
  // Rank number — slightly bouncier "stamp" once the hexagon has landed.
  const rankNumSpring = spring({
    frame: frame - ANIM.rankNumSpringStart,
    fps,
    config: { damping: 10, stiffness: 180 },
  });
  const rankNumScale = interpolate(rankNumSpring, [0, 1], [0.4, 1]);
  // Ribbon — pops on last to finish the badge.
  const rankRibbonSpring = spring({
    frame: frame - ANIM.rankRibbonSpringStart,
    fps,
    config: { damping: 13, stiffness: 160 },
  });
  const rankRibbonScale = interpolate(rankRibbonSpring, [0, 1], [0.6, 1]);

  // Accent bar — vertical scale-in spring + looping breathe (scale pulse).
  const barSpring = spring({
    frame: frame - ANIM.barSpringStart,
    fps,
    config: { damping: 12, stiffness: 140 },
  });
  const barScaleY = Math.min(interpolate(barSpring, [0, 1], [0, 1]), 1);
  const pulseElapsed = Math.max(0, frame - ANIM.barPulseStart);
  const barPulseMix = interpolate(
    frame,
    [ANIM.barPulseStart, ANIM.barPulseStart + ANIM.barPulseFadeIn],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const barPulseWave = Math.sin(
    (pulseElapsed / ANIM.barPulsePeriod) * Math.PI * 2,
  );
  const barPulseScale = 1 + 0.05 * barPulseWave;
  const barPulseAmount = 1 + (barPulseScale - 1) * barPulseMix;
  const barFinalScaleX = barPulseAmount;
  const barFinalScaleY = barScaleY * barPulseAmount;

  return (
    <AbsoluteFill className="overflow-clip bg-gradient-to-b from-[#110d0b] to-[#2f231e] font-sans">
      {/* --- Backdrop (present from frame 0; content cascades over it) --- */}
      <div className="pointer-events-none absolute left-[-127.46px] top-[766.37px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${ASSET}/logoshp-bottom.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>
      <div className="pointer-events-none absolute left-[318px] top-[-284.61px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${ASSET}/logoshp-top.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>

      {/* Header — Swarm Arena lockup */}
      <div
        className="absolute left-16 top-[57px] flex items-center gap-5"
        style={{
          opacity: fade(ANIM.header),
          transform: `translateY(${headerY}px)`,
        }}
      >
        <img
          alt=""
          src={`${ASSET}/logos/swarm-arena.svg`}
          className="h-10 w-[35.012px] shrink-0"
        />
        <p className="font-sans text-2xl font-bold uppercase leading-none text-[#fff8ea]">
          Swarm Arena
        </p>
      </div>

      {/* Main content stack */}
      <div className="absolute left-16 top-[169px] flex w-[522px] flex-col gap-16">
        {/* Top: tags + model */}
        <div className="flex w-full flex-col gap-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div
                className="size-[27px] shrink-0 rounded-full bg-[#8bce6c]"
                style={{
                  opacity: fade(ANIM.tagDot),
                  transform: `scale(${tagDotScale})`,
                }}
              />
              <div
                className="flex items-center justify-center rounded-full bg-[#8bce6c] px-3 py-1"
                style={{
                  opacity: fade(ANIM.tagPill),
                  transform: `scale(${tagPillScale})`,
                  transformOrigin: "left center",
                }}
              >
                <p className="text-base font-semibold uppercase leading-[1.2] text-[#161210]">
                  Live Agent
                </p>
              </div>
            </div>
            <p
              className="text-base font-semibold uppercase leading-[1.2] text-[#f98051]"
              style={upStyle(ANIM.tagWorld, 6)}
            >
              World Cup
            </p>
          </div>

          <div className="flex w-full items-center gap-5">
            <div
              className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full bg-white"
              style={{
                opacity: fade(ANIM.avatar),
                transform: `scale(${avatarScale})`,
              }}
            >
              <img alt={model.name} src={model.logo} className="size-[39px]" />
            </div>
            <p
              className="min-w-0 flex-1 font-heading text-[54px] font-semibold leading-[1.2] text-[#fff8ea]"
              style={upStyle(ANIM.modelName)}
            >
              {model.name}
            </p>
          </div>
        </div>

        {/* Bottom: metrics + glass panel */}
        <div className="flex w-full flex-col gap-12">
          {/* Metrics */}
          <div className="flex w-full flex-col justify-center gap-6">
            <div className="flex w-full items-start gap-8">
              {/* Season PNL */}
              <div className="flex flex-1 flex-col gap-4">
                <p
                  className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90"
                  style={{ opacity: fade(ANIM.pnlLabel) }}
                >
                  Season PNL
                </p>
                <div className="relative">
                  <p
                    className="font-heading text-[54px] font-semibold leading-none tracking-[1px] text-[#8bce6c]"
                    style={{ opacity: fade(ANIM.pnlValue) }}
                  >
                    <SlidingDigitCount
                      targetValue={184}
                      countWindow={ANIM.pnlCount}
                      decimals={0}
                      prefix="+$"
                      slide={slide}
                    />
                  </p>
                  {/* Accent bar — centered on the value, bleeds off the left edge */}
                  <div
                    className="absolute top-1/2 -left-[86px] h-[41px] w-[39px] rounded-lg bg-[#8bce6c]"
                    style={{
                      transform: `translateY(-50%) scale(${barFinalScaleX}, ${barFinalScaleY})`,
                      transformOrigin: "left center",
                    }}
                  />
                </div>
              </div>

              {/* Profit % */}
              <div className="flex flex-1 flex-col gap-4">
                <p
                  className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90"
                  style={{ opacity: fade(ANIM.profitLabel) }}
                >
                  Profit %
                </p>
                <div
                  className="flex items-center gap-4"
                  style={{ opacity: fade(ANIM.profitOpacity) }}
                >
                  <img
                    alt=""
                    src={`${ASSET}/arrow-up.svg`}
                    className="h-10 w-[34.29px] shrink-0"
                  />
                  <p className="whitespace-nowrap font-heading text-[54px] font-semibold leading-none tracking-[1px] text-[#fff8ea]">
                    <SlidingDigitCount
                      targetValue={27.97}
                      countWindow={ANIM.profitCount}
                      decimals={2}
                      suffix="%"
                      slide={slide}
                    />
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              className="h-[0.97px] w-full bg-[#fff8ea]"
              style={{ opacity: fade(ANIM.equity) * 0.12 }}
            />

            {/* Equity */}
            <div
              className="flex w-full items-center justify-between"
              style={upStyle(ANIM.equity)}
            >
              <div className="flex items-end gap-3">
                <p className="text-[28px] font-semibold leading-none text-[#fff8ea]">
                  $1,184
                </p>
                <p className="pb-1 text-xl font-normal leading-4 text-[#8a8174]">
                  Equity
                </p>
              </div>
              <p className="text-xl font-normal leading-4 text-[#8a8174]">
                <span className="font-semibold text-[#fff8ea]">$1,000</span> base
              </p>
            </div>
          </div>

          {/* Glass stats panel */}
          <div
            className="flex w-full flex-col gap-9 rounded-2xl bg-[rgba(10,10,6,0.5)] p-8 backdrop-blur-[24px]"
            style={springUp(ANIM.glassPanel)}
          >
            <div className="flex w-full items-center gap-9">
              <div className="flex flex-1 flex-col gap-1" style={{ opacity: fade(ANIM.stat1) }}>
                <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
                  Pick Accuracy
                </p>
                <p className="text-[28px] font-bold leading-none text-[#fff8ea]">
                  71%
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-1" style={{ opacity: fade(ANIM.stat2) }}>
                <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
                  Record
                </p>
                <p className="text-[28px] font-bold leading-none text-[#fff8ea]">
                  17-7
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-1" style={{ opacity: fade(ANIM.stat3) }}>
                <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
                  Rank
                </p>
                <p className="text-[28px] font-bold leading-none text-[#fff8ea]">
                  #1 / 11
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              {/* Top pick */}
              <div
                className="flex w-full items-center justify-between"
                style={{ opacity: fade(ANIM.topPick) }}
              >
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Top Pick
                </p>
                <div className="flex w-[206px] justify-between text-[17px] font-bold text-[#8bce6c]">
                  <span>BACK Yes at:</span>
                  <span className="w-[75px] text-right">0.58</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full py-[7px]" style={{ opacity: fade(ANIM.topPick) }}>
                <div className="h-[0.97px] w-full bg-[#2e2c26]" />
              </div>

              {/* Latest picks */}
              <div className="flex w-full items-start justify-between">
                <p
                  className="text-xs font-semibold uppercase leading-none text-[#8a8174]"
                  style={{ opacity: fade(ANIM.pick1) }}
                >
                  Latest Picks
                </p>
                <div className="flex w-[206px] flex-col gap-2.5 text-[17px] font-bold text-[#fff8ea]">
                  {LATEST_PICKS.map((pick, i) => (
                    <div
                      key={pick.label}
                      className="flex w-full items-start justify-between"
                      style={{
                        opacity: fade([ANIM.pick1, ANIM.pick2, ANIM.pick3][i]),
                      }}
                    >
                      <span className="whitespace-nowrap">{pick.label}</span>
                      <span className="w-[75px] text-right">{pick.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive blur — bottom band (above content, below footer) */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[169px] overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-[76%] backdrop-blur-[4px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[56%] backdrop-blur-[8px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[36%] backdrop-blur-[16px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>

      {/* Footer — built-on credit */}
      <div
        className="absolute left-[77px] top-[937px] flex w-[119.219px] flex-col gap-0.5"
        style={upStyle(ANIM.builtOn, 10)}
      >
        <p className="font-mono text-[11.5px] font-normal uppercase leading-none tracking-[2px] text-[#7e7568]">
          Built On
        </p>
        <img
          alt="NickAI"
          src={`${ASSET}/NickAI-wordmark-white.svg`}
          className="h-[28.39px] w-[119.219px]"
        />
      </div>

      {/* Footer — CTA */}
      <div
        className="absolute left-[314px] top-[933px] flex items-center gap-[9px] rounded-xl px-5 py-4 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(169.388deg, #f98051 17.138%, #e75218 89.208%)",
          ...upStyle(ANIM.cta, 10),
        }}
      >
        <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
          View on Swarm Arena
        </p>
        <svg
          className="size-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Rank badge — hexagon, then "1", then ribbon stagger in (top-right) */}
      <div className="absolute left-[472px] top-[61.5px] size-[106.408px]">
        {/* Hexagon + overlay — spring pop (lands first) */}
        <div
          className="absolute inset-0"
          style={{
            opacity: fade(ANIM.rank),
            transform: `scale(${rankScale})`,
            transformOrigin: "center",
          }}
        >
          <div className="absolute inset-[2.33%_6.7%]">
            <img
              alt=""
              src={`${ASSET}/rank-hex.svg`}
              className="block size-full max-w-none"
            />
          </div>
          <div className="absolute left-[4.85px] top-[4.85px] size-[96.706px] mix-blend-screen">
            <div className="absolute inset-[1.92%_6.7%]">
              <img
                alt=""
                src={`${ASSET}/rank-hex-overlay.svg`}
                className="block size-full max-w-none"
              />
            </div>
          </div>
        </div>

        {/* RANK ribbon — banner sweeps on last, across the hexagon's lower third */}
        <div
          className="absolute left-[-16.3px] top-[52px] h-[50px] w-[139px]"
          style={{
            opacity: fade(ANIM.rankRibbon),
            transform: `scale(${rankRibbonScale})`,
            transformOrigin: "center",
          }}
        >
          <img alt="" src={`${ASSET}/rank-ribbon.svg`} className="block size-full" />
          <div className="absolute inset-x-0 top-0 flex h-[31px] items-center justify-center">
            <span className="font-heading text-[18px] font-bold uppercase leading-none text-[#0d0907]">
              Rank
            </span>
          </div>
        </div>

        {/* Rank number — stamps in after the hexagon, above the ribbon */}
        <div
          className="absolute inset-x-0 top-0 flex h-[76px] items-center justify-center"
          style={{
            opacity: fade(ANIM.rankNum),
            transform: `scale(${rankNumScale})`,
          }}
        >
          <span className="font-heading text-[48px] font-bold leading-none tracking-[1px] text-[#fff8ea]">
            {RANK}
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
