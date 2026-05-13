"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film } from "lucide-react";
import { cn } from "@/lib/utils";
// Use the metadata-only manifest, not the full registry — the sidebar doesn't
// need React component refs, and this keeps the `remotion` package out of the
// sidebar's import graph. The Player page imports the full registry instead.
import { motionManifest } from "@/remotion/manifest";

/**
 * Secondary sidebar inside `/motion` — lists every entry in `motionRegistry`.
 * Adding a new animatable component to the registry makes it appear here
 * automatically (no edits to this file required).
 */
export function MotionSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col gap-4 border-r border-sidebar-border bg-sidebar/60 px-3 py-5">
      <div className="px-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-grey-500">
          Compositions
        </p>
      </div>
      <nav className="flex flex-col gap-1">
        {motionManifest.map((entry) => {
          const href = `/motion/${entry.id}`;
          const isActive = pathname === href;
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
              <Film
                className={cn(
                  "size-4 shrink-0 transition-colors",
                  isActive ? "text-brand-500" : "text-grey-500"
                )}
              />
              <span className="flex-1 truncate">{entry.label}</span>
              <span className="text-[10px] font-mono text-grey-500">
                {entry.width}×{entry.height}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
