/**
 * One-off: post a rendered card PNG to a Slack channel via the existing
 * bot-token uploader. Token from SLACK_BOT_TOKEN (.env.local).
 *   bun scripts/post-card.ts <png> <channelId>
 */
import { slackTokenFromEnv, postCardToSlack } from "./slack";

const [png, channelId] = process.argv.slice(2);
const token = slackTokenFromEnv();
if (!token) { console.error("SLACK_BOT_TOKEN not set"); process.exit(1); }
if (!png || !channelId) { console.error("usage: post-card.ts <png> <channelId>"); process.exit(1); }

const caption = [
  "*S1 Match Reader (Chat GPT)* · Swarm Arena agent card (editorial)",
  "Rendered via the Remotion pipeline from live R2 data (wfl_vlbkalq5rn9b).",
  "Top pick: Mexico v South Africa, Away, +10.0pp edge.",
  "ROI +0.0% on a $1,000 shadow bankroll. 5 picks placed, none settled yet.",
  "Note: ROI and equity are near flat (agent just started); pick accuracy shown is a sharp-agreement proxy until bets settle.",
].join("\n");

const res = await postCardToSlack(
  { token, channelId },
  { slug: "s1-match-reader-editorial" } as any,
  { png },
  caption,
);
console.log(`Posted. permalink: ${res.permalink ?? "(none returned)"}`);
