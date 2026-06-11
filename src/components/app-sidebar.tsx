import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ClipboardList,
  Truck,
  FileText,
  PackageOpen,
  Receipt,
  Split,
  Bus,
  Route as RouteIcon,
  IndianRupee,
  Gauge,
  AlertTriangle,
  ShieldCheck,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  index: number;
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Dispatch",
    items: [
      { index: 1, title: "Dispatch Orders", to: "/dispatch-orders", icon: ClipboardList },
      { index: 2, title: "Dispatch", to: "/dispatch", icon: Truck },
    ],
  },
  {
    label: "Shipment",
    items: [
      { index: 3, title: "Order Info", to: "/order-info", icon: FileText },
      { index: 4, title: "Shipment Details", to: "/shipment-details", icon: PackageOpen },
      { index: 5, title: "Invoice Load Details", to: "/invoice-load-details", icon: Receipt },
      { index: 6, title: "Segment Info", to: "/segment-info", icon: Split },
    ],
  },
  {
    label: "Transit",
    items: [
      { index: 7, title: "Vehicle Info", to: "/vehicle-info", icon: Bus },
      { index: 8, title: "Transit Info", to: "/transit-info", icon: RouteIcon },
    ],
  },
  {
    label: "Billing & Claims",
    items: [
      { index: 9, title: "Freight Billing", to: "/freight-billing", icon: IndianRupee },
      { index: 10, title: "Service Level", to: "/service-level", icon: Gauge },
      { index: 11, title: "Transit Damage Info", to: "/transit-damage-info", icon: AlertTriangle },
      { index: 12, title: "Insurance Claim Tracking", to: "/insurance-claim-tracking", icon: ShieldCheck },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={
        "shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-200 " +
        (collapsed ? "w-[68px]" : "w-64")
      }
    >
      <div className="px-3 py-4 border-b border-sidebar-border flex items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-9 rounded-md bg-gradient-to-br from-accent to-primary grid place-items-center font-display font-bold text-white text-[11px] shadow-sm ring-1 ring-white/10">
            HBL
          </div>
          {!collapsed && (
            <div className="leading-tight min-w-0">
              <div className="text-white font-display font-semibold text-[13.5px] tracking-tight truncate">
                Logistics Execution
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55 truncate">
                HBL Power Systems
              </div>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="p-1 rounded-md text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {!collapsed && (
          <Link
            to="/"
            className={
              "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[12.5px] font-medium transition-colors " +
              (pathname === "/"
                ? "bg-sidebar-accent text-white"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white")
            }
          >
            <LayoutDashboard className="size-4 shrink-0" />
            <span>Dashboard</span>
          </Link>
        )}

        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/45">
                {group.label}
              </div>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? `${item.index}. ${item.title}` : undefined}
                      className={
                        "group relative flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12.5px] transition-colors " +
                        (active
                          ? "bg-sidebar-accent text-white"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-white")
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-accent" />
                      )}
                      {!collapsed && (
                        <span
                          className={
                            "w-5 text-[10px] font-mono shrink-0 text-right " +
                            (active ? "text-accent" : "text-sidebar-foreground/40")
                          }
                        >
                          {String(item.index).padStart(2, "0")}
                        </span>
                      )}
                      <Icon className="size-4 shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <div className={"flex items-center gap-2.5 px-2 py-1.5 rounded-md " + (collapsed ? "justify-center" : "")}>
          <div className="size-8 rounded-full bg-gradient-to-br from-accent to-primary grid place-items-center text-[11px] font-display font-semibold text-white shrink-0">
            HL
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[12.5px] text-white font-medium truncate">Harshini Lingutla</div>
              <div className="text-[10px] text-sidebar-foreground/55 truncate">LE Operator</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}