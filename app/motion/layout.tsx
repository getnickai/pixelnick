import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { PinRootFontSize } from "@/components/pin-root-font-size";
import { motionManifest } from "@/remotion/manifest";

export default function MotionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <PinRootFontSize />
      <header className="sticky top-0 z-30 flex h-12 shrink-0 items-center gap-2 border-b border-sidebar-border bg-background/85 px-4 backdrop-blur-md">
        <SidebarTrigger className="text-sidebar-foreground" />
        <DashboardBreadcrumb
          root="Motion"
          rootHref="/motion"
          items={motionManifest}
        />
      </header>
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
    </div>
  );
}
