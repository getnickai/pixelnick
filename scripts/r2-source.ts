/**
 * R2 (or S3) structured source — discovers agents and pulls their JSON outputs.
 *
 * Walks an R2 prefix (e.g. s3://nickai-cards-feed/agents/), lists all
 * snapshot.json keys, and returns the agents whose snapshots have been
 * modified since the pull-log watermark. For each fresh snapshot it also loads
 * the matching profile.json (cached per agent).
 *
 * Today's pipeline ranks the resulting agents by profitPercent to pick the
 * Top N to render. Per-run records under runs/ are intentionally not fetched
 * here — they'll be pulled on demand when trade-highlight cards arrive.
 */
import {
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { parseS3Url, s3Client } from "./feed";
import type { AgentProfile, AgentSnapshot } from "../data/agent-output";

export type FreshAgent = {
  agentId: string;
  profile: AgentProfile;
  snapshot: AgentSnapshot;
  /** S3 LastModified of the snapshot — used to advance the watermark. */
  snapshotLastModifiedISO: string;
};

/** Strip "agents/<id>/snapshot.json" to "<id>". Returns null if unmatched. */
function agentIdFromSnapshotKey(key: string, prefix: string): string | null {
  const tail = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  const m = tail.match(/^([^/]+)\/snapshot\.json$/);
  return m ? m[1] : null;
}

async function getJson<T>(bucket: string, key: string): Promise<T> {
  const res = await s3Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) throw new Error(`Empty object: ${key}`);
  return JSON.parse(await res.Body.transformToString()) as T;
}

/**
 * List every `agents/<id>/snapshot.json` under the prefix and return the ones
 * whose LastModified is strictly greater than `sinceISO`. Pass `null` to take
 * everything (first pull).
 */
export async function pullAgentsFromR2(
  agentsPrefix: string,
  sinceISO: string | null,
): Promise<FreshAgent[]> {
  const { bucket, key: rawPrefix } = parseS3Url(agentsPrefix);
  const prefix = rawPrefix.endsWith("/") ? rawPrefix : `${rawPrefix}/`;
  const since = sinceISO ? new Date(sinceISO).getTime() : -Infinity;
  const client = s3Client();

  // 1. List every snapshot.json under the prefix, paging through the bucket.
  const snapshotKeys: { key: string; lastModified: Date }[] = [];
  let ContinuationToken: string | undefined = undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (!obj.Key || !obj.LastModified) continue;
      if (obj.Key.endsWith("/snapshot.json")) {
        snapshotKeys.push({ key: obj.Key, lastModified: obj.LastModified });
      }
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);

  // 2. Watermark filter — only agents whose snapshot has actually moved.
  const fresh = snapshotKeys.filter((s) => s.lastModified.getTime() > since);

  // 3. For each fresh snapshot, load snapshot + profile.
  const out: FreshAgent[] = [];
  for (const { key, lastModified } of fresh) {
    const agentId = agentIdFromSnapshotKey(key, prefix);
    if (!agentId) continue;
    const snapshot = await getJson<AgentSnapshot>(bucket, key);
    const profileKey = key.replace(/snapshot\.json$/, "profile.json");
    const profile = await getJson<AgentProfile>(bucket, profileKey);
    out.push({
      agentId,
      profile,
      snapshot,
      snapshotLastModifiedISO: lastModified.toISOString(),
    });
  }
  return out;
}
