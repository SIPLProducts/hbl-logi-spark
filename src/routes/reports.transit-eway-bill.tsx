import { createFileRoute } from "@tanstack/react-router";
import { Layers, FileSpreadsheet, Calendar, RotateCcw } from "lucide-react";

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

const FILTERS: { label: string; type?: "select" | "date"; options?: string[] }[] = [
  { label: "Inward/Outward", type: "select", options: ["Inward", "Outward"] },
  { label: "SAP/Non-SAP", type: "select", options: ["SAP", "Non-SAP"] },
  { label: "From Date", type: "date" },
  { label: "To Date", type: "date" },
  { label: "Transporter Group", type: "select" },
  { label: "Transporter", type: "select" },
  { label: "Plant", type: "select" },
  { label: "Product", type: "select" },
  { label: "Division", type: "select" },
  { label: "Customer Name", type: "select" },
  { label: "Branch", type: "select" },
  { label: "Branch Zone", type: "select" },
  { label: "Destination Location", type: "select" },
  { label: "Destination State", type: "select" },
  { label: "Destination Zone", type: "select" },
  { label: "Incoterms", type: "select" },
];

export const Route = createFileRoute("/reports/transit-eway-bill")({
  component: TransitEwayBillReport,
});

function TransitEwayBillReport() {
  const title = "Transit & E-way bill Report";
  const description = "Transit movements with linked E-way bill numbers and validity.";
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <Layers className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            {title}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3.5">
          {FILTERS.map((f) =>
            f.type === "date" ? (
              <DateField key={f.label} label={f.label} />
            ) : (
              <SelectField key={f.label} label={f.label} options={f.options} />
            ),
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button className="h-9 px-4 rounded-md border border-input bg-background text-foreground text-[12.5px] font-semibold hover:bg-muted inline-flex items-center justify-center gap-2">
            <RotateCcw className="size-3.5" />
            Reset
          </button>
          <button className="h-9 px-5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2">
            <FileSpreadsheet className="size-4" />
            Export XLS
          </button>
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-12 grid place-items-center text-center">
        <div className="size-14 rounded-full bg-muted grid place-items-center mb-4">
          <Layers className="size-7 text-muted-foreground" />
        </div>
        <h3 className="font-display text-[15px] font-semibold text-foreground">No data to display</h3>
        <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-md">
          Apply filters and click <span className="font-semibold text-foreground">Export XLS</span> to generate the
          report. Connect Lovable Cloud to wire live data.
        </p>
      </div>
    </div>
  );
}

function SelectField({ label, options }: { label: string; options?: string[] }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <select defaultValue="" className={INPUT}>
        <option value="" disabled>
          {label}
        </option>
        {options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function DateField({ label }: { label: string }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="relative">
        <input type="date" className={INPUT + " pr-9"} />
        <Calendar className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}