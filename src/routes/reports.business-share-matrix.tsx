import { createFileRoute } from "@tanstack/react-router";
import { Grid3x3 } from "lucide-react";
import { ReportPlaceholder } from "@/components/report-placeholder";

export const Route = createFileRoute("/reports/business-share-matrix")({
  head: () => ({
    meta: [
      { title: "Business Share Matrix · HBL LE" },
      { name: "description", content: "Share of business by transporter, lane, and division." },
    ],
  }),
  component: () => (
    <ReportPlaceholder
      title="Business Share Matrix"
      description="Share of business by transporter, lane, and division."
      icon={Grid3x3}
    />
  ),
});