import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/service-level-report")({
  head: () => ({
    meta: [
      { title: "Service Level Report · HBL LE" },
      { name: "description", content: "On-time delivery and service-level adherence by lane." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Service Level"
      description="On-time delivery and service-level adherence by lane."
      icon={Settings}
    />
  ),
});