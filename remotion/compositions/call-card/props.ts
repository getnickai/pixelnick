/**
 * Props for the Call Card: a public call on a market, with an optional trade.
 * status "open" is the call; "right" / "wrong" is the receipt after it resolves.
 * The receipt shows entry vs settlement prices only, never a P&L or return
 * figure (content guide: no return, profit or win claims).
 */
export type CallCardProps = {
  question: string;
  market: {
    source: "Polymarket" | "Price";
    /** e.g. "Anthropic closes day one above $1.5T". */
    label: string;
    /** 0–1 for a probability, a price for usd. */
    oddsAtCall: number;
    unit?: "prob" | "usd";
  };
  call: { side: string; /** ≤140 chars. */ thesis: string };
  trade?: { kind: "paper" | "live"; venue: string; side: string; entry: number; size?: string };
  /** Display strings, e.g. "Nov 16, 14:00 UTC". */
  calledAt: string;
  resolvesAt: string;
  status: "open" | "right" | "wrong";
  resolution?: { outcome: string; at: string; finalValue?: number };
  workflowName?: string;
  link?: string;
  cta: string;
};

export const CALL_CARD_SIZE = [1080, 1080] as const;

export const callCardDefaultProps: CallCardProps = {
  question: "Anthropic's day-one close above $1.5T?",
  market: { source: "Polymarket", label: "Above $1.5T on day one", oddsAtCall: 0.45, unit: "prob" },
  call: { side: "NO", thesis: "Sample thesis: the book is thin above $1.25T and the comps trade lower." },
  trade: { kind: "paper", venue: "Polymarket", side: "NO", entry: 0.55, size: "$100" },
  calledAt: "Nov 16, 14:00 UTC",
  resolvesAt: "Nov 19 close",
  status: "open",
  workflowName: "Anthropic IPO Watch",
  cta: "Make your own call, try Nick for free",
};
