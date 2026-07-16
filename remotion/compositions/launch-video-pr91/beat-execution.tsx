/**
 * Beat 11, Execution (STA-494). The full product UX is visible, then a big blue
 * "Execute" button appears in the middle. The pointer clicks it → the camera
 * zooms into the canvas as the workflow nodes turn green and the Execution Logs
 * stream → the run completes → the camera pulls back and a "Workflow executed
 * successfully" banner + an AAPL trade-fill confirmation card animate in → the
 * product UX fades to dark around the trade card, handing the card off to the
 * finale grid (which opens on the same centered card).
 */
import {
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ArrowRight, Check } from "lucide-react";
import { ProductScreen, PRODUCT_WS, ZoomInto } from "../nick-launch-video/screens";
import { TradeConfirmationCardView } from "../chat-cards/trade-confirmation-card-view";
import { SAMPLE_TRADE_AAPL } from "../chat-cards/props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";
import { readableOverviewCamera } from "./graph-anim";
import { PRODUCT_CUT_MAG7_WORKFLOW } from "./montage-workflows";

const CAM_EASE = Easing.inOut(Easing.cubic);
const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";

// 16 lead rows x 27px row height — the streaming depth of ExecutionLogs.
const LOG_SCROLL_MAX = 16 * 27;
const CONFIRMATION_WIDTH = 560;

