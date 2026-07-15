/* eslint-disable @next/next/no-img-element */
/**
 * Beat 8, Workflow montage (STA-494). After the NVDA hero build, the composer
 * prompt swaps and two MORE workflows finalize fast: each new graph pops in
 * already-finalized (a quick per-node stagger, not a slow node-by-node build),
 * establishing "any strategy, in seconds".
 *
 * Timeline (local frames, from LAUNCH_VIDEO_TIMELINE.workflowMontage):
 *   intro  {0,10}   whole beat fades in, composer + BTC canvas present
 *   build2 {20,22}  BTC (workflow #0) graph finalizes fast (per-node pop)
 *   swap3  {74,12}  composer prompt swaps to Multi-LLM; canvas cross-fades
 *   build3 {88,22}  Multi-LLM (workflow #1) graph finalizes fast
 *   outro  {146,10} quick fade out, hands off to the grid
 */
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { ArrowUp, Plus } from "lucide-react";
import { WorkflowGraph } from "../nick-launch-video/graph";
import { LAUNCH_WORKFLOWS } from "../nick-launch-video/props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { progress, POP_EASE, FAST_FADE_EASE, OUTRO_EASE } from "./motion";
import { buildReveal, zoomIntroCamera } from "./graph-anim";

const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
const BG = "#070b14";
const BLUE = "#0178FF";

/* Canvas geometry, matches WorkflowWide (screens.tsx). */
const CANVAS_W = 3600;
const CANVAS_H = 1700;
const VW = 1720;
const VH = 720;
const WF_TOP = 200;

/* ── Shared chrome ────────────────────────────────────────────────────────── */

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

/** Simplified composer pill (matches ChatBox look): plus, prompt, Nick, send. */
function Composer({ prompt, cx, cy, width = 1160 }: { prompt: React.ReactNode; cx: number; cy: number; width?: number }) {
  const H = 84;
  return (
    <div
      style={{
        position: "absolute",
        left: cx - width / 2,
        top: cy - H / 2,
        width,
        height: H,
        borderRadius: 22,
        border: "1.5px solid rgba(1,120,255,0.75)",
        backgroundColor: "rgba(6,10,16,0.92)",
        boxShadow: "0 0 0 3px rgba(1,120,255,0.08), 0 34px 90px -34px rgba(1,120,255,0.45)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: 18,
        fontFamily: SANS,
      }}
    >
      <Plus size={30} color="#c7ccd6" strokeWidth={2.2} />
      <div style={{ position: "relative", flex: 1, minWidth: 0, height: 44, fontSize: 32, color: "#fff" }}>
        {prompt}
      </div>
      <span style={{ fontSize: 26, fontWeight: 600, color: "#e6e8ec" }}>Nick</span>
      <div style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowUp size={28} color="#fff" strokeWidth={2.6} />
      </div>
    </div>
  );
}

/* ── Beat ─────────────────────────────────────────────────────────────────── */

export const WorkflowMontageSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { intro, build2, swap3, build3, outro } = LAUNCH_VIDEO_TIMELINE.workflowMontage;

  const wA = LAUNCH_WORKFLOWS[0]; // BTC Buy the Dip
  const wB = LAUNCH_WORKFLOWS[1]; // Multi-LLM Consensus

  const beatIn = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const beatOut = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const beatOpacity = beatIn * (1 - beatOut);

  // Canvas A (BTC) is on screen until the swap, then cross-fades to canvas B.
  const swapP = progress(frame, swap3.start, swap3.duration, FAST_FADE_EASE);
  const canvasAOpacity = 1 - swapP;
  const canvasBOpacity = swapP;

  const revealA = buildReveal(wA.template, frame, build2.start, build2.duration);
  const revealB = buildReveal(wB.template, frame, build3.start, build3.duration);

  // Each workflow opens zoomed on its first 2 nodes during its build window,
  // then pulls the camera back to the whole graph before the swap / beat end.
  const cameraA = zoomIntroCamera({
    template: wA.template,
    vw: VW,
    vh: VH,
    cw: CANVAS_W,
    ch: CANVAS_H,
    frame,
    buildStart: build2.start,
    buildDur: build2.duration,
    holdDur: 2,
    zoomOutDur: 28,
  });
  const cameraB = zoomIntroCamera({
    template: wB.template,
    vw: VW,
    vh: VH,
    cw: CANVAS_W,
    ch: CANVAS_H,
    frame,
    buildStart: build3.start,
    buildDur: build3.duration,
    holdDur: 2,
    zoomOutDur: 28,
  });

  // Prompt swap: old text lifts out over the first half of the swap, new text
  // drops in over the second half.
  const promptOut = progress(frame, swap3.start, swap3.duration * 0.5, FAST_FADE_EASE);
  const promptIn = progress(frame, swap3.start + swap3.duration * 0.5, swap3.duration * 0.5, POP_EASE);

  const canvasLeft = (1920 - VW) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: SANS, opacity: beatOpacity }}>
      <Background />
      <Logo />

      {/* Workflow canvas: both graphs stacked, cross-fading on the swap. */}
      <div style={{ position: "absolute", left: canvasLeft, top: WF_TOP, width: VW, height: VH }}>
        <div style={{ position: "absolute", inset: 0, opacity: canvasAOpacity }}>
          <WorkflowGraph template={wA.template} vw={VW} vh={VH} cw={CANVAS_W} ch={CANVAS_H} camera={cameraA} nodeReveal={revealA.nodeReveal} edgeReveal={revealA.edgeReveal} />
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: canvasBOpacity }}>
          <WorkflowGraph template={wB.template} vw={VW} vh={VH} cw={CANVAS_W} ch={CANVAS_H} camera={cameraB} nodeReveal={revealB.nodeReveal} edgeReveal={revealB.edgeReveal} />
        </div>
      </div>

      {/* Composer with the current prompt (swaps mid-beat). */}
      <Composer
        cx={960}
        cy={1010}
        prompt={
          <>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                whiteSpace: "nowrap",
                opacity: 1 - promptOut,
                transform: `translateY(${-promptOut * 12}px)`,
              }}
            >
              {wA.prompt}
            </span>
            <span
              style={{
                position: "absolute",
                left: 0,
                top: 2,
                whiteSpace: "nowrap",
                opacity: promptIn,
                transform: `translateY(${(1 - promptIn) * 12}px)`,
              }}
            >
              {wB.prompt}
            </span>
          </>
        }
      />
    </AbsoluteFill>
  );
};
