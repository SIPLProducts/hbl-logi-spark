import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/insurance")({
  head: () => ({
    meta: [
      { title: "Insurance · HBL LE" },
      { name: "description", content: "Insurance coverage, claims raised, and settlement status." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Insurance"
      description="Insurance coverage, claims raised, and settlement status."
      icon={Shield}
    />
  ),
});