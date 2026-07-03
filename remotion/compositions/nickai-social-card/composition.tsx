/**
 * NickAI social card (STA-473) — brand frame for the weekly X content
 * calendar. Brand-dark variant of the V2 system: zinc-950 canvas, blue wave
 * motif (screen-blended so its black plate disappears into the canvas),
 * Duplet display type, Manrope UI type, #0178FF accent.
 *
 * 1600×900 (16:9). `animate` is reserved for the CP2 motion pass — the
 * layout below is frame-independent so `renderStill` at frame 0 is the
 * settled card.
 */
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import type { NickaiSocialCardProps } from "./props";

const BLUE = "#0178ff";
const BLUE_LIGHT = "#4da0ff";
const CANVAS = "#09090b";
const PAD = 84;

/** Big-number tones: brand blue, or semantic P&L green/red (TW v4 500 stops). */
const NUMBER_TONES = {
  accent: BLUE,
  positive: "#00c950",
  negative: "#fb2c36",
} as const;

const fontHeading = "Duplet, ui-sans-serif, system-ui, sans-serif";
const fontSans = "Manrope, ui-sans-serif, system-ui, sans-serif";

/** Shrink the display size for long headlines so they stay ≤3 lines. */
function headlineSize(text: string): number {
  if (text.length <= 46) return 84;
  if (text.length <= 72) return 72;
  return 60;
}

export const NickaiSocialCardComposition: React.FC<NickaiSocialCardProps> = ({
  eyebrow,
  headline,
  subline,
  chips = [],
  fill = { kind: "none" },
  meta,
  wave = 1,
  animate = false,
}) => {
  const frame = useCurrentFrame();
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
    <AbsoluteFill style={{ backgroundColor: CANVAS, fontFamily: fontSans }}>
      {wave !== 0 && (
        <Img
          src={staticFile(`nickai-social/wave-dark-${wave}.png`)}
          style={{
            position: "absolute",
            right: -140,
            bottom: -120,
            width: 980,
            mixBlendMode: "screen",
            // Recede behind data modules so numbers stay legible.
            opacity: (hasSideFill ? 0.4 : 0.9) * enter(0, 45),
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
          <Img src={staticFile("figma/logo.svg")} style={{ height: 38, width: 182 }} />
          <div
            style={{
              fontFamily: fontSans,
              fontWeight: 600,
              fontSize: 24,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: BLUE_LIGHT,
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
                color: "#fafafa",
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
                  color: "#a1a1aa",
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
                      color: "#d4d4d8",
                      border: "1.5px solid #27272a",
                      backgroundColor: "rgba(24, 24, 27, 0.72)",
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
                  color: "#d4d4d8",
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
                    color: "#71717b",
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

        {/* Footer: source note left, CTA domain right. */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            borderTop: "1.5px solid #18181b",
            paddingTop: 28,
            opacity: enter(48, 72),
          }}
        >
          <div
            style={{
              fontFamily: fontSans,
              fontWeight: 500,
              fontSize: 22,
              color: "#71717b",
            }}
          >
            {meta ?? ""}
          </div>
          <div
            style={{
              fontFamily: fontSans,
              fontWeight: 600,
              fontSize: 24,
              color: "#d4d4d8",
            }}
          >
            getnick.ai
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
