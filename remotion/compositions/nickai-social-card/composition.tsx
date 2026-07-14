/**
 * NickAI social card (STA-473) — free-wave brand frame for the weekly X
 * content calendar. Distinct from `nickai-og-cover` (rounded wave panel):
 * here the blue wave sits open on the canvas and spans full height.
 *
 * Light + dark skins. 1600×900 (16:9). `animate` is reserved for the CP2
 * motion pass — the layout below is frame-independent so `renderStill` at
 * frame 0 is the settled card.
 */
import { useId } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { NickaiSocialCardProps, NickaiSocialCardTheme } from "./props";

const BLUE = "#0178ff";
const BLUE_LIGHT = "#4da0ff";

/** Big-number tones: brand blue, or semantic P&L green/red (TW v4 500 stops). */
const NUMBER_TONES = {
  accent: BLUE,
  positive: "#00c950",
  negative: "#fb2c36",
} as const;

const fontHeading = "Duplet, ui-sans-serif, system-ui, sans-serif";
const fontSans = "Manrope, ui-sans-serif, system-ui, sans-serif";

type Skin = {
  bg: string;
  headline: string;
  subline: string;
  wordmark: string;
  eyebrow: string;
  chipText: string;
  chipBorder: string;
  chipBg: string;
  fillLabel: string;
  fillCaption: string;
};

const SKINS: Record<NickaiSocialCardTheme, Skin> = {
  dark: {
    bg: "#09090b",
    headline: "#fafafa",
    subline: "#a1a1aa",
    wordmark: "#ffffff",
    eyebrow: BLUE_LIGHT,
    chipText: "#d4d4d8",
    chipBorder: "#27272a",
    chipBg: "rgba(24, 24, 27, 0.72)",
    fillLabel: "#d4d4d8",
    fillCaption: "#71717b",
  },
  light: {
    bg: "#f8fafc",
    headline: "#0a0a0a",
    subline: "#5c5c5c",
    wordmark: "#0a0a0a",
    eyebrow: BLUE,
    chipText: "#3f3f46",
    chipBorder: "#e4e4e7",
    chipBg: "rgba(255, 255, 255, 0.85)",
    fillLabel: "#3f3f46",
    fillCaption: "#71717b",
  },
};

const PAD = 84;

/** Display size so each wave motif fills the 900px card height edge-to-edge. */
const WAVE_DISPLAY: Record<1 | 2, { width: number; height: number }> = {
  1: { width: 1284, height: 900 }, // native 1498×1050
  2: { width: 1166, height: 900 }, // native 1026×792
};

/** Shrink the display size for long headlines so they stay ≤3 lines. */
function headlineSize(text: string): number {
  if (text.length <= 46) return 84;
  if (text.length <= 72) return 72;
  return 60;
}

