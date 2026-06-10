import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck, Send, ChevronLeft, Package } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DocumentHeader } from "@/components/document-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusTimeline } from "@/components/status-timeline";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { outboundDeliveries, outboundLineItems } from "@/lib/mock-data";

export const Route = createFileRoute("/outbound/delivery/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.id} · Outbound Delivery · HBL` },
      { name: "description", content: `Outbound delivery ${params.id} — picking, packing, GI, and shipment.` },
    ],
  }),
  component: OutboundDetail,
});

function OutboundDetail() {
  const { id } = Route.useParams();
  const d = outboundDeliveries.find((x) => x.id === id) ?? outboundDeliveries[0];

  const cols: Column<(typeof outboundLineItems)[number]>[] = [
    { key: "item", header: "Item", render: (r) => <span className="font-mono">{r.item}</span> },
    { key: "mat", header: "Material", render: (r) => (
      <div>
        <div className="font-mono text-zinc-900">{r.material}</div>
        <div className="text-[11px] text-zinc-500">{r.description}</div>
      </div>
    ) },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-zinc-500">{r.batch}</span> },
    { key: "ord", header: "Order", align: "right", render: (r) => <span className="font-mono">{r.orderQty}</span> },
    { key: "pick", header: "Picked", align: "right", render: (r) => <span className="font-mono">{r.pickQty}</span> },
    { key: "gi", header: "GI", align: "right", render: (r) => <span className="font-mono">{r.giQty}</span> },
    { key: "uom", header: "UoM", render: (r) => <span className="text-zinc-500">{r.uom}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];

  const order = ["Created", "Picking", "Picked", "Packed", "Goods Issued", "Shipped"] as const;
  const idx = order.indexOf(d.status);

  return (
    <>
      <PageHeader
        breadcrumb={<Link to="/outbound" className="hover:text-zinc-900 inline-flex items-center gap-1"><ChevronLeft className="size-3" /> Outbound</Link>}
        title={`Outbound Delivery ${d.id}`}
        description={`To ${d.customer} — ${d.destination}`}
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50"><Package className="size-3.5" /> Pack</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50"><Send className="size-3.5" /> Post GI</button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700"><Truck className="size-3.5" /> Create Shipment</button>
          </>
        }
      />
      <div className="p-6 space-y-6">
        <DocumentHeader
          docNumber={d.id}
          docType="Outbound Delivery"
          status={d.status}
          fields={[
            { label: "Customer", value: d.customer },
            { label: "Cust. Code", value: <span className="font-mono">{d.customerCode}</span> },
            { label: "Ship-To", value: d.destination },
            { label: "Shipping Pt.", value: <span className="font-mono">{d.shippingPoint}</span> },
            { label: "Route", value: <span className="font-mono">{d.route}</span> },
            { label: "ETD", value: d.etd },
          ]}
        />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DataTable title="Line Items" rows={outboundLineItems} columns={cols} />
          </div>
          <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-5">
            <h3 className="text-[12px] font-bold uppercase tracking-wider mb-4">Status Timeline</h3>
            <StatusTimeline
              steps={order.map((step, i) => ({
                label: step,
                timestamp: i < idx ? "Completed" : i === idx ? "In progress" : undefined,
                state: i < idx ? "done" : i === idx ? "current" : "pending",
              }))}
            />
          </div>
        </div>
      </div>
    </>
  );
}