"use client";

/**
 * Full-bleed shell for the Swarm Arena Next.js pages.
 *
 * The root layout mounts the app sidebar around every route; the swarm gallery
 * is a standalone full-page surface (matching the retired static
 * `public/swarm-arena-cards/*.html` pages), so the shell hides the sidebar
 * chrome and paints its own warm near-black shell with the shared cross-kit top
 * nav (palette mirrors `colors_and_type.css`).
 */
import type { ReactNode } from "react";

type ActiveKey = "swarm-kit" | "swarm-history";

const SHELL_CSS = `
  /* hide the app sidebar — this is a standalone full-page surface */
  [data-slot="sidebar"],[data-slot="sidebar-container"],[data-slot="sidebar-rail"],[data-slot="sidebar-trigger"],[data-slot="sidebar-gap"]{display:none !important}

  .sah-root{
    --bg:#15140F; --bg-panel:#1C1B16; --bg-panel-2:#26241D; --text:#d8d0c0; --text-dim:#908878;
    --text-faint:#7e7568; --brand:#e08060; --border:#2E2C26; --border-solid:#3C3A34;
    --glow:rgba(224,128,96,0.55);
    --font-body:"Geist",ui-sans-serif,system-ui,-apple-system,sans-serif;
    --font-mono:"Fira Code","JetBrains Mono",ui-monospace,Menlo,monospace;
    position:fixed;inset:0;z-index:50;display:flex;flex-direction:column;
    background:var(--bg);color:var(--text);font-family:var(--font-body);-webkit-font-smoothing:antialiased;overflow:hidden;
  }
  /* Light theme — mirrors colors_and_type.css light tokens so the page chrome
     switches with the vanilla cards. (The React model cards stay fixed-dark.) */
  .sah-root[data-theme="light"]{
    --bg:#e6dac4; --bg-panel:#efe5d2; --bg-panel-2:#d8ccb6; --text:#282418; --text-dim:#4f4836;
    --text-faint:#6f6450; --brand:#b84c30; --border:#c8bda7; --border-solid:#b0a594;
    --glow:rgba(184,76,48,0.34);
  }
  .sah-root *{box-sizing:border-box}
  .sah-shell-glow{position:fixed;top:-30%;right:-18%;width:60vw;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,var(--glow) 0%,transparent 62%);filter:blur(3px);pointer-events:none;z-index:0;opacity:0.5}
  .sah-root header{position:relative;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 28px;border-bottom:1px solid var(--border);flex-wrap:wrap}
  .sah-brand{display:flex;align-items:center;gap:11px}
  .sah-brand .mk{width:30px;height:30px;background-color:var(--brand);-webkit-mask:url(/swarm-arena-cards/assets/logos/swarm-arena-mono.svg) center/contain no-repeat;mask:url(/swarm-arena-cards/assets/logos/swarm-arena-mono.svg) center/contain no-repeat}
  .sah-brand .wm{font-family:var(--font-mono);font-weight:700;font-size:18px;letter-spacing:0.13em;text-transform:uppercase}
  .sah-brand .wm b{color:var(--brand)}
  .sah-brand .tag{font-family:var(--font-mono);font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:var(--text-faint);margin-left:6px;padding-left:12px;border-left:1px solid var(--border)}
  .sah-topnav{display:flex;align-items:center;gap:22px;flex-wrap:wrap}
  .sah-navgrp{display:flex;align-items:center;gap:8px}
  .sah-navgrp .navlbl{font-family:var(--font-mono);font-size:9.5px;letter-spacing:0.18em;text-transform:uppercase;color:var(--text-faint)}
  .sah-navgrp a{font-family:var(--font-mono);font-size:11.5px;font-weight:600;letter-spacing:0.04em;text-decoration:none;color:var(--text-dim);padding:5px 9px;border-radius:6px;border:1px solid transparent;transition:all .15s ease}
  .sah-navgrp a:hover{color:var(--text);background:var(--bg-panel)}
  .sah-navgrp a.active{color:var(--brand);border-color:color-mix(in srgb,var(--brand) 45%,transparent);background:color-mix(in srgb,var(--brand) 14%,transparent)}
  .sah-topnav .sep{width:1px;height:14px;background:var(--border)}
`;

export function SwarmCardsShell({
  activeKey,
  tag,
  theme = "dark",
  children,
}: {
  activeKey: ActiveKey;
  tag: string;
  theme?: "dark" | "light";
  children: ReactNode;
}) {
  const link = (href: string, key: ActiveKey, label: string) => (
    <a href={href} className={key === activeKey ? "active" : undefined}>
      {label}
    </a>
  );

  return (
    <div className="sah-root" data-theme={theme}>
      <style>{SHELL_CSS}</style>
      <div className="sah-shell-glow" />
      <header>
        <div className="sah-brand">
          <span className="mk" />
          <span className="wm">
            SWARM<b>ARENA</b>
          </span>
          <span className="tag">{tag}</span>
        </div>
        <nav className="sah-topnav">
          <div className="sah-navgrp">
            <span className="navlbl">Swarm Arena</span>
            {link("/swarm-arena-cards/index.html", "swarm-kit", "Kit")}
            {link("/swarm-arena/history", "swarm-history", "History")}
          </div>
          <span className="sep" />
          <div className="sah-navgrp">
            <span className="navlbl">Trading Cards</span>
            <a href="/trading-cards">Kit</a>
            <a href="/trading-cards/history">History</a>
          </div>
        </nav>
      </header>
      {children}
    </div>
  );
}
