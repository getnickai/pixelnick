/**
 * Server-side reads for the /nickai social calendar section (STA-473 CP6).
 *
 * Weekly batches live in R2 under nickai-social/<ISO week>/ — batch.json is
 * the manifest (written last by scripts/publish-nickai-social.ts), cards/*
 * are the media assets. Reads are uncached by design: the section is
 * password-gated and low-traffic, and pixelnick has been bitten twice by
 * cached-empty responses pinning stale data (cached-empty-data bug,
 * leaderboard ISR staleness). Pages using this module set force-dynamic.
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const SOCIAL_PREFIX = "nickai-social/";

export type SocialPost = {
  slug: string;
  suggestedDay: string;
  series: string;
  text: string;
  thread?: string[];
  card: { png?: string; mp4?: string };
  source: string;
  hero: boolean;
};

export type SocialBatch = {
  schemaVersion: number;
  week: string;
  generatedAt: string;
  status: string;
  notes?: string;
  posts: SocialPost[];
};

let client: S3Client | null = null;

function s3(): S3Client {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT,
      forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    });
  }
  return client;
}

export function socialBucket(): string {
  const feed = process.env.R2_FEED_NICKAI;
  if (!feed) throw new Error("R2_FEED_NICKAI is not set");
  const m = feed.match(/^s3:\/\/([^/]+)/);
  if (!m) throw new Error("R2_FEED_NICKAI is not an s3:// url");
  return m[1];
}

/** Week ids (e.g. "2026-W28"), newest first. */
export async function listWeeks(): Promise<string[]> {
  const res = await s3().send(
    new ListObjectsV2Command({
      Bucket: socialBucket(),
      Prefix: SOCIAL_PREFIX,
      Delimiter: "/",
    }),
  );
  return (res.CommonPrefixes ?? [])
    .map((p) => p.Prefix?.slice(SOCIAL_PREFIX.length).replace(/\/$/, "") ?? "")
    .filter(Boolean)
    .sort()
    .reverse();
}

/** The week's manifest, or null when absent/unreadable (never cached). */
export async function getWeekBatch(week: string): Promise<SocialBatch | null> {
  try {
    const res = await s3().send(
      new GetObjectCommand({
        Bucket: socialBucket(),
        Key: `${SOCIAL_PREFIX}${week}/batch.json`,
      }),
    );
    const body = await res.Body?.transformToString();
    if (!body) return null;
    const batch = JSON.parse(body) as SocialBatch;
    // Unknown future schema: render nothing rather than break the page.
    if (batch.schemaVersion !== 1) return null;
    return batch;
  } catch {
    return null;
  }
}

/** Raw media bytes for the asset proxy route. */
export async function getAsset(
  week: string,
  file: string,
): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  // The key is assembled from route params; keep it inside the week's cards/.
  if (file.includes("..") || file.includes("/") || !/\.(png|mp4)$/.test(file)) return null;
  try {
    const res = await s3().send(
      new GetObjectCommand({
        Bucket: socialBucket(),
        Key: `${SOCIAL_PREFIX}${week}/cards/${file}`,
      }),
    );
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) return null;
    return {
      bytes,
      contentType: file.endsWith(".mp4") ? "video/mp4" : "image/png",
    };
  } catch {
    return null;
  }
}
