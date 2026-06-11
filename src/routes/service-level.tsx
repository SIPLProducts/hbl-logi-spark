import { createFileRoute } from "@tanstack/react-router";
import { LeScreenShell } from "@/components/le-screen-shell";
import { ServiceLevelSapCreate } from "@/components/service-level-sap-create";

export const Route = createFileRoute("/service-level")({
  head: () => ({
    meta: [
      { title: "Service Level · HBL LE" },
      { name: "description", content: "Customer-facing shipment feedback and OTIF rating." },
    ],
  }),
  component: ServiceLevelPage,
});

function ServiceLevelPage() {
  return (
    <LeScreenShell
      title="Service Level (Shipment Feedback)"
      extraTabs={[
        { label: "Full Truck Load", active: true },
        { label: "Cargo" },
      ]}
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <ServiceLevelSapCreate mode={sap === "with" ? "with" : "without"} />
        ) : null
      }
    />
  );
}