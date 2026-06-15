import type { LucideIcon } from "lucide-react";
import { FileSpreadsheet, Calendar, RotateCcw } from "lucide-react";

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

const SELECTS: { label: string }[] = [
  { label: "Inward/Outward" },
  { label: "Sap/Nonsap" },
];
const SELECTS_ROW2: { label: string }[] = [
  { label: "Transporter Group" },
  { label: "Transporter" },
  { label: "Plant" },
  { label: "Product" },
];
const SELECTS_ROW3: { label: string }[] = [
  { label: "Division" },
  { label: "Customer Name" },
  { label: "Branch" },
  { label: "Branch Zone" },
];
const SELECTS_ROW4: { label: string }[] = [
  { label: "Destination Location" },
  { label: "Destination State" },
  { label: "Destination Zone" },
  { label: "Incoterms" },
];

export function ReportPlaceholder({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Page header */}
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <Icon className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            {title}
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">{description}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3.5">
          {SELECTS.map((f) => (
            <SelectField key={f.label} label={f.label} />
          ))}
          <DateField label="From Date" />
          <DateField label="To Date" />
          {SELECTS_ROW2.map((f) => (
            <SelectField key={f.label} label={f.label} />
          ))}
          {SELECTS_ROW3.map((f) => (
            <SelectField key={f.label} label={f.label} />
          ))}
          {SELECTS_ROW4.map((f) => (
            <SelectField key={f.label} label={f.label} />
          ))}
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

      {/* Empty state */}
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-12 grid place-items-center text-center">
        <div className="size-14 rounded-full bg-muted grid place-items-center mb-4">
          <Icon className="size-7 text-muted-foreground" />
        </div>
        <h3 className="font-display text-[15px] font-semibold text-foreground">No data to display</h3>
        <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-md">
          Apply filters and click <span className="font-semibold text-foreground">Export XLS</span> to generate the report.
          Connect Lovable Cloud to wire live data.
        </p>
      </div>
    </div>
  );
}

function SelectField({ label }: { label: string }) {
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <select defaultValue="" className={INPUT}>
        <option value="" disabled>{label}</option>
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