import { SidebarTrigger } from "@/components/ui/sidebar";
import AiReadyCard from "@/components/ai-ready-card";

export default function PerformanceCardPage() {
  return (
    <div className="relative min-h-dvh bg-background">
      <header className="sticky top-0 z-20 flex h-12 items-center gap-2 px-4">
        <SidebarTrigger className="text-sidebar-foreground" />
        <h1 className="text-sm font-medium text-grey-300">Performance Card</h1>
      </header>
      <main className="flex items-center justify-center py-[30px]">
        <AiReadyCard />
      </main>
    </div>
  );
}
