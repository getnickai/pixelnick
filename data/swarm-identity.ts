/**
 * Swarm Arena — design-owned agent identity registry.
 *
 * Branding (avatar code, model label, provider, flag, brand hue, llm vs
 * ensemble) is OURS, not the agent's. Agents only emit performance data
 * (see `swarm-output.ts`); we merge it onto this registry to build a full
 * card object. That keeps brand colours and labels consistent no matter what
 * an agent writes, and shrinks the contract the agents have to honour.
 *
 * Values lifted verbatim from the share-card engine's AGENTS constant
 * (public/swarm-arena-cards/card-engine.js), which is the design source of
 * truth. Keep this in sync if the engine's roster changes.
 *
 * `handle` is the stable join key between this registry and a snapshot.
 */
export type AgentKind = "llm" | "ensemble";

export type SwarmAgentIdentity = {
  /** Stable uppercase id, e.g. "GROK". Join key with the bucket snapshot. */
  handle: string;
  /** 2-3 char monogram shown in the avatar, e.g. "GRK". */
  code: string;
  /** Full model name, e.g. "Grok 4". */
  label: string;
  /** Short display name, e.g. "Grok". */
  short: string;
  /** Provider / org, e.g. "xAI". For ensembles, the member list. */
  provider: string;
  /** Flag emoji for the agent's home country. */
  flag: string;
  /** Brand hue (hex) used for the avatar tint and pick side colour. */
  color: string;
  /** "llm" for a single model, "ensemble" for a multi-model swarm. */
  kind: AgentKind;
};

export const SWARM_AGENT_IDENTITY: Record<string, SwarmAgentIdentity> = {
  GROK:      { handle: "GROK",      code: "GRK", label: "Grok 4",          short: "Grok",     provider: "xAI",                          flag: "🇺🇸", color: "#b9a07a", kind: "llm" },
  CLAUDE:    { handle: "CLAUDE",    code: "CL",  label: "Claude Opus 4.5", short: "Claude",   provider: "Anthropic",                    flag: "🇺🇸", color: "#cc785c", kind: "llm" },
  MISTRAL:   { handle: "MISTRAL",   code: "MST", label: "Mistral Large 3", short: "Mistral",  provider: "Mistral AI",                   flag: "🇫🇷", color: "#d9772f", kind: "llm" },
  GEMINI:    { handle: "GEMINI",    code: "GEM", label: "Gemini 3 Pro",    short: "Gemini",   provider: "Google DeepMind",              flag: "🇺🇸", color: "#6f8fd6", kind: "llm" },
  TEAMUSA:   { handle: "TEAMUSA",   code: "USA", label: "Team USA",        short: "USA",      provider: "GPT · Gemini · Grok · Claude", flag: "🇺🇸", color: "#3c5aa6", kind: "ensemble" },
  QWEN:      { handle: "QWEN",      code: "QW",  label: "Qwen3 Max",       short: "Qwen",     provider: "Alibaba",                      flag: "🇨🇳", color: "#7c5cff", kind: "llm" },
  DEEPSEEK:  { handle: "DEEPSEEK",  code: "DS",  label: "DeepSeek V3",     short: "DeepSeek", provider: "DeepSeek",                     flag: "🇨🇳", color: "#5570e6", kind: "llm" },
  TEAMCHINA: { handle: "TEAMCHINA", code: "CHN", label: "Team China",      short: "China",    provider: "DeepSeek · Qwen · Kimi", flag: "🇨🇳", color: "#cf3a44", kind: "ensemble" },
  KIMI:      { handle: "KIMI",      code: "KMI", label: "Kimi K2",         short: "Kimi",     provider: "Moonshot AI",                  flag: "🇨🇳", color: "#9b7bd4", kind: "llm" },
  GPT:       { handle: "GPT",       code: "GPT", label: "GPT-5.1",         short: "GPT",      provider: "OpenAI",                       flag: "🇺🇸", color: "#a89a86", kind: "llm" },
};

/**
 * Backend → brand handle aliases. The agent backend still emits some legacy
 * handles for agents we've since rebranded — e.g. the R2 match-reader agent is
 * still `s1-match-reader-minimax`, but the brand is Mistral now. This is the
 * ONE place that knows "minimax means mistral"; normalize every raw handle
 * through `canonicalHandle()` at each ingestion boundary so the rest of the
 * system only ever sees the brand handle. When the backend rename lands, delete
 * the alias here and nothing else changes.
 */
export const HANDLE_ALIASES: Record<string, string> = { MINIMAX: "MISTRAL" };

/** Resolve a raw backend handle to its canonical brand handle (uppercased). */
export function canonicalHandle(handle: string): string {
  const h = (handle || "").toUpperCase();
  return HANDLE_ALIASES[h] ?? h;
}

/** Look up identity by handle (case-insensitive, alias-normalized). Undefined if unknown. */
export function identityFor(handle: string): SwarmAgentIdentity | undefined {
  return SWARM_AGENT_IDENTITY[canonicalHandle(handle)];
}
