"use client";

/**
 * NickAI Kit — the trading performance card, Engine-style.
 *
 * Engine = Design components + live data: the card is the Remotion
 * `performance-card` composition (the single design source the generation
 * pipeline renders to PNG/MP4), played via `<Player>` and fed by the live R2
 * deck from /api/trading-deck. Sample mode renders the Design fixtures from
 * data/mock-agents. Mirrors app/engine/swarm-arena-kit.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Player } from "@remotion/player";
import { RefreshCw } from "lucide-react";
import type { AgentCardData } from "@/data/mock-agents";
import { mockAgents } from "@/data/mock-agents";
import type { TradingDeckAgent } from "@/lib/trading-card-data";
import { pct } from "@/lib/trading-card-data";
import { getMotionEntry } from "@/remotion/registry";
import type { PerformanceCardProps } from "@/remotion/compositions/performance-card/props";
import { cn } from "@/lib/utils";

const ENTRY = getMotionEntry("performance-card")!;
const FIT_PAD = 80;

/** Sample fixtures carry no feed id; live agents do. */
type DeckAgent = AgentCardData & { id?: string };

/** Selection/React key. The live feed has produced distinct agents sharing a
 *  name (two "S1 Match Reader (Chat GPT)") — and therefore a slug — so prefer
 *  the feed's unique id; fixtures have unique slugs. */
const keyOf = (a: DeckAgent) => a.id ?? a.slug;

type DeckResponse = { agents: TradingDeckAgent[] };
type DeckState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; deck: DeckResponse };

type DataSource = "live" | "sample";
type ViewMode = "static" | "animation";

export function NickAiKit() {
  const [deckState, setDeckState] = useState<DeckState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);
  const [source, setSource] = useState<DataSource>("sample");
  const [agent, setAgent] = useState<string | null>(null);
  // "static" = the settled still (the PNG); "animation" = the full entrance
  // (the MP4). Default static so the card reads correctly on load.
  const [mode, setMode] = useState<ViewMode>("static");
  const [scale, setScale] = useState(1);

  // Live deck. AbortController makes the dev StrictMode double-run harmless.
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/trading-deck", { cache: "no-store", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`deck ${res.status}`);
        return res.json();
      })
      .then((deck: DeckResponse) => {
        setDeckState({ status: "ready", deck });
      })
      .catch((err) => {
        if (!ctrl.signal.aborted)
          setDeckState({
            status: "error",
            message: err instanceof Error ? err.message : String(err),
          });
      });
    return () => ctrl.abort();
  }, [retryKey]);

  const refetch = () => {
    setDeckState({ status: "loading" });
    setRetryKey((k) => k + 1);
  };

  // Sample mode renders the Design fixtures; live mode the R2 deck.
  const agents = useMemo<DeckAgent[]>(() => {
    if (source === "sample") return mockAgents;
    if (deckState.status !== "ready") return [];
    return deckState.deck.agents;
  }, [deckState, source]);

  // Scale-to-fit: the card is a fixed 650×1136, so the scale falls out of the
  // stage box alone — observe it (covers window resizes and app-sidebar
  // collapse/expand) instead of measuring the card.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () =>
      setScale(
        Math.min(
          (stage.clientWidth - FIT_PAD) / ENTRY.width,
          (stage.clientHeight - FIT_PAD) / ENTRY.height,
          1,
        ),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const selected = agents.find((a) => keyOf(a) === agent) ?? agents[0];

  // Strip the deck-only keys; pass the card the exact props it generates from.
  const inputProps = useMemo<PerformanceCardProps | null>(() => {
    if (!selected) return null;
    const { slug: _slug, id: _id, ...props } = selected;
    void _slug;
    void _id;
    return props;
  }, [selected]);

  const statusLine =
    source === "sample"
      ? `${agents.length} agents · design fixtures`
      : deckState.status === "ready"
        ? `${agents.length} agent${agents.length === 1 ? "" : "s"} · live from R2`
        : deckState.status === "loading"
          ? "fetching deck…"
          : "deck unavailable";

  return (
    <div className="flex h-full min-h-0 w-full">
      {/* Control rail */}
      <aside className="flex w-72 shrink-0 flex-col gap-5 overflow-y-auto border-r border-sidebar-border px-4 py-5">
        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Data
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
            {(["sample", "live"] as const).map((s) => (
              <button
                key={s}
                aria-pressed={source === s}
                onClick={() => setSource(s)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                  source === s
                    ? "bg-primary-500/15 text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            View
          </p>
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-input p-1">
            {(["static", "animation"] as const).map((m) => (
              <button
                key={m}
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
                className={cn(
                  "cursor-pointer rounded-md px-2 py-1.5 text-xs font-medium capitalize transition-colors",
                  mode === m
                    ? "bg-primary-500/15 text-zinc-50"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300",
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Agents
          </p>
          <button
            onClick={refetch}
            disabled={source === "sample" || deckState.status === "loading"}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "size-3",
                source === "live" && deckState.status === "loading" && "animate-spin",
              )}
            />
            Refresh
          </button>
        </div>

        <nav className="flex flex-col gap-1.5">
          {agents.map((a) => {
            const isActive = !!selected && keyOf(a) === keyOf(selected);
            return (
              <button
                key={keyOf(a)}
                aria-pressed={isActive}
                onClick={() => setAgent(keyOf(a))}
                title={a.agentName}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary-500/50 bg-primary-500/10 text-zinc-50"
                    : "border-transparent bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <span className="truncate">{a.agentName}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-[11px]",
                    a.profitPercent < 0 ? "text-red-400" : "text-primary-500",
                  )}
                >
                  {pct(a.profitPercent)}
                </span>
              </button>
            );
          })}
        </nav>

        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          {source === "live"
            ? "The Design card (the exact Remotion composition the generation pipeline renders to PNG/MP4) fed by the live R2 deck — same component, real data."
            : "Design fixtures — the same sample roster the generation pipeline ships, rich enough to exercise every card state."}
        </p>
        <p className="px-1 font-mono text-[10px] tracking-wide text-muted-foreground">
          {statusLine}
        </p>
      </aside>

      {/* Stage */}
      <main
        ref={stageRef}
        className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden"
      >
        {inputProps ? (
          <div
            className="shrink-0 overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
            style={{
              width: Math.round(ENTRY.width * scale),
              height: Math.round(ENTRY.height * scale),
            }}
          >
            <Player
              key={`${mode}-${selected ? keyOf(selected) : "none"}`}
              component={ENTRY.component}
              inputProps={inputProps}
              durationInFrames={ENTRY.durationInFrames}
              fps={ENTRY.fps}
              compositionWidth={ENTRY.width}
              compositionHeight={ENTRY.height}
              style={{ width: "100%", height: "100%" }}
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
        ) : deckState.status === "loading" ? (
          <p className="font-mono text-xs text-muted-foreground">Fetching deck…</p>
        ) : deckState.status === "error" ? (
          <div className="flex flex-col items-center gap-3">
            <p className="font-mono text-xs text-destructive">
              Could not load deck ({deckState.message}).
            </p>
            <button
              onClick={refetch}
              className="cursor-pointer rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              Retry
            </button>
          </div>
        ) : (
          <p className="font-mono text-xs text-muted-foreground">No agents in the deck.</p>
        )}
      </main>
    </div>
  );
}
