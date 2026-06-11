"use client";

/**
 * NickAI History — the live trading-card gallery, Engine-style.
 *
 * Every agent in the R2 feed rendered as a scaled-down Design performance card
 * (`AiReadyCard`, the settled still of the Remotion composition the generation
 * pipeline outputs), with in-browser PNG export and a house-style caption copy
 * per card. Mirrors app/engine/swarm-arena-history, including its session deck
 * cache. The trading deck has no point-in-time parameter, so there is no
 * timeline selector here.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, Download, RefreshCw } from "lucide-react";
import AiReadyCard from "@/components/ai-ready-card";
import { exportStaticVisual } from "@/lib/export-static-image";
import {
  TRADING_CARD_H,
  TRADING_CARD_W,
  type TradingDeckAgent,
  captionFor,
  pct,
} from "@/lib/trading-card-data";
import { cn } from "@/lib/utils";

const THUMB_SCALE = 0.44;
const THUMB_W = Math.round(TRADING_CARD_W * THUMB_SCALE);
const THUMB_H = Math.round(TRADING_CARD_H * THUMB_SCALE);

type DeckResponse = { agents: TradingDeckAgent[] };

/**
 * Session deck cache (module scope → survives navigation within the app; lost
 * only on a full reload). The trading deck is live-only, so a single entry,
 * with stale-while-revalidate on revisit — same pattern as the Swarm history.
 */
let deckCache: { deck: DeckResponse; fetchedAt: number } | null = null;
/** Re-fetch in the background once the cached copy is older than this
 *  (mirrors the API's own `max-age=30`). */
const LIVE_STALE_MS = 30_000;

/** One gallery cell: scaled card thumb + caption row with PNG + caption copy. */
function CardCell({ agent }: { agent: TradingDeckAgent }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { id: _id, slug: _slug, ...props } = agent;
  void _id;
  void _slug;

  const download = async () => {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      await exportStaticVisual(node, {
        id: `agent-${agent.slug}`,
        width: TRADING_CARD_W,
        height: TRADING_CARD_H,
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

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(captionFor(agent));
      setCopied(true);
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable — nothing useful to do */
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div
        className="relative overflow-hidden rounded-2xl border border-sidebar-border"
        style={{ width: THUMB_W, height: THUMB_H }}
      >
        {/* The card renders at its native 650×1136; the wrapper scales it down.
            The export captures this node with the transform neutralised, so
            downloads are full resolution. */}
        <div
          ref={cardRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `scale(${THUMB_SCALE})` }}
        >
          <AiReadyCard {...props} />
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs font-medium text-zinc-300">
            {agent.agentName}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            {pct(agent.profitPercent)} · {agent.runs} runs / {agent.trades}{" "}
            trades
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={copyCaption}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            {copied ? (
              <Check className="size-3 text-primary-500" />
            ) : (
              <Copy className="size-3" />
            )}
            {copied ? "Copied" : "Caption"}
          </button>
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
    </div>
  );
}

export function NickAiHistory() {
  // Seed from the session cache so a revisit's first render already shows the
  // deck — no one-frame "Fetching deck…" flash.
  const [deck, setDeck] = useState<DeckResponse | null>(
    () => deckCache?.deck ?? null,
  );
  const [fetching, setFetching] = useState(() => !deckCache);
  /** Background refresh in flight while a deck is already on screen. */
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(() =>
    deckCache ? new Date(deckCache.fetchedAt).toLocaleTimeString() : null,
  );
  const [tick, setTick] = useState(0);
  /** The auto-refresh tick must not abort a request still in flight. */
  const inFlight = useRef(false);
  /** Separates a forced run (manual Refresh / auto-refresh tick) from a
   *  mount run, which serves the cache first. */
  const prevTick = useRef(0);

  // Deck fetch backed by the session cache: a mount run serves the cached deck
  // instantly and revalidates in the background once stale; a forced run
  // always re-fetches. A background refresh never flips the blocking spinner.
  useEffect(() => {
    const forced = tick !== prevTick.current;
    prevTick.current = tick;

    if (deckCache && !forced) {
      setDeck(deckCache.deck);
      setError(null);
      setFetching(false);
      const stale = Date.now() - deckCache.fetchedAt > LIVE_STALE_MS;
      if (!stale) {
        setRevalidating(false);
        return;
      }
    } else if (!deckCache) {
      setFetching(true);
    }

    const background = !!deckCache;
    setRevalidating(background);

    const ctrl = new AbortController();
    inFlight.current = true;
    fetch("/api/trading-deck", { cache: "no-store", signal: ctrl.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`deck ${res.status}`);
        return res.json();
      })
      .then((d: DeckResponse) => {
        inFlight.current = false;
        deckCache = { deck: d, fetchedAt: Date.now() };
        setDeck(d);
        setError(null);
        setFetching(false);
        setRevalidating(false);
        setUpdatedAt(new Date().toLocaleTimeString());
      })
      .catch((err) => {
        // On abort a newer effect run owns inFlight — leave it alone.
        if (ctrl.signal.aborted) return;
        inFlight.current = false;
        setRevalidating(false);
        // Keep a cached deck on screen if a background refresh fails; only a
        // first load with nothing cached surfaces the error UI.
        if (!deckCache) {
          setError(err instanceof Error ? err.message : String(err));
          setFetching(false);
        }
      });
    return () => ctrl.abort();
  }, [tick]);

  // Force a fresh fetch (bypasses the serve-from-cache branch via the tick).
  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Auto-refresh; skip the tick while a request is in flight rather than
  // aborting it.
  useEffect(() => {
    const timer = setInterval(() => {
      if (!inFlight.current) setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(timer);
  }, []);

  const agents = deck?.agents ?? [];
  const status = fetching
    ? "fetching deck…"
    : error
      ? `deck unavailable (${error})`
      : deck
        ? `${agents.length} card${agents.length === 1 ? "" : "s"} · live · updated ${updatedAt}${
            revalidating ? " · refreshing…" : ""
          }`
        : "";

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      {/* Controls bar */}
      <div className="flex shrink-0 flex-wrap items-center gap-4 border-b border-sidebar-border px-5 py-3">
        <p className="mr-auto text-xs text-muted-foreground">
          Every trading agent rendered live in the browser from the R2 feed —
          no stored PNGs.
        </p>
        <button
          onClick={refetch}
          disabled={fetching || revalidating}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-input px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw
            className={cn(
              "size-3",
              (fetching || revalidating) && "animate-spin",
            )}
          />
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
            {agents.map((a) => (
              <CardCell key={a.id} agent={a} />
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
                {fetching ? "Fetching deck…" : "No agents in the feed yet."}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
