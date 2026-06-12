import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";
import { InvoiceLoadDetailsSapCreate } from "@/components/invoice-load-details-sap-create";

export const Route = createFileRoute("/invoice-load-details")({
  component: InvoiceLoadDetailsPage,
});

function InvoiceLoadDetailsPage() {
  return (
    <LeScreenShell
      title="Invoice Load Details"
      renderCreateBody={({ sap, direction }) =>
        direction === "outward"
          ? <InvoiceLoadDetailsSapCreate mode={sap === "with" ? "with" : "without"} />
          : null
      }
      groups={[
        {
          title: "Invoice",
          fields: [
            { label: "Invoice No.", value: "900215479" },
            { label: "Invoice Date", value: "2026-05-12T10:00", type: "date" },
            { label: "HSN", value: "85072000" },
            { label: "UoM", value: "NOS", type: "select", options: ["NOS", "KG", "BOX", "PALLET"] },
            { label: "Qty", value: 120, type: "number" },
            { label: "Rate", value: 1216.98, type: "number" },
            { label: "Taxable Value", value: 146037.2, type: "number" },
          ],
        },
        {
          title: "Taxes",
          fields: [
            { label: "CGST", value: 1460.37, type: "number" },
            { label: "SGST", value: 1460.37, type: "number" },
            { label: "IGST", value: 0, type: "number" },
            { label: "Total Invoice Value", value: 148957.95, type: "number" },
          ],
        },
        {
          title: "E-way Bill",
          fields: [
            { label: "Eway Bill No.", value: "1810 1234 5678" },
            { label: "Eway Bill Validity", value: "2026-06-13T23:59", type: "date" },
          ],
        },
        {
          title: "Packing",
          fields: [
            { label: "Pack Type", value: "Wooden Crate", type: "select", options: ["Wooden Crate", "Carton", "Pallet", "Drum"] },
            { label: "No. of Packages", value: 12, type: "number" },
            { label: "Gross Wt. (kg)", value: 1480, type: "number" },
            { label: "Net Wt. (kg)", value: 1320, type: "number" },
          ],
        },
      ]}
    />
  );
}