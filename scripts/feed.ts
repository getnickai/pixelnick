/**
 * Feed reader — resolves the agents.json source, wherever it lives.
 *
 * Supports three source forms so the same pipeline works locally and in
 * production:
 *   - s3://bucket/key   → fetched via the AWS SDK (default credential chain)
 *   - https://...       → fetched over HTTP
 *   - any other string  → treated as a local file path (relative to cwd)
 *
 * Production setup: NickAI writes the feed to a bucket key (e.g.
 * s3://nickai-cards-feed/input/agents.json); this reads it. Works with both
 * AWS S3 and any S3-compatible store — point `S3_ENDPOINT` at Cloudflare R2
 * (https://<account_id>.r2.cloudflarestorage.com) and you're done. Credentials
 * come from the standard env chain (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)
 * — never hardcoded here.
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

/**
 * Build an S3Client that targets either real AWS S3 or any S3-compatible
 * provider (R2, MinIO, Wasabi, etc.). The provider is selected purely by env:
 *   - `S3_ENDPOINT` set       → S3-compatible. For R2, also set AWS_REGION=auto.
 *   - `S3_ENDPOINT` unset     → real AWS S3 with region from AWS_REGION.
 * Path-style addressing is enabled when an endpoint is set because R2 (and
 * most compatibles) don't support virtual-hosted style.
 */
function s3Client(): S3Client {
  const endpoint = process.env.S3_ENDPOINT;
  if (endpoint) {
    return new S3Client({
      endpoint,
      region: process.env.AWS_REGION ?? "auto",
      forcePathStyle: true,
    });
  }
  return new S3Client({}); // AWS S3, default chain (region + creds from env)
}

async function readS3(url: string): Promise<string> {
  const { bucket, key } = parseS3Url(url);
  const res = await s3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
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
