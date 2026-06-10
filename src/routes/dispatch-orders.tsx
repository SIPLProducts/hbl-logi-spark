import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell, type WorklistColumn } from "@/components/le-screen-shell";

export const Route = createFileRoute("/dispatch-orders")({
  head: () => ({
    meta: [
      { title: "Dispatch Orders · HBL LE" },
      { name: "description", content: "Create and manage HBL Logistics Execution dispatch orders." },
    ],
  }),
  component: DispatchOrdersPage,
});

const columns: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "vehicleType", header: "Vehicle Type", render: (r) => r.vehicleType },
  { key: "workOrder", header: "Workorder", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "noOfTrucks", header: "No Of Trucks", render: (r) => <span className="font-mono">{r.noOfTrucks}</span> },
  { key: "noOfInvoices", header: "No Of Invoices", render: (r) => <span className="font-mono">{r.noOfInvoices}</span> },
  { key: "vendorCode", header: "Vendor Code", render: (r) => <span className="font-mono">{r.vendorCode}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
  { key: "plant", header: "Plant", render: (r) => r.plant },
  { key: "division", header: "Division", render: (r) => r.division },
  { key: "noOfLRs", header: "No. of LRs", render: (r) => <span className="font-mono">{r.noOfLRs}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "loadingPoints", header: "Loading Points", render: (r) => r.loadingPoints },
  { key: "unloadingPoints", header: "Unloading Points", render: (r) => r.unloadingPoints },
  { key: "remarks", header: "Remarks", render: (r) => <span className="text-zinc-500">{r.remarks}</span> },
];

function DispatchOrdersPage() {
  return (
    <LeScreenShell
      screenNo={1}
      title="Dispatch Orders"
      columns={columns}
      topFields={[
        { label: "Vehicle Type", value: "32 FT MXL", type: "select", options: ["32 FT MXL", "20 FT Container", "14 FT LCV"] },
        { label: "Workorder", value: "2346789" },
        { label: "No of Trucks", value: 2, type: "number" },
        { label: "No of Invoices", value: 4, type: "number" },
        { label: "Vendor Code", value: "V10024" },
        { label: "Transporter", value: "SAFEXPRESS PRIVATE LTD" },
        { label: "Plant", value: "HBL NCPP-SHPT", type: "select", options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"] },
        { label: "Division", value: "NCPP", type: "select", options: ["NCPP", "VSP", "Industrial"] },
        { label: "No. of LRs", value: 2, type: "number" },
        { label: "LR Number", value: "6756557" },
        { label: "Loading Points", value: "Shameerpet WH" },
        { label: "Unloading Points", value: "Jamnagar Refinery" },
        { label: "Remarks", value: "Priority dispatch", span: 4, type: "textarea" },
      ]}
    />
  );
}