import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";
import { TransitInfoSapCreate } from "@/components/transit-info-sap-create";

export const Route = createFileRoute("/transit-info")({
  head: () => ({
    meta: [
      { title: "Transit Info · HBL LE" },
      { name: "description", content: "Live transit status, geofence, and stop timeline." },
    ],
  }),
  component: TransitInfoPage,
});

function TransitInfoPage() {
  return (
    <LeScreenShell
      title="Transit Info"
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <TransitInfoSapCreate mode={sap === "with" ? "with" : "without"} />
        ) : null
      }
      groups={[
        {
          title: "Live Status",
          fields: [
            { label: "Shipment No.", value: "SHP-2026-0042" },
            { label: "Current Location", value: "NH-65 near Solapur" },
            { label: "Last Ping Time", value: "2026-06-10T14:32", type: "date" },
            { label: "Next Stop", value: "Solapur Hub" },
            { label: "ETA", value: "2026-06-11T05:45", type: "date" },
            { label: "Delay (hrs)", value: 1.5, type: "number" },
            { label: "Temperature (°C)", value: 32, type: "number" },
            { label: "Geofence Status", value: "Inside Corridor", type: "select", options: ["Inside Corridor", "Out of Corridor", "Stopped > 30m"] },
            { label: "Exception", value: "None", type: "select", options: ["None", "Breakdown", "Detention", "Re-routed"] },
            { label: "Remarks", value: "", span: 3, type: "textarea" },
          ],
        },
      ]}
      lineItems={{
        columns: ["Seq", "Stop", "Planned", "Actual", "Status"],
        rows: [],
      }}
    />
  );
}