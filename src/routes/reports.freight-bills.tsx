import { createFileRoute } from "@tanstack/react-router";
import { FileSpreadsheet } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/freight-bills")({
  component: () => (
    <ReportPlaceholder
      title="Freight Bills"
      description="Freight billing summary by carrier, plant, and period."
      icon={FileSpreadsheet}
    />
  ),
});