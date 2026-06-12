import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { LeScreenShell } from "@/components/le-screen-shell";
import { ServiceLevelSapCreate } from "@/components/service-level-sap-create";

export const Route = createFileRoute("/service-level")({
  component: ServiceLevelPage,
});

function ServiceLevelPage() {
  const [loadType, setLoadType] = useState<"ftl" | "cargo" | null>(null);
  return (
    <LeScreenShell
      title="Service Level (Shipment Feedback)"
      renderDirectionExtras={({ direction }) =>
        direction === "outward" ? (
          <>
            <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Load Type
            </span>
            {([
              { id: "ftl", label: "Full Truck Load" },
              { id: "cargo", label: "Cargo" },
            ] as const).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setLoadType((cur) => (cur === o.id ? null : o.id))}
                className={
                  "px-4 h-8 rounded-full text-[12px] font-semibold border transition-colors " +
                  (loadType === o.id
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10")
                }
              >
                {o.label}
              </button>
            ))}
          </>
        ) : null
      }
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <ServiceLevelSapCreate mode={sap === "with" ? "with" : "without"} loadType={loadType} />
        ) : null
      }
    />
  );
}