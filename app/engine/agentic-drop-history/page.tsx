import { readDropArchive } from "@/lib/x-engine-data";
import type { XDrop } from "@/lib/x-engine";
import { Slide, DEFAULT_ACCENT } from "../agentic-drop/slide";
import { DownloadSlidesButton } from "../agentic-drop/download-button";

export const metadata = { title: "Agentic Drop History — pixelnick" };

// All dates are plain YYYY-MM-DD editions — parse + format in UTC so the day
// never shifts under a local timezone.
function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  d.setUTCDate(d.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return d.toISOString().slice(0, 10);
}
function fmtDay(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}
function fmtWeek(mon: string): string {
  return new Date(`${mon}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

// Group editions into weeks (newest week first; newest day first within a week).
function groupByWeek(drops: XDrop[]): { week: string; drops: XDrop[] }[] {
  const buckets = new Map<string, XDrop[]>();
  for (const d of drops) {
    const k = mondayOf(d.date ?? "1970-01-01");
    (buckets.get(k) ?? buckets.set(k, []).get(k)!).push(d);
  }
  return [...buckets.entries()].map(([week, drops]) => ({ week, drops }));
}

export default function Page() {
  const drops = readDropArchive();
  const weeks = groupByWeek(drops);

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col">
      <div className="shrink-0 border-b border-sidebar-border px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Agentic Drop History</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {drops.length} edition{drops.length === 1 ? "" : "s"} · grouped by week · download any day in one click
        </p>
      </div>

      <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-6">
        {weeks.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No editions archived yet. Run <span className="font-mono">archive-drop.ts</span> after building a drop.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {weeks.map(({ week, drops }) => (
              <section key={week}>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Week of {fmtWeek(week)}
                </h2>

                <div className="flex flex-col gap-8">
                  {drops.map((drop) => {
                    const date = drop.date ?? "";
                    const stripId = `drop-${date}`;
                    return (
                      // full content width; slides scroll horizontally within
                      <div key={date} className="w-full">
                        {/* date above the slideshow, download button right next to it */}
                        <div className="mb-3 flex flex-wrap items-center gap-3">
                          <h3 className="text-sm font-semibold text-sidebar-foreground">{fmtDay(date)}</h3>
                          <DownloadSlidesButton
                            targetId={stripId}
                            prefix={`agentic-drop-${date}`}
                            label="Download day"
                            size="sm"
                          />
                          <span className="text-xs text-muted-foreground">{drop.slides.length} slides</span>
                        </div>

                        {/* fixed-width frame; slides scroll horizontally inside it */}
                        <div className="w-full overflow-x-auto rounded-xl border border-sidebar-border bg-sidebar/30 p-4">
                          <div id={stripId} className="flex snap-x snap-mandatory gap-5">
                            {drop.slides.map((slide, i) => (
                              <Slide key={i} slide={slide} accent={drop.accent ?? DEFAULT_ACCENT} />
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
