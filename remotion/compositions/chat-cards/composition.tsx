/**
 * Remotion compositions for the reusable NickAI chat cards. Two entries:
 *   - ChatPriceCard      → drives PriceCardView (candlestick price card)
 *   - ChatPortfolioCard  → drives PortfolioCardView (portfolio snapshot)
 *
 * Each wraps its pure View, loads Manrope via @remotion/google-fonts (same
 * font-wrapper pattern as the other cards) and drives the View's `anim` (0..1)
 * from `useCurrentFrame()` — an eased reveal (candle / curve draw-on + number
 * count-up) then a settled hold. The Views are the single design definition, so
 * the still and the animation can never drift.
 */
import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { TOKENS } from "./card-primitives";
import { PriceCardView } from "./price-card-view";
import { PortfolioCardView } from "./portfolio-card-view";
import { TradeConfirmationCardView } from "./trade-confirmation-card-view";
import {
  chatPortfolioCardDefaultProps,
  chatPriceCardDefaultProps,
  chatTradeCardDefaultProps,
  type ChatPortfolioCardProps,
  type ChatPriceCardProps,
  type ChatTradeCardProps,
  SAMPLE_PORTFOLIO,
  SAMPLE_PRICE_NVDA,
  SAMPLE_TRADE_AAPL,
} from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

// Outer page margin (each side) around the card, in canvas px.
const MARGIN = 18;
// Reveal window: eased draw-on over the first ~1.5s, then hold.
const REVEAL_FRAMES = 46;

function useCardFonts() {
  const [handle] = useState(() => delayRender("Loading chat-card fonts"));
  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.ready])
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}

function useAnim(): number {
  const frame = useCurrentFrame();
  return interpolate(frame, [0, REVEAL_FRAMES], [0, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function Stage({ children }: { children: React.ReactNode }) {
  const { width } = useVideoConfig();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: TOKENS.page,
        // @ts-expect-error CSS custom property for the card font family.
        "--font-manrope": fontFamily,
      }}
    >
      <div style={{ position: "absolute", inset: MARGIN, display: "flex" }}>
        <div style={{ width: width - MARGIN * 2, display: "flex" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
}

export const ChatPriceCardComposition: React.FC<ChatPriceCardProps> = ({
  data = SAMPLE_PRICE_NVDA,
}) => {
  useCardFonts();
  const anim = useAnim();
  const { width } = useVideoConfig();
  return (
    <Stage>
      <PriceCardView data={data} width={width - MARGIN * 2} anim={anim} />
    </Stage>
  );
};

export const ChatPortfolioCardComposition: React.FC<ChatPortfolioCardProps> = ({
  data = SAMPLE_PORTFOLIO,
}) => {
  useCardFonts();
  const anim = useAnim();
  const { width } = useVideoConfig();
  return (
    <Stage>
      <PortfolioCardView data={data} width={width - MARGIN * 2} anim={anim} />
    </Stage>
  );
};

export const ChatTradeCardComposition: React.FC<ChatTradeCardProps> = ({
  data = SAMPLE_TRADE_AAPL,
}) => {
  useCardFonts();
  const anim = useAnim();
  const { width } = useVideoConfig();
  return (
    <Stage>
      <TradeConfirmationCardView data={data} width={width - MARGIN * 2} anim={anim} />
    </Stage>
  );
};

export { chatPriceCardDefaultProps, chatPortfolioCardDefaultProps, chatTradeCardDefaultProps };
