"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X_MANAGED_ACCOUNTS } from "@/lib/x-engine";

function Tabs({
  label,
  active,
  options,
}: {
  label: string;
  active: string;
  options: { key: string; label: string; href: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <div
        role="tablist"
        aria-label={label}
        className="inline-flex gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-1"
      >
        {options.map((o) => {
          const isActive = o.key.toLowerCase() === active.toLowerCase();
          return (
            <Link
              key={o.key}
              href={o.href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
              )}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function PerformanceControls({ account, sort }: { account: string; sort: string }) {
  const pathname = usePathname();
  const href = (a: string, s: string) => `${pathname}?account=${a}&sort=${s}`;
  return (
    <div className="flex flex-wrap items-center gap-4">
      <Tabs
        label="Account"
        active={account}
        options={X_MANAGED_ACCOUNTS.map((a) => ({ key: a, label: `@${a}`, href: href(a, sort) }))}
      />
      <Tabs
        label="Sort by"
        active={sort}
        options={[
          { key: "virality", label: "Engagement/view", href: href(account, "virality") },
          { key: "reach", label: "Reach", href: href(account, "reach") },
        ]}
      />
    </div>
  );
}
