"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import { getMotionEntry } from "@/remotion/registry";
import type { PerformanceCardProps } from "@/remotion/compositions/performance-card/props";
import { TradingCardsShell } from "./shell";

type DeckAgent = PerformanceCardProps & { id: string; slug: string };

const ENTRY = getMotionEntry("performance-card")!;

const KIT_CSS = `
  .tc-layout{position:relative;z-index:2;flex:1;display:grid;grid-template-columns:300px 1fr;min-height:0}
  .tc-rail{border-right:1px solid var(--border);padding:26px 22px;overflow-y:auto;display:flex;flex-direction:column;gap:18px}
  .tc-grp{display:flex;flex-direction:column;gap:10px}
  .tc-lbl{font-family:var(--font-mono);font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-faint)}
  .tc-agentsel{display:flex;flex-direction:column;gap:7px}
  .tc-agentsel button{display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:var(--font-mono);font-size:11.5px;font-weight:600;padding:9px 11px;border-radius:8px;border:1px solid var(--border-solid);background:var(--bg-panel);color:var(--text-dim);cursor:pointer;transition:all .15s ease;text-align:left}
  .tc-agentsel button:hover{background:var(--bg-panel-2);color:var(--text)}
  .tc-agentsel button[aria-pressed="true"]{border-color:color-mix(in srgb,var(--brand) 55%,transparent);color:var(--text);background:color-mix(in srgb,var(--brand) 12%,transparent)}
  .tc-agentname{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .tc-agentroi{flex:none;color:var(--brand)}
  .tc-agentroi[data-neg="true"]{color:#ff5c7a}
  .tc-seg{display:flex;gap:6px}
  .tc-seg button{flex:1;font-family:var(--font-mono);font-size:11.5px;font-weight:600;letter-spacing:0.03em;padding:8px 11px;border-radius:7px;border:1px solid var(--border-solid);background:var(--bg-panel);color:var(--text-dim);cursor:pointer;transition:all .15s ease}
  .tc-seg button:hover{background:var(--bg-panel-2);color:var(--text)}
  .tc-seg button[aria-pressed="true"]{border-color:color-mix(in srgb,var(--brand) 55%,transparent);color:var(--brand);background:color-mix(in srgb,var(--brand) 14%,transparent)}
  .tc-hint{font-family:var(--font-body);font-size:12px;line-height:1.6;color:var(--text-faint);margin:0}
  .tc-note{font-family:var(--font-mono);font-size:10.5px;line-height:1.6;color:var(--text-faint);border-top:1px solid var(--border);padding-top:14px;margin:0}
  .tc-stage{position:relative;flex:1;min-width:0;min-height:0;display:flex;align-items:center;justify-content:center;padding:24px}
  .tc-player{box-shadow:0 24px 80px rgba(0,0,0,0.55);border-radius:16px}
  .tc-empty{font-family:var(--font-mono);font-size:13px;color:var(--text-faint)}
  @media (max-width:820px){.tc-layout{grid-template-columns:1fr}.tc-rail{border-right:0;border-bottom:1px solid var(--border)}}
`;

/**
 * Trading Cards — live Kit page.
 *
 * Renders the SAME Remotion composition the generation pipeline uses
 * (`PerformanceCardComposition`, via `<Player>`), fed by live agent data from
 * `/api/trading-deck` (Cloudflare R2). Pick an agent on the left, watch its
 * card play on the right. A design change in the composition shows up here and
 * in the generated PNG/MP4 with no extra work — one source of truth.
 */
export default function TradingCardsKitPage() {
  const [agents, setAgents] = useState<DeckAgent[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading agents…");
  // "static" = the settled still (what the PNG looks like); "animation" = the
  // full entrance animation (what the MP4 looks like). Default static so the
  // card reads correctly on load instead of starting mid-entrance.
  const [mode, setMode] = useState<"static" | "animation">("static");
  const playerRef = useRef<PlayerRef>(null);

  useEffect(() => {
    fetch("/api/trading-deck", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((deck: { agents: DeckAgent[] }) => {
        setAgents(deck.agents);
        setSelected(deck.agents[0]?.id ?? null);
        setStatus(
          deck.agents.length
            ? `${deck.agents.length} agent${deck.agents.length === 1 ? "" : "s"} · live from R2`
            : "No agents in the feed yet.",
        );
      })
      .catch((err) => setStatus(`Could not load deck (${err}).`));
  }, []);

  const current = useMemo(
    () => agents.find((a) => a.id === selected) ?? null,
    [agents, selected],
  );

  // Strip the deck-only keys; pass the card the exact props it generates from.
  const inputProps = useMemo<PerformanceCardProps | null>(() => {
    if (!current) return null;
    const { id: _id, slug: _slug, ...props } = current;
    void _id;
    void _slug;
    return props;
  }, [current]);

  return (
    <TradingCardsShell activeKey="trading-kit" tag="Performance Card Kit">
      <style>{KIT_CSS}</style>
      <div className="tc-layout">
        <aside className="tc-rail">
          <div className="tc-grp">
            <span className="tc-lbl">Agent</span>
            <div className="tc-agentsel">
              {agents.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={a.id === selected}
                  onClick={() => setSelected(a.id)}
                  title={a.agentName}
                >
                  <span className="tc-agentname">{a.agentName}</span>
                  <span className="tc-agentroi" data-neg={a.profitPercent < 0}>
                    {a.profitPercent >= 0 ? "+" : ""}
                    {a.profitPercent}%
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="tc-grp">
            <span className="tc-lbl">View</span>
            <div className="tc-seg">
              <button
                type="button"
                aria-pressed={mode === "static"}
                onClick={() => setMode("static")}
              >
                Static PNG
              </button>
              <button
                type="button"
                aria-pressed={mode === "animation"}
                onClick={() => setMode("animation")}
              >
                Animation
              </button>
            </div>
          </div>
          <p className="tc-hint">
            Each card is the live Remotion composition — the exact component the
            generation pipeline renders to PNG/MP4 — driven by live agent data
            from R2. Static shows the settled PNG frame; Animation plays the full
            entrance (the MP4). Edit the design once and it updates here and in
            every generated card.
          </p>
          <p className="tc-note">{status}</p>
        </aside>

        <main className="tc-stage">
          {inputProps ? (
            <div
              className="tc-player"
              style={{
                width: `min(100%, calc((100dvh - 8rem) * ${ENTRY.width / ENTRY.height}))`,
                aspectRatio: `${ENTRY.width} / ${ENTRY.height}`,
              }}
            >
              <Player
                key={mode}
                ref={playerRef}
                component={ENTRY.component}
                inputProps={inputProps}
                durationInFrames={ENTRY.durationInFrames}
                fps={ENTRY.fps}
                compositionWidth={ENTRY.width}
                compositionHeight={ENTRY.height}
                style={{ width: "100%", height: "100%", borderRadius: 16 }}
                numberOfSharedAudioTags={0}
                // Static: pin to the final, settled frame (the PNG) — no motion.
                // Animation: play the entrance on a loop (the MP4).
                initialFrame={mode === "static" ? ENTRY.durationInFrames - 1 : 0}
                autoPlay={mode === "animation"}
                loop={mode === "animation"}
                controls={mode === "animation"}
                clickToPlay={mode === "animation"}
                acknowledgeRemotionLicense
              />
            </div>
          ) : (
            <div className="tc-empty">{status}</div>
          )}
        </main>
      </div>
    </TradingCardsShell>
  );
}
