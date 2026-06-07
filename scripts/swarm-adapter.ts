/**
 * Swarm Arena adapter — reads the competition agents' R2 output and writes the
 * deck JSON the card kit consumes (`SA.load()` / Remotion `--deck=`).
 *
 * Per STA-388 the agents write under, one dir per agent:
 *   swarm-arena/agents/<agentId>/profile.json
 *   swarm-arena/agents/<agentId>/snapshot.json
 *   swarm-arena/agents/<agentId>/runs/<date>/<runId>.json
 *
 * Base prefix is overridable via SWARM_AGENTS_PREFIX (e.g. point at
 * `nickai/agents/` for the interim single-agent test before STA-388 lands).
 *
 * Field mapping is defensive: it prefers the STA-388 schema (profile.handle,
 * performance.*, open_positions[], closed_trades[]) and falls back to the
 * earlier shape (profitPercent, pnlUsd, runsTotal, runs[].positions[]) so it
 * works against either while the agent output migrates.
 *
 * Cosmetics (code/flag/colour) are owned by the consumer and keyed on `handle`
 * via the identity registry; the displayed name comes from the agent profile.
 *
 * Run: bun scripts/swarm-adapter.ts   → public/swarm-arena-cards/live-deck.json
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "./feed";
import { identityFor } from "../data/swarm-identity";

const BUCKET = "nickai-swarmarena-internal";
// STA-388 home. Override for the interim test (data not yet migrated).
const BASE = (process.env.SWARM_AGENTS_PREFIX ?? "swarm-arena/agents/").replace(/\/?$/, "/");
const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "live-deck.json");

const client = s3Client();
async function getJson<T>(key: string): Promise<T | null> {
  try {
    const res = await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch {
    return null;
  }
}

async function listKeys(prefix: string): Promise<{ key: string; mod: Date }[]> {
  const out: { key: string; mod: Date }[] = [];
  let token: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of page.Contents ?? []) {
      if (o.Key && o.LastModified) out.push({ key: o.Key, mod: o.LastModified });
    }
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);
const MARKET_LABEL: Record<string, string> = {
  totals: "Total goals",
  btts: "Both teams to score",
  moneyline: "Match winner",
};

/** Fixture for the pick column (short "v" form). */
function marketOf(p: any): string {
  return String(p.market ?? p.match ?? MARKET_LABEL[p.market_type] ?? "").replace(" vs ", " v ");
}
/** Selection only (no price) — the card shows the edge; price would squeeze the column. */
function sideOf(p: any): string {
  const sel = p.selection ?? p.direction ?? "";
  return p.market_type === "totals" && p.line != null ? `${cap(sel)} ${p.line}` : cap(String(sel));
}

/** Gather settled trades (STA-388 closed_trades) across run history + snapshot,
 *  deduped by market/selection/close-time, sorted oldest → newest. */
