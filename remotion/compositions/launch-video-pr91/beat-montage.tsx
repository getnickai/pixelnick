/**
 * Beat 8, Workflow montage (STA-494). After the NVDA hero build, the composer
 * prompt swaps and two MORE workflows build fast, each with a zoom-in-on-first-
 * nodes then pull-back-to-full arc (via `zoomIntroCamera` + `buildReveal`),
 * establishing "any strategy, in seconds". The composer is the SAME chat box
 * shown at the start of the video (Onur's ChatComposerSequence chrome), now
 * carrying each workflow's own prompt as it swaps.
 *
 * Timeline (local frames, from LAUNCH_VIDEO_TIMELINE.workflowMontage):
 *   intro  {0,10}    whole beat fades in, composer + graph A present
 *   type2  {8,38}   centered composer types workflow A's prompt
 *   clickA {60,22}  centered composer receives the physical Send interaction
 *   dock2  {82,16}  composer moves down only after the rebound completes
 *   build2 {98,72}  workflow A builds with five deliberate close nodes, then overview
 *   swap3  {190,14} first graph clears while the composer stays docked
 *   type3  {204,38} composer types workflow B's prompt in place at the bottom
 *   clickB {250,22} docked composer repeats the physical Send interaction
 *   build3 {272,72} workflow B repeats the same measured camera grammar
 *   outro  {368,12} clean fade out after a readable settled hold
 */
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ArrowUp,
  ChevronDown,
  Folder,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { WorkflowGraph } from "../nick-launch-video/graph";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { progress, POP_EASE, FAST_FADE_EASE, OUTRO_EASE } from "./motion";
import { buildReveal, progressiveBuildCamera } from "./graph-anim";
import {
  LEAN_MONTAGE_WORKFLOWS,
  PRODUCT_CUT_MONTAGE_VIEWPORT,
} from "./montage-workflows";
import { PRODUCT_CUT_INTERACTION_SCALE } from "./readability";

const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
// Matches ChatComposerSequence (composition.tsx) so the composer reads identical.
const MANROPE = "Manrope, ui-sans-serif, system-ui, sans-serif";
// Match the rest of the film's near-black canvas (was #070b14, which read as a
// dark-blue tint at this beat).
const BG = "#09090b";
const BLUE = "#0178FF";

/* Canvas geometry, matches WorkflowWide (screens.tsx). */
const VW = PRODUCT_CUT_MONTAGE_VIEWPORT.width;
const VH = PRODUCT_CUT_MONTAGE_VIEWPORT.height;
const WF_TOP = PRODUCT_CUT_MONTAGE_VIEWPORT.top;

/* Chat box (mirrors the beginning composer's 1050px shell). */
const CHAT_W = 1050;
const CHAT_LEFT = (1920 - CHAT_W) / 2;
const CHAT_TOP = 882;
const CHAT_CENTER_TOP = 430;
const CHAT_CENTER_X = 960;

/* ── Shared chrome ────────────────────────────────────────────────────────── */

function Background() {
  // Plain near-black to match the opening/finale beats (no blue glow overlay).
  return <AbsoluteFill style={{ backgroundColor: BG }} />;
}

/** Two cross-fading spans (old lifts out, new drops in) sharing one anchor.
 *  Reused for the workflow title and the composer prompt so both swap in sync. */
function Swap({
  a,
  b,
  outP,
  inP,
  center = false,
  style,
}: {
  a: React.ReactNode;
  b: React.ReactNode;
  outP: number;
  inP: number;
  center?: boolean;
  style?: React.CSSProperties;
}) {
  // Absolute spans share one anchor. When centered they span the full width so
  // textAlign centers the (out-of-flow) text; otherwise they left-align.
  const anchor: React.CSSProperties = center
    ? { position: "absolute", left: 0, right: 0, top: 0, textAlign: "center", whiteSpace: "nowrap" }
    : { position: "absolute", left: 0, top: 0, whiteSpace: "nowrap" };
  return (
    <div style={{ position: "relative", ...style }}>
      <span style={{ ...anchor, opacity: 1 - outP, transform: `translateY(${-outP * 12}px)` }}>
        {a}
      </span>
      <span style={{ ...anchor, opacity: inP, transform: `translateY(${(1 - inP) * 12}px)` }}>
        {b}
      </span>
    </div>
  );
}

/**
 * The beginning chat box, faithfully reproduced: rounded #18181b shell, blue
 * focus border, big prompt line, action row (+, Opus 4.8 chip, mic, send arrow),
 * and the Chat / Agent tab strip. Sizing/colors match ChatComposerSequence; only
 * the prompt area height is trimmed to a single line for this in-flow use.
 */
