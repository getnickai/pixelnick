import { useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createNickOutroAnimation } from "./motion";
import type { NickOutroProps } from "./props";

const CANVAS = "#09090b";
const MANROPE = "Manrope, ui-sans-serif, system-ui, sans-serif";
const DUPLET =
  'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif';
const LOCKUP_WIDTH = 497.36;
const LOCKUP_HEIGHT = 104;
const MARK_SIZE = 104;
const WORDMARK_LEFT = 147.98;
const WORDMARK_WIDTH = LOCKUP_WIDTH - WORDMARK_LEFT;

export const NickOutroComposition: React.FC<NickOutroProps> = ({
  ctaHeadline,
  ctaUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = useMemo(
    () => ctaHeadline.trim().split(/\s+/).filter(Boolean),
    [ctaHeadline],
  );
  const animation = useMemo(
    () => createNickOutroAnimation(words.length),
    [words.length],
  );

  const [fontHandle] = useState(() => delayRender("nick-outro-fonts"));
  useEffect(() => {
    let mounted = true;
    document.fonts.ready.then(() => {
      if (mounted) continueRender(fontHandle);
    });
    return () => {
      mounted = false;
    };
  }, [fontHandle]);

  useEffect(() => {
    return () => {
      animation.timeline.cancel();
    };
  }, [animation]);

  animation.timeline.seek((frame / fps) * 1_000, true);

  const { scene, sponsor, mark, wordmark, url } = animation;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: CANVAS,
        color: "#fafafa",
      }}
    >
      <Img
        aria-hidden
        src={staticFile("nick/nick-intro-glow.svg")}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 1_520,
          height: 1_520,
          opacity: scene.glowOpacity * 0.28,
          mixBlendMode: "screen",
          transform: `translate(-50%, -50%) scale(${scene.glowScale})`,
          willChange: "opacity, transform",
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          opacity: scene.gridOpacity,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(ellipse 48% 48% at 50% 50%, black 0%, transparent 78%)",
        }}
      />

      <Img
        aria-hidden
        src={staticFile("nick/nick-intro-dither.svg")}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.012,
          pointerEvents: "none",
        }}
      />

      <div
        aria-label="Backed by Galaxy"
        style={{
          position: "absolute",
          top: "39.5%",
          left: "50%",
          zIndex: 2,
          opacity: sponsor.opacity,
          filter: `blur(${sponsor.blur}px)`,
          transform: `translate(-50%, -50%) translateY(${sponsor.y}px) scale(${sponsor.scale})`,
          willChange: "opacity, filter, transform",
        }}
      >
        <Img
          src={staticFile("brand/backed-by-galaxy.svg")}
          style={{
            width: 288,
            height: 45,
            display: "block",
            objectFit: "contain",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          zIndex: 2,
          width: LOCKUP_WIDTH,
          height: LOCKUP_HEIGHT,
          transform: "translate(-50%, -50%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: MARK_SIZE,
            height: MARK_SIZE,
            opacity: mark.opacity,
            filter: `blur(${mark.blur}px) drop-shadow(0 0 28px rgba(1,120,255,0.24))`,
            transformOrigin: "50% 50%",
            transform: `translate(${mark.x}px, ${mark.y}px) rotate(${mark.rotate}deg) scale(${mark.scale})`,
            willChange: "opacity, filter, transform",
          }}
        >
          <Img
            src={staticFile("nick/nick-mark.svg")}
            style={{
              width: "100%",
              height: "100%",
              display: "block",
            }}
          />
        </div>

        <div
          style={{
            position: "absolute",
            left: WORDMARK_LEFT,
            top: 0,
            width: WORDMARK_WIDTH,
            height: LOCKUP_HEIGHT,
            overflow: "hidden",
            opacity: wordmark.opacity,
            filter: `blur(${wordmark.blur}px)`,
            transform: `translateX(${wordmark.x}px)`,
            willChange: "opacity, filter, transform",
          }}
        >
          <Img
            src={staticFile("figma/logo.svg")}
            style={{
              position: "absolute",
              left: -WORDMARK_LEFT,
              top: 0,
              width: LOCKUP_WIDTH,
              height: LOCKUP_HEIGHT,
              maxWidth: "none",
              display: "block",
            }}
          />
        </div>
      </div>

      <div
        aria-label={ctaHeadline}
        style={{
          position: "absolute",
          top: "64%",
          right: 100,
          left: 100,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          fontFamily: DUPLET,
          fontSize: 68,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {words.map((word, index) => {
          const wordState = animation.words[index];
          return (
            <span
              key={`${word}-${index}`}
              style={{
                display: "inline-block",
                opacity: wordState.opacity,
                filter: `blur(${wordState.blur}px)`,
                letterSpacing: wordState.tracking,
                transform: `translateY(${wordState.y}px) scale(${wordState.scale})`,
                willChange: "opacity, filter, transform",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          top: "75%",
          right: 0,
          left: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          color: "#4b9cff",
          fontFamily: MANROPE,
          fontSize: 40,
          fontWeight: 650,
          letterSpacing: 0.4,
          opacity: url.opacity,
          filter: `blur(${url.blur}px)`,
          transform: `translateY(${url.y}px) scale(${url.scale})`,
          willChange: "opacity, filter, transform",
        }}
      >
        <Link2 aria-hidden size={40} strokeWidth={2.2} />
        {ctaUrl}
      </div>
    </AbsoluteFill>
  );
};
