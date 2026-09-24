import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreVertical,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Eye,
  FileText,
  ExternalLink,
  Download,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// @ts-ignore
import service, { getLocalDocumentUrl, downloadDocument } from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import { GateDatePicker } from "@/components/ui/date-picker";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const RED_INPUT =
  "h-7 w-full rounded-md bg-red-50 dark:bg-red-900/20 border border-red-500 px-2 text-[12px] text-red-600 font-medium outline-none focus:border-red-600 focus:ring-2 focus:ring-red-500/30 placeholder:text-red-300";
const LABEL =
  "block text-[11px] font-semibold text-muted-foreground mb-0.5";
const RED_LABEL =
  "block text-[11px] font-semibold text-red-600 mb-0.5";

// Table Multi-Select Dropdown for LR Numbers
function TableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select LR No",
  className,
  disabled = false,
  readOnly = false,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = value
    ? value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    if (disabled || readOnly) return;
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    onChange(next.join(","));
  };

  const selectAll = () => {
    if (disabled || readOnly) return;
    onChange(options.join(","));
  };

  const clearAll = () => {
    if (disabled || readOnly) return;
    onChange("");
  };

  const displayLabel = () => {
    if (selected.length === 0) return "";
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title={selected.join(", ")}
          className={
            (className ? className + " " : "") +
            "flex items-center justify-between gap-1 text-left truncate cursor-pointer" +
            (disabled ? " cursor-not-allowed opacity-60 pointer-events-none" : "") +
            (selected.length === 0 ? " text-muted-foreground" : "")
          }
        >
          <span className="truncate font-mono">{displayLabel() || placeholder}</span>
          <ChevronDown className={"size-3.5 shrink-0 transition-transform" + (open ? " rotate-180" : "")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 bg-white dark:bg-surface border border-hairline shadow-elegant" align="start">
        <div className="p-1.5 border-b border-hairline flex items-center justify-between text-[10.5px]">
          <span className="font-semibold text-muted-foreground">Select LR ({options.length})</span>
          {options.length > 1 && !readOnly && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {options.length > 5 && (
          <div className="p-1.5 border-b border-hairline">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search LR..."
              className="h-6 w-full rounded border border-input bg-background px-2 text-[11px] text-foreground outline-none focus:border-accent"
            />
          </div>
        )}
        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-muted-foreground">No LR found</div>
          ) : (
            filtered.map((o) => (
              <label
                key={o}
                className={
                  "flex items-center gap-2 px-2 py-1 rounded text-[11.5px] hover:bg-muted/60 transition-colors " +
                  (readOnly ? "cursor-default" : "cursor-pointer")
                }
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  disabled={readOnly}
                  onChange={() => toggle(o)}
                  className="size-3.5 accent-primary rounded"
                />
                <span className="font-mono text-foreground">{o}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const SEARCH_OPTIONS = [
  "Reference",
  "Invoice",
  "ODN",
  "SO Number",
  "Work Order",
  "LR Number",
];

const SEARCH_FIELD_MAP: Record<string, string> = {
  "Reference": "ref_no",
  "Invoice": "inv_no",
  "ODN": "odn_no",
  "SO Number": "so_no",
  "Work Order": "workorder_no",
  "LR Number": "lr_no",
};

type TableRow = {
  MAPID: string;
  REF_NO: string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: string;
  selected: boolean;
  lrOptions?: string[];
  compInvoices?: string[];
  notAllowed?: boolean;
};

const EMPTY_ROW = (): TableRow => ({
  MAPID: "",
  REF_NO: "",
  WORK_ORDER_NO: "",
  LR_NO: "",
  TRANSPORTER: "",
  LINE_NO: "",
  selected: false,
  lrOptions: [],
  compInvoices: [],
  notAllowed: false,
});

// Columns rendered before the "P/A Check" (View) button — kept editable already
const PRE_PA_EDITABLE_FIELDS: { field: string; type: string }[] = [
  { field: "ZODN_NO", type: "text" },
  { field: "ZSONO", type: "text" },
  { field: "ZSALE_PERSON", type: "text" },
];

// Columns rendered after the "P/A Check" (View) button — now editable like OrderInfoSapCreate
const POST_PA_EDITABLE_FIELDS: { field: string; type: string; readonly?: boolean }[] = [
  { field: "ZPROVAMT", type: "number" },
  { field: "ZPROVDT", type: "date" },
  { field: "ZBILLNO", type: "text" },
  { field: "ZBILLDATE", type: "date" },
  { field: "ZPHY_DATE", type: "date" },
  { field: "ZFRT_CHARGES", type: "number" },
  { field: "ZWORK_ORDER", type: "text", readonly: true },
  { field: "ZBILL_SUBMISSION", type: "date" },
  { field: "ZLRNO", type: "text", readonly: true },
  { field: "ZTRANSPORTER", type: "text", readonly: true },
  { field: "ZLOCATION", type: "text" },
  { field: "ZVEH_NUM", type: "text" },
  { field: "ZCREATED_DT", type: "date", readonly: true },
  { field: "ZVEH_LINE", type: "text" },
];


function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

// Reads a File as a base64 data URI, e.g. "data:application/pdf;base64,JVBERi0x..."
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Show only the file name from a stored document path.
//   "D:\Pravah\SAP\Freight_Billing\Freight_Bill\1000_5000_bill.pdf"
//     -> "1000_5000_bill.pdf"
// Returns "" when there is no path or when it is just a field identifier.
const KNOWN_FIELD_NAMES = new Set([
  "Freight_Bill",
  "Unloading_Charges_Approval",
  "Detention_Charges",
  "Work_Order",
  "Images",
  "FSR_Report",
  "FIR_Report",
  "COF",
  "POD",
  "Supporting_Document",
  "Approve_Document",
  "ZFRBILLUP",
  "ZUNLOADAPP",
  "ZDETENTUP",
  "ZWORDUP",
  "ZDIMAGES",
  "ZFSRREP",
  "ZFIRREP",
  "ZCOF",
]);

function fileNameFromPath(storedPath?: string): string {
  if (!storedPath) return "";
  const parts = String(storedPath).split(/[\\/]/);
  const name = parts[parts.length - 1] || "";
  return KNOWN_FIELD_NAMES.has(name) ? "" : name;
}

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

// Multi-select combo for the Invoice Number field, populated from the
// reference table rows the user has checked (mirrors GateInOutCreate.GateF4MultiSelect).
function F4MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  className,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(",").filter(Boolean) : [];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
    onChange(next.join(","));
  };

  const displayLabel = () => {
    if (selected.length === 0) return "";
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          (className ? className + " " : "") +
          "flex items-center justify-between gap-2 text-left" +
          (selected.length === 0 ? " text-muted-foreground" : "")
        }
      >
        <span className="truncate">{displayLabel() || placeholder}</span>
        <ChevronDown className={"size-3.5 shrink-0 transition-transform" + (open ? " rotate-180" : "")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface shadow-elegant max-h-60 overflow-y-auto">
          <div className="p-1.5 sticky top-0 bg-surface border-b border-hairline">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="h-7 w-full rounded border border-input bg-background px-2 text-[12px] text-foreground outline-none focus:border-accent"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted-foreground">No options</div>
          ) : (
            filtered.map((o) => (
              <label
                key={o}
                className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  onChange={() => toggle(o)}
                  className="size-3.5"
                />
                <span className="truncate">{o}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
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
  onSave: (b: Breakdown, total: number, gst: number) => void;
}) {
  const [draft, setDraft] = useState<Breakdown>(value);
  const [taxMode, setTaxMode] = useState<"RCM" | "FCM">("RCM");
  const [gstAmount, setGstAmount] = useState<number>(0);
  // Sync when reopened
  const total = useMemo(() => computeTotal(draft), [draft]);
  const grandTotal = taxMode === "FCM" ? total + (Number(gstAmount) || 0) : total;

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
          <div className="mb-3 flex items-center gap-4">
            {(["RCM", "FCM"] as const).map((m) => (
              <label key={m} className="flex items-center gap-1.5 text-[12px] font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name={`tax-mode-${title}`}
                  checked={taxMode === m}
                  onChange={() => setTaxMode(m)}
                  className="accent-primary"
                />
                {m}
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
            {BREAKDOWN_FIELDS.map((k) => (
              <div key={k}>
                <label className={LABEL}>{k}</label>
                <input
                  type="number"
                  value={draft[k] === 0 ? "" : draft[k]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [k]: Number(e.target.value) || 0 }))
                  }
                  placeholder="0"
                  className={GREEN_INPUT}
                />
              </div>
            ))}
            {taxMode === "FCM" && (
              <div>
                <label className={LABEL}>GST Amount</label>
                <input
                  type="number"
                  value={gstAmount === 0 ? "" : gstAmount}
                  onChange={(e) => setGstAmount(Number(e.target.value) || 0)}
                  placeholder="0"
                  className={GREEN_INPUT}
                />
              </div>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-[13px] font-semibold text-foreground">
            <span>{totalLabel}: {total}</span>
            {taxMode === "FCM" && (
              <>
                <span>GST Total: {Number(gstAmount) || 0}</span>
                <span>Grand Total: {grandTotal}</span>
              </>
            )}
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
              onSave(draft, grandTotal, taxMode === "FCM" ? Number(gstAmount) || 0 : 0);
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

// ── P/A Check modal (mirrors the Angular `pACheckModal` template) ──────────
type PAFormData = {
  provisionChecked: boolean;
  provisionAmount: number | "";
  provisionDate: string;
  accountChecked: boolean;
  freightBillNumber: string;
  freightBillDate: string;
  physicalSubmissionDate: string;
  freightCharges: number | "";
  billSubmission: string;
};

const EMPTY_PA_FORM: PAFormData = {
  provisionChecked: false,
  provisionAmount: "",
  provisionDate: "",
  accountChecked: false,
  freightBillNumber: "",
  freightBillDate: "",
  physicalSubmissionDate: "",
  freightCharges: "",
  billSubmission: "",
};

function PACheckDialog({
  open,
  onOpenChange,
  formData,
  setFormData,
  onOpenFreightBreakdown,
  onOpenProvisionBreakdown,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  formData: PAFormData;
  setFormData: React.Dispatch<React.SetStateAction<PAFormData>>;
  onOpenFreightBreakdown: () => void;
  onOpenProvisionBreakdown: () => void;
  onUpdate: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 animate-in fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl overflow-x-hidden bg-surface border border-hairline shadow-elegant animate-in zoom-in-95">
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center justify-between sticky top-0 z-10">
          <h3 className="text-white text-[14px] font-semibold tracking-wide">
            Provision / Account Details - Update
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            className="text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Provision section */}
          <div className="rounded-lg border border-hairline p-4">
            <h4 className="text-[13px] font-bold text-foreground mb-3">Provision Details</h4>
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              <input
                type="checkbox"
                checked={formData.provisionChecked}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, provisionChecked: e.target.checked }))
                }
                className="size-4 accent-emerald-600"
              />
              Provision
            </label>

            {formData.provisionChecked && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className={LABEL}>Provision Amount</label>
                  <input
                    readOnly
                    value={formData.provisionAmount === "" ? "" : String(formData.provisionAmount)}
                    onClick={onOpenProvisionBreakdown}
                    placeholder="Click to enter amount"
                    className={GREEN_INPUT + " cursor-pointer"}
                  />
                </div>
                <div>
                  <GateDatePicker
                    label="Provision Date"
                    value={formData.provisionDate}
                    onChange={(_, str) =>
                      setFormData((p) => ({ ...p, provisionDate: str }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Account section */}
          <div className="rounded-lg border border-hairline p-4">
            <h4 className="text-[13px] font-bold text-foreground mb-3">Account Details</h4>
            <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 mb-1">
              <input
                type="checkbox"
                checked={formData.accountChecked}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, accountChecked: e.target.checked }))
                }
                className="size-4 accent-emerald-600"
              />
              Account
            </label>

            {formData.accountChecked && (
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                <div>
                  <label className={LABEL}>Freight Bill Number</label>
                  <input
                    value={formData.freightBillNumber}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, freightBillNumber: e.target.value }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
                <div>
                  <GateDatePicker
                    label="Freight Bill Date"
                    value={formData.freightBillDate}
                    onChange={(_, str) =>
                      setFormData((p) => ({ ...p, freightBillDate: str }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
                <div>
                  <GateDatePicker
                    label="Physical Submission Date"
                    value={formData.physicalSubmissionDate}
                    onChange={(_, str) =>
                      setFormData((p) => ({ ...p, physicalSubmissionDate: str }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Freight Charges</label>
                  <input
                    readOnly
                    value={formData.freightCharges === "" ? "" : String(formData.freightCharges)}
                    onClick={onOpenFreightBreakdown}
                    placeholder="Click to enter charges"
                    className={GREEN_INPUT + " cursor-pointer"}
                  />
                </div>
                <div>
                  <GateDatePicker
                    label="Bill Submission To F&A"
                    value={formData.billSubmission}
                    onChange={(_, str) =>
                      setFormData((p) => ({ ...p, billSubmission: str }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-5 flex items-center justify-end gap-2">
          <button
            onClick={() => onOpenChange(false)}
            className="inline-flex items-center px-5 h-9 rounded-md bg-gray-500 hover:bg-gray-600 text-white text-[12px] font-semibold shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onUpdate}
            className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] text-white text-[12px] font-semibold shadow-sm"
          >
            <Save className="size-3.5" />
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

// Small reusable icon-button set (matches Transit Info screen design)
function IconButton({
  variant,
  onClick,
  title,
  path,
}: {
  variant: "blue" | "red" | "emerald" | "gray";
  onClick: () => void;
  title?: string;
  path: string;
}) {
  const styles: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    red: "bg-red-50 text-red-600 hover:bg-red-100",
    emerald: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    gray: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`size-6 grid place-items-center rounded ${styles[variant]}`}
    >
      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
      </svg>
    </button>
  );
}

const EDIT_PATH = "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z";
const DELETE_PATH = "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16";
const CHECK_PATH = "M5 13l4 4L19 7";
const X_PATH = "M6 18L18 6M6 6l12 12";

export function FreightBillingSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {
  const navigate = useNavigate();
  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [provision, setProvision] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return JSON.parse(sessionStorage.getItem("freight-billing-provision") || "false");
    } catch {
      return false;
    }
  });
  const [account, setAccount] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return JSON.parse(sessionStorage.getItem("freight-billing-account") || "false");
    } catch {
      return false;
    }
  });

  const [provisionBreakdown, setProvisionBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [provisionTotal, setProvisionTotal] = useState<number | "">("");
  const [provisionDate, setProvisionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-provision-date") || "";
    } catch {
      return "";
    }
  });
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provisionGst, setProvisionGst] = useState<number>(0);

  const [freightBreakdown, setFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [freightTotal, setFreightTotal] = useState<number | "">("");
  const [freightOpen, setFreightOpen] = useState(false);
  const [freightGst, setFreightGst] = useState<number>(0);
  const [freightBillNo, setFreightBillNo] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-no") || "";
    } catch {
      return "";
    }
  });
  const [freightBillDate, setFreightBillDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-date") || "";
    } catch {
      return "";
    }
  });
  const [billSubmissionDate, setBillSubmissionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-submission-date") || "";
    } catch {
      return "";
    }
  });
  const [physicalSubmissionDate, setPhysicalSubmissionDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-physical-date") || "";
    } catch {
      return "";
    }
  });
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [transportationType, setTransportationType] = useState("");

  // Freight Billing document uploads: record key -> { b64, name }
  const [fbDocs, setFbDocs] = useState<Record<string, { b64: string; name: string }>>({});
  const handlePickDoc = async (key: string, file: File | null) => {
    if (!file) {
      setFbDocs((prev) => ({ ...prev, [key]: { b64: "", name: "" } }));
      return;
    }
    const b64 = await fileToBase64(file);
    setFbDocs((prev) => ({ ...prev, [key]: { b64, name: file.name } }));
  };
  const [searchOptionsList, setSearchOptionsList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  // Search table edit files: rowIndex -> { docKey: File }
  const [editSearchFiles, setEditSearchFiles] = useState<{ [index: number]: { [key: string]: File } }>({});
  const handleSearchPickDoc = (rowIndex: number, key: string, file: File | null) => {
    setEditSearchFiles((prev) => {
      const rowFiles = { ...(prev[rowIndex] || {}) };
      if (file) {
        rowFiles[key] = file;
      } else {
        delete rowFiles[key];
      }
      return { ...prev, [rowIndex]: rowFiles };
    });
  };

  // ── P/A Check modal state ──
  const [paModalOpen, setPaModalOpen] = useState(false);
  const [paModalItem, setPaModalItem] = useState<any>(null);
  const [paModalIndex, setPaModalIndex] = useState<number>(-1);
  const [paFormData, setPaFormData] = useState<PAFormData>(EMPTY_PA_FORM);
  const [paFreightBreakdown, setPaFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [paProvisionBreakdown, setPaProvisionBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [paFreightOpen, setPaFreightOpen] = useState(false);
  const [paProvisionOpen, setPaProvisionOpen] = useState(false);
  const [paFreightGst, setPaFreightGst] = useState<number>(0);
  const [paProvisionGst, setPaProvisionGst] = useState<number>(0);

  const [financeDetails, setFinanceDetails] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-finance-details") || "";
    } catch {
      return "";
    }
  });
  const [jvNumber, setJvNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-jv-number") || "";
    } catch {
      return "";
    }
  });
  const [jvDate, setJvDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-jv-date") || "";
    } catch {
      return "";
    }
  });
  const [utrNumber, setUtrNumber] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-utr-number") || "";
    } catch {
      return "";
    }
  });
  const [utrDate, setUtrDate] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      return sessionStorage.getItem("freight-billing-utr-date") || "";
    } catch {
      return "";
    }
  });

  // ── Completed Invoices Modal State ──
  const [compInvoicesModalOpen, setCompInvoicesModalOpen] = useState(false);
  const [compInvoicesModalData, setCompInvoicesModalData] = useState<{
    refNo: string;
    invoices: string[];
  }>({
    refNo: "",
    invoices: [],
  });

  const openCompletedInvoicesModal = (row: TableRow) => {
    setCompInvoicesModalData({
      refNo: row.REF_NO || "",
      invoices: row.compInvoices || [],
    });
    setCompInvoicesModalOpen(true);
  };

  const resetFormState = () => {
    setChecked(false);
    setSearchType("");
    setSearchValue("");
    setProvision(false);
    setAccount(false);
    setProvisionBreakdown(EMPTY_BREAKDOWN);
    setProvisionTotal("");
    setProvisionDate("");
    setProvisionOpen(false);
    setProvisionGst(0);
    setFreightBreakdown(EMPTY_BREAKDOWN);
    setFreightTotal("");
    setFreightOpen(false);
    setFreightGst(0);
    setFreightBillNo("");
    setFreightBillDate("");
    setBillSubmissionDate("");
    setPhysicalSubmissionDate("");
    setItemsList([]);
    setShowTable(false);
    setTableData([EMPTY_ROW()]);
    setFullReferenceData([]);
    setInvoiceF4List([]);
    setInvoiceNumber("");
    setFbDocs({});
    setTransportationType("");
    setSearchOptionsList([]);
    setShowForm(true);
    setFinanceDetails("");
    setJvNumber("");
    setJvDate("");
    setUtrNumber("");
    setUtrDate("");
    setPaModalOpen(false);
    setPaModalItem(null);
    setPaModalIndex(-1);
    setPaFormData(EMPTY_PA_FORM);
    setPaFreightBreakdown(EMPTY_BREAKDOWN);
    setPaProvisionBreakdown(EMPTY_BREAKDOWN);
    setCompInvoicesModalOpen(false);
    setCompInvoicesModalData({ refNo: "", invoices: [] });

    if (typeof window !== "undefined") {
      sessionStorage.removeItem("freight-billing-provision");
      sessionStorage.removeItem("freight-billing-account");
      sessionStorage.removeItem("freight-billing-provision-date");
      sessionStorage.removeItem("freight-billing-no");
      sessionStorage.removeItem("freight-billing-date");
      sessionStorage.removeItem("freight-billing-submission-date");
      sessionStorage.removeItem("freight-billing-physical-date");
      sessionStorage.removeItem("freight-billing-finance-details");
      sessionStorage.removeItem("freight-billing-jv-number");
      sessionStorage.removeItem("freight-billing-jv-date");
      sessionStorage.removeItem("freight-billing-utr-number");
      sessionStorage.removeItem("freight-billing-utr-date");
    }
  };

  useEffect(() => {
    resetFormState();
  }, [mode]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("freight-billing-provision", JSON.stringify(provision));
    sessionStorage.setItem("freight-billing-account", JSON.stringify(account));
    sessionStorage.setItem("freight-billing-provision-date", provisionDate);
    sessionStorage.setItem("freight-billing-no", freightBillNo);
    sessionStorage.setItem("freight-billing-date", freightBillDate);
    sessionStorage.setItem("freight-billing-submission-date", billSubmissionDate);
    sessionStorage.setItem("freight-billing-physical-date", physicalSubmissionDate);
    sessionStorage.setItem("freight-billing-finance-details", financeDetails);
    sessionStorage.setItem("freight-billing-jv-number", jvNumber);
    sessionStorage.setItem("freight-billing-jv-date", jvDate);
    sessionStorage.setItem("freight-billing-utr-number", utrNumber);
    sessionStorage.setItem("freight-billing-utr-date", utrDate);
  }, [provision, account, provisionDate, freightBillNo, freightBillDate, billSubmissionDate, physicalSubmissionDate, financeDetails, jvNumber, jvDate, utrNumber, utrDate]);


  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "FREIGHT BILLING",
      REF_NO: fieldKey === "REF_NO" ? row.REF_NO : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? row.WORK_ORDER_NO : "",
      LR_NO: fieldKey === "LR_NO" ? row.LR_NO : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? row.TRANSPORTER : "",
      LINE_NO: row.LINE_NO || "",
      ZUSER: getLoggedInUser(),
    };

    try {
      const res: any = isSap
        ? await service.GlobalReferenceNoFetch(payload)
        : await service.GlobalReferenceNoFetchwithoutsap(payload);

      if (res?.STATUS === "FALSE") {
        Swal.fire({ icon: "error", title: "Error", text: res?.MESSAGE || "No matching reference details found." });
        setTableData([EMPTY_ROW()]);
        setFullReferenceData([]);
        setInvoiceF4List([]);
        return;
      }
      if (Array.isArray(res) && res.length > 0) {
        setFullReferenceData(res);
        setTableData(res.map((item: any) => {
          let lrOptions: string[] = [];
          if (Array.isArray(item.LR_NO)) {
            lrOptions = item.LR_NO.map((x: any) =>
              typeof x === "object" && x !== null ? x.LR : String(x)
            ).filter(Boolean);
          } else if (typeof item.LR_NO === "string" && item.LR_NO.trim()) {
            lrOptions = [item.LR_NO.trim()];
          }
          lrOptions = Array.from(new Set(lrOptions));

          let compInvoices: string[] = [];
          if (Array.isArray(item.COMP_INV_NO)) {
            compInvoices = item.COMP_INV_NO.map((x: any) =>
              typeof x === "object" && x !== null
                ? x.VBELN || x.INV_NO || x.INVOICE || x.inv_no
                : String(x)
            ).filter(Boolean);
          } else if (typeof item.COMP_INV_NO === "string" && item.COMP_INV_NO.trim()) {
            compInvoices = [item.COMP_INV_NO.trim()];
          }
          compInvoices = Array.from(new Set(compInvoices));

          const isNotAllowed = String(item.ZNOT_ALLOWED || "").trim().toUpperCase() === "X";

          let initialLr = "";
          if (Array.isArray(item.LR_NO)) {
            initialLr = lrOptions.join(",");
          } else if (typeof item.LR_NO === "string") {
            initialLr = item.LR_NO;
          }

          return {
            MAPID: item.MAPID || "",
            REF_NO: item.REF_NO || "",
            WORK_ORDER_NO: item.WORK_ORDER_NO || "",
            LR_NO: initialLr || item.LR_NO || "",
            TRANSPORTER: item.TRANSPORTER || "",
            LINE_NO: item.LINE_NO || "",
            selected: false,
            lrOptions,
            compInvoices,
            notAllowed: isNotAllowed,
          };
        }));
      } else {
        setTableData([EMPTY_ROW()]);
        setFullReferenceData([]);
        setInvoiceF4List([]);
      }
    } catch (e) {
      console.error("GlobalReference fetch error:", e);
      Swal.fire({ icon: "error", text: "Error fetching reference details." });
    }
  };

  // Recompute invoice number options from the reference rows the user has checked
  // (mirrors GateInOutCreate.updateInvoiceListForSelectedItems).
  useEffect(() => {
    const selectedMapIds = tableData
      .filter((r) => r.selected && r.MAPID)
      .map((r) => String(r.MAPID));

    if (selectedMapIds.length === 0) {
      setInvoiceF4List([]);
      return;
    }

    const f4: string[] = [];
    fullReferenceData.forEach((refItem: any) => {
      if (selectedMapIds.includes(String(refItem.MAPID)) && Array.isArray(refItem.INV_NO)) {
        refItem.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
        });
      }
    });
    setInvoiceF4List(f4);
  }, [tableData, fullReferenceData]);

  // Un-ticking a reference row also drops that row's invoices from the Invoice Number
  // selection (invoices that don't belong to any fetched reference row are left alone).
  useEffect(() => {
    if (!invoiceNumber) return;
    const ticked = new Set(tableData.filter((r) => r.selected && r.MAPID).map((r) => String(r.MAPID)));
    const known = new Set<string>();
    const allowed = new Set<string>();
    fullReferenceData.forEach((ref: any) => {
      if (!Array.isArray(ref.INV_NO)) return;
      ref.INV_NO.forEach((inv: any) => {
        if (!inv.VBELN) return;
        known.add(inv.VBELN);
        if (ticked.has(String(ref.MAPID))) allowed.add(inv.VBELN);
      });
    });
    const current = invoiceNumber.split(",").map((s) => s.trim()).filter(Boolean);
    const kept = current.filter((inv) => !known.has(inv) || allowed.has(inv));
    if (kept.length !== current.length) setInvoiceNumber(kept.join(","));
  }, [tableData, fullReferenceData]);

  const saveFreightBilling = async (
    action = "stay" // stay | next | previous
  ) => {
    try {
      // Find selected row
      // Prefer the ticked reference row that owns the chosen invoice (several rows can be ticked).
      const selectedRow = (tableData.find(
      (r) =>
        r.selected &&
        fullReferenceData.some(
          (ref: any) =>
            String(ref.MAPID) === String(r.MAPID) &&
            Array.isArray(ref.INV_NO) &&
            ref.INV_NO.some((i: any) => i.VBELN === String(invoiceNumber).split(",")[0].trim()),
        ),
    ) || tableData.find((r) => r.selected));

      if (!selectedRow) {
        Swal.fire({
          icon: "warning",
          text: "Please select at least one reference row before saving",
        });
        return;
      }

      const record = {
        INV_NO: invoiceNumber,
        REFNO: selectedRow.REF_NO,
        LINE_NO: selectedRow.LINE_NO,
        BILLNO: freightBillNo,
        BILLDATE: freightBillDate,

        PRO_CHK: provision ? "X" : "",
        ACC_CHK: account ? "X" : "",

        PROVDT: provisionDate,
        PROVAMT: provisionTotal || 0,

        PHY_DATE: physicalSubmissionDate,
        FRT_CHARGES: freightTotal || 0,

        ORDER_NO: selectedRow.WORK_ORDER_NO,
        WORKORDER: selectedRow.WORK_ORDER_NO,
        LRNO: selectedRow.LR_NO,
        TRANSPORTER: selectedRow.TRANSPORTER,

        BILL_SUBMISSION: billSubmissionDate,

        FRBILLUP: fbDocs.FRBILLUP?.b64 || "",
        FRBILLUP_NAME: fbDocs.FRBILLUP?.name || "",
        UNLOADAPP: fbDocs.UNLOADAPP?.b64 || "",
        UNLOADAPP_NAME: fbDocs.UNLOADAPP?.name || "",
        DETENTUP: fbDocs.DETENTUP?.b64 || "",
        DETENTUP_NAME: fbDocs.DETENTUP?.name || "",
        WORDUP: fbDocs.WORDUP?.b64 || "",
        WORDUP_NAME: fbDocs.WORDUP?.name || "",

        // Freight Charges
        ZFC_BASIC: account ? freightBreakdown["Basic Freight"] : 0,
        ZFC_DELOAD: account ? freightBreakdown["Detention Loading"] : 0,
        ZFC_DEUNLOAD: account ? freightBreakdown["Detention Unloading"] : 0,
        ZFC_LOAD: account ? freightBreakdown["Loading Charges"] : 0,
        ZFC_UNLOAD: account ? freightBreakdown["Unloading Charges"] : 0,
        ZFC_ROUTE: account ? freightBreakdown["Route Change"] : 0,
        ZFC_TSHIP: account ? freightBreakdown["Transhipment Charges"] : 0,
        ZFC_OTHER: account ? freightBreakdown["Other Charges"] : 0,
        ZFC_DEDUCT: account ? freightBreakdown["Deduction"] : 0,

        // Provision Breakdown
        ZPR_BASIC: provision ? provisionBreakdown["Basic Freight"] : 0,
        ZPR_DELOAD: provision ? provisionBreakdown["Detention Loading"] : 0,
        ZPR_DEUNLOAD: provision ? provisionBreakdown["Detention Unloading"] : 0,
        ZPR_LOAD: provision ? provisionBreakdown["Loading Charges"] : 0,
        ZPR_UNLOAD: provision ? provisionBreakdown["Unloading Charges"] : 0,
        ZPR_ROUTE: provision ? provisionBreakdown["Route Change"] : 0,
        ZPR_TSHIP: provision ? provisionBreakdown["Transhipment Charges"] : 0,
        ZPR_OTHER: provision ? provisionBreakdown["Other Charges"] : 0,
        ZPR_DEDUCT: provision ? provisionBreakdown["Deduction"] : 0,

        FINANCE_DETAILS: financeDetails === "Yes" ? "Y" : financeDetails === "No" ? "N" : financeDetails,
        JV_NUMBER: jvNumber,
        JV_DATE: jvDate,
        UTR_NUMBER: utrNumber,
        UTR_DATE: utrDate,

        ZFINDET: financeDetails === "Yes" ? "Y" : financeDetails === "No" ? "N" : financeDetails,
        ZJVNUM: jvNumber,
        ZJVDT: jvDate,
        ZUTRNUM: utrNumber,
        ZUTRDT: utrDate,
        ZGSTAMT: (provision ? provisionGst : 0) + (account ? freightGst : 0),
      };

      // Multiple invoices selected → one separate record per invoice in the same SAVE / CREATE
      // array (same idea as Transit Info). Every record carries the screen's input-field values;
      // the reference-row fields come from the ticked row that owns that invoice. With one (or
      // no) invoice this is just [record], exactly as before.
      const selectedInvoices = (invoiceNumber || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const records =
        selectedInvoices.length > 0 &&
        (selectedInvoices.length > 1 || tableData.filter((row) => row.selected).length > 1)
          ? selectedInvoices.map((inv) => {
              const ownerRow =
                tableData.find(
                  (row) =>
                    row.selected &&
                    fullReferenceData.some(
                      (ref: any) =>
                        String(ref.MAPID) === String(row.MAPID) &&
                        Array.isArray(ref.INV_NO) &&
                        ref.INV_NO.some((i: any) => i.VBELN === inv)
                    )
                ) || selectedRow;

              return {
                ...record,
                INV_NO: inv,
                REFNO: ownerRow.REF_NO,
                LINE_NO: ownerRow.LINE_NO,
                ORDER_NO: ownerRow.WORK_ORDER_NO,
                WORKORDER: ownerRow.WORK_ORDER_NO,
                LRNO: ownerRow.LR_NO,
                TRANSPORTER: ownerRow.TRANSPORTER,
              };
            })
          : [record];

      console.log(records);

      const response = isSap
        ? await service.FreightBillingSave({ SAVE: records })
        : await service.FreightBillingNonSap({ CREATE: records });

      if (response.STATUS === "true" || response.NUMBER === "200") {
        await Swal.fire({
          icon: "success",
          text: response.MESSAGE || "Freight Billing Saved Successfully",
        });

        resetFormState();

        if (action === "next") {
          navigate({ to: "/service-level" });
        } else if (action === "previous") {
          navigate({ to: "/transit-info" });
        }
      } else {
        Swal.fire({
          icon: "error",
          text: response.MESSAGE || "Save Failed",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while saving.",
      });
    }
  };

  const onSearchReference = async () => {
    setShowForm(true);

    if (!searchValue.trim()) {
      Swal.fire({
        icon: "warning",
        text: "Please enter a value",
      });
      return;
    }

    if (!searchType) {
      Swal.fire({
        icon: "info",
        text: "Please select a search type",
      });
      return;
    }

    const payload = {
      global: "FREIGHT BILLING",
      data: {
        ref_no: "",
        inv_no: "",
        so_no: "",
        transporter: "",
        lr_no: "",
        workorder_no: "",
        sales_person: "",
        location: "",
        odn_no: "",
        vehicle_no: "",
        freight_billno: "",
        nature_damage: "",
        claim_status: "",
      },
    };

    const apiField = SEARCH_FIELD_MAP[searchType];

    payload.data[apiField as keyof typeof payload.data] = searchValue.trim();

    console.log("Payload", payload);

    try {
      const res = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      console.log("Response", res);

      if (res.NUMBER === "100" && res.STATUS === "FALSE") {
        setSearchOptionsList([]);
        setShowForm(true);
        Swal.fire({
          icon: "warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res.HEADER || res.HEADER.length === 0) {
        setSearchOptionsList([]);
        setShowForm(true);
        Swal.fire({
          icon: "info",
          text: "No records found",
        });
        return;
      }

      setSearchOptionsList(
        res.HEADER.map((item: any) => ({
          ...item,
          isEdit: false,
        }))
      );

      setShowForm(false);

      Swal.fire({
        icon: "success",
        text: "Data fetched successfully!",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);

      setShowForm(true);
      Swal.fire({
        icon: "error",
        text: "Error fetching data",
      });
    }
  };


  const updateSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this Freight Billing record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    if (!row.ZREFNO || !row.ZINV_NO || !row.ZLINE_NO) {
      Swal.fire("Error", "Primary key missing", "error");
      return;
    }

    const rowFiles = editSearchFiles[index] || {};
    const frb64 = rowFiles.FRBILLUP ? await fileToBase64(rowFiles.FRBILLUP) : "";
    const unb64 = rowFiles.UNLOADAPP ? await fileToBase64(rowFiles.UNLOADAPP) : "";
    const deb64 = rowFiles.DETENTUP ? await fileToBase64(rowFiles.DETENTUP) : "";
    const wob64 = rowFiles.WORDUP ? await fileToBase64(rowFiles.WORDUP) : "";

    const payload = {
      CHANGE: [
        {
          ZREFNO: row.ZREFNO,
          ZINV_NO: row.ZINV_NO,
          ZBILLNO: row.ZBILLNO,
          ZLINE_NO: row.ZLINE_NO,

          ZODN_NO: row.ZODN_NO,
          ZSONO: row.ZSONO,
          ZSALE_PERSON: row.ZSALE_PERSON,
          ZBILLDATE: row.ZBILLDATE,
          ZPHY_DATE: row.ZPHY_DATE,
          ZFRT_CHARGES: row.ZFRT_CHARGES,
          ZWORKORDER: row.ZWORKORDER,
          ZBILL_SUBMISSION: row.ZBILL_SUBMISSION,
          ZWORK_ORDER: row.ZWORK_ORDER,
          ZLRNO: row.ZLRNO,
          ZTRANSPORTER: row.ZTRANSPORTER,
          ZLOCATION: row.ZLOCATION,
          ZVEH_LINE: row.ZVEH_LINE,
          ZVEH_NUM: row.ZVEH_NUM,
          ZCREATED_DT: row.ZCREATED_DT,
          ZPLANT: row.ZPLANT,
          ZDIVISION: row.ZDIVISION,
          ZVEH_TYPE: row.ZVEH_TYPE,

          ZPRO_CHK: row.ZPRO_CHK,
          ZACC_CHK: row.ZACC_CHK,

          ZPROVDT: row.ZPROVDT,
          ZPROVAMT: row.ZPROVAMT,

          ZFRBILLUP: frb64 || "",
          FRBILLUP: frb64 || "",
          FRBILLUP_NAME: rowFiles.FRBILLUP?.name || "",
          ZFRBILLUP_NAME: rowFiles.FRBILLUP?.name || "",

          ZUNLOADAPP: unb64 || "",
          UNLOADAPP: unb64 || "",
          UNLOADAPP_NAME: rowFiles.UNLOADAPP?.name || "",
          ZUNLOADAPP_NAME: rowFiles.UNLOADAPP?.name || "",

          ZDETENTUP: deb64 || "",
          DETENTUP: deb64 || "",
          DETENTUP_NAME: rowFiles.DETENTUP?.name || "",
          ZDETENTUP_NAME: rowFiles.DETENTUP?.name || "",

          ZWORDUP: wob64 || "",
          WORDUP: wob64 || "",
          WORDUP_NAME: rowFiles.WORDUP?.name || "",
          ZWORDUP_NAME: rowFiles.WORDUP?.name || "",

          ZFRB_PATH: row.ZFRB_PATH,
          ZUNAPP_PATH: row.ZUNAPP_PATH,
          ZDUP_PATH: row.ZDUP_PATH,
          ZWORDUP_PATH: row.ZWORDUP_PATH,

          ZUSER: row.ZUSER,
          ZUSER_CH: getLoggedInUser(),

          ZFC_BASIC: row.ZFC_BASIC || 0,
          ZFC_DELOAD: row.ZFC_DELOAD || 0,
          ZFC_DEUNLOAD: row.ZFC_DEUNLOAD || 0,
          ZFC_LOAD: row.ZFC_LOAD || 0,
          ZFC_UNLOAD: row.ZFC_UNLOAD || 0,
          ZFC_ROUTE: row.ZFC_ROUTE || 0,
          ZFC_TSHIP: row.ZFC_TSHIP || 0,
          ZFC_OTHER: row.ZFC_OTHER || 0,
          ZFC_DEDUCT: row.ZFC_DEDUCT || 0,

          ZPR_BASIC: row.ZPR_BASIC || 0,
          ZPR_DELOAD: row.ZPR_DELOAD || 0,
          ZPR_DEUNLOAD: row.ZPR_DEUNLOAD || 0,
          ZPR_LOAD: row.ZPR_LOAD || 0,
          ZPR_UNLOAD: row.ZPR_UNLOAD || 0,
          ZPR_ROUTE: row.ZPR_ROUTE || 0,
          ZPR_TSHIP: row.ZPR_TSHIP || 0,
          ZPR_OTHER: row.ZPR_OTHER || 0,
          ZPR_DEDUCT: row.ZPR_DEDUCT || 0,

          ZFINDET: row.ZFINDET === "Yes" ? "Y" : row.ZFINDET === "No" ? "N" : row.ZFINDET,
          ZJVNUM: row.ZJVNUM,
          ZJVDT: row.ZJVDT,
          ZUTRNUM: row.ZUTRNUM,
          ZUTRDT: row.ZUTRDT,
          ZGSTAMT: row.ZGSTAMT || 0,
        },
      ],
    };

    console.log("UPDATE PAYLOAD", payload);

    try {
      const res = isSap
        ? await service.FreightBillingChangeWithSap(payload)
        : await service.FreightBillingChangeWithoutSap(payload);

      if (res?.NUMBER === "200" || res?.STATUS === "TRUE") {
        await Swal.fire({
          icon: "success",
          text: res.MESSAGE || "Freight Billing updated successfully",
        });

        setEditSearchFiles((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });

        const list = [...searchOptionsList];
        list[index].isEdit = false;
        delete list[index]._backup;
        setSearchOptionsList(list);

        onSearchReference();
      } else {
        Swal.fire({
          icon: "error",
          text: res.MESSAGE || "Update Failed",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        text: "Server Error",
      });
    }
  };


  const deleteRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    const payload = {
      DELETE: [
        {
          ZREFNO: row.ZREFNO,
          ZINV_NO: row.ZINV_NO,
          ZLINE_NO: row.ZLINE_NO,
        },
      ],
    };

    console.log("DELETE PAYLOAD", payload);

    try {
      const res = isSap
        ? await service.FreightBillingDeleteWithSap(payload)
        : await service.FreightBillingDeleteWithOutSap(payload);

      if (
        res?.STATUS === "TRUE" ||
        res?.STATUS === true ||
        res?.NUMBER === "200"
      ) {
        const list = [...searchOptionsList];
        list.splice(index, 1);
        setSearchOptionsList(list);

        Swal.fire({
          icon: "success",
          text: res.MSG || res.MESSAGE || "Record deleted successfully",
        });

        // Optional: refresh search
        // onSearchReference();
      } else {
        Swal.fire({
          icon: "error",
          text: res.MSG || res.MESSAGE || "Delete failed",
        });
      }
    } catch (err: any) {
      console.error(err);

      Swal.fire({
        icon: "error",
        text: err?.error?.MESSAGE || "Something went wrong while deleting",
      });
    }
  };

  // ── P/A Check modal handlers (mirrors Angular openPACheckModal / updatePADetails) ──
  const openPACheckModal = (item: any, index: number) => {
    if (!item.isEdit) {
      Swal.fire({
        icon: "info",
        title: "Edit Required",
        text: "If you want to edit, please click the Edit button first.",
        confirmButtonText: "Ok",
        timer: 3000,
      });
      return;
    }

    setPaModalItem(item);
    setPaModalIndex(index);

    setPaFormData({
      provisionChecked: item.ZPRO_CHK === "X",
      provisionAmount: item.ZPROVAMT || "",
      provisionDate: item.ZPROVDT || "",
      accountChecked: item.ZACC_CHK === "X",
      freightBillNumber: item.ZBILLNO || "",
      freightBillDate: item.ZBILLDATE || "",
      physicalSubmissionDate: item.ZPHY_DATE || "",
      freightCharges: item.ZFRT_CHARGES || "",
      billSubmission: item.ZBILL_SUBMISSION || "",
    });

    setPaFreightBreakdown({
      "Basic Freight": item.ZFC_BASIC || 0,
      "Detention Loading": item.ZFC_DELOAD || 0,
      "Detention Unloading": item.ZFC_DEUNLOAD || 0,
      "Loading Charges": item.ZFC_LOAD || 0,
      "Unloading Charges": item.ZFC_UNLOAD || 0,
      "Route Change": item.ZFC_ROUTE || 0,
      "Transhipment Charges": item.ZFC_TSHIP || 0,
      "Other Charges": item.ZFC_OTHER || 0,
      "Deduction": item.ZFC_DEDUCT || 0,
    });

    setPaProvisionBreakdown({
      "Basic Freight": item.ZPR_BASIC || 0,
      "Detention Loading": item.ZPR_DELOAD || 0,
      "Detention Unloading": item.ZPR_DEUNLOAD || 0,
      "Loading Charges": item.ZPR_LOAD || 0,
      "Unloading Charges": item.ZPR_UNLOAD || 0,
      "Route Change": item.ZPR_ROUTE || 0,
      "Transhipment Charges": item.ZPR_TSHIP || 0,
      "Other Charges": item.ZPR_OTHER || 0,
      "Deduction": item.ZPR_DEDUCT || 0,
    });

    setPaFreightGst(0);
    setPaProvisionGst(0);

    setPaModalOpen(true);
  };

  const updatePADetails = () => {
    if (!paModalItem || paModalIndex < 0) return;

    const updatedItem = { ...paModalItem };

    if (paFormData.provisionChecked) {
      updatedItem.ZPRO_CHK = "X";
      updatedItem.ZPROVAMT = paFormData.provisionAmount;
      updatedItem.ZPROVDT = paFormData.provisionDate;

      updatedItem.ZPR_BASIC = paProvisionBreakdown["Basic Freight"] || 0;
      updatedItem.ZPR_DELOAD = paProvisionBreakdown["Detention Loading"] || 0;
      updatedItem.ZPR_DEUNLOAD = paProvisionBreakdown["Detention Unloading"] || 0;
      updatedItem.ZPR_LOAD = paProvisionBreakdown["Loading Charges"] || 0;
      updatedItem.ZPR_UNLOAD = paProvisionBreakdown["Unloading Charges"] || 0;
      updatedItem.ZPR_ROUTE = paProvisionBreakdown["Route Change"] || 0;
      updatedItem.ZPR_TSHIP = paProvisionBreakdown["Transhipment Charges"] || 0;
      updatedItem.ZPR_OTHER = paProvisionBreakdown["Other Charges"] || 0;
      updatedItem.ZPR_DEDUCT = paProvisionBreakdown["Deduction"] || 0;
    } else {
      updatedItem.ZPRO_CHK = "";
      updatedItem.ZPROVAMT = "";
      updatedItem.ZPROVDT = "";
      updatedItem.ZPR_BASIC = 0;
      updatedItem.ZPR_DELOAD = 0;
      updatedItem.ZPR_DEUNLOAD = 0;
      updatedItem.ZPR_LOAD = 0;
      updatedItem.ZPR_UNLOAD = 0;
      updatedItem.ZPR_ROUTE = 0;
      updatedItem.ZPR_TSHIP = 0;
      updatedItem.ZPR_OTHER = 0;
      updatedItem.ZPR_DEDUCT = 0;
    }

    if (paFormData.accountChecked) {
      updatedItem.ZACC_CHK = "X";
      updatedItem.ZBILLNO = paFormData.freightBillNumber;
      updatedItem.ZBILLDATE = paFormData.freightBillDate;
      updatedItem.ZPHY_DATE = paFormData.physicalSubmissionDate;
      updatedItem.ZFRT_CHARGES = paFormData.freightCharges;
      updatedItem.ZBILL_SUBMISSION = paFormData.billSubmission;

      updatedItem.ZFC_BASIC = paFreightBreakdown["Basic Freight"] || 0;
      updatedItem.ZFC_DELOAD = paFreightBreakdown["Detention Loading"] || 0;
      updatedItem.ZFC_DEUNLOAD = paFreightBreakdown["Detention Unloading"] || 0;
      updatedItem.ZFC_LOAD = paFreightBreakdown["Loading Charges"] || 0;
      updatedItem.ZFC_UNLOAD = paFreightBreakdown["Unloading Charges"] || 0;
      updatedItem.ZFC_ROUTE = paFreightBreakdown["Route Change"] || 0;
      updatedItem.ZFC_TSHIP = paFreightBreakdown["Transhipment Charges"] || 0;
      updatedItem.ZFC_OTHER = paFreightBreakdown["Other Charges"] || 0;
      updatedItem.ZFC_DEDUCT = paFreightBreakdown["Deduction"] || 0;
    } else {
      updatedItem.ZACC_CHK = "";
      updatedItem.ZBILLNO = "";
      updatedItem.ZBILLDATE = "";
      updatedItem.ZPHY_DATE = "";
      updatedItem.ZFRT_CHARGES = "";
      updatedItem.ZBILL_SUBMISSION = "";
      updatedItem.ZFC_BASIC = 0;
      updatedItem.ZFC_DELOAD = 0;
      updatedItem.ZFC_DEUNLOAD = 0;
      updatedItem.ZFC_LOAD = 0;
      updatedItem.ZFC_UNLOAD = 0;
      updatedItem.ZFC_ROUTE = 0;
      updatedItem.ZFC_TSHIP = 0;
      updatedItem.ZFC_OTHER = 0;
      updatedItem.ZFC_DEDUCT = 0;
    }

    updatedItem.ZGSTAMT =
      (paFormData.provisionChecked ? paProvisionGst : 0) +
      (paFormData.accountChecked ? paFreightGst : 0);

    setSearchOptionsList((prev) =>
      prev.map((r, i) => (i === paModalIndex ? updatedItem : r))
    );

    setPaModalOpen(false);

    // Reuses the existing update flow (confirmation dialog + API call)
    updateSearchRow(updatedItem, paModalIndex);
  };

  return (
    <div className="space-y-2">

      {/* Selection table */}
      <div className="rounded-xl overflow-x-auto border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-0.5 text-center">Reference Number</th>
              <th className="px-3 py-0.5 text-center">Work Order Number</th>
              <th className="px-3 py-0.5 text-center">LR Number</th>
              <th className="px-3 py-0.5 text-center">Transporter</th>
              <th className="px-3 py-0.5 text-center whitespace-nowrap">Completed Invoices</th>
              <th className="px-3 py-0.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, index) => {
              const isRowDisabled = Boolean(row.notAllowed);
              return (
                <tr
                  key={index}
                  className={
                    isRowDisabled
                      ? "border-t border-hairline/80 bg-slate-100/90 dark:bg-zinc-800/80 text-muted-foreground"
                      : ""
                  }
                >
                  <td className="px-3 py-0.5 text-center">
                    <input
                      type="checkbox"
                      checked={row.selected}
                      disabled={isRowDisabled}
                      onChange={(e) => {
                        if (isRowDisabled) return;
                        setTableData((prev) =>
                          prev.map((item, i) => ({
                            ...item,
                            selected: i === index ? e.target.checked : item.selected,
                          }))
                        );
                      }}
                      className={
                        "size-4 accent-sky-600 " +
                        (isRowDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer")
                      }
                    />
                  </td>

                  <td className="px-3 py-0.5 text-center font-mono">
                    {index + 1}
                  </td>

                  <td className="px-3 py-0.5">
                    <input
                      value={row.REF_NO}
                      readOnly={index !== 0 || isRowDisabled}
                      placeholder="Enter Ref. No."
                      onChange={(e) =>
                        setTableData((prev) => {
                          const copy = [...prev];
                          copy[index].REF_NO = e.target.value;
                          return copy;
                        })
                      }
                      onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "REF_NO");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed text-center"
                          : GREEN_INPUT) + " text-center"
                      }
                    />
                  </td>

                  <td className="px-3 py-0.5">
                    <input
                      value={row.WORK_ORDER_NO}
                      readOnly={index !== 0 || isRowDisabled}
                      placeholder="Enter Work Order No."
                      onChange={(e) =>
                        setTableData((prev) => {
                          const copy = [...prev];
                          copy[index].WORK_ORDER_NO = e.target.value;
                          return copy;
                        })
                      }
                      onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "WORK_ORDER_NO");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed text-center"
                          : GREEN_INPUT) + " text-center"
                      }
                    />
                  </td>

                  <td className="px-3 py-0.5">
                    {row.lrOptions && row.lrOptions.length > 0 ? (
                      <TableMultiSelect
                        options={row.lrOptions}
                        value={row.LR_NO}
                        readOnly={isRowDisabled}
                        onChange={(val) =>
                          setTableData((prev) => {
                            const copy = [...prev];
                            copy[index].LR_NO = val;
                            return copy;
                          })
                        }
                        placeholder="Select LR No"
                        className={
                          (isRowDisabled
                            ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-pointer text-center"
                            : GREEN_INPUT) + " text-center"
                        }
                      />
                    ) : (
                      <input
                        value={row.LR_NO}
                        readOnly={index !== 0 || isRowDisabled}
                        placeholder="Enter LR No."
                        onChange={(e) =>
                          setTableData((prev) => {
                            const copy = [...prev];
                            copy[index].LR_NO = e.target.value;
                            return copy;
                          })
                        }
                        onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") fetchGlobalReferences(row, index, "LR_NO");
                        }}
                        className={
                          (isRowDisabled
                            ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed text-center"
                            : GREEN_INPUT) + " text-center"
                        }
                      />
                    )}
                  </td>

                  <td className="px-3 py-0.5">
                    <input
                      value={row.TRANSPORTER}
                      readOnly={index !== 0 || isRowDisabled}
                      placeholder="Enter Transporter"
                      onChange={(e) =>
                        setTableData((prev) => {
                          const copy = [...prev];
                          copy[index].TRANSPORTER = e.target.value;
                          return copy;
                        })
                      }
                      onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "TRANSPORTER");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed text-center"
                          : GREEN_INPUT) + " text-center"
                      }
                    />
                  </td>

                  <td className="px-3 py-0.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openCompletedInvoicesModal(row)}
                      className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors shadow-xs cursor-pointer"
                    >
                      <Eye className="size-3.5 text-sky-600 dark:text-sky-400" />
                      <span>View</span>
                      {row.compInvoices && row.compInvoices.length > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold rounded-full bg-sky-600 text-white">
                          {row.compInvoices.length}
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="px-3 py-0.5 text-center">
                    <button type="button" className="cursor-pointer">
                      <MoreVertical className="size-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
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
            <button
              onClick={onSearchReference}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {!showForm && searchOptionsList.length > 0 && (
        <div className="max-h-[560px] overflow-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Ref No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Invoice No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Line No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">ODN No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">SO No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Sales Person</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">P/A Check</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Provision Amount</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Provision Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Bill No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Bill Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Physical Submission</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Work Order</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Bill Submission</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">LR No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Transporter</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Location</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Created Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle Line</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Freight Bill</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Unloading Charges Approval</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Detention Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Work Order</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-hairline/70">
                {searchOptionsList.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-surface hover:bg-muted/50"
                        : "bg-surface-2/40 hover:bg-muted/50"
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZINV_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>

                    {PRE_PA_EDITABLE_FIELDS.map(({ field, type }) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                        {item.isEdit ? (
                          <input
                            type={type}
                            className={GREEN_INPUT}
                            value={item[field] || ""}
                            onChange={(e) => {
                              const list = [...searchOptionsList];
                              list[index] = { ...list[index], [field]: e.target.value };
                              setSearchOptionsList(list);
                            }}
                          />
                        ) : (
                          item[field]
                        )}
                      </td>
                    ))}

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      <button
                        className="bg-blue-500 text-white px-2 rounded"
                        onClick={() => openPACheckModal(item, index)}
                      >
                        View
                      </button>
                    </td>

                    {POST_PA_EDITABLE_FIELDS.map(({ field, type, readonly }: any) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                        {item.isEdit && !readonly ? (
                          <input
                            type={type}
                            className={GREEN_INPUT}
                            value={item[field] || ""}
                            onChange={(e) => {
                              const list = [...searchOptionsList];
                              list[index] = { ...list[index], [field]: e.target.value };
                              setSearchOptionsList(list);
                            }}
                          />
                        ) : type === "date" && item[field] ? (
                          new Date(item[field]).toLocaleDateString("en-GB")
                        ) : (
                          item[field]
                        )}
                      </td>
                    ))}

                    {/* Uploaded file name per document type:
                        allow picking new file on edit row */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <div className="flex flex-col items-center gap-1">
                          {editSearchFiles[index]?.FRBILLUP?.name ? (
                            <button
                              type="button"
                              onClick={() => {
                                const file = editSearchFiles[index]?.FRBILLUP;
                                const url = file ? URL.createObjectURL(file) : "";
                                setPreviewDoc({ url, title: file?.name || "Freight Bill" });
                              }}
                              className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                              title={editSearchFiles[index]?.FRBILLUP?.name}
                            >
                              {editSearchFiles[index]?.FRBILLUP?.name}
                            </button>
                          ) : (
                            (() => {
                              const existingName = item.ZLOCALFILES?.Freight_Bill || fileNameFromPath(item.ZFRB_PATH) || "-";
                              if (existingName && existingName !== "-") {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = getLocalDocumentUrl({
                                        mode: isWithout ? "Without Sap" : "SAP",
                                        screen: "Freight_Billing",
                                        field: "Freight_Bill",
                                        fileName: existingName,
                                        storedPath: item.ZFRB_PATH,
                                        row: item,
                                      });
                                      setPreviewDoc({ url, title: existingName });
                                    }}
                                    className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                    title={existingName}
                                  >
                                    {existingName}
                                  </button>
                                );
                              }
                              return <span className="text-[12px] text-muted-foreground">-</span>;
                            })()
                          )}
                          <label className="cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors">
                            <span>{editSearchFiles[index]?.FRBILLUP ? "Change" : "Browse"}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleSearchPickDoc(index, "FRBILLUP", e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        (() => {
                          const fbName = item.ZLOCALFILES?.Freight_Bill || fileNameFromPath(item.ZFRB_PATH);
                          if (!fbName || fbName === "-" || fbName === "NA") {
                            return <span className="text-muted-foreground">-</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const url = getLocalDocumentUrl({
                                  mode: isWithout ? "Without Sap" : "SAP",
                                  screen: "Freight_Billing",
                                  field: "Freight_Bill",
                                  fileName: fbName,
                                  storedPath: item.ZFRB_PATH,
                                  row: item,
                                });
                                setPreviewDoc({ url, title: fbName });
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                              title={`View ${fbName}`}
                            >
                              <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{fbName}</span>
                            </button>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <div className="flex flex-col items-center gap-1">
                          {editSearchFiles[index]?.UNLOADAPP?.name ? (
                            <button
                              type="button"
                              onClick={() => {
                                const file = editSearchFiles[index]?.UNLOADAPP;
                                const url = file ? URL.createObjectURL(file) : "";
                                setPreviewDoc({ url, title: file?.name || "Unloading Charges Approval" });
                              }}
                              className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                              title={editSearchFiles[index]?.UNLOADAPP?.name}
                            >
                              {editSearchFiles[index]?.UNLOADAPP?.name}
                            </button>
                          ) : (
                            (() => {
                              const existingName = item.ZLOCALFILES?.Unloading_Charges_Approval || fileNameFromPath(item.ZUNAPP_PATH) || "-";
                              if (existingName && existingName !== "-") {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = getLocalDocumentUrl({
                                        mode: isWithout ? "Without Sap" : "SAP",
                                        screen: "Freight_Billing",
                                        field: "Unloading_Charges_Approval",
                                        fileName: existingName,
                                        storedPath: item.ZUNAPP_PATH,
                                        row: item,
                                      });
                                      setPreviewDoc({ url, title: existingName });
                                    }}
                                    className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                    title={existingName}
                                  >
                                    {existingName}
                                  </button>
                                );
                              }
                              return <span className="text-[12px] text-muted-foreground">-</span>;
                            })()
                          )}
                          <label className="cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors">
                            <span>{editSearchFiles[index]?.UNLOADAPP ? "Change" : "Browse"}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleSearchPickDoc(index, "UNLOADAPP", e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        (() => {
                          const unName = item.ZLOCALFILES?.Unloading_Charges_Approval || fileNameFromPath(item.ZUNAPP_PATH);
                          if (!unName || unName === "-" || unName === "NA") {
                            return <span className="text-muted-foreground">-</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const url = getLocalDocumentUrl({
                                  mode: isWithout ? "Without Sap" : "SAP",
                                  screen: "Freight_Billing",
                                  field: "Unloading_Charges_Approval",
                                  fileName: unName,
                                  storedPath: item.ZUNAPP_PATH,
                                  row: item,
                                });
                                setPreviewDoc({ url, title: unName });
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                              title={`View ${unName}`}
                            >
                              <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{unName}</span>
                            </button>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <div className="flex flex-col items-center gap-1">
                          {editSearchFiles[index]?.DETENTUP?.name ? (
                            <button
                              type="button"
                              onClick={() => {
                                const file = editSearchFiles[index]?.DETENTUP;
                                const url = file ? URL.createObjectURL(file) : "";
                                setPreviewDoc({ url, title: file?.name || "Detention Charges" });
                              }}
                              className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                              title={editSearchFiles[index]?.DETENTUP?.name}
                            >
                              {editSearchFiles[index]?.DETENTUP?.name}
                            </button>
                          ) : (
                            (() => {
                              const existingName = item.ZLOCALFILES?.Detention_Charges || fileNameFromPath(item.ZDUP_PATH) || "-";
                              if (existingName && existingName !== "-") {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = getLocalDocumentUrl({
                                        mode: isWithout ? "Without Sap" : "SAP",
                                        screen: "Freight_Billing",
                                        field: "Detention_Charges",
                                        fileName: existingName,
                                        storedPath: item.ZDUP_PATH,
                                        row: item,
                                      });
                                      setPreviewDoc({ url, title: existingName });
                                    }}
                                    className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                    title={existingName}
                                  >
                                    {existingName}
                                  </button>
                                );
                              }
                              return <span className="text-[12px] text-muted-foreground">-</span>;
                            })()
                          )}
                          <label className="cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors">
                            <span>{editSearchFiles[index]?.DETENTUP ? "Change" : "Browse"}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleSearchPickDoc(index, "DETENTUP", e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        (() => {
                          const detName = item.ZLOCALFILES?.Detention_Charges || fileNameFromPath(item.ZDUP_PATH);
                          if (!detName || detName === "-" || detName === "NA") {
                            return <span className="text-muted-foreground">-</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const url = getLocalDocumentUrl({
                                  mode: isWithout ? "Without Sap" : "SAP",
                                  screen: "Freight_Billing",
                                  field: "Detention_Charges",
                                  fileName: detName,
                                  storedPath: item.ZDUP_PATH,
                                  row: item,
                                });
                                setPreviewDoc({ url, title: detName });
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                              title={`View ${detName}`}
                            >
                              <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{detName}</span>
                            </button>
                          );
                        })()
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <div className="flex flex-col items-center gap-1">
                          {editSearchFiles[index]?.WORDUP?.name ? (
                            <button
                              type="button"
                              onClick={() => {
                                const file = editSearchFiles[index]?.WORDUP;
                                const url = file ? URL.createObjectURL(file) : "";
                                setPreviewDoc({ url, title: file?.name || "Work Order" });
                              }}
                              className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                              title={editSearchFiles[index]?.WORDUP?.name}
                            >
                              {editSearchFiles[index]?.WORDUP?.name}
                            </button>
                          ) : (
                            (() => {
                              const existingName = item.ZLOCALFILES?.Work_Order || fileNameFromPath(item.ZWORDUP_PATH) || "-";
                              if (existingName && existingName !== "-") {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = getLocalDocumentUrl({
                                        mode: isWithout ? "Without Sap" : "SAP",
                                        screen: "Freight_Billing",
                                        field: "Work_Order",
                                        fileName: existingName,
                                        storedPath: item.ZWORDUP_PATH,
                                        row: item,
                                      });
                                      setPreviewDoc({ url, title: existingName });
                                    }}
                                    className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                    title={existingName}
                                  >
                                    {existingName}
                                  </button>
                                );
                              }
                              return <span className="text-[12px] text-muted-foreground">-</span>;
                            })()
                          )}
                          <label className="cursor-pointer inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800 transition-colors">
                            <span>{editSearchFiles[index]?.WORDUP ? "Change" : "Browse"}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => handleSearchPickDoc(index, "WORDUP", e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        (() => {
                          const woName = item.ZLOCALFILES?.Work_Order || fileNameFromPath(item.ZWORDUP_PATH);
                          if (!woName || woName === "-" || woName === "NA") {
                            return <span className="text-muted-foreground">-</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const url = getLocalDocumentUrl({
                                  mode: isWithout ? "Without Sap" : "SAP",
                                  screen: "Freight_Billing",
                                  field: "Work_Order",
                                  fileName: woName,
                                  storedPath: item.ZWORDUP_PATH,
                                  row: item,
                                });
                                setPreviewDoc({ url, title: woName });
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                              title={`View ${woName}`}
                            >
                              <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{woName}</span>
                            </button>
                          );
                        })()
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {!item.isEdit ? (
                        <div className="flex gap-2 justify-center">
                          <IconButton
                            variant="blue"
                            title="Edit"
                            path={EDIT_PATH}
                            onClick={() => {
                              setEditSearchFiles((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                              const list = [...searchOptionsList];
                              list[index]._backup = { ...list[index] };
                              list[index].isEdit = true;
                              setSearchOptionsList(list);
                            }}
                          />
                          <IconButton
                            variant="red"
                            title="Delete"
                            path={DELETE_PATH}
                            onClick={() => deleteRow(item, index)}
                          />
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <IconButton
                            variant="emerald"
                            title="Save"
                            path={CHECK_PATH}
                            onClick={() => updateSearchRow(item, index)}
                          />
                          <IconButton
                            variant="gray"
                            title="Cancel"
                            path={X_PATH}
                            onClick={() => {
                              setEditSearchFiles((prev) => {
                                const next = { ...prev };
                                delete next[index];
                                return next;
                              });
                              const list = [...searchOptionsList];
                              list[index] = {
                                ...list[index]._backup,
                                isEdit: false,
                              };
                              delete list[index]._backup;
                              setSearchOptionsList(list);
                            }}
                          />
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Field grid */}
      {showForm && (
        <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
            <div>
              <label className={LABEL}>Invoice Number</label>
              <F4MultiSelect
                options={invoiceF4List}
                value={invoiceNumber}
                onChange={setInvoiceNumber}
                placeholder="Select Invoice Number"
                className={GREEN_INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Transportation Type</label>
              <select
                value={transportationType}
                onChange={(e) => setTransportationType(e.target.value)}
                className={GREEN_INPUT}
              >
                <option value="">Select Transportation Type</option>
                <option value="Rate contract">Rate contract</option>
                <option value="WORK ORDER NUMBER">work order number</option>
                <option value="Customer Transporter">Customer Transporter</option>
                <option value="Local Transporter">Local Transporter</option>
                <option value="Company vehicle">Company vehicle</option>
              </select>
            </div>
            <div className="flex items-end gap-6 pb-1">
              <label className="inline-flex items-center gap-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300">
                <input
                  type="checkbox"
                  checked={provision}
                  onChange={(e) => {
                    setProvision(e.target.checked);
                    if (e.target.checked) {
                      setAccount(false);
                      setFinanceDetails("No");
                    }
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
                    if (e.target.checked) {
                      setProvision(false);
                      setFinanceDetails("Yes");
                    }
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
                  <GateDatePicker
                    label="Provision Date"
                    value={provisionDate}
                    onChange={(_, str) => setProvisionDate(str)}
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
                  <GateDatePicker
                    label="Freight Bill Date"
                    value={freightBillDate}
                    onChange={(_, str) => setFreightBillDate(str)}
                    className={GREEN_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <GateDatePicker
                    label="Physical Submission Date"
                    value={physicalSubmissionDate}
                    onChange={(_, str) => setPhysicalSubmissionDate(str)}
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
                  <GateDatePicker
                    label="Bill Submission To F&A"
                    value={billSubmissionDate}
                    onChange={(_, str) => setBillSubmissionDate(str)}
                    className={GREEN_INPUT}
                  />
                </div>
              </>
            )}

            <div className="animate-in fade-in slide-in-from-top-2">
              <label className={RED_LABEL}>Finance Details</label>
              <select
                value={financeDetails}
                onChange={(e) => setFinanceDetails(e.target.value)}
                className={RED_INPUT}
              >
                <option value="" disabled>
                  Select Finance Details
                </option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {financeDetails === "Yes" && (
              <>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={RED_LABEL}>JV Number</label>
                  <input
                    value={jvNumber}
                    onChange={(e) => setJvNumber(e.target.value)}
                    placeholder="Enter JV Number"
                    className={RED_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <GateDatePicker
                    label={<span className="text-red-600">JV Date</span>}
                    value={jvDate}
                    onChange={(_, str) => setJvDate(str)}
                    className={RED_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <label className={RED_LABEL}>UTR Number</label>
                  <input
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter UTR Number"
                    className={RED_INPUT}
                  />
                </div>
                <div className="animate-in fade-in slide-in-from-top-2">
                  <GateDatePicker
                    label={<span className="text-red-600">UTR Date</span>}
                    value={utrDate}
                    onChange={(_, str) => setUtrDate(str)}
                    className={RED_INPUT}
                  />
                </div>
              </>
            )}

            <div>
              <label className={LABEL}>Freight Bill upload</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={provision}
                onChange={(e) => handlePickDoc("FRBILLUP", e.target.files?.[0] ?? null)}
                className={GREEN_INPUT + " py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"}
              />
            </div>
            <div>
              <label className={LABEL}>Unloading Charges Approval</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handlePickDoc("UNLOADAPP", e.target.files?.[0] ?? null)}
                className={GREEN_INPUT + " py-1.5"}
              />
            </div>
            <div>
              <label className={LABEL}>Detention Charges Uploading</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handlePickDoc("DETENTUP", e.target.files?.[0] ?? null)}
                className={GREEN_INPUT + " py-1.5"}
              />
            </div>
            <div>
              <label className={LABEL}>Work Order Uploading</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={provision}
                onChange={(e) => handlePickDoc("WORDUP", e.target.files?.[0] ?? null)}
                className={GREEN_INPUT + " py-1.5 disabled:opacity-50 disabled:cursor-not-allowed"}
              />
            </div>
          </div>
        </div>
      )}

      {/* Footer action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
        <button
          onClick={() => saveFreightBilling("stay")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
        >
          <Save className="size-3.5" />
          Save
        </button>
        <button
          onClick={() => saveFreightBilling("next")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm"
        >
          Save and Next
          <ChevronRight className="size-3.5" />
        </button>
        <button
          onClick={() => saveFreightBilling("previous")}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm"
        >
          <ChevronLeft className="size-3.5" />
          Save and Previous
        </button>
      </div>

      <ChargesBreakdownDialog
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        title="Detailed Provision Amount Input"
        totalLabel="Total Provision"
        value={provisionBreakdown}
        onSave={(b, total, gst) => {
          setProvisionBreakdown(b);
          setProvisionTotal(total);
          setProvisionGst(gst);
        }}
      />
      <ChargesBreakdownDialog
        open={freightOpen}
        onOpenChange={setFreightOpen}
        title="Detailed Freight Charges Input"
        totalLabel="Total Freight"
        value={freightBreakdown}
        onSave={(b, total, gst) => {
          setFreightBreakdown(b);
          setFreightTotal(total);
          setFreightGst(gst);
        }}
      />

      {/* P/A Check modal (View button) */}
      <PACheckDialog
        open={paModalOpen}
        onOpenChange={setPaModalOpen}
        formData={paFormData}
        setFormData={setPaFormData}
        onOpenFreightBreakdown={() => setPaFreightOpen(true)}
        onOpenProvisionBreakdown={() => setPaProvisionOpen(true)}
        onUpdate={updatePADetails}
      />
      <ChargesBreakdownDialog
        open={paFreightOpen}
        onOpenChange={setPaFreightOpen}
        title="Detailed Freight Charges Input"
        totalLabel="Total Freight"
        value={paFreightBreakdown}
        onSave={(b, total, gst) => {
          setPaFreightBreakdown(b);
          setPaFormData((p) => ({ ...p, freightCharges: total }));
          setPaFreightGst(gst);
        }}
      />
      <ChargesBreakdownDialog
        open={paProvisionOpen}
        onOpenChange={setPaProvisionOpen}
        title="Detailed Provision Amount Input"
        totalLabel="Total Provision"
        value={paProvisionBreakdown}
        onSave={(b, total, gst) => {
          setPaProvisionBreakdown(b);
          setPaFormData((p) => ({ ...p, provisionAmount: total }));
          setPaProvisionGst(gst);
        }}
      />

      {/* ── Completed Invoices Modal ── */}
      <Dialog open={compInvoicesModalOpen} onOpenChange={setCompInvoicesModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white dark:bg-surface border border-hairline shadow-2xl rounded-xl">
          {/* Header */}
          <div className="bg-gradient-primary px-5 py-3.5 text-primary-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="size-4" />
              <DialogTitle className="text-[14px] font-bold tracking-wide text-white">
                Completed Invoices
              </DialogTitle>
            </div>
            {compInvoicesModalData.refNo && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded text-white font-mono">
                Ref: {compInvoicesModalData.refNo}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between text-[12px] text-muted-foreground border-b border-hairline/60 pb-2">
              <span>Total Completed Invoices:</span>
              <span className="font-bold text-foreground bg-muted px-2 py-0.5 rounded-full text-[11px]">
                {compInvoicesModalData.invoices.length}
              </span>
            </div>

            {compInvoicesModalData.invoices.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <FileText className="size-8 mx-auto mb-2 opacity-40" />
                <p className="text-[12.5px] font-medium">No completed invoices found for this reference.</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto border border-hairline rounded-lg divide-y divide-hairline bg-surface">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-muted/50 text-[11px] font-semibold text-muted-foreground sticky top-0">
                    <tr>
                      <th className="px-3 py-2 w-12 text-center">#</th>
                      <th className="px-3 py-2">Invoice Number</th>
                      <th className="px-3 py-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/60">
                    {compInvoicesModalData.invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 text-center text-muted-foreground font-mono text-[11px]">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-mono font-medium text-foreground">
                          {inv}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 bg-muted/30 border-t border-hairline flex justify-end">
            <button
              type="button"
              onClick={() => setCompInvoicesModalOpen(false)}
              className="px-3.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-[12px] font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Local Document Viewer Modal ── */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-surface border border-hairline shadow-2xl rounded-xl">
          <div className="bg-gradient-primary px-4 py-3 flex items-center justify-between text-white">
            <div className="flex items-center gap-2 min-w-0 pr-4">
              <FileText className="size-4 shrink-0 text-white/90" />
              <DialogTitle className="text-[14px] font-bold tracking-wide text-white truncate">
                {previewDoc?.title || "Document Preview"}
              </DialogTitle>
            </div>
            {previewDoc?.url && (
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded transition-colors flex items-center gap-1 shrink-0 mr-6 cursor-pointer"
                title="Open in new window"
              >
                <ExternalLink className="size-3" />
                Open in New Tab
              </a>
            )}
          </div>
          <div className="p-3 bg-muted/20 min-h-[350px] max-h-[78vh] flex items-center justify-center overflow-auto">
            {previewDoc?.url ? (
              (() => {
                const target = (previewDoc.url || "").toLowerCase().split("?")[0];
                const titleLower = (previewDoc.title || "").toLowerCase();
                const isPdf = target.endsWith(".pdf") || titleLower.endsWith(".pdf");
                const isImg = target.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/) || titleLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/);

                if (isPdf) {
                  return (
                    <iframe
                      src={previewDoc.url}
                      title={previewDoc.title || "PDF Document"}
                      className="w-full h-[72vh] border-0 rounded-lg shadow-inner bg-white"
                    />
                  );
                }

                if (isImg) {
                  return (
                    <img
                      src={previewDoc.url}
                      alt={previewDoc.title || "Image Document"}
                      className="max-h-[72vh] max-w-full object-contain rounded-lg shadow-sm"
                    />
                  );
                }

                return (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.title || "Document"}
                    className="w-full h-[72vh] border-0 rounded-lg shadow-inner bg-white"
                  />
                );
              })()
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                No document URL available for preview.
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-muted/30 border-t border-hairline flex items-center justify-end gap-2">
            {previewDoc?.url && (
              <button
                type="button"
                onClick={() => downloadDocument(previewDoc.url, previewDoc.title)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-[12px] font-semibold transition-colors cursor-pointer shadow-sm"
              >
                <Download className="size-3.5" />
                Download
              </button>
            )}
            <button
              type="button"
              onClick={() => setPreviewDoc(null)}
              className="px-3.5 py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-foreground text-[12px] font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}