import { readDrop } from "@/lib/x-engine-data";
import type { XDrop } from "@/lib/x-engine";
import { DownloadSlidesButton } from "./download-button";
import { Slide, DEFAULT_ACCENT, fmt } from "./slide";

export function AgenticDrop() {
  const drop = readDrop() as XDrop | null;
  const accent = drop?.accent ?? DEFAULT_ACCENT;

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
        <DownloadSlidesButton />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        {/* carousel strip — clean slides (what gets exported) */}
        <div className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4">
          {drop.slides.map((slide, i) => (
            <Slide key={i} slide={slide} accent={accent} />
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
