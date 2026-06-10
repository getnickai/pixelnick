/**
 * Trading-card deck builder — the live counterpart to `lib/swarm-deck.ts`,
 * for NickAI trading agents.
 *
 * Reads the trading agents' R2 output and maps it to the deck shape the
 * performance-card consumes (an array of `PerformanceCardProps`, the exact
 * props the Remotion composition / `<Player>` / `<Thumbnail>` take). This is
 * the single seam between the R2 output schema and the card props: it reuses
 * `toCardDataFromR2()`, the same mapping the offline generation pipeline
 * (`scripts/generate-cards.ts`) uses — so the live preview and the generated
 * PNG/MP4 are fed identical data.
 *
 * R2 layout (per agent, under `nickai/agents/`):
 *   nickai/agents/<workflowId>/profile.json    → AgentProfile
 *   nickai/agents/<workflowId>/snapshot.json    → AgentSnapshot (canonical "now")
 *   nickai/agents/<workflowId>/runs/<date>/<executionId>.json   → execution logs
 *
 * Note: the per-run files are execution logs (indicators, trade decisions),
 * NOT cumulative performance snapshots — they carry no running pnl / profit %.
 * So a swarm-style point-in-time (`?at`) timeline is not faithfully derivable
 * here yet; the deck reflects each agent's current snapshot. Point-in-time
 * history needs the trading feed to emit cumulative per-run snapshots (tracked
 * as a follow-up).
 *
 * Server-side only (uses R2 read credentials from env); never imported into a
 * client bundle.
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { toCardDataFromR2, type AgentProfile, type AgentSnapshot } from "../data/agent-output";
import type { AgentCardData } from "../data/mock-agents";

const BUCKET = "nickai-swarmarena-internal";

/** Hosts whose avatars the same-origin proxy (`/api/avatar`) will serve. Keep
 *  in sync with the allowlist in `app/api/avatar/route.ts`. */
const PROXIED_AVATAR_HOSTS = ["nickai-user-uploads.s3.us-east-1.amazonaws.com"];

/**
 * Route a remote, CORS-less builder avatar through our same-origin proxy so the
 * in-browser PNG export can read its pixels. Local paths (e.g. the default
 * `/figma/...`) and non-allowlisted hosts pass through untouched.
 */
function proxiedAvatar(url: string): string {
  try {
    const u = new URL(url);
    if (PROXIED_AVATAR_HOSTS.includes(u.hostname)) {
      return `/api/avatar?url=${encodeURIComponent(url)}`;
    }
  } catch {
    /* relative/local path — leave as-is */
  }
  return url;
}

/** Same S3/R2 client shape proven by lib/swarm-deck.ts against this bucket. */
function client(): S3Client {
  return new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.AWS_REGION ?? "auto",
    forcePathStyle: Boolean(process.env.S3_ENDPOINT),
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
    },
  });
}

async function getJson<T>(c: S3Client, key: string): Promise<T | null> {
  try {
    const res = await c.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return JSON.parse(await res.Body!.transformToString()) as T;
  } catch {
    return null;
  }
}

async function listKeys(c: S3Client, prefix: string): Promise<string[]> {
  const out: string[] = [];
  let token: string | undefined;
  do {
    const page = await c.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix, ContinuationToken: token }),
    );
    for (const o of page.Contents ?? []) if (o.Key) out.push(o.Key);
    token = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (token);
  return out;
}

/** One deck agent: the card props plus its stable R2 workflow id, used as a
 *  unique key (agent names — hence slugs — can collide across workflows). */
export type TradingDeckAgent = AgentCardData & { id: string };

export type TradingDeck = {
  _generatedFrom: string;
  /** ISO instant the deck reflects, or null for "live / now". */
  at: string | null;
  agents: TradingDeckAgent[];
};

/**
 * Read R2 and build the live trading deck. Server-side only.
 * Agents are sorted by profit % descending (leaderboard order). Agents missing
 * a profile or snapshot are skipped; the junk empty-id key written by the feed
 * (`nickai/agents//…`) is filtered out.
 */
export async function buildTradingDeck(opts: { prefix?: string } = {}): Promise<TradingDeck> {
  const BASE = (opts.prefix ?? process.env.TRADING_AGENTS_PREFIX ?? "nickai/agents/").replace(/\/?$/, "/");
  const c = client();
  const all = await listKeys(c, BASE);

  const agentIds = [
    ...new Set(all.map((k) => k.slice(BASE.length).split("/")[0]).filter(Boolean)),
  ].filter((id) => all.includes(`${BASE}${id}/snapshot.json`));

  const now = new Date();
  const agents: TradingDeckAgent[] = [];
  for (const id of agentIds) {
    const prefix = `${BASE}${id}/`;
    const profile = await getJson<AgentProfile>(c, `${prefix}profile.json`);
    const snapshot = await getJson<AgentSnapshot>(c, `${prefix}snapshot.json`);
    if (!profile || !snapshot) continue;
    const card = toCardDataFromR2(profile, snapshot, now);
    card.builderAvatar = proxiedAvatar(card.builderAvatar);
    agents.push({ ...card, id });
  }

  agents.sort((a, b) => b.profitPercent - a.profitPercent);

  return {
    _generatedFrom: `s3://${BUCKET}/${BASE}`,
    at: null,
    agents,
  };
}
