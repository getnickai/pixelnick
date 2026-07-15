/**
 * Beat 11, Execution (STA-494). The full product UX is briefly visible, then
 * the camera pushes onto the top-right "Run Now" control → it presses → the
 * Execution Logs panel opens and the workflow nodes light up → rows stream
 * upward → the run COMPLETES: every node turns green, the camera pulls back to
 * center, and a "Workflow executed successfully" banner + an AAPL trade-fill
 * confirmation card animate in on top.
 *
 * A moving camera (ZoomInto: scale about an origin, clips to frame) wraps the
 * ProductScreen. `running` / `completed` / `logs` and the log stream are driven
 * from the local frame; the camera focal origin + scale interpolate across the
 * sub-slots. Origins are percentages of the 1920×1200 frame.
 */
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { Check } from "lucide-react";
import { ProductScreen, ZoomInto } from "../nick-launch-video/screens";
import { TradeConfirmationCardView } from "../chat-cards/trade-confirmation-card-view";
import { SAMPLE_TRADE_AAPL } from "../chat-cards/props";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";

const CAM_EASE = Easing.inOut(Easing.cubic);
const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";

// 16 lead rows x 27px row height. This is the streaming depth added by
// ProductScreen's ExecutionLogs when `logStreaming` is on. Scrolling this to 0
// lands on the settled newest-rows still.
const LOG_SCROLL_MAX = 16 * 27;

export const ExecutionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { zoomIn, press, logsOpen, scroll, finish, confirm, durationInFrames } =
    LAUNCH_VIDEO_TIMELINE.execution;

  // Camera keyframe times (local frames):
  //   0                              full frame, idle
  //   zoomIn end (16)                pushed onto Run Now (top-right)
  //   press end (22)                 hold on Run Now
  //   logsOpen end (38)              moved down to the logs area
  //   scroll end (100)               hold on the logs
  //   finish end (122)               pulled back to center for the confirmation
  //   durationInFrames (176)         hold centered
  const camFrames = [
    0,
    zoomIn.duration,
    press.start + press.duration,
    logsOpen.start + logsOpen.duration,
    scroll.start + scroll.duration,
    finish.start + finish.duration,
    durationInFrames,
  ];
  const camOpts = {
    easing: CAM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  // Run Now sits near x≈1837, y≈33 → ~95% / 4%. Logs area centres near ~74% / 86%.
  const ox = interpolate(frame, camFrames, [50, 95, 95, 74, 74, 50, 50], camOpts);
  const oy = interpolate(frame, camFrames, [50, 4, 4, 86, 86, 50, 50], camOpts);
  const scale = interpolate(frame, camFrames, [1, 1.7, 1.7, 1.7, 1.7, 1, 1], camOpts);

  // The button presses mid-press-slot; the run begins as it settles and ends as
  // the finish slot opens.
  const runNowPress = interpolate(
    frame,
    [press.start, press.start + 4, press.start + press.duration],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const running = frame >= press.start + 4 && frame < finish.start;
  const completed = frame >= finish.start;
  const logsShown = frame >= logsOpen.start;

  // Logs panel slides up over its slot.
  const logsReveal = progress(frame, logsOpen.start, logsOpen.duration, FAST_FADE_EASE);

  // Rows stream upward: start showing older rows, scroll to the settled newest.
  const scrolled = progress(frame, scroll.start, scroll.duration, Easing.inOut(Easing.quad));
  const logScroll = LOG_SCROLL_MAX * (1 - scrolled);

  // The execution counter ticks up as more executions stream in.
  const logCount = Math.round(
    interpolate(frame, [scroll.start, scroll.start + scroll.duration], [96, 168], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  // ── Completion payoff: dim scrim + success banner + AAPL trade card. ──
  const confirmP = progress(frame, confirm.start, confirm.duration, POP_EASE);
  const bannerP = progress(frame, confirm.start, 10, FAST_FADE_EASE);
  const cardIn = progress(frame, confirm.start + 4, confirm.duration, POP_EASE);
  const scrim = confirmP * 0.5;

  return (
    <>
      <ZoomInto ox={`${ox}%`} oy={`${oy}%`} scale={scale}>
        <ProductScreen
          running={running}
          completed={completed}
          logs={logsShown}
          runNowPress={runNowPress}
          logsReveal={logsReveal}
          logStreaming={logsShown}
          logScroll={logScroll}
          logCount={logCount}
        />
      </ZoomInto>

      {/* Dim scrim so the confirmation reads over the product UI. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "#04070d",
          opacity: scrim,
          pointerEvents: "none",
        }}
      />

      {/* "Workflow executed successfully" banner. */}
      <div
        style={{
          position: "absolute",
          top: 150,
          left: "50%",
          transform: `translate(-50%, ${(1 - bannerP) * -20}px)`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "15px 30px",
          borderRadius: 999,
          backgroundColor: "rgba(31,193,107,0.14)",
          border: "1px solid rgba(31,193,107,0.5)",
          boxShadow: "0 24px 60px -30px rgba(31,193,107,0.6)",
          opacity: bannerP,
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

      {/* AAPL trade-fill confirmation card, centered. */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 560,
          transform: `translate(-50%, calc(-50% + 30px)) translateY(${(1 - cardIn) * 26}px) scale(${0.96 + cardIn * 0.04})`,
          opacity: cardIn,
          filter: cardIn >= 1 ? undefined : `blur(${(1 - cardIn) * 6}px)`,
        }}
      >
        <TradeConfirmationCardView data={SAMPLE_TRADE_AAPL} width={560} anim={cardIn} />
      </div>
    </>
  );
};
