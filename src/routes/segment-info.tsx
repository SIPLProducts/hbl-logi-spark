import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";
import { SegmentInfoSapCreate } from "@/components/segment-info-sap-create";

export const Route = createFileRoute("/segment-info")({
  head: () => ({
    meta: [
      { title: "Segment Info · HBL LE" },
      { name: "description", content: "Multi-segment leg planning for HBL shipments." },
    ],
  }),
  component: SegmentInfoPage,
});

function SegmentInfoPage() {
  return (
    <LeScreenShell
      title="Segment Info"
      renderCreateBody={({ sap, direction }) =>
        direction === "outward"
          ? <SegmentInfoSapCreate mode={sap === "with" ? "with" : "without"} />
          : null
      }
      groups={[
        {
          title: "Segment",
          fields: [
            { label: "Segment No.", value: "SEG-001" },
            { label: "Mode", value: "Road", type: "select", options: ["Road", "Rail", "Air", "Sea"] },
            { label: "Origin", value: "Shameerpet WH" },
            { label: "Destination", value: "Solapur Hub" },
            { label: "Distance (km)", value: 525, type: "number" },
            { label: "Carrier", value: "SAFEXPRESS PRIVATE LTD" },
            { label: "Vehicle / Container No.", value: "TS09EE4521" },
            { label: "Stage Cost", value: 18500, type: "number" },
          ],
        },
        {
          title: "Schedule",
          fields: [
            { label: "Planned Departure", value: "2026-06-10T08:00", type: "date" },
            { label: "Planned Arrival", value: "2026-06-11T06:00", type: "date" },
            { label: "Actual Departure", value: "2026-06-10T08:25", type: "date" },
            { label: "Actual Arrival", value: "", type: "date" },
            { label: "Remarks", value: "Driver change at Pune", span: 4, type: "textarea" },
          ],
        },
      ]}
      lineItems={{
        columns: ["Sl.No", "Origin", "Destination", "Mode", "Distance (km)", "Planned Dep.", "Planned Arr.", "Status"],
        rows: [
          [1, "Shameerpet WH", "Solapur Hub", "Road", 525, "10-Jun 08:00", "11-Jun 06:00", "In Transit"],
          [2, "Solapur Hub", "Mumbai DC", "Road", 410, "11-Jun 09:00", "11-Jun 21:00", "Planned"],
          [3, "Mumbai DC", "Jamnagar Refinery", "Road", 720, "12-Jun 06:00", "13-Jun 04:00", "Planned"],
        ],
      }}
    />
  );
}