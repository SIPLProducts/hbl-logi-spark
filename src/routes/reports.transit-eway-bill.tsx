import { createFileRoute } from "@tanstack/react-router";
import { Layers } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/transit-eway-bill")({
  head: () => ({
    meta: [
      { title: "Transit & E-way bill Report · HBL LE" },
      { name: "description", content: "Transit movements with linked E-way bill numbers and validity." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Transit & E-way bill Report"
      description="Transit movements with linked E-way bill numbers and validity."
      icon={Layers}
    />
  ),
});