/** NickAI mark — same path as og-cover / marketing icons.tsx. */
const LogoMark: React.FC<{ size: number }> = ({ size }) => {
  const clipId = `nickai_social_clip_${useId()}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath={`url(#${clipId})`}>
        <path
          d="M1.1178 1.1944C2.60833 -0.296048 5.02439 -0.296027 6.51493 1.1944C7.11837 1.79783 7.47758 2.55303 7.59241 3.33714C7.76951 4.54648 7.91957 5.8762 8.78379 6.74046L13.2605 11.2163C14.1188 12.0746 15.4367 12.2288 16.637 12.4086C16.6504 12.4106 16.6635 12.4137 16.6769 12.4159C16.7529 12.4282 16.8286 12.4423 16.904 12.4591C16.9153 12.4616 16.9268 12.4637 16.9381 12.4663C17.0289 12.4875 17.119 12.5126 17.2083 12.5404C17.2129 12.5418 17.2175 12.5431 17.2221 12.5445C17.3051 12.5708 17.3873 12.6003 17.4687 12.6324C17.4806 12.6371 17.4926 12.6414 17.5045 12.6462C17.582 12.6776 17.6584 12.7121 17.734 12.7487C17.7558 12.7593 17.7775 12.7703 17.7991 12.7813C17.8708 12.8178 17.9418 12.8563 18.0115 12.8977C18.0345 12.9113 18.057 12.9258 18.0799 12.94C18.139 12.9767 18.1974 13.0152 18.2549 13.0556C18.2754 13.07 18.2964 13.0838 18.3167 13.0987C18.3246 13.1045 18.3324 13.1107 18.3403 13.1166C18.3822 13.1477 18.4239 13.1795 18.4648 13.2127C18.472 13.2184 18.4788 13.2247 18.486 13.2305C18.5261 13.2635 18.5657 13.2974 18.6048 13.3322C18.615 13.3413 18.6256 13.3499 18.6357 13.3591C18.6803 13.3997 18.7245 13.4414 18.7675 13.4844C20.258 14.975 20.258 17.3918 18.7675 18.8824C17.277 20.3729 14.8601 20.3728 13.3696 18.8824C13.3265 18.8393 13.2849 18.7951 13.2443 18.7506C13.234 18.7393 13.2242 18.7277 13.2141 18.7163C13.1841 18.6826 13.1549 18.6484 13.1263 18.6138C13.113 18.5977 13.0994 18.582 13.0864 18.5658C13.0581 18.5305 13.031 18.4944 13.0042 18.4584C12.9975 18.4494 12.9905 18.4406 12.9839 18.4315C12.969 18.4112 12.9551 18.3903 12.9407 18.3697C12.8949 18.3043 12.851 18.2379 12.8097 18.1703C12.8038 18.1606 12.7968 18.1516 12.791 18.1418C12.7477 18.0695 12.7078 17.9957 12.6697 17.9212C12.6563 17.8951 12.6434 17.8687 12.6306 17.8423C12.5952 17.7688 12.5619 17.6946 12.5314 17.6193C12.5265 17.6075 12.5222 17.5955 12.5175 17.5836C12.4492 17.4101 12.3935 17.2329 12.3515 17.053C12.3489 17.0416 12.3467 17.0302 12.3442 17.0187C12.3227 16.9224 12.3036 16.8257 12.2897 16.7283C12.1114 15.5343 11.954 14.2279 11.1015 13.3754L6.58411 8.85875C6.1055 8.38017 5.40328 8.85267 5.40328 9.5295V11.3501C5.40328 12.1793 5.92849 12.8981 6.51493 13.4844C8.00549 14.975 8.00549 17.3918 6.51493 18.8824C5.02443 20.3726 2.60828 20.3726 1.1178 18.8824C-0.372763 17.3918 -0.372763 14.975 1.1178 13.4844C1.75677 12.8455 2.34989 12.0704 2.34989 11.1668V8.90742C2.34989 8.00437 1.75644 7.23084 1.1178 6.59235C-0.372747 5.10178 -0.372753 2.68496 1.1178 1.1944ZM13.3696 1.1179C14.8601 -0.37262 17.277 -0.372647 18.7675 1.1179C20.258 2.60846 20.258 5.02532 18.7675 6.51585C17.277 8.00637 14.8601 8.00628 13.3696 6.51585C11.879 5.02529 11.879 2.60846 13.3696 1.1179Z"
          fill={BLUE}
        />
      </g>
      <defs>
        <clipPath id={clipId}>
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
};

export const NickaiSocialCardComposition: React.FC<NickaiSocialCardProps> = ({
  theme = "dark",
  eyebrow,
  headline,
  subline,
  chips = [],
  fill = { kind: "none" },
  wave = 1,
  animate = false,
}) => {
  const frame = useCurrentFrame();
  const skin = SKINS[theme] ?? SKINS.dark;
  const hasSideFill = fill.kind !== "none";
  const textWidth = hasSideFill ? "58%" : "72%";

  /**
   * Entrance progress for a window of frames: 0→1 with an ease-out, pinned
   * to 1 when `animate` is off so stills stay settled at any frame.
   */
  const enter = (from: number, to: number): number =>
    animate
      ? interpolate(frame, [from, to], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.out(Easing.cubic),
        })
      : 1;

  /** fade + rise entrance style for a progress value. */
  const rise = (p: number, distance = 28): React.CSSProperties => ({
    opacity: p,
    transform: `translateY(${(1 - p) * distance}px)`,
  });

  return (
    <AbsoluteFill style={{ backgroundColor: skin.bg, fontFamily: fontSans }}>
      {wave !== 0 && (
        <Img
          src={staticFile(
            theme === "light"
              ? `nickai-social/wave-light-${wave}.png`
              : `nickai-social/wave-dark-${wave}.png`,
          )}
          style={{
            position: "absolute",
            // Full-bleed height: scale the motif so it touches top + bottom.
            top: 0,
            right: -120,
            ...WAVE_DISPLAY[wave],
            // Dark assets keep a black plate — screen dissolves it into the canvas.
            // Light assets are pre-keyed (black → transparent) so normal blend works.
            mixBlendMode: theme === "light" ? "normal" : "screen",
            // Recede behind data modules so numbers stay legible.
            opacity: (hasSideFill ? 0.4 : theme === "light" ? 0.85 : 0.9) * enter(0, 45),
            transform: `translateX(${(1 - enter(0, 45)) * 60}px)`,
          }}
        />
      )}

      <AbsoluteFill style={{ padding: PAD, justifyContent: "space-between" }}>
        {/* Header: wordmark left, series eyebrow right. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            ...rise(enter(0, 24), 16),
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 17 }}>
            <LogoMark size={50} />
            <span
              style={{
                fontFamily: fontHeading,
                fontWeight: 600,
                fontSize: 45,
                letterSpacing: -0.5,
                color: skin.wordmark,
                lineHeight: 1,
              }}
            >
              NickAI
            </span>
          </div>
          <div
            style={{
              fontFamily: fontSans,
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: skin.eyebrow,
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* Body: headline block left, optional module right. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 60,
            flex: 1,
            minHeight: 0,
            paddingTop: 48,
            paddingBottom: 48,
          }}
        >
          <div style={{ width: textWidth, display: "flex", flexDirection: "column", gap: 28 }}>
            <div
              style={{
                fontFamily: fontHeading,
                fontWeight: 600,
                fontSize: headlineSize(headline),
                lineHeight: 1.12,
                color: skin.headline,
                letterSpacing: -0.5,
                ...rise(enter(8, 40)),
              }}
            >
              {headline}
            </div>
            {subline && (
              <div
                style={{
                  fontFamily: fontSans,
                  fontWeight: 400,
                  fontSize: 27,
                  lineHeight: 1.5,
                  color: skin.subline,
                  maxWidth: 720,
                  ...rise(enter(20, 50)),
                }}
              >
                {subline}
              </div>
            )}
            {chips.length > 0 && (
              <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                {chips.map((chip, i) => (
                  <div
                    key={`${chip}-${i}`}
                    style={{
                      ...rise(enter(32 + i * 8, 58 + i * 8), 20),
                      fontFamily: fontSans,
                      fontWeight: 500,
                      fontSize: 22,
                      color: skin.chipText,
                      border: `1.5px solid ${skin.chipBorder}`,
                      backgroundColor: skin.chipBg,
                      borderRadius: 12,
                      padding: "10px 20px",
                    }}
                  >
                    {chip}
                  </div>
                ))}
              </div>
            )}
          </div>

          {fill.kind === "bigNumber" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                textAlign: "right",
                gap: 10,
                paddingRight: 8,
                opacity: enter(30, 64),
                transform: `scale(${0.92 + 0.08 * enter(30, 64)})`,
                transformOrigin: "right center",
              }}
            >
              <div
                style={{
                  fontFamily: fontHeading,
                  fontWeight: 700,
                  fontSize: 150,
                  lineHeight: 1,
                  color: NUMBER_TONES[fill.tone ?? "accent"],
                }}
              >
                {fill.value}
              </div>
              <div
                style={{
                  fontFamily: fontSans,
                  fontWeight: 500,
                  fontSize: 26,
                  color: skin.fillLabel,
                }}
              >
                {fill.label}
              </div>
              {fill.caption && (
                <div
                  style={{
                    fontFamily: fontSans,
                    fontWeight: 400,
                    fontSize: 20,
                    color: skin.fillCaption,
                  }}
                >
                  {fill.caption}
                </div>
              )}
            </div>
          )}

          {fill.kind === "illustration" && (
            <Img
              src={fill.src.startsWith("http") ? fill.src : staticFile(fill.src)}
              style={{
                maxWidth: 520,
                maxHeight: 460,
                objectFit: "contain",
                borderRadius: 16,
                ...rise(enter(28, 60), 24),
              }}
            />
          )}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
