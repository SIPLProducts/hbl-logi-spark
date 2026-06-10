import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { putawayTasks, type PutawayTask } from "@/lib/mock-data";

export const Route = createFileRoute("/inbound/putaway")({
  head: () => ({
    meta: [
      { title: "Putaway · HBL Logistics Execution" },
      { name: "description", content: "Putaway tasks moving received stock from GR docks to bin locations." },
    ],
  }),
  component: PutawayPage,
});

function PutawayPage() {
  const cols: Column<PutawayTask>[] = [
    { key: "id", header: "Task ID", render: (r) => <span className="font-mono font-semibold text-blue-700">{r.id}</span> },
    { key: "src", header: "Source Bin", render: (r) => <span className="font-mono">{r.sourceBin}</span> },
    { key: "dst", header: "Destination Bin", render: (r) => <span className="font-mono">{r.destBin}</span> },
    { key: "mat", header: "Material", render: (r) => r.material },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-zinc-500">{r.batch}</span> },
    { key: "qty", header: "Qty", align: "right", render: (r) => <span className="font-mono">{r.qty}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "act", header: "", align: "right", render: () => (
      <button className="text-blue-600 text-[12px] font-semibold hover:underline">Confirm</button>
    ) },
  ];
  return (
    <>
      <PageHeader breadcrumb="Inbound" title="Putaway Tasks" description="Operator queue for moving received goods to storage bins." />
      <div className="p-6">
        <DataTable rows={putawayTasks} columns={cols} />
      </div>
    </>
  );
}