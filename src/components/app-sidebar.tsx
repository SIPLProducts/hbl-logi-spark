import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  ChevronDown,
  FileBarChart,
  LogOut,
  DoorOpen,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { REPORTS_NAV } from "@/lib/reports-nav";
import hblLogo from "@/assets/hbl-logo.png";

type NavItem = {
  title: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  /** normalized key(s) this item maps to in the user's ACTIVITY list */
  key: string;
};

// key ni ACT tho match cheyyadaniki normalize chestham:
// lowercase + "outward" word remove + non-alphanumeric remove
// Ex: "Outward-DispatchOrders" -> "dispatchorders", "Dispatch Orders" -> "dispatchorders"
function normalizeKey(input: string) {
  return input
    .toLowerCase()
    .replace(/outward/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const DASHBOARD_KEY = normalizeKey("Dashboard");

const groups: { items: NavItem[] }[] = [
  {
    items: [
      { title: "Dispatch Orders", to: "/dispatch-orders", icon: ClipboardList, key: normalizeKey("Dispatch Orders") },
      { title: "Dispatch", to: "/dispatch", icon: Truck, key: normalizeKey("Dispatch") },
    ],
  },
  {
    items: [
      { title: "Order Info", to: "/order-info", icon: FileText, key: normalizeKey("Order Info") },
      { title: "Gate In & Out", to: "/gate-in-out-process", icon: DoorOpen, key: normalizeKey("Gate In Out") },
      { title: "Loading Factor", to: "/invoice-load-details", icon: Receipt, key: normalizeKey("Invoice Load Details") },
      { title: "Vehicle Info", to: "/vehicle-info", icon: Bus, key: normalizeKey("Vehicle Info") },
      { title: "Shipment Details", to: "/shipment-details", icon: PackageOpen, key: normalizeKey("Shipment Details") },
    ],
  },
  {
    items: [
      { title: "Segment Info", to: "/segment-info", icon: Split, key: normalizeKey("Segment Info") },
      { title: "Transit Info", to: "/transit-info", icon: RouteIcon, key: normalizeKey("Transit Info") },
    ],
  },
  {
    items: [
      { title: "Freight Billing", to: "/freight-billing", icon: IndianRupee, key: normalizeKey("Freight Billing") },
      { title: "Service Level", to: "/service-level", icon: Gauge, key: normalizeKey("Service Level") },
      { title: "Transit Damage Info", to: "/transit-damage-info", icon: AlertTriangle, key: normalizeKey("Transit Damage Info") },
      { title: "Insurance Claim", to: "/insurance-claim-tracking", icon: ShieldCheck, key: normalizeKey("Insurance Claim Tracking") },
    ],
  },
  {
    items: [
      { title: "User Creation", to: "/user-creation", icon: UserPlus, key: normalizeKey("User Creation") },
    ],
  },
];

function getUserData() {
  try {
    const raw = localStorage.getItem("userData");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getInitials(firstName: string, lastName: string) {
  const f = firstName?.charAt(0)?.toUpperCase() ?? "";
  const l = lastName?.charAt(0)?.toUpperCase() ?? "";
  return `${f}${l}`;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const isActive = (to: string) => pathname === to || pathname.startsWith(to + "/");
  const [collapsed, setCollapsed] = useState(false);
  const reportsHasActive = pathname.startsWith("/reports");
  const [reportsOpen, setReportsOpen] = useState(reportsHasActive);

  const user = getUserData();
  const firstName = user?.FIRST_NAME ?? "User";
  const lastName = user?.LAST_NAME ?? "";
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = getInitials(firstName, lastName);
  const role = user?.TYUSER ?? "";

  // Logged-in user ki ACTIVITY/ACTIVITIES array nunchi allowed keys set build chestham.
  // Login API response lo "ACTIVITIES": [{ "ACTIVITY": "Outward-Dashboard" }, ...] ala untundi,
  // kani legacy/sample data lo "ACTIVITY": [{ "ACT": "Dispatch Orders" }, ...] ala vundochu.
  // Rendu formats ni kuda support chestham, ekkada data unte akkadi nundi chadavutham.
  const allowedKeys = useMemo(() => {
    const raw =
      user?.ACTIVITIES ??
      user?.ACTIVITY ??
      [];
    const values: string[] = (raw as any[]).map(
      (a) => a?.ACTIVITY ?? a?.ACT ?? ""
    );
    return new Set(values.map((v) => normalizeKey(v)));
  }, [user]);

  const showDashboard = allowedKeys.has(DASHBOARD_KEY);

  // Prathi group nundi user ki access unna items matrame, empty groups filter out
  const visibleGroups = useMemo(() => {
    return groups
      .map((group) => ({
        items: group.items.filter((item) => allowedKeys.has(item.key)),
      }))
      .filter((group) => group.items.length > 0);
  }, [allowedKeys]);

  // Reports lo kuda, prathi report item title ni normalize chesi ACT tho match chestham.
  // (REPORTS_NAV lo prathi item ki kuda ACT tho match ayye "key" field pettuko galigithe
  //  accuracy inka better untundi, ippudu title base ga filter chestunnam)
  const visibleReports = useMemo(() => {
    return (REPORTS_NAV as { title: string; to: string; icon: React.ComponentType<{ className?: string }> }[]).filter(
      (item) => allowedKeys.has(normalizeKey(item.title))
    );
  }, [allowedKeys]);

  const handleLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("isLoggedIn");
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  return (
    <aside
      className={
        "shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border sticky top-0 h-screen transition-[width] duration-200 " +
        (collapsed ? "w-[68px]" : "w-57")
      }
    >
      <div className="px-3 py-3 border-b border-sidebar-border/70 flex items-center gap-2.5">
        <Link to="/" className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="size-8 rounded-lg bg-white grid place-items-center shadow-md ring-1 ring-white/10 shrink-0 p-1">
            <img src={hblLogo} alt="HBL" className="size-full object-contain" />
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

      <nav className="flex-1 overflow-y-auto scrollbar-elegant py-2 px-2 space-y-0">
        {!collapsed && showDashboard && (
          <Link
            to="/"
            className={
              "group relative flex items-center gap-3 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 " +
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

        {visibleGroups.map((group, gi) => (
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
                        "group relative flex items-center gap-3 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 " +
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

        {/* Reports (collapsible) - user ki access unna reports unte matrame kanipistundi */}
        {visibleReports.length > 0 && (
          <div>
            <button
              onClick={() => {
                if (collapsed) setCollapsed(false);
                setReportsOpen((v) => !v);
              }}
              title={collapsed ? "Reports" : undefined}
              className={
                "group relative w-full flex items-center gap-3 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 " +
                (reportsHasActive
                  ? "bg-sidebar-accent/70 text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white")
              }
            >
              {reportsHasActive && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-accent shadow-[0_0_8px_var(--accent)]" />
              )}
              <FileBarChart
                className={"size-4 shrink-0 transition-colors " + (reportsHasActive ? "text-accent" : "group-hover:text-white")}
              />
              {!collapsed && (
                <>
                  <span className="truncate flex-1 text-left">Reports</span>
                  <ChevronDown
                    className={"size-3.5 shrink-0 transition-transform " + (reportsOpen ? "rotate-180" : "")}
                  />
                </>
              )}
            </button>

            {reportsOpen && !collapsed && (
              <ul className="mt-1 ml-3 pl-3 border-l border-sidebar-border/60 space-y-0.5">
                {visibleReports.map((item) => {
                  const active = pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        className={
                          "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all duration-150 " +
                          (active
                            ? "bg-sidebar-accent/70 text-white shadow-sm"
                            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/40 hover:text-white")
                        }
                      >
                        <Icon
                          className={
                            "size-3.5 shrink-0 transition-colors " +
                            (active ? "text-accent" : "group-hover:text-white")
                          }
                        />
                        <span className="truncate">{item.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </nav>

      {/* Bottom user section */}
      <div className="border-t border-sidebar-border/70 p-3">
        <div
          className={
            "flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors " +
            (collapsed ? "justify-center" : "")
          }
        >
          <div className="size-9 rounded-full bg-gradient-to-br from-accent to-primary grid place-items-center text-[11px] font-display font-semibold text-white shrink-0 ring-2 ring-sidebar-accent/40">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <div className="text-[12.5px] text-white font-semibold tracking-tight truncate">
                {fullName}
              </div>
              <div className="text-[10px] uppercase tracking-[0.14em] text-sidebar-foreground/55 truncate mt-0.5">
                {role}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-sidebar-foreground/50 hover:text-white hover:bg-sidebar-accent/70 transition-colors shrink-0"
            >
              <LogOut className="size-3.5" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}