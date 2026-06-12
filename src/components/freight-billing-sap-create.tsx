import { useMemo, useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, X } from "lucide-react";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL =
  "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = [
  "Reference",
  "Invoice",
  "ODN",
  "SO Number",
  "Work Order",
  "LR Number",
];

const BREAKDOWN_FIELDS = [
  "Basic Freight",
  "Detention Loading",
  "Detention Unloading",
  "Loading Charges",
  "Unloading Charges",
  "Route Change",
  "Transhipment Charges",
  "Other Charges",
  "Deduction",
] as const;
type BreakdownKey = (typeof BREAKDOWN_FIELDS)[number];
type Breakdown = Record<BreakdownKey, number>;
const EMPTY_BREAKDOWN: Breakdown = BREAKDOWN_FIELDS.reduce((acc, k) => {
  acc[k] = 0;
  return acc;
}, {} as Breakdown);

function computeTotal(b: Breakdown) {
  const sum = BREAKDOWN_FIELDS.filter((k) => k !== "Deduction").reduce(
    (s, k) => s + (Number(b[k]) || 0),
    0,
  );
  return sum - (Number(b.Deduction) || 0);
}

function ChargesBreakdownDialog({
  open,
  onOpenChange,
  title,
  totalLabel,
  value,
  onSave,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  totalLabel: string;
  value: Breakdown;
  onSave: (b: Breakdown, total: number) => void;
}) {
  const [draft, setDraft] = useState<Breakdown>(value);
  // Sync when reopened
  const total = useMemo(() => computeTotal(draft), [draft]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in">
      <div className="w-full max-w-3xl rounded-xl overflow-hidden bg-surface border border-hairline shadow-elegant animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center justify-between">
          <h3 className="text-white text-[14px] font-semibold tracking-wide">{title}</h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
            {BREAKDOWN_FIELDS.map((k) => (
              <div key={k}>
                <label className={LABEL}>{k}</label>
                <input
                  type="number"
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [k]: Number(e.target.value) || 0 }))
                  }
                  className={GREEN_INPUT}
                />
              </div>
            ))}
          </div>
          <div className="mt-4 text-[13px] font-semibold text-foreground">
            {totalLabel}: {total}
          </div>
        </div>
        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center px-5 h-9 rounded-md bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-semibold shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft, total);
              onOpenChange(false);
            }}
            className="inline-flex items-center px-5 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export function FreightBillingSapCreate(_: { mode?: "with" | "without" } = {}) {
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [provision, setProvision] = useState(false);
  const [account, setAccount] = useState(false);

  const [provisionBreakdown, setProvisionBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [provisionTotal, setProvisionTotal] = useState<number | "">("");
  const [provisionDate, setProvisionDate] = useState("");
  const [provisionOpen, setProvisionOpen] = useState(false);

  const [freightBreakdown, setFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [freightTotal, setFreightTotal] = useState<number | "">("");
  const [freightOpen, setFreightOpen] = useState(false);
  const [freightBillNo, setFreightBillNo] = useState("");
  const [freightBillDate, setFreightBillDate] = useState("");
  const [billSubmissionDate, setBillSubmissionDate] = useState("");
  const [physicalSubmissionDate, setPhysicalSubmissionDate] = useState("");

  return (
    <div className="space-y-2">

      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
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
                <input placeholder="Enter Ref. No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter LR No." className={GREEN_INPUT + " text-center"} />
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

      {/* Field grid */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
          <div>
            <label className={LABEL}>Invoice Number</label>
            <input placeholder="Enter Invoice Number" className={GREEN_INPUT} />
          </div>
          <div>
            <label className={LABEL}>Transportation Type</label>
            <input placeholder="Enter Transportation Type" className={GREEN_INPUT} />
          </div>
          <div className="flex items-end gap-6 pb-1">
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
              <input
                type="checkbox"
                checked={provision}
                onChange={(e) => {
                  setProvision(e.target.checked);
                  if (e.target.checked) setAccount(false);
                }}
                className="size-4 accent-emerald-600"
              />
              Provision
            </label>
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
              <input
                type="checkbox"
                checked={account}
                onChange={(e) => {
                  setAccount(e.target.checked);
                  if (e.target.checked) setProvision(false);
                }}
                className="size-4 accent-emerald-600"
              />
              Account
            </label>
          </div>

          {provision && (
            <>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Provision Amount</label>
                <input
                  readOnly
                  value={provisionTotal === "" ? "" : String(provisionTotal)}
                  onClick={() => setProvisionOpen(true)}
                  placeholder="Click to enter amount"
                  className={GREEN_INPUT + " cursor-pointer"}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Provision Date</label>
                <input
                  type="date"
                  value={provisionDate}
                  onChange={(e) => setProvisionDate(e.target.value)}
                  className={GREEN_INPUT}
                />
              </div>
            </>
          )}

          {account && (
            <>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Freight Bill Number</label>
                <input
                  value={freightBillNo}
                  onChange={(e) => setFreightBillNo(e.target.value)}
                  placeholder="Freight Bill Number"
                  className={GREEN_INPUT}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Freight Bill Date</label>
                <input
                  type="date"
                  value={freightBillDate}
                  onChange={(e) => setFreightBillDate(e.target.value)}
                  className={GREEN_INPUT}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Physical Submission Date</label>
                <input
                  type="date"
                  value={physicalSubmissionDate}
                  onChange={(e) => setPhysicalSubmissionDate(e.target.value)}
                  className={GREEN_INPUT}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Freight Charges</label>
                <input
                  readOnly
                  value={freightTotal === "" ? "" : String(freightTotal)}
                  onClick={() => setFreightOpen(true)}
                  placeholder="Click to enter charges"
                  className={GREEN_INPUT + " cursor-pointer"}
                />
              </div>
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className={LABEL}>Bill Submission To F&amp;A</label>
                <input
                  type="date"
                  value={billSubmissionDate}
                  onChange={(e) => setBillSubmissionDate(e.target.value)}
                  className={GREEN_INPUT}
                />
              </div>
            </>
          )}

          <div>
            <label className={LABEL}>Freight Bill upload</label>
            <input type="file" className={GREEN_INPUT + " py-1.5"} />
          </div>
          <div>
            <label className={LABEL}>Unloading Charges Approval</label>
            <input type="file" className={GREEN_INPUT + " py-1.5"} />
          </div>
          <div>
            <label className={LABEL}>Detention Charges Uploading</label>
            <input type="file" className={GREEN_INPUT + " py-1.5"} />
          </div>
          <div>
            <label className={LABEL}>Work Order Uploading</label>
            <input type="file" className={GREEN_INPUT + " py-1.5"} />
          </div>
        </div>
      </div>

      {/* Footer action bar */}
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

      <ChargesBreakdownDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Detailed Provision Amount Input"
        totalLabel="Total Provision"
        value={provisionBreakdown}
        onSave={(b, total) => {
          setProvisionBreakdown(b);
          setProvisionTotal(total);
        }}
      />
      <ChargesBreakdownDialog
        open={freightOpen}
        onOpenChange={setFreightOpen}
        title="Detailed Freight Charges Input"
        totalLabel="Total Freight"
        value={freightBreakdown}
        onSave={(b, total) => {
          setFreightBreakdown(b);
          setFreightTotal(total);
        }}
      />
    </div>
  );
}