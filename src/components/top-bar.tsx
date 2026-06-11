import { Bell, Search, ChevronDown, Command, HelpCircle } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";

const ROUTE_LABELS: Record<string, { no?: number; label: string }> = {
  "/": { label: "Dashboard" },
  "/dispatch-orders": { no: 1, label: "Dispatch Orders" },
  "/dispatch": { no: 2, label: "Dispatch" },
  "/order-info": { no: 3, label: "Order Info" },
  "/shipment-details": { no: 4, label: "Shipment Details" },
  "/invoice-load-details": { no: 5, label: "Invoice Load Details" },
  "/segment-info": { no: 6, label: "Segment Info" },
  "/vehicle-info": { no: 7, label: "Vehicle Info" },
  "/transit-info": { no: 8, label: "Transit Info" },
  "/freight-billing": { no: 9, label: "Freight Billing" },
  "/service-level": { no: 10, label: "Service Level" },
  "/transit-damage-info": { no: 11, label: "Transit Damage Info" },
  "/insurance-claim-tracking": { no: 12, label: "Insurance Claim Tracking" },
};

export function TopBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const current = ROUTE_LABELS[pathname] ?? { label: "—" };

  return (
    <header className="h-14 bg-surface/90 backdrop-blur border-b border-hairline flex items-center justify-between px-5 sticky top-0 z-20">
      <div className="flex items-center gap-4 min-w-0">
        <nav className="flex items-center gap-1.5 text-[12px] min-w-0">
          <span className="text-muted-foreground">LE Module</span>
          <span className="text-muted-foreground/50">/</span>
          {current.no !== undefined && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded text-[10px] font-mono font-semibold bg-accent/10 text-accent">
              {String(current.no).padStart(2, "0")}
            </span>
          )}
          <span className="font-display font-semibold text-foreground truncate">{current.label}</span>
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="hidden md:flex items-center gap-2 h-8 pl-2.5 pr-2 rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-transparent hover:border-hairline transition-colors w-72"
        >
          <Search className="size-3.5" />
          <span className="text-[12px] flex-1 text-left">Search orders, LR, shipment…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 text-[10px] font-mono bg-surface border border-hairline rounded px-1 py-0.5 text-muted-foreground">
            <Command className="size-2.5" />K
          </kbd>
        </button>

        <div className="hidden lg:flex items-center gap-1.5 px-2 h-8 rounded-md border border-hairline text-[11px]">
          <span className="size-1.5 rounded-full bg-success" />
          <span className="font-mono font-semibold text-muted-foreground">DEV</span>
        </div>

        <button
          type="button"
          className="hidden md:flex items-center gap-1.5 h-8 px-2.5 rounded-md text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          <span className="font-mono">HYD-PLANT-04</span>
          <ChevronDown className="size-3" />
        </button>

        <ThemeToggle />

        <button
          type="button"
          className="hidden md:grid place-items-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Help"
        >
          <HelpCircle className="size-4" />
        </button>

        <button
          type="button"
          className="relative grid place-items-center size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive ring-2 ring-surface" />
        </button>
      </div>
    </header>
  );
}