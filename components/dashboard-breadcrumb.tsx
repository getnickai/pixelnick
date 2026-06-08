"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";

type Crumb = { id: string; label: string };

/**
 * Header breadcrumb shared by the `/static` and `/motion` dashboards —
 * renders "{root} › {current entry}". The current entry is resolved from the
 * pathname (`/{section}/{id}`) against the passed `items` (a manifest).
 */
export function DashboardBreadcrumb({
  root,
  items,
}: {
  root: string;
  items: readonly Crumb[];
}) {
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const current = items.find((entry) => entry.id === id);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-sidebar-foreground"
    >
      <span className="shrink-0">{root}</span>
      {current ? (
        <>
          <ChevronRight
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <span className="truncate text-muted-foreground">{current.label}</span>
        </>
      ) : null}
    </nav>
  );
}
