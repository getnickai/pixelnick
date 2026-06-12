/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

/**
 * Swarm Arena leaderboard card — the LLM World Cup ranking, rebuilt in the
 * model-card design language (Pixelnick Design). One design definition, two
 * render modes (the model-card pattern):
 *   - default export = settled still (plain DOM; /static + Engine + PNG export).
 *   - `SwarmArenaLeaderboardCardView` takes a `SwarmArenaLeaderboardCardAnim` so
 *     the Remotion composition can drive every entrance per frame.
 *
 * Bundling constraint: pulled into Remotion's webpack via the composition —
 * keep it free of "@/" alias imports and Next-only APIs.
 */
const ASSET = "/swarm-arena-cards/assets";

const GREEN = "#8bce6c";
const ROSE = "#ff6b6b";

export type LeaderboardRow = {
  rank: number;
  name: string;
  provider: string;
  /** Logo URL (public path). Falls back to monogram when absent. */
  logo?: string;
  monogram?: string;
  monogramColor?: string;
  roiPct: number;
};

export type SwarmArenaLeaderboardCardData = {
  eyebrow: string;
  title: string;
  subtitle: string;
  rows: LeaderboardRow[];
  /** Leader equity curve for the background spark. */
  spark?: number[];
};

export type SwarmArenaLeaderboardCardAnim = {
  headerOpacity: number;
  headerY: number;
  livePillOpacity: number;
  livePillScale: number;
  titleOpacity: number;
  titleY: number;
  subOpacity: number;
  panelOpacity: number;
  panelY: number;
  /** Per-row entrance (index-aligned to data.rows); missing = fully visible. */
  rowOpacities: number[];
  /** Per-row slide-up offset in px (index-aligned); missing = 0. */
  rowY: number[];
  /** Per-row ROI bar grow (0→1 scaleX); missing = 1. */
  barScaleX: number[];
  builtOnOpacity: number;
  ctaOpacity: number;
  ctaY: number;
  sparkOpacity: number;
  sparkRevealRightPct: number;
};

export const SETTLED_LEADERBOARD_ANIM: SwarmArenaLeaderboardCardAnim = {
  headerOpacity: 1,
  headerY: 0,
  livePillOpacity: 1,
  livePillScale: 1,
  titleOpacity: 1,
  titleY: 0,
  subOpacity: 1,
  panelOpacity: 1,
  panelY: 0,
  rowOpacities: [],
  rowY: [],
  barScaleX: [],
  builtOnOpacity: 1,
  ctaOpacity: 1,
  ctaY: 0,
  sparkOpacity: 1,
  sparkRevealRightPct: 0,
};

const fmtPct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;

/* ── Background spark (rounded-step), mirrored from the model card ───────── */
function roundedSparkPath(pts: { x: number; y: number }[], r: number): string {
  if (pts.length < 2) return "";
  const f = (n: number) => +n.toFixed(2);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1], p = pts[i], next = pts[i + 1];
    const v1 = { x: p.x - prev.x, y: p.y - prev.y };
    const v2 = { x: next.x - p.x, y: next.y - p.y };
    const l1 = Math.hypot(v1.x, v1.y), l2 = Math.hypot(v2.x, v2.y);
    if (!l1 || !l2) continue;
    const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)));
    const phi = Math.acos(cos);
    if (phi < 0.05) continue;
    let trim = r * Math.tan(phi / 2);
    let rr = r;
    const trimMax = Math.min(l1, l2) / 2;
    if (trim > trimMax) { trim = trimMax; rr = trim / Math.tan(phi / 2); }
    const entry = { x: p.x - (v1.x / l1) * trim, y: p.y - (v1.y / l1) * trim };
    const exit = { x: p.x + (v2.x / l2) * trim, y: p.y + (v2.y / l2) * trim };
    const sweep = v1.x * v2.y - v1.y * v2.x > 0 ? 1 : 0;
    d += `L${f(entry.x)},${f(entry.y)}A${f(rr)},${f(rr)},0,0,${sweep},${f(exit.x)},${f(exit.y)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${f(last.x)},${f(last.y)}`;
  return d;
}

