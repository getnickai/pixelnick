/**
 * Font-wrapped stills composition for the Nick launch video — renders a single
 * screen (by `screen` prop) for design review before the animation is built.
 */
import { AbsoluteFill, continueRender, delayRender } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { LaunchStill } from "./screens";
import type { NickLaunchStillProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export const NickLaunchStillCard: React.FC<NickLaunchStillProps> = (props) => {
  const [handle] = useState(() => delayRender("Loading launch fonts"));

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
      <LaunchStill screen={props.screen} />
    </AbsoluteFill>
  );
};
