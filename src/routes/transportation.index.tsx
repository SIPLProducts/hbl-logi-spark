import { createFileRoute, Link } from "@tanstack/react-router";
import { Filter, Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { shipments, type Shipment } from "@/lib/mock-data";

export const Route = createFileRoute("/transportation/")({
  head: () => ({
    meta: [
      { title: "Shipments · HBL Logistics Execution" },
      { name: "description", content: "All planned, in-transit, and delivered shipments across HBL routes." },
    ],
  }),
  component: TransportationPage,
});

function TransportationPage() {
  const cols: Column<Shipment>[] = [
    { key: "id", header: "Shipment #", render: (r) => (
      <Link to="/transportation/shipment/$id" params={{ id: r.id }} className="font-mono font-semibold text-blue-700 hover:underline">{r.id}</Link>
    ) },
    { key: "route", header: "Route", render: (r) => r.route },
    { key: "carrier", header: "Carrier", render: (r) => (
      <div>
        <div className="text-zinc-900">{r.carrier}</div>
        <div className="text-[11px] text-zinc-500 font-mono">{r.vehicle}</div>
      </div>
    ) },
    { key: "stops", header: "Stops", align: "center", render: (r) => <span className="font-mono">{r.stops}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "dep", header: "Departure", render: (r) => <span className="font-mono text-zinc-600">{r.departure}</span> },
    { key: "arr", header: "Arrival", render: (r) => <span className="font-mono text-zinc-600">{r.arrival}</span> },
  ];
  return (
    <>
      <PageHeader
        breadcrumb="Transportation"
        title="Shipments"
        description="Carrier loads built from outbound deliveries, tracked from plant gate to customer dock."
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50"><Filter className="size-3.5" /> Filter</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700"><Plus className="size-3.5" /> Plan Shipment</button>
          </>
        }
      />
      <div className="p-6"><DataTable rows={shipments} columns={cols} /></div>
    </>
  );
}