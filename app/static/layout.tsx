import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StaticSidebar } from "@/components/static-sidebar";
import { StaticBreadcrumb } from "@/components/static-breadcrumb";

export default function StaticLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <SidebarTrigger className="text-sidebar-foreground" />
        <StaticBreadcrumb />
      </header>
      <div className="flex min-h-0 flex-1">
        <StaticSidebar />
        <main className="flex min-w-0 flex-1 items-center justify-center overflow-auto py-[30px]">
          {children}
        </main>
      </div>
    </div>
  );
}
