/**
 * Font-wrapped Performance Card for headless rendering.
 *
 * Body copy uses Manrope via `@remotion/google-fonts`. Headings use Duplet
 * (local woff in `public/fonts/`, declared in `remotion/style.css`).
 */
import { AbsoluteFill, delayRender, continueRender } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { PerformanceCardComposition } from "./composition";
import type { PerformanceCardProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const PerformanceCardCard: React.FC<PerformanceCardProps> = (props) => {
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
      <PerformanceCardComposition {...props} />
    </AbsoluteFill>
  );
};
