import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Download, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { inboundDeliveries, type InboundDelivery } from "@/lib/mock-data";

export const Route = createFileRoute("/inbound/")({
  head: () => ({
    meta: [
      { title: "Inbound Deliveries · HBL Logistics Execution" },
      { name: "description", content: "Inbound deliveries worklist — Goods Receipt, ASN, and Putaway operations." },
    ],
  }),
  component: InboundPage,
});

function InboundPage() {
  const cols: Column<InboundDelivery>[] = [
    {
      key: "id",
      header: "Delivery #",
      render: (r) => (
        <Link to="/inbound/delivery/$id" params={{ id: r.id }} className="font-mono font-semibold text-blue-700 hover:underline">
          {r.id}
        </Link>
      ),
    },
    { key: "vendor", header: "Vendor", render: (r) => (
      <div>
        <div className="text-zinc-900">{r.vendor}</div>
        <div className="text-[11px] text-zinc-500 font-mono">{r.vendorCode}</div>
      </div>
    ) },
    { key: "items", header: "Items", render: (r) => <span className="text-zinc-500">{r.items}</span> },
    { key: "dock", header: "Dock", align: "center", render: (r) => (
      <span className="font-mono text-[12px] bg-zinc-100 px-1.5 py-0.5 rounded-sm">{r.dock}</span>
    ) },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "priority", header: "Priority", render: (r) => (
      <span className={"text-[12px] font-medium " + (r.priority === "Critical" ? "text-red-600" : r.priority === "High" ? "text-amber-600" : "text-zinc-500")}>{r.priority}</span>
    ) },
    { key: "eta", header: "ETA", render: (r) => <span className="font-mono">{r.eta}</span> },
    { key: "actions", header: "", align: "right", render: (r) => (
      <Link to="/inbound/delivery/$id" params={{ id: r.id }} className="text-blue-600 text-[12px] font-semibold hover:underline">
        Open
      </Link>
    ) },
  ];

  return (
    <>
      <PageHeader
        breadcrumb="Inbound"
        title="Inbound Deliveries"
        description="All expected and arrived deliveries across HYD-PLANT-04. Confirm GR, manage dock assignments, and resolve exceptions."
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
              <Filter className="size-3.5" /> Filter
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
              <Download className="size-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">
              <ScanLine className="size-3.5" /> Scan ASN
            </button>
          </>
        }
      />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap gap-2">
          {["All", "Expected", "Arrived", "Unloaded", "Exception"].map((s, i) => (
            <button
              key={s}
              className={
                "px-3 py-1.5 text-[12px] font-semibold rounded-sm ring-1 transition-colors " +
                (i === 0
                  ? "bg-zinc-900 text-white ring-zinc-900"
                  : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50")
              }
            >
              {s}
              <span className={"ml-2 text-[10px] font-mono " + (i === 0 ? "text-zinc-300" : "text-zinc-400")}>
                {[6, 1, 2, 1, 1][i]}
              </span>
            </button>
          ))}
        </div>

        <DataTable rows={inboundDeliveries} columns={cols} />
      </div>
    </>
  );
}