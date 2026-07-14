/**
 * NickAI OG cover (`nickai-og-cover`) — a reusable 1200x630 cover-image
 * template that reproduces the hand-made getnick.ai/og.png as an editable
 * template with two color themes and NO CTA.
 *
 * Still (durationInFrames = 1): no motion, `renderStill` at frame 0 is the
 * final image. Duplet (headline + wordmark) and Manrope (subhead) resolve
 * headlessly via the @font-face block in remotion/style.css; the render is
 * gated on document.fonts.ready so a fallback face never leaks into a frame.
 */
import { useEffect, useState } from "react";
import { AbsoluteFill, Img, staticFile, delayRender, continueRender } from "remotion";
import type { NickaiOgCoverProps, NickaiOgCoverTheme } from "./props";

const BLUE = "#0178ff";

const fontHeading = "Duplet, ui-sans-serif, system-ui, sans-serif";
const fontSans = "Manrope, ui-sans-serif, system-ui, sans-serif";

type Skin = {
  bg: string;
  headline: string;
  subhead: string;
  wordmark: string;
  wave: string;
};

const SKINS: Record<NickaiOgCoverTheme, Skin> = {
  light: {
    bg: "#f8fafc",
    headline: "#0a0a0a",
    subhead: "#5c5c5c",
    wordmark: "#0a0a0a",
    wave: "nickai-og/wave-og.png",
  },
  dark: {
    bg: "#09090b",
    headline: "#fafafa",
    subhead: "#a1a1aa",
    wordmark: "#ffffff",
    wave: "nickai-og/wave-og.png",
  },
};

/**
 * Shrink the display size for longer headlines so they stay ~2 lines inside
 * the left column. The reference headline (43 chars) lands at 60.
 */
function headlineSize(text: string): number {
  const n = text.length;
  if (n <= 30) return 66;
  if (n <= 48) return 60;
  if (n <= 64) return 52;
  return 46;
}

/** The NickAI logo mark — path copied verbatim from src/components/icons.tsx
 * (viewBox 0 0 20 20), rendered in brand blue. */
