"use client";

import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { staticManifest } from "@/static/manifest";

/**
 * Header breadcrumb for `/static` — shows "Static › {current card}".
 * Resolves the current card from the pathname against `staticManifest`.
 */
export function StaticBreadcrumb() {
  const pathname = usePathname();
  const id = pathname.split("/")[2];
  const current = staticManifest.find((entry) => entry.id === id);

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-sidebar-foreground"
    >
      <span className="shrink-0">Static</span>
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
