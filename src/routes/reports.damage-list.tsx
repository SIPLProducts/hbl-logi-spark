import { createFileRoute } from "@tanstack/react-router";
import { ListChecks } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/damage-list")({
  head: () => ({
    meta: [
      { title: "Damage List · HBL LE" },
      { name: "description", content: "Consolidated list of in-transit damages and resolutions." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Damage List"
      description="Consolidated list of in-transit damages and resolutions."
      icon={ListChecks}
    />
  ),
});