const LogoMark: React.FC<{ size: number }> = ({ size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <g clipPath="url(#nickai_og_clip)">
      <path
        d="M1.1178 1.1944C2.60833 -0.296048 5.02439 -0.296027 6.51493 1.1944C7.11837 1.79783 7.47758 2.55303 7.59241 3.33714C7.76951 4.54648 7.91957 5.8762 8.78379 6.74046L13.2605 11.2163C14.1188 12.0746 15.4367 12.2288 16.637 12.4086C16.6504 12.4106 16.6635 12.4137 16.6769 12.4159C16.7529 12.4282 16.8286 12.4423 16.904 12.4591C16.9153 12.4616 16.9268 12.4637 16.9381 12.4663C17.0289 12.4875 17.119 12.5126 17.2083 12.5404C17.2129 12.5418 17.2175 12.5431 17.2221 12.5445C17.3051 12.5708 17.3873 12.6003 17.4687 12.6324C17.4806 12.6371 17.4926 12.6414 17.5045 12.6462C17.582 12.6776 17.6584 12.7121 17.734 12.7487C17.7558 12.7593 17.7775 12.7703 17.7991 12.7813C17.8708 12.8178 17.9418 12.8563 18.0115 12.8977C18.0345 12.9113 18.057 12.9258 18.0799 12.94C18.139 12.9767 18.1974 13.0152 18.2549 13.0556C18.2754 13.07 18.2964 13.0838 18.3167 13.0987C18.3246 13.1045 18.3324 13.1107 18.3403 13.1166C18.3822 13.1477 18.4239 13.1795 18.4648 13.2127C18.472 13.2184 18.4788 13.2247 18.486 13.2305C18.5261 13.2635 18.5657 13.2974 18.6048 13.3322C18.615 13.3413 18.6256 13.3499 18.6357 13.3591C18.6803 13.3997 18.7245 13.4414 18.7675 13.4844C20.258 14.975 20.258 17.3918 18.7675 18.8824C17.277 20.3729 14.8601 20.3728 13.3696 18.8824C13.3265 18.8393 13.2849 18.7951 13.2443 18.7506C13.234 18.7393 13.2242 18.7277 13.2141 18.7163C13.1841 18.6826 13.1549 18.6484 13.1263 18.6138C13.113 18.5977 13.0994 18.582 13.0864 18.5658C13.0581 18.5305 13.031 18.4944 13.0042 18.4584C12.9975 18.4494 12.9905 18.4406 12.9839 18.4315C12.969 18.4112 12.9551 18.3903 12.9407 18.3697C12.8949 18.3043 12.851 18.2379 12.8097 18.1703C12.8038 18.1606 12.7968 18.1516 12.791 18.1418C12.7477 18.0695 12.7078 17.9957 12.6697 17.9212C12.6563 17.8951 12.6434 17.8687 12.6306 17.8423C12.5952 17.7688 12.5619 17.6946 12.5314 17.6193C12.5265 17.6075 12.5222 17.5955 12.5175 17.5836C12.4492 17.4101 12.3935 17.2329 12.3515 17.053C12.3489 17.0416 12.3467 17.0302 12.3442 17.0187C12.3227 16.9224 12.3036 16.8257 12.2897 16.7283C12.1114 15.5343 11.954 14.2279 11.1015 13.3754L6.58411 8.85875C6.1055 8.38017 5.40328 8.85267 5.40328 9.5295V11.3501C5.40328 12.1793 5.92849 12.8981 6.51493 13.4844C8.00549 14.975 8.00549 17.3918 6.51493 18.8824C5.02443 20.3726 2.60828 20.3726 1.1178 18.8824C-0.372763 17.3918 -0.372763 14.975 1.1178 13.4844C1.75677 12.8455 2.34989 12.0704 2.34989 11.1668V8.90742C2.34989 8.00437 1.75644 7.23084 1.1178 6.59235C-0.372747 5.10178 -0.372753 2.68496 1.1178 1.1944ZM13.3696 1.1179C14.8601 -0.37262 17.277 -0.372647 18.7675 1.1179C20.258 2.60846 20.258 5.02532 18.7675 6.51585C17.277 8.00637 14.8601 8.00628 13.3696 6.51585C11.879 5.02529 11.879 2.60846 13.3696 1.1179Z"
        fill={BLUE}
      />
    </g>
    <defs>
      <clipPath id="nickai_og_clip">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export const NickaiOgCoverComposition: React.FC<NickaiOgCoverProps> = ({
  theme = "light",
  headline,
  subhead,
}) => {
  const skin = SKINS[theme] ?? SKINS.light;

  // Gate the first captured frame on the webfonts so a fallback face never
  // leaks into a still.
  const [handle] = useState(() => delayRender("nickai-og-fonts"));
  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (alive) continueRender(handle);
    });
    return () => {
      alive = false;
    };
  }, [handle]);

  const PAD_LEFT = 88;
  const PAD_TOP = 80;
  // Right wave panel: exact og.png geometry (panel bbox 726..1127 x 86..543,
  // radius 34), so the light theme is a byte-match and the wave is the original
  // og.png crop rather than a re-created one.
  const PANEL = { top: 86, right: 72, bottom: 86, width: 402, radius: 34 };
  const COL_WIDTH = 620;

  return (
    <AbsoluteFill style={{ backgroundColor: skin.bg, fontFamily: fontSans }}>
      {/* Logo: mark + wordmark, top-left. */}
      <div
        style={{
          position: "absolute",
          top: PAD_TOP,
          left: PAD_LEFT,
          display: "flex",
          alignItems: "center",
          gap: 14,
        }}
      >
        <LogoMark size={44} />
        <span
          style={{
            fontFamily: fontHeading,
            fontWeight: 600,
            fontSize: 38,
            letterSpacing: -0.5,
            color: skin.wordmark,
            lineHeight: 1,
          }}
        >
          NickAI
        </span>
      </div>

      {/* Left content column — headline + subhead, vertically centered. */}
      <div
        style={{
          position: "absolute",
          left: PAD_LEFT,
          top: 0,
          height: 630,
          width: COL_WIDTH,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          // Nudge the group just below the optical center to match og.png.
          paddingTop: 24,
        }}
      >
        <div
          style={{
            fontFamily: fontHeading,
            fontWeight: 700,
            fontSize: headlineSize(headline),
            lineHeight: 1.1,
            letterSpacing: -1.2,
            color: skin.headline,
            maxWidth: 600,
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: fontSans,
            fontWeight: 400,
            fontSize: 23,
            lineHeight: 1.4,
            letterSpacing: -0.2,
            color: skin.subhead,
            maxWidth: 640,
          }}
        >
          {subhead}
        </div>
      </div>

      {/* Right wave panel. */}
      <div
        style={{
          position: "absolute",
          top: PANEL.top,
          right: PANEL.right,
          bottom: PANEL.bottom,
          width: PANEL.width,
          borderRadius: PANEL.radius,
          overflow: "hidden",
        }}
      >
        <Img
          src={staticFile(skin.wave)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