function ChatBox({
  prompt,
  top = CHAT_TOP,
  sendPress = 0,
  composerScale = 1,
  sendButtonScale = 1,
  ripple = 0,
  rippleShown = false,
}: {
  prompt: React.ReactNode;
  /** Animated vertical anchor: centered while typing, bottom while building. */
  top?: number;
  /** Send-button press pulse (0 idle, 1 fully pressed). */
  sendPress?: number;
  /** Whole-composer physical compression and rebound. */
  composerScale?: number;
  /** Send-button compression and rebound. */
  sendButtonScale?: number;
  /** Click ripple progress (0..1). */
  ripple?: number;
  /** Whether the ripple ring is currently visible. */
  rippleShown?: boolean;
}) {
  const action48 = {
    width: 48,
    height: 48,
    display: "grid",
    placeItems: "center",
  } as const;
  // The send button lights up brand-blue as it is pressed (matches the opening).
  const sendActive = Math.max(0, Math.min(1, sendPress));
  const sendBg = `rgb(${Math.round(24 - sendActive * 23)}, ${Math.round(24 + sendActive * 96)}, ${Math.round(27 + sendActive * 228)})`;
  const sendFg = Math.round(113 + sendActive * 142);
  return (
    <div
      style={{
        position: "absolute",
        left: CHAT_LEFT,
        top,
        width: CHAT_W,
        fontFamily: MANROPE,
        transform: `scale(${composerScale * PRODUCT_CUT_INTERACTION_SCALE})`,
        transformOrigin: "center center",
      }}
    >
      <div
        style={{
          position: "relative",
          padding: 4,
          borderRadius: 31,
          border: "1px solid #27272a",
          backgroundColor: "#18181b",
          boxShadow: `0 ${28 - sendPress * 12}px ${80 - sendPress * 28}px rgba(0, 0, 0, ${0.46 - sendPress * 0.08}), 0 ${2 - sendPress}px ${8 - sendPress * 3}px rgba(0, 0, 0, 0.28)`,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            borderRadius: 28,
            border: `3px solid ${BLUE}`,
            backgroundColor: "#09090b",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.24)",
          }}
        >
          <div
            style={{
              position: "relative",
              minHeight: 44,
              padding: "30px 32px 30px",
              color: "#fafafa",
              fontSize: 29,
              fontWeight: 500,
              lineHeight: 1.35,
              letterSpacing: -0.45,
            }}
          >
            {prompt}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 20px 19px",
              color: "#a1a1aa",
            }}
          >
            <div style={{ ...action48, borderRadius: "50%", border: "1px solid #3f3f46", backgroundColor: "#18181b" }}>
              <Plus size={25} strokeWidth={1.8} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "0 10px", fontSize: 22, fontWeight: 600 }}>
              Opus 4.8 <ChevronDown size={19} strokeWidth={1.8} />
            </div>
            <div style={{ flex: 1 }} />
            <div style={action48}>
              <Mic size={25} strokeWidth={1.8} />
            </div>
            <div
              style={{
                ...action48,
                position: "relative",
                borderRadius: "50%",
                color: `rgb(${sendFg}, ${sendFg}, ${sendFg})`,
                backgroundColor: sendBg,
                boxShadow: `inset 0 0 0 1px rgba(63, 63, 70, ${1 - sendActive})`,
                transform: `scale(${sendButtonScale})`,
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: -4,
                  borderRadius: "50%",
                  border: "2px solid rgba(1, 120, 255, 0.84)",
                  opacity: rippleShown ? 1 - ripple : 0,
                  transform: `scale(${1 + ripple * 0.9})`,
                  pointerEvents: "none",
                }}
              />
              <ArrowUp size={25} strokeWidth={2} />
            </div>
          </div>
        </div>

        <div
          style={{
            height: 70,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 22px 0 10px",
            color: "#a1a1aa",
            fontSize: 20,
            fontWeight: 500,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: 4, borderRadius: 25 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "10px 15px" }}>
              <MessageCircle size={22} strokeWidth={1.8} /> Chat
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                padding: "10px 15px",
                borderRadius: 23,
                color: "#4da0ff",
                backgroundColor: "rgba(1, 120, 255, 0.16)",
              }}
            >
              <Folder size={22} strokeWidth={1.8} /> Agent
            </div>
          </div>
          <MoreHorizontal size={24} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

/* ── Beat ─────────────────────────────────────────────────────────────────── */

