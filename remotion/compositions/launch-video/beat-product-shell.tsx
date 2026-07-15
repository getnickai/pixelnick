/**
 * Beat 10, Product shell (STA-494). The workflow does NOT jump from the montage
 * into the product UX. A "flying" copy of the workflow slides from screen-center
 * into the builder pane, then hands off to the ProductScreen's own docked
 * canvas. The flying copy uses the SAME pane camera + geometry, so it lands
 * pixel-aligned and the hand-off crossfade is invisible (no mid-move blink).
 * The product UX (chat rail + panel, thread cards) wipes in around it.
 */
import { Easing, useCurrentFrame } from "remotion";
import {
  ProductScreen,
  PRODUCT_WS,
  PRODUCT_WS_WORKFLOW,
} from "../nick-launch-video/screens";
import { WorkflowGraph } from "../nick-launch-video/graph";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";

export const ProductShellSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { shell, intro, cards } = LAUNCH_VIDEO_TIMELINE.productShell;

  // The workflow slides fully into the pane over the first 16f, THEN the pane's
  // own canvas cross-fades in (identical framing → seamless, no blink).
  const dock = progress(frame, 0, 16, Easing.inOut(Easing.cubic));
  const canvasReveal = progress(frame, 16, 5, FAST_FADE_EASE);
  const chatReveal = progress(frame, shell.start, shell.duration, POP_EASE);
  const introReveal = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);
  const cardReveal = [0, 1, 2].map((i) =>
    progress(frame, cards.start + i * cards.stagger, cards.duration, POP_EASE),
  );

  const { wsX, wsW, canvasTop, canvasH, cw, ch, camera } = PRODUCT_WS;
  const paneCX = wsX + wsW / 2;
  const paneCY = canvasTop + canvasH / 2;
  // At dock=0 the copy is centered on screen + larger; at dock=1 it sits exactly
  // over the pane canvas (identity), where the docked canvas takes over.
  const flyDX = (960 - paneCX) * (1 - dock);
  const flyDY = (540 - paneCY) * (1 - dock);
  const flyScale = 1 + (1 - dock) * 0.32;
  const flyOpacity = 1 - canvasReveal;

  return (
    <>
      <ProductScreen
        chatReveal={chatReveal}
        canvasReveal={canvasReveal}
        introReveal={introReveal}
        cardReveal={cardReveal}
      />

      {/* Flying workflow copy, pane-framed, sliding center → pane. */}
      <div
        style={{
          position: "absolute",
          left: wsX,
          top: canvasTop,
          width: wsW,
          height: canvasH,
          overflow: "hidden",
          opacity: flyOpacity,
          transform: `translate(${flyDX}px, ${flyDY}px) scale(${flyScale})`,
          transformOrigin: "center center",
          zIndex: 5,
          pointerEvents: "none",
        }}
      >
        <WorkflowGraph
          template={PRODUCT_WS_WORKFLOW.template}
          vw={wsW}
          vh={canvasH}
          cw={cw}
          ch={ch}
          camera={camera}
        />
      </div>
    </>
  );
};
