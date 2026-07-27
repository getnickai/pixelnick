import { useEffect, useMemo, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { createNickIntroAnimation } from "./motion";
import type { NickIntroProps } from "./props";
import { NICK_INTRO_PLAYBACK_RATE } from "./timeline";

const DUPLET = 'var(--font-duplet, "Duplet"), ui-sans-serif, system-ui, sans-serif';

// Keep the canonical 143.469:30 SVG ratio so preserveAspectRatio="none" never
// distorts the exact NickAI wordmark paths.
const LOCKUP_WIDTH = 688.65;
const LOCKUP_HEIGHT = 144;
const MARK_SIZE = 144;
const WORDMARK_LEFT = 204.89;
const WORDMARK_WIDTH = LOCKUP_WIDTH - WORDMARK_LEFT;

export const NickIntroComposition: React.FC<NickIntroProps> = ({ tagline }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = useMemo(() => tagline.trim().split(/\s+/).filter(Boolean), [tagline]);
  const animation = useMemo(
    () => createNickIntroAnimation(words.length),
    [words.length],
  );

  const [fontHandle] = useState(() => delayRender("nick-intro-fonts"));
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

  // Remotion is the clock. Anime.js only evaluates its paused timeline.
  animation.timeline.seek(
    (frame / fps) * 1_000 * NICK_INTRO_PLAYBACK_RATE,
    true,
  );

  const { scene, mark, wordmark } = animation;

  return (
    <AbsoluteFill
      style={{
        overflow: "hidden",
        backgroundColor: "#050608",
        color: "#FAFAFA",
        fontFamily: DUPLET,
      }}
    >
      <Img
        aria-hidden
        src={staticFile("nick/nick-intro-glow.svg")}
        style={{
          position: "absolute",
          left: "50%",
          top: "49%",
          width: 1_520,
          height: 1_520,
          // The intro-specific asset stays at full precision. Applying its
          // former 0.32 opacity once, here, avoids quantising the SVG and then
          // quantising the animated layer a second time.
          opacity: scene.glowOpacity * 0.32,
          mixBlendMode: "screen",
          transform: `translate(-50%, -50%) scale(${scene.glowScale})`,
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
            "radial-gradient(ellipse 48% 48% at 50% 48%, black 0%, transparent 78%)",
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
        style={{
          position: "absolute",
          left: "50%",
          top: "47%",
          zIndex: 4,
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
            filter: `blur(${mark.blur}px) drop-shadow(0 0 32px rgba(1,120,255,0.28))`,
            transformOrigin: "50% 50%",
            transform: `translate(${mark.x}px, ${mark.y}px) rotate(${mark.rotate}deg) scale(${mark.scale})`,
            willChange: "transform, opacity, filter",
          }}
        >
          <Img
            src={staticFile("nick/nick-mark.svg")}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
          <Img
            aria-hidden
            src={staticFile("nick/nick-mark.svg")}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              display: "block",
              opacity: mark.whiteOpacity,
              filter: "brightness(0) invert(1)",
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
            willChange: "transform, opacity, filter",
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
        aria-label={tagline}
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: "62.5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 21,
          fontSize: 72,
          fontWeight: 500,
          lineHeight: 1,
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
                transform: `translateY(${wordState.y}px)`,
                willChange: "transform, opacity, filter",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
