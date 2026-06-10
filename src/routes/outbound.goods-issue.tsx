import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { DataTable, type Column } from "@/components/data-table";
import { StatusBadge, statusTone } from "@/components/status-badge";
import { goodsIssues, type GoodsIssue } from "@/lib/mock-data";

export const Route = createFileRoute("/outbound/goods-issue")({
  head: () => ({
    meta: [
      { title: "Goods Issue · HBL Logistics Execution" },
      { name: "description", content: "Post and reverse goods issue documents for outbound deliveries." },
    ],
  }),
  component: GoodsIssuePage,
});

function GoodsIssuePage() {
  const cols: Column<GoodsIssue>[] = [
    { key: "id", header: "GI Doc", render: (r) => <span className="font-mono font-semibold text-blue-700">{r.id}</span> },
    { key: "dlv", header: "Delivery", render: (r) => <span className="font-mono">{r.delivery}</span> },
    { key: "date", header: "GI Date", render: (r) => <span className="font-mono text-zinc-600">{r.giDate}</span> },
    { key: "mat", header: "Material", render: (r) => r.material },
    { key: "batch", header: "Batch", render: (r) => <span className="font-mono text-zinc-500">{r.batch}</span> },
    { key: "qty", header: "Qty", align: "right", render: (r) => <span className="font-mono">{r.qty}</span> },
    { key: "status", header: "Status", render: (r) => <StatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: "act", header: "", align: "right", render: (r) => (
      r.status === "Posted"
        ? <button className="text-zinc-500 text-[12px] font-semibold hover:underline">Reverse</button>
        : <button className="text-blue-600 text-[12px] font-semibold hover:underline">Post GI</button>
    ) },
  ];
  return (
    <>
      <PageHeader breadcrumb="Outbound" title="Goods Issue" description="Trigger material movement out of plant and update SAP HANA stocks." />
      <div className="p-6"><DataTable rows={goodsIssues} columns={cols} /></div>
    </>
  );
}