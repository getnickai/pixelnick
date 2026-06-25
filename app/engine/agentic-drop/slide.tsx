// Shared, presentational slide renderer for the Agentic Drop carousel. NO fs /
// data fetching here so both the live page (carousel.tsx) and the history page
// can import it. The clean 4:5 slide is what the PNG exporter captures
// ([data-export-slide]).
import type { XDropSlide } from "@/lib/x-engine";

export function fmt(n: number): string {
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

// Brand accent for keyword color-pop + SWIPE cue. The uncovernews.co network
// (our benchmark) pops the numbers / names / punchy phrase in ONE bright accent
// per brand; everything else stays white. Default = Claude coral.
export const DEFAULT_ACCENT = "#E08A4D";

/** Color-pop: wrap `*marked*` runs of a headline/subtitle in the accent color. */
function Highlight({ text, accent }: { text: string; accent: string }) {
  const parts = text.split(/\*([^*]+)\*/g); // odd indices were inside *...*
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span key={i} style={{ color: accent }}>
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

/** Bottom-right "SWIPE →" cue — near-universal on the reference carousels. */
function SwipeCue() {
  return (
    <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white ring-1 ring-white/25 backdrop-blur-sm">
      Swipe <span aria-hidden>→</span>
    </div>
  );
}

/** Accent-ringed circular cutout of a secondary related image (top-right). */
function Inset({ src, accent }: { src: string; accent: string }) {
  return (
    <div
      className="absolute right-5 top-5 z-20 size-24 overflow-hidden rounded-full bg-zinc-900"
      style={{ boxShadow: `0 0 0 3px ${accent}, 0 6px 18px rgba(0,0,0,0.45)` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" className="size-full object-cover" />
    </div>
  );
}

/** Cover branding: labelled white logo bubbles, centered. */
function LogoBubbles({ logos }: { logos?: { domain: string; path: string }[] }) {
  if (!logos?.length) return null;
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

/** One clean 4:5 slide: full-bleed background + overlaid headline/branding. */
export function Slide({ slide, accent }: { slide: XDropSlide; accent: string }) {
  const base =
    "relative flex h-[470px] w-[376px] shrink-0 snap-center flex-col overflow-hidden rounded-2xl bg-zinc-950 ring-1 ring-white/10";

  // Story photos focus on the subject (faces) high in the frame so they stay
  // above the bottom text scrim; cover/outro keep their composed centering.
  // Per-slide `focus`/`zoom`/`brightness` let real photos be cropped + lifted.
  const focus = slide.focus ?? (slide.kind === "story" ? "center 30%" : "center");
  const zoom = slide.zoom ?? 1;
  const bgStyle: React.CSSProperties = {
    objectPosition: focus,
    ...(zoom !== 1 ? { transform: `scale(${zoom})`, transformOrigin: focus } : {}),
    ...(slide.brightness ? { filter: `brightness(${slide.brightness})` } : {}),
  };
  const bg = slide.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={slide.image} alt="" loading="lazy" style={bgStyle} className="absolute inset-0 size-full object-cover" />
  ) : (
    <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_30%,rgba(120,120,255,0.18),transparent_60%)]" />
  );

  if (slide.kind === "cover") {
    return (
      <div className={base} data-export-slide>
        {bg}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-black/55" />
        {slide.inset ? <Inset src={slide.inset} accent={accent} /> : null}
        <div className="relative z-10 flex flex-1 items-center justify-center px-6">
          <LogoBubbles logos={slide.logo_images} />
        </div>
        <div className="relative z-10 px-6 pb-7">
          <h2 className="text-[30px] font-extrabold uppercase leading-[1.04] tracking-tight text-white">
            <Highlight text={slide.headline} accent={accent} />
          </h2>
          {slide.subtitle ? (
            <p className="mt-2.5 text-[14px] font-medium text-white/85">
              <Highlight text={slide.subtitle} accent={accent} />
            </p>
          ) : null}
        </div>
        <SwipeCue />
      </div>
    );
  }

  if (slide.kind === "outro") {
    // brand sign-off: title centered in the middle, uniform subtext, follow chip.
    return (
      <div className={`${base} items-center justify-center text-center`} data-export-slide>
        {bg}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-black/50" />
        <div className="relative z-10 flex flex-col items-center gap-4 px-8">
          <h2 className="text-[30px] font-extrabold uppercase leading-[1.05] tracking-tight text-white">
            <Highlight text={slide.headline} accent={accent} />
          </h2>
          {slide.body ? (
            <p className="text-[15px] font-medium leading-relaxed text-white/90">
              <Highlight text={slide.body} accent={accent} />
            </p>
          ) : null}
          {slide.cta ? (
            <span className="mt-2 rounded-full px-5 py-2 text-sm font-semibold text-zinc-950" style={{ backgroundColor: accent }}>
              {slide.cta}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  // story — a self-contained news card: photo up top, optional inset, then a
  // text panel carrying headline (color-popped) + a uniform subtext block.
  return (
    <div className={base} data-export-slide>
      {bg}
      {/* strong bottom scrim — the lower ~60% is a readable news panel */}
      <div className="absolute inset-0 bg-gradient-to-t from-black from-35% via-black/80 via-[58%] to-transparent" />
      {slide.inset ? <Inset src={slide.inset} accent={accent} /> : null}
      <div className="relative z-10 mt-auto flex flex-col px-6 pb-7">
        <h2 className="text-[23px] font-extrabold uppercase leading-[1.09] tracking-tight text-white drop-shadow">
          <Highlight text={slide.headline} accent={accent} />
        </h2>
        {/* one uniform subtext block — same font/size/weight, white with accent pops */}
        {slide.subtitle || slide.body ? (
          <p className="mt-3 text-[14px] font-medium leading-relaxed text-white/90">
            {slide.subtitle ? <Highlight text={slide.subtitle} accent={accent} /> : null}
            {slide.subtitle && slide.body ? " " : null}
            {slide.body ? <Highlight text={slide.body} accent={accent} /> : null}
          </p>
        ) : null}
      </div>
      <SwipeCue />
    </div>
  );
}
