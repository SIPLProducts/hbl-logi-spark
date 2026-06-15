import { createFileRoute } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { LeScreenShell } from "@/components/le-screen-shell";
import { InsuranceClaimTrackingSapCreate } from "@/components/insurance-claim-tracking-sap-create";

export const Route = createFileRoute("/insurance-claim-tracking")({
  component: InsuranceClaimTrackingPage,
});

function InsuranceClaimTrackingPage() {
  return (
    <LeScreenShell
      title="Insurance Claim Tracking"
      renderDirectionExtras={() => (
        <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-indigo-300/60 bg-indigo-100 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
          <ClipboardList className="size-3" />
          No. of Cases Reported
          <span className="font-mono">0</span>
        </span>
      )}
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <InsuranceClaimTrackingSapCreate mode={sap === "with" ? "with" : "without"} />
        ) : null
      }
      groups={[
        {
          title: "Claim",
          fields: [
            { label: "Claim No.", value: "CLM-2026-00118" },
            { label: "Policy No.", value: "POL-OP-2025-04421" },
            { label: "Insurer", value: "ICICI Lombard", type: "select", options: ["ICICI Lombard", "Bajaj Allianz", "Tata AIG", "New India Assurance"] },
            { label: "Shipment No.", value: "SHP-2026-0042" },
            { label: "LR No.", value: "6756557" },
          ],
        },
        {
          title: "Dates",
          fields: [
            { label: "Date of Loss", value: "2026-06-13T06:30", type: "date" },
            { label: "Date of Intimation", value: "2026-06-13T10:00", type: "date" },
            { label: "Survey Date", value: "2026-06-15T11:00", type: "date" },
            { label: "Settlement Date", value: "", type: "date" },
            { label: "Surveyor", value: "M/s Crawford & Co." },
          ],
        },
        {
          title: "Amounts & Status",
          fields: [
            { label: "Claim Amount", value: 28500, type: "number" },
            { label: "Approved Amount", value: 0, type: "number" },
            { label: "Status", value: "Surveyed", type: "select", options: ["Intimated", "Surveyed", "Approved", "Settled", "Rejected"] },
            { label: "Remarks", value: "Awaiting surveyor's final report.", span: 4, type: "textarea" },
          ],
        },
      ]}
    />
  );
}