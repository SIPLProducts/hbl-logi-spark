import { createFileRoute } from "@tanstack/react-router";
import { ScanLine, Check } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { pickTasks, type PickTask } from "@/lib/mock-data";

export const Route = createFileRoute("/outbound/picking")({
  head: () => ({
    meta: [
      { title: "Picking · HBL Logistics Execution" },
      { name: "description", content: "Operator pick task queue with scan-to-confirm interface." },
    ],
  }),
  component: PickingPage,
});

function PickingPage() {
  const cols: Column<PickTask>[] = [
    { key: "id", header: "Task ID", render: (r) => <span className="font-mono font-semibold text-blue-700">{r.id}</span> },
    { key: "wt", header: "WT", render: (r) => <span className="font-mono text-zinc-600">{r.warehouseTask}</span> },
    { key: "src", header: "Source Bin", render: (r) => <span className="font-mono">{r.sourceBin}</span> },
    { key: "mat", header: "Material", render: (r) => (
      <div>
        <div className="text-zinc-900">{r.material}</div>
        <div className="text-[11px] text-zinc-500 font-mono">{r.materialCode}</div>
      </div>
    ) },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-zinc-500">{r.batch}</span> },
    { key: "qty", header: "Qty / Conf.", align: "right", render: (r) => (
      <span className="font-mono">{r.confirmedQty}/{r.qty}</span>
    ) },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "act", header: "", align: "right", render: () => (
      <button className="text-blue-600 text-[12px] font-semibold hover:underline">Confirm</button>
    ) },
  ];

  const current = pickTasks.find((t) => t.status === "In Progress") ?? pickTasks[0];

  return (
    <>
      <PageHeader
        breadcrumb="Outbound"
        title="Picking"
        description="Active wave picks. Operators confirm each line via scan or manual override."
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">
            <Check className="size-3.5" /> Batch Confirm
          </button>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white ring-1 ring-zinc-200 rounded-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Current Task</div>
                <div className="text-lg font-mono font-bold mt-1">{current.id}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Progress</div>
                <div className="text-lg font-mono font-bold mt-1">{current.confirmedQty}/{current.qty}</div>
              </div>
            </div>
            <div className="p-4 bg-blue-50 ring-1 ring-blue-200 rounded-sm flex items-center gap-4">
              <div className="size-14 bg-white ring-1 ring-zinc-200 rounded-sm grid place-items-center font-mono font-bold text-xl">
                {current.sourceBin.slice(-2)}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Pick at</div>
                <div className="font-mono font-bold text-[15px] mt-0.5">{current.sourceBin}</div>
                <div className="text-[12px] text-zinc-700 mt-1">{current.material}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Qty</div>
                <div className="font-mono font-bold text-2xl">{current.qty - current.confirmedQty}</div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-950 text-white rounded-sm p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <ScanLine className="size-4 text-blue-400" />
              <span className="text-[12px] font-bold uppercase tracking-wider">Scanner Ready</span>
            </div>
            <p className="text-[12px] text-zinc-400 mb-4">Aim handheld at material barcode to confirm.</p>
            <div className="bg-white/5 ring-1 ring-white/10 rounded-sm px-3 py-2.5 font-mono text-[12px] text-zinc-400 mb-3">
              Waiting for input…
            </div>
            <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-sm text-[12.5px] font-semibold transition-colors">
              Manual Override
            </button>
          </div>
        </div>

        <DataTable title="Pick Task Queue" rows={pickTasks} columns={cols} />
      </div>
    </>
  );
}