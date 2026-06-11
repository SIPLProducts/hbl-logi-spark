import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";

export const Route = createFileRoute("/order-info")({
  head: () => ({
    meta: [
      { title: "Order Info · HBL LE" },
      { name: "description", content: "Order information and invoice header details for HBL LE." },
    ],
  }),
  component: OrderInfoPage,
});

function OrderInfoPage() {
  return (
    <LeScreenShell
      title="Order Info"
      groups={[
        {
          title: "Invoice Header",
          fields: [
            { label: "Tax Invoice", value: "900000088" },
            { label: "ODN Number", value: "900000088" },
            { label: "Invoice Date", value: "2014-10-15T00:00", type: "date" },
            { label: "Basic Shipment Value", value: 146037.2, type: "number" },
            { label: "Invoice Value With GST", value: 148957.95, type: "number" },
            { label: "SO / Ref. Number", value: "1000400" },
          ],
        },
        {
          title: "Schedule",
          fields: [
            { label: "Required Date & Time", value: "", type: "date" },
            { label: "Reported Date & Time", value: "", type: "date" },
            { label: "Physical Dispatch Date & Time", value: "", type: "date" },
          ],
        },
        {
          title: "Plant & Transaction",
          fields: [
            { label: "Plant", value: "HBL NCPP-SHPT", type: "select", options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"] },
            { label: "Transaction Type", value: "Road", type: "select", options: ["Road", "Rail", "Air", "Sea"] },
            { label: "Billing Transaction Type", value: "Domestic Invoice", type: "select", options: ["Domestic Invoice", "Export Invoice", "Stock Transfer"] },
            { label: "Division", value: "NCPP", type: "select", options: ["NCPP", "VSP", "Industrial"] },
            { label: "Sub Division", value: "Select Sub Division", type: "select", options: ["Sub Div 1", "Sub Div 2"] },
            { label: "Customer Name", value: "RELIANCE INDUSTRIES LIMITED", span: 2 },
          ],
        },
      ]}
    />
  );
}