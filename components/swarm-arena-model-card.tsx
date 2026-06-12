/* eslint-disable @next/next/no-img-element */

const ASSET = "/swarm-arena-cards/assets";
const MODELS_ASSET = `${ASSET}/models`;

/**
 * Swarm Arena model card — the design source of truth for this card (Pixelnick
 * Design). Renders the Figma sample by default (no props → /static preview is
 * unchanged); the Engine kit passes live `data` mapped from /api/swarm-deck.
 */
export type ModelCardPick = { label: string; value: string };

export type SwarmArenaModelCardData = {
  /** Display name, e.g. "GPT 5.5" / "Kimi K2". */
  name: string;
  /** Monochrome mark URL (rendered black in the white circle). */
  logo?: string;
  /** Fallback avatar when there is no logo: short code + brand color. */
  monogram?: string;
  monogramColor?: string;
  pnlUsd: number;
  profitPct: number;
  equityUsd: number;
  baseUsd: number;
  pickAccuracyPct: number;
  record: string;
  rank: number | string;
  rankOf: number;
  topPick?: ModelCardPick;
  latestPicks: ModelCardPick[];
  /** Equity curve for the background chart (raw values; normalized to fit). */
  spark?: number[];
};

/** The Figma sample (GPT 5.5) — what /static renders, and the design baseline. */
export const SAMPLE_MODEL_CARD: SwarmArenaModelCardData = {
  name: "GPT",
  logo: `${MODELS_ASSET}/chatgpt.svg`,
  pnlUsd: 184,
  profitPct: 27.97,
  equityUsd: 1184,
  baseUsd: 1000,
  pickAccuracyPct: 71,
  record: "17-7",
  rank: 1,
  rankOf: 11,
  topPick: { label: "BACK Yes at:", value: "0.58" },
  latestPicks: [
    { label: "BACK PSG at:", value: "0.44" },
    { label: "Dembélé at:", value: "0.44" },
    { label: "Over 2.5 at:", value: "0.44" },
  ],
  // Stepped equity curve (plateaus + ramps) for the background chart.
  spark: [1004, 1004, 1188, 1188, 1092, 1092, 1002, 1002, 1190, 1190, 1096, 1184],
};

const GREEN = "#8bce6c";
const ROSE = "#ff6b6b";

const fmtMoney = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

/* ───────────────────────── Background spark chart ─────────────────────────
   Recharts-style "rounded step": straight segments between points with every
   elbow rounded by an arc (the snippet's A8,8 corners). Pure SVG — no chart
   dependency; the path is generated from the raw spark values. */

