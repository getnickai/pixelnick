/**
 * Font-wrapped Workflow Template Card for headless rendering.
 *
 * Body copy uses Manrope via `@remotion/google-fonts`. Headings use Duplet
 * (local woff in `public/fonts/`, declared in `remotion/style.css`).
 */
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { WorkflowTemplateCardComposition } from "./composition";
import type { WorkflowTemplateCardProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const WorkflowTemplateCardCard: React.FC<WorkflowTemplateCardProps> = (
  props,
) => {
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
      <WorkflowTemplateCardComposition {...props} />
    </AbsoluteFill>
  );
};
