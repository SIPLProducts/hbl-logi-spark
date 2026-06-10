import { Link, useRouterState } from "@tanstack/react-router";
import {
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
} from "lucide-react";

type NavItem = {
  index: number;
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

const items: NavItem[] = [
  { index: 1, title: "Dispatch Orders", to: "/dispatch-orders", icon: ClipboardList },
  { index: 2, title: "Dispatch", to: "/dispatch", icon: Truck },
  { index: 3, title: "Order Info", to: "/order-info", icon: FileText },
  { index: 4, title: "Shipment Details", to: "/shipment-details", icon: PackageOpen },
  { index: 5, title: "Invoice Load Details", to: "/invoice-load-details", icon: Receipt },
  { index: 6, title: "Segment Info", to: "/segment-info", icon: Split },
  { index: 7, title: "Vehicle Info", to: "/vehicle-info", icon: Bus },
  { index: 8, title: "Transit Info", to: "/transit-info", icon: RouteIcon },
  { index: 9, title: "Freight Billing", to: "/freight-billing", icon: IndianRupee },
  { index: 10, title: "Service Level", to: "/service-level", icon: Gauge },
  { index: 11, title: "Transit Damage Info", to: "/transit-damage-info", icon: AlertTriangle },
  { index: 12, title: "Insurance Claim Tracking", to: "/insurance-claim-tracking", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="w-64 shrink-0 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-900 sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-zinc-900">
        <Link to="/dispatch-orders" className="flex items-center gap-2.5">
          <div className="size-7 bg-blue-600 rounded-sm grid place-items-center font-mono font-bold text-white text-[10px]">
            HBL
          </div>
          <div className="leading-tight">
            <div className="text-white font-semibold text-[13px] tracking-tight">
              Logistics Execution
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              HBL Power Systems
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          LE Module
        </div>
        <ul className="space-y-0.5">
          {items.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className={
                    "flex items-center gap-2.5 px-2 py-1.5 rounded-sm text-[12.5px] transition-colors " +
                    (active
                      ? "bg-zinc-900 text-white border-l-2 border-blue-500 -ml-[2px] pl-[10px]"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-white")
                  }
                >
                  <span className="w-5 text-[10px] font-mono text-zinc-500 shrink-0 text-right">
                    {item.index}.
                  </span>
                  <Icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-zinc-900 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-sm bg-zinc-800 grid place-items-center text-[11px] font-mono text-zinc-300">
            HL
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-white font-medium truncate">Harshini Lingutla</div>
            <div className="text-[10px] text-zinc-500 truncate">LE Operator</div>
          </div>
        </div>
      </div>
    </aside>
  );
}