/* eslint-disable @next/next/no-img-element */
/**
 * Screen components for the Nick launch video. Each screen is a settled 16:9
 * still; the animated composition interpolates between these same layouts.
 * Inline-styled so stills render identically headless.
 */
import { AbsoluteFill, staticFile } from "remotion";
import { ArrowRight, ArrowUp, ChevronDown, Download, Loader2, Maximize2, Play, Plus, Sparkles, Square, Trash2, X } from "lucide-react";
import { fitCamera, focusCamera, WorkflowGraph, type RunStatus } from "./graph";
import { NVIDIA_CARD, PORTFOLIO_CARD, PriceCardMock, PortfolioCardMock, SPACEX_CARD } from "./cards";
import { topoOrder } from "../workflow-template-card/layout";
import { getGlyph } from "../workflow-template-card/node-glyphs";
import {
  CTA_LINE,
  CTA_URL,
  INTRO_TITLE,
  LAUNCH_WORKFLOWS,
  NICK_LAUNCH_H,
  NICK_LAUNCH_W,
  TAGLINE,
  type LaunchScreen,
} from "./props";

const BG = "#070b14";
const SANS = "var(--font-manrope), ui-sans-serif, system-ui, sans-serif";
const BLUE = "#0178FF";

/* Workflow canvas geometry (shared by wide + zoom screens). */
const CANVAS_W = 2600;
const CANVAS_H = 1200;
const WF_VW = 1720;
const WF_VH = 660;
const WF_TOP = 140;

/* ── Shared chrome ────────────────────────────────────────────────────────── */

function Background() {
  return (
    <>
      <AbsoluteFill style={{ backgroundColor: BG }} />
      <img
        alt=""
        src={staticFile("figma/background-glow.svg")}
        style={{ position: "absolute", top: "-18%", left: "50%", transform: "translateX(-50%)", width: "120%", opacity: 0.6 }}
      />
    </>
  );
}

/** NickAI mark (the exact blue mark from getnick.ai / nicksitev2). */
function NickMark({ size = 40 }: { size?: number }) {
  return <img alt="" src={staticFile("nick/nick-mark.svg")} style={{ height: size, width: size, display: "block" }} />;
}

/** Full lockup: mark + "NickAI" wordmark. width:auto everywhere so it never stretches. */
function NickLogo({ height = 44 }: { height?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: Math.round(height * 0.26) }}>
      <NickMark size={height} />
      <span style={{ fontFamily: SANS, fontWeight: 700, fontSize: Math.round(height * 0.82), letterSpacing: "-0.02em", color: "#fff", lineHeight: 1 }}>NickAI</span>
    </div>
  );
}

function Logo({ top = 54, left = 80, height = 44 }: { top?: number; left?: number; height?: number }) {
  return (
    <div style={{ position: "absolute", top, left }}>
      <NickLogo height={height} />
    </div>
  );
}

function FloatingNodes() {
  const types = ["start", "llm", "price-data", "function", "conditional", "portfolio", "email-notification", "polymarket", "coinglass", "telegram-notification", "stocks-data", "storage"];
  const spots = [[180, 260], [520, 160], [1400, 210], [1720, 340], [300, 720], [760, 850], [1180, 780], [1600, 820], [120, 520], [1820, 620], [980, 200], [640, 480]];
  return (
    <>
      {spots.map(([x, y], i) => {
        const g = getGlyph(types[i % types.length]);
        const Icon = g.Icon;
        return (
          <div key={i} style={{ position: "absolute", left: x, top: y, width: 84, height: 84, borderRadius: 20, border: `2px solid ${g.border}`, backgroundColor: "#0f1420", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0.16 }}>
            <Icon size={40} color={g.icon} strokeWidth={2.2} />
          </div>
        );
      })}
    </>
  );
}

function ChatBox({ prompt, caret = false, cx, cy, width = 1160 }: { prompt: string; caret?: boolean; cx: number; cy: number; width?: number }) {
  const H = 84;
  return (
    <div style={{ position: "absolute", left: cx - width / 2, top: cy - H / 2, width, height: H, borderRadius: 22, border: "1.5px solid rgba(1,120,255,0.75)", backgroundColor: "rgba(6,10,16,0.92)", boxShadow: "0 0 0 3px rgba(1,120,255,0.08), 0 34px 90px -34px rgba(1,120,255,0.45)", display: "flex", alignItems: "center", padding: "0 20px", gap: 18, fontFamily: SANS }}>
      <Plus size={30} color="#c7ccd6" strokeWidth={2.2} />
      <div style={{ flex: 1, minWidth: 0, fontSize: 32, color: "#fff", whiteSpace: "nowrap", overflow: "hidden" }}>
        {prompt}
        {caret ? <span style={{ color: BLUE }}>▍</span> : null}
      </div>
      <span style={{ fontSize: 26, fontWeight: 600, color: "#e6e8ec" }}>Nick</span>
      <div style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ArrowUp size={28} color="#fff" strokeWidth={2.6} />
      </div>
    </div>
  );
}

