import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/loading-factor-cost")({
  component: () => (
    <ReportPlaceholder
      title="Loading Factor & Cost"
      description="Vehicle loading factor and cost-per-ton trends."
      icon={BarChart3}
    />
  ),
});