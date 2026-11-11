/**
 * Font-wrapped Workflow Run Card for headless rendering (Manrope body, Duplet
 * headings), same as the template card's wrapper.
 */
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { WorkflowRunCardComposition } from "./composition";
import type { WorkflowRunCardProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const WorkflowRunCardCard: React.FC<WorkflowRunCardProps> = (props) => {
  const [handle] = useState(() => delayRender("Loading card fonts"));

  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.ready])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill
      style={
        {
          "--font-manrope": fontFamily,
          "--font-duplet": '"Duplet", ui-sans-serif, system-ui, sans-serif',
        } as React.CSSProperties
      }
    >
      <WorkflowRunCardComposition {...props} />
    </AbsoluteFill>
  );
};
