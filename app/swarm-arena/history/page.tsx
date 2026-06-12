"use client";

/**
 * Swarm Arena — Live / History gallery.
 *
 * Agent cards render through Onur's React `SwarmArenaModelCard` (the single
 * design source of truth), fed by `/api/swarm-deck?at=` via the shared
 * `toCardData` adapter. The Leaderboard card and the Upcoming-games match
 * previews have no React design yet, so they keep rendering through the
 * framework-free engine (`window.SA`, loaded from card-engine.js) — a mixed
 * page by design. No in-browser PNG export (it hangs on the Tailwind-v4 card;
 * real PNGs come from the render pipeline).
 *
 * Replaces the static `public/swarm-arena-cards/history.html`.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Script from "next/script";
import SwarmArenaModelCard from "@/components/swarm-arena-model-card";
import type { EngineAgent } from "@/data/swarm-output";
import type { ConsensusRecord } from "@/lib/swarm-engine";
import { toCardData } from "@/lib/swarm-card-data";
import { SwarmCardsShell } from "../shell";

const ASSET_BASE = "/swarm-arena-cards/assets";

type Deck = {
  at?: string | null;
  agents: EngineAgent[];
  availableDates?: string[];
  match?: unknown;
};

const GALLERY_CSS = `
  .sah-main{position:relative;z-index:2;flex:1;min-height:0;overflow-y:auto;padding:24px 28px 80px}
  .sah-controls{display:flex;align-items:center;gap:14px;max-width:1320px;margin:0 auto 10px;flex-wrap:wrap}
  .sah-controls .blurb{color:var(--text-dim);font-size:13px;margin-right:auto;max-width:560px;line-height:1.5}
  .sah-controls button{font:inherit;font-size:12.5px;color:var(--text);background:var(--bg-panel);border:1px solid var(--border-solid);border-radius:8px;padding:7px 14px;cursor:pointer;transition:all .14s ease}
  .sah-controls button:hover{border-color:color-mix(in srgb,var(--brand) 45%,transparent)}
  .sah-controls select{font:inherit;font-size:12.5px;color:var(--text);background:var(--bg-panel);border:1px solid var(--border-solid);border-radius:6px;padding:5px 9px}
  .sah-controls label{display:inline-flex;align-items:center;gap:7px;color:var(--text-dim);font-size:12.5px}
  .sah-status{font-family:var(--font-mono);font-size:11px;color:var(--text-faint);letter-spacing:0.05em}
  .sah-sechead{display:flex;align-items:baseline;gap:12px;max-width:1320px;margin:26px auto 4px}
  .sah-sechead h2{margin:0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;font-family:var(--font-mono);color:var(--text-dim)}
  .sah-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(286px,1fr));gap:28px;max-width:1320px;margin:14px auto 0}
  .sah-cell{display:flex;flex-direction:column;gap:10px}
  .sah-thumb{width:286px;height:500px;overflow:hidden;border-radius:18px;border:1px solid var(--border-solid);background:#15140F;position:relative}
  .sah-thumb-inner{position:absolute;top:0;left:0;transform:scale(.44);transform-origin:top left}
  .sah-cap{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--text-dim);font-size:12.5px}
  .sah-dl{font:inherit;font-size:11px;color:var(--text);background:var(--bg-panel);border:1px solid var(--border-solid);border-radius:6px;padding:3px 9px;cursor:pointer;transition:all .14s ease;white-space:nowrap}
  .sah-dl:hover{border-color:color-mix(in srgb,var(--brand) 45%,transparent)}
  .sah-dl:disabled{opacity:.5;cursor:default}
  .sah-empty{font-family:var(--font-mono);font-size:13px;color:var(--text-faint);padding:50px 0;text-align:center}
`;

export default function SwarmHistoryPage() {
  const [deck, setDeck] = useState<Deck | null>(null);
  const [status, setStatus] = useState("Loading…");
  const [upStatus, setUpStatus] = useState("");
  const [when, setWhen] = useState(""); // "" = live; otherwise YYYY-MM-DD
  const [dates, setDates] = useState<string[]>([]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [engineReady, setEngineReady] = useState(false);
  const [leaderboardHtml, setLeaderboardHtml] = useState("");
  const [upcomingHtml, setUpcomingHtml] = useState<{ html: string; label: string; slug: string }[]>([]);
  // Consensus ("Market vs Agents") cards — placeholder design, fed from the static
  // consensus.json snapshot for now (a live /api/swarm-consensus is a follow-up).
  const [consensusRecords, setConsensusRecords] = useState<ConsensusRecord[]>([]);
  const [consensusHtml, setConsensusHtml] = useState<{ html: string; label: string; slug: string }[]>([]);
  const [consStatus, setConsStatus] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // YYYY-MM-DD → end-of-day UTC so the deck reflects every run from that day.
  const atParam = useCallback(
    () => (when ? `?at=${encodeURIComponent(when + "T23:59:59.999Z")}` : ""),
    [when],
  );

  const loadDeck = useCallback(() => {
    setStatus("Fetching deck…");
    fetch("/api/swarm-deck" + atParam(), { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(`deck ${r.status}`)))
      .then((d: Deck) => {
        // Dedupe colliding handles (the upstream feed has produced two "GPT"s);
        // keep the first per handle so React keys + selection stay sound.
        const seen = new Set<string>();
        d.agents = (d.agents ?? []).filter((a) =>
          seen.has(a.handle) ? false : (seen.add(a.handle), true),
        );
        setDeck(d);
        if (Array.isArray(d.availableDates)) setDates([...d.availableDates].reverse());
        const w = d.at ? `as of ${d.at.slice(0, 10)}` : `live · ${new Date().toLocaleTimeString()}`;
        setStatus(`${d.agents.length} agent${d.agents.length === 1 ? "" : "s"} · ${w}`);
      })
      .catch((err) => setStatus(`Could not load deck (${err}).`));
  }, [atParam]);

  const loadUpcoming = useCallback(() => {
    setUpStatus("Loading…");
    fetch("/api/swarm-upcoming", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(`upcoming ${r.status}`)))
      .then((feed: { games?: Game[] }) => {
        const games = (feed.games ?? [])
          .slice()
          .sort((a, b) => (a.kickoffISO < b.kickoffISO ? -1 : a.kickoffISO > b.kickoffISO ? 1 : 0));
        setUpcomingGames(games);
        setUpStatus(`${games.length} fixture(s)`);
      })
      .catch((err) => setUpStatus(`Error (${err})`));
  }, []);

  const loadConsensus = useCallback(() => {
    setConsStatus("Loading…");
    fetch("/swarm-arena-cards/consensus.json", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(`consensus ${r.status}`)))
      .then((d: { records?: ConsensusRecord[] }) => {
        const recs = d.records ?? [];
        setConsensusRecords(recs);
        setConsStatus(`${recs.length} market(s) · placeholder`);
      })
      .catch((err) => setConsStatus(`Error (${err})`));
  }, []);

  const [upcomingGames, setUpcomingGames] = useState<Game[]>([]);

  // Best-effort PNG of a vanilla card (match / leaderboard — plain CSS). We
  // rasterize inside a throwaway iframe that loads ONLY the engine stylesheets +
  // its own html-to-image, so the page's Tailwind-v4 CSS (which hangs the
  // rasterizer) is out of scope and the main thread never freezes. In-browser
  // export of these cards is flaky regardless, so it fails gracefully and points
  // at the render pipeline. The Tailwind-v4 model cards get no button at all.
  const downloadCard = useCallback(
    async (html: string, filename: string, btn: HTMLButtonElement) => {
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "…";
      const iframe = document.createElement("iframe");
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.cssText =
        "position:fixed;left:-10000px;top:0;width:650px;height:1200px;border:0;background:transparent";
      document.body.appendChild(iframe);
      try {
        const doc = iframe.contentDocument!;
        doc.open();
        doc.write(
          `<!doctype html><html data-theme="${theme}"><head><meta charset="utf-8">` +
            `<link rel="stylesheet" href="/swarm-arena-cards/colors_and_type.css">` +
            `<link rel="stylesheet" href="/swarm-arena-cards/card-styles.css">` +
            `<script src="/swarm-arena-cards/html-to-image.js"></script>` +
            `<style>html,body{margin:0;padding:0;background:transparent}</style>` +
            `</head><body>${html}</body></html>`,
        );
        doc.close();
        await new Promise<void>((res) => {
          iframe.onload = () => res();
          setTimeout(res, 4000);
        });
        await new Promise((r) => setTimeout(r, 400)); // settle layout + images
        const win = iframe.contentWindow as unknown as {
          htmlToImage?: { toPng: (n: Element, o?: unknown) => Promise<string> };
        };
        const card = doc.body.firstElementChild;
        if (!win.htmlToImage || !card) throw new Error("rasterizer not ready");
        const dataUrl = await Promise.race([
          win.htmlToImage.toPng(card, { width: 650, height: 1136, pixelRatio: 2, cacheBust: false }),
          new Promise<string>((_, rej) => setTimeout(() => rej(new Error("export timed out")), 12000)),
        ]);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `${filename}.png`;
        a.click();
      } catch (e) {
        alert(
          `In-browser PNG export failed (${e instanceof Error ? e.message : e}). ` +
            `These cards rasterize unreliably in the browser — use the render pipeline ` +
            `(generate-swarm-cards) for a clean PNG.`,
        );
      } finally {
        iframe.remove();
        btn.disabled = false;
        btn.textContent = label;
      }
    },
    [theme],
  );

  useEffect(() => {
    loadDeck();
  }, [loadDeck]);
  useEffect(() => {
    loadUpcoming();
  }, [loadUpcoming]);
  useEffect(() => {
    loadConsensus();
  }, [loadConsensus]);

  // Auto-refresh in live mode only; a historical point is fixed.
  useEffect(() => {
    if (timer.current) clearInterval(timer.current);
    if (!when) timer.current = setInterval(loadDeck, 60000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [when, loadDeck]);

  // Render the vanilla cards (leaderboard + upcoming) once the engine is loaded
  // and data is in. window.SA.load() re-points the renderers at the live deck.
  useEffect(() => {
    if (!engineReady || typeof window === "undefined" || !window.SA) return;
    const opts = { theme, size: "portrait" as const };
    if (deck) {
      window.SA.load({ agents: deck.agents });
      setLeaderboardHtml(window.SA.renderLeaderboardCard(opts));
    }
    setUpcomingHtml(
      upcomingGames.map((g) => ({
        html: window.SA.renderMatchCard(g, opts),
        label: `${g.home.name} vs ${g.away.name}`,
        slug: `preview-${(g.home.code ?? "").toLowerCase()}-${(g.away.code ?? "").toLowerCase()}`,
      })),
    );
    setConsensusHtml(
      consensusRecords.map((r) => ({
        html: window.SA.renderMatchConsensusCard(r, { ...opts, betStyle: "question" }),
        label: `${r.game} · ${r.marketType}`,
        slug: `consensus-${r.marketType}-${String(r.home).toLowerCase()}-${String(r.away).toLowerCase()}`,
      })),
    );
  }, [engineReady, deck, upcomingGames, consensusRecords, theme]);

  return (
    <SwarmCardsShell activeKey="swarm-history" tag="Live Cards" theme={theme}>
      <style>{GALLERY_CSS}</style>
      {/* Vanilla engine + its stylesheets, for the Leaderboard + Upcoming cards
          only. The React model card is self-contained Tailwind and ignores these. */}
      <link rel="stylesheet" href="/swarm-arena-cards/colors_and_type.css" />
      <link rel="stylesheet" href="/swarm-arena-cards/card-styles.css" />
      <Script
        src="/swarm-arena-cards/card-engine.js"
        strategy="afterInteractive"
        onReady={() => {
          // Off-directory host: point the engine at the absolute asset base so
          // its <img>/wordmark paths resolve (default is relative "assets/").
          window.__resources = {
            assetBase: ASSET_BASE,
            nickWhite: `${ASSET_BASE}/NickAI-wordmark-white.svg`,
            nickDark: `${ASSET_BASE}/NickAI-wordmark-dark.svg`,
          };
          setEngineReady(true);
        }}
      />

      <main className="sah-main" data-theme={theme}>
        <div className="sah-controls">
          <span className="blurb">
            Rendered live in your browser from the R2 agent output — no stored PNGs.
            Agent cards use the Swarm Arena model design; the leaderboard and
            upcoming previews use the classic engine.
          </span>
          <button type="button" onClick={() => { loadDeck(); loadUpcoming(); loadConsensus(); }}>
            Refresh
          </button>
          <label>
            Timeline:
            <select value={when} onChange={(e) => setWhen(e.target.value)}>
              <option value="">Live (now)</option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label>
            Theme:
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value === "light" ? "light" : "dark")}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </label>
          <span className="sah-status">{status}</span>
        </div>

        <div className="sah-sechead">
          <h2>Upcoming games</h2>
          <span className="sah-status">{upStatus}</span>
        </div>
        {upcomingHtml.length === 0 ? (
          <div className="sah-empty">
            {engineReady ? "No upcoming fixtures right now." : "Loading engine…"}
          </div>
        ) : (
          <div className="sah-grid">
            {upcomingHtml.map((c, i) => (
              <div className="sah-cell" key={i}>
                <div className="sah-thumb">
                  <div
                    className="sah-thumb-inner"
                    dangerouslySetInnerHTML={{ __html: c.html }}
                  />
                </div>
                <div className="sah-cap">
                  <span>{c.label}</span>
                  <button
                    type="button"
                    className="sah-dl"
                    onClick={(e) => downloadCard(c.html, c.slug, e.currentTarget)}
                  >
                    ↓ PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sah-sechead">
          <h2>Market vs Agents</h2>
          <span className="sah-status">{consStatus}</span>
        </div>
        {consensusHtml.length === 0 ? (
          <div className="sah-empty">
            {engineReady ? "No consensus markets right now." : "Loading engine…"}
          </div>
        ) : (
          <div className="sah-grid">
            {consensusHtml.map((c, i) => (
              <div className="sah-cell" key={i}>
                <div className="sah-thumb">
                  <div className="sah-thumb-inner" dangerouslySetInnerHTML={{ __html: c.html }} />
                </div>
                <div className="sah-cap">
                  <span>{c.label}</span>
                  <button
                    type="button"
                    className="sah-dl"
                    onClick={(e) => downloadCard(c.html, c.slug, e.currentTarget)}
                  >
                    ↓ PNG
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="sah-sechead">
          <h2>Agent cards</h2>
        </div>
        {!deck ? (
          <div className="sah-empty">{status}</div>
        ) : (
          <div className="sah-grid">
            {/* Leaderboard — vanilla engine (no React design yet) */}
            {leaderboardHtml ? (
              <div className="sah-cell">
                <div className="sah-thumb">
                  <div
                    className="sah-thumb-inner"
                    dangerouslySetInnerHTML={{ __html: leaderboardHtml }}
                  />
                </div>
                <div className="sah-cap">Leaderboard</div>
              </div>
            ) : null}
            {/* Agent cards — React design source of truth */}
            {deck.agents.map((a, i) => (
              <div className="sah-cell" key={a.handle}>
                <div className="sah-thumb">
                  <div className="sah-thumb-inner">
                    <SwarmArenaModelCard data={toCardData(a, i + 1, deck.agents.length)} />
                  </div>
                </div>
                <div className="sah-cap">{a.label ?? a.short ?? a.handle}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </SwarmCardsShell>
  );
}

/** Minimal shape of an /api/swarm-upcoming fixture (passed straight to the engine). */
type Game = {
  kickoffISO: string;
  home: { code?: string; name: string };
  away: { code?: string; name: string };
  [k: string]: unknown;
};
