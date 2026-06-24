import { cn } from "@/lib/utils";
import { X_MANAGED_ACCOUNTS } from "@/lib/x-engine";
import { readDrafts } from "@/lib/x-engine-data";
import { AccountSwitcher } from "./account-switcher";

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-sidebar text-muted-foreground",
  approved: "bg-primary-500/15 text-primary-500",
  posted: "bg-primary-500 text-zinc-950",
  rejected: "bg-sidebar text-muted-foreground line-through",
};

export function XPosts({ account }: { account: string }) {
  const { drafts } = readDrafts();
  const mine = drafts.filter(
    (d) => (d.target_account ?? "").toLowerCase() === account.toLowerCase()
  );

  return (
    <div className="flex min-h-0 w-full flex-col">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-sidebar-border px-6 py-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Proposed posts</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Drafts generated for the account, awaiting review.
          </p>
        </div>
        <AccountSwitcher active={account} accounts={X_MANAGED_ACCOUNTS} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto px-6 py-4">
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {mine.map((d) => {
            const over = d.char_count > 280;
            return (
              <article
                key={d.id}
                className="rounded-xl border border-sidebar-border bg-sidebar/40 p-4"
              >
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="font-mono text-muted-foreground">@{d.target_account}</span>
                  {d.hook_type ? (
                    <span className="rounded bg-primary-500/10 px-1.5 py-0.5 font-mono text-primary-500">
                      {d.hook_type}
                    </span>
                  ) : null}
                  <span className="rounded bg-sidebar px-1.5 py-0.5 font-mono text-muted-foreground">
                    {d.format}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <span
                      className={cn("font-mono", over ? "text-red-400" : "text-muted-foreground")}
                    >
                      {d.char_count}/280
                    </span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 font-mono",
                        STATUS_STYLE[d.status] ?? "bg-sidebar text-muted-foreground"
                      )}
                    >
                      {d.status}
                    </span>
                  </span>
                </div>

                <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed">{d.text}</p>

                {d.angle ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    <span className="text-sidebar-foreground/70">Angle:</span> {d.angle}
                  </p>
                ) : null}
                {d.rationale ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="text-sidebar-foreground/70">Why:</span> {d.rationale}
                  </p>
                ) : null}
                {d.signal_title ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    <span className="text-sidebar-foreground/70">Reacts to:</span>{" "}
                    {d.signal_url ? (
                      <a
                        href={d.signal_url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary-500 hover:underline"
                      >
                        {d.signal_title}
                      </a>
                    ) : (
                      d.signal_title
                    )}
                  </p>
                ) : null}

                <div className="mt-4 flex items-center gap-2">
                  <button
                    type="button"
                    title="Wiring next: writes back to the queue"
                    className="rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-zinc-950 opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    title="Wiring next: writes back to the queue"
                    className="rounded-md border border-sidebar-border px-3 py-1.5 text-xs font-semibold text-sidebar-foreground opacity-60"
                  >
                    Reject
                  </button>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    #{d.id}
                  </span>
                </div>
              </article>
            );
          })}

          {mine.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No proposed posts for @{account} yet. Generate with{" "}
              <span className="font-mono">npm run generate {account}</span> in x-viral-pipeline.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
