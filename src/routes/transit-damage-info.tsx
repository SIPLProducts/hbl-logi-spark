import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { LeScreenShell } from "@/components/le-screen-shell";
import { TransitDamageInfoSapCreate } from "@/components/transit-damage-info-sap-create";

export const Route = createFileRoute("/transit-damage-info")({
  component: TransitDamageInfoPage,
});

function TransitDamageInfoPage() {
  return (
    <LeScreenShell
      title="Transit Damage Info"
      renderDirectionExtras={() => (
        <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-indigo-300/60 bg-indigo-100 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
          <ClipboardList className="size-3" />
          No. of Cases Reported
          <span className="font-mono">0</span>
        </span>
      )}
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <TransitDamageInfoSapCreate mode={sap === "with" ? "with" : "without"} />
        ) : null
      }
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