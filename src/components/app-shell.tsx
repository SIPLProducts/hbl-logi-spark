import type { ReactNode } from "react";
import { AppSidebar } from "./app-sidebar";
import { TopBar } from "./top-bar";
import { LeFooter } from "./le-footer";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground text-[12px] antialiased">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 overflow-y-auto scrollbar-elegant">{children}</main>
          <LeFooter />
        </div>
        <Toaster position="bottom-right" />
      </div>
    </TooltipProvider>
  );
}