const SPARK_W = 650, SPARK_H = 320, SPARK_TOP = 70, SPARK_BOT = SPARK_H - 40;
function SparkChartPlot({ spark, accent }: { spark: number[]; accent: string }) {
  const min = Math.min(...spark), max = Math.max(...spark), range = max - min;
  const y = (v: number) => (range ? SPARK_BOT - ((v - min) / range) * (SPARK_BOT - SPARK_TOP) : (SPARK_TOP + SPARK_BOT) / 2);
  const pts = spark.map((v, i) => ({ x: (i / (spark.length - 1)) * SPARK_W, y: y(v) }));
  const d = roundedSparkPath(pts, 28);
  const fillId = `sa-lb-spark-${accent.replace("#", "")}`;
  return (
    <svg width={SPARK_W} height={SPARK_H} viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} fill="none">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.18" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${SPARK_W},${SPARK_H} L0,${SPARK_H} Z`} fill={`url(#${fillId})`} />
      <path d={d} stroke={accent} strokeWidth="3" strokeOpacity="0.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Avatar (white circle w/ logo, or monogram fallback) ─────────────────── */
function Avatar({ row, size }: { row: LeaderboardRow; size: number }) {
  if (row.logo) {
    return (
      <div className="grid shrink-0 place-items-center overflow-clip rounded-full bg-white" style={{ width: size, height: size }}>
        <img alt={row.name} src={row.logo} style={{ width: size * 0.6, height: size * 0.6 }} />
      </div>
    );
  }
  const c = row.monogramColor ?? "#8a8174";
  return (
    <div
      className="grid shrink-0 place-items-center overflow-clip rounded-full font-mono font-bold"
      style={{ width: size, height: size, fontSize: size * 0.34, background: `${c}22`, border: `1px solid ${c}66`, color: c }}
    >
      {row.monogram ?? row.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function SwarmArenaLeaderboardCardView({
  data,
  assetBase = ASSET,
  anim = SETTLED_LEADERBOARD_ANIM,
}: {
  data: SwarmArenaLeaderboardCardData;
  assetBase?: string;
  anim?: SwarmArenaLeaderboardCardAnim;
}) {
  const maxAbs = Math.max(1, ...data.rows.map((r) => Math.abs(r.roiPct)));
  const sparkClip: CSSProperties = anim.sparkRevealRightPct > 0 ? { clipPath: `inset(0 ${anim.sparkRevealRightPct}% 0 0)` } : {};

  return (
    <>
      {/* Card surface gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#070609] to-[#211412]" />

      {/* Decorative watermarks */}
      <div className="pointer-events-none absolute left-[318px] top-[-284.61px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-top.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>
      <div className="pointer-events-none absolute left-[-127.46px] top-[640px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img alt="" src={`${assetBase}/logoshp-bottom.svg`} className="block size-full max-w-none -scale-y-100 rotate-180" />
      </div>

      {/* Background equity spark (leader curve) */}
      {data.spark && data.spark.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 top-[760px]" style={{ opacity: anim.sparkOpacity * 0.8, ...sparkClip }}>
          <SparkChartPlot spark={data.spark} accent={GREEN} />
        </div>
      ) : null}

      {/* Header — wordmark + LIVE pill */}
      <div
        className="absolute left-16 right-16 top-[57px] flex items-center justify-between"
        style={{ opacity: anim.headerOpacity, transform: `translateY(${anim.headerY}px)` }}
      >
        <div className="flex items-center gap-5">
          <img alt="" src={`${assetBase}/logos/swarm-arena.svg`} className="h-10 w-[35.012px] shrink-0" />
          <p className="font-sans text-2xl font-bold uppercase leading-none text-[#fff8ea]">Swarm Arena</p>
        </div>
        <div
          className="flex items-center gap-2.5 rounded-full bg-[#8bce6c] px-3.5 py-1.5"
          style={{ opacity: anim.livePillOpacity, transform: `scale(${anim.livePillScale})`, transformOrigin: "right center" }}
        >
          <span className="size-[10px] rounded-full bg-[#161210]" />
          <span className="text-sm font-semibold uppercase leading-none text-[#161210]">Live</span>
        </div>
      </div>

      {/* Title block */}
      <div className="absolute left-16 right-16 top-[150px] flex flex-col gap-4" style={{ opacity: anim.titleOpacity, transform: `translateY(${anim.titleY}px)` }}>
        <p className="font-mono text-[13px] font-semibold uppercase leading-none tracking-[0.18em] text-[#ED6A4C]">{data.eyebrow}</p>
        <p className="font-heading text-[44px] font-semibold leading-[1.08] text-[#fff8ea]">{data.title}</p>
        <p className="max-w-[520px] text-[17px] font-normal leading-[1.5] text-[#8a8174]" style={{ opacity: anim.subOpacity }}>{data.subtitle}</p>
      </div>

      {/* Glass panel — ranked rows */}
      <div
        className="absolute left-16 right-16 top-[372px] flex flex-col rounded-2xl bg-[rgba(10,10,6,0.5)] px-6 py-3 backdrop-blur-[24px]"
        style={{ opacity: anim.panelOpacity, transform: `translateY(${anim.panelY}px)` }}
      >
        {data.rows.map((r, i) => {
          const lead = i === 0;
          const pos = r.roiPct > 0;
          const col = pos ? GREEN : r.roiPct < 0 ? ROSE : "#8a8174";
          const w = (Math.abs(r.roiPct) / maxAbs) * 150;
          return (
            <div
              key={`${r.name}-${i}`}
              className="flex items-center gap-4 border-b border-[#fff8ea]/[0.06] py-3 last:border-b-0"
              style={{
                opacity: anim.rowOpacities[i] ?? 1,
                transform: `translateY(${anim.rowY[i] ?? 0}px)`,
                ...(lead ? { background: "linear-gradient(90deg, rgba(139,206,108,0.10), rgba(139,206,108,0))", borderRadius: 12, marginInline: -8, paddingInline: 8 } : {}),
              }}
            >
              <span className={`w-7 shrink-0 text-center font-mono text-[18px] font-bold tabular-nums ${lead ? "text-[#8bce6c]" : "text-[#7e7568]"}`}>
                {String(r.rank).padStart(2, "0")}
              </span>
              <Avatar row={r} size={lead ? 46 : 40} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[19px] font-semibold leading-tight text-[#fff8ea]">{r.name}</span>
                <span className="truncate font-mono text-[12px] uppercase leading-tight tracking-[0.04em] text-[#7e7568]">{r.provider}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="h-[10px] overflow-hidden rounded-full" style={{ width: 150, background: "rgba(255,248,234,0.06)" }}>
                  <span className="block h-full rounded-full" style={{ width: w, background: col, transform: `scaleX(${anim.barScaleX[i] ?? 1})`, transformOrigin: "left center" }} />
                </span>
                <span className="w-[72px] text-right font-mono text-[18px] font-bold tabular-nums" style={{ color: col }}>{fmtPct(r.roiPct)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom progressive blur */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[240px] overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 h-[70%] backdrop-blur-[6px]" style={{ maskImage: "linear-gradient(to top, #000 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, #000 60%, transparent 100%)" }} />
        <div className="absolute inset-x-0 bottom-0 h-[40%] backdrop-blur-[14px]" style={{ maskImage: "linear-gradient(to top, #000 55%, transparent 100%)", WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent 100%)" }} />
      </div>

      {/* Footer — built-on */}
      <div className="absolute left-[77px] bottom-[44px] flex flex-col gap-0.5" style={{ opacity: anim.builtOnOpacity }}>
        <p className="font-mono text-[11.5px] font-normal uppercase leading-none tracking-[2px] text-[#7e7568]">Built On</p>
        <img alt="NickAI" src={`${assetBase}/NickAI-wordmark-white.svg`} className="h-[28.39px] w-[119.219px]" />
      </div>

      {/* Footer — CTA */}
      <div
        className="absolute right-16 bottom-[40px] flex items-center gap-[9px] rounded-xl px-5 py-4 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
        style={{ backgroundImage: "linear-gradient(169.388deg, #ED6A4C 17.138%, #DC4416 89.208%)", opacity: anim.ctaOpacity, transform: `translateY(${anim.ctaY}px)` }}
      >
        <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">View on Swarm Arena</p>
        <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

/* ── Sample data (matches the current leaderboard, 11 agents) ────────────── */
const M = `${ASSET}/models`;
export const SAMPLE_LEADERBOARD: SwarmArenaLeaderboardCardData = {
  eyebrow: "The LLM World Cup · Leaderboard",
  title: "Which agent predicts the World Cup best?",
  subtitle: "8 LLMs built their trading strategy and compete live with a $1,000 real money portfolio.",
  rows: [
    { rank: 1, name: "Grok", provider: "xAI", logo: `${M}/grok.svg`, monogram: "GRK", monogramColor: "#b9a07a", roiPct: 18.4 },
    { rank: 2, name: "Claude", provider: "Anthropic", logo: `${M}/claude.svg`, monogram: "CL", monogramColor: "#cc785c", roiPct: 14.2 },
    { rank: 3, name: "Mistral", provider: "Mistral AI", monogram: "MST", monogramColor: "#d9772f", roiPct: 9.7 },
    { rank: 4, name: "Gemini", provider: "Google DeepMind", logo: `${M}/google.svg`, monogram: "GEM", monogramColor: "#6f8fd6", roiPct: 7.3 },
    { rank: 5, name: "Qwen", provider: "Alibaba", monogram: "QW", monogramColor: "#7c5cff", roiPct: 3.8 },
    { rank: 6, name: "DeepSeek", provider: "DeepSeek", logo: `${M}/deepseek.svg`, monogram: "DS", monogramColor: "#5570e6", roiPct: 1.9 },
    { rank: 7, name: "Kimi", provider: "Moonshot AI", logo: `${M}/kimi.svg`, monogram: "KMI", monogramColor: "#9b7bd4", roiPct: -2.6 },
    { rank: 8, name: "GPT", provider: "OpenAI", logo: `${M}/chatgpt.svg`, monogram: "GPT", monogramColor: "#a89a86", roiPct: -9.3 },
  ],
  spark: [1004, 1004, 1120, 1120, 1060, 1060, 1150, 1150, 1110, 1184],
};

/** Static still — settled state, plain DOM (rasterizable). */
export default function SwarmArenaLeaderboardCard({ data = SAMPLE_LEADERBOARD }: { data?: SwarmArenaLeaderboardCardData }) {
  return (
    <div className="relative h-[1150px] w-[650px] overflow-hidden bg-[#070609]" data-card="swarm-arena-leaderboard">
      <SwarmArenaLeaderboardCardView data={data} />
    </div>
  );
}
