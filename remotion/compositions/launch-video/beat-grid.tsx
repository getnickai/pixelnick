/* eslint-disable @next/next/no-img-element */
/**
 * Beat 9, Grid (STA-494). Camera pulls back to reveal all three workflows in
 * their own framed cards, side by side, with the product tagline beneath. The
 * "family shot".
 *
 * Timeline (local frames, from LAUNCH_VIDEO_TIMELINE.workflowGrid):
 *   shell   {0,12}     background + logo fade in; subtle whole-grid pull-back
 *   cards   {4,5,14}   three cards settle in (opacity + rise + pop), staggered
 *   tagline {30,14}    tagline reveals (opacity + rise)
 *   outro   {86,10}    gentle fade
 */
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { WorkflowGraph, fitCamera } from "../nick-launch-video/graph";
import { LAUNCH_WORKFLOWS, TAGLINE } from "../nick-launch-video/props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { progress, POP_EASE, FAST_FADE_EASE, OUTRO_EASE } from "./motion";

const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
const BG = "#070b14";
const CANVAS_W = 2600;
const CANVAS_H = 1200;

function Background() {
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: BG }} />
      <img
        alt=""
        src={staticFile("figma/background-glow.svg")}
        style={{ position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)", width: "120%", opacity: 0.6 }}
      />
    </>
  );
}

function Logo() {
  return (
    <div style={{ position: "absolute", top: 54, left: 80, display: "flex", alignItems: "center", gap: 12 }}>
      <img alt="" src={staticFile("nick/nick-mark.svg")} style={{ height: 44, width: 44, display: "block" }} />
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: 36, letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>NickAI</span>
    </div>
  );
}

export const WorkflowGridSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { shell, cards, tagline, outro } = LAUNCH_VIDEO_TIMELINE.workflowGrid;

  // Grid geometry, matches GridScreen (screens.tsx) exactly.
  const cardW = 556;
  const cardH = 470;
  const gap = 44;
  const totalW = cardW * 3 + gap * 2;
  const startX = (1920 - totalW) / 2;
  const top = 150;

  const beatOut = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const shellIn = progress(frame, shell.start, shell.duration, FAST_FADE_EASE);
  const beatOpacity = shellIn * (1 - beatOut);

  // Subtle camera pull-back on the whole grid group.
  const pullBack = progress(frame, shell.start, shell.duration, POP_EASE);
  const gridScale = 1.03 - 0.03 * pullBack;

  const taglineP = progress(frame, tagline.start, tagline.duration, FAST_FADE_EASE);
  const taglineSettle = progress(frame, tagline.start, tagline.duration, POP_EASE);

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: SANS, opacity: beatOpacity }}>
      <Background />
      <Logo />

      {/* Grid group: pulls back subtly as it enters. */}
      <AbsoluteFill style={{ transform: `scale(${gridScale})`, transformOrigin: "center center" }}>
        {LAUNCH_WORKFLOWS.map((w, i) => {
          const start = cards.start + i * cards.stagger;
          const opacity = progress(frame, start, cards.duration, FAST_FADE_EASE);
          const settle = progress(frame, start, cards.duration, POP_EASE);
          const translateY = (1 - settle) * 24;
          const scale = 0.96 + settle * 0.04;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: startX + i * (cardW + gap),
                top,
                width: cardW,
                height: cardH,
                borderRadius: 28,
                border: "1px solid rgba(255,255,255,0.09)",
                backgroundColor: "rgba(11,16,26,0.85)",
                boxShadow: "0 40px 90px -40px rgba(0,0,0,0.8)",
                overflow: "hidden",
                opacity,
                transform: `translateY(${translateY}px) scale(${scale})`,
                transformOrigin: "center center",
              }}
            >
              <div style={{ position: "absolute", inset: 8, bottom: 88 }}>
                <WorkflowGraph template={w.template} vw={cardW - 16} vh={cardH - 96} cw={CANVAS_W} ch={CANVAS_H} camera={fitCamera(cardW - 16, cardH - 96, CANVAS_W, CANVAS_H)} />
              </div>
              <div style={{ position: "absolute", bottom: 22, left: 28, right: 28, fontFamily: SANS, fontSize: 26, fontWeight: 600, color: "#fff" }}>{w.template.name}</div>
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            top: top + cardH + 78,
            width: "100%",
            textAlign: "center",
            fontFamily: SANS,
            fontSize: 46,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.01em",
            opacity: taglineP,
            transform: `translateY(${(1 - taglineSettle) * 16}px)`,
          }}
        >
          {TAGLINE}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
