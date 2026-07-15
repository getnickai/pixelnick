/**
 * PriceCardView — the in-chat price / candlestick card Nick renders, faithful to
 * the real product widget (price-card.tsx + price-card-chart.tsx on nickai-app).
 *
 * Pure and inline-styled: renders identically headless, so it doubles as the
 * design source of truth for the Remotion composition AND is importable/
 * data-driven for the launch video. `anim` (0..1) optionally drives a
 * left-to-right candle reveal + a headline price count-up; it defaults to 1
 * (fully settled) so a still renders complete.
 */
import {
  CardHeader,
  CardShell,
  fmtChangePct,
  Segmented,
  SourceBadge,
  TOKENS,
  type Segment,
} from "./card-primitives";
import type { Candle, PriceCardData } from "./props";

const VBW = 660;
const VBH = 300;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ── Candlestick renderer (SVG rects + wick lines from OHLC) ────────────────────
// Mirrors the real PriceCandleChart: green up / red down, wick high→low, body
// open↔close. preserveAspectRatio="none" + non-scaling strokes keep wicks crisp
// while the chart stretches to the card width.
function Candles({ candles, reveal, uid }: { candles: Candle[]; reveal: number; uid: string }) {
  const lows = candles.map((c) => c.l);
  const highs = candles.map((c) => c.h);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.06 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const y = (p: number) => ((hi - p) / (hi - lo)) * VBH;
  const n = candles.length;
  const slot = VBW / n;
  const bodyW = slot * 0.58;
  const clipId = `cc-clip-${uid}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${VBW} ${VBH}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={Math.max(0.0001, VBW * reveal)} height={VBH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {candles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? TOKENS.success : TOKENS.error;
          const cx = (i + 0.5) * slot;
          const bodyTop = Math.min(y(c.o), y(c.c));
          const bodyH = Math.max(2, Math.abs(y(c.c) - y(c.o)));
          return (
            <g key={i}>
              <line
                x1={cx}
                y1={y(c.h)}
                x2={cx}
                y2={y(c.l)}
                stroke={color}
                strokeWidth={2}
                vectorEffect="non-scaling-stroke"
              />
              <rect x={cx - bodyW / 2} y={bodyTop} width={bodyW} height={bodyH} fill={color} rx={1} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

export function PriceCardView({
  data,
  width = 440,
  anim = 1,
}: {
  data: PriceCardData;
  width?: number;
  anim?: number;
}) {
  const k = width / 440;
  const a = Math.max(0, Math.min(1, anim));
  const up = data.changePct >= 0;

  // Headline count-up: eased 0 → target price. A spot quote keeps 2 decimals
  // under $1000 (so "$412.80" doesn't collapse to "$412.8"), none above.
  const target = parseFloat(data.priceLabel.replace(/[^0-9.]/g, "")) || 0;
  const dec = target >= 1000 ? 0 : 2;
  const shown = target * easeOutCubic(a);
  const priceText = `$${shown.toLocaleString("en-US", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })}`;

  const periodOpts: Segment[] = data.periods.map((p) => ({
    value: p,
    label: p,
    locked: p === "1D",
  }));

  return (
    <CardShell k={k} width={width} style={{ height: "100%" }}>
      <CardHeader
        k={k}
        title={data.symbol}
        badge={<SourceBadge k={k}>{data.source}</SourceBadge>}
        snapshot={data.snapshot}
      />

      {/* Headline price + change */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 * k }}>
        <span
          style={{
            fontFamily: TOKENS.mono,
            fontWeight: 700,
            fontSize: 34 * k,
            lineHeight: 1,
            color: TOKENS.textStrong,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.5 * k,
          }}
        >
          {priceText}
        </span>
        <span
          style={{
            fontWeight: 600,
            fontSize: 15 * k,
            color: up ? TOKENS.success : TOKENS.error,
            opacity: a,
          }}
        >
          {fmtChangePct(data.changePct)}
        </span>
      </div>

      {/* Segmented controls: period | chart type */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 * k }}>
        <Segmented k={k} options={periodOpts} value={data.activePeriod} />
        <Segmented
          k={k}
          options={[
            { value: "line", label: "Line" },
            { value: "candle", label: "Candles" },
          ]}
          value="candle"
        />
      </div>

      {/* Candlestick chart fills remaining height */}
      <div style={{ flex: 1, minHeight: 0, marginTop: 4 * k }}>
        <Candles candles={data.candles} reveal={a} uid={data.symbol} />
      </div>
    </CardShell>
  );
}

export default PriceCardView;