/* ── Intro / value prop ───────────────────────────────────────────────────── */

function IntroScreen({ title }: { title: string }) {
  return (
    <>
      <Background />
      <FloatingNodes />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 108, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>{title}</div>
      </AbsoluteFill>
    </>
  );
}

function ValuePropScreen() {
  return (
    <>
      <Background />
      <FloatingNodes />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: SANS }}>
          <div style={{ fontSize: 116, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Nick trades <span style={{ color: BLUE }}>anything</span>.
          </div>
          <div style={{ marginTop: 24, fontSize: 40, fontWeight: 500, color: "#9aa3b2" }}>Crypto, stocks, prediction markets. One agent.</div>
        </div>
      </AbsoluteFill>
    </>
  );
}

function PromptScreen() {
  return (
    <>
      <Background />
      <Logo />
      <ChatBox prompt={LAUNCH_WORKFLOWS[0].prompt} caret cx={NICK_LAUNCH_W / 2} cy={540} />
    </>
  );
}

/* ── Workflow (wide + zoom) ───────────────────────────────────────────────── */

function WorkflowWide({ index }: { index: number }) {
  const w = LAUNCH_WORKFLOWS[index];
  return (
    <>
      <Background />
      <Logo />
      <div style={{ position: "absolute", left: (NICK_LAUNCH_W - WF_VW) / 2, top: WF_TOP }}>
        <WorkflowGraph template={w.template} vw={WF_VW} vh={WF_VH} cw={CANVAS_W} ch={CANVAS_H} camera={fitCamera(WF_VW, WF_VH, CANVAS_W, CANVAS_H)} />
      </div>
      <div style={{ position: "absolute", top: WF_TOP + WF_VH + 10, width: "100%", textAlign: "center", fontFamily: SANS }}>
        <div style={{ fontSize: 34, fontWeight: 600, color: "#fff" }}>{w.template.name}</div>
        <div style={{ marginTop: 6, fontSize: 24, color: "#7d8697" }}>{w.template.nodes.length} nodes, ready to run</div>
      </div>
      <ChatBox prompt={w.prompt} cx={NICK_LAUNCH_W / 2} cy={975} />
    </>
  );
}

function WorkflowZoom({ index }: { index: number }) {
  const w = LAUNCH_WORKFLOWS[index];
  // Open tight on the first node (its neighbours fall in frame around it); the
  // build animation then pulls the camera back to the full graph.
  const first = topoOrder(w.template.nodes, w.template.edges).slice(0, 1);
  return (
    <>
      <Background />
      <Logo />
      <div style={{ position: "absolute", left: (NICK_LAUNCH_W - WF_VW) / 2, top: WF_TOP }}>
        <WorkflowGraph template={w.template} vw={WF_VW} vh={WF_VH} cw={CANVAS_W} ch={CANVAS_H} camera={focusCamera(w.template, CANVAS_W, CANVAS_H, first, 1.5)} />
      </div>
      <div style={{ position: "absolute", top: WF_TOP + WF_VH + 10, width: "100%", textAlign: "center", fontFamily: SANS }}>
        <div style={{ fontSize: 30, fontWeight: 600, color: "#9aa3b2" }}>Nick is building your workflow…</div>
      </div>
      <ChatBox prompt={w.prompt} cx={NICK_LAUNCH_W / 2} cy={975} />
    </>
  );
}

/* ── 3-up grid ────────────────────────────────────────────────────────────── */

