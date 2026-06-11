"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Film, Hexagon, Image } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_GROUPS = [
  {
    label: "Pixelnick Design",
    items: [
      {
        title: "Static",
        href: "/static",
        icon: Image,
      },
      {
        title: "Motion",
        href: "/motion",
        icon: Film,
      },
    ],
  },
  {
    label: "Pixelnick Engine",
    items: [
      {
        title: "Swarm Arena Kit",
        href: "/engine",
        icon: Hexagon,
      },
    ],
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-primary-500 text-zinc-950 font-bold">
            N
          </div>
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            pixelnick
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
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
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
