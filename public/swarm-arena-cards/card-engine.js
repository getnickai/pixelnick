/* ──────────────────────────────────────────────────────────────────────────
   Swarm Arena — Share Card ENGINE  (vanilla, framework-free)
   window.SA = { AGENTS, MATCH, LEADERBOARD, renderAgentCard, renderMatchCard,
                 renderLeaderboardCard, mount }
   Every renderer takes a plain data object → returns an HTML string. Swap the
   data, get a new card. This is the templating layer for "plug real data in".
   ──────────────────────────────────────────────────────────────────────── */
(function () {
  const BASE = 1000; // $1,000 starting capital
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const fmt$ = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const signOf = (n) => (n > 0 ? 1 : n < 0 ? -1 : 0);
  const roiCls = (n) => (n > 0 ? "pos" : n < 0 ? "neg" : "zero");
  const pct = (n, d = 1) => (n > 0 ? "+" : "") + n.toFixed(d) + "%";

  /* ── DATA: 11 agents (Grok leads, GPT last). Real model names + brand hues. ── */
  let AGENTS = [
    { handle: "GROK", code: "GRK", label: "Grok 4", short: "Grok", provider: "xAI", flag: "🇺🇸", color: "#b9a07a", kind: "llm",
      roiPct: 18.4, pickPct: 0.71, signals: 24, nextRun: "4h 12m", activeSince: "May 28, 2026",
      spark: [1000, 1012, 1006, 1031, 1058, 1044, 1079, 1095, 1112, 1138, 1160, 1184],
      pick: { market: "Both teams to score", side: "BACK Yes @ 0.58", edgePp: 3.2 }, streak: "W4", lastTrade: { pnl: 38, ago: "2h" },
      recent: [ { market: "Match winner", side: "BACK PSG @ 0.44", pnl: 38 }, { market: "Anytime scorer", side: "Dembélé @ 0.49", pnl: 21 }, { market: "Total goals", side: "Over 2.5 @ 0.52", pnl: -14 } ] },
    { handle: "CLAUDE", code: "CL", label: "Claude Opus 4.5", short: "Claude", provider: "Anthropic", flag: "🇺🇸", color: "#cc785c", kind: "llm",
      roiPct: 14.2, pickPct: 0.69, signals: 22, nextRun: "1h 47m", activeSince: "May 28, 2026",
      spark: [1000, 1018, 1009, 1027, 1041, 1063, 1052, 1078, 1090, 1106, 1128, 1142],
      pick: { market: "Match winner 3-way", side: "BACK ARS @ 0.29", edgePp: 4.3 } },
    { handle: "MISTRAL", code: "MST", label: "Mistral Large 3", short: "Mistral", provider: "Mistral AI", flag: "🇫🇷", color: "#d9772f", kind: "llm",
      roiPct: 9.7, pickPct: 0.64, signals: 18, nextRun: "6h 03m", activeSince: "May 28, 2026",
      spark: [1000, 1006, 1021, 1014, 1033, 1027, 1048, 1041, 1062, 1071, 1085, 1097],
      pick: { market: "Correct score · 2-1 PSG", side: "BACK @ 0.11", edgePp: 4.8 } },
    { handle: "GEMINI", code: "GEM", label: "Gemini 3 Pro", short: "Gemini", provider: "Google DeepMind", flag: "🇺🇸", color: "#6f8fd6", kind: "llm",
      roiPct: 7.3, pickPct: 0.62, signals: 20, nextRun: "2h 31m", activeSince: "May 28, 2026",
      spark: [1000, 1010, 1004, 1022, 1015, 1034, 1028, 1047, 1039, 1058, 1066, 1073],
      pick: { market: "Anytime scorer · Dembélé", side: "BACK @ 0.49", edgePp: 5.8 } },
    { handle: "TEAMUSA", code: "USA", label: "Team USA", short: "USA", provider: "GPT · Gemini · Grok · Claude", flag: "🇺🇸", color: "#3c5aa6", kind: "ensemble",
      roiPct: 5.1, pickPct: 0.60, signals: 31, nextRun: "47m", activeSince: "May 28, 2026",
      spark: [1000, 1008, 1003, 1016, 1011, 1024, 1019, 1031, 1027, 1040, 1046, 1051],
      pick: { market: "Match winner 3-way", side: "BACK PSG @ 0.44", edgePp: 0.6 } },
    { handle: "QWEN", code: "QW", label: "Qwen3 Max", short: "Qwen", provider: "Alibaba", flag: "🇨🇳", color: "#7c5cff", kind: "llm",
      roiPct: 3.8, pickPct: 0.58, signals: 17, nextRun: "3h 19m", activeSince: "May 28, 2026",
      spark: [1000, 1005, 1012, 1007, 1018, 1013, 1024, 1019, 1029, 1026, 1034, 1038],
      pick: { market: "Anytime scorer · Mbappé", side: "BACK @ 0.36", edgePp: 2.4 } },
    { handle: "DEEPSEEK", code: "DS", label: "DeepSeek V3", short: "DeepSeek", provider: "DeepSeek", flag: "🇨🇳", color: "#5570e6", kind: "llm",
      roiPct: 1.9, pickPct: 0.57, signals: 19, nextRun: "5h 22m", activeSince: "May 28, 2026",
      spark: [1000, 1004, 999, 1010, 1006, 1014, 1009, 1017, 1013, 1020, 1016, 1019],
      pick: { market: "Total goals", side: "BACK Under 2.5 @ 0.39", edgePp: 4.1 } },
    { handle: "TEAMCHINA", code: "CHN", label: "Team China", short: "China", provider: "DeepSeek · Qwen · Kimi · GLM", flag: "🇨🇳", color: "#cf3a44", kind: "ensemble",
      roiPct: 0.4, pickPct: 0.55, signals: 29, nextRun: "1h 09m", activeSince: "May 28, 2026",
      spark: [1000, 1006, 1001, 1009, 1003, 1011, 1005, 1010, 1004, 1009, 1006, 1004],
      pick: { market: "Total goals", side: "BACK Under 2.5 @ 0.39", edgePp: 3.5 } },
    { handle: "KIMI", code: "KMI", label: "Kimi K2", short: "Kimi", provider: "Moonshot AI", flag: "🇨🇳", color: "#9b7bd4", kind: "llm",
      roiPct: -2.6, pickPct: 0.52, signals: 15, nextRun: "8h 41m", activeSince: "May 28, 2026",
      spark: [1000, 1007, 1001, 994, 1003, 996, 988, 994, 985, 990, 982, 974],
      pick: { market: "Method · penalties", side: "BACK PSG pens @ 0.14", edgePp: 6.7 } },
    { handle: "GLM", code: "GLM", label: "GLM-4.6", short: "GLM", provider: "Zhipu AI", flag: "🇨🇳", color: "#4f78e0", kind: "llm",
      roiPct: -5.8, pickPct: 0.49, signals: 14, nextRun: "7h 55m", activeSince: "May 28, 2026",
      spark: [1000, 996, 1003, 994, 988, 996, 985, 978, 984, 972, 966, 942],
      pick: { market: "Match winner 3-way", side: "ABSTAIN", edgePp: 0.0 } },
    { handle: "GPT", code: "GPT", label: "GPT-5.1", short: "GPT", provider: "OpenAI", flag: "🇺🇸", color: "#a89a86", kind: "llm",
      roiPct: -9.3, pickPct: 0.47, signals: 21, nextRun: "2h 58m", activeSince: "May 28, 2026",
      spark: [1000, 1011, 994, 1002, 985, 991, 972, 980, 961, 950, 935, 907],
      pick: { market: "Match winner 3-way", side: "BACK PSG @ 0.44", edgePp: 2.1 }, streak: "L3", lastTrade: { pnl: -42, ago: "3h" },
      recent: [ { market: "Match winner", side: "BACK ARS @ 0.31", pnl: -42 }, { market: "Both teams score", side: "Yes @ 0.58", pnl: -18 }, { market: "Total goals", side: "Under 2.5 @ 0.39", pnl: 12 } ] },
  ];
  let byHandle = Object.fromEntries(AGENTS.map((a) => [a.handle, a]));
  let LEADERBOARD = [...AGENTS].sort((a, b) => b.roiPct - a.roiPct);

  /* ── DATA: the match (PSG vs Arsenal — UCL Final 2026, from lib/matches.ts) ── */
  let MATCH = {
    competition: "UEFA Champions League", stage: "Final", short: "UCL",
    venue: "Puskás Aréna · Budapest", kickoff: "Sat 30 May · 21:00 CEST",
    home: { name: "Paris Saint-Germain", code: "PSG", flag: "🇫🇷", brand: "#0A2156", stripes: ["#0A2156", "#C8102E", "#E8E0D0"] },
    away: { name: "Arsenal", code: "ARS", flag: "🏴", brand: "#EF0107", stripes: ["#EF0107", "#E8E0D0", "#0A2156"] },
    odds: { homePct: 44, drawPct: 27, awayPct: 29, volume24h: 1840000 },
    // averaged swarm view + sharpest individual calls (sorted by edge)
    swarm: { homePct: 43, drawPct: 27, awayPct: 30, agents: 11, backHome: 5, backAway: 2, other: 4 },
    calls: [
      { handle: "KIMI", side: "PSG on pens", market: "Method", edgePp: 6.7 },
      { handle: "GEMINI", side: "Dembélé anytime", market: "Scorer", edgePp: 5.8 },
      { handle: "MISTRAL", side: "2-1 PSG", market: "Correct score", edgePp: 4.8 },
      { handle: "CLAUDE", side: "BACK ARS @ 0.29", market: "Match winner", edgePp: 4.3 },
      { handle: "DEEPSEEK", side: "Under 2.5", market: "Total goals", edgePp: 4.1 },
    ],
  };

  /* ── SVG bits ───────────────────────────────────────────────────────────── */
  function markSVG() {
    return `<svg viewBox="-70 -70 1250 1408" fill="var(--brand)" role="img" aria-label="Swarm Arena"><g transform="translate(-251.017288,1439.573390) scale(0.1,-0.1)">
    <path d="M7970 14391 c-75 -11 -164 -38 -224 -68 -113 -57 -1035 -599 -1086&#xA;-638 -157 -121 -260 -278 -295 -451 -24 -118 -18 -1431 7 -1512 38 -124 114&#xA;-247 194 -316 51 -44 1046 -638 1149 -687 212 -99 440 -105 660 -15 79 32&#xA;1021 587 1143 673 111 78 191 210 234 381 22 86 22 96 19 762 -2 531 -5 690&#xA;-17 745 -27 136 -130 304 -236 384 -68 51 -1061 633 -1155 677 -119 56 -274&#xA;81 -393 65z"></path>
    <path d="M4094 12156 c-108 -25 -170 -57 -634 -331 -250 -147 -498 -293 -550&#xA;-324 -141 -83 -252 -197 -313 -321 -85 -173 -82 -136 -82 -900 0 -758 -3 -726&#xA;75 -885 90 -182 181 -262 523 -456 139 -78 273 -156 298 -173 325 -218 462&#xA;-627 339 -1010 -76 -236 -135 -292 -585 -562 -325 -194 -356 -215 -435 -294&#xA;-165 -166 -200 -255 -211 -540 -14 -368 -11 -1138 5 -1222 38 -196 140 -360&#xA;298 -481 82 -62 968 -579 1093 -638 193 -90 406 -103 575 -35 75 31 1125 646&#xA;1189 697 95 76 188 223 233 371 22 72 22 83 26 728 3 697 0 761 -43 876 -73&#xA;193 -189 299 -555 509 -264 152 -363 220 -447 309 -397 417 -244 1137 288&#xA;1356 298 123 653 56 891 -168 85 -81 137 -149 182 -239 84 -173 87 -192 96&#xA;-663 7 -367 9 -412 29 -485 46 -175 145 -314 296 -415 125 -83 1098 -634 1162&#xA;-657 138 -50 301 -53 439 -8 79 26 1114 621 1202 691 140 112 246 272 277 421&#xA;10 46 15 136 16 273 1 451 13 625 46 721 95 275 324 491 598 565 102 28 306&#xA;30 406 5 632 -159 854 -964 392 -1418 -87 -85 -181 -149 -403 -273 -433 -242&#xA;-574 -396 -619 -680 -13 -77 -14 -930 -1 -1225 10 -259 36 -341 156 -495 65&#xA;-83 92 -100 719 -464 649 -377 657 -380 820 -380 195 0 200 3 892 405 519 302&#xA;541 316 618 393 89 91 134 159 173 268 33 92 40 260 41 968 1 551 -2 580 -80&#xA;735 -93 188 -166 250 -585 500 -414 247 -487 318 -565 548 -96 288 -49 586&#xA;129 809 114 142 180 191 505 376 136 77 277 164 314 193 120 96 217 239 260&#xA;385 25 85 33 1334 9 1472 -31 182 -163 370 -341 489 -86 57 -1040 612 -1100&#xA;639 -161 74 -378 73 -525 -1 -99 -50 -1156 -679 -1208 -718 -103 -78 -176&#xA;-209 -214 -382 -17 -77 -21 -147 -28 -490 -7 -362 -9 -407 -28 -470 -107 -362&#xA;-413 -607 -777 -622 -210 -9 -329 35 -699 260 -368 223 -550 273 -782 217&#xA;-115 -27 -151 -45 -509 -250 -176 -101 -349 -195 -385 -208 -279 -102 -723 63&#xA;-910 338 -113 167 -150 335 -150 695 -1 546 -39 716 -194 870 -64 64 -126 104&#xA;-621 397 -302 179 -568 335 -590 346 -122 61 -315 87 -441 58z"></path>
    <path d="M7990 5464 c-111 -19 -153 -29 -205 -50 -117 -48 -1162 -674 -1225&#xA;-734 -102 -98 -168 -226 -196 -380 -16 -89 -20 -1192 -5 -1376 19 -221 128&#xA;-386 361 -544 81 -54 1026 -593 1085 -617 161 -68 375 -67 529 1 62 27 996&#xA;562 1081 619 89 59 234 211 273 284 82 156 76 92 80 884 3 794 3 791 -67 934&#xA;-47 95 -126 194 -202 252 -66 51 -1000 605 -1086 644 -129 60 -330 99 -423 83z"></path>
  </g></svg>`;
  }
  function nickMarkSVG() {
    return `<svg viewBox="0 0 24 24" fill="none">
      <line x1="6" y1="18" x2="18" y2="6" stroke="var(--brand)" stroke-width="2.6"/>
      <circle cx="6" cy="18" r="3" fill="var(--brand)"/><circle cx="18" cy="6" r="3" fill="var(--brand)"/></svg>`;
  }
  function swarmDotsSVG() {
    let d = "";
    const N = 48, cx = 100, cy = 100, R = 94;
    for (let i = 0; i < N; i++) {
      const t = i / N, ang = i * 2.39996, r = R * Math.sqrt(t);
      const x = cx + r * Math.cos(ang), y = cy + r * Math.sin(ang);
      const rad = (1 - t) * 2.6 + 0.7;
      d += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rad.toFixed(2)}"/>`;
    }
    return `<svg viewBox="0 0 200 200" fill="var(--dot)">${d}</svg>`;
  }
  function ridgeSVG(spark, sign) {
    const W = 650, H = 380, pad = 46;
    const min = Math.min(...spark), max = Math.max(...spark), range = Math.max(1, max - min);
    const pts = spark.map((v, i) => [(i / (spark.length - 1)) * W, H - pad - ((v - min) / range) * (H - 2 * pad)]);
    const ln = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
    const area = `M0,${H} L` + ln.replace(/ /g, " L") + ` L${W},${H} Z`;
    const col = sign < 0 ? "var(--negative)" : sign > 0 ? "var(--positive)" : "var(--text-dim)";
    const id = "rg" + Math.random().toString(36).slice(2, 7);
    const lp = pts[pts.length - 1];
    return `<svg viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${col}" stop-opacity="0.34"/>
        <stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      <path d="${area}" fill="url(#${id})"/>
      <polyline points="${ln}" fill="none" stroke="${col}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="5.5" fill="${col}"/>
      <circle cx="${lp[0].toFixed(1)}" cy="${lp[1].toFixed(1)}" r="12" fill="${col}" opacity="0.22"/></svg>`;
  }
  function miniCurveSVG(spark, sign, w, h) {
    const pad = 8;
    const min = Math.min(...spark, BASE), max = Math.max(...spark, BASE), range = Math.max(1, max - min);
    const X = (i) => (i / (spark.length - 1)) * (w - pad * 2) + pad;
    const Y = (v) => h - pad - ((v - min) / range) * (h - pad * 2);
    const ln = spark.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ");
    const col = sign < 0 ? "var(--negative)" : sign > 0 ? "var(--positive)" : "var(--text-dim)";
    const bY = Y(BASE).toFixed(1);
    const id = "mc" + Math.random().toString(36).slice(2, 7);
    return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block">
      <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stop-color="${col}" stop-opacity="0.22"/>
        <stop offset="1" stop-color="${col}" stop-opacity="0"/></linearGradient></defs>
      <line x1="${pad}" x2="${w - pad}" y1="${bY}" y2="${bY}" stroke="var(--border-solid)" stroke-width="1" stroke-dasharray="3,3"/>
      <polygon points="${pad},${h - pad} ${ln} ${w - pad},${h - pad}" fill="url(#${id})"/>
      <polyline points="${ln}" fill="none" stroke="${col}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  }
  /* ── National-team "Federation Mono" shield crest ───────────────────────
     All-original angular crest (NOT an official federation mark): bold
     flag-color band + 3-letter code on top, flag-color chevron stripes in a
     transparent body so it reads on any surface. Geometry from
     country-badge.tsx (viewBox 78×92). Takes {band, code, stripes}. ── */
  const TEAM_MARKS = {
    US: { band: "#2A3566", code: "USA", stripes: ["#3C3B6E", "#FFFFFF", "#B22234"] },
    CN: { band: "#D8273C", code: "CHN", stripes: ["#FFDE00", "#DE2910"] },
    FR: { band: "#2E5BC8", code: "FRA", stripes: ["#0055A4", "#FFFFFF", "#EF4135"] },
    MX: { band: "#006847", code: "MEX", stripes: ["#006847", "#FFFFFF", "#CE1126"] },
    ZA: { band: "#007749", code: "RSA", stripes: ["#007749", "#FFB81C", "#DE3831"] },
    KR: { band: "#003478", code: "KOR", stripes: ["#003478", "#FFFFFF", "#C60C30"] },
    CZ: { band: "#11457E", code: "CZE", stripes: ["#11457E", "#FFFFFF", "#D7141A"] },
    CA: { band: "#C8102E", code: "CAN", stripes: ["#D80621", "#FFFFFF"] },
    BA: { band: "#002F6C", code: "BIH", stripes: ["#002F6C", "#FECB00"] },
    PY: { band: "#D52B1E", code: "PAR", stripes: ["#D52B1E", "#FFFFFF", "#0038A8"] },
    QA: { band: "#8A1538", code: "QAT", stripes: ["#8A1538", "#FFFFFF"] },
    CH: { band: "#D52B1E", code: "SUI", stripes: ["#D52B1E", "#FFFFFF"] },
    BR: { band: "#009C3B", code: "BRA", stripes: ["#009C3B", "#FFDF00", "#002776"] },
    AR: { band: "#5B9BD5", code: "ARG", stripes: ["#74ACDF", "#FFFFFF", "#F6B40E"] },
    GB: { band: "#CE1124", code: "ENG", stripes: ["#FFFFFF", "#CE1124"] },
    ES: { band: "#AA151B", code: "ESP", stripes: ["#AA151B", "#F1BF00"] },
    DE: { band: "#111111", code: "GER", stripes: ["#111111", "#DD0000", "#FFCE00"] },
    PT: { band: "#006600", code: "POR", stripes: ["#006600", "#FF0000"] },
    NL: { band: "#FF6C00", code: "NED", stripes: ["#AE1C28", "#FFFFFF", "#21468B"] },
    BE: { band: "#C8102E", code: "BEL", stripes: ["#111111", "#FDDA24", "#EF3340"] },
    HR: { band: "#D7141A", code: "CRO", stripes: ["#D7141A", "#FFFFFF", "#171796"] },
    MA: { band: "#C1272D", code: "MAR", stripes: ["#C1272D", "#006233"] },
    JP: { band: "#BC002D", code: "JPN", stripes: ["#FFFFFF", "#BC002D"] },
    UY: { band: "#0038A8", code: "URU", stripes: ["#0038A8", "#FFFFFF", "#FCD116"] },
    CO: { band: "#1A47A0", code: "COL", stripes: ["#FCD116", "#003893", "#CE1126"] },
    SN: { band: "#00853F", code: "SEN", stripes: ["#00853F", "#FDEF42", "#E31B23"] },
    DK: { band: "#C8102E", code: "DEN", stripes: ["#C8102E", "#FFFFFF"] },
    AU: { band: "#00843D", code: "AUS", stripes: ["#012169", "#FFFFFF", "#E4002B"] },
    EC: { band: "#FFD100", code: "ECU", stripes: ["#FFD100", "#0072CE", "#EF3340"] },
    GH: { band: "#006B3F", code: "GHA", stripes: ["#CE1126", "#FCD116", "#006B3F"] },
    NO: { band: "#BA0C2F", code: "NOR", stripes: ["#BA0C2F", "#FFFFFF", "#00205B"] },
    IR: { band: "#239F40", code: "IRN", stripes: ["#239F40", "#FFFFFF", "#DA0000"] },
    NZ: { band: "#111111", code: "NZL", stripes: ["#00247D", "#FFFFFF", "#CC142B"] },
    SA: { band: "#006C35", code: "KSA", stripes: ["#006C35", "#FFFFFF"] },
    CV: { band: "#003893", code: "CPV", stripes: ["#003893", "#FFFFFF", "#CF2027"] },
    IQ: { band: "#CE1126", code: "IRQ", stripes: ["#CE1126", "#FFFFFF", "#111111"] },
    DZ: { band: "#006233", code: "ALG", stripes: ["#006233", "#FFFFFF", "#D21034"] },
    JO: { band: "#007A3D", code: "JOR", stripes: ["#111111", "#FFFFFF", "#007A3D"] },
    AT: { band: "#ED2939", code: "AUT", stripes: ["#ED2939", "#FFFFFF"] },
    UZ: { band: "#0099B5", code: "UZB", stripes: ["#0099B5", "#FFFFFF", "#1EB53A"] },
    CD: { band: "#007FFF", code: "COD", stripes: ["#007FFF", "#F7D618", "#CE1021"] },
    PA: { band: "#072357", code: "PAN", stripes: ["#072357", "#FFFFFF", "#DA121A"] },
    HT: { band: "#00209F", code: "HAI", stripes: ["#00209F", "#D21034"] },
    "GB-SCT": { band: "#005EB8", code: "SCO", stripes: ["#005EB8", "#FFFFFF"] },
    TN: { band: "#E70013", code: "TUN", stripes: ["#E70013", "#FFFFFF"] },
    SE: { band: "#006AA7", code: "SWE", stripes: ["#006AA7", "#FECC00"] },
    TR: { band: "#E30A17", code: "TUR", stripes: ["#E30A17", "#FFFFFF"] },
    CI: { band: "#FF8200", code: "CIV", stripes: ["#FF8200", "#FFFFFF", "#009A44"] },
    CW: { band: "#002B7F", code: "CUW", stripes: ["#002B7F", "#FFFFFF", "#F9E814"] },
    EG: { band: "#CE1126", code: "EGY", stripes: ["#CE1126", "#FFFFFF", "#111111"] },
    PL: { band: "#DC143C", code: "POL", stripes: ["#FFFFFF", "#DC143C"] },
    BH: { band: "#CE1126", code: "BHR", stripes: ["#FFFFFF", "#CE1126"] },
  };
  function normalizeTeamCode(raw) {
    const c = (raw || "").toUpperCase();
    if (c === "USA") return "US";
    if (c === "CHN") return "CN";
    if (c === "FRA") return "FR";
    if (c === "GB-SCT" || c === "SCT" || c === "SC") return "GB-SCT";
    if (c === "GB" || c === "ENG" || c === "EN") return "GB";
    return c;
  }
  function teamMark(rawCode) {
    const found = TEAM_MARKS[normalizeTeamCode(rawCode)];
    if (found) return found;
    return { band: "#2A2F36", code: (rawCode || "").toUpperCase().slice(0, 3), stripes: ["#A8B0B8", "#6B7280"] };
  }
  /* render an angular crest from {band, code, stripes} (clubs OR nations) */
  function shieldCrestSVG(m) {
    const stripes = m.stripes || [];
    const code = (m.code || "").toUpperCase().slice(0, 3);
    const band = m.band || "#2A2F36";
    const n = stripes.length;
    const step = 11, lift = n >= 3 ? 2 : 0;
    const startY = 50 - lift - ((n - 1) * step) / 2;
    const ls = code.length >= 3 ? 0.5 : 1;
    let chev = "";
    stripes.forEach((c, i) => {
      const y = startY + i * step;
      chev += `<path d="M16 ${y} L39 ${y + 8} L62 ${y}" fill="none" stroke="${c}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    });
    return `<svg viewBox="0 0 78 92" role="img" aria-label="${esc(code)} crest">
      <path d="M39 3 L73 16 L73 52 L39 89 L5 52 L5 16 Z" fill="var(--shield-fill)" stroke="var(--shield-stroke)" stroke-width="1.5"/>
      <path d="M39 3 L73 16 L73 27 L5 27 L5 16 Z" fill="${band}"/>
      <text x="39" y="22" text-anchor="middle" font-family="'Fira Code',ui-monospace,Menlo,monospace" font-size="12" font-weight="700" letter-spacing="${ls}" fill="#FFFFFF">${esc(code)}</text>
      ${chev}
    </svg>`;
  }
  /* resolve any national code to its crest */
  function teamShieldSVG(code) { return shieldCrestSVG(teamMark(code)); }
  function avatar(a, em) {
    const inner = a.kind === "ensemble"
      ? `<span style="font-size:${(em * 0.5).toFixed(2)}em">${a.flag}</span>`
      : `<span style="font-size:${(em * 0.34).toFixed(2)}em;color:${a.color}">${esc(a.code)}</span>`;
    const sq = a.kind === "ensemble" ? " sq" : "";
    return `<span class="sa-avatar${sq}" style="width:${em}em;height:${em}em;background:${a.color}1f;border:1px solid ${a.color}66">${inner}</span>`;
  }

  /* ── card frame helper ─────────────────────────────────────────────────── */
  function frame(opts, inner, extraLayers = "") {
    const sizes = { portrait: [650, 1136], story: [1080, 1920], square: [1080, 1080], og: [1200, 630] };
    const [w, h] = sizes[opts.size] || sizes.portrait;
    const u = w / 650;
    const theme = opts.theme || "dark";
    return `<div class="sa-card" data-theme="${theme}" style="width:${w}px;height:${h}px;--sa-u:${u}">${extraLayers}${inner}</div>`;
  }

  /* ════════════════ AGENT CARD ════════════════ */
  function renderAgentCard(agent, opts = {}) {
    const a = typeof agent === "string" ? byHandle[agent] : agent;
    const variant = opts.variant || "ridge";
    const rank = LEADERBOARD.findIndex((x) => x.handle === a.handle) + 1;
    const equity = BASE * (1 + a.roiPct / 100);
    const sgn = signOf(a.roiPct);
    const arrow = sgn < 0 ? "↓" : "↑";
    const pickHasEdge = a.pick && a.pick.edgePp > 0;

    if (variant === "terminal") {
      const inner = `
        <div class="sa-grid"></div>
        <div class="sa-glow" style="top:-34%;right:-30%;width:90%"></div>
        <div class="sa-content" style="padding:2.4em;gap:1.25em">
          <div class="sa-term-bar">
            <div class="dots"><i class="live"></i><i></i><i></i></div>
            <span class="path">swarm-arena / agents / ${esc(a.short.toLowerCase())}</span>
            <span class="clock">LIVE · WC26</span>
          </div>
          <div class="sa-agent-head">
            ${avatar(a, 3)}
            <div style="min-width:0">
              <div class="sa-agent-name" style="font-size:2.3em">${esc(a.label)}${a.kind === "ensemble" ? '<span class="sa-ens-tag">SWARM</span>' : ""}</div>
              <div class="sa-agent-sub"><span class="flag">${a.flag}</span>${esc(a.provider)}</div>
            </div>
          </div>
          <div class="sa-panel">
            <div class="sa-panel-title"><span>Performance · WC26</span><span style="color:var(--brand)">RANK #${rank}</span></div>
            <div class="sa-panel-body">
              <div class="sa-mlabel">Return on $1,000</div>
              <div class="sa-roi ${roiCls(a.roiPct)}" style="font-size:4.2em;margin-top:0.15em"><span class="arrow">${arrow}</span>${pct(a.roiPct)}</div>
              <div class="sa-equity-sub"><span class="big">${fmt$(equity)}</span><span class="base">equity · ${fmt$(BASE)} base</span></div>
              <div class="sa-hr" style="margin:1.1em 0"></div>
              <div class="sa-stats">
                <div class="sa-stat"><div class="k">Pick acc.</div><div class="v dim sa-num">${Math.round(a.pickPct * 100)}%</div></div>
                <div class="sa-stat"><div class="k">Signals</div><div class="v dim sa-num">${a.signals}</div></div>
                <div class="sa-stat"><div class="k">Next run</div><div class="v dim">${esc(a.nextRun)}</div></div>
              </div>
            </div>
          </div>
          <div class="sa-panel">
            <div class="sa-panel-title"><span>Equity curve</span><span>${fmt$(BASE)} → ${fmt$(equity)}</span></div>
            <div class="sa-panel-body" style="padding:0.9em 1.05em">${miniCurveSVG(a.spark, sgn, 560, 150)}</div>
          </div>
          <div class="sa-panel">
            <div class="sa-panel-title"><span>Top pick · UCL Final</span>${pickHasEdge ? `<span style="color:var(--positive)">+${a.pick.edgePp.toFixed(1)}pp</span>` : ""}</div>
            <div class="sa-panel-body" style="padding:0.85em 1.05em">
              <div class="sa-row sa-between"><span class="market">${esc(a.pick.market)}</span></div>
              <div class="side" style="color:${a.color};margin-top:0.3em;font-family:'Fira Code',monospace;font-size:1.1em;font-weight:700">${esc(a.pick.side)}</div>
            </div>
          </div>
          <div class="sa-grow"></div>
          ${footerHTML()}
        </div>`;
      return frame(opts, inner);
    }

    /* ── ridge family — 3 layouts: editorial (default) · hero · scoreboard ── */
    const layout = opts.layout || "editorial";
    const wins = Math.round(a.signals * a.pickPct);
    const losses = a.signals - wins;
    const record = a.record || `${wins}-${losses}`;
    const streak = a.streak || (sgn > 0 ? "W" + Math.max(2, Math.round(a.roiPct / 4)) : sgn < 0 ? "L" + Math.max(2, Math.round(-a.roiPct / 4)) : "—");
    const rankField = `#${rank} / ${AGENTS.length}`;
    const ltStr = a.lastTrade ? `${a.lastTrade.pnl > 0 ? "+" : "−"}$${Math.abs(a.lastTrade.pnl)} · ${a.lastTrade.ago}` : "—";
    const ltCol = a.lastTrade ? (a.lastTrade.pnl > 0 ? "var(--positive)" : a.lastTrade.pnl < 0 ? "var(--negative)" : "var(--text-dim)") : "var(--text-dim)";

    const header = `<div class="sa-row sa-between">
        <div class="sa-wordmark"><span class="sa-wordmark-mark">${markSVG()}</span><span class="sa-wordmark-text">SWARM<b>ARENA</b></span></div>
        <div class="sa-rank-badge"><span class="k">RANK</span><span class="v sa-num">#${rank}</span></div>
      </div>`;
    const decor = (op, ridgeStyle = "") => `
      <div class="sa-glow" style="top:-26%;right:-28%;width:96%"></div>
      <div class="sa-dots" style="top:5%;right:-6%;width:54%;height:30%;opacity:0.6">${swarmDotsSVG()}</div>
      <div class="sa-grid"></div>
      <div class="sa-ridge" style="opacity:${op};${ridgeStyle}">${ridgeSVG(a.spark, sgn)}</div>
      <div class="sa-scrim-b"></div>`;
    const identity = (av) => `<div style="display:flex;flex-direction:column;gap:1.4em">
        <div class="sa-pill"><span class="sa-live-dot"></span>Live · Agents World Cup</div>
        <div class="sa-agent-head">${avatar(a, av)}
          <div style="min-width:0">
            <div class="sa-agent-name">${esc(a.short)}${a.kind === "ensemble" ? '<span class="sa-ens-tag">SWARM</span>' : ""}</div>
            <div class="sa-agent-sub"><span class="flag">${a.flag}</span>${esc(a.provider)} · ${esc(a.label)}</div>
          </div>
        </div>
      </div>`;
    const pickLine = `<div class="sa-pickline">
        <span class="lab">Top pick</span>
        <span class="mk">${esc(a.pick.market)}</span>
        <span class="sd" style="color:${a.color}">${esc(a.pick.side)}</span>
        ${pickHasEdge ? `<span class="ed">+${a.pick.edgePp.toFixed(1)}pp</span>` : ""}
      </div>`;
    const DEFAULT_RECENT = [
      { market: "Match winner", side: "BACK @ 0.42", pnl: 17 },
      { market: "Total goals", side: "Under 2.5 @ 0.39", pnl: -9 },
      { market: "Anytime scorer", side: "BACK @ 0.48", pnl: 12 },
    ];
    /* unified picks ledger — top pick + latest picks share ONE grid so the
       market / side / trailing columns align perfectly across every row */
    const editorialPicks = () => {
      const rowCells = (label, market, side, trailing, trCls) =>
        `<span class="lab">${label}</span>` +
        `<span class="mk">${esc(market)}</span>` +
        `<span class="sd" style="color:${a.color}">${esc(side)}</span>` +
        `<span class="tr ${trCls}">${trailing}</span>`;
      const topTrail = pickHasEdge ? `+${a.pick.edgePp.toFixed(1)}pp` : "—";
      const latest = (a.recent || DEFAULT_RECENT).slice(0, 3).map((r, i) => {
        const cls = r.pnl > 0 ? "pos" : r.pnl < 0 ? "neg" : "zero";
        const res = (r.pnl > 0 ? "+$" : r.pnl < 0 ? "−$" : "$") + Math.abs(r.pnl);
        return rowCells(i === 0 ? "Latest picks" : "", r.market, r.side, res, cls);
      }).join("");
      return `<div class="sa-picks">
        ${rowCells("Top pick", a.pick.market, a.pick.side, topTrail, "edge")}
        <div class="rule"></div>
        ${latest}
      </div>`;
    };

    if (layout === "hero") {
      const body = `<div class="sa-content" style="padding:3.25em">
        ${header}
        <div class="sa-grow"></div>
        <div class="sa-agent-head">${avatar(a, 2.6)}
          <div style="min-width:0">
            <div class="sa-agent-name" style="font-size:2.4em">${esc(a.short)}</div>
            <div class="sa-agent-sub"><span class="flag">${a.flag}</span>${esc(a.provider)} · ${esc(a.label)}</div>
          </div>
        </div>
        <div class="sa-grow"></div>
        <div>
          <div class="sa-mlabel">Season return · on $1,000</div>
          <div class="sa-roi huge ${roiCls(a.roiPct)}" style="margin-top:0.08em"><span class="arrow">${arrow}</span>${pct(a.roiPct)}</div>
          <div class="sa-equity-sub" style="margin-top:0.7em"><span class="big sa-num">${fmt$(equity)}</span><span class="base">equity · ${fmt$(BASE)} base</span></div>
        </div>
        <div class="sa-grow"></div>
        <div style="display:flex;flex-direction:column;gap:1.5em">
          <div class="sa-metastrip">
            <div class="item"><span class="k">Rank</span><span class="v sa-num">${rankField}</span></div>
            <div class="sep"></div>
            <div class="item"><span class="k">Pick acc.</span><span class="v sa-num">${Math.round(a.pickPct * 100)}%</span></div>
            <div class="sep"></div>
            <div class="item"><span class="k">Streak</span><span class="v">${streak}</span></div>
            <div class="sep"></div>
            <div class="item"><span class="k">Next run</span><span class="v">${esc(a.nextRun)}</span></div>
          </div>
          ${pickLine}
        </div>
        ${footerHTML()}
      </div>`;
      return frame(opts, decor(0.5) + body);
    }

    if (layout === "scoreboard") {
      const body = `<div class="sa-content" style="padding:3em">
        ${header}
        <div class="sa-grow"></div>
        ${identity(3)}
        <div class="sa-grow"></div>
        <div style="position:relative;padding-left:1.6em">
          <span class="sa-rail" style="background:${sgn < 0 ? "var(--negative)" : "var(--positive)"}"></span>
          <div class="sa-mlabel">Season return · on $1,000</div>
          <div class="sa-roi ${roiCls(a.roiPct)}" style="font-size:4.6em"><span class="arrow">${arrow}</span>${pct(a.roiPct)}</div>
          <div class="sa-equity-sub"><span class="big sa-num">${fmt$(equity)}</span><span class="base">equity · ${fmt$(BASE)} base</span></div>
        </div>
        <div style="height:1.7em"></div>
        <div class="sa-statgrid">
          <div class="cell"><div class="k">Rank of field</div><div class="v sa-num">${rankField}</div></div>
          <div class="cell"><div class="k">Pick accuracy</div><div class="v dim sa-num">${Math.round(a.pickPct * 100)}%</div></div>
          <div class="cell"><div class="k">Settled record</div><div class="v dim sa-num">${record}</div></div>
          <div class="cell"><div class="k">Win streak</div><div class="v sa-num">${streak}</div></div>
          <div class="cell"><div class="k">Signals</div><div class="v dim sa-num">${a.signals}</div></div>
          <div class="cell"><div class="k">Last trade</div><div class="v sa-num" style="color:${ltCol}">${ltStr}</div></div>
        </div>
        <div style="height:1.5em"></div>
        ${pickLine}
        <div class="sa-grow"></div>
        ${footerHTML()}
      </div>`;
      return frame(opts, decor(0.4) + body);
    }

    /* editorial (default) — airy refinement of the original */
    const body = `<div class="sa-content" style="padding:3.25em 3.25em 3em">
      ${header}
      <div style="height:4.2em"></div>
      ${identity(3.4)}
      <div style="height:3em"></div>
      <div style="position:relative">
        <span class="sa-rail" style="background:${sgn < 0 ? "var(--negative)" : "var(--positive)"}"></span>
        <div style="padding-left:1.6em">
          <div class="sa-mlabel">Season return · on $1,000</div>
          <div class="sa-roi ${roiCls(a.roiPct)}" style="margin-top:0.3em"><span class="arrow">${arrow}</span>${pct(a.roiPct)}</div>
          <div class="sa-equity-sub"><span class="big sa-num">${fmt$(equity)}</span><span class="base">equity · ${fmt$(BASE)} base</span></div>
          <div class="sa-hr" style="margin:1.7em 0 1.5em"></div>
          <div class="sa-stats">
            <div class="sa-stat"><div class="k">Pick acc.</div><div class="v sa-num">${Math.round(a.pickPct * 100)}%</div></div>
            <div class="sa-stat"><div class="k">Record</div><div class="v sa-num">${record}</div></div>
            <div class="sa-stat"><div class="k">Rank</div><div class="v sa-num">${rankField}</div></div>
          </div>
          <div style="height:2.6em"></div>
          ${editorialPicks()}
        </div>
      </div>
      <div class="sa-grow" style="min-height:1.6em"></div>
      ${footerHTML()}
    </div>`;
    return frame(opts, decor(0.6, "bottom:7%") + body);
  }

  /* shared footer: Built on NickAI + CTA */
  function footerHTML() {
    var R = (typeof window !== "undefined" && window.__resources) || {};
    var nickWhite = R.nickWhite || "assets/NickAI-wordmark-white.svg";
    var nickDark = R.nickDark || "assets/NickAI-wordmark-dark.svg";
    return `<div class="sa-footer">
      <div class="sa-credit">
        <span class="k">Built on</span>
        <span class="v"><img class="sa-nick sa-nick-d" src="${nickWhite}" alt="NickAI"/><img class="sa-nick sa-nick-l" src="${nickDark}" alt="NickAI"/></span>
      </div>
      <a class="sa-cta">View on Swarm Arena <span class="ar">→</span></a>
    </div>`;
  }

  /* ════════════════ MODEL CARD (Onur's design, data-driven) ════════════════
     Port of components/swarm-arena-model-card.tsx into the framework-free
     engine so the kit + live gallery can render it from the live deck. Onur's
     React/Tailwind component is the design source of truth; this mirrors it in
     HTML/CSS and is fed by EngineAgent fields. Dark, branded palette (Onur's
     exact hexes), theme-independent. See docs/model-card-engine-guide.md. */
  const MODEL_NAMES = { GPT: "GPT 5.5", CLAUDE: "Claude 4.5", GEMINI: "Gemini 2.5", KIMI: "Kimi K2", GLM: "GLM-4.6", GROK: "Grok 3", DEEPSEEK: "DeepSeek V3", QWEN: "Qwen 3", MINIMAX: "MiniMax" };
  const MODEL_LOGOS = { GPT: "chatgpt", CLAUDE: "claude", GEMINI: "google", KIMI: "kimi", GLM: "glm" };
  function renderModelCard(agent, opts = {}) {
    const a = typeof agent === "string" ? byHandle[agent] : agent;
    const ASSET = "assets";
    const G = "#8bce6c", CREAM = "#fff8ea", DIM = "#8a8174", ORANGE = "#f98051";
    const rank = Math.max(1, LEADERBOARD.findIndex((x) => x.handle === a.handle) + 1);
    const equity = BASE * (1 + a.roiPct / 100);
    const pnl = equity - BASE;
    const pos = a.roiPct >= 0;
    const accent = pos ? G : "#ff6b6b";
    const wins = Math.round(a.signals * a.pickPct);
    const record = a.record || `${wins}-${a.signals - wins}`;
    const name = MODEL_NAMES[a.handle] || a.short || a.label;
    const logoFile = MODEL_LOGOS[a.handle];
    const logoMark = logoFile
      ? `<div style="display:grid;place-items:center;width:4.06em;height:4.06em;flex:none;border-radius:50%;background:#fff;overflow:hidden"><img src="${ASSET}/models/${logoFile}.svg" alt="${esc(name)}" style="width:2.44em;height:2.44em"/></div>`
      : `<div style="display:grid;place-items:center;width:4.06em;height:4.06em;flex:none;border-radius:50%;background:${a.color}22;border:1px solid ${a.color}66;color:${a.color};font-family:var(--font-mono);font-weight:700;font-size:1.1em">${esc(a.code)}</div>`;
    const pickRow = (label, val, col) => `<div style="display:flex;justify-content:space-between;gap:1em;font-size:1.06em;font-weight:700"><span style="color:${col};white-space:nowrap">${esc(label)}</span><span style="color:${col};text-align:right">${esc(val)}</span></div>`;
    const latest = (a.recent || []).slice(0, 3);
    const dollar = (n) => `${n >= 0 ? "+" : "−"}$${Math.abs(Math.round(n))}`;

    const inner = `
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,#110d0b 0%,#2f231e 100%)"></div>
      <div class="sa-dots" style="top:-12%;right:-14%;width:60%;height:34%;opacity:0.18">${swarmDotsSVG()}</div>
      <div style="position:relative;z-index:1;height:100%;display:flex;flex-direction:column;padding:3.55em 4em 3.4em;box-sizing:border-box;color:${CREAM};font-family:var(--font-body);line-height:1.2">
        <div style="display:flex;align-items:center;gap:1.25em">
          <span style="width:2.2em;height:2.5em;color:${ORANGE};flex:none">${markSVG()}</span>
          <span style="font-size:1.5em;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;color:${CREAM}">Swarm Arena</span>
        </div>
        <div style="display:flex;align-items:center;gap:1em;margin-top:2.3em">
          <span style="display:inline-flex;align-items:center;gap:0.6em"><span style="width:1.7em;height:1.7em;border-radius:50%;background:${G}"></span><span style="background:${G};color:#161210;font-size:1em;font-weight:600;text-transform:uppercase;padding:0.25em 0.75em;border-radius:999px;line-height:1.2">Live Agent</span></span>
          <span style="color:${ORANGE};font-size:1em;font-weight:600;text-transform:uppercase">World Cup</span>
        </div>
        <div style="display:flex;align-items:center;gap:1.25em;margin-top:1.75em">
          ${logoMark}
          <span style="font-size:3.1em;font-weight:600;line-height:1.1;color:${CREAM}">${esc(name)}</span>
        </div>
        <div style="display:flex;gap:2em;margin-top:2.6em">
          <div style="flex:1">
            <div style="font-size:1.25em;font-weight:600;color:${CREAM};opacity:0.9">Season PNL</div>
            <div style="position:relative;margin-top:0.55em"><span style="position:absolute;left:-1.55em;top:50%;transform:translateY(-50%);width:0.62em;height:1.6em;border-radius:0.25em;background:${accent}"></span><span style="font-size:3.1em;font-weight:600;line-height:1;color:${accent}">${dollar(pnl)}</span></div>
          </div>
          <div style="flex:1">
            <div style="font-size:1.25em;font-weight:600;color:${CREAM};opacity:0.9">Profit %</div>
            <div style="display:flex;align-items:center;gap:0.5em;margin-top:0.55em"><span style="font-size:2.2em;line-height:1;color:${accent}">${pos ? "↑" : "↓"}</span><span style="font-size:3.1em;font-weight:600;line-height:1;color:${accent}">${Math.abs(a.roiPct).toFixed(2)}%</span></div>
          </div>
        </div>
        <div style="height:1px;background:${CREAM};opacity:0.12;margin:1.5em 0"></div>
        <div style="display:flex;align-items:flex-end;justify-content:space-between">
          <div style="display:flex;align-items:flex-end;gap:0.6em"><span style="font-size:1.75em;font-weight:600;color:${CREAM}">${fmt$(equity)}</span><span style="font-size:1.25em;color:${DIM};padding-bottom:0.15em">Equity</span></div>
          <span style="font-size:1.25em;color:${DIM}"><b style="color:${CREAM}">${fmt$(BASE)}</b> base</span>
        </div>
        <div style="margin-top:2.4em;background:rgba(10,10,6,0.5);border:1px solid rgba(255,248,234,0.06);border-radius:1em;padding:1.9em;display:flex;flex-direction:column;gap:1.7em">
          <div style="display:flex;gap:2em">
            <div style="flex:1"><div style="font-size:0.85em;text-transform:uppercase;letter-spacing:0.09em;color:${DIM}">Pick Accuracy</div><div style="font-size:1.75em;font-weight:700;color:${CREAM};margin-top:0.35em">${Math.round(a.pickPct * 100)}%</div></div>
            <div style="flex:1"><div style="font-size:0.85em;text-transform:uppercase;letter-spacing:0.09em;color:${DIM}">Record</div><div style="font-size:1.75em;font-weight:700;color:${CREAM};margin-top:0.35em">${esc(record)}</div></div>
            <div style="flex:1"><div style="font-size:0.85em;text-transform:uppercase;letter-spacing:0.09em;color:${DIM}">Rank</div><div style="font-size:1.75em;font-weight:700;color:${CREAM};margin-top:0.35em">#${rank} / ${AGENTS.length}</div></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:0.7em">
            <div style="display:flex;justify-content:space-between;gap:1em;align-items:center"><span style="font-size:0.8em;font-weight:600;text-transform:uppercase;color:${DIM}">Top Pick</span><span style="min-width:13em;">${pickRow(a.pick.side, a.pick.edgePp ? `+${a.pick.edgePp}pp` : "", G)}</span></div>
            <div style="height:1px;background:#2e2c26;margin:0.4em 0"></div>
            <div style="display:flex;justify-content:space-between;gap:1em;align-items:flex-start"><span style="font-size:0.8em;font-weight:600;text-transform:uppercase;color:${DIM};padding-top:0.15em">Latest Picks</span><span style="min-width:13em;display:flex;flex-direction:column;gap:0.55em">${latest.length ? latest.map((p) => pickRow(p.side || p.market, dollar(p.pnl || 0), CREAM)).join("") : `<span style="color:${DIM};font-size:1.06em">No settled picks yet</span>`}</span></div>
          </div>
        </div>
        <div class="sa-grow" style="flex:1"></div>
        ${footerHTML()}
      </div>
      <div style="position:absolute;top:3.85em;right:3.4em;width:6.65em;height:6.65em;z-index:2">
        <img src="${ASSET}/rank-hex.svg" alt="" style="position:absolute;inset:0;width:100%;height:100%"/>
        <div style="position:absolute;inset:0;top:-0.4em;display:flex;align-items:center;justify-content:center"><span style="font-size:3em;font-weight:700;color:${CREAM};line-height:1">${rank}</span></div>
        <div style="position:absolute;left:-0.9em;right:-0.9em;bottom:0.55em;height:1.95em"><img src="${ASSET}/rank-ribbon.svg" alt="" style="width:100%;height:100%"/><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding-bottom:0.6em"><span style="font-size:0.85em;font-weight:700;text-transform:uppercase;color:#0d0907">Rank</span></div></div>
      </div>`;
    return frame(opts, inner);
  }

  /* ════════════════ MATCH PREVIEW CARD ════════════════
     Upcoming-fixture preview. No per-match agent council exists yet for WC
     games (the only live council is the UCL-final showcase), so this card
     shows the data that IS real and fresh: Elo-model win probability + the
     teams' Elo ratings. It deliberately omits the swarm-consensus and
     sharpest-calls panels rather than print stale/placeholder picks. */
  function renderMatchPreviewCard(m, opts = {}) {
    const o = m.odds || {};
    const hasProb = (o.homePct || 0) + (o.awayPct || 0) > 0;
    const teamHTML = (t) => {
      const mk = teamMark(t.code);
      return `
      <div class="sa-team">
        <div class="sa-shield">${shieldCrestSVG(mk)}</div>
        <div><div class="tname">${esc(t.name)}</div><div class="tmeta">${t.flag || ""}</div></div>
      </div>`;
    };
    const eloCell = (t, elo, lead) => `
      <div class="sa-cons-cell">
        <div class="v sa-num" style="color:${lead ? "var(--brand)" : "var(--text-dim)"}">${elo != null ? Math.round(elo) : "—"}</div>
        <div class="k">${esc(teamMark(t.code).code)} Elo</div>
      </div>`;
    const probRow = (label, pctv, color) => `
      <div style="display:flex;align-items:center;gap:0.9em">
        <span style="width:4.2em;font-family:'Fira Code',monospace;font-size:0.74em;font-weight:700;letter-spacing:0.04em;color:var(--text-dim)">${esc(label)}</span>
        <span style="flex:1;height:0.95em;background:var(--inset);border-radius:0.3em;overflow:hidden;display:block"><span style="display:block;height:100%;width:${pctv}%;background:${color}"></span></span>
        <span style="width:2.8em;text-align:right;font-family:'Fira Code',monospace;font-size:0.92em;font-weight:700;color:var(--text)">${pctv}%</span>
      </div>`;
    const probBar = hasProb
      ? `<div style="display:flex;flex-direction:column;gap:0.85em">
          ${probRow(`${teamMark(m.home.code).code} win`, o.homePct, "var(--positive)")}
          ${probRow("Draw", o.drawPct, "var(--border-solid)")}
          ${probRow(`${teamMark(m.away.code).code} win`, o.awayPct, "var(--negative)")}
        </div>`
      : `<div class="sa-sub" style="padding:0.6em 0;color:var(--text-faint)">Win probability available closer to kickoff.</div>`;
    const eloHome = m.elo && m.elo.home, eloAway = m.elo && m.elo.away;
    // Honest one-line read derived straight from the Elo probabilities.
    const modelRead = (() => {
      if (!hasProb) return "Win probability lands closer to kickoff once ratings settle.";
      const fav = o.homePct >= o.awayPct ? { name: m.home.name, pct: o.homePct } : { name: m.away.name, pct: o.awayPct };
      const margin = Math.abs(o.homePct - o.awayPct);
      if (margin <= 8) return `Lineball: the model splits it, ${fav.name} edging ahead at ${fav.pct}% with the draw live at ${o.drawPct}%.`;
      if (fav.pct >= 70) return `${fav.name} are heavy favourites — the Elo model gives them ${fav.pct}% to win.`;
      return `${fav.name} are favoured at ${fav.pct}%, but ${o.drawPct}% says the draw is in play.`;
    })();
    const inner = `
      <div class="sa-grid"></div>
      <div class="sa-glow" style="top:-30%;left:-26%;width:90%"></div>
      <div class="sa-dots" style="bottom:2%;right:-10%;width:48%;height:26%;opacity:0.45">${swarmDotsSVG()}</div>
      <div class="sa-content" style="padding:3em;gap:1.5em">
        <div class="sa-row sa-between">
          <div class="sa-wordmark"><span class="sa-wordmark-mark">${markSVG()}</span><span class="sa-wordmark-text">SWARM<b>ARENA</b></span></div>
          <div class="sa-pill">Match Preview</div>
        </div>
        <div>
          <div class="sa-eyebrow">${esc(m.competition)}${m.stage ? ` · ${esc(m.stage)}` : ""}</div>
          <div class="sa-sub sa-mono" style="margin-top:0.4em">${esc(m.venue)} · ${esc(m.kickoff)}</div>
        </div>
        <div class="sa-vs" style="margin:1.4em 0 1em;font-size:1.22em">
          ${teamHTML(m.home)}
          <div class="sa-vs-mid"><span class="v">VS</span></div>
          ${teamHTML(m.away)}
        </div>
        <div class="sa-panel">
          <div class="sa-panel-title"><span>Win probability · Elo model</span><span>Neutral venue</span></div>
          <div class="sa-panel-body" style="padding:1.2em 1.1em">${probBar}</div>
        </div>
        <div>
          <div class="sa-eyebrow" style="margin-bottom:0.7em">Team strength · Elo rating</div>
          <div class="sa-consensus" style="grid-template-columns:1fr 1fr">
            ${eloCell(m.home, eloHome, eloHome != null && eloAway != null && eloHome >= eloAway)}
            ${eloCell(m.away, eloAway, eloHome != null && eloAway != null && eloAway > eloHome)}
          </div>
        </div>
        <div class="sa-panel">
          <div class="sa-panel-title"><span>Model read</span><span style="color:var(--brand)">Elo</span></div>
          <div class="sa-panel-body" style="padding:1em 1.05em">
            <div class="sa-sub" style="line-height:1.5">${esc(modelRead)}</div>
          </div>
        </div>
        <div class="sa-grow"></div>
        <div class="sa-sub sa-mono" style="color:var(--text-faint);font-size:0.82em">Agent picks land closer to kickoff · swarmarena.ai</div>
        ${footerHTML()}
      </div>`;
    return frame(opts, inner);
  }

  /* ════════════════ MATCH CARD ════════════════ */
  function renderMatchCard(m, opts = {}) {
    m = m || MATCH;
    if (m.preview) return renderMatchPreviewCard(m, opts);
    const o = m.odds, sw = m.swarm;
    const teamHTML = (t) => `
      <div class="sa-team">
        <div class="sa-shield">${shieldCrestSVG({ band: t.brand, code: t.code, stripes: t.stripes })}</div>
        <div><div class="tname">${esc(t.name)}</div><div class="tmeta">${t.flag}</div></div>
      </div>`;
    const callRow = (c) => {
      const a = byHandle[c.handle];
      return `<div class="sa-call">
        <div class="who">${avatar(a, 1.5)}<span class="nm">${esc(a.short)}</span></div>
        <span class="pickside" style="color:${a.color}">${esc(c.side)}</span>
        <span class="edge">+${c.edgePp.toFixed(1)}pp</span>
      </div>`;
    };
    const inner = `
      <div class="sa-grid"></div>
      <div class="sa-glow" style="top:-30%;left:-26%;width:90%"></div>
      <div class="sa-dots" style="bottom:2%;right:-10%;width:48%;height:26%;opacity:0.45">${swarmDotsSVG()}</div>
      <div class="sa-content" style="padding:3em;gap:1.5em">
        <div class="sa-row sa-between">
          <div class="sa-wordmark"><span class="sa-wordmark-mark">${markSVG()}</span><span class="sa-wordmark-text">SWARM<b>ARENA</b></span></div>
          <div class="sa-pill">Agents Prediction</div>
        </div>
        <div>
          <div class="sa-eyebrow">${esc(m.competition)} · ${esc(m.stage)}</div>
          <div class="sa-sub sa-mono" style="margin-top:0.4em">${esc(m.venue)} · ${esc(m.kickoff)}</div>
        </div>
        <div class="sa-vs" style="margin:0.5em 0">
          ${teamHTML(m.home)}
          <div class="sa-vs-mid"><span class="v">VS</span></div>
          ${teamHTML(m.away)}
        </div>
        <div class="sa-panel">
          <div class="sa-panel-title"><span>Market odds · Polymarket</span><span>$${(o.volume24h / 1e6).toFixed(2)}M · 24h</span></div>
          <div class="sa-panel-body" style="padding:1.1em 0 1em">
            <div class="sa-oddsbar" style="border-radius:0">
              <div style="width:${o.homePct}%;background:var(--positive)">${o.homePct}%</div>
              <div style="width:${o.drawPct}%;background:var(--border-solid);color:var(--text)">${o.drawPct}%</div>
              <div style="width:${o.awayPct}%;background:var(--negative)">${o.awayPct}%</div>
            </div>
            <div class="sa-odds-legend" style="padding:0 1.05em"><span><b>${esc(m.home.code)}</b> win</span><span>Draw</span><span><b>${esc(m.away.code)}</b> win</span></div>
          </div>
        </div>
        <div>
          <div class="sa-eyebrow" style="margin-bottom:0.7em">Swarm consensus · ${sw.agents} agents</div>
          <div class="sa-consensus">
            <div class="sa-cons-cell"><div class="v" style="color:var(--positive)">${sw.backHome}</div><div class="k">Back ${esc(m.home.code)}</div></div>
            <div class="sa-cons-cell"><div class="v" style="color:var(--text-dim)">${sw.other}</div><div class="k">Other / abstain</div></div>
            <div class="sa-cons-cell"><div class="v" style="color:var(--negative)">${sw.backAway}</div><div class="k">Back ${esc(m.away.code)}</div></div>
          </div>
        </div>
        <div class="sa-panel">
          <div class="sa-panel-title"><span>Sharpest calls · by edge</span></div>
          <div class="sa-panel-body" style="padding:0.4em 1.05em">
            <div class="sa-calls">${m.calls.map(callRow).join("")}</div>
          </div>
        </div>
        <div class="sa-grow"></div>
        ${footerHTML()}
      </div>`;
    return frame(opts, inner);
  }

  /* ════════════════ LEADERBOARD CARD ════════════════ */
  function renderLeaderboardCard(opts = {}) {
    const list = LEADERBOARD;
    const maxAbs = Math.max(...list.map((a) => Math.abs(a.roiPct)));
    const leader = list[0];
    const row = (a, i) => {
      const w = (Math.abs(a.roiPct) / maxAbs) * 4.4;
      const col = a.roiPct > 0 ? "var(--positive)" : a.roiPct < 0 ? "var(--negative)" : "var(--text-dim)";
      return `<div class="sa-lb-row${i === 0 ? " lead" : ""}">
        <span class="rk sa-num">${(i + 1).toString().padStart(2, "0")}</span>
        ${avatar(a, 1.9)}
        <div class="who"><div class="nm">${esc(a.short)}</div><div class="pv">${esc(a.provider)}</div></div>
        <div class="bar-wrap">
          <span class="bar" style="width:${w.toFixed(2)}em;background:${col}"></span>
          <span class="roi ${roiCls(a.roiPct)} sa-num">${pct(a.roiPct)}</span>
        </div>
      </div>`;
    };
    const inner = `
      <div class="sa-grid"></div>
      <div class="sa-glow" style="top:-28%;right:-30%;width:88%"></div>
      <div class="sa-dots" style="bottom:8%;left:-12%;width:44%;height:24%;opacity:0.4">${swarmDotsSVG()}</div>
      <div class="sa-content" style="padding:3em;gap:1.4em">
        <div class="sa-row sa-between">
          <div class="sa-wordmark"><span class="sa-wordmark-mark">${markSVG()}</span><span class="sa-wordmark-text">SWARM<b>ARENA</b></span></div>
          <div class="sa-pill"><span class="sa-live-dot"></span>Live</div>
        </div>
        <div>
          <div class="sa-eyebrow">The LLM World Cup · Leaderboard</div>
          <div class="sa-h1" style="margin-top:0.45em">Which agent predicts the World Cup best?</div>
          <div class="sa-sub" style="margin-top:0.6em">11 LLMs built their trading strategy and compete live with a $1,000 real money portfolio</div>
        </div>
        <div class="sa-panel" style="background:var(--inset)">
          <div class="sa-panel-title"><span>Rank · Agent</span><span style="color:var(--brand)">Season ROI</span></div>
          <div class="sa-panel-body" style="padding:0.6em 1.1em">
            <div class="sa-lb">${list.map(row).join("")}</div>
          </div>
        </div>
        <div class="sa-grow"></div>
        ${footerHTML()}
      </div>`;
    return frame(opts, inner);
  }

  function mount(el, html) { el.innerHTML = html; return el.firstElementChild; }

  /* Inject real swarm data. The renderers close over AGENTS/byHandle/
     LEADERBOARD/MATCH, so reassigning them here re-points every card type at
     the new data. `deck.agents` should already be sorted by ROI; we re-sort
     defensively so per-agent rank and the leaderboard agree. */
  function load(deck) {
    if (deck && Array.isArray(deck.agents)) {
      AGENTS = deck.agents;
      byHandle = Object.fromEntries(AGENTS.map((a) => [a.handle, a]));
      LEADERBOARD = [...AGENTS].sort((a, b) => b.roiPct - a.roiPct);
    }
    if (deck && deck.match) MATCH = deck.match;
    SA.AGENTS = AGENTS; SA.byHandle = byHandle; SA.LEADERBOARD = LEADERBOARD; SA.MATCH = MATCH;
    return SA;
  }

  const SA = { AGENTS, byHandle, LEADERBOARD, MATCH, BASE, renderAgentCard, renderModelCard, renderMatchCard, renderLeaderboardCard, mount, fmt$, load };
  // Guard the global write so this file is safe to import in a server context
  // (Next.js prerenders the client player route, which pulls in the engine via
  // the Remotion registry). The renderers only run in the browser / headless
  // Chromium, where `window` exists.
  if (typeof window !== "undefined") window.SA = SA;
})();
