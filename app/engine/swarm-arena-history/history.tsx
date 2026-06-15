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
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, Download, RefreshCw } from "lucide-react";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import SwarmArenaLeaderboardCard from "@/components/swarm-arena-leaderboard-card";
import ConsensusCard, { type ConsensusCardData } from "@/components/consensus-card-view";
import ResultCard, { type ResultCardData } from "@/components/result-card-view";
import FixtureCard, { type FixtureCardData } from "@/components/fixture-card";
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
  toLeaderboardData,
} from "@/lib/swarm-card-data";
import { cn } from "@/lib/utils";

const LEADERBOARD_W = 650;
const LEADERBOARD_H = 1150;

/** A fixture from the schedule feed (public/swarm-arena-cards/fixtures.json). */
type Fixture = {
  matchUid: string;
  day: string; // YYYY-MM-DD (UTC)
  kickoffISO: string;
  kickoff?: string;
  competition?: string;
  stage?: string;
  venue?: string;
  home: { name: string; code: string };
  away: { name: string; code: string };
  status?: string | null;
  settled: boolean;
  homeScore?: number | null;
  awayScore?: number | null;
  winner?: string | null;
};

/** A result record (results.json) — ResultCardData plus the day stamp added by swarm-results.ts. */
type DatedResult = ResultCardData & { day?: string; kickoffISO?: string };

/** Day label for the timeline dropdown, e.g. "Sun, Jun 14". */
const dayLabel = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

/** Short market tag for a consensus-card caption (one game can have several). */
function marketTag(r: ConsensusCardData): string {
  if (r.marketType === "btts") return "BTTS";
  if (r.marketType === "totals")
    return `${String(r.selection).toLowerCase() === "under" ? "Under" : "Over"} ${r.line}`;
  const team = r.selection === "Away" ? r.away : r.selection === "Home" ? r.home : null;
  return team ? `${team} ML` : "Moneyline";
}

/** One consensus record per market (marketType + line) — the swarm's dominant
 *  side (most agents, then biggest edge), so a game shows each market once
 *  rather than contradictory Yes/No cards. Sorted by conviction. */
function topPerMarket(recs: ConsensusCardData[]): ConsensusCardData[] {
  const best = new Map<string, ConsensusCardData>();
  for (const r of recs) {
    const k = `${r.marketType}|${r.line ?? ""}`;
    const cur = best.get(k);
    const better =
      !cur ||
      (r.agentsN ?? 0) > (cur.agentsN ?? 0) ||
      ((r.agentsN ?? 0) === (cur.agentsN ?? 0) && (r.edgePp ?? 0) > (cur.edgePp ?? 0));
    if (better) best.set(k, r);
  }
  return [...best.values()].sort(
    (a, b) =>
      (b.agentsN ?? 0) - (a.agentsN ?? 0) ||
      Math.abs(b.edgePp ?? 0) - Math.abs(a.edgePp ?? 0),
  );
}

/** Sub-nav categories — one card design each. Synced to ?view= for sharable links. */
type HistoryView = "leaderboard" | "agents" | "games" | "results";
const VIEW_TABS: { key: HistoryView; label: string }[] = [
  { key: "leaderboard", label: "Leaderboard" },
  { key: "agents", label: "Agents" },
  { key: "games", label: "Games" },
  { key: "results", label: "Results" },
];

/** /api/swarm-upcoming fixture shape (the fields the card needs). */
type UpcomingGame = {
  home: { name: string; code: string };
  away: { name: string; code: string };
  competition?: string;
  stage?: string;
  venue?: string;
  kickoff?: string;
  odds: { homePct: number; drawPct: number; awayPct: number; hasElo: boolean };
  elo: { home: number | null; away: number | null };
};

