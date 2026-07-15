/**
 * Beat 10, Product shell (STA-494). NO crossfade / no blink: the SINGLE workflow
 * graph the montage ended on (Mag 7 = PRODUCT_WS_WORKFLOW) stays on screen and
 * MOVES continuously from its montage framing into the product builder pane,
 * reframing (viewport + camera interpolated) as it goes. The composer chat box
 * rides along, sliding toward the bottom-left. Only once both have landed does
 * the product UX (chat rail, panels, thread cards) fade in AROUND them, handing
 * the graph off to the pane's own canvas (identical framing, so invisible).
 */
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import {
  ProductScreen,
  PRODUCT_WS,
  PRODUCT_WS_WORKFLOW,
} from "../nick-launch-video/screens";
import { WorkflowGraph, fitCamera } from "../nick-launch-video/graph";
import { MONTAGE_WORKFLOWS } from "../nick-launch-video/props";
import { ChatBox } from "./beat-montage";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, progress } from "./motion";

// Montage-end geometry (must match beat-montage.tsx so the hand-off is seamless).
const VW = 1720;
const VH = 680;
const WF_TOP = 158;
const CANVAS_LEFT = (1920 - VW) / 2; // 100
const CANVAS_W = 3600;
const CANVAS_H = 1700;

export const ProductShellSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { shell, intro, cards } = LAUNCH_VIDEO_TIMELINE.productShell;

  // Dock: the workflow + chat box slide from montage framing to their final
  // product-UX positions over ~1.5s. The product UX then fades in around them.
  const dock = progress(frame, 0, 46, Easing.inOut(Easing.cubic));

  const { wsX, wsW, canvasTop, canvasH, cw, ch, camera } = PRODUCT_WS;

  // Montage-end camera for this workflow = the whole-graph fit (zoomIntroCamera
  // settles here). Interpolate viewport rect + camera from that to the pane.
  const montageFit = fitCamera(VW, VH, CANVAS_W, CANVAS_H, 0.9);
  const gx = interpolate(dock, [0, 1], [CANVAS_LEFT, wsX]);
  const gy = interpolate(dock, [0, 1], [WF_TOP, canvasTop]);
  const gw = interpolate(dock, [0, 1], [VW, wsW]);
  const gh = interpolate(dock, [0, 1], [VH, canvasH]);
  const camScale = interpolate(dock, [0, 1], [montageFit.scale, camera.scale]);
  const camFx = interpolate(dock, [0, 1], [montageFit.fx, camera.fx]);
  const camFy = interpolate(dock, [0, 1], [montageFit.fy, camera.fy]);

  // Chat box rides toward the bottom-left, shrinking, then fades as the product
  // composer takes its place. Scale/translate around the box's montage anchor.
  const chatScale = interpolate(dock, [0, 1], [1, 0.72]);
  const chatDX = interpolate(dock, [0, 1], [0, -330]);
  const chatDY = interpolate(dock, [0, 1], [0, 34]);
  const chatOpacity = 1 - progress(frame, 34, 14, FAST_FADE_EASE);

  // Product UX fades in only AFTER the dock has essentially landed.
  const uxReveal = progress(frame, shell.start, shell.duration, FAST_FADE_EASE);
  const introReveal = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const cardReveal = [0, 1, 2].map((i) =>
    progress(frame, cards.start + i * cards.stagger, cards.duration, FAST_FADE_EASE),
  );

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: "#09090b" }} />

      {/* The single workflow graph, moving montage → pane (reframes as it docks).
          Sits below the product UX; once the UX fades in, its own pane canvas
          (identical framing) takes over. */}
      <div
        style={{
          position: "absolute",
          left: gx,
          top: gy,
          width: gw,
          height: gh,
          overflow: "hidden",
        }}
      >
        <WorkflowGraph
          template={PRODUCT_WS_WORKFLOW.template}
          vw={gw}
          vh={gh}
          cw={cw}
          ch={ch}
          camera={{ scale: camScale, fx: camFx, fy: camFy }}
        />
      </div>

      {/* Composer chat box riding toward the bottom-left, then fading out. */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1920,
          height: 1200,
          transformOrigin: "435px 882px",
          transform: `translate(${chatDX}px, ${chatDY}px) scale(${chatScale})`,
          opacity: chatOpacity,
          pointerEvents: "none",
        }}
      >
        <ChatBox prompt={MONTAGE_WORKFLOWS[1].prompt} />
      </div>

      {/* Product UX fades in around the settled workflow + composer. */}
      <AbsoluteFill style={{ opacity: uxReveal }}>
        <ProductScreen
          chatReveal={1}
          canvasReveal={1}
          introReveal={introReveal}
          cardReveal={cardReveal}
        />
      </AbsoluteFill>
    </>
  );
};