export const ExecutionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { button, cursor, click, logsOpen, scroll, finish, confirm, fadeUX, durationInFrames } =
    LAUNCH_VIDEO_TIMELINE.execution;
  const { wsW, canvasH } = PRODUCT_WS;
  const { template, canvasW, canvasH: graphCanvasH } = PRODUCT_CUT_MAG7_WORKFLOW;
  const graphCamera = readableOverviewCamera({
    template,
    vw: wsW,
    vh: canvasH,
    cw: canvasW,
    ch: graphCanvasH,
    variant: "cinematic",
    overviewScale: 0.55,
    leftSafeArea: 44,
  });

  // Camera: full frame while the button is clicked, then zoom into the canvas as
  // the run streams, then pull back to center for the confirmation.
  const camFrames = [
    0,
    click.start,
    click.start + click.duration,
    scroll.start,
    scroll.start + scroll.duration,
    finish.start + finish.duration,
    durationInFrames,
  ];
  const camOpts = { easing: CAM_EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const ox = interpolate(frame, camFrames, [50, 50, 50, 72, 72, 50, 50], camOpts);
  const oy = interpolate(frame, camFrames, [50, 50, 50, 60, 60, 50, 50], camOpts);
  const scale = interpolate(frame, camFrames, [1, 1, 1, 1.5, 1.5, 1, 1], camOpts);

  // Run state: begins on the click, completes at the finish slot.
  const running = frame >= click.start + 4 && frame < finish.start;
  const completed = frame >= finish.start;
  const logsShown = frame >= logsOpen.start;

  const logsReveal = progress(frame, logsOpen.start, logsOpen.duration, FAST_FADE_EASE);
  const scrolled = progress(frame, scroll.start, scroll.duration, Easing.inOut(Easing.quad));
  const logScroll = LOG_SCROLL_MAX * (1 - scrolled);
  const logCount = Math.round(
    interpolate(frame, [scroll.start, scroll.start + scroll.duration], [96, 168], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );
  // Advance node states on the same frame window as the streaming execution
  // rows. Each topological step becomes blue while active, then green before
  // the next dependent node begins.
  const nodeExecutionProgress = interpolate(
    frame,
    [scroll.start, scroll.start + scroll.duration],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Centered blue Execute button (the clear run trigger). ──
  const btnIn = progress(frame, button.start, button.duration, POP_EASE);
  const pressDown = progress(
    frame,
    click.start,
    3,
    Easing.out(Easing.cubic),
  );
  const releaseStart = click.start + 3;
  const releaseSpring = spring({
    frame: Math.max(0, frame - releaseStart),
    fps,
    durationInFrames: 10,
    config: { damping: 9, stiffness: 280, mass: 0.55 },
  });
  const btnPress =
    frame < releaseStart
      ? pressDown
      : Math.max(0, Math.min(1, 1 - releaseSpring));
  const clickScale =
    frame < releaseStart
      ? 1 - pressDown * 0.055
      : 0.945 + releaseSpring * 0.055;
  // Button fades + collapses on the click.
  const btnOut = progress(frame, click.start + 7, 8, FAST_FADE_EASE);
  const btnOpacity = btnIn * (1 - btnOut);

  // Pointer: eases in toward the button then presses.
  const cursorMove = progress(frame, cursor.start, cursor.duration, Easing.out(Easing.cubic));
  const cursorIn = progress(frame, cursor.start - 2, 4, FAST_FADE_EASE);
  const cursorOut = progress(frame, click.start + 3, 5, FAST_FADE_EASE);
  const cursorOpacity = cursorIn * (1 - cursorOut);
  const CUR_X = 960 + (1 - cursorMove) * 150;
  const CUR_Y = 600 + (1 - cursorMove) * 120;

  // ── Completion payoff + hand-off. ──
  const confirmP = progress(frame, confirm.start, confirm.duration, POP_EASE);
  const bannerP = progress(frame, confirm.start, 10, FAST_FADE_EASE);
  const cardIn = progress(frame, confirm.start + 4, confirm.duration, POP_EASE);
  const fadeUXP = progress(frame, fadeUX.start, fadeUX.duration, FAST_FADE_EASE);
  // Dim the product UX as the Execute button appears (same effect as the trade
  // confirmation), then lift it on the click so the run reads clearly; dim again
  // on confirm so the card reads; then fade the whole UX to near-black.
  const dimIn = progress(frame, button.start, 10, FAST_FADE_EASE);
  const dimOut = progress(frame, click.start, 8, FAST_FADE_EASE);
  const buttonScrim = dimIn * (1 - dimOut) * 0.5;
  const scrim = Math.max(
    buttonScrim,
    Math.min(1, confirmP * 0.82 + fadeUXP * 0.18),
  );
  // The banner retires as the UX fades (the finale opens on just the card).
  const bannerOpacity = bannerP * (1 - fadeUXP);

  return (
    <>
      <ZoomInto ox={`${ox}%`} oy={`${oy}%`} scale={scale}>
        <ProductScreen
          running={running}
          completed={completed}
          logs={logsShown}
          logsReveal={logsReveal}
          logStreaming={logsShown}
          logScroll={logScroll}
          logCount={logCount}
          workflow={PRODUCT_CUT_MAG7_WORKFLOW}
          workflowCanvasW={canvasW}
          workflowCanvasH={graphCanvasH}
          workflowCamera={graphCamera}
          workflowNodeVariant="cinematic"
          workflowRunProgress={nodeExecutionProgress}
        />
      </ZoomInto>

      {/* Dim / fade-to-dark scrim over the product UX. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#04070d",
          opacity: scrim,
          pointerEvents: "none",
        }}
      />

      {/* Centered blue Execute button — the run trigger. */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: 300,
          height: 92,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          borderRadius: 46,
          color: "#fff",
          background: "linear-gradient(180deg, #0b84ff 0%, #0178ff 58%, #006eea 100%)",
          boxShadow: `0 ${18 - btnPress * 10}px ${48 - btnPress * 22}px rgba(1, 120, 255, ${0.2 - btnPress * 0.04}), inset 0 1px 0 rgba(255,255,255,${0.2 - btnPress * 0.08})`,
          opacity: btnOpacity,
          transform: `translate(-50%, -50%) scale(${(0.9 + btnIn * 0.1) * clickScale})`,
          fontFamily: SANS,
          fontSize: 34,
          fontWeight: 650,
          letterSpacing: -0.5,
        }}
      >
        Execute <ArrowRight size={32} strokeWidth={2.2} />
      </div>

      {/* Pointer clicking the Execute button. */}
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 62,
          height: 62,
          overflow: "visible",
          opacity: cursorOpacity,
          zIndex: 9,
          pointerEvents: "none",
          transform: `translate3d(${CUR_X - 11}px, ${CUR_Y - 11}px, 0) scale(${1 - btnPress * 0.12})`,
          transformOrigin: "11px 11px",
        }}
      >
        <path
          d="M3.52832 4.03809C3.40568 3.71915 3.71916 3.40568 4.03809 3.52832L16.2471 8.22461C16.5924 8.35745 16.5814 8.8498 16.2305 8.9668L11.0195 10.7031L10.7822 10.7822L10.7031 11.0195L8.9668 16.2305C8.8498 16.5814 8.35745 16.5924 8.22461 16.2471L3.52832 4.03809Z"
          fill="black"
          stroke="white"
        />
      </svg>

      {/* "Workflow executed successfully" banner — sits just above the card. */}
      <div
        style={{
          position: "absolute",
          top: 340,
          left: "50%",
          boxSizing: "border-box",
          width: CONFIRMATION_WIDTH,
          transform: `translate(-50%, ${(1 - bannerP) * -20}px)`,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 24px",
          borderRadius: 999,
          // Opaque so the workflow node behind never bleeds through the text.
          backgroundColor: "#1fc16b",
          boxShadow: "0 20px 50px -28px rgba(31,193,107,0.7)",
          opacity: bannerOpacity,
          fontFamily: SANS,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 999,
            backgroundColor: "#ffffff",
          }}
        >
          <Check size={22} color="#15803d" strokeWidth={3} />
        </span>
        <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff" }}>
          Workflow executed successfully
        </span>
      </div>

      {/* AAPL trade-fill confirmation card, centered. Persists into the finale. */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: CONFIRMATION_WIDTH,
          transform: `translate(-50%, calc(-50% + 30px)) translateY(${(1 - cardIn) * 26}px) scale(${0.96 + cardIn * 0.04})`,
          opacity: cardIn,
          filter: cardIn >= 1 ? undefined : `blur(${(1 - cardIn) * 6}px)`,
        }}
      >
        <TradeConfirmationCardView
          data={SAMPLE_TRADE_AAPL}
          width={CONFIRMATION_WIDTH}
          anim={cardIn}
        />
      </div>
    </>
  );
};
