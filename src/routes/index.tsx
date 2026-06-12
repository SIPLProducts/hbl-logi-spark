import { createFileRoute, Link } from "@tanstack/react-router";
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
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: DashboardPage,
});

type Kpi = {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  tone: "accent" | "success" | "warning" | "danger";
};

const KPIS: Kpi[] = [
  { label: "Open Dispatch Orders", value: "248", delta: "+12 today", trend: "up", tone: "accent" },
  { label: "Shipments In Transit", value: "94", delta: "+6 vs yesterday", trend: "up", tone: "info" as never },
  { label: "Pending Invoices", value: "37", delta: "-4 vs yesterday", trend: "down", tone: "warning" },
  { label: "Damage Reports", value: "5", delta: "+1 this week", trend: "up", tone: "danger" },
  { label: "On-Time Delivery", value: "96.4%", delta: "+0.8% MoM", trend: "up", tone: "success" },
];

const SCREENS = [
  { no: 1, title: "Dispatch Orders", to: "/dispatch-orders", icon: ClipboardList, count: 248, group: "Dispatch" },
  { no: 2, title: "Dispatch", to: "/dispatch", icon: Truck, count: 132, group: "Dispatch" },
  { no: 3, title: "Order Info", to: "/order-info", icon: FileText, count: 412, group: "Shipment" },
  { no: 4, title: "Shipment Details", to: "/shipment-details", icon: PackageOpen, count: 188, group: "Shipment" },
  { no: 5, title: "Invoice Load Details", to: "/invoice-load-details", icon: Receipt, count: 96, group: "Shipment" },
  { no: 6, title: "Segment Info", to: "/segment-info", icon: Split, count: 64, group: "Shipment" },
  { no: 7, title: "Vehicle Info", to: "/vehicle-info", icon: Bus, count: 312, group: "Transit" },
  { no: 8, title: "Transit Info", to: "/transit-info", icon: RouteIcon, count: 94, group: "Transit" },
  { no: 9, title: "Freight Billing", to: "/freight-billing", icon: IndianRupee, count: 37, group: "Billing" },
  { no: 10, title: "Service Level", to: "/service-level", icon: Gauge, count: 8, group: "Billing" },
  { no: 11, title: "Transit Damage Info", to: "/transit-damage-info", icon: AlertTriangle, count: 5, group: "Claims" },
  {
    no: 12,
    title: "Insurance Claim Tracking",
    to: "/insurance-claim-tracking",
    icon: ShieldCheck,
    count: 3,
    group: "Claims",
  },
];

const ACTIVITY = [
  { time: "10:42", text: "Dispatch order DO-1000038 created for SAFEXPRESS PRIVATE LTD", tone: "accent" },
  { time: "10:21", text: "Shipment SH-204819 reached unloading point — Jamnagar Refinery", tone: "success" },
  { time: "09:58", text: "Invoice 900215479 verified and posted to SAP", tone: "success" },
  { time: "09:31", text: "Damage report DM-0042 raised on LR 75693", tone: "danger" },
  { time: "08:47", text: "Vehicle TS09 AB 4421 dispatched from HBL NCPP-SHPT", tone: "accent" },
  { time: "08:12", text: "Freight bill FB-2210 awaiting approval", tone: "warning" },
];

const PIPELINE = [
  { label: "Booked", value: 248, tone: "bg-accent" },
  { label: "Loaded", value: 188, tone: "bg-info" },
  { label: "In Transit", value: 94, tone: "bg-warning" },
  { label: "Delivered", value: 162, tone: "bg-success" },
  { label: "Billed", value: 124, tone: "bg-primary" },
];

