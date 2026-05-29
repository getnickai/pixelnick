/**
 * Pull-log — what's been ingested from each R2 source so re-pulls are
 * incremental.
 *
 * Keyed by source name so NickAI's watermark advances independently of
 * Swarm Arena's. Each source records its own lastPulledISO + the per-agent
 * LastModified we saw, so non-selected agents don't replay every run.
 *
 * Committed (data/pull-log.json) so watermarks survive fresh clones.
 */
import path from "node:path";
import fs from "node:fs";

export const PULL_LOG_PATH = path.join(process.cwd(), "data", "pull-log.json");

export type SourcePullState = {
  /** Max snapshot LastModified processed for this source. */
  lastPulledISO: string | null;
  /** Per-agent record: when we last saw a new snapshot. */
  agentsSeen: Record<string, string>;
};

export type PullLog = {
  /** Per-source watermark + per-agent state. */
  sources: Record<string, SourcePullState>;
  /** Total pull runs ever — useful for debugging cadence. */
  pullCount: number;
};

function emptyState(): SourcePullState {
  return { lastPulledISO: null, agentsSeen: {} };
}

export function loadPullLog(): PullLog {
  if (!fs.existsSync(PULL_LOG_PATH)) {
    return { sources: {}, pullCount: 0 };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PULL_LOG_PATH, "utf8")) as
      | PullLog
      | { lastPulledISO?: string | null; pullCount?: number; agentsSeen?: Record<string, string> };
    // Migrate the v1 single-source schema (flat lastPulledISO) to v2 (keyed by
    // source under "default") so old logs keep working.
    if ("sources" in parsed && parsed.sources) {
      return { sources: parsed.sources, pullCount: parsed.pullCount ?? 0 };
    }
    const legacy = parsed as { lastPulledISO?: string | null; pullCount?: number; agentsSeen?: Record<string, string> };
    return {
      sources: {
        default: {
          lastPulledISO: legacy.lastPulledISO ?? null,
          agentsSeen: legacy.agentsSeen ?? {},
        },
      },
      pullCount: legacy.pullCount ?? 0,
    };
  } catch {
    return { sources: {}, pullCount: 0 };
  }
}

export function getSourceState(log: PullLog, sourceName: string): SourcePullState {
  return log.sources[sourceName] ?? emptyState();
}

export function setSourceState(
  log: PullLog,
  sourceName: string,
  state: SourcePullState,
): void {
  log.sources[sourceName] = state;
}

export function savePullLog(log: PullLog): void {
  fs.mkdirSync(path.dirname(PULL_LOG_PATH), { recursive: true });
  fs.writeFileSync(PULL_LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}
