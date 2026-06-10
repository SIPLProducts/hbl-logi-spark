import { createFileRoute, Link } from "@tanstack/react-router";
import { Printer, RotateCcw, CheckCircle2, ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentHeader } from "@/components/document-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusTimeline } from "@/components/status-timeline";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { inboundDeliveries, inboundLineItems } from "@/lib/mock-data";

export const Route = createFileRoute("/inbound/delivery/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Inbound Delivery · HBL` },
      { name: "description", content: `Inbound delivery ${params.id} detail — line items, batches, and status timeline.` },
    ],
  }),
  component: DeliveryDetailPage,
});

function DeliveryDetailPage() {
  const { id } = Route.useParams();
  const delivery = inboundDeliveries.find((d) => d.id === id) ?? inboundDeliveries[0];

  const cols: Column<(typeof inboundLineItems)[number]>[] = [
    { key: "item", header: "Item", render: (r) => <span className="font-mono">{r.item}</span> },
    { key: "mat", header: "Material", render: (r) => (
      <div>
        <div className="font-mono text-zinc-900">{r.material}</div>
        <div className="text-[11px] text-zinc-500">{r.description}</div>
      </div>
    ) },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-zinc-500">{r.batch}</span> },
    { key: "order", header: "Order Qty", align: "right", render: (r) => <span className="font-mono">{r.orderQty}</span> },
    { key: "gr", header: "GR Qty", align: "right", render: (r) => (
      <span className={"font-mono " + (r.grQty < r.orderQty ? "text-red-600 font-semibold" : "")}>{r.grQty}</span>
    ) },
    { key: "uom", header: "UoM", render: (r) => <span className="text-zinc-500">{r.uom}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];

  return (
    <>
      <PageHeader
        breadcrumb={
          <Link to="/inbound" className="hover:text-zinc-900 inline-flex items-center gap-1">
            <ChevronLeft className="size-3" /> Inbound
          </Link>
        }
        title={`Inbound Delivery ${delivery.id}`}
        description={`Goods receipt from ${delivery.vendor} at dock ${delivery.dock}.`}
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
              <Printer className="size-3.5" /> Print
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
              <RotateCcw className="size-3.5" /> Reverse GR
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">
              <CheckCircle2 className="size-3.5" /> Post GR
            </button>
          </>
        }
      />

      <div className="p-6 space-y-6">
        <DocumentHeader
          docNumber={delivery.id}
          docType="Inbound Delivery"
          status={delivery.status}
          fields={[
            { label: "Vendor", value: delivery.vendor },
            { label: "Vendor Code", value: <span className="font-mono">{delivery.vendorCode}</span> },
            { label: "Plant", value: <span className="font-mono">{delivery.plant}</span> },
            { label: "Dock", value: <span className="font-mono">{delivery.dock}</span> },
            { label: "ETA", value: <span className="font-mono">{delivery.eta}</span> },
            { label: "Priority", value: delivery.priority },
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable title="Line Items" rows={inboundLineItems} columns={cols} />
          </div>
          <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider mb-4">
              Status Timeline
            </h3>
            <StatusTimeline
              steps={[
                { label: "Delivery Created", timestamp: "2026-06-09 18:22", user: "Sys/ECC", state: "done" },
                { label: "Vehicle Arrived", timestamp: "2026-06-10 14:18", user: "Gate-04", state: "done" },
                { label: "GR Posted", timestamp: "2026-06-10 14:42", user: "S. Rajan", state: "current" },
                { label: "Putaway Complete", state: "pending" },
              ]}
            />
          </div>
        </div>
      </div>
    </>
  );
}