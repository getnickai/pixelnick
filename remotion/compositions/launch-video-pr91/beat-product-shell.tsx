/**
 * Beat 10, Product shell (STA-494). The settled montage graph remains the
 * travelling layer while its camera docks into the product workspace. Product
 * chrome reveals around it, then the workspace renderer takes ownership only
 * once both cameras and viewports are pixel-aligned. There is no graph fade or
 * overlapping crossfade during the handoff.
 */
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import {
  ProductScreen,
  PRODUCT_WS,
} from "../nick-launch-video/screens";
import { WorkflowGraph } from "../nick-launch-video/graph";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";
import { progressiveBuildCamera, readableOverviewCamera } from "./graph-anim";
import {
  PRODUCT_CUT_MAG7_WORKFLOW,
  PRODUCT_CUT_MONTAGE_VIEWPORT,
} from "./montage-workflows";

// Anime.js-style product spring translated to Remotion's deterministic frame
// model. The graph gets enough travel time to read as a deliberate camera move,
// with only a very small overshoot before it settles into the workspace.
const DOCK_DURATION = 42;
const DOCK_SPRING = {
  damping: 17,
  stiffness: 105,
  mass: 1.05,
} as const;
const CHROME_SPRING = {
  damping: 20,
  stiffness: 92,
  mass: 1.05,
} as const;

export const ProductShellSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { shell, intro, cards } = LAUNCH_VIDEO_TIMELINE.productShell;

  // One graph camera travels from the montage viewport into the workspace.
  // There is no graph crossfade: ownership switches only after both renderers
  // are pixel-aligned on the exact same frame.
  const dockSpring = spring({
    frame,
    fps,
    durationInFrames: DOCK_DURATION,
    config: DOCK_SPRING,
  });
  const dockSpringEnd = spring({
    frame: DOCK_DURATION,
    fps,
    durationInFrames: DOCK_DURATION,
    config: DOCK_SPRING,
  });
  // Normalize the spring so the renderer handoff lands on the exact target
  // camera while preserving the subtle overshoot on the approach.
  const dock = dockSpring / dockSpringEnd;
  const canvasReveal = frame >= DOCK_DURATION ? 1 : 0;
  const workspaceReveal = spring({
    frame: Math.max(0, frame - 2),
    fps,
    durationInFrames: DOCK_DURATION - 6,
    config: CHROME_SPRING,
  });
  const chatReveal = progress(frame, shell.start, shell.duration, POP_EASE);
  const introReveal = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const cardReveal = [0, 1, 2].map((i) =>
    progress(frame, cards.start + i * cards.stagger, cards.duration, POP_EASE),
  );

  const { wsX, wsW, canvasTop, canvasH } = PRODUCT_WS;
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
  const montageCamera = progressiveBuildCamera({
    template,
    vw: PRODUCT_CUT_MONTAGE_VIEWPORT.width,
    vh: PRODUCT_CUT_MONTAGE_VIEWPORT.height,
    cw: canvasW,
    ch: graphCanvasH,
    frame: LAUNCH_VIDEO_TIMELINE.workflowMontage.durationInFrames - 1,
    buildStart: LAUNCH_VIDEO_TIMELINE.workflowMontage.build3.start,
    buildDur: LAUNCH_VIDEO_TIMELINE.workflowMontage.build3.duration + 12,
    variant: "cinematic",
  });
  const bridgeLeft = interpolate(
    dock,
    [0, 1],
    [PRODUCT_CUT_MONTAGE_VIEWPORT.left, wsX],
  );
  const bridgeTop = interpolate(
    dock,
    [0, 1],
    [PRODUCT_CUT_MONTAGE_VIEWPORT.top, canvasTop],
  );
  const bridgeW = interpolate(
    dock,
    [0, 1],
    [PRODUCT_CUT_MONTAGE_VIEWPORT.width, wsW],
  );
  const bridgeH = interpolate(
    dock,
    [0, 1],
    [PRODUCT_CUT_MONTAGE_VIEWPORT.height, canvasH],
  );
  const bridgeCamera = {
    scale: interpolate(dock, [0, 1], [montageCamera.scale, graphCamera.scale]),
    fx: interpolate(dock, [0, 1], [montageCamera.fx, graphCamera.fx]),
    fy: interpolate(dock, [0, 1], [montageCamera.fy, graphCamera.fy]),
  };
  const bridgeVisible = frame < DOCK_DURATION;

  return (
    <>
      <ProductScreen
        chatReveal={chatReveal}
        canvasReveal={canvasReveal}
        introReveal={introReveal}
        cardReveal={cardReveal}
        workflow={PRODUCT_CUT_MAG7_WORKFLOW}
        workflowCanvasW={canvasW}
        workflowCanvasH={graphCanvasH}
        workflowCamera={graphCamera}
        workflowNodeVariant="cinematic"
        workspaceReveal={workspaceReveal}
      />

      {/* The single travelling graph layer. It starts exactly where the montage
          ends and lands exactly where ProductScreen takes ownership. */}
      {bridgeVisible ? (
        <div
          style={{
            position: "absolute",
            left: bridgeLeft,
            top: bridgeTop,
            width: bridgeW,
            height: bridgeH,
            overflow: "hidden",
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <WorkflowGraph
            template={template}
            vw={bridgeW}
            vh={bridgeH}
            cw={canvasW}
            ch={graphCanvasH}
            camera={bridgeCamera}
            nodeVariant="cinematic"
          />
        </div>
      ) : null}
    </>
  );
};
