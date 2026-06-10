import { createFileRoute } from "@tanstack/react-router";
import { Search, MapPin } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { shipments, stopsForShipment, type Stop } from "@/lib/mock-data";

export const Route = createFileRoute("/transportation/tracking")({
  head: () => ({
    meta: [
      { title: "Tracking · HBL Logistics Execution" },
      { name: "description", content: "Real-time freight tracking across active shipments." },
    ],
  }),
  component: TrackingPage,
});

function TrackingPage() {
  const active = shipments.find((s) => s.status === "In Transit") ?? shipments[0];
  const stops = stopsForShipment[active.id] ?? [];

  const cols: Column<Stop>[] = [
    { key: "seq", header: "#", align: "center", render: (r) => <span className="font-mono">{r.seq}</span> },
    { key: "loc", header: "Location", render: (r) => <span className="flex items-center gap-1.5"><MapPin className="size-3.5 text-zinc-400" />{r.location}</span> },
    { key: "p", header: "Planned", render: (r) => <span className="font-mono">{r.planned}</span> },
    { key: "a", header: "Actual", render: (r) => <span className="font-mono">{r.actual}</span> },
    { key: "s", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];

  return (
    <>
      <PageHeader breadcrumb="Transportation" title="Freight Tracking" description="Live view of shipment progress, stop ETAs, and exceptions." />
      <div className="p-6 space-y-6">
        <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-4 flex items-center gap-3">
          <Search className="size-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Track by Shipment #, Vehicle Reg, or Delivery #"
            defaultValue={active.id}
            className="flex-1 bg-transparent text-[13px] font-mono outline-none placeholder:text-zinc-400"
          />
          <button className="px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">Track</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white ring-1 ring-zinc-200 rounded-sm p-5 space-y-4">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Shipment</div>
              <div className="text-lg font-mono font-bold">{active.id}</div>
              <StatusBadge label={active.status} tone={statusTone(active.status)} />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Route</dt>
                <dd className="mt-0.5">{active.route}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Carrier</dt>
                <dd className="mt-0.5">{active.carrier}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vehicle</dt>
                <dd className="mt-0.5 font-mono">{active.vehicle}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Driver</dt>
                <dd className="mt-0.5">{active.driver}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Departure</dt>
                <dd className="mt-0.5 font-mono">{active.departure}</dd>
              </div>
              <div>
                <dt className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">ETA</dt>
                <dd className="mt-0.5 font-mono">{active.arrival}</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-2 bg-white ring-1 ring-zinc-200 rounded-sm overflow-hidden">
            <div
              className="relative h-64 bg-zinc-100"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            >
              <div className="absolute inset-0 grid place-items-center">
                <div className="text-center">
                  <MapPin className="size-7 text-blue-600 mx-auto" />
                  <div className="mt-2 text-[12px] font-semibold text-zinc-700">Map view (integration ready)</div>
                  <div className="text-[11px] text-zinc-500">Vehicle near Solapur Hub · 312 km to next stop</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DataTable title="Stop Schedule" rows={stops.map((s) => ({ ...s, id: s.seq }))} columns={cols as Column<Stop & { id: number }>[]} />
      </div>
    </>
  );
}