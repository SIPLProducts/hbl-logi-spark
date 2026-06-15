import { useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

type FieldSpec = {
  label: string;
  value?: string;
  type?: "text" | "select" | "date" | "file";
  options?: string[];
  placeholder?: string;
};

const BASE_FIELDS: FieldSpec[] = [
  { label: "Fiscal Year" },
  { label: "Reported Date", type: "date" },
  { label: "Claim Reference" },
  { label: "Invoice Date", type: "date" },
  { label: "Invoice Basic Value" },
  { label: "Loss Declared" },
  { label: "Claim Received", type: "date" },
  { label: "Salvage Value" },
  { label: "Customer" },
  { label: "SO Number" },
  { label: "Location" },
  {
    label: "Damage Remarks",
    type: "select",
    options: ["Wet", "Crushed", "Broken", "Leak"],
    placeholder: "Select Damage Remarks",
  },
  { label: "Claim Info Sent" },
  {
    label: "Claim Status",
    type: "select",
    options: ["Open", "In Review", "Approved", "Rejected", "Settled"],
    placeholder: "Select Claim Status",
  },
  {
    label: "Claim Document Status",
    type: "select",
    options: ["Pending", "Submitted", "Verified"],
    placeholder: "Select Claim Document Status",
  },
  { label: "Courier Details" },
  {
    label: "Payment Status",
    type: "select",
    options: ["Pending", "Partial", "Paid"],
    placeholder: "Select Payment Status",
  },
  { label: "Payment Info" },
  { label: "UTR" },
  { label: "Claim Settlement Date", type: "date" },
  { label: "Supporting Document", type: "file" },
  { label: "Approve Document", type: "file" },
];

export function InsuranceClaimTrackingSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(!isWithout);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showFields = isWithout || revealed;
  const fields: FieldSpec[] = isWithout ? [{ label: "DC Reference Number" }, ...BASE_FIELDS] : BASE_FIELDS;

  return (
    <div className="space-y-2">
      {/* Reference table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-0.5 text-center">Map ID</th>
              <th className="px-3 py-0.5 text-center">Reference Number</th>
              <th className="px-3 py-0.5 text-center">Work Order Number</th>
              <th className="px-3 py-0.5 text-center">LR Number</th>
              <th className="px-3 py-0.5 text-center">Transporter</th>
              <th className="px-3 py-0.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-0.5 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-0.5 text-center">1</td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Map ID"
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter Ref. No."
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input
                  defaultValue={isWithout ? "" : ""}
                  placeholder="Enter LR No."
                  className={GREEN_INPUT + " text-center"}
                />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && (
            <div className="flex items-end gap-2 max-w-md">
              <div className="w-full max-w-xs">
                <label className={LABEL}>Invoice Number</label>
                <input value={lookupValue} onChange={(e) => setLookupValue(e.target.value)} className={GREEN_INPUT} />
              </div>
              <button
                onClick={() => {
                  if (lookupValue.trim()) setRevealed(true);
                }}
                disabled={!lookupValue.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </div>
          )}
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
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
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
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
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              {fields.map((f) => (
                <SapField key={f.label} field={f} />
              ))}
            </div>
          </div>

          {/* Secondary table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                  <th className="px-3 py-0.5 text-center w-12">
                    <input type="checkbox" className="size-4 accent-white" />
                  </th>
                  <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
                  <th className="px-3 py-0.5 text-center">Map ID</th>
                  <th className="px-3 py-0.5 text-center">Vehicle Line</th>
                  <th className="px-3 py-0.5 text-center">Vehicle Type</th>
                  <th className="px-3 py-0.5 text-center">Truck Number</th>
                  <th className="px-3 py-0.5 text-center">LR Number</th>
                  <th className="px-3 py-0.5 text-center">AH</th>
                  <th className="px-3 py-0.5 text-center">No. of Sets</th>
                  <th className="px-3 py-0.5 text-center">Transporter</th>
                  <th className="px-3 py-0.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-0.5 text-center">
                    <input type="checkbox" className="size-4 accent-sky-600" />
                  </td>
                  <td className="px-3 py-0.5 text-center">1</td>
                  <td className="px-3 py-0.5">
                    <select defaultValue={isWithout ? "" : "101"} className={GREEN_INPUT}>
                      <option value="" disabled>
                        Select
                      </option>
                      <option value="101">101</option>
                      <option value="102">102</option>
                    </select>
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      defaultValue={isWithout ? "" : "0"}
                      placeholder=""
                      className={GREEN_INPUT + " text-center"}
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input placeholder="" className={GREEN_INPUT + " text-center"} />
                  </td>
                  <td className="px-3 py-0.5 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <button className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
                        <Plus className="size-3.5" />
                      </button>
                      <button className="inline-grid place-items-center size-7 rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow-sm">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
              <Save className="size-3.5" /> Save
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm">
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm">
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SapField({ field }: { field: FieldSpec }) {
  const { label, value = "", type = "text", options, placeholder } = field;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {type === "select" ? (
        <select defaultValue="" className={GREEN_INPUT}>
          <option value="" disabled>
            {placeholder ?? "Select"}
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
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
