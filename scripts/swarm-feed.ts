/**
 * Load a Swarm Arena deck (agents + match) from either the Cloudflare R2
 * bucket or the local fixtures, then map it to engine objects.
 *
 * Source resolution:
 *   - env `SWARM_R2_PREFIX` set  → pull from R2 (production path).
 *   - otherwise                  → read data/swarm-fixtures/ (offline default).
 *
 * R2 layout (mirrors data/swarm-card-data-contract.md):
 *   <prefix>/agents/<HANDLE>/snapshot.json
 *   <prefix>/match/current.json
 */
import fs from "node:fs";
import path from "node:path";
import { ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { parseS3Url, s3Client } from "./feed";
import {
  buildDeck,
  type SwarmAgentSnapshot,
  type SwarmMatch,
  type SwarmDeck,
} from "../data/swarm-output";

const FIXTURES_DIR = path.join(process.cwd(), "data", "swarm-fixtures");

async function getJson<T>(bucket: string, key: string): Promise<T> {
  const res = await s3Client().send(
    new GetObjectCommand({ Bucket: bucket, Key: key }),
  );
  if (!res.Body) throw new Error(`Empty object: ${key}`);
  return JSON.parse(await res.Body.transformToString()) as T;
}

async function loadFromR2(prefix: string): Promise<SwarmDeck> {
  const { bucket, key: rawPrefix } = parseS3Url(prefix);
  const base = rawPrefix.endsWith("/") ? rawPrefix : `${rawPrefix}/`;
  const client = s3Client();

  // List every agents/<HANDLE>/snapshot.json under the prefix.
  const snapshotKeys: string[] = [];
  let ContinuationToken: string | undefined;
  do {
    const page = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: `${base}agents/`,
        ContinuationToken,
      }),
    );
    for (const obj of page.Contents ?? []) {
      if (obj.Key && obj.Key.endsWith("/snapshot.json")) snapshotKeys.push(obj.Key);
    }
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);

  const snapshots = await Promise.all(
    snapshotKeys.map((key) => getJson<SwarmAgentSnapshot>(bucket, key)),
  );
  const match = await getJson<SwarmMatch>(bucket, `${base}match/current.json`);
  return buildDeck(snapshots, match);
}

function loadFromFixtures(): SwarmDeck {
  const agentsDir = path.join(FIXTURES_DIR, "agents");
  if (!fs.existsSync(agentsDir)) {
    throw new Error(
      `No swarm fixtures at ${FIXTURES_DIR}. Run \`bun scripts/swarm-fixtures.ts\` first.`,
    );
  }
  const snapshots = fs
    .readdirSync(agentsDir)
    .map((handle) => path.join(agentsDir, handle, "snapshot.json"))
    .filter((p) => fs.existsSync(p))
    .map((p) => JSON.parse(fs.readFileSync(p, "utf8")) as SwarmAgentSnapshot);
  const match = JSON.parse(
    fs.readFileSync(path.join(FIXTURES_DIR, "match", "current.json"), "utf8"),
  ) as SwarmMatch;
  return buildDeck(snapshots, match);
}

/** Resolve the deck from the configured source. */
export async function loadSwarmDeck(): Promise<{ deck: SwarmDeck; source: string }> {
  const prefix = process.env.SWARM_R2_PREFIX;
  if (prefix) {
    return { deck: await loadFromR2(prefix), source: `R2 ${prefix}` };
  }
  return { deck: loadFromFixtures(), source: "fixtures" };
}
