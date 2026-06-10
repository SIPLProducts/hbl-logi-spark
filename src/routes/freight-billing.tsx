import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";

export const Route = createFileRoute("/freight-billing")({
  head: () => ({
    meta: [
      { title: "Freight Billing · HBL LE" },
      { name: "description", content: "Freight billing for Full Truck Load and Cargo modes." },
    ],
  }),
  component: FreightBillingPage,
});

function FreightBillingPage() {
  return (
    <LeScreenShell
      screenNo={9}
      title="Freight Billing"
      extraTabs={[
        { label: "Full Truck Load", active: true },
        { label: "Cargo" },
      ]}
      groups={[
        {
          title: "Charges",
          fields: [
            { label: "Basic Freight", value: 22000, type: "number" },
            { label: "Detention", value: 1500, type: "number" },
            { label: "Loading / Unloading Charges", value: 1200, type: "number" },
            { label: "Multi-point Charges", value: 800, type: "number" },
            { label: "Toll", value: 2400, type: "number" },
            { label: "Other Charges", value: 350, type: "number" },
            { label: "Sub Total", value: 28250, type: "number" },
          ],
        },
        {
          title: "Taxes & Deductions",
          fields: [
            { label: "GST %", value: 12, type: "number" },
            { label: "GST Value", value: 3390, type: "number" },
            { label: "TDS %", value: 2, type: "number" },
            { label: "TDS Value", value: 565, type: "number" },
            { label: "Total Payable", value: 31075, type: "number" },
          ],
        },
        {
          title: "Vendor Invoice",
          fields: [
            { label: "Invoice No. (Vendor)", value: "SAFEX/2026/00821" },
            { label: "Invoice Date", value: "2026-06-12T00:00", type: "date" },
            { label: "PO Number", value: "PO-LE-2026-0145" },
            { label: "Payment Status", value: "Pending", type: "select", options: ["Pending", "Approved", "Paid", "Hold"] },
            { label: "Vendor Code", value: "V10024" },
            { label: "Transporter", value: "SAFEXPRESS PRIVATE LTD", span: 2 },
          ],
        },
      ]}
    />
  );
}