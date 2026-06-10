import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { BarChart3, Truck, PackageOpen, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/reports/")({
  head: () => ({
    meta: [
      { title: "Reports · HBL Logistics Execution" },
      { name: "description", content: "Operational reports for inbound, outbound, OTIF, and exception logs." },
    ],
  }),
  component: ReportsPage,
});

const reports = [
  { title: "Inbound Summary", desc: "GRs, putaway dwell, vendor on-time performance.", icon: PackageOpen },
  { title: "Outbound Summary", desc: "Picks, packs, GIs by shipping point and route.", icon: Truck },
  { title: "OTIF Analysis", desc: "On-time / in-full trends by customer & route.", icon: BarChart3 },
  { title: "Exception Log", desc: "Shortages, blocked tasks, gate exceptions.", icon: AlertTriangle },
];

function ReportsPage() {
  return (
    <>
      <PageHeader
        breadcrumb="Overview"
        title="Reports"
        description="Static report templates sourced from the SAP HANA logistics data model."
      />
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r) => (
          <button
            key={r.title}
            className="text-left bg-white ring-1 ring-zinc-200 rounded-sm p-5 hover:ring-blue-500 hover:bg-blue-50/30 transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="size-9 rounded-sm bg-blue-50 text-blue-700 grid place-items-center">
                <r.icon className="size-4" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-zinc-900">{r.title}</div>
                <div className="text-[12px] text-zinc-500 mt-1">{r.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}