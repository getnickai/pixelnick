import { validSocialRenderOptions, type SocialRenderOptions } from '../../social-video';

/** Version-2 wire contract mirrors ops-reposters-v2/src/lib/organic/story.ts. */
export const DESK_VENUES = ['Coinbase', 'Hyperliquid', 'OKX', 'Polymarket', 'Kalshi', 'Alpaca', 'Revolut', 'Trade[XYZ]'] as const;
type Venue = typeof DESK_VENUES[number];
interface DeskItem { label: string; detail: string }
interface ModelReview { name: string; focus: string; reply: string }
interface Quote { venue: 'Polymarket' | 'Kalshi'; ask_cents: number }
type Trio<T> = [T, T, T];

export interface TradingDeskProps extends Record<string, unknown> {
  render_options?: SocialRenderOptions;
  version: 2;
  category: string;
  hook: string;
  prompt: string;
  venues: Venue[];
  context: { title: string; items: Trio<DeskItem> };
  comparison: { title: string; yes: Quote; no: Quote } | null;
  review: { title: string; models: Trio<ModelReview> | null; verdict: string };
  workflow: { title: string; steps: Trio<DeskItem> };
  result: { delivery: 'workspace' | 'telegram'; title: string; rows: Trio<DeskItem> };
  payoff: string;
}

/** The workflow follows the comparison venues, not unrelated connected accounts. */
export function deskSources(story: TradingDeskProps): Venue[] {
  return story.comparison ? [story.comparison.yes.venue, story.comparison.no.venue] : story.venues.slice(0, 2);
}

/** Reject incomplete inputs before Remotion merges gallery defaults into a real post. */
export function validTradingDesk(value: unknown): value is TradingDeskProps {
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const line = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\r\n]|https?:\/\/|[<>]/i.test(v);
  const trio = (v: unknown, check: (item: unknown) => boolean) => Array.isArray(v) && v.length === 3 && v.every(check);
  const item = (v: unknown) => object(v) && line(v.label, 28) && line(v.detail, 112);
  const model = (v: unknown) => object(v) && line(v.name, 32) && line(v.focus, 28) && line(v.reply, 136);
  const quote = (v: unknown): v is Quote => object(v) && (v.venue === 'Polymarket' || v.venue === 'Kalshi') && typeof v.ask_cents === 'number' && Number.isInteger(v.ask_cents) && v.ask_cents >= 1 && v.ask_cents <= 99;
  if (!object(value) || !validSocialRenderOptions(value.render_options, 25) || value.version !== 2 || !line(value.category, 32) || !line(value.hook, 56) || !line(value.prompt, 150)
    || !Array.isArray(value.venues) || value.venues.length < 1 || value.venues.length > 6 || new Set(value.venues).size !== value.venues.length
    || !value.venues.every((v) => DESK_VENUES.includes(v))
    || !object(value.context) || !line(value.context.title, 80) || !trio(value.context.items, item)
    || !object(value.review) || !line(value.review.title, 64) || !line(value.review.verdict, 80)
    || !(value.review.models === null || trio(value.review.models, model))
    || !object(value.workflow) || !line(value.workflow.title, 64) || !trio(value.workflow.steps, item)
    || !object(value.result) || !['workspace', 'telegram'].includes(String(value.result.delivery)) || !line(value.result.title, 56) || !trio(value.result.rows, item)
    || !line(value.payoff, 48)) return false;
  if (value.review.models !== null) {
    const names = (value.review.models as ModelReview[]).map((m) => m.name);
    if (new Set(names).size !== names.length) return false;
  }
  if (value.comparison === null) return true;
  return object(value.comparison) && line(value.comparison.title, 80) && quote(value.comparison.yes) && quote(value.comparison.no)
    && value.comparison.yes.venue !== value.comparison.no.venue
    && value.venues.includes(value.comparison.yes.venue) && value.venues.includes(value.comparison.no.venue);
}

// Illustrative gallery example only. API callers must supply every field, including explicit nulls.
export const tradingDeskDefaultProps: TradingDeskProps = {
  version: 2,
  category: 'USA MIDTERMS',
  hook: 'hold up. 94¢ for both sides?',
  prompt: 'find me a cool arbitrage on Polymarket vs Kalshi on USA Mid Terms',
  venues: ['Coinbase', 'Hyperliquid', 'OKX', 'Polymarket', 'Kalshi', 'Alpaca'],
  context: { title: 'USA midterms: the two-market setup', items: [
    { label: 'The event', detail: 'Republican House control after the 2026 US midterms.' },
    { label: 'The gap', detail: 'Illustrative YES and NO asks across two prediction venues.' },
    { label: 'The checks', detail: 'Match settlement terms, then inspect fees and available size.' },
  ] },
  comparison: { title: 'Republican House control after the midterms?', yes: { venue: 'Polymarket', ask_cents: 54 }, no: { venue: 'Kalshi', ask_cents: 40 } },
  review: { title: 'DO WE EXECUTE THE TRADE 🤑?', models: [
    { name: 'GPT ASTRA MAX', focus: 'Price imbalance', reply: "The books are out of sync. 54¢ + 40¢ = 94¢. That's a 6¢ gross gap before fees. Interesting." },
    { name: 'GEMINI 3.7 PRO', focus: 'Depth + slippage', reply: "Check depth on both legs. If that 40¢ ask vanishes at size, slippage eats the gap. Don't get legged." },
    { name: 'CLAUDE FABLE 5.1 MAX', focus: 'Settlement rules', reply: 'Same election, same contract? House control can settle on different rules. Read the fine print before we send it.' },
  ], verdict: 'ONLY IF BOTH LEGS CHECK OUT.' },
  workflow: { title: 'USA MIDTERMS · ARBITRAGE HUNT', steps: [
    { label: 'Scan both markets', detail: 'Fetch the paired event and available quotes.' },
    { label: 'Do we execute?', detail: 'Check settlement, fees and size on both legs.' },
    { label: 'Telegram candidate', detail: 'Send the candidate and checks for review.' },
  ] },
  result: { delivery: 'telegram', title: 'US midterms candidate flagged', rows: [
    { label: 'Price imbalance', detail: '54¢ YES + 40¢ NO = 94¢ in this example.' },
    { label: 'Depth + slippage', detail: 'Confirm available fills on both legs.' },
    { label: 'Settlement rules', detail: 'Verify matching resolution before acting.' },
  ] },
  payoff: 'keep scanning.',
};
