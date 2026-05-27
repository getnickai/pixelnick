/**
 * Feed reader — resolves the agents.json source, wherever it lives.
 *
 * Supports three source forms so the same pipeline works locally and in
 * production:
 *   - s3://bucket/key   → fetched via the AWS SDK (default credential chain)
 *   - https://...       → fetched over HTTP
 *   - any other string  → treated as a local file path (relative to cwd)
 *
 * Production setup: NickAI writes the feed to an S3 key (e.g.
 * s3://nickai-cards-feed/input/agents.json); this reads it. AWS creds come from
 * the standard environment (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY /
 * AWS_REGION) — never hardcoded here.
 */
import fs from "node:fs";
import path from "node:path";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

/** Parse "s3://bucket/some/key.json" into its parts. */
function parseS3Url(url: string): { bucket: string; key: string } {
  const without = url.slice("s3://".length);
  const slash = without.indexOf("/");
  if (slash === -1) throw new Error(`Invalid S3 URL (no key): ${url}`);
  return { bucket: without.slice(0, slash), key: without.slice(slash + 1) };
}

async function readS3(url: string): Promise<string> {
  const { bucket, key } = parseS3Url(url);
  const client = new S3Client({}); // region + creds from env / default chain
  const res = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!res.Body) throw new Error(`Empty S3 object: ${url}`);
  return res.Body.transformToString();
}

async function readHttp(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status} ${url}`);
  return res.text();
}

/** Read the raw JSON text of the feed from any supported source. */
export async function readFeed(source: string): Promise<string> {
  if (source.startsWith("s3://")) return readS3(source);
  if (/^https?:\/\//i.test(source)) return readHttp(source);
  return fs.readFileSync(path.resolve(process.cwd(), source), "utf8");
}