export const WorkflowMontageSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { intro, type2, dock2, build2, swap3, type3, build3, outro } =
    LAUNCH_VIDEO_TIMELINE.workflowMontage;

  const wA = LEAN_MONTAGE_WORKFLOWS[0]; // Multi-LLM Consensus Trader
  const wB = LEAN_MONTAGE_WORKFLOWS[1]; // Mag 7 Stock Rotator

  const beatIn = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const beatOut = progress(frame, outro.start, outro.duration, OUTRO_EASE);
  const beatOpacity = beatIn * (1 - beatOut);

  // Canvas A is on screen until the swap, then cross-fades to canvas B.
  const swapP = progress(frame, swap3.start, swap3.duration, FAST_FADE_EASE);
  const canvasAOpacity = 1 - swapP;
  const canvasBOpacity = swapP;

  const revealA = buildReveal(wA.template, frame, build2.start, build2.duration);
  const revealB = buildReveal(wB.template, frame, build3.start, build3.duration);

  // Each workflow opens framed on its first 2 nodes (fully in view) during its
  // build window, then pulls the camera back to the whole graph.
  const cameraA = progressiveBuildCamera({
    template: wA.template,
    vw: VW,
    vh: VH,
    cw: wA.canvasW,
    ch: wA.canvasH,
    frame,
    buildStart: build2.start,
    // Let the camera keep settling through most of the readable hold instead
    // of completing the pullback at the same instant as the last node.
    buildDur: build2.duration + 12,
    variant: "cinematic",
  });
  const cameraB = progressiveBuildCamera({
    template: wB.template,
    vw: VW,
    vh: VH,
    cw: wB.canvasW,
    ch: wB.canvasH,
    frame,
    buildStart: build3.start,
    buildDur: build3.duration + 12,
    variant: "cinematic",
  });

  // Prompt + title swap: old text lifts out over the first half of the swap, new
  // text drops in over the second half.
  const promptOut = progress(frame, swap3.start, swap3.duration * 0.5, FAST_FADE_EASE);
  const promptIn = progress(frame, swap3.start + swap3.duration * 0.5, swap3.duration * 0.5, POP_EASE);

  const typedPrompt = (text: string, start: number, duration: number) => {
    const chars = Math.floor(
      interpolate(frame, [start, start + duration], [0, text.length], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      }),
    );
    return text.slice(0, chars);
  };
  const promptA = typedPrompt(wA.prompt, type2.start, type2.duration);
  const promptB = typedPrompt(wB.prompt, type3.start, type3.duration);

  const firstDock = progress(frame, dock2.start, dock2.duration, Easing.inOut(Easing.exp));
  const firstComposerTop = interpolate(firstDock, [0, 1], [CHAT_CENTER_TOP, CHAT_TOP]);
  const composerTop = firstComposerTop;

  // Match the opening composer's physical interaction: cursor approach, four
  // frames of compression, a one-frame contact hold, then a damped rebound.
  // The first composer does not begin docking until this full cycle completes.
  const clickDuration = 22;
  const clickAStart = dock2.start - clickDuration;
  const clickBStart = build3.start - clickDuration;
  const pressState = (start: number) => {
    const contactStart = start + 7;
    const releaseStart = contactStart + 5;
    const active = frame >= start && frame < start + clickDuration;
    const pressDown = progress(
      frame,
      contactStart,
      4,
      Easing.out(Easing.exp),
    );
    const releaseSpring = spring({
      frame: Math.max(0, frame - releaseStart),
      fps,
      durationInFrames: 10,
      config: {
        damping: 14,
        stiffness: 180,
        mass: 0.75,
      },
    });
    const press = !active
      ? 0
      : frame < releaseStart
        ? pressDown
        : Math.max(0, Math.min(1, 1 - releaseSpring));
    const composerScale = !active
      ? 1
      : frame < releaseStart
        ? 1 - pressDown * 0.025
        : 0.975 + releaseSpring * 0.025;
    const buttonScale = !active
      ? 1
      : frame < releaseStart
        ? 1 - pressDown * 0.075
        : 0.925 + releaseSpring * 0.075;

    return {
      active,
      contactStart,
      press,
      composerScale,
      buttonScale,
    };
  };
  const pressA = pressState(clickAStart);
  const pressB = pressState(clickBStart);
  const activePress = pressB.active ? pressB : pressA;
  const sendPress = activePress.press;
  const composerClickScale = activePress.composerScale;
  const sendButtonClickScale = activePress.buttonScale;
  const ripple = progress(
    frame,
    activePress.contactStart,
    8,
    FAST_FADE_EASE,
  );
  const rippleShown =
    activePress.active &&
    frame >= activePress.contactStart &&
    frame < activePress.contactStart + 8;

  // Pointer: fades in just before each click, presses on the arrow, fades as the
  // build begins.
  const curA =
    progress(frame, clickAStart, 4, FAST_FADE_EASE) *
    (1 - progress(frame, clickAStart + clickDuration - 4, 4, FAST_FADE_EASE));
  const curB =
    progress(frame, clickBStart, 4, FAST_FADE_EASE) *
    (1 - progress(frame, clickBStart + clickDuration - 4, 4, FAST_FADE_EASE));
  const cursorOpacity = Math.max(curA, curB) * beatOpacity;
  const cursorApproach = pressB.active
    ? progress(frame, clickBStart, 7, Easing.out(Easing.exp))
    : progress(frame, clickAStart, 7, Easing.out(Easing.exp));
  // Send-arrow center (screen px), inside the montage ChatBox action row.
  const SEND_X =
    CHAT_CENTER_X +
    (1434 - CHAT_CENTER_X) * PRODUCT_CUT_INTERACTION_SCALE;
  const SEND_Y = composerTop + 134;
  const curX = SEND_X + (1 - cursorApproach) * 34;
  const curY = SEND_Y + (1 - cursorApproach) * 40;

  // Steady caret blink, like the live composer.
  const caretVisible = Math.floor(frame / 8) % 2 === 0;
  const Caret = (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 2,
        height: 26,
        marginLeft: 3,
        verticalAlign: -4,
        backgroundColor: BLUE,
        opacity: caretVisible ? 1 : 0,
      }}
    />
  );

  const canvasLeft = (1920 - VW) / 2;

  return (
    <AbsoluteFill style={{ backgroundColor: BG, fontFamily: SANS }}>
      <Background />

      {/* Workflow canvas: both graphs stacked, cross-fading on the swap. */}
      <div
        style={{
          position: "absolute",
          left: canvasLeft,
          top: WF_TOP,
          width: VW,
          height: VH,
          overflow: "hidden",
          opacity: beatIn,
        }}
      >
        <div style={{ position: "absolute", inset: 0, opacity: canvasAOpacity }}>
          <WorkflowGraph template={wA.template} vw={VW} vh={VH} cw={wA.canvasW} ch={wA.canvasH} camera={cameraA} nodeReveal={revealA.nodeReveal} edgeReveal={revealA.edgeReveal} nodeVariant="cinematic" />
        </div>
        <div style={{ position: "absolute", inset: 0, opacity: canvasBOpacity }}>
          <WorkflowGraph template={wB.template} vw={VW} vh={VH} cw={wB.canvasW} ch={wB.canvasH} camera={cameraB} nodeReveal={revealB.nodeReveal} edgeReveal={revealB.edgeReveal} nodeVariant="cinematic" />
        </div>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "linear-gradient(to right, transparent 0%, transparent calc(100% - 150px), rgba(9, 9, 11, 0.72) calc(100% - 54px), #09090b 100%)",
            boxShadow:
              "inset 3px 0 #09090b, inset -3px 0 #09090b, inset 0 3px #09090b, inset 0 -3px #09090b",
          }}
        />
      </div>

      {/* The composer retires on the outro; the graph itself remains fully
          present so the following camera move begins from this exact frame. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: beatOpacity,
        }}
      >
        <ChatBox
          top={composerTop}
          sendPress={sendPress}
          composerScale={composerClickScale}
          sendButtonScale={sendButtonClickScale}
          ripple={ripple}
          rippleShown={rippleShown}
          prompt={
            <Swap
              a={<>{promptA}{Caret}</>}
              b={<>{promptB}{Caret}</>}
              outP={promptOut}
              inP={promptIn}
              style={{ display: "block", height: 40 }}
            />
          }
        />

        {/* Pointer that clicks the send arrow to trigger each build. */}
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: 46,
            height: 46,
            overflow: "visible",
            opacity: cursorOpacity,
            zIndex: 9,
            pointerEvents: "none",
            transform: `translate3d(${curX - 8}px, ${curY - 8}px, 0) scale(${1 - sendPress * 0.12})`,
            transformOrigin: "8px 8px",
          }}
        >
          <path
            d="M3.52832 4.03809C3.40568 3.71915 3.71916 3.40568 4.03809 3.52832L16.2471 8.22461C16.5924 8.35745 16.5814 8.8498 16.2305 8.9668L11.0195 10.7031L10.7822 10.7822L10.7031 11.0195L8.9668 16.2305C8.8498 16.5814 8.35745 16.5924 8.22461 16.2471L3.52832 4.03809Z"
            fill="black"
            stroke="white"
          />
        </svg>
      </div>
    </AbsoluteFill>
  );
};
