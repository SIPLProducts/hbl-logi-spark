import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";

export const Route = createFileRoute("/vehicle-info")({
  head: () => ({
    meta: [
      { title: "Vehicle Info · HBL LE" },
      { name: "description", content: "Vehicle, driver, and document validity master for HBL LE." },
    ],
  }),
  component: VehicleInfoPage,
});

function VehicleInfoPage() {
  return (
    <LeScreenShell
      screenNo={7}
      title="Vehicle Info"
      groups={[
        {
          title: "Vehicle",
          fields: [
            { label: "Vehicle Type", value: "32 FT MXL", type: "select", options: ["32 FT MXL", "20 FT Container", "14 FT LCV"] },
            { label: "Vehicle Reg. No.", value: "TS 09 EE 4521" },
            { label: "Make / Model", value: "TATA Prima 4928" },
            { label: "Capacity (T)", value: 25, type: "number" },
            { label: "Owner Type", value: "Hired", type: "select", options: ["Own", "Hired"] },
            { label: "Vendor Code", value: "V10024" },
            { label: "Transporter", value: "SAFEXPRESS PRIVATE LTD", span: 2 },
          ],
        },
        {
          title: "Driver",
          fields: [
            { label: "Driver Name", value: "Ramesh Kumar" },
            { label: "Driver Mobile", value: "+91 98480 12345" },
            { label: "Driver Licence No.", value: "TS09 2018 0098765" },
            { label: "Licence Expiry", value: "2028-03-31T00:00", type: "date" },
          ],
        },
        {
          title: "Document Validity",
          fields: [
            { label: "RC No.", value: "RC-TS-89421" },
            { label: "Fitness Validity", value: "2027-04-15T00:00", type: "date" },
            { label: "Insurance No.", value: "INS-V-998211" },
            { label: "Insurance Validity", value: "2026-12-20T00:00", type: "date" },
            { label: "PUC Validity", value: "2026-09-10T00:00", type: "date" },
            { label: "GPS Device ID", value: "GPS-998-X12" },
          ],
        },
      ]}
    />
  );
}