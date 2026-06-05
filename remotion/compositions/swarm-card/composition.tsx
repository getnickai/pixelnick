/**
 * Swarm Arena share card — Remotion composition.
 *
 * Thin React wrapper around the framework-free card engine. We do not repaint
 * the design in React: we run the verbatim engine (window.SA, loaded from
 * public/swarm-arena-cards/card-engine.js) and inject its HTML string. That
 * keeps one source of truth shared with the interactive kit, so the PNG render
 * and the live preview can never drift.
 *
 * Animation: the card content sections (`.sa-content > *`) reveal one after
 * another (fade + slide up) as a frame-driven cascade — mirroring the
 * performance-card entrance, adapted to the injected-HTML model. The reveal is
 * computed from `useCurrentFrame()` (not the CSS-animation clock) so it renders
 * deterministically headless. The decor layers (glow/ridge/dots) sit outside
 * `.sa-content`, so the backdrop is present from frame 0 and only the content
 * cascades in. The PNG still is rendered at the final (settled) frame.
 */
import { useMemo } from "react";
import { AbsoluteFill, staticFile, useCurrentFrame } from "remotion";
import { loadFont as loadGeist } from "@remotion/google-fonts/Geist";
import { loadFont as loadFira } from "@remotion/google-fonts/FiraCode";

// Engine + styles. Order matters: tokens, then component sheet, then engine.
import "../../../public/swarm-arena-cards/colors_and_type.css";
import "../../../public/swarm-arena-cards/card-styles.css";
// Side-effect import: runs the IIFE and sets window.SA (+ SA.load).
import "../../../public/swarm-arena-cards/card-engine.js";

import type { SwarmCardProps } from "./props";
import type { SwarmDeck } from "../../../data/swarm-output";

// Register the two families the card sheet asks for ("Geist", "Fira Code").
// @remotion/google-fonts integrates with delayRender, so the still waits for
// the fonts before it is captured. Constrain to the weights + latin subset the
// cards actually use, so each render makes a handful of font requests, not ~60.
loadGeist("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});
loadFira("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Point the engine's footer wordmark at the bundled public assets. Set once at
// module load (before any render), so the engine's footerHTML() picks it up.
if (typeof window !== "undefined") {
  window.__resources = {
    nickWhite: staticFile("swarm-arena-cards/assets/NickAI-wordmark-white.svg"),
    nickDark: staticFile("swarm-arena-cards/assets/NickAI-wordmark-dark.svg"),
  };
}

type RenderOpts = { variant?: string; layout?: string; theme: string; size: string };
type SwarmEngine = {
  load: (deck: SwarmDeck) => void;
  renderAgentCard: (handleOrAgent: string, opts: RenderOpts) => string;
  renderMatchCard: (match: unknown, opts: RenderOpts) => string;
  renderLeaderboardCard: (opts: RenderOpts) => string;
};

declare global {
  interface Window {
    SA: SwarmEngine;
    __resources?: { nickWhite: string; nickDark: string };
  }
}

export const SwarmCardComposition: React.FC<SwarmCardProps> = ({
  card,
  handle = "GROK",
  layout = "editorial",
  theme,
  size,
  deck,
}) => {
  const html = useMemo(() => {
    const SA = window.SA;
    if (deck) SA.load(deck);

    if (card === "agent") {
      return SA.renderAgentCard(handle, {
        variant: layout === "terminal" ? "terminal" : "ridge",
        layout,
        theme,
        size,
      });
    }
    if (card === "match") {
      return SA.renderMatchCard(null, { theme, size });
    }
    return SA.renderLeaderboardCard({ theme, size });
  }, [card, handle, layout, theme, size, deck]);

  // Frame-driven staggered entrance. Each top-level `.sa-content` child (incl.
  // spacer divs, which animate invisibly) ramps fade + slide-up on its own
  // delay. Emitted as a per-frame <style> so the cascade is fully derived from
  // useCurrentFrame() and renders identically headless.
  const frame = useCurrentFrame();
  const STAGGER = 5; // frames between consecutive sections (~167ms)
  const DUR = 14; // ramp length per section (~0.47s)
  const N = 10; // cover up to 10 top-level children
  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
  const revealCss = Array.from({ length: N }, (_, i) => {
    const t = Math.min(1, Math.max(0, (frame - i * STAGGER) / DUR));
    const e = easeOutCubic(t);
    const opacity = e.toFixed(3);
    const ty = ((1 - e) * 18).toFixed(2);
    return `.sa-card .sa-content > *:nth-child(${i + 1}){opacity:${opacity};transform:translateY(${ty}px)}`;
  }).join("\n");

  return (
    <AbsoluteFill>
      <style dangerouslySetInnerHTML={{ __html: revealCss }} />
      <div
        style={{ width: "100%", height: "100%", lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </AbsoluteFill>
  );
};
