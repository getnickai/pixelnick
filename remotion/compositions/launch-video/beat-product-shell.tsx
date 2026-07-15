/**
 * Beat 10, Product shell (STA-494). The workflow does NOT jump from the montage
 * into the product UX. Instead a "flying" copy of the montage graph is handed
 * off at the montage's exact centered framing, then SLIDES + shrinks toward the
 * builder pane while the product UX (chat rail + panel, header, thread cards)
 * wipes in around it. As the flying copy nears the pane it cross-fades into the
 * ProductScreen's own docked canvas, so the graph reads as one continuous move.
 */
import { Easing, useCurrentFrame } from "remotion";
import {
  ProductScreen,
  PRODUCT_WS,
  PRODUCT_WS_WORKFLOW,
} from "../nick-launch-video/screens";
import { WorkflowGraph, fitCamera } from "../nick-launch-video/graph";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";

// The montage graph's framing (beat-montage.tsx): a 1720×680 box centered at
// (960, 498). The flying copy starts here so the hand-off is seamless.
const M_VW = 1720;
const M_VH = 680;
const M_TOP = 158;
const M_LEFT = (1920 - M_VW) / 2;
const M_CX = M_LEFT + M_VW / 2; // 960
const M_CY = M_TOP + M_VH / 2; // 498
const M_CAMERA = fitCamera(M_VW, M_VH, 3600, 1700);

export const ProductShellSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { shell, intro, cards } = LAUNCH_VIDEO_TIMELINE.productShell;

  // The workflow docks (slides from center into the pane) over the first ~18f.
  const dock = progress(frame, 0, 18, Easing.inOut(Easing.cubic));

  // Product chrome wipes in around the docking workflow; the thread cards stream
  // after it has landed.
  const chatReveal = progress(frame, shell.start, shell.duration, POP_EASE);
  const introReveal = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const cardReveal = [0, 1, 2].map((i) =>
    progress(frame, cards.start + i * cards.stagger, cards.duration, POP_EASE),
  );
  // ProductScreen's own docked canvas fades in only at the tail of the dock, so
  // it cross-fades with the flying copy as the copy lands.
  const canvasReveal = progress(frame, 11, 8, FAST_FADE_EASE);

  // Flying copy: montage-framed graph, translated + scaled from the montage
  // center toward the pane canvas, fading out as the docked canvas fades in.
  const paneCX = PRODUCT_WS.wsX + PRODUCT_WS.wsW / 2;
  const paneCY = PRODUCT_WS.canvasTop + PRODUCT_WS.canvasH / 2;
  const flyDX = (paneCX - M_CX) * dock;
  const flyDY = (paneCY - M_CY) * dock;
  const flyScale = 1 - dock * (1 - PRODUCT_WS.wsW / M_VW); // shrink toward pane width
  const flyOpacity = 1 - canvasReveal;

  return (
    <>
      <ProductScreen
        chatReveal={chatReveal}
        canvasReveal={canvasReveal}
        introReveal={introReveal}
        cardReveal={cardReveal}
      />

      {/* Flying workflow copy sliding from the montage center into the pane. */}
      <div
        style={{
          position: "absolute",
          left: M_LEFT,
          top: M_TOP,
          width: M_VW,
          height: M_VH,
          opacity: flyOpacity,
          transform: `translate(${flyDX}px, ${flyDY}px) scale(${flyScale})`,
          transformOrigin: "center center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <WorkflowGraph
          template={PRODUCT_WS_WORKFLOW.template}
          vw={M_VW}
          vh={M_VH}
          cw={3600}
          ch={1700}
          camera={M_CAMERA}
        />
      </div>
    </>
  );
};
