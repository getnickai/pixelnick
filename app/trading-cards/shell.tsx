"use client";

/**
 * Full-bleed shell for the Trading Cards Next.js pages (kit + history).
 *
 * The root layout mounts the app sidebar around every route; these pages are
 * standalone full-page surfaces (matching the static Swarm Arena kit pages), so
 * the shell hides the sidebar chrome and paints its own NickAI-blue shell with
 * the shared cross-kit top nav. Mirrors the look of the retired static
 * `public/trading-cards/*.html` pages, now rendered live.
 */
import type { ReactNode } from "react";

type ActiveKey = "trading-kit" | "trading-history";

/** Palette + chrome CSS, shared by both trading pages. */
const SHELL_CSS = `
  /* hide the app sidebar — these are standalone full-page surfaces */
  [data-slot="sidebar"],[data-slot="sidebar-container"],[data-slot="sidebar-rail"],[data-slot="sidebar-trigger"],[data-slot="sidebar-gap"]{display:none !important}

  .tc-root{
    --bg:#000510; --bg-panel:#0a1020; --bg-panel-2:#111a30; --text:#f4f6fb; --text-dim:#aeb6c8;
    --text-faint:#6b7589; --brand:#0178ff; --border:rgba(255,255,255,0.08); --border-solid:#1b2540;
    --glow:rgba(1,120,255,0.22);
    --font-body:"Manrope",ui-sans-serif,system-ui,-apple-system,sans-serif;
    --font-mono:ui-monospace,"SF Mono","Geist Mono","Fira Code",Menlo,monospace;
    position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;
    background:var(--bg);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased;overflow:hidden;
  }
  .tc-root *{box-sizing:border-box}
  .tc-shell-glow{position:fixed;top:-30%;right:-18%;width:60vw;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--glow) 0%,transparent 62%);filter:blur(3px);pointer-events:none;z-index:0;opacity:0.6}
  .tc-root header{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 28px;border-bottom:1px solid var(--border);flex-wrap:wrap}
  .tc-brand{display:flex;align-items:center;gap:11px}
  .tc-brand .mk{width:30px;height:30px;display:grid;place-items:center;border-radius:8px;background:color-mix(in srgb,var(--brand) 18%,transparent);color:var(--brand);font-family:var(--font-mono);font-weight:800;font-size:15px}
  .tc-brand .wm{font-family:var(--font-mono);font-weight:700;font-size:18px;letter-spacing:0.13em;text-transform:uppercase}
  .tc-brand .wm b{color:var(--brand)}
  .tc-brand .tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-faint);margin-left:6px;padding-left:12px;border-left:1px solid var(--border)}
  .tc-topnav{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
  .tc-navgrp{display:flex;align-items:center;gap:8px}
  .tc-navgrp .navlbl{font-family:var(--font-mono);font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-faint)}
  .tc-navgrp a{font-family:var(--font-mono);font-size:11.5px;font-weight:600;letter-spacing:0.04em;text-decoration:none;color:var(--text-dim);padding:5px 9px;border-radius:6px;border:1px solid transparent;transition:all .15s ease}
  .tc-navgrp a:hover{color:var(--text);background:var(--bg-panel)}
  .tc-navgrp a.active{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 45%,transparent);background:color-mix(in srgb,var(--brand) 14%,transparent)}
  .tc-topnav .sep{width:1px;height:14px;background:var(--border)}
`;

export function TradingCardsShell({
  activeKey,
  tag,
  children,
}: {
  activeKey: ActiveKey;
  tag: string;
  children: ReactNode;
}) {
  const link = (href: string, key: ActiveKey, label: string) => (
    <a href={href} className={key === activeKey ? "active" : undefined}>
      {label}
    </a>
  );

  return (
    <div className="tc-root">
      <style>{SHELL_CSS}</style>
      <div className="tc-shell-glow" />
      <header>
        <div className="tc-brand">
          <span className="mk">N</span>
          <span className="wm">
            NICK<b>AI</b>
          </span>
          <span className="tag">{tag}</span>
        </div>
        <nav className="tc-topnav">
          <div className="tc-navgrp">
            <span className="navlbl">Swarm Arena</span>
            <a href="/swarm-arena-cards/index.html">Kit</a>
            <a href="/engine/swarm-arena-history">History</a>
          </div>
          <span className="sep" />
          <div className="tc-navgrp">
            <span className="navlbl">Trading Cards</span>
            {link("/trading-cards", "trading-kit", "Kit")}
            {link("/trading-cards/history", "trading-history", "History")}
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
