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
  UserPlus,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const groups: { items: NavItem[] }[] = [
  {
    items: [
      { title: "Dispatch Orders", to: "/dispatch-orders", icon: ClipboardList },
      { title: "Dispatch", to: "/dispatch", icon: Truck },
    ],
  },
  {
    items: [
      { title: "Order Info", to: "/order-info", icon: FileText },
      { title: "Shipment Details", to: "/shipment-details", icon: PackageOpen },
      { title: "Invoice Load Details", to: "/invoice-load-details", icon: Receipt },
      { title: "Segment Info", to: "/segment-info", icon: Split },
    ],
  },
  {
    items: [
      { title: "Vehicle Info", to: "/vehicle-info", icon: Bus },
      { title: "Transit Info", to: "/transit-info", icon: RouteIcon },
    ],
  },
  {
    items: [
      { title: "Freight Billing", to: "/freight-billing", icon: IndianRupee },
      { title: "Service Level", to: "/service-level", icon: Gauge },
      { title: "Transit Damage Info", to: "/transit-damage-info", icon: AlertTriangle },
      { title: "Insurance Claim Tracking", to: "/insurance-claim-tracking", icon: ShieldCheck },
    ],
  },
  {
    items: [
      { title: "User Creation", to: "/user-creation", icon: UserPlus },
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
      <div className="px-3 py-5 border-b border-sidebar-border/70 flex items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-9 rounded-xl bg-gradient-to-br from-accent to-primary grid place-items-center font-display font-bold text-white text-[11px] shadow-md ring-1 ring-white/10">
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
          className="p-1.5 rounded-lg text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/70 transition-colors shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-elegant py-4 px-2.5 space-y-5">
        {!collapsed && (
          <Link
            to="/"
            className={
              "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12.5px] font-medium transition-all duration-150 " +
              (pathname === "/"
                ? "bg-sidebar-accent/70 text-white shadow-sm"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white")
            }
          >
            {pathname === "/" && (
              <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            )}
            <LayoutDashboard className={"size-4 shrink-0 " + (pathname === "/" ? "text-accent" : "")} />
            <span>Dashboard</span>
          </Link>
        )}

        {groups.map((group, gi) => (
          <div key={gi}>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <li key={item.to}>
                    <Link
                      to={item.to}
                      title={collapsed ? item.title : undefined}
                      className={
                        "group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-[12.5px] font-medium transition-all duration-150 " +
                        (active
                          ? "bg-sidebar-accent/70 text-white shadow-sm"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white")
                      }
                    >
                      {active && (
                        <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                      )}
                      <Icon className={"size-4 shrink-0 transition-colors " + (active ? "text-accent" : "group-hover:text-white")} />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border/70 p-3">
        <div className={"flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors " + (collapsed ? "justify-center" : "")}>
          <div className="size-9 rounded-full bg-gradient-to-br from-accent to-primary grid place-items-center text-[11px] font-display font-semibold text-white shrink-0 ring-2 ring-sidebar-accent/40">
            HL
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[12.5px] text-white font-semibold tracking-tight truncate">Harshini Lingutla</div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55 truncate mt-0.5">LE Operator</div>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}