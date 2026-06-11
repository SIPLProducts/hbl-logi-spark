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
  value: string;
  type?: "text" | "select" | "date";
  options?: string[];
};

const FIELDS: FieldSpec[] = [
  { label: "Tax Invoice", value: "" },
  { label: "ODN Number", value: "" },
  { label: "Invoice Date", value: "", type: "date" },

  { label: "Basic Shipment Value", value: "" },
  { label: "Invoice Value With GST", value: "" },
  { label: "Fiscal Year", value: "" },

  { label: "Fiscal Quarter", value: "" },
  { label: "Month", value: "" },
  { label: "Required Date & Time", value: "", type: "date" },

  { label: "Reported Date & Time", value: "", type: "date" },
  { label: "Physical Dispatch Date & Time", value: "", type: "date" },
  {
    label: "Plant",
    value: "",
    type: "select",
    options: ["HBL NCPP-SHPT", "HBL VSP-SHPT", "HBL HYD-PLANT-04"],
  },

  {
    label: "Transaction Type",
    value: "",
    type: "select",
    options: ["FULL TRUCK LOAD", "PART LOAD", "COURIER"],
  },
  {
    label: "Billing Transaction Type",
    value: "",
    type: "select",
    options: ["Domestic Invoice", "Export Invoice", "Stock Transfer"],
  },
  {
    label: "Division",
    value: "",
    type: "select",
    options: ["NCPP", "VSP", "Industrial"],
  },

  {
    label: "Sub Division",
    value: "",
    type: "select",
    options: ["FUZE", "BATTERY", "POWER"],
  },
  { label: "SO / Ref. Number", value: "" },
  { label: "Customer Name", value: "" },

  { label: "Customer Group", value: "" },
  { label: "Consignee Name", value: "" },
  { label: "Destination Location", value: "" },

  { label: "Destination State", value: "" },
  { label: "Destination Zone", value: "" },
];

export function OrderInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showFields = isWithout || revealed;
  const fields = isWithout
    ? FIELDS.map((f, i) => (i === 0 ? { ...f, label: "DC Reference Number" } : f))
    : FIELDS;

  return (
    <div className="space-y-4">
      {/* Status chips */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[12px] font-semibold border border-amber-200">
          <span className="size-1.5 rounded-full bg-amber-500" /> Pending: 0
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[12px] font-semibold border border-emerald-200">
          <span className="size-1.5 rounded-full bg-emerald-500" /> Completed: 1
        </span>
      </div>

      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-gradient-to-r from-sky-500 to-teal-500 text-white text-[11px] font-semibold">
              <th className="px-3 py-2.5 text-center w-16">Select</th>
              <th className="px-3 py-2.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-2.5 text-center">Reference Number</th>
              <th className="px-3 py-2.5 text-center">Work Order Number</th>
              <th className="px-3 py-2.5 text-center">LR Number</th>
              <th className="px-3 py-2.5 text-center">Transporter</th>
              <th className="px-3 py-2.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-2 text-center">1</td>
              <td className="px-3 py-2">
                <input defaultValue="1000000001" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input defaultValue="1234" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-2 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Invoice lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && (
          <>
          <div className="flex-1 min-w-[220px]">
            <label className={LABEL}>Invoice Number</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={GREEN_INPUT}
            />
          </div>
          <button
            onClick={() => {
              if (invoiceNumber.trim()) setRevealed(true);
            }}
            disabled={!invoiceNumber.trim()}
            className="h-9 px-4 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
          >
            GET
          </button>
          </>
          )}
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

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && (
        <>
      {/* Field grid */}
      <div className="bg-surface border border-hairline rounded-xl p-5 shadow-elegant">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">
          {fields.map((f) => (
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
        </>
      )}
    </div>
  );
}

function SapField({ field }: { field: FieldSpec }) {
  const { label, value, type = "text", options } = field;
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
      ) : type === "date" ? (
        <input type="datetime-local" defaultValue={value} className={GREEN_INPUT} />
      ) : (
        <input defaultValue={value} placeholder={`Enter ${label}`} className={GREEN_INPUT} />
      )}
    </div>
  );
}