function DashboardPage() {
  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-10 bg-surface border-b border-hairline px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2 h-[22px] rounded-md text-[11px] font-semibold bg-accent/10 text-accent">
                <Activity className="size-3" /> Live
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Operations Overview
              </span>
            </div>
            <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">Welocome Back</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">Here's what's moving across Logistics today.</p>
          </div>
          {/* <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted">
              Configure widgets
            </button>
            <Link
              to="/dispatch-orders"
              className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 shadow-sm"
            >
              New Dispatch Order <ArrowUpRight className="size-3.5" />
            </Link>
          </div> */}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KPIS.map((k) => (
            <div
              key={k.label}
              className="bg-surface border border-hairline rounded-lg p-4 hover:border-accent/40 transition-colors"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{k.label}</div>
              <div className="mt-1.5 font-display text-3xl font-semibold tabular-nums tracking-tight">{k.value}</div>
              <div
                className={
                  "mt-1 inline-flex items-center gap-1 text-[11px] font-mono " +
                  (k.trend === "up" ? "text-success" : "text-destructive")
                }
              >
                {k.trend === "up" ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                {k.delta}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1">
        {/* Lifecycle pipeline */}
        <div className="lg:col-span-2 bg-surface border border-hairline rounded-lg shadow-xs">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <div>
              <h3 className="font-display text-[15px] font-semibold">Shipment Lifecycle</h3>
              <p className="text-[11.5px] text-muted-foreground">Volume across the 12-step LE pipeline · today</p>
            </div>
            <button className="text-[11px] font-semibold text-accent hover:underline">View details</button>
          </div>
          <div className="p-5 space-y-3">
            {PIPELINE.map((p) => {
              const max = Math.max(...PIPELINE.map((x) => x.value));
              const pct = (p.value / max) * 100;
              return (
                <div key={p.label} className="flex items-center gap-3">
                  <div className="w-24 text-[12px] font-medium text-foreground">{p.label}</div>
                  <div className="flex-1 h-7 rounded-md bg-muted overflow-hidden">
                    <div className={"h-full " + p.tone + " transition-[width]"} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="w-12 text-right font-mono text-[12.5px] font-semibold tabular-nums">{p.value}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div className="bg-surface border border-hairline rounded-lg shadow-xs">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <h3 className="font-display text-[15px] font-semibold">Recent Activity</h3>
            <span className="text-[10px] font-mono text-muted-foreground">last 2h</span>
          </div>
          <ul className="divide-y divide-hairline">
            {ACTIVITY.map((a, i) => (
              <li key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/40">
                <span
                  className={
                    "mt-1 size-1.5 rounded-full shrink-0 " +
                    (a.tone === "success"
                      ? "bg-success"
                      : a.tone === "danger"
                        ? "bg-destructive"
                        : a.tone === "warning"
                          ? "bg-warning"
                          : "bg-accent")
                  }
                />
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] text-foreground">{a.text}</div>
                  <div className="text-[10.5px] font-mono text-muted-foreground mt-0.5">{a.time}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* 12 screen quick-jump grid */}
        <div className="lg:col-span-3 bg-surface border border-hairline rounded-lg shadow-xs">
          <div className="px-4 py-3 border-b border-hairline flex items-center justify-between">
            <div>
              <h3 className="font-display text-[15px] font-semibold">Quick Access · 12 Screens</h3>
              <p className="text-[11.5px] text-muted-foreground">
                Jump into any stage of the Logistics Execution module
              </p>
            </div>
            <div className="hidden md:flex items-center gap-1 text-[11px] text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-success" /> All modules operational
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {SCREENS.map((s) => {
              const Icon = s.icon;
              return (
                <Link
                  key={s.to}
                  to={s.to}
                  className="group relative bg-surface border border-hairline rounded-lg p-3 hover:border-accent/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="size-9 rounded-md bg-accent/10 text-accent grid place-items-center">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-muted-foreground">
                      {String(s.no).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="mt-2.5 text-[12.5px] font-semibold text-foreground leading-tight">{s.title}</div>
                  <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    {s.group}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-mono text-[13px] font-semibold tabular-nums">{s.count}</span>
                    <ArrowUpRight className="size-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
}
