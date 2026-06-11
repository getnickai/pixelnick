import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { EngineSidebar } from "@/components/engine-sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { engineManifest } from "@/engine/manifest";

export default function EngineLayout({ children }: { children: ReactNode }) {
  return (
    // h-dvh (not min-h-dvh) + overflow-hidden: engine surfaces scale their
    // content to a viewport-bounded stage instead of scrolling the page.
    <div className="relative flex h-dvh flex-col bg-background overflow-hidden">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border px-4">
        <SidebarTrigger className="text-sidebar-foreground" />
        <DashboardBreadcrumb root="Engine" items={engineManifest} />
      </header>
      <div className="flex min-h-0 flex-1">
        <EngineSidebar />
        {/* Full-bleed: engine pages own their chrome (rail + stage). */}
        <main className="flex min-h-0 min-w-0 flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
