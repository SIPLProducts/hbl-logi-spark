import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { packingTasks, type PackingTask } from "@/lib/mock-data";

export const Route = createFileRoute("/outbound/packing")({
  head: () => ({
    meta: [
      { title: "Packing · HBL Logistics Execution" },
      { name: "description", content: "Handling unit packing tasks for outbound deliveries." },
    ],
  }),
  component: PackingPage,
});

function PackingPage() {
  const cols: Column<PackingTask>[] = [
    { key: "id", header: "Task ID", render: (r) => <span className="font-mono font-semibold text-blue-700">{r.id}</span> },
    { key: "dlv", header: "Delivery", render: (r) => <span className="font-mono">{r.delivery}</span> },
    { key: "hu", header: "Handling Unit", render: (r) => <span className="font-mono">{r.hu}</span> },
    { key: "qty", header: "Packed", align: "right", render: (r) => <span className="font-mono">{r.packedQty}</span> },
    { key: "wt", header: "Gross Weight", align: "right", render: (r) => <span className="font-mono">{r.grossWeight}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ];
  return (
    <>
      <PageHeader breadcrumb="Outbound" title="Packing" description="Build handling units, confirm weights, and seal HU labels." />
      <div className="p-6"><DataTable rows={packingTasks} columns={cols} /></div>
    </>
  );
}