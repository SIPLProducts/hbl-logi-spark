import { Bell, Search, ChevronDown, Command, HelpCircle } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";

const ROUTE_LABELS: Record<string, { label: string }> = {
  "/": { label: "Dashboard" },
  "/dispatch-orders": { label: "Dispatch Orders" },
  "/dispatch": { label: "Dispatch" },
  "/order-info": { label: "Order Info" },
  "/shipment-details": { label: "Shipment Details" },
  "/invoice-load-details": { label: "Invoice Load Details" },
  "/segment-info": { label: "Segment Info" },
  "/vehicle-info": { label: "Vehicle Info" },
  "/transit-info": { label: "Transit Info" },
  "/freight-billing": { label: "Freight Billing" },
  "/service-level": { label: "Service Level" },
  "/transit-damage-info": { label: "Transit Damage Info" },
  "/insurance-claim-tracking": { label: "Insurance Claim Tracking" },
};

export function TopBar() {
  return null;
  // eslint-disable-next-line no-unreachable
  return (
    <header className="h-14 bg-surface/90 backdrop-blur border-b border-hairline flex items-center justify-between px-5 sticky top-0 z-20">
      {/*
      <div className="flex items-center gap-4 min-w-0">
        <nav className="flex items-center gap-1.5 text-[12px] min-w-0">
          <span className="text-muted-foreground">LE Module</span>
          <span className="text-muted-foreground/50">/</span>
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
      */}
    </header>
  );
}