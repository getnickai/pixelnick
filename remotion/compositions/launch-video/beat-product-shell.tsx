/**
 * Beat 10, Product shell (STA-494). Match-cut: the hero workflow docks into
 * the right builder pane while the chat rail + panel wipe in from the left and
 * the widget cards stream into the thread (SpaceX + NVDA price cards, then the
 * portfolio card), mimicking the real product experience.
 *
 * Drives the (default-settled) ProductScreen via its optional entrance props:
 *   shell  → left rail + chat panel wipe in from the left
 *   canvas → the workspace WorkflowGraph settles / docks in
 *   intro  → the assistant line fades in
 *   cards  → SpaceX (0), NVDA (1), Portfolio (2) stream in one after another
 *   outro  → held settled (the execution beat continues from this UI)
 */
import { useCurrentFrame } from "remotion";
import { ProductScreen } from "../nick-launch-video/screens";
import { LAUNCH_VIDEO_TIMELINE } from "./timeline";
import { FAST_FADE_EASE, POP_EASE, progress } from "./motion";

export const ProductShellSequence: React.FC = () => {
  const frame = useCurrentFrame();
  const { shell, canvas, intro, cards } = LAUNCH_VIDEO_TIMELINE.productShell;

  // Left rail + chat panel wipe in from the left (POP overshoot on transform).
  const chatReveal = progress(frame, shell.start, shell.duration, POP_EASE);

  // The workspace graph docks in: starts slightly larger + soft, settles to 1.
  const canvasReveal = progress(frame, canvas.start, canvas.duration, FAST_FADE_EASE);

  // Assistant intro line.
  const introReveal = progress(frame, intro.start, intro.duration, FAST_FADE_EASE);

  // Three widget cards stream in one after another.
  const cardReveal = [0, 1, 2].map((i) =>
    progress(frame, cards.start + i * cards.stagger, cards.duration, POP_EASE),
  );

  return (
    <ProductScreen
      chatReveal={chatReveal}
      canvasReveal={canvasReveal}
      introReveal={introReveal}
      cardReveal={cardReveal}
    />
  );
};
