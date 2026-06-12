import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/service-level-report")({
  component: () => (
    <ReportPlaceholder
      title="Service Level"
      description="On-time delivery and service-level adherence by lane."
      icon={Settings}
    />
  ),
});