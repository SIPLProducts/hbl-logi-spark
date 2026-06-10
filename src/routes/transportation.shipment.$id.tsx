import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Printer } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentHeader } from "@/components/document-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { shipments, stopsForShipment, outboundDeliveries, type Stop } from "@/lib/mock-data";

export const Route = createFileRoute("/transportation/shipment/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Shipment · HBL` },
      { name: "description", content: `Shipment ${params.id} detail — stops, deliveries, and freight cost.` },
    ],
  }),
  component: ShipmentDetail,
});

function ShipmentDetail() {
  const { id } = Route.useParams();
  const s = shipments.find((x) => x.id === id) ?? shipments[0];
  const stops = stopsForShipment[s.id] ?? stopsForShipment["SHP-22011"];
  const linked = outboundDeliveries.slice(0, 3);

  const stopCols: Column<Stop & { id: number }>[] = [
    { key: "seq", header: "#", align: "center", render: (r) => <span className="font-mono">{r.seq}</span> },
    { key: "loc", header: "Location", render: (r) => r.location },
    { key: "p", header: "Planned", render: (r) => <span className="font-mono">{r.planned}</span> },
    { key: "a", header: "Actual", render: (r) => <span className="font-mono">{r.actual}</span> },
    { key: "s", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];

  const dlvCols: Column<(typeof linked)[number]>[] = [
    { key: "id", header: "Delivery", render: (r) => (
      <Link to="/outbound/delivery/$id" params={{ id: r.id }} className="font-mono font-semibold text-blue-700 hover:underline">{r.id}</Link>
    ) },
    { key: "cust", header: "Customer", render: (r) => r.customer },
    { key: "dest", header: "Destination", render: (r) => <span className="text-zinc-600">{r.destination}</span> },
    { key: "items", header: "Items", align: "right", render: (r) => <span className="font-mono">{r.items}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/transportation" className="hover:text-zinc-900 inline-flex items-center gap-1"><ChevronLeft className="size-3" /> Transportation</Link>}
        title={`Shipment ${s.id}`}
        description={`${s.route} · ${s.carrier}`}
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
            <Printer className="size-3.5" /> Print Manifest
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <DocumentHeader
          docNumber={s.id}
          docType="Shipment"
          status={s.status}
          fields={[
            { label: "Route", value: s.route },
            { label: "Carrier", value: s.carrier },
            { label: "Vehicle", value: <span className="font-mono">{s.vehicle}</span> },
            { label: "Driver", value: s.driver },
            { label: "Departure", value: <span className="font-mono">{s.departure}</span> },
            { label: "ETA", value: <span className="font-mono">{s.arrival}</span> },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable title="Stop Schedule" rows={stops.map((x) => ({ ...x, id: x.seq }))} columns={stopCols} />
          </div>
          <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider mb-4">Freight Cost</h3>
            <dl className="space-y-2 text-[12.5px]">
              <div className="flex justify-between"><dt className="text-zinc-500">Base freight</dt><dd className="font-mono">₹ 84,200</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Fuel surcharge</dt><dd className="font-mono">₹ 12,640</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Tolls</dt><dd className="font-mono">₹ 4,200</dd></div>
              <div className="flex justify-between"><dt className="text-zinc-500">Detention</dt><dd className="font-mono">₹ 0</dd></div>
              <div className="border-t border-zinc-200 pt-2 mt-2 flex justify-between font-semibold">
                <dt>Total</dt><dd className="font-mono">₹ 1,01,040</dd>
              </div>
            </dl>
          </div>
        </div>
        <DataTable title="Deliveries on this Shipment" rows={linked} columns={dlvCols} />
      </div>
    </>
  );
}