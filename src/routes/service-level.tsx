import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";

export const Route = createFileRoute("/service-level")({
  head: () => ({
    meta: [
      { title: "Service Level · HBL LE" },
      { name: "description", content: "Customer-facing shipment feedback and OTIF rating." },
    ],
  }),
  component: ServiceLevelPage,
});

function ServiceLevelPage() {
  return (
    <LeScreenShell
      screenNo={10}
      title="Service Level (Shipment Feedback)"
      groups={[
        {
          title: "Delivery",
          fields: [
            { label: "Shipment No.", value: "SHP-2026-0042" },
            { label: "Customer", value: "RELIANCE INDUSTRIES LIMITED" },
            { label: "Delivery Date Planned", value: "2026-06-13T04:00", type: "date" },
            { label: "Delivery Date Actual", value: "2026-06-13T07:15", type: "date" },
            { label: "OTIF", value: "No", type: "select", options: ["Yes", "No"] },
            { label: "Delay Reason", value: "Traffic at Mumbai entry", type: "select", options: ["Traffic", "Vehicle Breakdown", "Customer Hold", "Weather", "Other"] },
          ],
        },
        {
          title: "Receipt Quality",
          fields: [
            { label: "Damage at Receipt", value: "No", type: "select", options: ["Yes", "No"] },
            { label: "Quantity Short", value: 0, type: "number" },
            { label: "Customer Rating (1–5)", value: 4, type: "number" },
            { label: "POD Received", value: "Yes", type: "select", options: ["Yes", "No"] },
            { label: "POD Date", value: "2026-06-13T08:00", type: "date" },
            { label: "Photo / Evidence", value: "pod-shp-2026-0042.jpg" },
          ],
        },
        {
          title: "Feedback",
          fields: [
            { label: "Feedback Notes", value: "Driver courteous; minor 3-hour delay acknowledged.", span: 4, type: "textarea" },
          ],
        },
      ]}
    />
  );
}