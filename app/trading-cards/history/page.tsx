"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AiReadyCard from "@/components/ai-ready-card";
import type { PerformanceCardProps } from "@/remotion/compositions/performance-card/props";
import { TradingCardsShell } from "../shell";

type DeckAgent = PerformanceCardProps & { id: string; slug: string };

const HISTORY_CSS = `
  .tc-main{position:relative;z-index:2;flex:1;min-height:0;overflow-y:auto;padding:32px 28px 80px}
  .tc-page-head{display:flex;align-items:baseline;justify-content:space-between;gap:16px;margin-bottom:8px;flex-wrap:wrap;max-width:1280px;margin-left:auto;margin-right:auto}
  .tc-page-head h1{font-family:var(--font-mono);font-size:15px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;margin:0}
  .tc-status{font-family:var(--font-mono);font-size:11px;color:var(--text-faint);letter-spacing:0.06em}
  .tc-intro{font-family:var(--font-body);font-size:13px;line-height:1.6;color:var(--text-faint);margin:0 auto 26px;max-width:1280px}
  .tc-bar{display:flex;align-items:center;gap:12px;max-width:1280px;margin:0 auto 26px}
  .tc-bar button{font-family:var(--font-mono);font-size:12px;font-weight:600;letter-spacing:0.03em;color:var(--text-dim);background:var(--bg-panel);border:1px solid var(--border-solid);border-radius:8px;padding:7px 14px;cursor:pointer;transition:all .14s ease}
  .tc-bar button:hover{color:var(--text);border-color:color-mix(in srgb,var(--brand) 45%,transparent)}
  .tc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(286px,1fr));gap:28px;max-width:1280px;margin:0 auto}
  .tc-cell{display:flex;flex-direction:column;gap:11px}
  /* AiReadyCard renders a 650x1136 <article>; the thumb shows it at scale .44 */
  .tc-thumb{width:286px;height:500px;overflow:hidden;border-radius:16px;border:1px solid var(--border-solid);background:#000;position:relative}
  .tc-thumb-inner{position:absolute;top:0;left:0;transform:scale(.44);transform-origin:top left}
  .tc-cap{display:flex;flex-direction:column;gap:3px;min-height:30px}
  .tc-cap-name{font-family:var(--font-body);font-size:13px;font-weight:600;color:var(--text);line-height:1.25}
  .tc-cap-sub{font-family:var(--font-mono);font-size:10px;color:var(--text-faint);letter-spacing:0.05em}
  .tc-actions{display:flex;flex-wrap:wrap;gap:6px}
  .tc-actions button{font-family:var(--font-mono);font-size:10.5px;font-weight:600;letter-spacing:0.03em;padding:6px 9px;border-radius:6px;border:1px solid var(--border-solid);background:var(--bg-panel-2);color:var(--text-dim);cursor:pointer;transition:all .14s ease}
  .tc-actions button:hover{color:var(--text);border-color:color-mix(in srgb,var(--brand) 45%,transparent)}
  .tc-actions button:disabled{opacity:.5;cursor:default}
  .tc-actions .primary{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 40%,transparent);background:color-mix(in srgb,var(--brand) 12%,transparent)}
  .tc-empty{font-family:var(--font-mono);font-size:13px;color:var(--text-faint);padding:60px 0;text-align:center}
  .tc-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);z-index:60;background:var(--brand);color:#fff;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:0.04em;padding:10px 18px;border-radius:8px;opacity:0;pointer-events:none;transition:all .2s ease}
  .tc-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

function pct(n: number) {
  return `${n >= 0 ? "+" : ""}${n}%`;
}
function money(n: number) {
  return `$${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

/** House-style caption (no em-dashes, no hashtags). */
function captionFor(a: DeckAgent): string {
  const cta = "Try it for free now: getnick.ai";
  const lines = [`*${a.agentName}* · NickAI`];
  const parts = [`${pct(a.profitPercent)} return`];
  if (typeof a.pnl === "number") parts.push(`${money(a.pnl)} PNL`);
  if (typeof a.runs === "number" && typeof a.trades === "number")
    parts.push(`${a.runs} runs / ${a.trades} trades`);
  lines.push(parts.join("  ·  "));
  if (a.builderName) lines.push(`Built by ${a.builderName}`);
  lines.push(cta);
  return lines.join("\n");
}

/**
 * Trading Cards — live History gallery.
 *
 * Renders every current trading agent as a settled still of the live Remotion
 * composition (`<AiReadyCard>` → `<Thumbnail>`), fed by `/api/trading-deck`
 * (R2). No stored PNGs; the cards reflect the live design and live data. PNG
 * download rasterises the card in-browser (same html-to-image path as
 * `/static`). Mirrors the Swarm Arena history page.
 */
export default function TradingCardsHistoryPage() {
  const [agents, setAgents] = useState<DeckAgent[]>([]);
  const [status, setStatus] = useState("Loading…");
  const toastRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(() => {
    setStatus("Fetching deck…");
    fetch("/api/trading-deck", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((deck: { agents: DeckAgent[] }) => {
        setAgents(deck.agents);
        setStatus(
          deck.agents.length
            ? `${deck.agents.length} card${deck.agents.length === 1 ? "" : "s"} · live · ${new Date().toLocaleTimeString()}`
            : "No agents in the feed yet.",
        );
      })
      .catch((err) => setStatus(`Could not load deck (${err}).`));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toast = useCallback((msg: string) => {
    const el = toastRef.current;
    if (!el) return;
    el.textContent = msg;
    el.classList.add("show");
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => el.classList.remove("show"), 1600);
  }, []);

  const copyCaption = useCallback(
    async (a: DeckAgent) => {
      try {
        await navigator.clipboard.writeText(captionFor(a));
        toast("Caption copied");
      } catch {
        toast("Copy failed");
      }
    },
    [toast],
  );

  return (
    <TradingCardsShell activeKey="trading-history" tag="Card History">
      <style>{HISTORY_CSS}</style>
      <main className="tc-main">
        <div className="tc-page-head">
          <h1>Generated Cards</h1>
          <span className="tc-status">{status}</span>
        </div>
        <p className="tc-intro">
          Every trading agent, rendered live in your browser from the R2 feed —
          no stored PNGs. Each card is the same Remotion composition the
          generation pipeline outputs, so the gallery always reflects the current
          design. Copy a ready-to-post caption in house style; downloadable
          PNG/MP4 are produced by the generation pipeline (and posted to Slack).
        </p>
        <div className="tc-bar">
          <button type="button" onClick={load}>
            Refresh
          </button>
        </div>

        {agents.length === 0 ? (
          <div className="tc-empty">{status}</div>
        ) : (
          <div className="tc-grid">
            {agents.map((a) => {
              const { id: _id, slug: _slug, ...props } = a;
              void _id;
              void _slug;
              return (
                <div className="tc-cell" key={a.id}>
                  <div className="tc-thumb">
                    <div className="tc-thumb-inner">
                      <AiReadyCard {...props} />
                    </div>
                  </div>
                  <div className="tc-cap">
                    <span className="tc-cap-name">{a.agentName}</span>
                    <span className="tc-cap-sub">
                      {pct(a.profitPercent)} · {a.runs} runs / {a.trades} trades
                    </span>
                  </div>
                  <div className="tc-actions">
                    <button type="button" onClick={() => copyCaption(a)}>
                      Copy caption
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <div className="tc-toast" ref={toastRef} />
    </TradingCardsShell>
  );
}
