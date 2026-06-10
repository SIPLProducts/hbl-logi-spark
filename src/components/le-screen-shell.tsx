import { useState, type ReactNode } from "react";
import { Plus, Download, RefreshCw, Search, Trash2, Save, ChevronLeft, ChevronRight } from "lucide-react";
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

const DEFAULT_COLUMNS: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "reference", header: "Reference Number", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order Number", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

export function LeScreenShell({
  screenNo,
  title,
  columns = DEFAULT_COLUMNS,
  rows = sampleRows,
  groups,
  topFields,
  lineItems,
  extraTabs,
  children,
}: {
  screenNo: number;
  title: string;
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

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            LE Module · Screen {screenNo}
          </div>
          <h1 className="text-lg font-bold text-zinc-900 mt-0.5">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">
            <Plus className="size-3.5" /> New
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
            <Download className="size-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
            <RefreshCw className="size-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="p-6 space-y-5 flex-1">
        {/* Mode tabs + counts */}
        <div className="flex items-center justify-between bg-white ring-1 ring-zinc-200 rounded-sm px-4 py-2.5">
          <div className="flex items-center gap-5 text-[12.5px]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" defaultChecked className="accent-blue-600" />
              <span className="font-semibold">Outward</span>
            </label>
            <div className="h-4 w-px bg-zinc-200" />
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "with-sap"}
                onChange={() => setMode("with-sap")}
                className="accent-blue-600"
              />
              <span>With SAP</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="mode"
                checked={mode === "without-sap"}
                onChange={() => setMode("without-sap")}
                className="accent-blue-600"
              />
              <span>Without SAP</span>
            </label>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-mono">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-amber-500" />
              Pending: <strong>{counts.pending}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-emerald-500" />
              Completed: <strong>{counts.completed}</strong>
            </span>
          </div>
        </div>

        {/* Optional sub-tabs */}
        {extraTabs && (
          <div className="flex items-center gap-1 border-b border-zinc-200">
            {extraTabs.map((t) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(t.label)}
                className={
                  "px-4 py-2 text-[12.5px] font-semibold border-b-2 -mb-px " +
                  (activeTab === t.label
                    ? "border-blue-600 text-blue-700"
                    : "border-transparent text-zinc-500 hover:text-zinc-900")
                }
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Worklist table */}
        <div className="bg-white ring-1 ring-zinc-200 rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead>
                <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
                  <th className="px-3 py-2.5 w-10 text-center">Select</th>
                  {columns.map((c) => (
                    <th key={c.key as string} className={"px-3 py-2.5 " + (c.className ?? "")}>
                      {c.header}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 w-16 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className={
                      "hover:bg-blue-50/40 cursor-pointer " +
                      (selectedId === r.id ? "bg-blue-50/60" : "")
                    }
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td className="px-3 py-2.5 text-center">
                      <input
                        type="radio"
                        checked={selectedId === r.id}
                        onChange={() => setSelectedId(r.id)}
                        className="accent-blue-600"
                      />
                    </td>
                    {columns.map((c) => (
                      <td key={c.key as string} className="px-3 py-2.5">
                        {c.render ? c.render(r) : (r as Record<string, unknown>)[c.key as string] as ReactNode}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right">
                      <button className="text-zinc-400 hover:text-red-600">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Lookup bar */}
          <div className="border-t border-zinc-200 bg-zinc-50/50 px-4 py-3 flex flex-wrap items-center gap-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Invoice Number
            </label>
            <select className="bg-white ring-1 ring-zinc-200 rounded-sm px-2 py-1 text-[12px] font-mono">
              <option>900215479</option>
              <option>900000088</option>
            </select>
            <button className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-zinc-900 text-white rounded-sm hover:bg-zinc-800">
              GET
            </button>
            <div className="h-4 w-px bg-zinc-200 mx-1" />
            <select className="bg-white ring-1 ring-zinc-200 rounded-sm px-2 py-1 text-[12px]">
              <option>Reference</option>
              <option>Invoice</option>
              <option>ODN</option>
              <option>SO Number</option>
            </select>
            <div className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-400" />
              <input
                placeholder="Enter Reference / Invoice / ODN / SO Number"
                className="w-full bg-white ring-1 ring-zinc-200 rounded-sm pl-8 pr-3 py-1 text-[12px] outline-none focus:ring-blue-500"
              />
            </div>
            <button className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider bg-blue-600 text-white rounded-sm hover:bg-blue-700">
              Search
            </button>
          </div>
        </div>

        {/* Top fields row */}
        {topFields && topFields.length > 0 && (
          <div className="bg-white ring-1 ring-zinc-200 rounded-sm p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {topFields.map((f) => (
              <FieldInput key={f.label} field={f} />
            ))}
          </div>
        )}

        {/* Detail field groups */}
        {groups?.map((g) => (
          <div key={g.title} className="bg-white ring-1 ring-zinc-200 rounded-sm">
            <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/60">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-700">
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

        {/* Line items */}
        {lineItems && (
          <div className="bg-white ring-1 ring-zinc-200 rounded-sm overflow-hidden">
            <div className="px-4 py-2.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-700">
                Line Items
              </h3>
              <button className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50 rounded-sm">
                <Plus className="size-3" /> Add Row
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[12.5px]">
                <thead>
                  <tr className="bg-zinc-50 text-[10px] font-bold uppercase tracking-widest text-zinc-500 border-b border-zinc-200">
                    {lineItems.columns.map((c) => (
                      <th key={c} className="px-3 py-2 text-left">{c}</th>
                    ))}
                    <th className="px-3 py-2 w-16 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {lineItems.rows.map((row, i) => (
                    <tr key={i} className="hover:bg-zinc-50/60">
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
                        <button className="text-zinc-400 hover:text-red-600">
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

      {/* Sticky action bar */}
      <div className="sticky bottom-0 bg-white border-t border-zinc-200 px-6 py-3 flex items-center justify-end gap-2">
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-zinc-700 ring-1 ring-zinc-200 rounded-sm bg-white hover:bg-zinc-50">
          <ChevronLeft className="size-3.5" /> Save and Previous
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-blue-600 rounded-sm hover:bg-blue-700">
          <Save className="size-3.5" /> Save
        </button>
        <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-white bg-zinc-900 rounded-sm hover:bg-zinc-800">
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
      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
        {label}
      </label>
      {type === "select" ? (
        <select
          defaultValue={value as string}
          className="bg-white ring-1 ring-zinc-200 rounded-sm px-2 py-1.5 text-[12.5px] outline-none focus:ring-blue-500"
        >
          {(options ?? [String(value ?? "Select")]).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          defaultValue={value as string}
          rows={2}
          className="bg-white ring-1 ring-zinc-200 rounded-sm px-2 py-1.5 text-[12.5px] outline-none focus:ring-blue-500"
        />
      ) : (
        <input
          type={type === "date" ? "datetime-local" : type}
          defaultValue={value as string | number}
          className="bg-white ring-1 ring-zinc-200 rounded-sm px-2 py-1.5 text-[12.5px] outline-none focus:ring-blue-500 font-mono"
        />
      )}
    </div>
  );
}