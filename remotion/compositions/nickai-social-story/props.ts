/** Wire contract mirrors ops-reposters-v2/src/lib/organic/story.ts. */
interface StoryItem { label: string; detail: string }
type Pair = [string, string];
type Trio<T> = [T, T, T];
export interface SocialStoryProps extends Record<string, unknown> {
  version: 1;
  category: string;
  hook: Pair;
  questions: Trio<string>;
  example: { title: string; items: Trio<StoryItem> };
  workflow: { title: Pair; steps: Trio<StoryItem> };
  result: { title: Pair; label: string; rows: Trio<StoryItem> };
  payoff: Pair;
  stamp: string;
  prompt: string;
}

/** Validate API inputs before Remotion can merge gallery defaults into a real post. */
export function validSocialStory(value: unknown): value is SocialStoryProps {
  const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
  const line = (v: unknown, max: number): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max && !/[\r\n]|https?:\/\/|[<>]/i.test(v);
  const list = (v: unknown, n: number, check: (item: unknown) => boolean) => Array.isArray(v) && v.length === n && v.every(check);
  const pair = (v: unknown) => list(v, 2, (s) => line(s, 22));
  const item = (v: unknown) => object(v) && line(v.label, 24) && line(v.detail, 72);
  return object(value) && value.version === 1 && line(value.category, 24) && pair(value.hook)
    && list(value.questions, 3, (s) => line(s, 28))
    && object(value.example) && line(value.example.title, 48) && list(value.example.items, 3, item)
    && object(value.workflow) && pair(value.workflow.title) && list(value.workflow.steps, 3, item)
    && object(value.result) && pair(value.result.title) && line(value.result.label, 26) && list(value.result.rows, 3, item)
    && pair(value.payoff) && line(value.stamp, 16) && line(value.prompt, 110);
}

// Gallery example only. Render API calls must supply every field themselves.
export const socialStoryDefaultProps: SocialStoryProps = {
  version: 1,
  category: 'PREDICTION MARKETS',
  hook: ['Your Polymarket', 'rabbit hole.'],
  questions: ['What is the question?', 'What resolves it?', 'Which sources?'],
  example: {
    title: 'A headline is just the start.',
    items: [
      { label: 'The question', detail: 'Find the prediction markets behind a headline.' },
      { label: 'The rules', detail: 'Read what counts as a resolved outcome.' },
      { label: 'The context', detail: 'Research the story behind the market.' },
    ],
  },
  workflow: {
    title: ['Send Nick', 'down the hole.'],
    steps: [
      { label: 'Polymarket search', detail: 'Start with your headline.' },
      { label: 'AI research', detail: 'Read the supporting context.' },
      { label: 'Telegram brief', detail: 'Bring the research together.' },
    ],
  },
  result: {
    title: ['The rabbit hole.', 'In one brief.'],
    label: 'Example research brief',
    rows: [
      { label: 'Market question', detail: 'Which outcome does the market actually ask about?' },
      { label: 'Resolution check', detail: 'What source and deadline determine the outcome?' },
      { label: 'Context to read', detail: 'Read the supporting news before making your decision.' },
    ],
  },
  payoff: ['Your next', 'rabbit hole.'],
  stamp: 'Automated.',
  prompt: 'Research Polymarket markets behind a headline. Send me a Telegram brief.',
};
