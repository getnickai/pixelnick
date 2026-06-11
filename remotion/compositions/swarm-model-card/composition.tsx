/**
 * Headless render of the Swarm Arena model card — wraps the REAL React design
 * component (`components/swarm-arena-model-card.tsx`, the single source of
 * truth) so PNG/MP4 output never drifts from the live design. Distinct from
 * `remotion/compositions/swarm-arena-model-card` (the animated /motion mirror).
 *
 * Body font (Manrope) is injected via @remotion/google-fonts and exposed as
 * `--font-manrope`, which the Tailwind `@theme` in `remotion/style.css` maps to
 * `font-sans` — same pattern as the Performance Card (`card-with-font.tsx`).
 *
 * Imported by RELATIVE path (not `@/`): the Remotion webpack bundle can't
 * resolve the Next.js path alias.
 */
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import SwarmArenaModelCard, {
  SAMPLE_MODEL_CARD,
  type SwarmArenaModelCardData,
} from "../../../components/swarm-arena-model-card";

// The card's assets live in public/swarm-arena-cards/assets. In the browser the
// component's default base resolves against the origin; headless Remotion serves
// them only through staticFile(), so resolve the chrome base + the agent logo
// (carried in `data.logo` as a public path) through staticFile here.
const ASSET_BASE = staticFile("swarm-arena-cards/assets");
const toStatic = (url?: string) =>
  url && url.startsWith("/") ? staticFile(url.replace(/^\/+/, "")) : url;

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

export type SwarmModelCardRenderProps = {
  /** Card data from the live deck (via `lib/swarm-card-data` toCardData). */
  data?: SwarmArenaModelCardData;
};

export const SwarmModelCardRender: React.FC<SwarmModelCardRenderProps> = ({
  data = SAMPLE_MODEL_CARD,
}) => {
  const [handle] = useState(() => delayRender("Loading model card fonts"));

  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.ready])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);

  const resolved: SwarmArenaModelCardData = { ...data, logo: toStatic(data.logo) };

  return (
    <AbsoluteFill
      style={{ "--font-manrope": fontFamily } as React.CSSProperties}
    >
      <SwarmArenaModelCard data={resolved} assetBase={ASSET_BASE} />
    </AbsoluteFill>
  );
};
