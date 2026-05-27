/**
 * Slack handoff — uploads built cards into a channel via the Slack Web API.
 *
 * Uses the modern external-upload flow (no deprecated files.upload):
 *   1. files.getUploadURLExternal  -> { upload_url, file_id }  (per file)
 *   2. POST the raw bytes to upload_url
 *   3. files.completeUploadExternal -> shares the file(s) into the channel
 *      with an initial_comment (the caption), as ONE message.
 *
 * Credentials come from the environment (SLACK_BOT_TOKEN / SLACK_CHANNEL_ID);
 * this module never hardcodes or logs the token. Requires bot scopes
 * `files:write` + `chat:write`, and the bot must be a member of the channel.
 */
import fs from "node:fs";
import path from "node:path";
import type { AgentCardData } from "../data/mock-agents";

const SLACK_API = "https://slack.com/api";

export type SlackConfig = { token: string; channelId: string };

/** Read Slack config from env; returns null if not configured (skip posting). */
export function slackConfigFromEnv(): SlackConfig | null {
  const token = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;
  if (!token || !channelId) return null;
  return { token, channelId };
}

async function slackGet(token: string, method: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${SLACK_API}/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function slackPostForm(token: string, method: string, params: Record<string, string>) {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params).toString(),
  });
  return res.json();
}

/** Step 1+2: reserve an upload URL and PUT the file bytes. Returns the file id. */
async function uploadOne(token: string, filePath: string): Promise<string> {
  const bytes = fs.readFileSync(filePath);
  const filename = path.basename(filePath);

  const reserve = await slackGet(token, "files.getUploadURLExternal", {
    filename,
    length: String(bytes.byteLength),
  });
  if (!reserve.ok) {
    throw new Error(`getUploadURLExternal failed for ${filename}: ${reserve.error}`);
  }

  const put = await fetch(reserve.upload_url, { method: "POST", body: bytes });
  if (!put.ok) {
    throw new Error(`Upload POST failed for ${filename}: HTTP ${put.status}`);
  }
  return reserve.file_id as string;
}

export type SlackPostResult = { permalink?: string; ts?: string };

/**
 * Upload a card's PNG + MP4 (whichever exist) and share them into the channel
 * as a single message with `caption` as the comment.
 */
export async function postCardToSlack(
  cfg: SlackConfig,
  agent: AgentCardData,
  files: { png?: string; mp4?: string },
  caption: string,
): Promise<SlackPostResult> {
  const uploads: { id: string; title: string }[] = [];

  if (files.png && fs.existsSync(files.png)) {
    uploads.push({ id: await uploadOne(cfg.token, files.png), title: `${agent.slug}.png` });
  }
  if (files.mp4 && fs.existsSync(files.mp4)) {
    uploads.push({ id: await uploadOne(cfg.token, files.mp4), title: `${agent.slug}.mp4` });
  }
  if (uploads.length === 0) {
    throw new Error(`No output files to post for ${agent.slug}`);
  }

  const complete = await slackPostForm(cfg.token, "files.completeUploadExternal", {
    files: JSON.stringify(uploads),
    channel_id: cfg.channelId,
    initial_comment: caption,
  });
  if (!complete.ok) {
    throw new Error(`completeUploadExternal failed for ${agent.slug}: ${complete.error}`);
  }

  const first = complete.files?.[0];
  return { permalink: first?.permalink };
}

/** Caption for a card post. No em-dashes / hashtags per house style. */
export function buildCaption(agent: AgentCardData): string {
  const pnl = agent.pnl.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
  const sign = agent.pnl >= 0 ? "+" : "";
  return [
    `*${agent.agentName}*`,
    `${sign}${pnl} PNL  ·  ${agent.profitPercent}% profit  ·  ${agent.runs} runs, ${agent.trades} trades`,
    `Built by ${agent.builderName}  ·  ${agent.nodes} nodes`,
    `Try it for free now: getnick.ai`,
  ].join("\n");
}
