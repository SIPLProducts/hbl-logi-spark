import { createFileRoute } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/pending-pods")({
  component: () => (
    <ReportPlaceholder
      title="Pending PODs"
      description="Shipments awaiting Proof-of-Delivery confirmation."
      icon={Clock}
    />
  ),
});