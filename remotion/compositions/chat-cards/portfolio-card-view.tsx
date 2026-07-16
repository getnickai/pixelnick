/**
 * PortfolioCardView — the in-chat portfolio snapshot card Nick renders, faithful
 * to the real product widget (portfolio-card.tsx on nickai-app): net worth,
 * total P&L, a filled area equity curve, an allocation bar and a positions list.
 *
 * Pure and inline-styled so it renders identically headless and is importable/
 * data-driven for the launch video. `anim` (0..1) drives the equity-curve
 * draw-on, allocation-bar grow, a net-worth count-up and a positions fade;
 * defaults to 1 (settled) so a still renders complete.
 */
import {
  CardHeader,
  CardShell,
  fmtMoney,
  fmtSignedMoney,
  fmtUsd,
  SourceBadge,
  TOKENS,
} from "./card-primitives";
import type { PortfolioCardData } from "./props";

const VBW = 660;
const VBH = 150;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

// ── Filled area equity curve (mirrors the real EquityChart) ────────────────────
function EquityCurve({ curve, reveal, uid }: { curve: number[]; reveal: number; uid: string }) {
  const min = Math.min(...curve);
  const max = Math.max(...curve);
  const pad = (max - min) * 0.08 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const n = curve.length;
  const x = (i: number) => (i / (n - 1)) * VBW;
  const y = (v: number) => ((hi - v) / (hi - lo)) * VBH;

  const line = curve.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)} ${y(v).toFixed(2)}`).join(" ");
  const area = `${line} L${VBW} ${VBH} L0 ${VBH} Z`;
  const gradId = `pf-fill-${uid}`;
  const clipId = `pf-clip-${uid}`;

  return (
    <svg
      width="100%"
      height="100%"
      viewBox={`0 0 ${VBW} ${VBH}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TOKENS.success} stopOpacity={0.22} />
          <stop offset="100%" stopColor={TOKENS.success} stopOpacity={0} />
        </linearGradient>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={Math.max(0.0001, VBW * reveal)} height={VBH} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d={area} fill={`url(#${gradId})`} />
        <path
          d={line}
          fill="none"
          stroke={TOKENS.success}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
    </svg>
  );
}

export function PortfolioCardView({
  data,
  width = 440,
  anim = 1,
}: {
  data: PortfolioCardData;
  width?: number;
  anim?: number;
}) {
  const k = width / 440;
  const a = Math.max(0, Math.min(1, anim));
  const up = data.pnlAbs >= 0;

  const shownNet = data.netWorth * easeOutCubic(a);

  return (
    <CardShell k={k} width={width} style={{ height: "100%" }}>
      <CardHeader
        k={k}
        title="Portfolio"
        badge={<SourceBadge k={k}>{data.account}</SourceBadge>}
        snapshot={data.snapshot}
      />

      {/* Net worth + total P&L */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 * k }}>
        <span
          style={{
            fontWeight: 700,
            fontSize: 36 * k,
            lineHeight: 1,
            color: TOKENS.textStrong,
            fontVariantNumeric: "tabular-nums",
            letterSpacing: -0.5 * k,
          }}
        >
          {`$${fmtMoney(shownNet)}`}
        </span>
        <span style={{ fontWeight: 600, fontSize: 15 * k, opacity: a }}>
          <span style={{ color: up ? TOKENS.success : TOKENS.error }}>
            {`${fmtSignedMoney(data.pnlAbs)} (${up ? "+" : "−"}${Math.abs(data.pnlPct).toFixed(2)}%)`}
          </span>{" "}
          <span style={{ color: TOKENS.textSub }}>all-time</span>
        </span>
      </div>

      {/* Equity curve + caption */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 * k, flex: 1, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <EquityCurve curve={data.curve} reveal={a} uid={data.account} />
        </div>
        <span style={{ fontSize: 11 * k, color: TOKENS.textSub, opacity: a }}>
          Equity curve reconstructed from trade history
        </span>
      </div>

      {/* Allocation bar */}
      <div
        style={{
          display: "flex",
          gap: 1.5 * k,
          height: 8 * k,
          width: "100%",
          overflow: "hidden",
          borderRadius: 999,
          backgroundColor: "rgba(255,255,255,0.08)",
        }}
      >
        {data.positions.map((p) => (
          <div
            key={p.symbol}
            style={{ width: `${p.allocPct * a}%`, backgroundColor: p.color }}
          />
        ))}
      </div>

      {/* Positions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 7 * k, opacity: a }}>
        {data.positions.map((p) => (
          <div
            key={p.symbol}
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 * k }}
          >
            <span style={{ display: "flex", alignItems: "center", gap: 8 * k, minWidth: 0 }}>
              <span
                style={{
                  width: 10 * k,
                  height: 10 * k,
                  borderRadius: 999,
                  backgroundColor: p.color,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 14 * k, color: TOKENS.textStrong }}>
                {p.symbol}
              </span>
              <span style={{ fontSize: 14 * k, color: TOKENS.textSub }}>{`${p.allocPct}%`}</span>
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10 * k,
                fontSize: 14 * k,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              <span style={{ color: TOKENS.textStrong }}>{fmtUsd(p.value)}</span>
              {p.pnlPct !== null && (
                <span style={{ color: p.pnlPct >= 0 ? TOKENS.success : TOKENS.error }}>
                  {`${p.pnlPct >= 0 ? "+" : "−"}${Math.abs(p.pnlPct).toFixed(1)}%`}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </CardShell>
  );
}

export default PortfolioCardView;
