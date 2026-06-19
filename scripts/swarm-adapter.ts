/**
 * Swarm Arena adapter — writes the deck JSON the card kit consumes
 * (public/swarm-arena-cards/live-deck.json) from the live R2 agent output.
 *
 * The R2 -> deck mapping lives in lib/swarm-deck.ts, shared with the
 * /api/swarm-deck route that powers the live gallery. This script is just the
 * file-write + CLI wrapper around it (single source of truth for the mapping).
 *
 *   bun scripts/swarm-adapter.ts
 *
 * Env: SWARM_AGENTS_PREFIX (override base prefix, e.g. nickai/agents/ for
 * interim data); SWARM_ADAPTER_ALLOW_EMPTY (write an empty deck instead of
 * leaving the existing one untouched when no agents are found).
 */
import fs from "node:fs";
import path from "node:path";
import { buildSwarmDeck } from "../lib/swarm-deck";
import { buildDeckFromSite } from "../lib/swarm-deck-from-site";

const OUT = path.join(process.cwd(), "public", "swarm-arena-cards", "live-deck.json");

// Source of truth = swarmarena.ai's own computed leaderboard (/api/leaderboard),
// so the cards always match the site. Fall back to the R2 recompute only if the
// endpoint is unreachable/empty — logging which source won so a mismatch (the
// fallback's known drift) is never silent. Set SWARM_DECK_R2_ONLY=1 to force the
// legacy R2 path (e.g. for debugging the recompute).
let deck: { _generatedFrom: string; agents: any[]; match: any };
if (process.env.SWARM_DECK_R2_ONLY) {
  console.log("SWARM_DECK_R2_ONLY set — using the R2 recompute.");
  deck = await buildSwarmDeck();
} else {
  try {
    deck = await buildDeckFromSite();
    console.log(`Leaderboard source: site endpoint (${deck._generatedFrom}).`);
  } catch (e) {
    console.warn(
      `Leaderboard source: site endpoint unavailable (${(e as Error).message}) — ` +
        "falling back to the R2 recompute (numbers may differ from swarmarena.ai).",
    );
    deck = await buildSwarmDeck();
  }
}
const handles = deck.agents.map((a: any) => a.handle);
console.log(`Base: ${deck._generatedFrom}`);
console.log(`Agents discovered: ${deck.agents.length}${handles.length ? ` (${handles.join(", ")})` : ""}`);

if (deck.agents.length === 0) {
  if (process.env.SWARM_ADAPTER_ALLOW_EMPTY) {
    fs.writeFileSync(
      OUT,
      JSON.stringify({ _generatedFrom: deck._generatedFrom, agents: [], match: null }, null, 2),
    );
    console.warn("No agents under the prefix — wrote empty deck.");
  } else {
    console.warn(
      `\nNo agents yet — leaving ${path.relative(process.cwd(), OUT)} untouched.\n` +
        "(set SWARM_ADAPTER_ALLOW_EMPTY=1 to write an empty deck, or SWARM_AGENTS_PREFIX=nickai/agents/ for interim data.)",
    );
  }
  process.exit(0);
}

// Keep the on-disk deck shape stable for generate-swarm-cards.ts (agents + match).
fs.writeFileSync(
  OUT,
  JSON.stringify({ _generatedFrom: deck._generatedFrom, agents: deck.agents, match: deck.match }, null, 2),
);
console.log(`\nWrote ${deck.agents.length} agent(s) → ${path.relative(process.cwd(), OUT)}`);
