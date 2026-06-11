import type { LucideIcon } from "lucide-react";
import { FileSpreadsheet, Calendar, Factory, Layers } from "lucide-react";

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Filter label="Date Range" icon={Calendar} placeholder="DD-MM-YYYY → DD-MM-YYYY" />
          <Filter label="Plant" icon={Factory} placeholder="All Plants" />
          <Filter label="Division" icon={Layers} placeholder="All Divisions" />
          <div className="flex items-end">
            <button className="h-9 w-full px-4 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2">
              <FileSpreadsheet className="size-4" />
              Export XLS
            </button>
          </div>
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

function Filter({
  label,
  icon: Icon,
  placeholder,
}: {
  label: string;
  icon: LucideIcon;
  placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="size-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder={placeholder}
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </div>
    </div>
  );
}