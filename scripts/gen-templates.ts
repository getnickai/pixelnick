/**
 * Generate `remotion/compositions/workflow-template-card/data/templates.generated.ts`
 * from the library template definitions.
 *
 * Source:  ~/nickai-content/figma-screenshots/template-definitions/*.json
 *          (React-Flow shape: nodes[].data.{label,config}, edges[])
 * Copy:    data/template-copy.ts (authored prompt + description per slug)
 * Output:  data/templates.generated.ts (TEMPLATES map + ordered TEMPLATE_LIST)
 *
 * Run:  bun scripts/gen-templates.ts
 *
 * Node subtitles are DERIVED here from each node's config so the card stays a
 * faithful, deterministic snapshot of the real workflow without shipping the
 * heavy config/Python at render time.
 */
import fs from "node:fs";
import path from "node:path";
import { TEMPLATE_COPY } from "../remotion/compositions/workflow-template-card/data/template-copy";

const DIR = path.join(
  process.env.HOME ?? "",
  "nickai-content/figma-screenshots/template-definitions",
);
const OUT = path.join(
  process.cwd(),
  "remotion/compositions/workflow-template-card/data/templates.generated.ts",
);

type RawNode = {
  id: string;
  type: string;
  position: { x: number; y: number };
  data?: { label?: string; config?: Record<string, any> };
};
type RawEdge = { id: string; source: string; target: string };
type RawGraph = { slug: string; name: string; nodes: RawNode[]; edges: RawEdge[] };

const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : "");
const clip = (s: string, n = 30) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function intervalLabel(value?: number, unit?: string): string {
  if (!value || !unit) return "Interval";
  if (unit === "minutes" && value % 60 === 0) return `Every ${value / 60}h`;
  const short = unit === "minutes" ? "m" : unit === "hours" ? "h" : unit === "days" ? "d" : unit;
  return `Every ${value}${short}`;
}

const OP: Record<string, string> = {
  equals: "=",
  not_equals: "≠",
  greater_than: ">",
  greater_than_or_equal: "≥",
  less_than: "<",
  less_than_or_equal: "≤",
  contains: "has",
};

function conditionLabel(c: Record<string, any>): string {
  const cond = (c.conditions ?? [])[0];
  if (!cond) return "Condition";
  const field = String(cond.field ?? "").split(".").pop() ?? "value";
  const op = OP[cond.operator] ?? cond.operator ?? "=";
  const val = typeof cond.value === "boolean" ? String(cond.value) : cond.value;
  const more = (c.conditions ?? []).length > 1 ? " …" : "";
  return clip(`${field} ${op} ${val}${more}`);
}

const COINGLASS: Record<string, string> = {
  fundingRates: "Funding",
  openInterest: "Open Interest",
  longShortRatio: "Long/Short",
  liquidations: "Liquidations",
};

function subtitleFor(type: string, config: Record<string, any> = {}): string | undefined {
  switch (type) {
    case "start": {
      const s = config.schedule ?? {};
      if (config.triggerType === "webhook") return "Webhook";
      if (s.type === "daily") return s.time ? `Daily · ${s.time}` : "Daily";
      if (s.type === "weekly") return `Weekly · ${cap(s.day)}${s.time ? ` ${s.time}` : ""}`;
      if (s.type === "interval") return intervalLabel(s.value, s.unit);
      return "Trigger";
    }
    case "price-data":
    case "stocks-data": {
      const syms: string[] = config.symbols ?? [];
      if (syms.length === 0) return config.interval ? String(config.interval) : undefined;
      const more = syms.length > 1 ? ` +${syms.length - 1}` : "";
      const iv = config.interval ? ` · ${config.interval}` : "";
      return clip(`${syms[0]}${more}${iv}`);
    }
    case "portfolio":
      return config.exchange || "Portfolio";
    case "llm":
      return clip(config.model || config.provider || "LLM");
    case "conditional":
      return conditionLabel(config);
    case "exchange":
      return [config.exchange, config.orderType].filter(Boolean).join(" · ") || "Trade";
    case "function": {
      const lang = String(config.language ?? "python").toLowerCase();
      const pretty: Record<string, string> = {
        python: "Python",
        typescript: "TypeScript",
        javascript: "JavaScript",
      };
      return pretty[lang] ?? cap(lang);
    }
    case "email-notification":
      return "Email";
    case "telegram-notification":
      return "Telegram";
    case "discord-notification":
      return "Discord";
    case "slack-notification":
      return "Slack";
    case "coinglass": {
      const sym = String(config.symbol ?? "").replace(/USDT?$/i, "");
      const dt = COINGLASS[config.dataType] ?? config.dataType ?? "";
      return clip([sym, dt].filter(Boolean).join(" · ")) || "Coinglass";
    }
    case "storage":
      return config.action === "retrieve" ? "Load" : "Store";
    case "polymarket":
      return "Polymarket";
    default:
      return undefined;
  }
}

function orderIndex(): (name: string) => number {
  try {
    const titles: string[] = JSON.parse(
      fs.readFileSync(path.join(DIR, "_known_titles.json"), "utf8"),
    ).titles;
    const idx = new Map(titles.map((t, i) => [t, i] as const));
    return (name) => idx.get(name) ?? 999;
  } catch {
    return () => 999;
  }
}

function main() {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json") && !f.startsWith("_"));
  const rank = orderIndex();

  const graphs = files
    .map((f) => JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8")) as RawGraph)
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name));

  const missing: string[] = [];
  const out: Record<string, unknown> = {};

  for (const g of graphs) {
    const copy = TEMPLATE_COPY[g.slug];
    if (!copy) missing.push(g.slug);
    out[g.slug] = {
      slug: g.slug,
      name: g.name,
      description: copy?.description ?? "",
      nickDescription: copy?.nickDescription ?? copy?.description ?? "",
      prompt: copy?.prompt ?? g.name,
      nodes: g.nodes.map((n) => {
        const subtitle = subtitleFor(n.type, n.data?.config);
        return {
          id: n.id,
          type: n.type,
          label: n.data?.label ?? n.type,
          ...(subtitle ? { subtitle } : {}),
          position: { x: round(n.position.x), y: round(n.position.y) },
        };
      }),
      edges: g.edges.map((e) => ({ id: e.id, source: e.source, target: e.target })),
    };
  }

  const banner =
    "/**\n * AUTO-GENERATED by scripts/gen-templates.ts — DO NOT EDIT BY HAND.\n" +
    " * Edit copy in data/template-copy.ts, then rerun `bun scripts/gen-templates.ts`.\n */\n";
  const body =
    'import type { TemplateGraph } from "../props";\n\n' +
    `export const TEMPLATES: Record<string, TemplateGraph> = ${JSON.stringify(out, null, 2)};\n\n` +
    `export const TEMPLATE_SLUGS: string[] = ${JSON.stringify(graphs.map((g) => g.slug), null, 2)};\n\n` +
    "export const TEMPLATE_LIST: TemplateGraph[] = TEMPLATE_SLUGS.map((s) => TEMPLATES[s]);\n";

  fs.writeFileSync(OUT, banner + body);
  console.log(`Wrote ${graphs.length} templates → ${path.relative(process.cwd(), OUT)}`);
  if (missing.length) console.warn(`⚠ missing copy for: ${missing.join(", ")}`);
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}

main();
