import { Easing, interpolate, useCurrentFrame } from "remotion";
import {
  seededCandles,
  type Candle,
} from "../chat-cards/props";
import { LAUNCH_VIDEO_TIMELINE } from "../launch-video/timeline";
import { progress } from "./motion";

const VIEWBOX_WIDTH = 700;
const VIEWBOX_HEIGHT = 170;
const CANDLES = seededCandles(17, 28, 202.56, 9.13, 0.018);
const UP = "#22c55e";
const DOWN = "#fb3748";

const candleRange = (candles: Candle[]) => {
  const low = Math.min(...candles.map((candle) => candle.l));
  const high = Math.max(...candles.map((candle) => candle.h));
  const padding = Math.max((high - low) * 0.08, 1);

  return { low: low - padding, high: high + padding };
};

const RANGE = candleRange(CANDLES);

/** Product Cut's chart override. Kept separate so launch-video remains intact. */
export const ProductCutNvdaCandlestickChart: React.FC = () => {
  const frame = useCurrentFrame();
  const { chartLine } = LAUNCH_VIDEO_TIMELINE.chatResponse;
  const slot = VIEWBOX_WIDTH / CANDLES.length;
  const bodyWidth = slot * 0.54;
  const toY = (price: number) =>
    ((RANGE.high - price) / (RANGE.high - RANGE.low)) * VIEWBOX_HEIGHT;

  return (
    <svg
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      preserveAspectRatio="none"
      width="100%"
      height="190"
      fill="none"
      aria-label="Animated NVDA candlestick chart"
      style={{ display: "block", marginTop: 10, overflow: "visible" }}
    >
      {CANDLES.map((candle, index) => {
        // Anime-style reveal: short out-cubic tweens with a readable stagger.
        const reveal = progress(
          frame,
          chartLine.start + index * 0.72,
          8,
          Easing.out(Easing.cubic),
        );
        const up = candle.c >= candle.o;
        const color = up ? UP : DOWN;
        const centerX = (index + 0.5) * slot;
        const settledHigh = toY(candle.h);
        const settledLow = toY(candle.l);
        const openY = toY(candle.o);
        const closeY = toY(candle.c);
        const anchorY = (openY + closeY) / 2;
        const wickTop = interpolate(reveal, [0, 1], [anchorY, settledHigh]);
        const wickBottom = interpolate(reveal, [0, 1], [anchorY, settledLow]);
        const settledBodyTop = Math.min(openY, closeY);
        const settledBodyHeight = Math.max(3, Math.abs(closeY - openY));
        const bodyHeight = interpolate(
          reveal,
          [0, 1],
          [2, settledBodyHeight],
        );
        const bodyTop = anchorY - bodyHeight / 2;
        const radius = Math.min(bodyWidth / 2, bodyHeight / 2, 4);

        return (
          <g key={index} opacity={reveal}>
            <line
              x1={centerX}
              y1={wickTop}
              x2={centerX}
              y2={wickBottom}
              stroke={color}
              strokeWidth={2.2}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
            <rect
              x={centerX - bodyWidth / 2}
              y={interpolate(
                reveal,
                [0, 1],
                [bodyTop, settledBodyTop],
              )}
              width={bodyWidth}
              height={bodyHeight}
              rx={radius}
              ry={radius}
              fill={color}
            />
          </g>
        );
      })}
    </svg>
  );
};
