/**
 * Publish a weekly NickAI social batch to R2 so the /nickai site section can
 * serve it (STA-473 CP6).
 *
 * Write order is assets-first, manifest-last: batch.json is the atomic
 * "this week exists" marker, so the site never sees a manifest whose assets
 * are still uploading.
 *
 * Usage:
 *   bun scripts/publish-nickai-social.ts --batch <dir with batch.json>
 *
 * Destination: s3://<bucket from R2_FEED_NICKAI>/nickai-social/<week>/
 */
import fs from "node:fs";
import path from "node:path";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { parseS3Url, s3Client } from "./feed";

const CONTENT_TYPES: Record<string, string> = {
  ".json": "application/json",
  ".png": "image/png",
  ".mp4": "video/mp4",
};

function parseFlags(argv: string[]) {
  const flags = { batch: "" };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--batch") flags.batch = argv[++i] ?? "";
  }
  if (!flags.batch) {
    console.error("Pass --batch <dir with batch.json>");
    process.exit(1);
  }
  return flags;
}

async function putFile(bucket: string, key: string, filePath: string) {
  await s3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: fs.readFileSync(filePath),
      ContentType: CONTENT_TYPES[path.extname(filePath)] ?? "application/octet-stream",
    }),
  );
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const feed = process.env.R2_FEED_NICKAI;
  if (!feed) {
    console.error("R2_FEED_NICKAI is not set.");
    process.exit(1);
  }
  const { bucket } = parseS3Url(feed);
  const batchPath = path.join(flags.batch, "batch.json");
  const batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  const prefix = `nickai-social/${batch.week}/`;

  const cardsDir = path.join(flags.batch, "cards");
  const assets = fs.existsSync(cardsDir)
    ? fs.readdirSync(cardsDir).filter((f) => /\.(png|mp4)$/.test(f))
    : [];
  console.log(`Publishing ${batch.week}: ${assets.length} asset(s) + manifest → s3://${bucket}/${prefix}`);

  for (const file of assets) {
    await putFile(bucket, `${prefix}cards/${file}`, path.join(cardsDir, file));
    console.log(`  ✓ cards/${file}`);
  }
  // Manifest last (atomicity marker).
  await putFile(bucket, `${prefix}batch.json`, batchPath);
  console.log(`  ✓ batch.json`);
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
