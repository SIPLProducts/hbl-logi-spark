import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell, type WorklistColumn } from "@/components/le-screen-shell";
import { ShipmentDetailsSapCreate } from "@/components/shipment-details-sap-create";

export const Route = createFileRoute("/shipment-details")({
  component: ShipmentDetailsPage,
});

const columns: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "mapId", header: "Map ID", render: (r) => <span className="font-mono">{r.mapId}</span> },
  { key: "reference", header: "Reference Number", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order Number", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

function ShipmentDetailsPage() {
  return (
    <LeScreenShell
      title="Shipment Details"
      columns={columns}
      renderCreateBody={({ sap, direction }) =>
        direction === "outward"
          ? <ShipmentDetailsSapCreate mode={sap === "with" ? "with" : "without"} />
          : null
      }
      topFields={[
        { label: "Incoterms", value: "FOR", type: "select", options: ["FOR", "FOB", "CIF", "EXW", "DAP"] },
        { label: "Insurance Scope", value: "Select Insurance Scope", type: "select", options: ["Transit Insurance", "Open Policy", "Self Insured"] },
        { label: "Kilometres", value: 0, type: "number" },
        { label: "DC Reference Number", value: "DC-2026-001142" },
      ]}
      lineItems={{
        columns: [
          "Sl.No",
          "Map ID",
          "Product",
          "Type of Material",
          "Material Description",
          "No of Sets/No (Qty)",
          "Ah Loaded",
          "Shipment Weight (kg)",
          "Battery Condition",
        ],
        rows: [],
      }}
    />
  );
}