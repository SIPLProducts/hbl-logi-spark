import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell, type WorklistColumn } from "@/components/le-screen-shell";

export const Route = createFileRoute("/shipment-details")({
  head: () => ({
    meta: [
      { title: "Shipment Details · HBL LE" },
      { name: "description", content: "Shipment details with line items and incoterms for HBL LE." },
    ],
  }),
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
      screenNo={4}
      title="Shipment Details"
      columns={columns}
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
        rows: [
          [1, "200", "OPTIMUZ SMF BATTERY", "Finished Goods", "OPTIMUZ SMF BATTERY_OI", 1, 100, 28.5, "New"],
          [2, "200", "POWER BACKUP UPS", "Finished Goods", "UPS-2KVA-LION", 4, 120, 96, "New"],
          [3, "200", "DEFENCE BATTERY", "Finished Goods", "AIRCRAFT-BATT-24V", 2, 65, 42, "Refurbished"],
        ],
      }}
    />
  );
}