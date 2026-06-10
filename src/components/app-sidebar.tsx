import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PackageOpen,
  Truck,
  Send,
  FileBarChart,
  Boxes,
  ClipboardList,
  PackageCheck,
  ScanLine,
  MapPin,
  Route as RouteIcon,
  Inbox,
} from "lucide-react";

type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { title: "Dashboard", to: "/", icon: LayoutDashboard },
      { title: "Reports", to: "/reports", icon: FileBarChart },
    ],
  },
  {
    label: "Inbound",
    items: [
      { title: "Deliveries", to: "/inbound", icon: Inbox },
      { title: "ASN", to: "/inbound/asn", icon: ClipboardList },
      { title: "Putaway", to: "/inbound/putaway", icon: Boxes },
    ],
  },
  {
    label: "Outbound",
    items: [
      { title: "Deliveries", to: "/outbound", icon: PackageOpen },
      { title: "Picking", to: "/outbound/picking", icon: ScanLine },
      { title: "Packing", to: "/outbound/packing", icon: PackageCheck },
      { title: "Goods Issue", to: "/outbound/goods-issue", icon: Send },
    ],
  },
  {
    label: "Transportation",
    items: [
      { title: "Shipments", to: "/transportation", icon: Truck },
      { title: "Tracking", to: "/transportation/tracking", icon: MapPin },
    ],
  },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isActive = (to: string) =>
    to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(to + "/");

  return (
    <aside className="w-60 shrink-0 bg-zinc-950 text-zinc-300 flex flex-col border-r border-zinc-900 sticky top-0 h-screen">
      <div className="px-5 py-5 border-b border-zinc-900">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="size-7 bg-blue-600 rounded-sm grid place-items-center font-mono font-bold text-white text-[10px]">
            HBL
          </div>
          <div className="leading-tight">
            <div className="text-white font-semibold text-[13px] tracking-tight">
              Logistics Exec
            </div>
            <div className="text-[10px] uppercase tracking-widest text-zinc-500">
              HBL Power Systems
            </div>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-2 mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
              {group.label}
            </div>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
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
                      <Icon className="size-4 shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-zinc-900 p-3">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-sm bg-zinc-800 grid place-items-center text-[11px] font-mono text-zinc-300">
            SR
          </div>
          <div className="min-w-0">
            <div className="text-[12px] text-white font-medium truncate">S. Rajan</div>
            <div className="text-[10px] text-zinc-500 truncate">Plant Supervisor</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export { RouteIcon };