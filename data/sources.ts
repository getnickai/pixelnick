/**
 * Multi-source configuration.
 *
 * The pipeline supports any number of named sources (e.g. "nickai",
 * "swarm-arena"). Each source has its own R2 prefix, Slack channel, and
 * Top-N — they share nothing but the rendering code, so state never bleeds
 * across sources (per-source pull-log watermark, per-source ledger key
 * prefix, per-source output folder).
 *
 * Configured purely from env so credentials and channels live in `.env.local`
 * / a secrets manager, not in committed files. Set `SOURCES=nickai,swarm-arena`
 * and then per-source vars `R2_FEED_<NAME>`, `SLACK_CHANNEL_<NAME>`, `TOP_N_<NAME>`,
 * `SOURCE_LABEL_<NAME>` (hyphens in the source name become underscores, all
 * uppercase: "swarm-arena" -> "SWARM_ARENA").
 */
export type Source = {
  /** Internal id used in filenames + ledger keys. */
  name: string;
  /** Human label used in Slack captions, e.g. "NickAI" or "Swarm Arena". */
  label: string;
  /** R2 prefix to list, e.g. "s3://nickai-cards-feed/nickai/agents/". */
  r2Prefix: string;
  /** Slack channel id this source's cards post to. */
  slackChannelId: string;
  /** Top N agents to rank and render per pull. */
  topN: number;
};

function envKey(name: string): string {
  return name.replace(/-/g, "_").toUpperCase();
}

function defaultLabel(name: string): string {
  if (name.toLowerCase() === "nickai") return "NickAI";
  return name
    .split(/[-_]/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

/**
 * Resolve the list of configured sources.
 *
 * Precedence:
 *   1. `SOURCES=a,b,c` env → multi-source mode (per-source env vars required).
 *   2. `R2_AGENTS_PREFIX` set (no SOURCES) → single legacy source named "default"
 *      using SLACK_CHANNEL_ID and TOP_N. Keeps pre-multi-source configs working.
 *   3. Neither set → empty list (the generator falls back to curated --data /
 *      mock mode).
 */
export function loadSources(): Source[] {
  const names = (process.env.SOURCES ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (names.length === 0 && process.env.R2_AGENTS_PREFIX) {
    return [
      {
        name: "default",
        label: process.env.SOURCE_LABEL_DEFAULT ?? "NickAI",
        r2Prefix: process.env.R2_AGENTS_PREFIX,
        slackChannelId: process.env.SLACK_CHANNEL_ID ?? "",
        topN: Number(process.env.TOP_N ?? 5) || 5,
      },
    ];
  }

  return names.map((name) => {
    const key = envKey(name);
    const r2Prefix = process.env[`R2_FEED_${key}`];
    if (!r2Prefix) {
      throw new Error(
        `Source "${name}" is listed in SOURCES but R2_FEED_${key} is not set.`,
      );
    }
    const slackChannelId =
      process.env[`SLACK_CHANNEL_${key}`] ?? process.env.SLACK_CHANNEL_ID ?? "";
    const topN =
      Number(process.env[`TOP_N_${key}`] ?? process.env.TOP_N ?? 5) || 5;
    const label = process.env[`SOURCE_LABEL_${key}`] ?? defaultLabel(name);
    return { name, label, r2Prefix, slackChannelId, topN };
  });
}
