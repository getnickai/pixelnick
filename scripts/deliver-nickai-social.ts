/**
 * Deliver a weekly NickAI social batch to Slack (STA-473 CP4).
 *
 * One Slack message per post: initial_comment = the VERBATIM tweet text (so
 * copying the message body copies the post), the MP4 attached (PNG fallback),
 * then a thread reply with metadata (day, series, source, hero). Ends with a
 * summary message that ALWAYS posts, even when individual posts fail — a
 * missing Friday message is the one failure nobody notices until Monday.
 *
 * Usage:
 *   bun scripts/deliver-nickai-social.ts --batch <dir with batch.json> \
 *     [--channel <id>] [--dry]
 *
 * Channel defaults to SLACK_CHANNEL_SOCIAL_POSTS, then SLACK_CHANNEL_ID.
 * Requires SLACK_BOT_TOKEN (files:write + chat:write; conversations.join is
 * attempted so a public channel doesn't need a manual invite).
 */
import fs from "node:fs";
import path from "node:path";
import { slackGet, slackPostForm, uploadOne } from "./slack";

type BatchPost = {
  slug: string;
  suggestedDay: string;
  series: string;
  text: string;
  thread?: string[];
  card: { png?: string; mp4?: string };
  source: string;
  hero: boolean;
};

type Batch = {
  schemaVersion: number;
  week: string;
  status: string;
  posts: BatchPost[];
};

function parseFlags(argv: string[]) {
  const flags = { batch: "", channel: "", dry: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--batch") flags.batch = argv[++i] ?? "";
    else if (argv[i] === "--channel") flags.channel = argv[++i] ?? "";
    else if (argv[i] === "--dry") flags.dry = true;
  }
  return flags;
}

/** Resolve the channel message ts for an uploaded file (shares appear async). */
async function shareTs(token: string, fileId: string, channel: string): Promise<string | null> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const info = await slackGet(token, "files.info", { file: fileId });
    // files.info needs files:read. If the bot lacks it (or the file is gone),
    // polling won't help — bail so the caller falls back to a standalone reply.
    if (info?.ok === false) return null;
    const shares = info?.file?.shares;
    const entry = shares?.public?.[channel]?.[0] ?? shares?.private?.[channel]?.[0];
    if (entry?.ts) return entry.ts as string;
    await new Promise((r) => setTimeout(r, 1500));
  }
  return null;
}

async function main() {
  const flags = parseFlags(process.argv.slice(2));
  const token = process.env.SLACK_BOT_TOKEN;
  const channel =
    flags.channel || process.env.SLACK_CHANNEL_SOCIAL_POSTS || process.env.SLACK_CHANNEL_ID || "";
  if (!token || !channel) {
    console.error("Missing SLACK_BOT_TOKEN or channel id.");
    process.exit(1);
  }
  const batchPath = path.join(flags.batch, "batch.json");
  const batch: Batch = JSON.parse(fs.readFileSync(batchPath, "utf8"));
  console.log(`Delivering ${batch.week}: ${batch.posts.length} post(s) → channel ${channel}${flags.dry ? " (dry run)" : ""}`);

  if (!flags.dry) {
    // Self-invite into public channels; harmless if already a member.
    const join = await slackPostForm(token, "conversations.join", { channel });
    if (!join.ok && join.error !== "method_not_supported_for_channel_type" && join.error !== "already_in_channel") {
      console.warn(`conversations.join: ${join.error} (continuing; upload will fail if the bot isn't in the channel)`);
    }
  }

  const results: { slug: string; ok: boolean; detail: string }[] = [];

  for (const post of batch.posts) {
    const mediaPath = [post.card.mp4, post.card.png]
      .filter((p): p is string => Boolean(p))
      .map((p) => path.resolve(flags.batch, p))
      .find((p) => fs.existsSync(p));
    try {
      if (flags.dry) {
        console.log(`  · ${post.slug}: would post ${mediaPath ? path.basename(mediaPath) : "TEXT ONLY"} + ${post.text.length} chars`);
        results.push({ slug: post.slug, ok: true, detail: "dry" });
        continue;
      }
      let ts: string | null = null;
      if (mediaPath) {
        const fileId = await uploadOne(token, mediaPath);
        const complete = await slackPostForm(token, "files.completeUploadExternal", {
          files: JSON.stringify([{ id: fileId, title: path.basename(mediaPath) }]),
          channel_id: channel,
          initial_comment: post.text,
        });
        if (!complete.ok) throw new Error(`completeUploadExternal: ${complete.error}`);
        ts = await shareTs(token, fileId, channel);
      } else {
        const msg = await slackPostForm(token, "chat.postMessage", { channel, text: post.text });
        if (!msg.ok) throw new Error(`postMessage: ${msg.error}`);
        ts = msg.ts as string;
      }

      const metaLines = [
        `${post.suggestedDay} · ${post.series}${post.hero ? " · HERO" : ""}`,
        `source: ${post.source}`,
        ...(post.thread?.length ? ["thread tweets:", ...post.thread.map((t, i) => `${i + 2}. ${t}`)] : []),
      ];
      // Prefer a threaded reply under the post; fall back to a standalone
      // message when the parent ts can't be resolved (the bot lacks files:read
      // to read an uploaded file's share ts). The metadata carries the source
      // and the blog link, so it must never be silently dropped.
      const meta = await slackPostForm(token, "chat.postMessage", {
        channel,
        text: metaLines.join("\n"),
        ...(ts ? { thread_ts: ts } : {}),
      });
      if (!meta.ok) {
        console.warn(`  ⚠ ${post.slug}: metadata message failed (${meta.error})`);
      } else if (!ts) {
        console.warn(`  ⚠ ${post.slug}: parent ts unresolved (no files:read); metadata posted standalone`);
      }
      console.log(`  ✓ ${post.slug} (${post.suggestedDay})`);
      results.push({ slug: post.slug, ok: true, detail: mediaPath ? path.basename(mediaPath) : "text only" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  ✗ ${post.slug}: ${msg}`);
      results.push({ slug: post.slug, ok: false, detail: msg });
    }
  }

  // Heartbeat summary — always attempt, even after failures.
  const okCount = results.filter((r) => r.ok).length;
  const summaryLines = [
    `Weekly batch ${batch.week}: ${okCount}/${batch.posts.length} posts delivered.`,
    ...results.filter((r) => !r.ok).map((r) => `failed ${r.slug}: ${r.detail}`),
    `Copy the message body of each post above, download its video, and it is X-ready.`,
  ];
  if (!flags.dry) {
    const summary = await slackPostForm(token, "chat.postMessage", {
      channel,
      text: summaryLines.join("\n"),
    });
    if (!summary.ok) console.error(`summary message failed: ${summary.error}`);
  }

  if (!flags.dry && okCount > 0) {
    batch.status = okCount === batch.posts.length ? "delivered" : "partially-delivered";
    fs.writeFileSync(batchPath, `${JSON.stringify(batch, null, 2)}\n`);
  }
  console.log(`\n${okCount}/${batch.posts.length} delivered.`);
  if (okCount < batch.posts.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
