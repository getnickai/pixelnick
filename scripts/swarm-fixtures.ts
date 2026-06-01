/**
 * One-off generator: emit bucket-shaped fixture JSON from the share-card
 * engine's built-in sample data.
 *
 * The engine (public/swarm-arena-cards/card-engine.js) ships the design's
 * sample roster + match. We read that, reshape it into the agent data contract
 * (data/swarm-output.ts), and write files that mirror the real R2 layout:
 *
 *   data/swarm-fixtures/agents/<HANDLE>/snapshot.json
 *   data/swarm-fixtures/match/current.json
 *
 * These let the card pipeline render end-to-end offline, and double as a worked
 * example of the contract. Re-run with `bun scripts/swarm-fixtures.ts`.
 */
import fs from "node:fs";
import path from "node:path";
import type {
  SwarmAgentSnapshot,
  SwarmMatch,
  EngineAgent,
} from "../data/swarm-output";

const ROOT = process.cwd();
const ENGINE = path.join(ROOT, "public", "swarm-arena-cards", "card-engine.js");
const OUT = path.join(ROOT, "data", "swarm-fixtures");

/** The engine's MATCH constant is a SwarmMatch without the asOf stamp. */
type EngineMatchSample = Omit<SwarmMatch, "asOf">;
type EngineSample = { agents: EngineAgent[]; match: EngineMatchSample };

/** Run the engine IIFE under a window shim and return its sample data. */
function readEngineData(): EngineSample {
  const code = fs.readFileSync(ENGINE, "utf8");
  const win = {} as { SA: { AGENTS: EngineAgent[]; MATCH: EngineMatchSample } };
  new Function("window", code)(win);
  return { agents: win.SA.AGENTS, match: win.SA.MATCH };
}

function toSnapshot(a: EngineAgent, asOf: string): SwarmAgentSnapshot {
  return {
    handle: a.handle,
    asOf,
    roiPct: a.roiPct,
    pickPct: a.pickPct,
    signals: a.signals,
    nextRun: a.nextRun,
    activeSince: "2026-05-28",
    spark: a.spark,
    pick: a.pick,
    ...(a.streak ? { streak: a.streak } : {}),
    ...(a.lastTrade ? { lastTrade: { pnlUsd: a.lastTrade.pnl, ago: a.lastTrade.ago } } : {}),
    ...(a.recent
      ? { recent: a.recent.map((r) => ({ market: r.market, side: r.side, pnlUsd: r.pnl })) }
      : {}),
  };
}

function toMatch(m: EngineMatchSample, asOf: string): SwarmMatch {
  return { asOf, ...m };
}

function main() {
  const asOf = new Date().toISOString();
  const { agents, match } = readEngineData();

  fs.rmSync(OUT, { recursive: true, force: true });
  for (const a of agents) {
    const dir = path.join(OUT, "agents", a.handle);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      path.join(dir, "snapshot.json"),
      JSON.stringify(toSnapshot(a, asOf), null, 2) + "\n",
    );
  }
  const matchDir = path.join(OUT, "match");
  fs.mkdirSync(matchDir, { recursive: true });
  fs.writeFileSync(
    path.join(matchDir, "current.json"),
    JSON.stringify(toMatch(match, asOf), null, 2) + "\n",
  );

  console.log(
    `Wrote ${agents.length} agent snapshots + 1 match to ${path.relative(ROOT, OUT)}/`,
  );
}

main();
