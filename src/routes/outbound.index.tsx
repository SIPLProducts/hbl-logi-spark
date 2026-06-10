import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Download, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { outboundDeliveries, type OutboundDelivery } from "@/lib/mock-data";

export const Route = createFileRoute("/outbound/")({
  head: () => ({
    meta: [
      { title: "Outbound Deliveries · HBL Logistics Execution" },
      { name: "description", content: "Outbound deliveries worklist — picking, packing, goods issue, and dispatch." },
    ],
  }),
  component: OutboundPage,
});

function OutboundPage() {
  const cols: Column<OutboundDelivery>[] = [
    { key: "id", header: "Delivery #", render: (r) => (
      <Link to="/outbound/delivery/$id" params={{ id: r.id }} className="font-mono font-semibold text-blue-700 hover:underline">{r.id}</Link>
    ) },
    { key: "customer", header: "Customer / Destination", render: (r) => (
      <div>
        <div className="text-zinc-900 font-medium">{r.customer}</div>
        <div className="text-[11px] text-zinc-500">{r.destination}</div>
      </div>
    ) },
    { key: "items", header: "Items", align: "center", render: (r) => <span className="font-mono">{r.items}</span> },
    { key: "etd", header: "ETD", render: (r) => <span className="text-zinc-600">{r.etd}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "priority", header: "Priority", render: (r) => (
      <span className={"text-[12px] font-medium " + (r.priority === "Critical" ? "text-red-600" : r.priority === "High" ? "text-amber-600" : "text-zinc-500")}>{r.priority}</span>
    ) },
    { key: "act", header: "", align: "right", render: (r) => (
      <Link to="/outbound/delivery/$id" params={{ id: r.id }} className="text-blue-600 text-[12px] font-semibold hover:underline">Open</Link>
    ) },
  ];
  return (
    <>
      <PageHeader
        breadcrumb="Outbound"
        title="Outbound Deliveries"
        description="Customer deliveries across all shipping points. Drive picking, packing, and goods issue."
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50"><Filter className="size-3.5" /> Filter</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50"><Download className="size-3.5" /> Export</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700"><Plus className="size-3.5" /> Create Delivery</button>
          </>
        }
      />
      <div className="p-6"><DataTable rows={outboundDeliveries} columns={cols} /></div>
    </>
  );
}