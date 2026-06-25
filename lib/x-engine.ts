// Client-safe shapes + constants for the X engine surfaces. NO node:fs here —
// this module is imported by client components (the switchers), so the fs
// readers live in lib/x-engine-data.ts (server-only).

export type XSignal = {
  id: string;
  source: string;
  title: string;
  url: string;
  topics: string[];
  score: number;
  velocity: number;
  relevance: number;
  created_at: string;
};

export type XDraft = {
  id: number;
  target_account: string | null;
  text: string;
  char_count: number;
  hook_type: string | null;
  format: string;
  angle: string | null;
  rationale: string | null;
  predicted_virality: number | null;
  status: string;
  created_at: string;
  signal_title: string | null;
  signal_url: string | null;
};

export type XPost = {
  id: string;
  account_username: string | null;
  text: string;
  impression_count: number | null;
  like_count: number | null;
  retweet_count: number | null;
  reply_count: number | null;
  bookmark_count: number | null;
  quote_count: number | null;
  virality_score: number | null;
  reach_ratio: number | null;
  reach_bucket: string | null;
  has_attachment: number | null;
  is_reply: number | null;
  posted_at: string;
};

export const X_MANAGED_ACCOUNTS = ["getnickai", "swarmarena"] as const;

// --- Agentic Drop (daily IG-carousel from a bookmark folder) ---

/** Slide media + branding produced by the build-slides pipeline. `image` is the
 *  background (real photo or generated); `logo_images` are overlay bubbles. */
type LogoImage = { domain: string; path: string };
type WithImage = {
  image_prompt?: string;
  image?: string;
  /** Optional accent-ringed circular cutout of a secondary related image (top-right). */
  inset?: string;
  subtitle?: string;
  logo_images?: LogoImage[];
  art?: unknown;
  /** CSS object-position for the bg image (e.g. "50% 35%") — focus the subject/faces. */
  focus?: string;
  /** Scale the bg image to crop in on the focus point (e.g. 1.4) — useful for real photos. */
  zoom?: number;
  /** CSS brightness multiplier for the bg image (e.g. 1.3) — lift dark generations. */
  brightness?: number;
};

export type XDropSlide =
  | ({
      kind: "cover";
      kicker: string;
      date: string;
      headline: string;
      logos: string[];
    } & WithImage)
  | ({
      kind: "story";
      index: number;
      headline: string;
      body: string;
      accent: "lime" | "orange" | "blue";
      source: { handle: string; name: string };
      metrics: {
        impression_count: number;
        like_count: number;
        bookmark_count: number;
      };
    } & WithImage)
  | ({
      kind: "outro";
      headline: string;
      body: string;
      cta: string;
    } & WithImage);

export type XDrop = {
  generated_at?: string;
  /** Edition date (YYYY-MM-DD). Set by the archive step; used by the history view. */
  date?: string;
  edition: string;
  source_folder: string;
  brand_mark?: string;
  /** Brand accent (hex) for keyword color-pop + SWIPE cue. Defaults to Claude coral. */
  accent?: string;
  slides: XDropSlide[];
  caption?: string;
};
