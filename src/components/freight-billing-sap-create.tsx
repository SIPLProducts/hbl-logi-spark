import { useEffect, useMemo, useState } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const RED_INPUT =
  "h-7 w-full rounded-md bg-red-50 dark:bg-red-900/20 border border-red-500 px-2 text-[12px] text-red-600 font-medium outline-none focus:border-red-600 focus:ring-2 focus:ring-red-500/30 placeholder:text-red-300";
const LABEL =
  "block text-[11px] font-semibold text-muted-foreground mb-0.5";
const RED_LABEL =
  "block text-[11px] font-semibold text-red-600 mb-0.5";

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
  REF_NO: string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: string;
  selected: boolean;
};

const EMPTY_ROW = (): TableRow => ({
  REF_NO: "", WORK_ORDER_NO: "", LR_NO: "", TRANSPORTER: "", LINE_NO: "", selected: false,
});

// Columns rendered before the "P/A Check" (View) button — kept editable already
const PRE_PA_EDITABLE_FIELDS: { field: string; type: string }[] = [
  { field: "ZODN_NO", type: "text" },
  { field: "ZSONO", type: "text" },
  { field: "ZSALE_PERSON", type: "text" },
];

// Columns rendered after the "P/A Check" (View) button — now editable like OrderInfoSapCreate
const POST_PA_EDITABLE_FIELDS: { field: string; type: string }[] = [
  { field: "ZPROVAMT", type: "number" },
  { field: "ZPROVDT", type: "date" },
  { field: "ZBILLNO", type: "text" },
  { field: "ZBILLDATE", type: "date" },
  { field: "ZPHY_DATE", type: "date" },
  { field: "ZFRT_CHARGES", type: "number" },
  { field: "ZWORK_ORDER", type: "text" },
  { field: "ZBILL_SUBMISSION", type: "date" },
  { field: "ZLRNO", type: "text" },
  { field: "ZTRANSPORTER", type: "text" },
  { field: "ZLOCATION", type: "text" },
  { field: "ZVEH_NUM", type: "text" },
  { field: "ZCREATED_DT", type: "date" },
  { field: "ZVEH_LINE", type: "text" },
];


function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
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
                  value={draft[k]}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [k]: Number(e.target.value) || 0 }))
                  }
                  className={GREEN_INPUT}
                />
              </div>
            ))}
            {taxMode === "FCM" && (
              <div>
                <label className={LABEL}>GST Amount</label>
                <input
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(Number(e.target.value) || 0)}
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
              onSave(draft, grandTotal);
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
                  <label className={LABEL}>Provision Date</label>
                  <input
                    type="date"
                    value={formData.provisionDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, provisionDate: e.target.value }))
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
                  <label className={LABEL}>Freight Bill Date</label>
                  <input
                    type="date"
                    value={formData.freightBillDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, freightBillDate: e.target.value }))
                    }
                    className={GREEN_INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Physical Submission Date</label>
                  <input
                    type="date"
                    value={formData.physicalSubmissionDate}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, physicalSubmissionDate: e.target.value }))
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
                  <label className={LABEL}>Bill Submission To F&amp;A</label>
                  <input
                    type="date"
                    value={formData.billSubmission}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, billSubmission: e.target.value }))
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

