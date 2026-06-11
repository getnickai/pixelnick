"use client";

/**
 * Swarm Arena History — the live gallery, Engine-style.
 *
 * Port of public/swarm-arena-cards/history.html into the app: every agent in
 * the deck rendered as a scaled-down Design model card, with a timeline
 * selector (point-in-time decks via /api/swarm-deck?at=) and an in-browser
 * PNG export per card. Match and leaderboard cards have no React component
 * yet, so the upcoming-games and leaderboard sections stay behind in the
 * static page for now.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Download, RefreshCw } from "lucide-react";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EngineAgent } from "@/data/swarm-output";
import { exportStaticVisual } from "@/lib/export-static-image";
import {
  MODEL_CARD_H,
  MODEL_CARD_W,
  dedupeByHandle,
  toCardData,
} from "@/lib/swarm-card-data";
import { cn } from "@/lib/utils";

const THUMB_SCALE = 0.44;
const THUMB_W = Math.round(MODEL_CARD_W * THUMB_SCALE);
const THUMB_H = Math.round(MODEL_CARD_H * THUMB_SCALE);

type DeckResponse = {
  at?: string | null;
  agents: EngineAgent[];
  availableDates?: string[];
};

/** One gallery cell: scaled card thumb + caption row with a PNG export. */
function CardCell({
  agent,
  rank,
  rankOf,
  period,
}: {
  agent: EngineAgent;
  rank: number;
  rankOf: number;
  period: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const card = toCardData(agent, rank, rankOf);

  const download = async () => {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      await exportStaticVisual(node, {
        id: `agent-${agent.handle.toLowerCase()}-${period}`,
        width: MODEL_CARD_W,
        height: MODEL_CARD_H,
        format: "png",
      });
    } catch (err) {
      alert(
        `In-browser PNG export failed (${err instanceof Error ? err.message : err}).`,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="relative overflow-hidden rounded-2xl border border-sidebar-border"
        style={{ width: THUMB_W, height: THUMB_H }}
      >
        {/* The card renders at its native 650×1110; the wrapper scales it down.
            The export captures this node with the transform neutralised, so
            downloads are full resolution. */}
        <div
          ref={cardRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `scale(${THUMB_SCALE})` }}
        >
          <SwarmArenaModelCard data={card} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-xs font-medium text-zinc-300">
          {card.name}
        </span>
        <button
          onClick={download}
          disabled={busy}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="size-3" />
          {busy ? "…" : "PNG"}
        </button>
      </div>
    </div>
  );
}

export function SwarmArenaHistory() {
  const [deck, setDeck] = useState<DeckResponse | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** "" = live (now); otherwise a YYYY-MM-DD run date from the timeline. */
  const [when, setWhen] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  /** Deck builds read R2 and can take many seconds; the auto-refresh tick
   *  must not abort a request that's still in flight (it would livelock the
   *  page on "fetching" if latency ever nears the interval). */
  const inFlight = useRef(false);

  // Deck fetch — re-runs on timeline change, manual refresh, and the live
  // auto-refresh tick. The previous deck stays on screen while fetching.
  useEffect(() => {
    const ctrl = new AbortController();
    inFlight.current = true;
    // A date maps to end-of-day UTC so the deck reflects every run that day.
    const at = when ? `?at=${encodeURIComponent(`${when}T23:59:59.999Z`)}` : "";
    fetch(`/api/swarm-deck${at}`, { cache: "no-store", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`deck ${res.status}`);
        return res.json();
      })
      .then((d: DeckResponse) => {
        inFlight.current = false;
        setDeck(d);
        setError(null);
        setFetching(false);
        setUpdatedAt(new Date().toLocaleTimeString());
        // Populate the timeline once: each available run date, newest first.
        setDates((cur) =>
          cur.length ? cur : [...(d.availableDates ?? [])].reverse(),
        );
      })
      .catch((err) => {
        // On abort a newer effect run owns inFlight — leave it alone.
        if (ctrl.signal.aborted) return;
        inFlight.current = false;
        setError(err instanceof Error ? err.message : String(err));
        setFetching(false);
      });
    return () => ctrl.abort();
  }, [when, tick]);

  const refetch = useCallback(() => {
    setFetching(true);
    setTick((t) => t + 1);
  }, []);

  // Auto-refresh only in live mode; a historical point is fixed. Skip the
  // tick while a request is in flight rather than aborting it.
  useEffect(() => {
    if (when) return;
    const timer = setInterval(() => {
      if (!inFlight.current) setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(timer);
  }, [when]);

  const agents = deck ? dedupeByHandle(deck.agents) : [];
  const period = deck?.at ? deck.at.slice(0, 10) : "live";
  const timelineOptions = useMemo(
    () => [
      { value: "", label: "Live (now)" },
      ...dates.map((d) => ({ value: d, label: d })),
    ],
    [dates],
  );
  const timelineLabel =
    timelineOptions.find((option) => option.value === when)?.label ??
    "Live (now)";
  const status = fetching
    ? "fetching deck…"
    : error
      ? `deck unavailable (${error})`
      : deck
        ? `${agents.length} agent${agents.length === 1 ? "" : "s"} · ${
            deck.at ? `as of ${period}` : `live · updated ${updatedAt}`
          }`
        : "";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Controls bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-sidebar-border px-5 py-3">
        <p className="mr-auto text-xs text-muted-foreground">
          Rendered live in the browser from the R2 agent output — no stored
          PNGs.
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span id="timeline-select-label">Timeline</span>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="outline"
                  size="xs"
                  aria-labelledby="timeline-select-label"
                  className="h-7 cursor-pointer gap-1.5 text-xs font-medium"
                >
                  {timelineLabel}
                  <ChevronDown className="size-3.5 opacity-70" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="min-w-[8.5rem]">
              {timelineOptions.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value || "live"}
                  className="cursor-pointer text-xs"
                  onClick={() => {
                    setFetching(true);
                    setWhen(value);
                  }}
                >
                  {label}
                  {when === value ? (
                    <Check className="ml-auto size-3.5 text-primary-500" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <button
          onClick={refetch}
          disabled={fetching}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={cn("size-3", fetching && "animate-spin")} />
          Refresh
        </button>
        <span className="font-mono text-[10px] tracking-wide text-muted-foreground">
          {status}
        </span>
      </div>

      {/* Gallery */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {agents.length ? (
          <div className="grid gap-7 p-6 [grid-template-columns:repeat(auto-fill,minmax(286px,1fr))]">
            {agents.map((a, i) => (
              <CardCell
                key={a.handle}
                agent={a}
                rank={i + 1}
                rankOf={agents.length}
                period={period}
              />
            ))}
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            {error ? (
              <div className="flex flex-col items-center gap-3">
                <p className="font-mono text-xs text-destructive">
                  Could not load deck ({error}).
                </p>
                <button
                  onClick={refetch}
                  className="cursor-pointer rounded-md border border-input px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Retry
                </button>
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                {fetching ? "Fetching deck…" : "No agents in the deck."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
