import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/insurance")({
  component: () => (
    <ReportPlaceholder
      title="Insurance"
      description="Insurance coverage, claims raised, and settlement status."
      icon={Shield}
    />
  ),
});