"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LineChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { staticManifest } from "@/static/manifest";

const ICONS: Record<string, typeof LineChart> = {
  "performance-card": LineChart,
};

/**
 * Secondary sidebar inside `/static` — lists every entry in `staticManifest`.
 */
export function StaticSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar/60 px-3 py-5">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Visuals
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {staticManifest.map((entry) => {
          const href = `/static/${entry.id}`;
          const isActive = pathname === href;
          const Icon = ICONS[entry.id] ?? LineChart;
          return (
            <Link
              key={entry.id}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-primary-500" : "text-muted-foreground"
                )}
              />
              <span className="flex-1 truncate">{entry.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {entry.width}×{entry.height}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
