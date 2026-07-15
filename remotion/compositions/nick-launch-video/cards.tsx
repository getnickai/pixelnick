/**
 * Mock in-chat widget cards for the launch video — faithful to the real
 * assistant-ui tool cards on the `cards-in-chat` branch (price-card.tsx,
 * portfolio-card.tsx, card-primitives.tsx): WidgetCard chrome, CardHeader +
 * SourceBadge, big mono quote + colored change, segmented period control, and
 * an area chart. Data is illustrative (this is a product mock, not live).
 */

/* Dark-theme AlignUI token approximations (the cards render inside the dark app). */
const T = {
  cardBg: "#16191e",
  border: "rgba(255,255,255,0.09)",
  strong: "#f7f8fa",
  sub: "#9aa1ad",
  soft: "#6a7180",
  success: "#1fc16b",
  error: "#fb3748",
  primary: "#0178ff",
  segBg: "#22262e",
  segActive: "#2f343d",
};

const SANS = 'var(--font-manrope), ui-sans-serif, system-ui, sans-serif';
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

function SourceBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        borderRadius: 999,
        border: `1px solid ${T.border}`,
        padding: "2px 8px",
        fontSize: 11,
        color: T.sub,
      }}
    >
      {children}
    </span>
  );
}

function CardHeader({ title, source }: { title: string; source: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 15, fontWeight: 600, color: T.strong }}>{title}</span>
      <SourceBadge>{source}</SourceBadge>
    </div>
  );
}

function Segmented({ options, active }: { options: string[]; active: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        borderRadius: 12,
        backgroundColor: T.segBg,
        padding: 3,
      }}
    >
      {options.map((o) => {
        const on = o === active;
        return (
          <span
            key={o}
            style={{
              borderRadius: 9,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: on ? 600 : 500,
              color: on ? T.strong : T.sub,
              backgroundColor: on ? T.segActive : "transparent",
              boxShadow: on ? "0 1px 2px rgba(0,0,0,0.3)" : undefined,
            }}
          >
            {o}
          </span>
        );
      })}
    </div>
  );
}

