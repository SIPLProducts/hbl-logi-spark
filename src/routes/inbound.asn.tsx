import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { asnRecords, type AsnRecord } from "@/lib/mock-data";

export const Route = createFileRoute("/inbound/asn")({
  head: () => ({
    meta: [
      { title: "ASN · HBL Logistics Execution" },
      { name: "description", content: "Advance Shipping Notices from vendors, linked to purchase orders." },
    ],
  }),
  component: AsnPage,
});

function AsnPage() {
  const cols: Column<AsnRecord>[] = [
    { key: "id", header: "ASN #", render: (r) => <span className="font-mono font-semibold text-blue-700">{r.id}</span> },
    { key: "po", header: "PO Reference", render: (r) => <span className="font-mono text-zinc-600">{r.poRef}</span> },
    { key: "vendor", header: "Vendor", render: (r) => r.vendor },
    { key: "date", header: "Expected", render: (r) => <span className="font-mono text-zinc-600">{r.expectedDate}</span> },
    { key: "items", header: "Items", align: "right", render: (r) => <span className="font-mono">{r.items}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];
  return (
    <>
      <PageHeader breadcrumb="Inbound" title="Advance Shipping Notices" description="Vendor-published ASNs feeding the inbound pipeline." />
      <div className="p-6">
        <DataTable rows={asnRecords} columns={cols} />
      </div>
    </>
  );
}