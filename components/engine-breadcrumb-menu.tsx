"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  FileText,
  Hexagon,
  History,
  ImageIcon,
  LayoutGrid,
  Library,
  Radar,
  Shapes,
  TrendingUp,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { engineManifest } from "@/engine/manifest";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Hexagon> = {
  "swarm-arena-kit": Hexagon,
  "swarm-arena-history": History,
  "nickai-kit": Bot,
  "nickai-history": History,
  "nickai-template-library": Library,
  "nickai-widget-library": Shapes,
  "nickai-blog-covers": ImageIcon,
  "x-signals": Radar,
  "x-posts": FileText,
  "x-performance": TrendingUp,
  "agentic-drop": LayoutGrid,
  "agentic-drop-history": History,
};

export function EngineBreadcrumbMenu() {
  const pathname = usePathname();
  const current = engineManifest.find((entry) =>
    pathname.startsWith(`/engine/${entry.id}`),
  );
  const visibleEntries = current?.group
    ? engineManifest.filter((entry) => entry.group === current.group)
    : engineManifest;
  const groupedEntries = Object.entries(
    visibleEntries.reduce<Record<string, typeof engineManifest>>(
      (groups, entry) => {
        const group = entry.group ?? "Engine";
        (groups[group] ??= []).push(entry);
        return groups;
      },
      {},
    ),
  );

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex min-w-0 items-center gap-1 text-sm font-medium text-sidebar-foreground"
    >
      <span className="shrink-0">Engine</span>
      {current ? (
        <>
          <ChevronRight
            aria-hidden="true"
            className="mx-0.5 size-3.5 shrink-0 text-muted-foreground/60"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  aria-label={`Open ${current.group ?? "Engine"} navigation`}
                  className="flex h-8 min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-accent data-popup-open:text-foreground"
                >
                  <span className="truncate">{current.label}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="size-3.5 shrink-0 opacity-60 transition-transform data-[popup-open]:rotate-180"
                  />
                </button>
              }
            />
            <DropdownMenuContent
              align="start"
              sideOffset={6}
              className="w-72"
            >
              {groupedEntries.map(([group, entries], groupIndex) => (
                <div key={group}>
                  {groupIndex > 0 ? <DropdownMenuSeparator /> : null}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="px-2 py-1.5 uppercase tracking-wider">
                      {group}
                    </DropdownMenuLabel>
                    {entries.map((entry) => {
                      const href = `/engine/${entry.id}`;
                      const isActive =
                        pathname === href ||
                        pathname.startsWith(`${href}/`);
                      const Icon = ICONS[entry.id] ?? Hexagon;

                      return (
                        <DropdownMenuItem
                          key={entry.id}
                          render={
                            <Link
                              href={href}
                              aria-current={isActive ? "page" : undefined}
                            />
                          }
                          className={cn(
                            "min-h-9 cursor-pointer gap-2 px-2 py-1.5",
                            isActive && "bg-accent text-accent-foreground",
                          )}
                        >
                          <Icon
                            className={cn(
                              "size-4",
                              isActive
                                ? "text-primary-500"
                                : "text-muted-foreground",
                            )}
                          />
                          <span className="min-w-0 flex-1 truncate">
                            {entry.shortLabel ?? entry.label}
                          </span>
                          {entry.meta ? (
                            <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                              {entry.meta}
                            </span>
                          ) : null}
                          {isActive ? (
                            <Check className="size-3.5 shrink-0 text-primary-500" />
                          ) : null}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : null}
    </nav>
  );
}
