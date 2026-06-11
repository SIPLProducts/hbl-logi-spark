import { useState, type ReactNode } from "react";
import {
  Plus,
  Download,
  RefreshCw,
  Search,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Eye,
  Pencil,
} from "lucide-react";
import { sampleRows, counts, type WorklistRow } from "@/lib/le-mock-data";
import { LeFooter } from "./le-footer";

export type FieldDef = {
  label: string;
  value?: string | number;
  type?: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  span?: 1 | 2 | 3 | 4;
};

export type FieldGroup = {
  title: string;
  fields: FieldDef[];
};

export type WorklistColumn = {
  key: keyof WorklistRow | string;
  header: string;
  render?: (r: WorklistRow) => ReactNode;
  className?: string;
};

export type KpiTile = {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const DEFAULT_COLUMNS: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "reference", header: "Reference", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

export function LeScreenShell({
  title,
  description,
  kpis,
  columns = DEFAULT_COLUMNS,
  rows = sampleRows,
  groups,
  topFields,
  lineItems,
  extraTabs,
  children,
}: {
  title: string;
  description?: string;
  kpis?: KpiTile[];
  columns?: WorklistColumn[];
  rows?: WorklistRow[];
  groups?: FieldGroup[];
  topFields?: FieldDef[];
  lineItems?: { columns: string[]; rows: (string | number)[][] };
  extraTabs?: { label: string; active?: boolean }[];
  children?: ReactNode;
}) {
  const [mode, setMode] = useState<"with-sap" | "without-sap">("with-sap");
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id ?? "");
  const [activeTab, setActiveTab] = useState<string>(extraTabs?.[0]?.label ?? "");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="bg-surface border-b border-hairline px-6 py-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="mt-1 text-[12.5px] text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">
              Synced ·{" "}
              {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted">
              <RefreshCw className="size-3.5" /> Refresh
            </button>
            <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted">
              <Download className="size-3.5" /> Export
            </button>
            <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 shadow-sm">
              <Plus className="size-3.5" /> New
            </button>
          </div>
        </div>

        {kpis && kpis.length > 0 && (
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {kpis.map((k) => (
              <KpiCard key={k.label} {...k} />
            ))}
          </div>
        )}
      </div>

      <div className="p-6 space-y-5 flex-1">
        {/* Mode + chips */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex items-center p-0.5 rounded-md bg-muted border border-hairline text-[12px]">
            {(["with-sap", "without-sap"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={
                  "px-3 h-7 rounded-[5px] font-medium transition-colors " +
                  (mode === m
                    ? "bg-surface text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground")
                }
              >
                {m === "with-sap" ? "With SAP" : "Without SAP"}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center gap-1.5 flex-wrap">
            {(
              [
                {
                  key: "all",
                  label: "All",
                  count: counts.pending + counts.completed,
                  dot: "bg-muted-foreground",
                },
                { key: "pending", label: "Pending", count: counts.pending, dot: "bg-warning" },
                {
                  key: "completed",
                  label: "Completed",
                  count: counts.completed,
                  dot: "bg-success",
                },
              ] as const
            ).map((chip) => (
              <button
                key={chip.key}
                onClick={() => setStatusFilter(chip.key)}
                className={
                  "inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full border text-[11.5px] transition-colors " +
                  (statusFilter === chip.key
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-hairline bg-surface text-muted-foreground hover:text-foreground")
                }
              >
                <span className={"size-1.5 rounded-full " + chip.dot} />
                {chip.label}
                <span className="font-mono font-semibold ml-0.5">{chip.count}</span>
              </button>
            ))}
            <button className="ml-1 inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-hairline bg-surface text-[11.5px] text-muted-foreground hover:text-foreground">
              <SlidersHorizontal className="size-3" /> Filters
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        {extraTabs && (
          <div className="flex items-center gap-1 border-b border-hairline">
            {extraTabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={
                  "px-4 py-2 text-[12.5px] font-semibold border-b-2 -mb-px " +
                  (activeTab === t.label
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Worklist */}
        <div className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-muted/60 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
                  <th className="px-3 py-2.5 w-10 text-center">
                    <input type="checkbox" className="accent-accent" />
                  </th>
                  {columns.map((c) => (
                    <th
                      key={c.key as string}
                      className={"px-3 py-2.5 whitespace-nowrap " + (c.className ?? "")}
                    >
                      {c.header}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      "group cursor-pointer transition-colors " +
                      (selectedId === r.id ? "bg-accent/5" : "hover:bg-muted/50")
                    }
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="radio"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                        className="accent-accent"
                      />
                    </td>
                    {columns.map((c) => (
                      <td key={c.key as string} className="px-3 py-2.5 whitespace-nowrap">
                        {c.render
                          ? c.render(r)
                          : ((r as Record<string, unknown>)[c.key as string] as ReactNode)}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                          aria-label="View"
                        >
                          <Eye className="size-3.5" />
                        </button>
                        <button
                          className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-hairline bg-muted/40 px-4 py-3 flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Invoice Number
            </label>
            <select className="bg-surface border border-hairline rounded-md px-2 h-7 text-[12px] font-mono">
              <option>900215479</option>
              <option>900000088</option>
            </select>
            <button className="px-3 h-7 text-[11px] font-bold uppercase tracking-wider bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              GET
            </button>
            <div className="h-4 w-px bg-hairline mx-1" />
            <select className="bg-surface border border-hairline rounded-md px-2 h-7 text-[12px]">
              <option>Reference</option>
              <option>Invoice</option>
              <option>ODN</option>
              <option>SO Number</option>
            </select>
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <input
                placeholder="Enter Reference / Invoice / ODN / SO Number"
                className="w-full h-7 bg-surface border border-hairline rounded-md pl-8 pr-3 text-[12px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <button className="px-3 h-7 text-[11px] font-bold uppercase tracking-wider bg-accent text-accent-foreground rounded-md hover:bg-accent/90">
              Search
            </button>
          </div>
        </div>

        {topFields && topFields.length > 0 && (
          <div className="bg-surface border border-hairline rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-xs">
            {topFields.map((f) => (
              <FieldInput key={f.label} field={f} />
            ))}
          </div>
        )}

        {groups?.map((g) => (
          <div
            key={g.title}
            className="bg-surface border border-hairline rounded-lg shadow-xs"
          >
            <div className="px-4 py-2.5 border-b border-hairline bg-muted/50">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                {g.title}
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {g.fields.map((f) => (
                <div key={f.label} className={spanClass(f.span)}>
                  <FieldInput field={f} />
                </div>
              ))}
            </div>
          </div>
        ))}

        {lineItems && (
          <div className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 border-b border-hairline bg-muted/50 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                Line Items
              </h3>
              <button className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent/10 rounded-md">
                <Plus className="size-3" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
                    {lineItems.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left">
                        {c}
                      </th>
                    ))}
                    <th className="px-3 py-2 w-16 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/70">
                  {lineItems.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-muted/40">
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-2">
                          {typeof cell === "number" ? (
                            <span className="font-mono">{cell}</span>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                      <td className="px-3 py-2 text-right">
                        <button className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {children}
      </div>

      <div className="sticky bottom-0 bg-surface/95 backdrop-blur border-t border-hairline px-6 py-3 flex items-center justify-end gap-2 z-10">
        <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted">
          <ChevronLeft className="size-3.5" /> Save and Previous
        </button>
        <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-accent-foreground bg-accent rounded-md hover:bg-accent/90 shadow-sm">
          <Save className="size-3.5" /> Save
        </button>
        <button className="flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90">
          Save and Next <ChevronRight className="size-3.5" />
        </button>
      </div>

      <LeFooter />
    </div>
  );
}

function spanClass(span?: 1 | 2 | 3 | 4) {
  switch (span) {
    case 2:
      return "md:col-span-2";
    case 3:
      return "md:col-span-2 lg:col-span-3";
    case 4:
      return "md:col-span-2 lg:col-span-4";
    default:
      return "";
  }
}

function FieldInput({ field }: { field: FieldDef }) {
  const { label, value, type = "text", options } = field;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      {type === "select" ? (
        <select
          defaultValue={value as string}
          className="bg-surface border border-hairline rounded-md px-2 h-8 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          {(options ?? [String(value ?? "Select")]).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          defaultValue={value as string}
          rows={2}
          className="bg-surface border border-hairline rounded-md px-2 py-1.5 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      ) : (
        <input
          type={type === "date" ? "datetime-local" : type}
          defaultValue={value as string | number}
          className="bg-surface border border-hairline rounded-md px-2 h-8 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono"
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, delta, tone = "default" }: KpiTile) {
  const toneClasses: Record<NonNullable<KpiTile["tone"]>, string> = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
  };
  const dotClasses: Record<NonNullable<KpiTile["tone"]>, string> = {
    default: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
  };
  return (
    <div className="bg-surface border border-hairline rounded-lg p-3 hover:border-accent/40 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <span className={"size-1.5 rounded-full " + dotClasses[tone]} />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div className={"font-display text-2xl font-semibold tabular-nums " + toneClasses[tone]}>
          {value}
        </div>
        {delta && <div className="text-[11px] font-mono text-muted-foreground">{delta}</div>}
      </div>
    </div>
  );
}