/** Elo-only preview ConsensusCardData for a fixture the agents haven't traded. */
function previewFromGame(g: UpcomingGame): ConsensusCardData {
  const { homePct: h, drawPct: d, awayPct: a } = g.odds;
  const fav = Math.max(h, d, a);
  const modelRead =
    fav === d
      ? `Too close to call — the draw leads at ${d}%.`
      : `${fav === h ? g.home.name : g.away.name} favoured at ${fav}%, but ${d}% says the draw is in play.`;
  return {
    home: g.home.name,
    away: g.away.name,
    homeCode: g.home.code,
    awayCode: g.away.code,
    competition: g.competition,
    stage: g.stage,
    venue: g.venue,
    kickoff: g.kickoff,
    marketType: "moneyline",
    selection: "Home",
    line: null,
    marketPrice: 0,
    consensus: 0,
    edgePp: 0,
    agentsN: 0,
    agentsTotal: 0,
    perAgent: [],
    preview: true,
    winProb: { home: h / 100, draw: d / 100, away: a / 100 },
    elo:
      g.elo.home != null && g.elo.away != null
        ? { home: g.elo.home, away: g.elo.away }
        : undefined,
    modelRead,
  };
}

const THUMB_SCALE = 0.44;

type DeckResponse = {
  at?: string | null;
  agents: EngineAgent[];
  availableDates?: string[];
};

/**
 * Session deck cache (module scope → survives Kit↔History navigation; lost only
 * on a full reload). Keyed by timeline: "live" for now, else the YYYY-MM-DD
 * point. A revisit renders from here instantly instead of re-running the slow
 * R2 build, with stale-while-revalidate for the live deck and a permanent cache
 * for immutable historical decks.
 */
const deckCache = new Map<string, { deck: DeckResponse; fetchedAt: number }>();
/** Re-fetch the live deck in the background once the cached copy is older than
 *  this (mirrors the API's own `max-age=30`). */
const LIVE_STALE_MS = 30_000;

/** One gallery cell: a card scaled to a thumb + caption row with a PNG export.
 *  Card-agnostic — pass any 650×H card node as children. */
