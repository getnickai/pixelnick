/**
 * Beat 11, Execution (STA-494). The full product UX is visible, then a big blue
 * "Execute" button appears in the middle. The pointer clicks it → the camera
 * zooms into the canvas as the workflow nodes turn green and the Execution Logs
 * stream → the run completes → the camera pulls back and a "Workflow executed
 * successfully" banner + an AAPL trade-fill confirmation card animate in → the
 * product UX fades to dark around the trade card, handing the card off to the
 * finale grid (which opens on the same centered card).
 */
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ArrowRight, Check } from "lucide-react";
import { ProductScreen, ZoomInto } from "../nick-launch-video/screens";
import { TradeConfirmationCardView } from "../chat-cards/trade-confirmation-card-view";
import { SAMPLE_TRADE_AAPL } from "../chat-cards/props";
import { FINALE_GRID, LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";

const CAM_EASE = Easing.inOut(Easing.cubic);
const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";

// 16 lead rows x 27px row height — the streaming depth of ExecutionLogs.
const LOG_SCROLL_MAX = 16 * 27;

export const ExecutionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { button, cursor, click, logsOpen, scroll, finish, confirm, fadeUX, durationInFrames } =
    LAUNCH_VIDEO_TIMELINE.execution;

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

  // Run state: begins on the click, completes at the finish slot. runProgress
  // drives the green wave gradually across that window (~2 nodes lit at a time,
  // propagating in topo order) instead of the graph flipping green at once.
  const running = frame >= click.start + 4 && frame < finish.start;
  const completed = frame >= finish.start;
  const runProgress = interpolate(frame, [click.start + 4, finish.start], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
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

  // ── Centered blue Execute button (the clear run trigger). ──
  const btnIn = progress(frame, button.start, button.duration, POP_EASE);
  const btnPress = interpolate(
    frame,
    [click.start, click.start + 3, click.start + click.duration],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  // Button fades + collapses on the click.
  const btnOut = progress(frame, click.start + 2, 8, FAST_FADE_EASE);
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
  const scrim = Math.max(buttonScrim, Math.min(1, confirmP * 0.5 + fadeUXP * 0.5));
  // The banner retires as the UX fades (the finale opens on just the card).
  const bannerOpacity = bannerP * (1 - fadeUXP);

  return (
    <>
      <ZoomInto ox={`${ox}%`} oy={`${oy}%`} scale={scale}>
        <ProductScreen
          running={running}
          runProgress={runProgress}
          completed={completed}
          logs={logsShown}
          logsReveal={logsReveal}
          logStreaming={logsShown}
          logScroll={logScroll}
          logCount={logCount}
        />
      </ZoomInto>

      {/* Dim / fade-to-dark scrim over the product UX. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          // Neutral near-black (was #04070d, a dark-blue tint that read as the
          // background going blue before returning to black at s32-33).
          backgroundColor: "#09090b",
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
          boxShadow: `0 18px 48px rgba(1, 120, 255, ${0.22 + btnPress * 0.12}), inset 0 1px 0 rgba(255,255,255,0.2)`,
          opacity: btnOpacity,
          transform: `translate(-50%, -50%) scale(${(0.9 + btnIn * 0.1) * (1 - btnPress * 0.05)})`,
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

      {/* "Workflow executed successfully" banner — sits just above the card,
          RIGHT-aligned to the card's right edge (card right = cxAapl + wAapl/2). */}
      <div
        style={{
          position: "absolute",
          top: 258,
          left: FINALE_GRID.cxAapl + FINALE_GRID.wAapl / 2,
          transform: `translate(-100%, ${(1 - bannerP) * -20}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "15px 30px",
          borderRadius: 999,
          // Opaque so the workflow node behind never bleeds through the text.
          backgroundColor: "#0c1f14",
          border: "1px solid rgba(31,193,107,0.6)",
          boxShadow: "0 20px 50px -28px rgba(0,0,0,0.7)",
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
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: "#1fc16b",
          }}
        >
          <Check size={24} color="#04140a" strokeWidth={3} />
        </span>
        <span style={{ fontSize: 32, fontWeight: 700, color: "#fff" }}>
          Workflow executed successfully
        </span>
      </div>

      {/* AAPL trade-fill confirmation card. Placed at its EXACT final-grid slot
          (position + size from FINALE_GRID) so the execution → finale hand-off
          has no move: the finale opens on it already sitting here. */}
      <div
        style={{
          position: "absolute",
          left: FINALE_GRID.cxAapl,
          top: FINALE_GRID.midCy,
          width: FINALE_GRID.wAapl,
          height: FINALE_GRID.midH,
          transform: `translate(-50%, calc(-50% + ${(1 - cardIn) * 26}px)) scale(${0.96 + cardIn * 0.04})`,
          opacity: cardIn,
          filter: cardIn >= 1 ? undefined : `blur(${(1 - cardIn) * 6}px)`,
        }}
      >
        <TradeConfirmationCardView data={SAMPLE_TRADE_AAPL} width={FINALE_GRID.wAapl} anim={cardIn} />
      </div>
    </>
  );
};
