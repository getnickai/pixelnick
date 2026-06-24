import { cn } from "@/lib/utils";
import { readDrop } from "@/lib/x-engine-data";
import type { XDropSlide, XDrop } from "@/lib/x-engine";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return `${n}`;
}

// People don't recognize logos alone — always label with the company name.
const LOGO_NAMES: Record<string, string> = {
  "claude.ai": "Claude",
  "anthropic.com": "Claude",
  "sakana.ai": "Sakana",
  "meta.com": "Meta",
  "slack.com": "Slack",
  "polymarket.com": "Polymarket",
  "kalshi.com": "Kalshi",
  "openai.com": "OpenAI",
};
function logoName(domain: string): string {
  return LOGO_NAMES[domain] ?? domain.split(".")[0].replace(/^./, (c) => c.toUpperCase());
}

/** Real brand logos as white circular bubbles, each labelled with the company name. */
function LogoBubbles({ logos, size = "md" }: { logos?: { domain: string; path: string }[]; size?: "md" | "lg" }) {
  if (!logos?.length) return null;

  if (size === "lg") {
    return (
      <div className="flex flex-wrap items-start justify-center gap-5">
        {logos.map((l) => (
          <div key={l.domain} className="flex flex-col items-center gap-2">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-full bg-white p-2 ring-1 ring-white/30">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.path} alt={l.domain} className="size-full object-contain" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-white/90">{logoName(l.domain)}</span>
          </div>
        ))}
      </div>
    );
  }

  // story — horizontal name-pills (logo + company name)
  return (
    <div className="flex flex-wrap gap-2">
      {logos.map((l) => (
        <div
          key={l.domain}
          className="flex items-center gap-1.5 rounded-full bg-black/40 py-1 pl-1 pr-2.5 ring-1 ring-white/20 backdrop-blur-sm"
        >
          <div className="flex size-7 items-center justify-center overflow-hidden rounded-full bg-white p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.path} alt={l.domain} className="size-full object-contain" />
          </div>
          <span className="text-[11px] font-semibold text-white/90">{logoName(l.domain)}</span>
        </div>
      ))}
    </div>
  );
}

/** One clean 4:5 slide: full-bleed background + overlaid headline/branding. */
function Slide({ slide }: { slide: XDropSlide }) {
  const base =
    "relative flex h-[470px] w-[376px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10";

  const bg = slide.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.image} alt="" className="absolute inset-0 size-full object-cover" />
  ) : (
    <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,rgba(120,120,255,0.18),transparent_60%)]" />
  );

  if (slide.kind === "cover") {
    return (
      <div className={base}>
        {bg}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/55" />
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <LogoBubbles logos={slide.logo_images} size="lg" />
        </div>
        <div className="relative z-10 px-6 pb-7">
          <h2 className="text-[30px] font-extrabold uppercase leading-[1.04] tracking-tight text-white">{slide.headline}</h2>
          {slide.subtitle ? <p className="mt-2.5 text-[14px] font-medium text-white/85">{slide.subtitle}</p> : null}
        </div>
      </div>
    );
  }

  if (slide.kind === "outro") {
    return (
      <div className={cn(base, "items-center justify-center text-center")}>
        {bg}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-8">
          <h2 className="text-[28px] font-extrabold uppercase leading-[1.05] tracking-tight text-white">{slide.headline}</h2>
          <p className="text-[15px] leading-relaxed text-white/80">{slide.body}</p>
          <span className="mt-2 rounded-full bg-primary-500 px-5 py-2 text-sm font-semibold text-zinc-950">{slide.cta}</span>
        </div>
      </div>
    );
  }

  // story — full-bleed photo, logos top-left, headline + subtitle bottom
  return (
    <div className={base}>
      {bg}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20" />
      <div className="relative z-10 mt-auto px-6 pb-7">
        <h2 className="text-[26px] font-extrabold uppercase leading-[1.07] tracking-tight text-white drop-shadow">{slide.headline}</h2>
        {slide.subtitle ? <p className="mt-2.5 text-[14px] leading-snug text-white/85">{slide.subtitle}</p> : null}
      </div>
    </div>
  );
}

export function AgenticDrop() {
  const drop = readDrop() as XDrop | null;

  if (!drop) {
    return (
      <div className="flex min-h-0 w-full flex-col">
        <div className="shrink-0 border-b border-sidebar-border px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Agentic Drop</h1>
        </div>
        <p className="py-10 text-center text-sm text-muted-foreground">No drop generated yet.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sidebar-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Agentic Drop</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {drop.edition} · {drop.slides.length} slides · source folder <span className="font-mono">{drop.source_folder}</span>
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        {/* carousel strip — clean slides (what gets exported) */}
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {drop.slides.map((slide, i) => (
            <Slide key={i} slide={slide} />
          ))}
        </div>

        {/* editorial review panel — source + metrics, NOT part of the exported slide */}
        <div className="mt-6 max-w-3xl rounded-xl border border-sidebar-border bg-sidebar/40 p-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Editorial (review only)</p>
          <div className="flex flex-col gap-1.5">
            {drop.slides.map((s, i) =>
              s.kind === "story" ? (
                <div key={i} className="flex items-center gap-3 font-mono text-[11px] text-muted-foreground">
                  <span className="w-6 text-sidebar-foreground/70">{String(s.index).padStart(2, "0")}</span>
                  <span className="text-sidebar-foreground/80">@{s.source.handle}</span>
                  <span>👁 {fmt(s.metrics.impression_count)}</span>
                  <span>❤️ {fmt(s.metrics.like_count)}</span>
                  <span>🔖 {fmt(s.metrics.bookmark_count)}</span>
                </div>
              ) : null,
            )}
          </div>
        </div>

        {/* caption */}
        <div className="mt-4 max-w-3xl rounded-xl border border-sidebar-border bg-sidebar/40 p-4">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">Caption</p>
          <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-sidebar-foreground/90">{drop.caption}</p>
        </div>
      </div>
    </div>
  );
}
