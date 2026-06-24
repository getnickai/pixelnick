import { cn } from "@/lib/utils";
import type { XPost } from "@/lib/x-engine";
import { readPosts } from "@/lib/x-engine-data";
import { PerformanceControls } from "./controls";

function views(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return "";
  const h = Math.floor(ms / 3_600_000);
  if (h < 24) return `${Math.max(1, h)}h`;
  const d = Math.floor(h / 24);
  return d < 30 ? `${d}d` : `${Math.floor(d / 30)}mo`;
}

const BUCKET: Record<string, { label: string; cls: string }> = {
  broke_containment: { label: "broke containment", cls: "bg-primary-500 text-zinc-950" },
  audience: { label: "audience", cls: "bg-primary-500/10 text-primary-500" },
  subset: { label: "subset", cls: "bg-sidebar text-muted-foreground" },
};

export function XPerformance({
  account,
  sort,
}: {
  account: string;
  sort: "virality" | "reach";
}) {
  const { posts } = readPosts();
  const mine = posts
    .filter((p) => (p.account_username ?? "").toLowerCase() === account.toLowerCase())
    .sort((a, b) =>
      sort === "reach"
        ? (b.reach_ratio ?? 0) - (a.reach_ratio ?? 0)
        : (b.virality_score ?? 0) - (a.virality_score ?? 0)
    )
    .slice(0, 40);

  const maxVir = mine.reduce((m, p) => Math.max(m, p.virality_score ?? 0), 0) || 1;
  const maxReach = mine.reduce((m, p) => Math.max(m, p.reach_ratio ?? 0), 0) || 1;

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-sidebar-border px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">Performance</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Two dials, kept separate: engagement per view, and reach (views vs followers).
        </p>
        <div className="mt-3">
          <PerformanceControls account={account} sort={sort} />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-3">
        <ol className="flex flex-col">
          {mine.map((p: XPost, i) => {
            const vir = p.virality_score ?? 0;
            const reach = p.reach_ratio ?? 0;
            const bucket = BUCKET[p.reach_bucket ?? "subset"] ?? BUCKET.subset;
            return (
              <li
                key={p.id}
                className="flex items-start gap-4 border-b border-sidebar-border/60 py-3"
              >
                <span className="w-5 shrink-0 pt-1 text-right font-mono text-xs text-muted-foreground">
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm leading-snug">{p.text}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span>@{p.account_username}</span>
                    <span>{timeAgo(p.posted_at)} ago</span>
                    {p.is_reply ? <span>reply</span> : null}
                    {p.has_attachment ? <span>media</span> : null}
                    <span>
                      {p.like_count ?? 0}L · {p.retweet_count ?? 0}RT · {p.bookmark_count ?? 0}B
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  <div
                    className={cn(
                      "w-[110px] rounded-lg border p-2",
                      sort === "virality"
                        ? "border-primary-500/40 bg-primary-500/5"
                        : "border-sidebar-border"
                    )}
                  >
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Eng / view
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-medium">{vir.toFixed(3)}</div>
                    <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-sidebar">
                      <span
                        className="block h-full rounded-full bg-primary-500"
                        style={{ width: `${Math.round((vir / maxVir) * 100)}%` }}
                      />
                    </span>
                  </div>

                  <div
                    className={cn(
                      "w-[110px] rounded-lg border p-2",
                      sort === "reach"
                        ? "border-primary-500/40 bg-primary-500/5"
                        : "border-sidebar-border"
                    )}
                  >
                    <div className="text-[9px] uppercase tracking-wider text-muted-foreground">
                      Reach
                    </div>
                    <div className="mt-0.5 font-mono text-sm font-medium">
                      {reach.toFixed(2)}×
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <span className={cn("rounded px-1 py-0.5 text-[9px]", bucket.cls)}>
                        {bucket.label}
                      </span>
                    </div>
                    <div className="mt-1 font-mono text-[9px] text-muted-foreground">
                      {views(p.impression_count)} views
                    </div>
                  </div>
                </div>
              </li>
            );
          })}

          {mine.length === 0 ? (
            <li className="py-10 text-center text-sm text-muted-foreground">
              No measured posts for @{account} yet. Run{" "}
              <span className="font-mono">npm run measure</span> then{" "}
              <span className="font-mono">npm run publish</span>.
            </li>
          ) : null}
        </ol>
      </div>
    </div>
  );
}