function CardCell({
  slug,
  caption,
  width,
  height,
  children,
}: {
  slug: string;
  caption: string;
  width: number;
  height: number;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const download = async () => {
    const node = cardRef.current;
    if (!node || busy) return;
    setBusy(true);
    try {
      await exportStaticVisual(node, { id: slug, width, height, format: "png" });
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
        style={{ width: Math.round(width * THUMB_SCALE), height: Math.round(height * THUMB_SCALE) }}
      >
        {/* The card renders at its native size; the wrapper scales it down. The
            export captures this node with the transform neutralised, so
            downloads are full resolution. */}
        <div
          ref={cardRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ transform: `scale(${THUMB_SCALE})` }}
        >
          {children}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-0.5">
        <span className="truncate text-xs font-medium text-zinc-300">
          {caption}
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

/** Deck loading / error / empty placeholder — shared by the deck-backed tabs. */
function DeckState({
  fetching,
  error,
  onRetry,
}: {
  fetching: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      {error ? (
        <div className="flex flex-col items-center gap-3">
          <p className="font-mono text-xs text-destructive">
            Could not load deck ({error}).
          </p>
          <button
            onClick={onRetry}
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
  );
}

export function SwarmArenaHistory() {
  // Seed from the session cache so a revisit's first render already shows the
  // live deck — no one-frame "Fetching deck…" flash. (`when` starts "" → live.)
  const [deck, setDeck] = useState<DeckResponse | null>(
    () => deckCache.get("live")?.deck ?? null,
  );
  const [fetching, setFetching] = useState(() => !deckCache.has("live"));
  /** Background refresh in flight while a deck is already on screen (non-blocking). */
  const [revalidating, setRevalidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Selected MATCH DAY (YYYY-MM-DD), from the timeline. Drives Games/Results
  // filtering and the deck snapshot. Future days have no deck snapshot, so the
  // deck key (`when`) falls back to live for them.
  const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const [day, setDay] = useState<string>("");
  const when = day && day <= todayStr ? day : "";
  /** The WC schedule (all fixtures by day) — drives the timeline + Games tab. */
  const [schedule, setSchedule] = useState<{ days: string[]; fixtures: Fixture[] }>({
    days: [],
    fixtures: [],
  });
  const [updatedAt, setUpdatedAt] = useState<string | null>(() => {
    const live = deckCache.get("live");
    return live ? new Date(live.fetchedAt).toLocaleTimeString() : null;
  });
  const [tick, setTick] = useState(0);
  /** Deck builds read R2 and can take many seconds; the auto-refresh tick
   *  must not abort a request that's still in flight (it would livelock the
   *  page on "fetching" if latency ever nears the interval). */
  const inFlight = useRef(false);
  /** Separates a forced run (manual Refresh / auto-refresh tick) from a
   *  navigation/timeline run, which serves the cache first. */
  const prevTick = useRef(0);

  // Deck fetch backed by the session cache. A timeline/mount run serves the
  // cached deck instantly, then revalidates the *live* deck in the background
  // once stale; a forced run (manual Refresh / auto-refresh tick) always
  // re-fetches. Historical decks are immutable, so a cached date never hits the
  // network. A background refresh never flips the blocking spinner.
  useEffect(() => {
    const key = when || "live";
    const forced = tick !== prevTick.current;
    prevTick.current = tick;
    const cached = deckCache.get(key);

    if (cached && !forced) {
      // Serve from cache immediately — no blocking "Fetching deck…".
      setDeck(cached.deck);
      setError(null);
      setFetching(false);
      // Historical = immutable; live = revalidate only once stale.
      const stale = !when && Date.now() - cached.fetchedAt > LIVE_STALE_MS;
      if (!stale) {
        setRevalidating(false);
        return;
      }
    } else if (!cached) {
      // First load of this key — show the blocking spinner.
      setFetching(true);
    }

    // We already have a deck on screen iff this key is cached → refresh quietly.
    const background = !!cached;
    setRevalidating(background);

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
        deckCache.set(key, { deck: d, fetchedAt: Date.now() });
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
        // Keep a cached deck on screen if a background refresh fails; only the
        // first load of a key (nothing cached) surfaces the error UI.
        if (!deckCache.has(key)) {
          setError(err instanceof Error ? err.message : String(err));
          setFetching(false);
        }
      });
    return () => ctrl.abort();
  }, [when, tick]);

  // Force a fresh fetch (bypasses the serve-from-cache branch via the tick).
  const refetch = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  // Sub-nav: which card category is shown. Seeded from ?view= on mount and
  // written back on change, so each tab (per selected day) is a sharable link.
  const [view, setView] = useState<HistoryView>("leaderboard");
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("view");
    if (p && VIEW_TABS.some((t) => t.key === p)) setView(p as HistoryView);
  }, []);
  const selectView = useCallback((v: HistoryView) => {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set("view", v);
    window.history.replaceState(null, "", url.toString());
  }, []);

  // Match day: seed from ?day= on mount, write back on change.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("day");
    if (p) setDay(p);
  }, []);
  const selectDay = useCallback((d: string) => {
    setDay(d);
    const url = new URL(window.location.href);
    url.searchParams.set("day", d);
    window.history.replaceState(null, "", url.toString());
  }, []);
  // Default to today (or the latest match day on/before today) once the schedule
  // loads — unless ?day= already picked one.
  useEffect(() => {
    if (day || !schedule.days.length) return;
    const past = schedule.days.filter((d) => d <= todayStr);
    setDay(past.length ? past[past.length - 1] : schedule.days[0]);
  }, [schedule.days, day, todayStr]);

  // Auto-refresh only in live mode; a historical point is fixed. Skip the
  // tick while a request is in flight rather than aborting it.
  useEffect(() => {
    if (when) return;
    const timer = setInterval(() => {
      if (!inFlight.current) setTick((t) => t + 1);
    }, 60_000);
    return () => clearInterval(timer);
  }, [when]);

  // Upcoming fixtures (live, from the mirror) + the consensus snapshot (static
  // consensus.json, refreshed on deploy). Each upcoming game renders the
  // consensus card: the full Market-vs-Agents body if the agents cover it,
  // otherwise the same design in Elo preview mode.
  const [upcoming, setUpcoming] = useState<UpcomingGame[]>([]);
  const [consensus, setConsensus] = useState<ConsensusCardData[]>([]);
  const [results, setResults] = useState<DatedResult[]>([]);
  useEffect(() => {
    const ctrl = new AbortController();
    fetch("/api/swarm-upcoming", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(`upcoming ${r.status}`)))
      .then((d: { games?: UpcomingGame[] }) => setUpcoming(d.games ?? []))
      .catch(() => {});
    fetch("/swarm-arena-cards/consensus.json", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(`consensus ${r.status}`)))
      .then((d: { records?: ConsensusCardData[] }) => setConsensus(d.records ?? []))
      .catch(() => {});
    fetch("/swarm-arena-cards/results.json", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(`results ${r.status}`)))
      .then((d: { records?: DatedResult[] }) => setResults(d.records ?? []))
      .catch(() => {});
    fetch("/swarm-arena-cards/fixtures.json", { cache: "no-store", signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(`fixtures ${r.status}`)))
      .then((d: { days?: string[]; fixtures?: Fixture[] }) =>
        setSchedule({ days: d.days ?? [], fixtures: d.fixtures ?? [] }),
      )
      .catch(() => {});
    return () => ctrl.abort();
  }, [tick]);

  const agents = deck ? dedupeByHandle(deck.agents) : [];
  const period = deck?.at ? deck.at.slice(0, 10) : "live";
  // Index the agents' game bets + the Elo feed by team-code pair, so each of the
  // day's fixtures can find its richest card.
  const consensusByPair = useMemo(() => {
    const m = new Map<string, ConsensusCardData[]>();
    for (const r of consensus) {
      if (!r.homeCode || !r.awayCode) continue;
      const k = `${r.homeCode}-${r.awayCode}`.toUpperCase();
      const arr = m.get(k);
      if (arr) arr.push(r);
      else m.set(k, [r]);
    }
    return m;
  }, [consensus]);
  const upcomingByPair = useMemo(() => {
    const m = new Map<string, UpcomingGame>();
    for (const g of upcoming) m.set(`${g.home.code}-${g.away.code}`.toUpperCase(), g);
    return m;
  }, [upcoming]);
  type GameCard =
    | { kind: "consensus"; slug: string; caption: string; data: ConsensusCardData }
    | { kind: "fixture"; slug: string; caption: string; data: FixtureCardData };
  // Games for the selected day: full Market-vs-Agents consensus where the agents
  // cover an upcoming fixture, an Elo preview where we have odds, else a neutral
  // fixture card (final score once settled, or matchup + kickoff if no coverage).
  const gameCards: GameCard[] = schedule.fixtures
    .filter((f) => f.day === day)
    .flatMap((f): GameCard[] => {
      const pair = `${f.home.code}-${f.away.code}`.toUpperCase();
      const recs = !f.settled ? consensusByPair.get(pair) : undefined;
      if (recs && recs.length) {
        // One consensus card per market the agents cover for this game.
        return topPerMarket(recs).map((rec) => ({
          kind: "consensus" as const,
          slug: `consensus-${pair}-${rec.marketType}-${rec.line ?? ""}-${rec.selection}`
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/-+$/g, ""),
          caption: `${f.home.name} v ${f.away.name} · ${marketTag(rec)}`,
          data: rec,
        }));
      }
      const up = !f.settled ? upcomingByPair.get(pair) : undefined;
      if (up && up.odds?.hasElo)
        return [
          {
            kind: "consensus" as const,
            slug: `preview-${pair}`.toLowerCase(),
            caption: `${f.home.name} v ${f.away.name}`,
            data: previewFromGame(up),
          },
        ];
      const fc: FixtureCardData = {
        home: f.home.name, away: f.away.name, homeCode: f.home.code, awayCode: f.away.code,
        competition: f.competition, stage: f.stage, venue: f.venue, kickoff: f.kickoff,
        settled: f.settled, homeScore: f.homeScore, awayScore: f.awayScore, winner: f.winner,
      };
      return [
        {
          kind: "fixture" as const,
          slug: `fixture-${pair}`.toLowerCase(),
          caption: `${f.home.name} ${f.settled ? `${f.homeScore}–${f.awayScore}` : "vs"} ${f.away.name}`,
          data: fc,
        },
      ];
    });
  // Won-pick result cards for the selected day (results.json, day-stamped).
  const resultCards = results
    .filter((r) => r.day === day)
    .map((r) => ({
      slug: `result-${r.marketType}-${r.homeCode}-${r.awayCode}`.toLowerCase(),
      caption: `${r.home} ${r.homeScore}–${r.awayScore} ${r.away}`,
      data: r as ResultCardData,
    }));
  const leaderboardData = agents.length ? toLeaderboardData(agents) : null;
  const timelineOptions = useMemo(
    () => schedule.days.map((d) => ({ value: d, label: dayLabel(d) })),
    [schedule.days],
  );
  const timelineLabel = day ? dayLabel(day) : "Select day";
  const status = fetching
    ? "fetching deck…"
    : error
      ? `deck unavailable (${error})`
      : deck
        ? `${agents.length} agent${agents.length === 1 ? "" : "s"} · ${
            deck.at ? `as of ${period}` : `live · updated ${updatedAt}`
          }${revalidating ? " · refreshing…" : ""}`
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
            <DropdownMenuContent align="end" className="max-h-[60vh] min-w-[8.5rem] overflow-y-auto">
              {timelineOptions.map(({ value, label }) => (
                <DropdownMenuItem
                  key={value}
                  className="cursor-pointer text-xs"
                  onClick={() => selectDay(value)}
                >
                  {label}
                  {day === value ? (
                    <Check className="ml-auto size-3.5 text-primary-500" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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

      {/* Sub-nav: one card category at a time */}
      <div className="flex shrink-0 items-center gap-1 border-b border-sidebar-border px-5 py-2">
        {VIEW_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => selectView(t.key)}
            aria-current={view === t.key ? "page" : undefined}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              view === t.key
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Gallery — the selected category. Leaderboard/Agents come from the deck
          (timeline-aware); Games/Results are static snapshots, so they render
          independently of the deck load. */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="p-6">
          {view === "leaderboard" &&
            (leaderboardData ? (
              <div className="grid gap-7 [grid-template-columns:repeat(auto-fill,minmax(286px,1fr))]">
                <CardCell
                  slug={`leaderboard-${period}`}
                  caption="Leaderboard"
                  width={LEADERBOARD_W}
                  height={LEADERBOARD_H}
                >
                  <SwarmArenaLeaderboardCard data={leaderboardData} />
                </CardCell>
              </div>
            ) : (
              <DeckState fetching={fetching} error={error} onRetry={refetch} />
            ))}

          {view === "agents" &&
            (agents.length ? (
              <div className="grid gap-7 [grid-template-columns:repeat(auto-fill,minmax(286px,1fr))]">
                {agents.map((a, i) => {
                  const card = toCardData(a, i + 1, agents.length);
                  return (
                    <CardCell
                      key={a.handle}
                      slug={`agent-${a.handle.toLowerCase()}-${period}`}
                      caption={card.name}
                      width={MODEL_CARD_W}
                      height={MODEL_CARD_H}
                    >
                      <SwarmArenaModelCard data={card} />
                    </CardCell>
                  );
                })}
              </div>
            ) : (
              <DeckState fetching={fetching} error={error} onRetry={refetch} />
            ))}

          {view === "games" &&
            (gameCards.length ? (
              <div className="grid gap-7 [grid-template-columns:repeat(auto-fill,minmax(286px,1fr))]">
                {gameCards.map((c) => (
                  <CardCell
                    key={c.slug}
                    slug={c.slug}
                    caption={c.caption}
                    width={MODEL_CARD_W}
                    height={MODEL_CARD_H}
                  >
                    {c.kind === "consensus" ? (
                      <ConsensusCard data={c.data} />
                    ) : (
                      <FixtureCard data={c.data} />
                    )}
                  </CardCell>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                {schedule.days.length ? "No games scheduled for this day." : "Loading schedule…"}
              </p>
            ))}

          {view === "results" &&
            (resultCards.length ? (
              <div className="grid gap-7 [grid-template-columns:repeat(auto-fill,minmax(286px,1fr))]">
                {resultCards.map((c) => (
                  <CardCell
                    key={c.slug}
                    slug={c.slug}
                    caption={c.caption}
                    width={MODEL_CARD_W}
                    height={MODEL_CARD_H}
                  >
                    <ResultCard data={c.data} />
                  </CardCell>
                ))}
              </div>
            ) : (
              <p className="font-mono text-xs text-muted-foreground">
                No settled results for this day{day && day > todayStr ? " — games haven't kicked off." : " yet."}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
}