export function GridScreen() {
  const cardW = 556;
  const cardH = 470;
  const gap = 44;
  const totalW = cardW * 3 + gap * 2;
  const startX = (NICK_LAUNCH_W - totalW) / 2;
  const top = 150;
  return (
    <>
      <Background />
      <Logo />
      {LAUNCH_WORKFLOWS.map((w, i) => (
        <div key={i} style={{ position: "absolute", left: startX + i * (cardW + gap), top, width: cardW, height: cardH, borderRadius: 28, border: "1px solid rgba(255,255,255,0.09)", backgroundColor: "rgba(11,16,26,0.85)", boxShadow: "0 40px 90px -40px rgba(0,0,0,0.8)", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 8, bottom: 88 }}>
            <WorkflowGraph template={w.template} vw={cardW - 16} vh={cardH - 96} cw={CANVAS_W} ch={CANVAS_H} camera={fitCamera(cardW - 16, cardH - 96, CANVAS_W, CANVAS_H)} />
          </div>
          <div style={{ position: "absolute", bottom: 22, left: 28, right: 28, fontFamily: SANS, fontSize: 26, fontWeight: 600, color: "#fff" }}>{w.template.name}</div>
        </div>
      ))}
      <div style={{ position: "absolute", top: top + cardH + 78, width: "100%", textAlign: "center", fontFamily: SANS, fontSize: 46, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{TAGLINE}</div>
    </>
  );
}

/* ── Product UX (chat left + workspace right) ─────────────────────────────── */

const APP_BG = "#0a0d12";
const PANEL = "#0c1017";
const LINE = "rgba(255,255,255,0.08)";
const MONO = 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';

type LogRow = { t: string; nid: string; msg: string; kind?: "check" | "coin" };
const LOG_ROWS: LogRow[] = [
  { t: "16:01:25", nid: "nde_bh99uplfh…", msg: "Charged 2.18 credits [openai/gpt-5.6-terra], Balance: 6235.08", kind: "coin" },
  { t: "16:01:25", nid: "nde_bh99uplfh…", msg: "Structured output parsed and validated successfully", kind: "check" },
  { t: "16:01:25", nid: "nde_bh99uplfh…", msg: "Node completed successfully" },
  { t: "16:01:25", nid: "nde_bh99uplfh…", msg: "Scoring Engine completed" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Received response from anthropic (model: anthropic/claude-opus-4.8)" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Response length: 812 characters" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Tokens [anthropic/claude-opus-4.8]: 5161 in, 333 out, 5494 total" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Cost [anthropic/claude-opus-4.8]: $0.034130" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Charged 5.12 credits [anthropic/claude-opus-4.8], Balance: 6229.96", kind: "coin" },
  { t: "16:01:29", nid: "nde_356olu32v…", msg: "Ranked 7 tickers, rotating into NVDA + MSFT" },
  { t: "16:01:30", nid: "nde_9fk21mzx8…", msg: "Prepared 2 orders, submitting to Alpaca (paper)" },
  { t: "16:01:30", nid: "nde_9fk21mzx8…", msg: "Node completed successfully" },
  { t: "16:01:30", nid: "nde_a71xqp04d…", msg: "Telegram recap sent", kind: "check" },
];

function LogLine({ row }: { row: LogRow }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16, height: 27, fontFamily: MONO, fontSize: 14, whiteSpace: "nowrap" }}>
      <span style={{ color: "#5b6472", width: 66, flexShrink: 0 }}>{row.t}</span>
      <span style={{ color: "#38bdf8", fontWeight: 700, fontSize: 11, width: 40, flexShrink: 0 }}>INFO</span>
      <span style={{ color: "#6a7180", width: 132, flexShrink: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{row.nid}</span>
      <span style={{ color: "#c3c9d4", overflow: "hidden", textOverflow: "ellipsis" }}>
        {row.kind === "check" ? "✅ " : row.kind === "coin" ? "🪙 " : ""}
        {row.msg}
      </span>
    </div>
  );
}

/** Bottom "Execution Logs" panel — streams INFO rows as the agent runs. */
function ExecutionLogs({ height, count = 105 }: { height: number; count?: number }) {
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height, backgroundColor: "#080b10", borderTop: `1px solid ${LINE}`, display: "flex", flexDirection: "column", fontFamily: SANS }}>
      {/* header */}
      <div style={{ height: 46, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", borderBottom: `1px solid ${LINE}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "#6a7180", fontFamily: MONO, fontWeight: 700 }}>❯_</span>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>Execution Logs</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, backgroundColor: "rgba(1,120,255,0.14)", color: BLUE, fontWeight: 600, fontSize: 13, padding: "3px 10px", borderRadius: 999 }}>
            <Loader2 size={12} /> Running
          </span>
          <span style={{ color: "#6a7180", fontFamily: MONO, fontSize: 13 }}>{count}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, color: "#6a7180" }}>
          <span style={{ fontSize: 13 }}>Auto-scroll: <span style={{ color: "#1fc16b", fontWeight: 600 }}>ON</span></span>
          <Download size={16} />
          <Trash2 size={16} />
          <X size={16} />
        </div>
      </div>
      {/* rows */}
      <div style={{ flex: 1, overflow: "hidden", padding: "10px 24px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
        {LOG_ROWS.map((r, i) => (
          <LogLine key={i} row={r} />
        ))}
      </div>
    </div>
  );
}

export function ProductScreen({ running = false, logs = false }: { running?: boolean; logs?: boolean } = {}) {
  const w = LAUNCH_WORKFLOWS[2]; // 3rd workflow, expanded into the builder
  const railW = 68;
  const chatW = 700;
  const chatX = railW;
  const wsX = railW + chatW;
  const wsW = NICK_LAUNCH_W - wsX;
  const canvasTop = 120;
  const canvasBottom = 72;
  const canvasH = NICK_LAUNCH_H - canvasTop - canvasBottom;
  const logsH = 420;

  // Running state: most nodes completed (green), a few mid-graph still running (blue).
  let statusById: Record<string, RunStatus> | undefined;
  if (running) {
    const order = topoOrder(w.template.nodes, w.template.edges);
    const doneCut = Math.floor(order.length * 0.6);
    statusById = {};
    order.forEach((id, i) => {
      if (i < doneCut) statusById![id] = "completed";
      else if (i < doneCut + 3) statusById![id] = "running";
    });
  }

  return (
    <>
      <AbsoluteFill style={{ backgroundColor: APP_BG, fontFamily: SANS }} />

      {/* far-left rail */}
      <div style={{ position: "absolute", left: 0, top: 0, width: railW, height: NICK_LAUNCH_H, borderRight: `1px solid ${LINE}`, display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 24, gap: 26 }}>
        <NickMark size={30} />
        {["squares", "book", "gear", "flow"].map((k) => (
          <div key={k} style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)" }} />
        ))}
      </div>

      {/* ── CHAT PANEL ── */}
      <div style={{ position: "absolute", left: chatX, top: 0, width: chatW, height: NICK_LAUNCH_H, borderRight: `1px solid ${LINE}` }}>
        {/* header */}
        <div style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontSize: 19, fontWeight: 600 }}>
            Cross-asset portfolio <ChevronDown size={18} color="#7d8697" />
          </div>
          <Maximize2 size={18} color="#7d8697" />
        </div>
        {/* messages */}
        <div style={{ position: "absolute", top: 68, left: 0, right: 0, bottom: 176, padding: "24px 28px", display: "flex", flexDirection: "column", gap: 16, overflow: "hidden" }}>
          <div style={{ color: "#c7ccd6", fontSize: 16, lineHeight: 1.5 }}>
            Here's your book right now. SpaceX and NVDA are your two biggest movers today.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <PriceCardMock data={SPACEX_CARD} width={314} />
            <PriceCardMock data={NVIDIA_CARD} width={314} />
          </div>
          <PortfolioCardMock data={PORTFOLIO_CARD} width={644} />
        </div>
        {/* input */}
        <div style={{ position: "absolute", left: 24, right: 24, bottom: 28, borderRadius: 20, border: `1.5px solid ${BLUE}`, backgroundColor: "#0e131b", padding: 16, boxShadow: "0 0 0 3px rgba(1,120,255,0.08)" }}>
          <div style={{ color: "#6a7180", fontSize: 17, marginBottom: 16 }}>Ask Nick a question or give it any task</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, color: "#9aa3b2", fontSize: 14 }}>
              <Plus size={20} color="#9aa3b2" />
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}>Grok 4.5 <ChevronDown size={14} /></span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><Sparkles size={13} /> Low <ChevronDown size={14} /></span>
            </div>
            <div style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: BLUE, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowUp size={20} color="#fff" strokeWidth={2.6} />
            </div>
          </div>
        </div>
      </div>

      {/* ── WORKSPACE PANEL ── */}
      <div style={{ position: "absolute", left: wsX, top: 0, width: wsW, height: NICK_LAUNCH_H, backgroundColor: PANEL }}>
        {/* header */}
        <div style={{ height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", borderBottom: `1px solid ${LINE}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#fff", fontSize: 19, fontWeight: 600 }}>
            {w.template.name}
            <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#9aa3b2", fontSize: 14, fontWeight: 500 }}>
              <span style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: "#2b7fff", fontSize: 10, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>BB</span>
              Badi Badkoube
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1fc16b", color: "#04140a", fontWeight: 700, fontSize: 14, padding: "8px 14px", borderRadius: 10 }}>
            <Play size={14} fill="#04140a" /> Run Now
          </div>
        </div>
        {/* tabs */}
        <div style={{ height: 52, display: "flex", alignItems: "center", gap: 26, padding: "0 28px", borderBottom: `1px solid ${LINE}`, color: "#7d8697", fontSize: 15 }}>
          <span>Overview</span>
          <span>Executions</span>
          <span>Portfolio</span>
          <span style={{ display: "flex", alignItems: "center", gap: 7, color: BLUE, fontWeight: 600, backgroundColor: "rgba(1,120,255,0.12)", padding: "6px 12px", borderRadius: 8 }}>
            <Sparkles size={14} /> Workflow
          </span>
        </div>
        {/* canvas */}
        <div
          style={{
            position: "absolute",
            top: canvasTop,
            left: 0,
            width: wsW,
            bottom: canvasBottom,
            backgroundColor: "#080b10",
            backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1.4px, transparent 1.4px)",
            backgroundSize: "34px 34px",
            overflow: "hidden",
          }}
        >
          <WorkflowGraph template={w.template} vw={wsW} vh={canvasH} cw={CANVAS_W} ch={CANVAS_H} camera={fitCamera(wsW, canvasH, CANVAS_W, CANVAS_H, 0.82)} statusById={statusById} />
          {running ? (
            <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 8, backgroundColor: "rgba(1,120,255,0.14)", border: `1px solid ${BLUE}`, color: BLUE, fontWeight: 600, fontSize: 15, padding: "8px 18px", borderRadius: 999 }}>
              <Loader2 size={15} /> Running
            </div>
          ) : null}
        </div>
        {/* bottom toolbar (floats above the logs panel when open) */}
        <div style={{ position: "absolute", bottom: logs ? logsH + 16 : 18, left: 28, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ color: "#7d8697", fontSize: 13 }}>{running ? "Saving…" : "Saved just now"}</span>
        </div>
        <div style={{ position: "absolute", bottom: logs ? logsH + 14 : 18, right: 28, display: "flex", alignItems: "center", gap: 10 }}>
          {running ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1fc16b", color: "#04140a", fontWeight: 700, fontSize: 14, padding: "9px 16px", borderRadius: 10 }}>
              <Square size={13} fill="#04140a" /> Stop
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1fc16b", color: "#04140a", fontWeight: 700, fontSize: 14, padding: "9px 16px", borderRadius: 10 }}>
              <Play size={14} fill="#04140a" /> Execute
            </div>
          )}
        </div>
        {logs ? <ExecutionLogs height={logsH} /> : null}
      </div>
    </>
  );
}

