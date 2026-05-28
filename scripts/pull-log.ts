/**
 * Pull-log — what's been ingested from R2 so re-pulls are incremental.
 *
 * Persists a single `lastPulledISO` watermark and a per-agent record of when we
 * last *processed* each snapshot. On each pull we filter R2 listings to only
 * objects whose `LastModified` is after `lastPulledISO`. We update the
 * watermark to the max LastModified observed (not just "now") so a run that
 * completes 10 minutes after R2 wrote new data still picks up everything
 * correctly on the next pass.
 *
 * Committed (data/pull-log.json) so the watermark survives fresh clones.
 */
import path from "node:path";
import fs from "node:fs";

export const PULL_LOG_PATH = path.join(process.cwd(), "data", "pull-log.json");

export type PullLog = {
  /** ISO of the most recent snapshot LastModified we've processed. */
  lastPulledISO: string | null;
  /** Total runs ever; useful for debugging cadence. */
  pullCount: number;
  /** Per-agent record: when we last saw a new snapshot for them. */
  agentsSeen: Record<string, string>;
};

export function loadPullLog(): PullLog {
  if (!fs.existsSync(PULL_LOG_PATH)) {
    return { lastPulledISO: null, pullCount: 0, agentsSeen: {} };
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(PULL_LOG_PATH, "utf8")) as PullLog;
    return {
      lastPulledISO: parsed.lastPulledISO ?? null,
      pullCount: parsed.pullCount ?? 0,
      agentsSeen: parsed.agentsSeen ?? {},
    };
  } catch {
    return { lastPulledISO: null, pullCount: 0, agentsSeen: {} };
  }
}

export function savePullLog(log: PullLog): void {
  fs.mkdirSync(path.dirname(PULL_LOG_PATH), { recursive: true });
  fs.writeFileSync(PULL_LOG_PATH, JSON.stringify(log, null, 2) + "\n");
}
