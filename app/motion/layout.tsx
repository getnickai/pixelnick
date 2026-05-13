import type { ReactNode } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { MotionSidebar } from "@/components/motion-sidebar";

export default function MotionLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center gap-2 px-4">
        <SidebarTrigger className="text-sidebar-foreground" />
        <h1 className="text-sm font-medium text-grey-300">Motion</h1>
      </header>
      <div className="flex min-h-0 flex-1">
        <MotionSidebar />
        <main className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