function roundedSparkPath(pts: { x: number; y: number }[], r: number): string {
  if (pts.length < 2) return "";
  const f = (n: number) => +n.toFixed(2);
  let d = `M${f(pts[0].x)},${f(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const prev = pts[i - 1];
    const p = pts[i];
    const next = pts[i + 1];
    const v1 = { x: p.x - prev.x, y: p.y - prev.y };
    const v2 = { x: next.x - p.x, y: next.y - p.y };
    const l1 = Math.hypot(v1.x, v1.y);
    const l2 = Math.hypot(v2.x, v2.y);
    if (!l1 || !l2) continue;
    // Proper tangent fillet: the trim distance follows the turn angle
    // (d = r·tan(φ/2)). A fixed trim turns shallow elbows into semicircle
    // bumps — the arc's chord outgrows what the radius can span.
    const cos = Math.min(1, Math.max(-1, (v1.x * v2.x + v1.y * v2.y) / (l1 * l2)));
    const phi = Math.acos(cos); // turn angle: 0 = straight on
    if (phi < 0.05) continue; // < ~3° → effectively straight
    let trim = r * Math.tan(phi / 2);
    let rr = r;
    const trimMax = Math.min(l1, l2) / 2;
    if (trim > trimMax) {
      trim = trimMax;
      rr = trim / Math.tan(phi / 2);
    }
    const entry = { x: p.x - (v1.x / l1) * trim, y: p.y - (v1.y / l1) * trim };
    const exit = { x: p.x + (v2.x / l2) * trim, y: p.y + (v2.y / l2) * trim };
    const sweep = v1.x * v2.y - v1.y * v2.x > 0 ? 1 : 0;
    d += `L${f(entry.x)},${f(entry.y)}A${f(rr)},${f(rr)},0,0,${sweep},${f(exit.x)},${f(exit.y)}`;
  }
  const last = pts[pts.length - 1];
  d += `L${f(last.x)},${f(last.y)}`;
  return d;
}

const SPARK_W = 650;
const SPARK_H = 410;
/** Grid extends higher than the line for the background feel… */
const GRID_TOP = 8;
/** …but the line itself stays in the card's bottom region (band sits at
 *  y 700 — peaks at ~790 emerge from behind the glass panel's lower edge,
 *  and the curve fades out under the bottom progressive blur). */
const SPARK_TOP = 90;
const SPARK_BOT = SPARK_H - 60;

const GRID_TICKS = 6;
const tickXs = (n: number) =>
  Array.from({ length: n }, (_, i) => ((i + 0.5) / n) * SPARK_W);

export function SparkChartPlot({
  spark,
  accent,
  progress = 1,
}: {
  spark: number[];
  accent: string;
  /** 0→1 progressive reveal — the curve builds period by period. 1 = full
   *  (the static card's default; the motion composition animates it). */
  progress?: number;
}) {
  const min = Math.min(...spark);
  const max = Math.max(...spark);
  const range = max - min;
  const y = (v: number) =>
    range ? SPARK_BOT - ((v - min) / range) * (SPARK_BOT - SPARK_TOP) : (SPARK_TOP + SPARK_BOT) / 2;
  const pts = spark.map((v, i) => ({ x: (i / (spark.length - 1)) * SPARK_W, y: y(v) }));

  // Reveal the curve up to `progress` of the periods. The final segment is
  // partially drawn (linear lerp to the in-between point) so it grows smoothly
  // rather than snapping a whole segment at a time. y-scale uses the FULL spark
  // so the curve doesn't rescale as it builds.
  const p = Math.max(0, Math.min(1, progress));
  const lastIdx = (pts.length - 1) * p;
  const k = Math.floor(lastIdx);
  const frac = lastIdx - k;
  let vpts = pts.slice(0, k + 1);
  if (k < pts.length - 1 && frac > 0) {
    const a = pts[k];
    const b = pts[k + 1];
    vpts = [...vpts, { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac }];
  }
  const endX = vpts.length ? vpts[vpts.length - 1].x : 0;
  const d = vpts.length > 1 ? roundedSparkPath(vpts, 30) : "";
  const fillId = `sa-spark-${accent.replace("#", "")}`;
  return (
    <svg
      width={SPARK_W}
      height={SPARK_H}
      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          {/* Same fall-off as the HTML card's ridge fill (0.34 → 0). */}
          <stop offset="0%" stopColor={accent} stopOpacity="0.34" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {tickXs(GRID_TICKS).map((gx) => (
        <line
          key={gx}
          x1={gx}
          y1={GRID_TOP}
          x2={gx}
          y2={SPARK_BOT}
          stroke="#fff8ea"
          strokeOpacity="0.07"
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      ))}
      {d ? (
        <>
          <path d={`${d}L${endX},${SPARK_BOT}L0,${SPARK_BOT}Z`} fill={`url(#${fillId})`} />
          <path d={d} stroke={accent} strokeOpacity="0.9" strokeWidth="2.5" strokeLinecap="round" />
        </>
      ) : null}
    </svg>
  );
}