/** Camera-zoom wrapper for a still: scales content about an origin, clips to frame. */
function ZoomInto({ ox, oy, scale, children }: { ox: string; oy: string; scale: number; children: React.ReactNode }) {
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div style={{ width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: `${ox} ${oy}` }}>{children}</div>
    </AbsoluteFill>
  );
}

/* ── CTA ──────────────────────────────────────────────────────────────────── */

function CtaScreen() {
  return (
    <>
      <Background />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", fontFamily: SANS }}>
          <div style={{ marginBottom: 56 }}>
            <NickLogo height={104} />
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 44 }}>Trade anything with Nick</div>
          {/* Blue CTA button — matches the library template cards */}
          <div style={{ display: "flex", alignItems: "center", gap: 20, backgroundColor: BLUE, borderRadius: 999, padding: "20px 24px 20px 40px", boxShadow: "0 30px 70px -24px rgba(1,120,255,0.6)" }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#fff" }}>{CTA_LINE}</span>
            <div style={{ width: 60, height: 60, borderRadius: 999, backgroundColor: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowRight size={30} color={BLUE} strokeWidth={2.6} />
            </div>
          </div>
          <div style={{ marginTop: 32, fontSize: 40, fontWeight: 600, color: BLUE }}>{CTA_URL}</div>
        </div>
      </AbsoluteFill>
    </>
  );
}

/* ── Switch ───────────────────────────────────────────────────────────────── */

export function LaunchStill({ screen }: { screen: LaunchScreen }) {
  switch (screen) {
    case "intro":
      return <IntroScreen title={INTRO_TITLE} />;
    case "valueprop":
      return <ValuePropScreen />;
    case "prompt":
      return <PromptScreen />;
    case "workflow-zoom":
      return <WorkflowZoom index={0} />;
    case "workflow-0":
      return <WorkflowWide index={0} />;
    case "workflow-1":
      return <WorkflowWide index={1} />;
    case "workflow-2":
      return <WorkflowWide index={2} />;
    case "grid":
      return <GridScreen />;
    case "product":
      return <ProductScreen />;
    case "execution":
      return <ProductScreen running logs />;
    case "execution-logs":
      return (
        <ZoomInto ox="74%" oy="86%" scale={1.7}>
          <ProductScreen running logs />
        </ZoomInto>
      );
    case "cta":
      return <CtaScreen />;
    default:
      return <IntroScreen title={INTRO_TITLE} />;
  }
}
