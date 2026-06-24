import { readSignals } from "@/lib/x-engine-data";

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const h = Math.floor(ms / 3_600_000);
  if (h < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function XSignals() {
  const { generated_at, signals } = readSignals();
  const max = signals.reduce((m, s) => Math.max(m, s.score), 0) || 1;

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-sidebar-border px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Signals</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          What the AI world is talking about, ranked by velocity, relevance, and recency.
        </p>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground">
          {signals.length} signals · source x-engine
          {generated_at ? ` · as of ${timeAgo(generated_at)} ago` : ""}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-3">
        <ol className="flex flex-col">
          {signals.map((s, i) => (
            <li
              key={s.id}
              className="flex items-start gap-4 border-b border-sidebar-border/60 py-3"
            >
              <span className="w-6 shrink-0 pt-0.5 text-right font-mono text-sm text-muted-foreground">
                {i + 1}
              </span>

              <div className="flex w-14 shrink-0 flex-col items-end pt-0.5">
                <span className="font-mono text-sm font-medium text-primary-500">
                  {s.score.toFixed(2)}
                </span>
                <span className="mt-1 h-1 w-full overflow-hidden rounded-full bg-sidebar">
                  <span
                    className="block h-full rounded-full bg-primary-500"
                    style={{ width: `${Math.round((s.score / max) * 100)}%` }}
                  />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium leading-snug hover:text-primary-500 hover:underline"
                >
                  {s.title}
                </a>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <span className="rounded bg-sidebar px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {s.source}
                  </span>
                  {s.topics.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-primary-500/10 px-1.5 py-0.5 font-mono text-[10px] text-primary-500"
                    >
                      {t}
                    </span>
                  ))}
                  {s.velocity > 0 ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {s.velocity.toFixed(0)}/h
                    </span>
                  ) : null}
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {timeAgo(s.created_at)} ago
                  </span>
                </div>
              </div>
            </li>
          ))}
          {signals.length === 0 ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No signals yet. Run <span className="font-mono">npm run sense</span> then{" "}
              <span className="font-mono">npm run publish</span> in x-viral-pipeline.
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}
