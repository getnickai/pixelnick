"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function AccountSwitcher({
  active,
  accounts,
}: {
  active: string;
  accounts: readonly string[];
}) {
  const pathname = usePathname();
  return (
    <div
      role="tablist"
      aria-label="Account"
      className="inline-flex gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-1"
    >
      {accounts.map((a) => {
        const isActive = a.toLowerCase() === active.toLowerCase();
        return (
          <Link
            key={a}
            href={`${pathname}?account=${a}`}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                : "text-sidebar-foreground/55 hover:text-sidebar-foreground"
            )}
          >
            @{a}
          </Link>
        );
      })}
    </div>
  );
}