function collectClosedTrades(runs: any[], snap: any): any[] {
  const all = [...runs.flatMap((r) => r.closed_trades ?? []), ...(snap.closed_trades ?? [])];
  const seen = new Set<string>();
  const dedup: any[] = [];
  for (const t of all) {
    const key = `${t.market ?? ""}|${t.selection ?? ""}|${t.closed_iso ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(t);
  }
  return dedup.sort(
    (a, b) => new Date(a.closed_iso ?? 0).getTime() - new Date(b.closed_iso ?? 0).getTime(),
  );
}

/** "2h ago" / "3d ago" from an ISO timestamp. */
function relTime(iso?: string): string {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

/** Trailing same-result streak token, e.g. "W4" / "L3". Voids are ignored.
 *  Returns "—" when there is no settled win/loss, so the card shows an honest
 *  blank instead of the engine's ROI-derived fallback streak. */
function streakOf(closed: any[]): string {
  const wl = closed
    .map((t) => String(t.result ?? "").toLowerCase())
    .filter((r) => r === "win" || r === "loss");
  if (!wl.length) return "—";
  const last = wl[wl.length - 1];
  let n = 0;
  for (let i = wl.length - 1; i >= 0 && wl[i] === last; i--) n++;
  return `${last === "win" ? "W" : "L"}${n}`;
}

/** Map one agent (profile + snapshot + run history) to a card EngineAgent. */
function toEngineAgent(profile: any, snap: any, runs: any[]): any {
  const perf = snap.performance ?? {};
  const startCap = profile.starting_capital ?? perf.starting_capital ?? snap.bankrollRefUsd ?? 1000;
  const equity = perf.current_value ?? startCap + (snap.pnlUsd ?? 0);
  const roiPct = perf.roi_pct ?? snap.profitPercent ?? (startCap ? ((equity - startCap) / startCap) * 100 : 0);

  // Equity curve from run history (current_value per run), oldest → newest.
  const curve = runs.map((r) => r.performance?.current_value ?? startCap + (r.pnlUsd ?? 0));
  const spark = curve.length >= 1 ? [startCap, ...curve] : [startCap, equity];

  // Latest run's open positions (STA-388: open_positions; legacy: positions).
  const latest = runs.at(-1) ?? snap;
  const positions = [...(latest.open_positions ?? latest.positions ?? snap.open_positions ?? [])].sort(
    (a, b) => (b.edge_pp ?? 0) - (a.edge_pp ?? 0),
  );
  const top = positions[0];

  // Settled-trade history (STA-388 closed_trades), oldest → newest.
  const closed = collectClosedTrades(runs, snap);

  // Accuracy / record: prefer perf.wins/losses; else derive from closed_trades;
  // else fall back to a sharp-agreement proxy on open positions.
  const cWins = closed.filter((t) => String(t.result).toLowerCase() === "win").length;
  const cLosses = closed.filter((t) => String(t.result).toLowerCase() === "loss").length;
  const wins = perf.wins ?? (closed.length ? cWins : null);
  const losses = perf.losses ?? (closed.length ? cLosses : null);
  const pickPct =
    wins != null && losses != null && wins + losses > 0
      ? wins / (wins + losses)
      : positions.length
        ? positions.filter((p) => p.sharp_agreement === "sharp_supports_edge").length / positions.length
        : 0;
  const record = wins != null && losses != null ? `${wins}-${losses}` : undefined;

  // Last settled trade + current streak (drive the card's lastTrade + streak).
  const lastClosed = closed.at(-1);
  const lastTrade = lastClosed
    ? { pnl: Number((lastClosed.pnl_usd ?? 0).toFixed(2)), ago: relTime(lastClosed.closed_iso) }
    : undefined;
  const streak = streakOf(closed);

  const nextIso = perf.next_run_iso ?? snap.nextRunISO;
  const nextRun = (() => {
    if (!nextIso) return "—";
    const diffMin = Math.round((new Date(nextIso).getTime() - Date.now()) / 60000);
    if (diffMin <= 0) return "due";
    const h = Math.floor(diffMin / 60), m = diffMin % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  })();

  const handle = (profile.handle ?? "").toUpperCase() || deriveHandle(profile);
  const id = identityFor(handle);
  const name: string = profile.name ?? profile.agentName ?? handle;
  const builder = profile.builder?.name;
  const kindRaw = profile.kind ?? id?.kind ?? "llm";
  const kind = kindRaw === "individual" ? "llm" : kindRaw;

  return {
    handle,
    code: id?.code ?? handle.slice(0, 3),
    short: name.replace(/\s*\(.*\)\s*$/, ""),
    label: name,
    provider: [profile.model, builder].filter(Boolean).join(" · ") || id?.provider || "",
    flag: id?.flag ?? "⚽",
    color: id?.color ?? "#10a37f",
    kind,
    roiPct: Number(roiPct.toFixed(2)),
    pickPct: Number(pickPct.toFixed(2)),
    signals: perf.run_count ?? snap.tradesTotal ?? snap.runsTotal ?? positions.length,
    nextRun,
    activeSince: fmtDate(profile.active_since ?? profile.activeSinceISO),
    spark,
    ...(record ? { record } : {}),
    pick: top
      ? { market: marketOf(top), side: sideOf(top), edgePp: Number((top.edge_pp ?? 0).toFixed(1)) }
      : { market: "No open picks", side: "—", edgePp: 0 },
    recent: positions.slice(0, 3).map((p) => ({
      market: marketOf(p),
      side: sideOf(p),
      pnl: Number((p.mtm_pnl_usd ?? p.pnl_usd ?? 0).toFixed(2)),
    })),
    ...(lastTrade ? { lastTrade } : {}),
    streak,
  };
}

function deriveHandle(profile: any): string {
  const m = String(profile.model ?? profile.agentName ?? "AGENT").toUpperCase();
  if (m.includes("GPT")) return "GPT";
  if (m.includes("CLAUDE")) return "CLAUDE";
  if (m.includes("GEMINI")) return "GEMINI";
  if (m.includes("GROK")) return "GROK";
  return (profile.handle ?? m.replace(/[^A-Z0-9]/g, "").slice(0, 5)) || "AGENT";
}
function fmtDate(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

/* ── discover agents under the base prefix ──────────────────────────────── */
const all = await listKeys(BASE);
const agentIds = [
  ...new Set(
    all
      .map((o) => o.key.slice(BASE.length))
      .map((tail) => tail.split("/")[0])
      .filter(Boolean),
  ),
].filter((id) => all.some((o) => o.key === `${BASE}${id}/snapshot.json`));

console.log(`Base: s3://${BUCKET}/${BASE}`);
console.log(`Agents discovered: ${agentIds.length}${agentIds.length ? ` (${agentIds.join(", ")})` : ""}`);

if (agentIds.length === 0) {
  if (process.env.SWARM_ADAPTER_ALLOW_EMPTY) {
    // Automation path: reflect reality so the daily run no-ops cleanly instead
    // of acting on a stale deck.
    fs.writeFileSync(OUT, JSON.stringify({ _generatedFrom: `s3://${BUCKET}/${BASE}`, agents: [], match: null }, null, 2));
    console.warn(`No agents under ${BASE} — wrote empty deck.`);
  } else {
    // Dev path: leave the existing deck untouched (handy for local rendering).
    console.warn(
      `\nNo agents under ${BASE} yet — leaving ${path.relative(process.cwd(), OUT)} untouched.\n` +
        `(set SWARM_ADAPTER_ALLOW_EMPTY=1 to write an empty deck, or SWARM_AGENTS_PREFIX=nickai/agents/ for interim data.)`,
    );
  }
  process.exit(0);
}

const agents: any[] = [];
for (const id of agentIds) {
  const prefix = `${BASE}${id}/`;
  const profile = await getJson<any>(`${prefix}profile.json`);
  const snap = await getJson<any>(`${prefix}snapshot.json`);
  if (!profile || !snap) {
    console.warn(`  ! ${id}: missing profile/snapshot, skipping`);
    continue;
  }
  const runFiles = (await listKeys(`${prefix}runs/`))
    .filter((o) => o.key.endsWith(".json"))
    .sort((a, b) => a.mod.getTime() - b.mod.getTime());
  const runs = (await Promise.all(runFiles.map((r) => getJson<any>(r.key)))).filter(Boolean);
  agents.push(toEngineAgent(profile, snap, runs));
  console.log(`  ✓ ${id} → ${agents.at(-1).handle}`);
}

agents.sort((a, b) => b.roiPct - a.roiPct); // leaderboard order + per-agent rank

const deck = {
  _generatedFrom: `s3://${BUCKET}/${BASE}`,
  agents,
  match: null,
};

fs.writeFileSync(OUT, JSON.stringify(deck, null, 2));
console.log(`\nWrote ${agents.length} agent(s) → ${path.relative(process.cwd(), OUT)}`);