export default function SwarmArenaModelCard({
  data = SAMPLE_MODEL_CARD,
  assetBase = ASSET,
}: {
  data?: SwarmArenaModelCardData;
  /**
   * Base URL for the card's chrome assets (logo marks, rank hex, arrow,
   * wordmark). Defaults to the public path, which resolves against the origin
   * in the browser (app / Player). Headless Remotion renders pass a
   * `staticFile()`-prefixed base so the bundler serves them. (STA-417)
   */
  assetBase?: string;
}) {
  const pos = data.pnlUsd >= 0;
  const accent = pos ? GREEN : ROSE;

  return (
    <article
      className="relative h-[1110px] w-[650px] overflow-clip rounded-2xl bg-gradient-to-b from-[#110d0b] to-[#2f231e] font-sans"
      data-node-id="350:124"
    >
      {/* Decorative logo-shape watermark — bottom left (behind content, so the
          glass panel's backdrop-blur and the bottom progressive blur both bite on it) */}
      <div className="pointer-events-none absolute left-[-127.46px] top-[766.37px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${assetBase}/logoshp-bottom.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>

      {/* Decorative logo-shape watermark — top right (behind content) */}
      <div className="pointer-events-none absolute left-[318px] top-[-284.61px] h-[471.227px] w-[412.465px] mix-blend-overlay">
        <img
          alt=""
          src={`${assetBase}/logoshp-top.svg`}
          className="block size-full max-w-none -scale-y-100 rotate-180"
        />
      </div>

      {/* Background equity chart — rounded-step spark over a dashed grid.
          Sits behind the content stack (the glass panel's backdrop-blur frosts
          the section it overlaps, like the watermarks); crisp in the open
          strips. Tick labels render separately after the blur band. */}
      {data.spark && data.spark.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 top-[700px]">
          <SparkChartPlot spark={data.spark} accent={accent} />
        </div>
      ) : null}

      {/* Header — Swarm Arena lockup */}
      <div className="absolute left-16 top-[57px] flex items-center gap-5">
        <img
          alt=""
          src={`${assetBase}/logos/swarm-arena.svg`}
          className="h-10 w-[35.012px] shrink-0"
        />
        <p className="font-sans text-2xl font-bold uppercase leading-none text-[#fff8ea]">
          Swarm Arena
        </p>
      </div>

      {/* Main content stack */}
      <div className="absolute left-16 top-[169px] flex w-[522px] flex-col gap-16">
        {/* Top: tags + model */}
        <div className="flex w-full flex-col gap-7">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="size-[27px] shrink-0 rounded-full bg-[#8bce6c]" />
              <div className="flex items-center justify-center rounded-full bg-[#8bce6c] px-3 py-1">
                <p className="text-base font-semibold uppercase leading-[1.2] text-[#161210]">
                  Live Agent
                </p>
              </div>
            </div>
            <p className="text-base font-semibold uppercase leading-[1.2] text-[#f98051]">
              World Cup
            </p>
          </div>

          <div className="flex w-full items-center gap-5">
            {data.logo ? (
              <div className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full bg-white">
                <img alt={data.name} src={data.logo} className="size-[39px]" />
              </div>
            ) : (
              <div
                className="grid size-[65px] shrink-0 place-items-center overflow-clip rounded-full font-mono text-[22px] font-bold"
                style={{
                  background: `${data.monogramColor ?? "#8a8174"}22`,
                  border: `1px solid ${data.monogramColor ?? "#8a8174"}66`,
                  color: data.monogramColor ?? "#fff8ea",
                }}
              >
                {data.monogram ?? data.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <p className="min-w-0 flex-1 font-heading text-[54px] font-semibold leading-[1.2] text-[#fff8ea]">
              {data.name}
            </p>
          </div>
        </div>

        {/* Bottom: metrics + glass panel */}
        <div className="flex w-full flex-col gap-12">
          {/* Metrics */}
          <div className="flex w-full flex-col justify-center gap-6">
            <div className="flex w-full items-start gap-8">
              {/* Season PNL */}
              <div className="flex flex-1 flex-col gap-4">
                <p className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90">
                  Season PNL
                </p>
                <div className="relative">
                  <p
                    className="font-heading text-[54px] font-semibold leading-none tracking-[1px]"
                    style={{ color: accent }}
                  >
                    {pos ? "+" : "−"}
                    {fmtMoney(data.pnlUsd)}
                  </p>
                  {/* Accent bar, centered on the value, bleeding off the left edge */}
                  <div
                    className="absolute top-1/2 -left-[86px] h-[41px] w-[39px] -translate-y-1/2 rounded-lg"
                    style={{ background: accent }}
                  />
                </div>
              </div>

              {/* Profit % */}
              <div className="flex flex-1 flex-col gap-4">
                <p className="font-sans text-2xl font-semibold leading-[1.2] text-[#fff8ea]/90">
                  Profit %
                </p>
                <div className="flex items-center gap-4">
                  <img
                    alt=""
                    src={`${assetBase}/arrow-up.svg`}
                    className={`h-10 w-[34.29px] shrink-0${pos ? "" : " rotate-180"}`}
                  />
                  <p className="whitespace-nowrap font-heading text-[54px] font-semibold leading-none tracking-[1px] text-[#fff8ea]">
                    {Math.abs(data.profitPct).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="h-[0.97px] w-full bg-[#fff8ea] opacity-[0.12]" />

            {/* Equity */}
            <div className="flex w-full items-center justify-between">
              <div className="flex items-end gap-3">
                <p className="text-[28px] font-semibold leading-none text-[#fff8ea]">
                  {fmtMoney(data.equityUsd)}
                </p>
                <p className="pb-1 text-xl font-normal leading-4 text-[#8a8174]">
                  Equity
                </p>
              </div>
              <p className="text-xl font-normal leading-4 text-[#8a8174]">
                <span className="font-semibold text-[#fff8ea]">{fmtMoney(data.baseUsd)}</span> base
              </p>
            </div>
          </div>

          {/* Glass stats panel */}
          <div className="flex w-full flex-col gap-9 rounded-2xl bg-[rgba(10,10,6,0.5)] p-8 backdrop-blur-[24px]">
            <div className="flex w-full items-center gap-9">
              <Stat label="Pick Accuracy" value={`${Math.round(data.pickAccuracyPct)}%`} />
              <Stat label="Record" value={data.record} />
              <Stat label="Rank" value={`#${data.rank} / ${data.rankOf}`} />
            </div>

            <div className="flex w-full flex-col gap-[11px]">
              {/* Top pick */}
              <div className="flex w-full items-center justify-between">
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Top Pick
                </p>
                <div className="flex w-[206px] justify-between text-[17px] font-bold text-[#8bce6c]">
                  <span>{data.topPick?.label ?? "No open picks"}</span>
                  <span className="w-[75px] text-right">{data.topPick?.value ?? "—"}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="w-full py-[7px]">
                <div className="h-[0.97px] w-full bg-[#2e2c26]" />
              </div>

              {/* Latest picks */}
              <div className="flex w-full items-start justify-between">
                <p className="text-xs font-semibold uppercase leading-none text-[#8a8174]">
                  Latest Picks
                </p>
                <div className="flex w-[206px] flex-col gap-2.5 text-[17px] font-bold text-[#fff8ea]">
                  {data.latestPicks.length ? (
                    data.latestPicks.map((pick, i) => (
                      <div
                        key={`${pick.label}-${i}`}
                        className="flex w-full items-start justify-between"
                      >
                        <span className="whitespace-nowrap">{pick.label}</span>
                        <span className="w-[75px] text-right">{pick.value}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex w-full items-start justify-between">
                      <span className="whitespace-nowrap text-[#8a8174]">No picks yet</span>
                      <span className="w-[75px] text-right text-[#8a8174]">—</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progressive blur — bottom band (Figma: progressiveblur 354:44, ~169px).
          Layered backdrop-blur passes, each masked to fade out toward the top so
          blur ramps up to the bottom edge. Sits above the backdrop/watermark but
          below the footer so BUILT ON / NickAI / CTA stay crisp. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[290px] overflow-hidden">
        <div
          className="absolute inset-x-0 bottom-0 h-[76%] backdrop-blur-[4px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 62%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[56%] backdrop-blur-[8px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 58%, rgba(0,0,0,0) 100%)",
          }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[36%] backdrop-blur-[16px]"
          style={{
            maskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, rgba(0,0,0,1) 54%, rgba(0,0,0,0) 100%)",
          }}
        />
      </div>

      {/* Footer — built-on credit */}
      <div className="absolute left-[77px] top-[997px] flex w-[119.219px] flex-col gap-0.5">
        <p className="font-mono text-[11.5px] font-normal uppercase leading-none tracking-[2px] text-[#7e7568]">
          Built On
        </p>
        <img
          alt="NickAI"
          src={`${assetBase}/NickAI-wordmark-white.svg`}
          className="h-[28.39px] w-[119.219px]"
        />
      </div>

      {/* Footer — CTA */}
      <div
        className="absolute left-[314px] top-[993px] flex items-center gap-[9px] rounded-xl px-5 py-4 text-white shadow-[inset_0px_1px_1px_0px_rgba(255,255,255,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(169.388deg, #f98051 17.138%, #e75218 89.208%)",
        }}
      >
        <p className="whitespace-nowrap text-xl font-semibold leading-[1.2]">
          View on Swarm Arena
        </p>
        <svg
          className="size-6 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Rank badge — glossy hexagon + rank number + RANK ribbon, top-right */}
      <div className="absolute left-[472px] top-[61.5px] size-[106.408px]">
        <div className="absolute inset-[2.33%_6.7%]">
          <img
            alt=""
            src={`${assetBase}/rank-hex.svg`}
            className="block size-full max-w-none"
          />
        </div>
        <div className="absolute left-[4.85px] top-[4.85px] size-[96.706px] mix-blend-screen">
          <div className="absolute inset-[1.92%_6.7%]">
            <img
              alt=""
              src={`${assetBase}/rank-hex-overlay.svg`}
              className="block size-full max-w-none"
            />
          </div>
        </div>

        {/* RANK ribbon — banner across the hexagon's lower third */}
        <div className="absolute left-[-16.3px] top-[52px] h-[50px] w-[139px]">
          <img alt="" src={`${assetBase}/rank-ribbon.svg`} className="block size-full" />
          <div className="absolute inset-x-0 top-0 flex h-[31px] items-center justify-center">
            <span className="font-heading text-[18px] font-bold uppercase leading-none text-[#0d0907]">
              Rank
            </span>
          </div>
        </div>

        {/* Rank number — centered in the upper hexagon, above the ribbon */}
        <div className="absolute inset-x-0 top-0 flex h-[76px] items-center justify-center">
          <span className="font-heading text-[48px] font-bold leading-none tracking-[1px] text-[#fff8ea]">
            {data.rank}
          </span>
        </div>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <p className="text-xs font-normal uppercase leading-none tracking-[1.434px] text-[#8a8174]">
        {label}
      </p>
      <p className="text-[28px] font-bold leading-none text-[#fff8ea]">{value}</p>
    </div>
  );
}
