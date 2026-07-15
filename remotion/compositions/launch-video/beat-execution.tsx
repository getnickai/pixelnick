/**
 * Beat 11, Execution (STA-494). Zoom on the top-right "Run Now" control, it
 * presses → the Execution Logs panel opens and the workflow nodes light up →
 * rows stream upward (more and more executions) → the camera pulls back to the
 * full product UX.
 *
 * A moving camera (ZoomInto: scale about an origin, clips to frame) wraps the
 * ProductScreen. `running` / `logs` and the log stream are driven from the
 * local frame; the camera focal origin + scale interpolate across the sub-slots.
 * Origins are percentages of the 1920×1200 frame.
 */
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { ProductScreen, ZoomInto } from "../nick-launch-video/screens";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, progress } from "./motion";

const CAM_EASE = Easing.inOut(Easing.cubic);

// 16 lead rows x 27px row height. This is the streaming depth added by
// ProductScreen's ExecutionLogs when `logStreaming` is on. Scrolling this to 0 lands on the
// settled newest-rows still for the hand-off to the finale.
const LOG_SCROLL_MAX = 16 * 27;

export const ExecutionSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { zoomIn, press, logsOpen, scroll, zoomOut, durationInFrames } =
    LAUNCH_VIDEO_TIMELINE.execution;

  // Camera keyframe times (local frames):
  //   0                              full frame, idle
  //   zoomIn end (18)                pushed onto Run Now (top-right)
  //   press end (24)                 hold on Run Now
  //   logsOpen end (38)              moved down to the logs area
  //   zoomOut start (138)            hold on the logs
  //   zoomOut end (158)              pulled back to full frame
  //   durationInFrames (168)         hold full frame
  const camFrames = [
    0,
    zoomIn.duration,
    press.start + press.duration,
    logsOpen.start + logsOpen.duration,
    zoomOut.start,
    zoomOut.start + zoomOut.duration,
    durationInFrames,
  ];
  const camOpts = {
    easing: CAM_EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  } as const;
  // Run Now sits near x≈1837, y≈33 → ~96% / 3%. Logs area centres near ~74% / 86%.
  const ox = interpolate(frame, camFrames, [50, 95, 95, 74, 74, 50, 50], camOpts);
  const oy = interpolate(frame, camFrames, [50, 4, 4, 86, 86, 50, 50], camOpts);
  const scale = interpolate(frame, camFrames, [1, 1.7, 1.7, 1.7, 1.7, 1, 1], camOpts);

  // The button presses mid-press-slot; the run begins as it settles.
  const runNowPress = interpolate(
    frame,
    [press.start, press.start + 4, press.start + press.duration],
    [0, 1, 0],
    { easing: Easing.inOut(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const running = frame >= press.start + 4;
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

  return (
    <ZoomInto ox={`${ox}%`} oy={`${oy}%`} scale={scale}>
      <ProductScreen
        running={running}
        logs={logsShown}
        runNowPress={runNowPress}
        logsReveal={logsReveal}
        logStreaming={logsShown}
        logScroll={logScroll}
        logCount={logCount}
      />
    </ZoomInto>
  );
};
