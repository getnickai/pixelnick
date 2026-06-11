/**
 * Sample Swarm Arena deck — the fictional 11-agent design roster, ported
 * verbatim from the card engine's baked data (public/swarm-arena-cards/
 * card-engine.js AGENTS) so the Engine kit's "Sample" mode and the static
 * HTML kit show the same universe. Rich on purpose: win/loss streaks,
 * ensembles, abstains — shapes the real early-season data can't exercise.
 *
 * Keep in sync with the engine block if the design fixtures evolve.
 */
import type { EngineAgent } from "./swarm-output";

export const SAMPLE_SWARM_AGENTS: EngineAgent[] = [
  {
    handle: "GROK", code: "GRK", label: "Grok 4", short: "Grok", provider: "xAI", flag: "🇺🇸", color: "#b9a07a", kind: "llm",
    roiPct: 18.4, pickPct: 0.71, signals: 24, nextRun: "4h 12m", activeSince: "May 28, 2026",
    spark: [1000, 1012, 1006, 1031, 1058, 1044, 1079, 1095, 1112, 1138, 1160, 1184],
    pick: { market: "Both teams to score", side: "BACK Yes @ 0.58", edgePp: 3.2 },
    streak: "W4", lastTrade: { pnl: 38, ago: "2h" },
    recent: [
      { market: "Match winner", side: "BACK PSG @ 0.44", pnl: 38 },
      { market: "Anytime scorer", side: "Dembélé @ 0.49", pnl: 21 },
      { market: "Total goals", side: "Over 2.5 @ 0.52", pnl: -14 },
    ],
  },
  {
    handle: "CLAUDE", code: "CL", label: "Claude Opus 4.5", short: "Claude", provider: "Anthropic", flag: "🇺🇸", color: "#cc785c", kind: "llm",
    roiPct: 14.2, pickPct: 0.69, signals: 22, nextRun: "1h 47m", activeSince: "May 28, 2026",
    spark: [1000, 1018, 1009, 1027, 1041, 1063, 1052, 1078, 1090, 1106, 1128, 1142],
    pick: { market: "Match winner 3-way", side: "BACK ARS @ 0.29", edgePp: 4.3 },
  },
  {
    handle: "MISTRAL", code: "MST", label: "Mistral Large 3", short: "Mistral", provider: "Mistral AI", flag: "🇫🇷", color: "#d9772f", kind: "llm",
    roiPct: 9.7, pickPct: 0.64, signals: 18, nextRun: "6h 03m", activeSince: "May 28, 2026",
    spark: [1000, 1006, 1021, 1014, 1033, 1027, 1048, 1041, 1062, 1071, 1085, 1097],
    pick: { market: "Correct score · 2-1 PSG", side: "BACK @ 0.11", edgePp: 4.8 },
  },
  {
    handle: "GEMINI", code: "GEM", label: "Gemini 3 Pro", short: "Gemini", provider: "Google DeepMind", flag: "🇺🇸", color: "#6f8fd6", kind: "llm",
    roiPct: 7.3, pickPct: 0.62, signals: 20, nextRun: "2h 31m", activeSince: "May 28, 2026",
    spark: [1000, 1010, 1004, 1022, 1015, 1034, 1028, 1047, 1039, 1058, 1066, 1073],
    pick: { market: "Anytime scorer · Dembélé", side: "BACK @ 0.49", edgePp: 5.8 },
  },
  {
    handle: "TEAMUSA", code: "USA", label: "Team USA", short: "USA", provider: "GPT · Gemini · Grok · Claude", flag: "🇺🇸", color: "#3c5aa6", kind: "ensemble",
    roiPct: 5.1, pickPct: 0.6, signals: 31, nextRun: "47m", activeSince: "May 28, 2026",
    spark: [1000, 1008, 1003, 1016, 1011, 1024, 1019, 1031, 1027, 1040, 1046, 1051],
    pick: { market: "Match winner 3-way", side: "BACK PSG @ 0.44", edgePp: 0.6 },
  },
  {
    handle: "QWEN", code: "QW", label: "Qwen3 Max", short: "Qwen", provider: "Alibaba", flag: "🇨🇳", color: "#7c5cff", kind: "llm",
    roiPct: 3.8, pickPct: 0.58, signals: 17, nextRun: "3h 19m", activeSince: "May 28, 2026",
    spark: [1000, 1005, 1012, 1007, 1018, 1013, 1024, 1019, 1029, 1026, 1034, 1038],
    pick: { market: "Anytime scorer · Mbappé", side: "BACK @ 0.36", edgePp: 2.4 },
  },
  {
    handle: "DEEPSEEK", code: "DS", label: "DeepSeek V3", short: "DeepSeek", provider: "DeepSeek", flag: "🇨🇳", color: "#5570e6", kind: "llm",
    roiPct: 1.9, pickPct: 0.57, signals: 19, nextRun: "5h 22m", activeSince: "May 28, 2026",
    spark: [1000, 1004, 999, 1010, 1006, 1014, 1009, 1017, 1013, 1020, 1016, 1019],
    pick: { market: "Total goals", side: "BACK Under 2.5 @ 0.39", edgePp: 4.1 },
  },
  {
    handle: "TEAMCHINA", code: "CHN", label: "Team China", short: "China", provider: "DeepSeek · Qwen · Kimi · GLM", flag: "🇨🇳", color: "#cf3a44", kind: "ensemble",
    roiPct: 0.4, pickPct: 0.55, signals: 29, nextRun: "1h 09m", activeSince: "May 28, 2026",
    spark: [1000, 1006, 1001, 1009, 1003, 1011, 1005, 1010, 1004, 1009, 1006, 1004],
    pick: { market: "Total goals", side: "BACK Under 2.5 @ 0.39", edgePp: 3.5 },
  },
  {
    handle: "KIMI", code: "KMI", label: "Kimi K2", short: "Kimi", provider: "Moonshot AI", flag: "🇨🇳", color: "#9b7bd4", kind: "llm",
    roiPct: -2.6, pickPct: 0.52, signals: 15, nextRun: "8h 41m", activeSince: "May 28, 2026",
    spark: [1000, 1007, 1001, 994, 1003, 996, 988, 994, 985, 990, 982, 974],
    pick: { market: "Method · penalties", side: "BACK PSG pens @ 0.14", edgePp: 6.7 },
  },
  {
    handle: "GLM", code: "GLM", label: "GLM-4.6", short: "GLM", provider: "Zhipu AI", flag: "🇨🇳", color: "#4f78e0", kind: "llm",
    roiPct: -5.8, pickPct: 0.49, signals: 14, nextRun: "7h 55m", activeSince: "May 28, 2026",
    spark: [1000, 996, 1003, 994, 988, 996, 985, 978, 984, 972, 966, 942],
    pick: { market: "Match winner 3-way", side: "ABSTAIN", edgePp: 0.0 },
  },
  {
    handle: "GPT", code: "GPT", label: "GPT-5.1", short: "GPT", provider: "OpenAI", flag: "🇺🇸", color: "#a89a86", kind: "llm",
    roiPct: -9.3, pickPct: 0.47, signals: 21, nextRun: "2h 58m", activeSince: "May 28, 2026",
    spark: [1000, 1011, 994, 1002, 985, 991, 972, 980, 961, 950, 935, 907],
    pick: { market: "Match winner 3-way", side: "BACK PSG @ 0.44", edgePp: 2.1 },
    streak: "L3", lastTrade: { pnl: -42, ago: "3h" },
    recent: [
      { market: "Match winner", side: "BACK ARS @ 0.31", pnl: -42 },
      { market: "Both teams score", side: "Yes @ 0.58", pnl: -18 },
      { market: "Total goals", side: "Under 2.5 @ 0.39", pnl: 12 },
    ],
  },
];
