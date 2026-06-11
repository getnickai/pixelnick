"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hexagon, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { engineManifest } from "@/engine/manifest";

const ICONS: Record<string, typeof Hexagon> = {
  "swarm-arena-kit": Hexagon,
  "swarm-arena-history": History,
};

/**
 * Secondary sidebar inside `/engine` — lists every entry in `engineManifest`.
 */
export function EngineSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar/60 px-3 py-5">
      {/* Group entries by their `group` field; fall back to a generic heading. */}
      {Object.entries(
        engineManifest.reduce<Record<string, typeof engineManifest>>((acc, e) => {
          const g = e.group ?? "Engine";
          (acc[g] ??= []).push(e);
          return acc;
        }, {}),
      ).map(([group, entries]) => (
        <div key={group} className="flex flex-col gap-1">
          <div className="px-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {group}
            </p>
          </div>
          <nav className="flex flex-col gap-1">
            {entries.map((entry) => {
              const href = `/engine/${entry.id}`;
              const isActive = pathname === href;
              const Icon = ICONS[entry.id] ?? Hexagon;
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
                  <span className="flex-1 truncate">
                    {entry.shortLabel ?? entry.label}
                  </span>
                  {entry.meta ? (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {entry.meta}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </aside>
  );
}
