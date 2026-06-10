import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, RefreshCw, AlertTriangle, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { KpiTile } from "@/components/kpi-tile";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { inboundDeliveries, type InboundDelivery } from "@/lib/mock-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · HBL Logistics Execution" },
      { name: "description", content: "Real-time logistics execution KPIs, exceptions, and worklists for HBL Power Systems plants." },
      { property: "og:title", content: "Dashboard · HBL Logistics Execution" },
      { property: "og:description", content: "Real-time logistics execution KPIs, exceptions, and worklists for HBL Power Systems." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const cols: Column<InboundDelivery>[] = [
    {
      key: "id",
      header: "Delivery #",
      render: (r) => (
        <Link
          to="/inbound/delivery/$id"
          params={{ id: r.id }}
          className="font-mono font-semibold text-blue-700 hover:underline"
        >
          {r.id}
        </Link>
      ),
    },
    { key: "vendor", header: "Vendor", render: (r) => r.vendor },
    { key: "items", header: "Items", render: (r) => <span className="text-zinc-500">{r.items}</span> },
    {
      key: "dock",
      header: "Dock",
      align: "center",
      render: (r) => (
        <span className="font-mono text-[12px] bg-zinc-100 px-1.5 py-0.5 rounded-sm">
          {r.dock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} />,
    },
    {
      key: "priority",
      header: "Priority",
      render: (r) => (
        <span
          className={
            "text-[12px] font-medium " +
            (r.priority === "Critical"
              ? "text-red-600"
              : r.priority === "High"
              ? "text-amber-600"
              : "text-zinc-500")
          }
        >
          {r.priority}
        </span>
      ),
    },
    { key: "eta", header: "ETA", render: (r) => <span className="font-mono">{r.eta}</span> },
    {
      key: "actions",
      header: "",
      align: "right",
      render: (r) => (
        <Link
          to="/inbound/delivery/$id"
          params={{ id: r.id }}
          className="text-blue-600 text-[12px] font-semibold hover:underline"
        >
          Open
        </Link>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Overview"
        title="Logistics Dashboard"
        description="Real-time execution status across inbound, outbound, and transportation for HBL Power Systems."
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
            <RefreshCw className="size-3.5" />
            Refresh
          </button>
        }
      />

      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <KpiTile label="Open GRs" value="142" trend="+12 since 06:00" trendTone="amber" />
          <KpiTile label="Pending Putaway" value="89" trend="Avg 4.2h dwell" trendTone="zinc" />
          <KpiTile label="Picks Due" value="312" trend="42 critical" trendTone="red" accent />
          <KpiTile label="In Transit" value="18" trend="8 expected today" trendTone="zinc" />
          <KpiTile label="OTIF %" value="94.2" unit="%" trend="Target 98.0%" trendTone="green" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white ring-1 ring-zinc-200 rounded-sm p-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[12px] font-bold uppercase tracking-wider">
                Throughput (24h)
              </h3>
              <div className="flex gap-4 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 bg-blue-200" /> Forecast
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 bg-blue-600" /> Actual
                </span>
              </div>
            </div>
            <div className="h-44 flex items-end gap-1.5">
              {[40, 52, 38, 60, 75, 68, 82, 90, 78, 95, 88, 72, 60, 55].map(
                (h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-stretch gap-0.5">
                    <div
                      className="bg-blue-600 rounded-t-[1px]"
                      style={{ height: `${h}%` }}
                    />
                    <div
                      className="bg-blue-200/70"
                      style={{ height: `${Math.max(8, h - 12)}%` }}
                    />
                  </div>
                ),
              )}
            </div>
            <div className="flex justify-between mt-2 text-[10px] text-zinc-400 font-mono">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>23:59</span>
            </div>
          </div>

          <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-4 flex flex-col">
            <h3 className="text-[12px] font-bold uppercase tracking-wider mb-3">
              On-Time Delivery
            </h3>
            <div className="flex-1 grid place-items-center py-2">
              <div
                className="size-36 rounded-full grid place-items-center relative"
                style={{
                  background:
                    "conic-gradient(rgb(37 99 235) 0% 94.2%, rgb(228 228 231) 94.2% 100%)",
                }}
              >
                <div className="size-28 bg-white rounded-full grid place-items-center text-center">
                  <div>
                    <div className="text-2xl font-mono font-bold">94.2%</div>
                    <div className="text-[9px] uppercase tracking-widest text-zinc-500 mt-0.5">
                      Target 98
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="pt-3 mt-2 border-t border-zinc-100 flex justify-between text-[11px]">
              <span className="text-zinc-500 uppercase font-bold tracking-wider">
                Last Shift
              </span>
              <span className="font-mono font-semibold">92.1%</span>
            </div>
          </div>
        </div>

        {/* Exceptions + Worklist */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white ring-1 ring-zinc-200 rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-bold uppercase tracking-wider">
                Exceptions Queue
              </h3>
              <span className="text-[10px] font-mono text-zinc-500">3 OPEN</span>
            </div>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-3 p-3 rounded-sm bg-red-50/50 ring-1 ring-red-100">
                <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12.5px] font-semibold text-red-900">
                    Shortage on DEL-900218
                  </div>
                  <div className="text-[11px] text-red-700/80 mt-0.5">
                    14 units missing of BP-44201 — vendor: Reliance Power
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-sm bg-amber-50/50 ring-1 ring-amber-100">
                <AlertCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12.5px] font-semibold text-zinc-900">
                    Unassigned gate
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    DEL-900215 vehicle on-site, no dock assigned in SAP
                  </div>
                </div>
              </li>
              <li className="flex items-start gap-3 p-3 rounded-sm bg-zinc-50 ring-1 ring-zinc-200">
                <AlertCircle className="size-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[12.5px] font-semibold text-zinc-900">
                    Pick task blocked
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5">
                    PCK-99115 — bin FG-C-04-02 inventory mismatch
                  </div>
                </div>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <DataTable
              title="Inbound Deliveries Queue"
              rows={inboundDeliveries.slice(0, 5)}
              columns={cols}
              toolbar={
                <Link
                  to="/inbound"
                  className="flex items-center gap-1 text-[12px] font-semibold text-blue-700 hover:underline"
                >
                  View all
                  <ArrowUpRight className="size-3.5" />
                </Link>
              }
            />
          </div>
        </div>
      </div>
    </>
  );
}
