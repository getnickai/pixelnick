"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cpu, Film, Hexagon, Image, Palette } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type NavItem = { title: string; href: string; icon: typeof Image };
type Workspace = {
  id: "design" | "engine";
  label: string;
  icon: typeof Image;
  /** Default route entered when this workspace tab is selected. */
  href: string;
  items: NavItem[];
};

/**
 * Two workspaces, switched by the tab control at the top of the sidebar.
 * "Design" is the original pixelnick dashboards (Static, Motion); "Engine"
 * is the live data-driven surfaces. Only the active workspace's nav shows.
 */
const WORKSPACES: Workspace[] = [
  {
    id: "design",
    label: "Design",
    icon: Palette,
    href: "/static",
    items: [
      { title: "Static", href: "/static", icon: Image },
      { title: "Motion", href: "/motion", icon: Film },
    ],
  },
  {
    id: "engine",
    label: "Engine",
    icon: Cpu,
    href: "/engine",
    items: [{ title: "Kit", href: "/engine", icon: Hexagon }],
  },
];

/** Active workspace is derived from the route, so deep links land correctly. */
function activeWorkspaceId(pathname: string): Workspace["id"] {
  return pathname.startsWith("/engine") ? "engine" : "design";
}

export function AppSidebar() {
  const pathname = usePathname();
  const activeId = activeWorkspaceId(pathname);
  const active = WORKSPACES.find((w) => w.id === activeId) ?? WORKSPACES[0];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="gap-3 px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary-500 text-zinc-950 font-bold">
            N
          </div>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            pixelnick
          </span>
        </div>

        {/* Workspace tab switch — segmented when expanded. */}
        <div
          role="tablist"
          aria-label="Workspace"
          className="grid grid-cols-2 gap-1 rounded-lg border border-sidebar-border bg-sidebar-accent/30 p-1 group-data-[collapsible=icon]:hidden"
        >
          {WORKSPACES.map((ws) => {
            const isActive = ws.id === activeId;
            return (
              <Link
                key={ws.id}
                href={ws.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                    : "text-sidebar-foreground/55 hover:text-sidebar-foreground",
                )}
              >
                <ws.icon className="size-3.5" />
                {ws.label}
              </Link>
            );
          })}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Workspace switch — stacked icon toggles when collapsed to icons. */}
        <SidebarGroup className="hidden group-data-[collapsible=icon]:block">
          <SidebarGroupContent>
            <SidebarMenu>
              {WORKSPACES.map((ws) => (
                <SidebarMenuItem key={ws.id}>
                  <SidebarMenuButton
                    render={<Link href={ws.href} />}
                    isActive={ws.id === activeId}
                    tooltip={`${ws.label} workspace`}
                  >
                    <ws.icon />
                    <span>{ws.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Active workspace's nav. */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {active.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <item.icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
