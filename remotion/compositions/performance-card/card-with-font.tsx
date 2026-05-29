/**
 * Font-wrapped Performance Card for headless rendering.
 *
 * In the Next.js app, `Rethink_Sans` is injected via `next/font/google` and the
 * `--font-rethink-sans` CSS variable is set on <html>. The headless Remotion
 * bundle has no Next font pipeline, so we load the same face through
 * `@remotion/google-fonts` and set the variable on a wrapping <AbsoluteFill>.
 * The card's `font-sans` Tailwind class then resolves to Rethink Sans exactly
 * as it does in the browser.
 */
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/RethinkSans";
import { PerformanceCardComposition } from "./composition";
import type { PerformanceCardProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const PerformanceCardCard: React.FC<PerformanceCardProps> = (props) => {
  const [handle] = useState(() => delayRender("Loading Rethink Sans"));

  useEffect(() => {
    waitUntilDone()
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);

  return (
    <AbsoluteFill
      style={
        { "--font-rethink-sans": fontFamily } as React.CSSProperties
      }
    >
      <PerformanceCardComposition {...props} />
    </AbsoluteFill>
  );
};