export function FreightBillingSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {
  const navigate = useNavigate();
  const isWithout = mode === "without";
  const isSap = !isWithout;
  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
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

  const [freightBreakdown, setFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [freightTotal, setFreightTotal] = useState<number | "">("");
  const [freightOpen, setFreightOpen] = useState(false);
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
  const [searchOptionsList, setSearchOptionsList] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(true);

  // ── P/A Check modal state ──
  const [paModalOpen, setPaModalOpen] = useState(false);
  const [paModalItem, setPaModalItem] = useState<any>(null);
  const [paModalIndex, setPaModalIndex] = useState<number>(-1);
  const [paFormData, setPaFormData] = useState<PAFormData>(EMPTY_PA_FORM);
  const [paFreightBreakdown, setPaFreightBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [paProvisionBreakdown, setPaProvisionBreakdown] = useState<Breakdown>(EMPTY_BREAKDOWN);
  const [paFreightOpen, setPaFreightOpen] = useState(false);
  const [paProvisionOpen, setPaProvisionOpen] = useState(false);

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
    setFreightBreakdown(EMPTY_BREAKDOWN);
    setFreightTotal("");
    setFreightOpen(false);
    setFreightBillNo("");
    setFreightBillDate("");
    setBillSubmissionDate("");
    setPhysicalSubmissionDate("");
    setItemsList([]);
    setShowTable(false);
    setTableData([EMPTY_ROW()]);
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
      global_scr: "TRANSIT INFO",
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
        Swal.fire({ icon: "info", title: "No Records Found", text: "No matching reference details found.", timer: 1500, showConfirmButton: false });
        setTableData([EMPTY_ROW()]);
        return;
      }
      if (Array.isArray(res) && res.length > 0) {
        setTableData(res.map((item: any) => ({
          REF_NO: item.REF_NO || "",
          WORK_ORDER_NO: item.WORK_ORDER_NO || "",
          LR_NO: item.LR_NO || "",
          TRANSPORTER: item.TRANSPORTER || "",
          LINE_NO: item.LINE_NO || "",
          selected: false,
        })));
      } else {
        setTableData([EMPTY_ROW()]);
      }
    } catch (e) {
      console.error("GlobalReference fetch error:", e);
      Swal.fire({ icon: "error", text: "Error fetching reference details." });
    }
  };

  const saveFreightBilling = async (
    action = "stay" // stay | next | previous
  ) => {
    try {
      // Find selected row
      const selectedRow = tableData.find((row) => row.selected);

      if (!selectedRow) {
        Swal.fire({
          icon: "warning",
          text: "Please select at least one reference row before saving",
        });
        return;
      }

      const record = {
        INV_NO: "",
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

        FRBILLUP: "",
        UNLOADAPP: "",
        DETENTUP: "",
        WORDUP: "",

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

        FINANCE_DETAILS: financeDetails,
        JV_NUMBER: jvNumber,
        JV_DATE: jvDate,
        UTR_NUMBER: utrNumber,
        UTR_DATE: utrDate,
      };

      console.log(record);

      const response = isSap
        ? await service.FreightBillingSave({ SAVE: [record] })
        : await service.FreightBillingNonSap({ CREATE: [record] });

      if (response.STATUS === "true" || response.NUMBER === "200") {
        await Swal.fire({
          icon: "success",
          text: response.MESSAGE || "Freight Billing Saved Successfully",
        });

        if (action === "next") {
          navigate({ to: "/service-level" });
        } else if (action === "previous") {
          navigate({ to: "/transit-info" });
        } else {
          // console.log("Reset Form");
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

          ZFRBILLUP: row.ZFRBILLUP,
          ZUNLOADAPP: row.ZUNLOADAPP,
          ZDETENTUP: row.ZDETENTUP,
          ZWORDUP: row.ZWORDUP,

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
            {tableData.map((row, index) => (
              <tr key={index}>
                <td className="px-3 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) => {
                      setTableData((prev) =>
                        prev.map((item, i) => ({
                          ...item,
                          selected: i === index ? e.target.checked : false,
                        }))
                      );
                    }}
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  {index + 1}
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.REF_NO}
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].REF_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.WORK_ORDER_NO}
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].WORK_ORDER_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.LR_NO}
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].LR_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.TRANSPORTER}
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].TRANSPORTER = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  <button>
                    <MoreVertical className="size-4" />
                  </button>
                </td>
              </tr>
            ))}
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

                    {POST_PA_EDITABLE_FIELDS.map(({ field, type }) => (
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
                        ) : type === "date" && item[field] ? (
                          new Date(item[field]).toLocaleDateString("en-GB")
                        ) : (
                          item[field]
                        )}
                      </td>
                    ))}

                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {!item.isEdit ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-blue-500 text-white px-2 rounded"
                            onClick={() => {
                              const list = [...searchOptionsList];
                              list[index]._backup = { ...list[index] };
                              list[index].isEdit = true;
                              setSearchOptionsList(list);
                            }}
                          >
                            Edit
                          </button>

                          <button
                            className="bg-red-500 text-white px-2 rounded"
                            onClick={() => deleteRow(item, index)}
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <button
                            className="bg-green-500 text-white px-2 rounded"
                            onClick={() => updateSearchRow(item, index)}
                          >
                            Save
                          </button>

                          <button
                            className="bg-gray-500 text-white px-2 rounded"
                            onClick={() => {
                              const list = [...searchOptionsList];
                              list[index] = {
                                ...list[index]._backup,
                                isEdit: false,
                              };
                              delete list[index]._backup;
                              setSearchOptionsList(list);
                            }}
                          >
                            Cancel
                          </button>
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
                  <label className={RED_LABEL}>JV Date</label>
                  <input
                    type="date"
                    value={jvDate}
                    onChange={(e) => setJvDate(e.target.value)}
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
                  <label className={RED_LABEL}>UTR Date</label>
                  <input
                    type="date"
                    value={utrDate}
                    onChange={(e) => setUtrDate(e.target.value)}
                    className={RED_INPUT}
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
        onSave={(b, total) => {
          setPaFreightBreakdown(b);
          setPaFormData((p) => ({ ...p, freightCharges: total }));
        }}
      />
      <ChargesBreakdownDialog
        open={paProvisionOpen}
        onOpenChange={setPaProvisionOpen}
        title="Detailed Provision Amount Input"
        totalLabel="Total Provision"
        value={paProvisionBreakdown}
        onSave={(b, total) => {
          setPaProvisionBreakdown(b);
          setPaFormData((p) => ({ ...p, provisionAmount: total }));
        }}
      />
    </div>
  );
}