import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/freight-bills")({
  head: () => ({
    meta: [
      { title: "Freight Bills · HBL LE" },
      { name: "description", content: "Freight billing summary by carrier, plant, and period." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Freight Bills"
      description="Freight billing summary by carrier, plant, and period."
      icon={FileSpreadsheet}
    />
  ),
});