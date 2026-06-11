"use client";

/**
 * Swarm Arena Kit — the first Pixelnick Engine surface.
 *
 * Engine = Design components + live data: the card is the React/Tailwind
 * SwarmArenaModelCard from Pixelnick Design (the design source of truth,
 * previewed with sample data under /static); this page feeds it the live
 * R2 deck from /api/swarm-deck. No vanilla card-engine here — that remains
 * the static gallery / PNG pipeline's concern.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import type { EngineAgent } from "@/data/swarm-output";
import { SAMPLE_SWARM_AGENTS } from "@/data/swarm-sample-deck";
import { MODEL_LOGOS, MODELS_ASSET, toCardData } from "@/lib/swarm-card-data";
import { cn } from "@/lib/utils";

const CARD_W = 650;
const CARD_H = 1110;
const FIT_PAD = 80;

type DeckResponse = { at?: string | null; agents: EngineAgent[] };
type DeckState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; deck: DeckResponse };

/** Rail chip avatar: the model's mark tinted in its brand color (via CSS mask
 *  — the SVGs are currentColor marks, which render black through an <img>),
 *  ensemble flag, or monogram code when no mark exists (e.g. Qwen). */
function AgentAvatar({ agent: a }: { agent: EngineAgent }) {
  const logoFile = a.kind === "ensemble" ? undefined : MODEL_LOGOS[a.handle];
  return (
    <span
      className="grid size-5 shrink-0 place-items-center rounded-full font-mono text-[8px] font-bold"
      style={{
        background: `${a.color}22`,
        border: `1px solid ${a.color}66`,
        color: a.color,
      }}
    >
      {logoFile ? (
        <span
          aria-hidden
          className="block size-3"
          style={{
            backgroundColor: a.color,
            maskImage: `url(${MODELS_ASSET}/${logoFile}.svg)`,
            WebkitMaskImage: `url(${MODELS_ASSET}/${logoFile}.svg)`,
            maskSize: "contain",
            WebkitMaskSize: "contain",
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
          }}
        />
      ) : a.kind === "ensemble" ? (
        a.flag
      ) : (
        a.code
      )}
    </span>
  );
}

type DataSource = "live" | "sample";

export function SwarmArenaKit() {
  const [deckState, setDeckState] = useState<DeckState>({ status: "loading" });
  const [retryKey, setRetryKey] = useState(0);
  const [source, setSource] = useState<DataSource>("live");
  const [agent, setAgent] = useState<string | null>(null);
  const [scale, setScale] = useState(1);

  // Live deck. AbortController makes the dev StrictMode double-run harmless.
  // (Initial state is "loading"; refresh/retry reset it before bumping the key.)
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/swarm-deck", { cache: "no-store", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`deck ${res.status}`);
        return res.json();
      })
      .then((deck: DeckResponse) => {
        setDeckState({ status: "ready", deck });
        setAgent((cur) => cur ?? deck.agents[0]?.handle ?? null);
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

  // Sample mode renders the Design fixtures; live mode the deduped R2 deck.
  // (Dedupe is a defense: the upstream feed has produced colliding handles —
  // two agents reporting "GPT" — keep the first/higher-ranked per handle so
  // selection and React keys stay sound.) Both sorted by ROI for rank.
  const agents = useMemo(() => {
    if (source === "sample") {
      return [...SAMPLE_SWARM_AGENTS].sort((a, b) => b.roiPct - a.roiPct);
    }
    if (deckState.status !== "ready") return [];
    const seen = new Set<string>();
    return deckState.deck.agents.filter((a) => {
      if (seen.has(a.handle)) return false;
      seen.add(a.handle);
      return true;
    });
  }, [deckState, source]);

  // Scale-to-fit: the card is a fixed 650×1050, so the scale falls out of the
  // stage box alone — observe it (covers window resizes and app-sidebar
  // collapse/expand) instead of measuring the card.
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const update = () =>
      setScale(
        Math.min(
          (stage.clientWidth - FIT_PAD) / CARD_W,
          (stage.clientHeight - FIT_PAD) / CARD_H,
          1,
        ),
      );
    update();
    const ro = new ResizeObserver(update);
    ro.observe(stage);
    return () => ro.disconnect();
  }, []);

  const selected = agents.find((a) => a.handle === agent) ?? agents[0];
  const statusLine =
    source === "sample"
      ? `${agents.length} agents · design fixtures`
      : deckState.status === "ready"
        ? `${agents.length} agent${agents.length === 1 ? "" : "s"} · ${
            deckState.deck.at ? `as of ${deckState.deck.at.slice(0, 10)}` : "live from R2"
          }`
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
            {(["live", "sample"] as const).map((s) => (
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

        <nav className="grid grid-cols-2 gap-1.5">
          {agents.map((a) => {
            const isActive = a.handle === selected?.handle;
            return (
              <button
                key={a.handle}
                aria-pressed={isActive}
                onClick={() => setAgent(a.handle)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                  isActive
                    ? "border-primary-500/50 bg-primary-500/10 text-zinc-50"
                    : "border-transparent bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200",
                )}
              >
                <AgentAvatar agent={a} />
                <span className="truncate">{a.short}</span>
              </button>
            );
          })}
        </nav>

        <p className="px-1 text-xs leading-relaxed text-muted-foreground">
          {source === "live"
            ? "The Design card (Pixelnick Design → Static) rendered with the live R2 deck — same component, real data."
            : "Design fixtures — the same fictional roster the static HTML kit ships, rich enough to exercise every card state."}
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
        {selected ? (
          <div
            style={{ transform: `scale(${scale})` }}
            className="shrink-0 shadow-[0_24px_80px_rgba(0,0,0,0.5)]"
          >
            <SwarmArenaModelCard
              data={toCardData(selected, agents.indexOf(selected) + 1, agents.length)}
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