/** Filled area chart from a value series (deterministic, no recharts needed). */
function AreaSpark({
  series,
  width,
  height,
  color,
  id,
}: {
  series: number[];
  width: number;
  height: number;
  color: string;
  id: string;
}) {
  const min = Math.min(...series);
  const max = Math.max(...series);
  const pad = (max - min) * 0.08 || 1;
  const lo = min - pad;
  const hi = max + pad;
  const x = (i: number) => (i / (series.length - 1)) * width;
  const y = (v: number) => height - ((v - lo) / (hi - lo)) * height;
  const line = series.map((v, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${line} L ${width} ${height} L 0 ${height} Z`;
  return (
    <svg width={width} height={height} style={{ display: "block" }} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WidgetCard({ children, width }: { children: React.ReactNode; width: number }) {
  return (
    <div
      style={{
        width,
        borderRadius: 20,
        border: `1px solid ${T.border}`,
        backgroundColor: T.cardBg,
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        fontFamily: SANS,
      }}
    >
      {children}
    </div>
  );
}

export type PriceCardData = {
  symbol: string;
  source: string;
  price: string; // preformatted, e.g. "184.50"
  changePct: number;
  series: number[];
  snapshot: string;
};

export function PriceCardMock({ data, width = 380 }: { data: PriceCardData; width?: number }) {
  const up = data.changePct >= 0;
  const color = up ? T.success : T.error;
  const sign = up ? "+" : "−";
  const chartW = width - 32;
  return (
    <WidgetCard width={width}>
      <CardHeader title={data.symbol} source={data.source} />
      <div style={{ fontSize: 11, color: T.soft, marginTop: -6 }}>{data.snapshot}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontFamily: MONO, fontSize: 26, fontWeight: 600, color: T.strong, letterSpacing: "-0.01em" }}>
          ${data.price}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>
          {sign}
          {Math.abs(data.changePct).toFixed(2)}%
        </span>
      </div>
      <Segmented options={["1D", "1W", "1M", "3M", "1Y"]} active="1M" />
      <AreaSpark series={data.series} width={chartW} height={132} color={color} id={`spark-${data.symbol}`} />
    </WidgetCard>
  );
}

export type PortfolioPos = { symbol: string; allocPct: number; color: string; pnlPct: number };
export type PortfolioCardData = {
  netWorth: string;
  pnl: string;
  pnlPct: number;
  positions: PortfolioPos[];
  cashPct: number;
  series: number[];
  venue: string;
};

export function PortfolioCardMock({ data, width = 380 }: { data: PortfolioCardData; width?: number }) {
  const up = data.pnlPct >= 0;
  const color = up ? T.success : T.error;
  const sign = up ? "+" : "−";
  const chartW = width - 32;
  return (
    <WidgetCard width={width}>
      <CardHeader title="Portfolio" source={data.venue} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span style={{ fontFamily: MONO, fontSize: 28, fontWeight: 600, color: T.strong, letterSpacing: "-0.01em" }}>
          ${data.netWorth}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, color }}>
          {sign}${data.pnl} ({sign}
          {Math.abs(data.pnlPct).toFixed(2)}%) <span style={{ color: T.sub, fontWeight: 500 }}>all-time</span>
        </span>
      </div>
      <AreaSpark series={data.series} width={chartW} height={96} color={color} id="spark-pf" />
      {/* allocation bar */}
      <div style={{ display: "flex", height: 8, width: "100%", borderRadius: 999, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.08)" }}>
        {data.positions.map((p) => (
          <div key={p.symbol} style={{ width: `${p.allocPct}%`, backgroundColor: p.color }} />
        ))}
        {data.cashPct > 0.5 ? <div style={{ width: `${data.cashPct}%`, backgroundColor: "rgba(255,255,255,0.2)" }} /> : null}
      </div>
      {/* positions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 2 }}>
        {data.positions.map((p) => {
          const pu = p.pnlPct >= 0;
          return (
            <div key={p.symbol} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: p.color }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: T.strong }}>{p.symbol}</span>
                <span style={{ fontSize: 12, color: T.soft }}>{p.allocPct.toFixed(0)}%</span>
              </span>
              <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 600, color: pu ? T.success : T.error }}>
                {pu ? "+" : "−"}
                {Math.abs(p.pnlPct).toFixed(1)}%
              </span>
            </div>
          );
        })}
      </div>
    </WidgetCard>
  );
}

/* ── Sample data ──────────────────────────────────────────────────────────── */

const wobble = (base: number, drift: number, n: number, seed: number) =>
  Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1);
    const noise = Math.sin(seed + i * 1.7) * 0.5 + Math.sin(seed * 2 + i * 0.6) * 0.5;
    return base * (1 + drift * t + noise * 0.012);
  });

export const SPACEX_CARD: PriceCardData = {
  symbol: "SPACEX",
  source: "Nasdaq",
  price: "412.80",
  changePct: 4.35,
  series: wobble(360, 0.16, 40, 3),
  snapshot: "Snapshot · Jul 14, 2026, 3:40 PM",
};

export const NVIDIA_CARD: PriceCardData = {
  symbol: "NVDA",
  source: "Nasdaq",
  price: "184.52",
  changePct: 1.82,
  series: wobble(176, 0.05, 40, 9),
  snapshot: "Snapshot · Jul 14, 2026, 3:40 PM",
};

export const PORTFOLIO_CARD: PortfolioCardData = {
  netWorth: "48,250",
  pnl: "6,120",
  pnlPct: 14.53,
  venue: "Nick",
  cashPct: 12,
  series: wobble(42000, 0.15, 40, 5),
  positions: [
    { symbol: "BTC", allocPct: 34, color: "#f7931a", pnlPct: 22.4 },
    { symbol: "NVDA", allocPct: 26, color: "#76b900", pnlPct: 8.1 },
    { symbol: "SPACEX", allocPct: 18, color: "#0178ff", pnlPct: 31.0 },
    { symbol: "ETH", allocPct: 10, color: "#8e51ff", pnlPct: -3.2 },
  ],
};
