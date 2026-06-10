import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell, type WorklistColumn } from "@/components/le-screen-shell";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch · HBL LE" },
      { name: "description", content: "Execute and track HBL dispatch operations." },
    ],
  }),
  component: DispatchPage,
});

const columns: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "vehicleType", header: "Vehicle Type", render: (r) => r.vehicleType },
  { key: "workOrder", header: "Workorder", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "noOfTrucks", header: "Trucks", render: (r) => <span className="font-mono">{r.noOfTrucks}</span> },
  { key: "vendorCode", header: "Vendor Code", render: (r) => <span className="font-mono">{r.vendorCode}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "loadingPoints", header: "Loading", render: (r) => r.loadingPoints },
  { key: "unloadingPoints", header: "Unloading", render: (r) => r.unloadingPoints },
  {
    key: "status",
    header: "Dispatch Status",
    render: (r) => {
      const tone =
        r.status === "Completed"
          ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
          : r.status === "In Progress"
          ? "bg-blue-50 text-blue-700 ring-blue-200"
          : "bg-amber-50 text-amber-700 ring-amber-200";
      return (
        <span className={"px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ring-1 rounded-sm " + tone}>
          {r.status ?? "Pending"}
        </span>
      );
    },
  },
];

function DispatchPage() {
  return (
    <LeScreenShell
      screenNo={2}
      title="Dispatch"
      columns={columns}
      groups={[
        {
          title: "Dispatch Details",
          fields: [
            { label: "Dispatch Date & Time", value: "2026-06-10T07:30", type: "date" },
            { label: "Gate-Out Time", value: "2026-06-10T08:15", type: "date" },
            { label: "Vehicle Reg. No.", value: "TS 09 EE 4521" },
            { label: "Driver Name", value: "Ramesh Kumar" },
            { label: "Driver Mobile", value: "+91 98480 12345" },
            { label: "Seal Number", value: "SL-789214" },
            { label: "Odometer (Start)", value: 124567, type: "number" },
            { label: "Fuel Filled (L)", value: 180, type: "number" },
            { label: "Dispatch Status", value: "In Progress", type: "select", options: ["Planned", "Dispatched", "In Transit", "Delivered"] },
            { label: "Remarks", value: "Convoy of 2 trucks", span: 3, type: "textarea" },
          ],
        },
      ]}
    />
  );
}