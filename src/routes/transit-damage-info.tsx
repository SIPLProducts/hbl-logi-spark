import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";

export const Route = createFileRoute("/transit-damage-info")({
  head: () => ({
    meta: [
      { title: "Transit Damage Info · HBL LE" },
      { name: "description", content: "Capture damage observed during transit for downstream claims." },
    ],
  }),
  component: TransitDamageInfoPage,
});

function TransitDamageInfoPage() {
  return (
    <LeScreenShell
      screenNo={11}
      title="Transit Damage Info"
      groups={[
        {
          title: "Damage",
          fields: [
            { label: "Shipment No.", value: "SHP-2026-0042" },
            { label: "LR No.", value: "6756557" },
            { label: "Material", value: "OPTIMUZ SMF BATTERY_OI" },
            { label: "Damaged Qty", value: 3, type: "number" },
            { label: "Damage Type", value: "Leak", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"] },
            { label: "Stage Detected", value: "Customer Receipt", type: "select", options: ["Loading", "In Transit", "Unloading", "Customer Receipt"] },
          ],
        },
        {
          title: "Reporting",
          fields: [
            { label: "Reported By", value: "Harshini Lingutla" },
            { label: "Reported Date", value: "2026-06-13T09:00", type: "date" },
            { label: "Photo / Evidence", value: "damage-shp-2026-0042-01.jpg" },
            { label: "Cost Estimate", value: 28500, type: "number" },
            { label: "Recovery From", value: "Transporter", type: "select", options: ["Transporter", "Insurance", "HBL"] },
          ],
        },
        {
          title: "Remarks",
          fields: [
            { label: "Remarks", value: "Top-layer crate dented; 3 cells leaking, isolated and replaced.", span: 4, type: "textarea" },
          ],
        },
      ]}
    />
  );
}