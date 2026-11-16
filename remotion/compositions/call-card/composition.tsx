/**
 * Call Card: one call on a market (status "open"), or its receipt once the
 * market resolves ("right" / "wrong"). Same chrome as the workflow run card.
 */
import { AbsoluteFill, continueRender, delayRender, Img, staticFile } from "remotion";
import { useEffect, useState } from "react";
import { loadFont } from "@remotion/google-fonts/Manrope";
import { NodeTile, TOKENS } from "../workflow-run-card/product-node";
import type { CallCardProps } from "./props";

const { fontFamily, waitUntilDone } = loadFont("normal", { weights: ["400", "500", "600", "700"], subsets: ["latin"] });
const asset = (name: string) => staticFile(`figma/${name}`);

const PILL = {
  open: { label: "Open call", bg: TOKENS.primary },
  right: { label: "Called it", bg: "#00a63e" },
  wrong: { label: "Missed", bg: "#c2410c" },
} as const;

/** 0.36 → "36¢" for a share price; 165.19 → "$165.19". */
const price = (v: number, unit: "prob" | "usd" = "prob") =>
  unit === "usd" ? `$${v.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : v >= 1 ? `$${v.toFixed(2)}` : `${Math.round(v * 100)}¢`;
const odds = (v: number, unit: "prob" | "usd" = "prob") => (unit === "usd" ? price(v, unit) : `${Math.round(v * 100)}%`);

function Box({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-[20px] border border-white/12 bg-white/[0.03] p-8">
      <p className="text-[15px] font-semibold uppercase tracking-[0.14em] text-primary-300">{label}</p>
      {children}
    </div>
  );
}

export const CallCardComposition: React.FC<CallCardProps> = (p) => {
  const [handle] = useState(() => delayRender("Loading card fonts"));
  useEffect(() => {
    Promise.all([waitUntilDone(), document.fonts.ready]).finally(() => continueRender(handle));
  }, [handle]);

  const unit = p.market.unit ?? "prob";
  const receipt = p.status !== "open";
  const pill = PILL[p.status];
  const tile = p.market.source === "Polymarket" ? "polymarket-data" : "price-data";

  return (
    <AbsoluteFill
      className="overflow-clip bg-primary-1000 font-sans"
      style={{ "--font-manrope": fontFamily, "--font-duplet": '"Duplet", ui-sans-serif, system-ui, sans-serif' } as React.CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_42%,var(--color-primary-500)_0%,transparent_60%)]"
        style={{ opacity: 0.16 }}
        aria-hidden
      />
      <div className="absolute inset-x-[64px] top-[60px] flex items-center justify-between">
        <div className="h-[34px] w-[159px]">
          <Img alt="NickAI" src={asset("logo.svg")} className="block size-full max-w-none" />
        </div>
        <div className="flex items-center gap-2.5 rounded-full px-5 py-2" style={{ backgroundColor: pill.bg }}>
          <span className="size-2.5 rounded-full bg-white" />
          <span className="text-[20px] font-semibold tracking-wide text-white">{pill.label}</span>
        </div>
      </div>

      <div className="absolute inset-x-[64px] top-[150px] bottom-[64px] flex flex-col">
        <p className="text-[21px] font-medium text-zinc-400">
          {receipt ? "Receipt" : "Call"}
          {p.workflowName ? ` · from the ${p.workflowName} workflow` : ""}
        </p>
        <h1 className="mt-4 font-heading text-[72px] font-semibold leading-[1.05] tracking-[-0.02em] text-white">{p.question}</h1>

        <div className="mt-10 flex gap-5">
          <Box label={receipt ? "Resolved" : "Market at call"}>
            {receipt && p.resolution ? (
              <>
                <p className="font-heading text-[72px] font-bold leading-none text-white">{p.resolution.outcome}</p>
                <p className="text-[22px] text-zinc-400">{p.resolution.at}</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <NodeTile type={tile} size={40} />
                  <p className="font-heading text-[72px] font-bold leading-none text-white">{odds(p.market.oddsAtCall, unit)}</p>
                </div>
                <p className="text-[22px] leading-snug text-zinc-400">
                  {p.market.source} · {p.market.label}
                </p>
              </>
            )}
          </Box>
          <Box label="Our call">
            <p
              className="font-heading text-[72px] font-bold leading-none"
              style={{ color: receipt ? (p.status === "right" ? TOKENS.success : "#fb923c") : "white" }}
            >
              {p.call.side}
            </p>
            <p className="text-[22px] leading-snug text-zinc-300">{p.call.thesis}</p>
          </Box>
        </div>

        {p.trade && (
          <div className="mt-5 flex items-center gap-8 rounded-[20px] border border-white/12 bg-white/[0.03] px-7 py-6 text-[24px] text-white">
            <span className="text-[15px] font-semibold uppercase tracking-[0.14em] text-primary-300">
              {p.trade.kind === "paper" ? "Paper trade" : "Trade"}
            </span>
            <span>{p.trade.venue}</span>
            <span>
              <span className="text-zinc-400">Side </span>
              {p.trade.side}
            </span>
            <span>
              <span className="text-zinc-400">Entry </span>
              {price(p.trade.entry, unit)}
            </span>
            {receipt && p.resolution?.finalValue !== undefined ? (
              <span>
                <span className="text-zinc-400">Settled </span>
                {price(p.resolution.finalValue, unit)}
              </span>
            ) : p.trade.size ? (
              <span>
                <span className="text-zinc-400">Size </span>
                {p.trade.size}
              </span>
            ) : null}
          </div>
        )}

        <p className="mt-6 text-[20px] text-zinc-400">
          Called {p.calledAt} · Market at call {odds(p.market.oddsAtCall, unit)} · Resolves {p.resolvesAt}
        </p>

        <div className="mt-auto w-[620px]">
          {p.link && <p className="mb-2 break-all text-[17px] font-medium leading-5 text-primary-300">{p.link.replace(/^https?:\/\//, "")}</p>}
          <div className="flex items-stretch">
            <div className="relative h-[62px] w-[50px] shrink-0 rotate-180">
              <Img alt="" src={asset("cta-tab.svg")} className="absolute inset-0 block size-full max-w-none" />
            </div>
            <div className="relative -ml-[2px] flex flex-1 items-center justify-center gap-[9px] rounded-r-[12px] px-4 text-white" style={{ backgroundColor: "#0178FF" }}>
              <p className="whitespace-nowrap text-[21px] font-semibold leading-[1.2]">{p.cta}</p>
              <svg className="size-6 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path d="M13 18L19 12L13 6M18.5 12H5" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
