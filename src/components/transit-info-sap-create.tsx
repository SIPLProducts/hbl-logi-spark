import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight } from "lucide-react";

const GREEN_INPUT =
  "h-9 w-full rounded-md bg-white dark:bg-surface border border-emerald-400/70 px-2.5 text-[12.5px] text-emerald-700 dark:text-emerald-300 font-medium outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/30";
const LABEL =
  "block text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1";

const SEARCH_OPTIONS = [
  "Reference",
  "Invoice",
  "ODN",
  "SO Number",
  "Work Order",
  "LR Number",
];

type FieldSpec = {
  label: string;
  value?: string;
  type?: "text" | "select" | "date" | "datetime" | "file";
  options?: string[];
  placeholder?: string;
};

const FIELDS: FieldSpec[] = [
  { label: "Invoice Number" },
  { label: "Physical arrived at destination date", type: "datetime" },
  { label: "Unloading date and time", type: "datetime" },
  { label: "POD scan received date", type: "date" },
  { label: "SIT/SALE", placeholder: "SIT/SALE" },
  { label: "POD Scan", type: "file" },
];

export function TransitInfoSapCreate(_: { mode?: "with" | "without" } = {}) {
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  return (
    <div className="space-y-4">

      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-1.5 text-center w-16">Select</th>
              <th className="px-3 py-1.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-1.5 text-center">Reference Number</th>
              <th className="px-3 py-1.5 text-center">Work Order Number</th>
              <th className="px-3 py-1.5 text-center">LR Number</th>
              <th className="px-3 py-1.5 text-center">Transporter</th>
              <th className="px-3 py-1.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-1 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-1 text-center">1</td>
              <td className="px-3 py-1">
                <input placeholder="Enter Ref. No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-1">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-1">
                <input placeholder="Enter LR No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-1">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-1 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-9 w-full rounded-md border border-hairline bg-surface px-2 text-[12.5px] outline-none focus:border-accent"
            >
              <option value="">Select</option>
              {SEARCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-9 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12.5px] outline-none focus:border-accent"
            />
            <button className="h-9 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Field grid */}
      <div className="bg-surface border border-hairline rounded-xl p-5 shadow-elegant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
          {FIELDS.map((f) => (
            <SapField key={f.label} field={f} />
          ))}
        </div>
      </div>

      {/* Footer action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
          <Save className="size-3.5" /> Save
        </button>
        <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm">
          Save and Next <ChevronRight className="size-3.5" />
        </button>
        <button className="inline-flex items-center gap-1.5 px-4 h-9 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm">
          <ChevronLeft className="size-3.5" /> Save and Previous
        </button>
      </div>
    </div>
  );
}

function SapField({ field }: { field: FieldSpec }) {
  const { label, value = "", type = "text", options, placeholder } = field;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {type === "select" ? (
        <select defaultValue={value} className={GREEN_INPUT}>
          <option value="" disabled>
            Select
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "datetime" ? (
        <input type="datetime-local" defaultValue={value} className={GREEN_INPUT} />
      ) : type === "date" ? (
        <input type="date" defaultValue={value} className={GREEN_INPUT} />
      ) : type === "file" ? (
        <input type="file" className={GREEN_INPUT + " py-1.5"} />
      ) : (
        <input defaultValue={value} placeholder={placeholder ?? `Enter ${label}`} className={GREEN_INPUT} />
      )}
    </div>
  );
}