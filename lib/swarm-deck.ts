/**
 * Swarm Arena deck builder — shared by the CLI adapter (file write) and the
 * /api/swarm-deck route (live render). Reads the competition agents' R2 output
 * (STA-388 layout) and maps it to the deck shape the card kit consumes via
 * `SA.load()`.
 *
 * Single source of truth for the R2 -> deck mapping. Server-side only (uses R2
 * read credentials from env); never imported into client bundles.
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { identityFor } from "../data/swarm-identity";

const BUCKET = "nickai-swarmarena-internal";

function client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.AWS_REGION ?? "auto",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

async function getJson<T>(c: S3Client, key: string): Promise<T | null> {
  try {
    const res = await c.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch {
    return null;
  }
}

async function listKeys(c: S3Client, prefix: string): Promise<{ key: string; mod: Date }[]> {
  const out: { key: string; mod: Date }[] = [];
  let token: string | undefined;
  do {
    const page = await c.send(
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
function marketOf(p: any): string {
  return String(p.market ?? p.match ?? MARKET_LABEL[p.market_type] ?? "").replace(" vs ", " v ");
}
// Rich, self-contained side string matching the card design's expectation,
// e.g. "BACK Yes @ 0.58". Prefixes BACK when the selection has no explicit
// direction, and appends the entry price when present, so the live deck reads
// the same as the kit's sample data (no detail dropped in the gallery).
function sideOf(p: any): string {
  const raw = String(p.selection ?? p.direction ?? "").trim();
  if (!raw) return "";
  const hasDir = /^(back|lay)\b/i.test(raw);
  let sel = p.market_type === "totals" && p.line != null ? `${cap(raw)} ${p.line}` : cap(raw);
  if (!hasDir) sel = `BACK ${sel}`;
  if (p.price != null && Number.isFinite(Number(p.price))) sel += ` @ ${Number(p.price).toFixed(2)}`;
  return sel;
}
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
  return dedup.sort((a, b) => new Date(a.closed_iso ?? 0).getTime() - new Date(b.closed_iso ?? 0).getTime());
}
function relTime(iso?: string): string {
  if (!iso) return "";
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.floor(diffMin / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}
function streakOf(closed: any[]): string {
  const wl = closed.map((t) => String(t.result ?? "").toLowerCase()).filter((r) => r === "win" || r === "loss");
  if (!wl.length) return "—";
  const last = wl[wl.length - 1];
  let n = 0;
  for (let i = wl.length - 1; i >= 0 && wl[i] === last; i--) n++;
  return `${last === "win" ? "W" : "L"}${n}`;
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

export function toEngineAgent(profile: any, snap: any, runs: any[]): any {
  const perf = snap.performance ?? {};
  const startCap = profile.starting_capital ?? perf.starting_capital ?? snap.bankrollRefUsd ?? 1000;
  const equity = perf.current_value ?? startCap + (snap.pnlUsd ?? 0);
  const roiPct = perf.roi_pct ?? snap.profitPercent ?? (startCap ? ((equity - startCap) / startCap) * 100 : 0);
  const curve = runs.map((r) => r.performance?.current_value ?? startCap + (r.pnlUsd ?? 0));
  const spark = curve.length >= 1 ? [startCap, ...curve] : [startCap, equity];
  const latest = runs.at(-1) ?? snap;
  const positions = [...(latest.open_positions ?? latest.positions ?? snap.open_positions ?? [])].sort(
    (a, b) => (b.edge_pp ?? 0) - (a.edge_pp ?? 0),
  );
  const top = positions[0];
  const closed = collectClosedTrades(runs, snap);
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
  // Headline = the model, not the strategy. The design-owned registry is the
  // source of truth for the display name (short: "Claude" / "GPT" / "Gemini"),
  // so we prefer it over the agent's profile name ("S1 Match Reader (Claude)").
  // The sub-line carries the provider org; the full model + strategy live in
  // the registry / profile if ever needed.
  const displayName = id?.short ?? name.replace(/\s*\(.*\)\s*$/, "");
  return {
    handle,
    code: id?.code ?? handle.slice(0, 3),
    short: displayName,
    label: displayName,
    provider: id?.provider ?? ([profile.model, builder].filter(Boolean).join(" · ") || ""),
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

export type SwarmDeck = {
  _generatedFrom: string;
  /** ISO instant the deck reflects, or null for "live / now". */
  at: string | null;
  /** Distinct run dates (YYYY-MM-DD) across all agents — the timeline points. */
  availableDates: string[];
  agents: any[];
  match: any;
};

/**
 * Read R2 and build a deck. Server-side only.
 *  - opts.at: build the deck AS OF that instant (point-in-time history) by
 *    truncating each agent's run history to runs at or before `at` and using
 *    the latest such run as the snapshot. Agents with no runs yet are omitted.
 *  - omit opts.at for the live "now" deck (uses each agent's snapshot.json).
 * Always returns availableDates (the timeline) derived from runs/<date>/.
 */
export async function buildSwarmDeck(opts: { prefix?: string; at?: string } = {}): Promise<SwarmDeck> {
  const BASE = (opts.prefix ?? process.env.SWARM_AGENTS_PREFIX ?? "swarm-arena/agents/").replace(/\/?$/, "/");
  const atParsed = opts.at ? new Date(opts.at).getTime() : Infinity;
  const atMs = Number.isNaN(atParsed) ? Infinity : atParsed; // bad `at` -> treat as live
  const c = client();
  const all = await listKeys(c, BASE);
  const agentIds = [
    ...new Set(all.map((o) => o.key.slice(BASE.length).split("/")[0]).filter(Boolean)),
  ].filter((id) => all.some((o) => o.key === `${BASE}${id}/snapshot.json`));

  const dates = new Set<string>();
  const agents: any[] = [];
  for (const id of agentIds) {
    const prefix = `${BASE}${id}/`;
    const profile = await getJson<any>(c, `${prefix}profile.json`);
    if (!profile) continue;
    const runFiles = (await listKeys(c, `${prefix}runs/`)).filter((o) => o.key.endsWith(".json"));
    for (const f of runFiles) {
      const m = f.key.match(/runs\/(\d{4}-\d{2}-\d{2})\//);
      if (m) dates.add(m[1]);
    }
    // Order by the run's own timestamp (not R2 LastModified), so the equity
    // curve and "latest run" stay correct even if a file is re-uploaded later.
    const allRuns = (await Promise.all(runFiles.map((r) => getJson<any>(c, r.key))))
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(a.timestamp ?? 0).getTime() - new Date(b.timestamp ?? 0).getTime());

    if (opts.at) {
      const upto = allRuns.filter((r: any) => new Date(r.timestamp ?? 0).getTime() <= atMs);
      if (!upto.length) continue; // agent didn't exist yet at this point
      agents.push(toEngineAgent(profile, upto[upto.length - 1], upto));
    } else {
      const snap = await getJson<any>(c, `${prefix}snapshot.json`);
      if (!snap) continue;
      agents.push(toEngineAgent(profile, snap, allRuns));
    }
  }
  agents.sort((a, b) => b.roiPct - a.roiPct);
  return {
    _generatedFrom: `s3://${BUCKET}/${BASE}`,
    at: opts.at ?? null,
    availableDates: [...dates].sort(),
    agents,
    match: null,
  };
}
