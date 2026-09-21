import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, ChevronDown, Plus, X, Eye, FileText, ExternalLink, Download } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// @ts-ignore
import service, { getLocalDocumentUrl, downloadDocument } from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import { GateDatePicker } from "@/components/ui/date-picker";

function TableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select...",
  readOnly = false,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (val: string) => {
    if (readOnly) return;
    if (selected.includes(val)) {
      onChange(selected.filter((x) => x !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? selected[0]
        : `${selected.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] font-medium outline-none flex items-center justify-between gap-1 text-left",
            readOnly ? "cursor-default text-muted-foreground" : "text-foreground hover:bg-muted/50",
          )}
          title={selected.join(", ")}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="size-3.5 opacity-50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-1 max-h-48 overflow-y-auto bg-surface border border-hairline shadow-md" align="start">
        <div className="space-y-0.5">
          {options.length === 0 ? (
            <div className="p-2 text-center text-[11.5px] text-muted-foreground">
              No options
            </div>
          ) : (
            options.map((o) => (
              <label
                key={o}
                className={cn(
                  "flex items-center gap-2 px-2 py-1 text-[12px] rounded hover:bg-muted/60 select-none",
                  readOnly ? "cursor-default" : "cursor-pointer",
                )}
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

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

// SAP fetched & has value → GREEN, readonly (same pattern as Order Info screen)
const INPUT_SAP_FILLED =
  "h-7 w-full rounded-md bg-emerald-50 border-2 border-emerald-400 px-2 text-[12px] text-emerald-900 font-semibold outline-none cursor-not-allowed";

// SAP fetched but empty → RED, EDITABLE (user must fill)
const INPUT_SAP_EMPTY =
  "h-7 w-full rounded-md bg-red-50 border-2 border-red-400 px-2 text-[12px] text-foreground font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-300";

// Derived by logic (Reported Date → Fiscal Year) → VIOLET, readonly
// (same treatment as the "From Logic" field on the Order Info screen)
const INPUT_FROM_LOGIC =
  "h-7 w-full rounded-md bg-violet-50 border-2 border-violet-400 px-2 text-[12px] text-violet-900 font-semibold outline-none cursor-not-allowed";

const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

/* Reports-style multi-select dropdown (checkboxes + search) for the F4 lists.
   `value` stays the screen's existing single string (comma-joined when more
   than one is ticked), so all existing handlers keep working unchanged. */
function F4MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select",
  className,
  onBlur,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
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
        onBlur?.();
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [onBlur]);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
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

type FieldSpec = {
  label: string;
  key: string;
  value?: string;
  type?: "text" | "select" | "date" | "file";
  options?: string[];
  placeholder?: string;
};

type TableRow = {
  REF_NO: string;
  MAPID: number | string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: number | string;
  selected: boolean;
  lrOptions?: string[];
  compInvoices?: string[];
  notAllowed?: boolean;
};
const EMPTY_ROW = (): TableRow => ({
  REF_NO: "",
  MAPID: "",
  WORK_ORDER_NO: "",
  LR_NO: "",
  TRANSPORTER: "",
  LINE_NO: "",
  selected: false,
  lrOptions: [],
  compInvoices: [],
  notAllowed: false,
});

const SEARCH_FIELD_MAP: Record<string, string> = {
  Reference: "REF_NO",
  Invoice: "INV_NO",
  ODN: "ODN_NO",
  "SO Number": "SO_NO",
  "Work Order": "WORKORDER_NO",
  "LR Number": "LR_NO",
};

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
//   "D:\Pravah\SAP\Insurance_Claim\Supporting_Document\1000_5000_claim.pdf"
//     -> "1000_5000_claim.pdf"
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

const BASE_FIELDS: FieldSpec[] = [

  { label: "Reported Date", key: "REP_DATE", type: "date" },
  { label: "Fiscal Year", key: "FI" },
  { label: "SO Number", key: "SO_NO" },
  { label: "Customer", key: "CUSTOMER" },
  { label: "Location", key: "LOCATION" },
  { label: "Invoice Date", key: "INV_DATE", type: "date" },
  { label: "Invoice Basic Value", key: "INV_BV" },
  { label: "Damage Remarks", key: "DAMAGE_RMK", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"] },
  { label: "Claim Status", key: "CLM_ST", type: "select", options: ["Under preparation", "Submitted", "Not submitted"] },
  { label: "Claim Info Sent", key: "CLM_INF" , type: "date"},
  { label: "Claim Reference", key: "CLAIM_REF" },
  { label: "Loss Declared", key: "LOSS_DCL" },
  { label: "Salvage Value", key: "SOL_VAL" },
  { label: "Claim Document Status", key: "CLM_DOC_ST" },
  { label: "Courier Details", key: "COURIER_DET" },
  { label: "Payment Status", key: "PAY_ST", type: "select", options: ["Pending", "Settled"] },
  { label: "Payment Info", key: "PAY_INFO" },
  { label: "UTR", key: "UTR" },
  { label: "Claim Settlement Date", key: "CLM_SET_DT", type: "date" },
  { label: "Claim Received", key: "CLM_RF", type: "date" },
  { label: "Supporting Document", key: "ZSUPT_DOC", type: "file" },
  { label: "Approve Document", key: "ZAPP_DOC", type: "file" },
];

export function InsuranceClaimTrackingSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const navigate = useNavigate();
  const isWithout = mode === "without";
  const isSap = !isWithout;
  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
      const parsed = JSON.parse(raw || "{}");
      const PLANTS = parsed?.PLANTS || parsed?.PLANT || [];
      const DIV = parsed?.DIV || parsed?.DIVISION || [];
      return { PLANTS, DIV };
    } catch {
      return { PLANTS: [], DIV: [] };
    }
  })();

  const [checked, setChecked] = useState(!isWithout);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [revealed, setRevealed] = useState(false);

  const [headerData, setHeaderData] = useState<any>({});
  const [itemData, setItemData] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<TableRow[]>([]);
  const [compInvoicesModalOpen, setCompInvoicesModalOpen] = useState(false);
  const [compInvoicesModalData, setCompInvoicesModalData] = useState<{
    refNo: string;
    invoices: string[];
  }>({ refNo: "", invoices: [] });

  const openCompletedInvoicesModal = (row: TableRow) => {
    setCompInvoicesModalData({
      refNo: row.REF_NO || "-",
      invoices: row.compInvoices || [],
    });
    setCompInvoicesModalOpen(true);
  };

  const [supportingBase64, setSupportingBase64] = useState("");
  const [supportingPath, setSupportingPath] = useState("");
  const [supportingName, setSupportingName] = useState("");
  const [approveBase64, setApproveBase64] = useState("");
  const [approvePath, setApprovePath] = useState("");
  const [approveName, setApproveName] = useState("");

  // Search table edit files: key ("ZSUPT_DOC" | "ZAPP_DOC") -> File
  const [editSearchInsuranceFiles, setEditSearchInsuranceFiles] = useState<{ [key: string]: File }>({});
  const handleSearchPickInsuranceDoc = (key: string, file: File | null) => {
    setEditSearchInsuranceFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[key] = file;
      } else {
        delete next[key];
      }
      return next;
    });
  };

  // Capture a picked document (Supporting / Approve) as base64 + its file name.
  const handlePickDoc = async (key: string, file: File | null) => {
    if (!file) {
      if (key === "ZSUPT_DOC") { setSupportingBase64(""); setSupportingName(""); }
      if (key === "ZAPP_DOC") { setApproveBase64(""); setApproveName(""); }
      return;
    }
    const b64 = await fileToBase64(file);
    if (key === "ZSUPT_DOC") { setSupportingBase64(b64); setSupportingName(file.name); }
    if (key === "ZAPP_DOC") { setApproveBase64(b64); setApproveName(file.name); }
  };

  const [showForm, setShowForm] = useState(false);
  const showFields = isWithout || revealed;
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * SAP colouring — same pattern as Order Info screen.
   * - sapFilledKeys: header keys that came back NON-EMPTY from SAP → GREEN + readonly
   * - key NOT in set (but sapFetched=true) → SAP returned empty → RED + editable
   * - sapFetched=false (Non-SAP or before GET) → normal styling
   */
  const [sapFetched, setSapFetched] = useState(false);
  const [sapFilledKeys, setSapFilledKeys] = useState<Set<string>>(new Set());

  const fields: FieldSpec[] = isWithout
    ? [{ label: "DC Reference Number", key: "DC_REF_NO", type: "text" }, ...BASE_FIELDS]
    : BASE_FIELDS;

  // Reset everything whenever the mode (With SAP / Without SAP) changes
  useEffect(() => {
    setChecked(!isWithout);
    setSearchType("");
    setSearchValue("");
    setLookupValue("");
    setTableData([EMPTY_ROW()]);
    setRevealed(false);
    setHeaderData({});
    setItemData([]);
    setSelectedItems([]);
    setSupportingBase64("");
    setSupportingPath("");
    setSupportingName("");
    setApproveBase64("");
    setApprovePath("");
    setApproveName("");
    setShowForm(false);
    setInvoiceF4List([]);
    setFullReferenceData([]);
    setIsGlobalSearch(false);
    setSapFetched(false);
    setSapFilledKeys(new Set());
  }, [mode]);

  const handleHeaderChange = (key: string, value: any) => {
    setHeaderData((prev: any) => ({ ...prev, [key]: value }));
  };

  // ── Reported Date → fiscal year ──
  const onReportedDateChange = async (value: string) => {
    if (!value) return;
    try {
      const res: any = await service.OrderInfoPhysicaldispatch({ phys_dispatch: value });
      if (res) {
        setHeaderData((prev: any) => ({ ...prev, FI: res.FISCAL_YEAR || "" }));
      }
    } catch (e) {
      console.error("Fiscal year fetch error:", e);
    }
  };

  // ---------------------------------------------------------------------
  // Reference table (top) — multi-select, drives the F4 invoice list
  // ---------------------------------------------------------------------

  const onCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const rowValue = tableData[index];
    if (rowValue.notAllowed) return;
    const checked = event.target.checked;

    const updatedTable = [...tableData];
    updatedTable[index].selected = checked;
    setTableData(updatedTable);

    let updatedSelectedItems: TableRow[];

    if (checked) {
      const exists = selectedItems.some((item) => item.MAPID === rowValue.MAPID);
      updatedSelectedItems = exists ? selectedItems : [...selectedItems, rowValue];
    } else {
      updatedSelectedItems = selectedItems.filter((item) => item.MAPID !== rowValue.MAPID);
    }

    setSelectedItems(updatedSelectedItems);

    // Recompute F4 list scoped to only the currently-checked reference rows
    const mapIds = new Set(updatedSelectedItems.map((i) => i.MAPID));
    const f4: string[] = [];

    fullReferenceData.forEach((ref: any) => {
      if (mapIds.has(ref.MAPID) && Array.isArray(ref.INV_NO)) {
        ref.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
        });
      }
    });

    setInvoiceF4List(f4);
    setLookupValue("");
  };

  const populateReferenceRows = (data: any[]) => {
    setInvoiceF4List([]);
    setFullReferenceData([]);

    if (data && data.length > 0) {
      setFullReferenceData(data);

      const invoiceList: string[] = [];

      const rows = data.map((d: any) => {
        if (d.INV_NO && Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !invoiceList.includes(inv.VBELN)) {
              invoiceList.push(inv.VBELN);
            }
          });
        }

        let lrOptions: string[] = [];
        if (Array.isArray(d.LR_NO)) {
          lrOptions = d.LR_NO.map((x: any) =>
            typeof x === "object" && x !== null ? x.LR : String(x)
          ).filter(Boolean);
        } else if (typeof d.LR_NO === "string" && d.LR_NO.trim()) {
          lrOptions = [d.LR_NO.trim()];
        }
        lrOptions = Array.from(new Set(lrOptions));

        let compInvoices: string[] = [];
        if (Array.isArray(d.COMP_INV_NO)) {
          compInvoices = d.COMP_INV_NO.map((x: any) =>
            typeof x === "object" && x !== null
              ? x.VBELN || x.INV_NO || x.INVOICE || x.inv_no
              : String(x)
          ).filter(Boolean);
        } else if (typeof d.COMP_INV_NO === "string" && d.COMP_INV_NO.trim()) {
          compInvoices = [d.COMP_INV_NO.trim()];
        }
        compInvoices = Array.from(new Set(compInvoices));

        const isNotAllowed = String(d.ZNOT_ALLOWED || "").trim().toUpperCase() === "X";

        const lineNo =
          d.LINE_NO !== undefined && d.LINE_NO !== null && String(d.LINE_NO).trim() !== ""
            ? String(d.LINE_NO).trim()
            : d.ZLINE_NO !== undefined && d.ZLINE_NO !== null && String(d.ZLINE_NO).trim() !== ""
            ? String(d.ZLINE_NO).trim()
            : d.lineNumber !== undefined && d.lineNumber !== null && String(d.lineNumber).trim() !== ""
            ? String(d.lineNumber).trim()
            : "";

        return {
          MAPID: d.MAPID || "",
          REF_NO: d.REF_NO ? String(d.REF_NO) : "",
          WORK_ORDER_NO: d.WORK_ORDER_NO ? String(d.WORK_ORDER_NO) : "",
          LR_NO: lrOptions.length > 0 ? lrOptions.join(", ") : (typeof d.LR_NO === "string" ? d.LR_NO : ""),
          TRANSPORTER: d.TRANSPORTER ? String(d.TRANSPORTER) : "",
          LINE_NO: lineNo,
          selected: false,
          lrOptions,
          compInvoices,
          notAllowed: isNotAllowed,
        };
      });

      setInvoiceF4List(invoiceList);
      setLookupValue("");
      setTableData(rows);
    } else {
      Swal.fire({
        icon: "info",
        title: "No Records Found",
        text: "No matching reference details were found.",
        timer: 1500,
        showConfirmButton: false,
      });
      setTableData([EMPTY_ROW()]);
    }
  };

  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "INSURANCE CLAIM STATUS",
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
        populateReferenceRows(res);
      } else {
        setTableData([EMPTY_ROW()]);
      }
    } catch (e) {
      console.error("GlobalReference fetch error:", e);
      Swal.fire({ icon: "error", text: "Error fetching reference details." });
    }
  };

  // ---------------------------------------------------------------------
  // GET screen — secondary Line Items table's Map ID dropdown handler
  // ---------------------------------------------------------------------

  const onchangeMAPID = (index: number, selectedMapId: any) => {
    const selectedObj = selectedItems.find((item) => item.MAPID == selectedMapId);
    if (!selectedObj) return;

    const updatedItems = [...itemData];
    updatedItems[index] = {
      ...updatedItems[index],
      ZMAPID: selectedObj.MAPID || "",
      ZREFNO: selectedObj.REF_NO || "",
      REFNO: selectedObj.REF_NO || "",
      WORK_ORDER: selectedObj.WORK_ORDER_NO || "",
      LR_NO: selectedObj.LR_NO || "",
      TRANSPORTER: selectedObj.TRANSPORTER || "",
      ZLINE_NO: selectedObj.LINE_NO || "",
      LINE_NO: selectedObj.LINE_NO || "",
    };
    setItemData(updatedItems);
  };

  const addItemRow = () => {
    const selectedRow = tableData.find((r) => r.selected);
    setItemData((prev: any[]) => [
      ...prev,
      {
        selected: false,
        ZMAPID: selectedRow?.MAPID || "",
        ZREFNO: selectedRow?.REF_NO || "",
        REFNO: selectedRow?.REF_NO || "",
        ZLINE_NO: selectedRow?.LINE_NO || "",
        LINE_NO: selectedRow?.LINE_NO || "",
        INV_NO: lookupValue,
        TRUCK_NO: "",
        LR_NO: "",
        TRANSPORTER: "",
        WORK_ORDER: "",
        BILLNO: "",
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    setItemData((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  // ---------------------------------------------------------------------
  // GET flow — With SAP
  // ---------------------------------------------------------------------

  const fetchInvoiceDetails = async () => {
    // 1. Split multiple invoice numbers entered/selected by comma
    const selectedInvoiceNumbers = lookupValue
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (selectedInvoiceNumbers.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter Invoice Number" });
      return;
    }

    const selectedRows = tableData.filter((row) => row.selected);
    const activeRefs = selectedRows.length > 0 ? selectedRows : tableData.filter((r) => r.REF_NO);

    if (activeRefs.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select at least one reference row" });
      return;
    }

    // 2. Map each selected invoice number to its owner reference row
    const invGetPayload = selectedInvoiceNumbers.map((inv, idx) => {
      const ownerRef = activeRefs.find((refItem: any) => {
        const raw = fullReferenceData.find(
          (f: any) =>
            (refItem.MAPID && String(f.MAPID) === String(refItem.MAPID)) ||
            (refItem.REF_NO && String(f.REF_NO) === String(refItem.REF_NO))
        );
        const invList = raw?.INV_NO;
        if (Array.isArray(invList)) {
          return invList.some((x: any) => {
            const val = typeof x === "object" && x !== null ? (x.VBELN || x.INV_NO || x.INVOICE || x.inv_no) : String(x);
            return val && String(val).trim() === inv;
          });
        }
        return false;
      }) || fullReferenceData.find((refItem: any) => {
        if (Array.isArray(refItem.INV_NO)) {
          return refItem.INV_NO.some((x: any) => {
            const val = typeof x === "object" && x !== null ? (x.VBELN || x.INV_NO || x.INVOICE || x.inv_no) : String(x);
            return val && String(val).trim() === inv;
          });
        }
        return (
          (refItem.INV_NO && String(refItem.INV_NO).trim() === inv) ||
          (refItem.ZINV_NO && String(refItem.ZINV_NO).trim() === inv) ||
          (refItem.VBELN && String(refItem.VBELN).trim() === inv)
        );
      });

      const matchedRef = ownerRef || (activeRefs.length === selectedInvoiceNumbers.length ? activeRefs[idx] : (selectedRows[0] || tableData[0]));

      return {
        INVOICE: inv,
        ZREFNO: matchedRef?.REF_NO || "",
        ZLINE_NO: matchedRef?.LINE_NO || "",
      };
    });

    const payload = {
      INV_GET: invGetPayload,
    };

    try {
      setLoading(true);

      const res: any = await service.InsuranceClaimTrackingfetch(payload);

      setLoading(false);

      if (res?.STATUS === "False") {
        Swal.fire({ icon: "info", text: res.MESSAGE });
        return;
      }

      Swal.fire({ icon: "success", title: "Success", text: "Invoice Details fetched successfully" });

      const primaryRef = selectedRows[0] || tableData[0];
      const header = res?.[0]?.HEADER || {};
      const allItems = Array.isArray(res) ? res.flatMap((r: any) => r?.ITEM || []) : [];
      const items = allItems.length > 0 ? allItems : (res?.[0]?.ITEM || []);

      setHeaderData({
        ...header,
        REFNO: primaryRef?.REF_NO || header.REFNO || "",
        LINE_NO: primaryRef?.LINE_NO || header.LINE_NO || "",
        ZLINE_NO: primaryRef?.LINE_NO || header.ZLINE_NO || "",
        INV_NO: header.INV_NO || lookupValue || "",
        FI: header.FI || "",
        REP_DATE: header.REP_DATE || "",
        CLAIM_REF: header.CLAIM_REF || "",
        INV_DATE: header.INV_DATE || "",
        INV_BV: header.INV_BV || "",
        LOSS_DCL: header.LOSS_DCL || "",
        CLM_RF: header.CLM_RF || "",
        SOL_VAL: header.SOL_VAL || "",
        CUSTOMER: header.CUSTOMER || "",
        ODN_NO: header.ODN_NO || "",
        SO_NO: header.SO_NO || "",
        SALE_PERSON: header.SALE_PERSON || "",
        LOCATION: header.LOCATION || "",
        DAMAGE_RMK: header.DAMAGE_RMK || "",
        CLM_INF: header.CLM_INF || "",
        CLM_ST: header.CLM_ST || "",
        CLM_DOC_ST: header.CLM_DOC_ST || "",
        COURIER_DET: header.COURIER_DET || "",
        PAY_ST: header.PAY_ST || "",
        PAY_INFO: header.PAY_INFO || "",
        UTR: header.UTR || "",
        CLM_SET_DT: header.CLM_SET_DT || "",
      });

      setItemData(
        items.map((x: any) => {
          const matchedPayload = invGetPayload.find(
            (p) => p.INVOICE && (String(p.INVOICE).trim() === String(x.INV_NO || x.VBELN || "").trim())
          );
          const refLineNo = matchedPayload?.ZLINE_NO || primaryRef?.LINE_NO || x.LINE_NO || x.ZLINE_NO || "";
          const refNo = matchedPayload?.ZREFNO || primaryRef?.REF_NO || x.REFNO || x.ZREFNO || "";
          const mapId = x.ZMAPID || x.MAPID || primaryRef?.MAPID || "";

          return {
            ...x,
            selected: false,
            ZMAPID: mapId,
            REFNO: refNo,
            ZREFNO: refNo,
            LINE_NO: refLineNo,
            ZLINE_NO: refLineNo,
            INV_NO: x.INV_NO || lookupValue || "",
            TRUCK_NO: x.TRUCK_NO || "",
            LR_NO: x.LR_NO || "",
            TRANSPORTER: x.TRANSPORTER || "",
            WORK_ORDER: x.WORK_ORDER || "",
            BILLNO: x.BILLNO || "",
          };
        })
      );

      // Track only header keys that have a NON-EMPTY value from SAP (for colouring)
      setSapFilledKeys(
        new Set(
          Object.keys(header).filter((k) => {
            const v = (header as any)[k];
            return v !== null && v !== undefined && String(v).trim() !== "";
          })
        )
      );
      setSapFetched(true);

      setShowForm(true);
      setIsGlobalSearch(false);
    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire({ icon: "error", text: "Error fetching invoice details" });
    }
  };

  const handleSave = async (action: "stay" | "next" | "previous" = "stay") => {
    const selectedRow = tableData.find((r) => r.selected);

    if (!selectedRow) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select one reference row" });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Invoice Number is required" });
      return;
    }

    const refLineNo = selectedRow.LINE_NO || headerData.LINE_NO || headerData.ZLINE_NO || "";

    const header = {
      ...headerData,
      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: refLineNo,
      ZLINE_NO: refLineNo,
      ZSUPT_DOC: supportingBase64,
      ZSUPT_DOC_NAME: supportingName,
      ZSUPT_PATH: supportingPath,
      ZAPP_DOC: approveBase64,
      ZAPP_DOC_NAME: approveName,
      ZAPP_PATH: approvePath,
      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",
    };

    const items = itemData
      .filter((x: any) => x.selected)
      .map((row: any) => {
        const matchedRefRow =
          tableData.find((t) => t.selected && row.ZMAPID && String(t.MAPID) === String(row.ZMAPID)) ||
          tableData.find((t) => t.selected && (row.REFNO || row.ZREFNO) && String(t.REF_NO) === String(row.REFNO || row.ZREFNO)) ||
          selectedRow;

        const itemLineNo =
          matchedRefRow?.LINE_NO ||
          row.LINE_NO ||
          row.ZLINE_NO ||
          refLineNo;

        return {
          ...row,
          INV_NO: lookupValue,
          REFNO: matchedRefRow?.REF_NO || selectedRow.REF_NO,
          LINE_NO: itemLineNo,
          ZLINE_NO: itemLineNo,
        };
      });

    if (items.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select at least one item" });
      return;
    }

    const payload = { HEADER: header, ITEM: items };

    try {
      setLoading(true);
      const res: any = await service.InsuranceClaimTrackingSave(payload);
      setLoading(false);

      if (res?.STATUS === "TRUE") {
        Swal.fire({ icon: "success", text: res.MESSAGE || "Saved Successfully" });

        if (action === "previous") {
          navigate({ to: "/transit-damage-info" });
        } else {
          resetAll();
        }
      } else {
        Swal.fire({ icon: "warning", title: "Save Failed", text: res?.MESSAGE || "" });
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire({ icon: "error", text: "Save Failed" });
    }
  };

  // ---------------------------------------------------------------------
  // GET flow — Without SAP
  // ---------------------------------------------------------------------

  const fetchInvoiceDetailsNonSap = async (valueOverride?: string) => {
    const dcRef = (valueOverride ?? lookupValue).trim();

    // 1. Split multiple invoice / DC Reference numbers
    const selectedInvoiceNumbers = dcRef
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (selectedInvoiceNumbers.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter DC Reference Number" });
      return;
    }

    const selectedRows = tableData.filter((row) => row.selected);
    const activeRefs = selectedRows.length > 0 ? selectedRows : tableData.filter((r) => r.REF_NO);

    if (activeRefs.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select at least one reference row" });
      return;
    }

    // 2. Map each selected invoice/DC to its owner reference row
    const invGetPayload = selectedInvoiceNumbers.map((inv, idx) => {
      const ownerRef = activeRefs.find((refItem: any) => {
        const raw = fullReferenceData.find(
          (f: any) =>
            (refItem.MAPID && String(f.MAPID) === String(refItem.MAPID)) ||
            (refItem.REF_NO && String(f.REF_NO) === String(refItem.REF_NO))
        );
        const invList = raw?.INV_NO;
        if (Array.isArray(invList)) {
          return invList.some((x: any) => {
            const val = typeof x === "object" && x !== null ? (x.VBELN || x.INV_NO || x.INVOICE || x.inv_no) : String(x);
            return val && String(val).trim() === inv;
          });
        }
        return false;
      }) || fullReferenceData.find((refItem: any) => {
        if (Array.isArray(refItem.INV_NO)) {
          return refItem.INV_NO.some((x: any) => {
            const val = typeof x === "object" && x !== null ? (x.VBELN || x.INV_NO || x.INVOICE || x.inv_no) : String(x);
            return val && String(val).trim() === inv;
          });
        }
        return (
          (refItem.INV_NO && String(refItem.INV_NO).trim() === inv) ||
          (refItem.ZINV_NO && String(refItem.ZINV_NO).trim() === inv) ||
          (refItem.VBELN && String(refItem.VBELN).trim() === inv)
        );
      });

      const matchedRef = ownerRef || (activeRefs.length === selectedInvoiceNumbers.length ? activeRefs[idx] : (selectedRows[0] || tableData[0]));

      return {
        INVOICE: inv,
        ZREFNO: matchedRef?.REF_NO || "",
        ZLINE_NO: matchedRef?.LINE_NO || "",
      };
    });

    const payload = {
      INV_GET: invGetPayload,
    };

    try {
      setLoading(true);
      const res: any = await service.fetchinvoicelistnonsap(payload);
      setLoading(false);

      if (!res || res.STATUS === "False") {
        Swal.fire({ icon: "info", title: "Info", text: res?.MESSAGE || "No Data Found" });
        return;
      }

      const primaryRef = selectedRows[0] || tableData[0];
      const header = res?.[0]?.HEADER || {};
      const allItems = Array.isArray(res) ? res.flatMap((r: any) => r?.ITEM || []) : [];
      const items = allItems.length > 0 ? allItems : (res?.[0]?.ITEM || []);

      setHeaderData({
        ...header,
        INV_NO: header.INV_NO || dcRef,
        REFNO: primaryRef?.REF_NO || header.REFNO || "",
        LINE_NO: primaryRef?.LINE_NO || header.LINE_NO || "",
        ZLINE_NO: primaryRef?.LINE_NO || header.ZLINE_NO || "",
      });

      setItemData(
        items.map((item: any) => {
          const matchedPayload = invGetPayload.find(
            (p) => p.INVOICE && (String(p.INVOICE).trim() === String(item.INV_NO || item.VBELN || "").trim())
          );
          const refLineNo = matchedPayload?.ZLINE_NO || primaryRef?.LINE_NO || item.LINE_NO || item.ZLINE_NO || "";
          const refNo = matchedPayload?.ZREFNO || primaryRef?.REF_NO || item.REFNO || item.ZREFNO || "";
          const mapId = item.ZMAPID || item.MAPID || primaryRef?.MAPID || "";

          return {
            ...item,
            selected: false,
            ZMAPID: mapId,
            REFNO: refNo,
            ZREFNO: refNo,
            LINE_NO: refLineNo,
            ZLINE_NO: refLineNo,
            TRUCK_NO: item.TRUCK_NO ?? "",
            LR_NO: item.LR_NO ?? "",
            TRANSPORTER: item.TRANSPORTER ?? "",
            WORK_ORDER: item.WORK_ORDER ?? "",
            BILLNO: item.BILLNO ?? "",
            INV_NO: item.INV_NO || dcRef,
          };
        })
      );

      setShowForm(true);
      setIsGlobalSearch(false);

      Swal.fire({ icon: "success", title: "Success", text: "Invoice Details fetched successfully.", timer: 1200, showConfirmButton: false });
    } catch (error) {
      setLoading(false);
      console.error("Non-SAP Fetch Error:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch Invoice Details." });
    }
  };

  const handleSaveNonSap = async (action: "stay" | "next" | "previous" = "stay") => {
    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select one reference row" });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter DC Reference Number" });
      return;
    }

    const refLineNo = selectedRow.LINE_NO || headerData.LINE_NO || headerData.ZLINE_NO || "";

    const header = {
      ...headerData,
      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: refLineNo,
      ZLINE_NO: refLineNo,
      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",
      ZSUPT_DOC: supportingBase64 || "",
      ZSUPT_DOC_NAME: supportingName || "",
      ZSUPT_PATH: supportingPath || "",
      ZAPP_DOC: approveBase64 || "",
      ZAPP_DOC_NAME: approveName || "",
      ZAPP_PATH: approvePath || "",
    };

    const items = itemData
      .filter((item: any) => item.selected)
      .map((item: any) => {
        const matchedRefRow =
          tableData.find((t) => t.selected && item.ZMAPID && String(t.MAPID) === String(item.ZMAPID)) ||
          tableData.find((t) => t.selected && (item.REFNO || item.ZREFNO) && String(t.REF_NO) === String(item.REFNO || item.ZREFNO)) ||
          selectedRow;

        const itemLineNo =
          matchedRefRow?.LINE_NO ||
          item.LINE_NO ||
          item.ZLINE_NO ||
          refLineNo;

        return {
          ...item,
          INV_NO: lookupValue,
          REFNO: matchedRefRow?.REF_NO || selectedRow.REF_NO,
          ZUSER: getLoggedInUser(),
          ZUSER_CH: "",
          LINE_NO: itemLineNo,
          ZLINE_NO: itemLineNo,
        };
      });

    if (items.length === 0) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select at least one item" });
      return;
    }

    const payload = { HEADER: header, ITEM: items };

    try {
      setLoading(true);
      const res: any = await service.Nonsapsave(payload);
      setLoading(false);

      if (res?.STATUS === true || res?.STATUS === "TRUE") {
        Swal.fire({ icon: "success", title: "Success", text: "Data Saved Successfully" });
        if (action === "previous") {
          navigate({ to: "/transit-damage-info" });
        } else {
          resetAll();
        }
      } else {
        Swal.fire({ icon: "warning", title: "Save Failed", text: res?.MESSAGE || "" });
      }
    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Save Failed" });
    }
  };

  const resetAll = () => {
    setSearchType("");
    setSearchValue("");
    setLookupValue("");
    setTableData([EMPTY_ROW()]);
    setRevealed(false);
    setHeaderData({});
    setItemData([]);
    setSelectedItems([]);
    setSupportingBase64("");
    setSupportingPath("");
    setSupportingName("");
    setApproveBase64("");
    setApprovePath("");
    setApproveName("");
    setShowForm(false);
    setInvoiceF4List([]);
    setFullReferenceData([]);
    setIsGlobalSearch(false);
    setSapFetched(false);
    setSapFilledKeys(new Set());
  };

  // ---------------------------------------------------------------------
  // Global Search flow
  // ---------------------------------------------------------------------

  const onSearchReference = async () => {
    setHeaderData({});
    setItemData([]);
    setShowForm(false);
    setRevealed(false);
    setIsGlobalSearch(true);

    if (!searchValue.trim()) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter a value" });
      return;
    }

    if (!searchType) {
      Swal.fire({ icon: "info", title: "Info", text: "Please select a search type" });
      return;
    }

    const payload: any = {
      global: "INSURANCE CLAIM STATUS",
      ZUSER: getLoggedInUser(),
      data: {
        REF_NO: "", INV_NO: "", SO_NO: "", TRANSPORTER: "", LR_NO: "",
        WORKORDER_NO: "", SALES_PERSON: "", LOCATION: "", ODN_NO: "",
        VEHICLE_NO: "", FREIGHT_BILLNO: "", PRODUCT: "", ROUTE: "",
        NATURE_DAMAGE: "", CLAIM_STATUS: "",
      },
    };

    const apiField = SEARCH_FIELD_MAP[searchType];
    if (apiField) payload.data[apiField] = searchValue.trim();

    try {
      setLoading(true);

      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      setLoading(false);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        Swal.fire({ icon: "warning", text: res.MESSAGE });
        return;
      }

      if (!res?.HEADER || res.HEADER.length === 0) {
        Swal.fire({ icon: "info", text: "No records found" });
        return;
      }

      const header = res.HEADER[0];
      const items = (res.ITEMS || []).map((item: any) => ({ ...item, selected: false }));

      const dmg = (
        header.ZDAMAGE_RMK ||
        header.DAMAGE_RMK ||
        header.ZNATURE_DAMAGE ||
        header.NATURE_DAMAGE ||
        header.ZDAMAGE ||
        header.DAMAGE ||
        ""
      );

      const normalizedHeader = {
        ...header,
        ZDAMAGE_RMK: header.ZDAMAGE_RMK || dmg,
        DAMAGE_RMK: header.DAMAGE_RMK || dmg,
      };

      setHeaderData(normalizedHeader);
      setItemData(items);
      setShowForm(true);
      setRevealed(true);

      Swal.fire({ icon: "success", text: "Data fetched successfully!", timer: 1200, showConfirmButton: false });
    } catch (err) {
      setLoading(false);
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Error fetching data" });
    }
  };

  const editHeaderRow = () => {
    setEditSearchInsuranceFiles({});
    setHeaderData((prev: any) => {
      const dmg = (
        prev.ZDAMAGE_RMK ||
        prev.DAMAGE_RMK ||
        prev.ZNATURE_DAMAGE ||
        prev.NATURE_DAMAGE ||
        prev.ZDAMAGE ||
        prev.DAMAGE ||
        ""
      );
      return {
        ...prev,
        ZDAMAGE_RMK: prev.ZDAMAGE_RMK || dmg,
        DAMAGE_RMK: prev.DAMAGE_RMK || dmg,
        _backup: { ...prev },
        isEdit: true,
      };
    });
  };

  const cancelHeaderEdit = () => {
    setEditSearchInsuranceFiles({});
    setHeaderData((prev: any) => {
      if (!prev._backup) return prev;
      return { ...prev._backup, isEdit: false };
    });
  };

  const editItemRow = (index: number) => {
    const rows = [...itemData];
    rows[index] = { ...rows[index], _backup: { ...rows[index] }, isEdit: true };
    setItemData(rows);
  };

  const cancelItemEdit = (index: number) => {
    const rows = [...itemData];
    if (rows[index]._backup) {
      rows[index] = { ...rows[index]._backup, isEdit: false };
    }
    setItemData(rows);
  };

  const updateSearchRow = async () => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
    });

    if (!result.isConfirmed) return;

    // Strip UI-only fields (_backup, isEdit) before sending to backend
    const { _backup, isEdit, ...cleanHeader } = headerData;

    const suptB64 = editSearchInsuranceFiles.ZSUPT_DOC ? await fileToBase64(editSearchInsuranceFiles.ZSUPT_DOC) : "";
    const appB64 = editSearchInsuranceFiles.ZAPP_DOC ? await fileToBase64(editSearchInsuranceFiles.ZAPP_DOC) : "";

    const payload = {
      ZSUPT_DOC: suptB64,
      ZSUPT_DOC_NAME: editSearchInsuranceFiles.ZSUPT_DOC?.name || "",
      ZSUPT_PATH: cleanHeader.ZSUPT_PATH || "",

      ZAPP_DOC: appB64,
      ZAPP_DOC_NAME: editSearchInsuranceFiles.ZAPP_DOC?.name || "",
      ZAPP_PATH: cleanHeader.ZAPP_PATH || "",

      HEAD: { ...cleanHeader, ZUSER_CH: getLoggedInUser() },
      ITEM: itemData.map((item: any) => {
        const { _backup: ib, isEdit: ie, ...cleanItem } = item;
        return { ...cleanItem, ZUSER_CH: getLoggedInUser() };
      }),
    };

    try {
      const res: any = isSap
        ? await service.InsuranceClaimTrackingChangeWithSap(payload)
        : await service.InsuranceClaimTrackingChangeWithoutSap(payload);

      if (res.STATUS === "TRUE" || res.NUMBER === "200") {
        Swal.fire("Success", res.MESSAGE || "Updated Successfully", "success");

        setEditSearchInsuranceFiles({});

        setHeaderData((prev: any) => ({ ...prev, isEdit: false }));
        setItemData((prev: any[]) => prev.map((x) => ({ ...x, isEdit: false })));

        onSearchReference();
      } else {
        Swal.fire("Error", res.MESSAGE || "Update Failed", "error");
      }
    } catch {
      Swal.fire("Error", "Internal Server Error", "error");
    }
  };

  const deleteRow = async (row: any) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
    });

    if (!result.isConfirmed) return;

    const payload = {
      DELETE: [{ ZREFNO: row.ZREFNO, ZINV_NO: row.ZINV_NO, ZLINE_NO: row.ZLINE_NO || "" }],
    };

    try {
      const res: any = isSap
        ? await service.InsuranceClaimTrackingDeleteWithSap(payload)
        : await service.InsuranceClaimTrackingDeleteWithoutSap(payload);

      if (res.STATUS === "TRUE" || res.NUMBER === "200") {
        Swal.fire("Deleted", "Record deleted successfully", "success");

        setItemData((prev) =>
          prev.filter(
            (x) => !(x.ZREFNO === row.ZREFNO && x.ZINV_NO === row.ZINV_NO && x.ZLINE_NO === row.ZLINE_NO)
          )
        );

        if (headerData.ZREFNO === row.ZREFNO && headerData.ZINV_NO === row.ZINV_NO) {
          setHeaderData({});
          setShowForm(false);
        }
      } else {
        Swal.fire("Failed", res.MESSAGE || "Delete failed", "error");
      }
    } catch {
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  return (
    <div className="space-y-2">
      {/* Reference table */}
      <div className="rounded-xl overflow-x-auto border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-0.5 text-center">Map ID</th>
              <th className="px-3 py-0.5 text-center">Reference Number</th>
              <th className="px-3 py-0.5 text-center whitespace-nowrap">Work Order Number</th>
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
                  className={cn(
                    "hover:bg-accent/[0.04]",
                    isRowDisabled && "bg-slate-100/90 dark:bg-zinc-800/80 text-muted-foreground"
                  )}
                >
                  <td className="px-3 py-0.5 text-center">
                    <input
                      type="checkbox"
                      checked={!isRowDisabled && row.selected}
                      disabled={isRowDisabled}
                      onChange={(e) => onCheckboxChange(e, index)}
                      className={cn("size-4 accent-sky-600", isRowDisabled && "cursor-not-allowed opacity-50")}
                    />
                  </td>

                  <td className="px-3 py-0.5 text-center">{index + 1}</td>

                  {/* MAP ID */}
                  <td className="px-3 py-0.5">
                    <input
                      value={row.MAPID}
                      readOnly={isRowDisabled}
                      onChange={(e) => {
                        const data = [...tableData];
                        data[index].MAPID = e.target.value;
                        setTableData(data);
                      }}
                      onBlur={() => fetchGlobalReferences(row, index, "MAPID")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "MAPID");
                      }}
                      placeholder="Enter Map ID"
                      className={cn(GREEN_INPUT, "text-center", isRowDisabled && "cursor-not-allowed opacity-60")}
                    />
                  </td>

                  {/* Reference Number */}
                  <td className="px-3 py-0.5">
                    <input
                      value={row.REF_NO}
                      readOnly={isRowDisabled}
                      onChange={(e) => {
                        const data = [...tableData];
                        data[index].REF_NO = e.target.value;
                        setTableData(data);
                      }}
                      onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "REF_NO");
                      }}
                      placeholder="Enter Ref. No."
                      className={cn(GREEN_INPUT, "text-center", isRowDisabled && "cursor-not-allowed opacity-60")}
                    />
                  </td>

                  {/* Work Order */}
                  <td className="px-3 py-0.5 whitespace-nowrap">
                    <input
                      value={row.WORK_ORDER_NO}
                      readOnly={isRowDisabled}
                      onChange={(e) => {
                        const data = [...tableData];
                        data[index].WORK_ORDER_NO = e.target.value;
                        setTableData(data);
                      }}
                      onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "WORK_ORDER_NO");
                      }}
                      placeholder="Enter Work Order No."
                      className={cn(GREEN_INPUT, "text-center", isRowDisabled && "cursor-not-allowed opacity-60")}
                    />
                  </td>

                  {/* LR Number */}
                  <td className="px-3 py-0.5">
                    {row.lrOptions && row.lrOptions.length > 0 ? (
                      <TableMultiSelect
                        options={row.lrOptions}
                        selected={row.LR_NO ? row.LR_NO.split(", ").filter(Boolean) : []}
                        readOnly={isRowDisabled}
                        onChange={(selected) => {
                          const data = [...tableData];
                          data[index].LR_NO = selected.join(", ");
                          setTableData(data);
                        }}
                        placeholder="Select LR No"
                      />
                    ) : (
                      <input
                        value={row.LR_NO}
                        readOnly={isRowDisabled}
                        onChange={(e) => {
                          const data = [...tableData];
                          data[index].LR_NO = e.target.value;
                          setTableData(data);
                        }}
                        onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") fetchGlobalReferences(row, index, "LR_NO");
                        }}
                        placeholder="Enter LR No."
                        className={cn(GREEN_INPUT, "text-center", isRowDisabled && "cursor-not-allowed opacity-60")}
                      />
                    )}
                  </td>

                  {/* Transporter */}
                  <td className="px-3 py-0.5">
                    <input
                      value={row.TRANSPORTER}
                      readOnly={isRowDisabled}
                      onChange={(e) => {
                        const data = [...tableData];
                        data[index].TRANSPORTER = e.target.value;
                        setTableData(data);
                      }}
                      onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") fetchGlobalReferences(row, index, "TRANSPORTER");
                      }}
                      placeholder="Enter Transporter"
                      className={cn(GREEN_INPUT, "text-center", isRowDisabled && "cursor-not-allowed opacity-60")}
                    />
                  </td>

                  {/* Completed Invoices */}
                  <td className="px-3 py-0.5 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openCompletedInvoicesModal(row)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 transition-colors shadow-xs"
                      title="View Completed Invoices"
                    >
                      <Eye className="size-3" />
                      <span>View</span>
                      {row.compInvoices && row.compInvoices.length > 0 && (
                        <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-sky-200/70 text-sky-800 dark:bg-sky-800 dark:text-sky-100 font-bold">
                          {row.compInvoices.length}
                        </span>
                      )}
                    </button>
                  </td>

                  <td className="px-3 py-0.5 text-center">
                    <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
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
          <div className="flex items-end gap-2 max-w-md">
            <div className="flex-1 min-w-[220px]">
              <label className={LABEL}>
                {isWithout ? "DC Reference Number" : "Invoice Number"}
              </label>

              <F4MultiSelect
                options={invoiceF4List}
                value={lookupValue}
                onChange={(value) => {
                  setLookupValue(value);
                  if (isWithout && value.trim()) {
                    fetchInvoiceDetailsNonSap(value);
                    setRevealed(true);
                  }
                }}
                placeholder={isWithout ? "Select DC Reference" : "Select Invoice"}
                className={GREEN_INPUT}
              />
            </div>

            {!isWithout && (
              <button
                onClick={() => {
                  fetchInvoiceDetails();
                  setRevealed(true);
                }}
                disabled={!lookupValue.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            )}
          </div>

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
              onKeyDown={(e) => {
                if (e.key === "Enter") onSearchReference();
              }}
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

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {/* ── Colour legend (only shown after SAP GET) ── */}
      {isSap && sapFetched && !isGlobalSearch && (
        <div className="flex items-center gap-4 px-1 py-1">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm border-2 border-emerald-400 bg-emerald-50" />
            <span className="text-[11px] text-muted-foreground">Fetched from SAP (readonly)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm border-2 border-red-400 bg-red-50" />
            <span className="text-[11px] text-muted-foreground">Not provided by SAP (fill manually)</span>
          </div>
        </div>
      )}

      {showFields && (
        <>
          {/* ================= GLOBAL SEARCH ================= */}

          {showForm && isGlobalSearch && Object.keys(headerData).length > 0 && (
            <div className="max-h-[500px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant">
              <div className="p-2 font-semibold">Header Details</div>

              {(() => {
                const HEADER_SEARCH_COLS = [
                  { label: "Ref No", field: "REFNO", alt: "ZREFNO", type: "text", readonly: true, width: "min-w-[120px]" },
                  { label: "Line No", field: "LINE_NO", alt: "ZLINE_NO", type: "text", readonly: true, width: "min-w-[80px]" },
                  { label: "Invoice No", field: "INV_NO", alt: "ZINV_NO", type: "text", readonly: true, width: "min-w-[120px]" },
                  { label: "ODN No", field: "ODN_NO", alt: "ZODN_NO", type: "text", width: "min-w-[150px]" },
                  { label: "SO No", field: "SO_NO", alt: "ZSO_NO", type: "text", width: "min-w-[130px]" },
                  { label: "Fiscal Year", field: "FI", alt: "ZFI", type: "text", width: "min-w-[120px]" },
                  { label: "Reported Date", field: "REP_DATE", alt: "ZREP_DATE", type: "date", width: "min-w-[150px]" },
                  { label: "Claim Ref", field: "CLAIM_REF", alt: "ZCLAIM_REF", type: "text", width: "min-w-[150px]" },
                  { label: "Invoice Date", field: "INV_DATE", alt: "ZINV_DATE", type: "date", readonly: true, width: "min-w-[120px]" },
                  { label: "Base Value", field: "INV_BV", alt: "ZINV_BV", type: "number", width: "min-w-[130px]" },
                  { label: "Loss Declared", field: "LOSS_DCL", alt: "ZLOSS_DCL", type: "text", width: "min-w-[150px]" },
                  { label: "Customer", field: "CUSTOMER", alt: "ZCUSTOMER", type: "text", width: "min-w-[160px]" },
                  { label: "Location", field: "LOCATION", alt: "ZLOCATION", type: "text", width: "min-w-[150px]" },
                  { label: "Damage", field: "DAMAGE_RMK", alt: "ZDAMAGE_RMK", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"], width: "min-w-[150px]" },
                  { label: "Claim Status", field: "CLM_ST", alt: "ZCLM_ST", type: "select", options: ["Under preparation", "Submitted", "Not submitted"], width: "min-w-[180px]" },
                  { label: "Payment Status", field: "PAY_ST", alt: "ZPAY_ST", type: "select", options: ["Pending", "Settled"], width: "min-w-[150px]" },
                  { label: "Plant", field: "PLANT", alt: "ZPLANT", type: "plant", width: "min-w-[180px]" },
                  { label: "Division", field: "DIVISION", alt: "ZDIVISION", type: "division", width: "min-w-[180px]" },
                ];

                return (
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                        {HEADER_SEARCH_COLS.map((c) => (
                          <th key={c.field} className={cn("px-3 py-2.5 whitespace-nowrap text-left", c.width)}>
                            {c.label}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 whitespace-nowrap text-left min-w-[160px]">Supporting Document</th>
                        <th className="px-3 py-2.5 whitespace-nowrap text-left min-w-[160px]">Approve Document</th>
                        <th className="px-3 py-2.5 whitespace-nowrap text-center min-w-[90px]">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-hairline/70">
                      <tr className="bg-surface hover:bg-muted/50">
                        {HEADER_SEARCH_COLS.map(({ field, alt, type, options, readonly, width }: any) => {
                          const isDamageField = field === "DAMAGE_RMK";
                          const key = headerData[alt] !== undefined ? alt : field;
                          const rawVal = isDamageField
                            ? (headerData.ZDAMAGE_RMK || headerData.DAMAGE_RMK || headerData.ZNATURE_DAMAGE || headerData.NATURE_DAMAGE || headerData.ZDAMAGE || headerData.DAMAGE || "")
                            : headerData[key];
                          const trimmedVal = typeof rawVal === "string" ? rawVal.trim() : (rawVal ?? "");

                          return (
                            <td key={field} className={cn("px-3 py-2 whitespace-nowrap text-left", width)}>
                              {headerData.isEdit && !readonly ? (
                                type === "select" ? (() => {
                                  const damageOptionsList = [
                                    "Wet", "Crushed", "Broken", "Leak",
                                    "Packing material damage", "Pallet damage", "Cells damage",
                                    "Cell Bank damage", "Can damage", "Accident",
                                    "Prohibited material loading and seized by Police",
                                    "Damage during unloading", "Material in wet condition",
                                    "Damage due to other materials loaded",
                                  ];
                                  const baseOpts = isDamageField ? damageOptionsList : (options || []);
                                  const selectOptions = Array.from(new Set([...baseOpts, trimmedVal].filter(Boolean)));
                                  const matchedOpt = selectOptions.find(
                                    (o) => String(o).toLowerCase() === String(trimmedVal).toLowerCase()
                                  );
                                  const curVal = matchedOpt || trimmedVal || "";

                                  return (
                                    <select
                                      className={cn(GREEN_INPUT, width)}
                                      value={curVal}
                                      onChange={(e) => {
                                        const newVal = e.target.value;
                                        setHeaderData((prev: any) => ({
                                          ...prev,
                                          [key]: newVal,
                                          ...(isDamageField ? { ZDAMAGE_RMK: newVal, DAMAGE_RMK: newVal } : {}),
                                        }));
                                      }}
                                    >
                                      <option value="">Select</option>
                                      {selectOptions.map((o: string) => (
                                        <option key={o} value={o}>{o}</option>
                                      ))}
                                    </select>
                                  );
                                })() : type === "plant" ? (
                                  <select
                                    className={cn(GREEN_INPUT, width)}
                                    value={trimmedVal || ""}
                                    onChange={(e) =>
                                      setHeaderData((prev: any) => ({ ...prev, [key]: e.target.value }))
                                    }
                                  >
                                    <option value="">Select Plant</option>
                                    {Array.from(new Set([...(currentUser.PLANTS || []).map((p: any) => typeof p === "string" ? p : p?.PLANT || p?.PLANT_NAME || String(p)), trimmedVal].filter(Boolean))).map((p) => (
                                      <option key={p} value={p}>{p}</option>
                                    ))}
                                  </select>
                                ) : type === "division" ? (
                                  <select
                                    className={cn(GREEN_INPUT, width)}
                                    value={trimmedVal || ""}
                                    onChange={(e) =>
                                      setHeaderData((prev: any) => ({ ...prev, [key]: e.target.value }))
                                    }
                                  >
                                    <option value="">Select Division</option>
                                    {Array.from(new Set([...(currentUser.DIV || []).map((d: any) => typeof d === "string" ? d : d?.DIVISION || d?.DIV || String(d)), trimmedVal].filter(Boolean))).map((d) => (
                                      <option key={d} value={d}>{d}</option>
                                    ))}
                                  </select>
                                ) : type === "textarea" ? (
                                  <textarea
                                    className={cn(GREEN_INPUT, "h-16", width)}
                                    value={trimmedVal || ""}
                                    onChange={(e) =>
                                      setHeaderData((prev: any) => ({ ...prev, [key]: e.target.value }))
                                    }
                                  />
                                ) : (
                                  <input
                                    type={type}
                                    className={cn(GREEN_INPUT, width)}
                                    value={trimmedVal || ""}
                                    onChange={(e) =>
                                      setHeaderData((prev: any) => ({ ...prev, [key]: e.target.value }))
                                    }
                                  />
                                )
                              ) : (
                                <span>
                                  {type === "date" && trimmedVal
                                    ? new Date(trimmedVal).toLocaleDateString("en-GB")
                                    : trimmedVal || "-"}
                                </span>
                              )}
                            </td>
                          );
                        })}

                        {/* Uploaded file name per document type:
                            allow picking new file on edit row */}
                        <td className="px-3 py-2 whitespace-nowrap text-left min-w-[160px]">
                          {headerData.isEdit ? (
                            <div className="flex flex-col items-start gap-1">
                              {editSearchInsuranceFiles.ZSUPT_DOC?.name ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const file = editSearchInsuranceFiles.ZSUPT_DOC;
                                    const url = file ? URL.createObjectURL(file) : "";
                                    setPreviewDoc({ url, title: file?.name || "Supporting Document" });
                                  }}
                                  className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                  title={editSearchInsuranceFiles.ZSUPT_DOC?.name}
                                >
                                  {editSearchInsuranceFiles.ZSUPT_DOC?.name}
                                </button>
                              ) : (
                                (() => {
                                  const existingName =
                                    headerData.ZLOCALFILES?.Supporting_Document ||
                                    fileNameFromPath(headerData.ZSUPT_PATH) ||
                                    "-";
                                  if (existingName && existingName !== "-") {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const url = getLocalDocumentUrl({
                                            mode: isWithout ? "Without Sap" : "SAP",
                                            screen: "Insurance_Claim",
                                            field: "Supporting_Document",
                                            fileName: existingName,
                                            storedPath: headerData.ZSUPT_PATH,
                                            row: headerData,
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
                                <span>{editSearchInsuranceFiles.ZSUPT_DOC ? "Change" : "Browse"}</span>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => handleSearchPickInsuranceDoc("ZSUPT_DOC", e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            (() => {
                              const suptName =
                                headerData.ZLOCALFILES?.Supporting_Document ||
                                fileNameFromPath(headerData.ZSUPT_PATH);
                              if (!suptName || suptName === "-" || suptName === "NA") {
                                return <span className="text-muted-foreground">-</span>;
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = getLocalDocumentUrl({
                                      mode: isWithout ? "Without Sap" : "SAP",
                                      screen: "Insurance_Claim",
                                      field: "Supporting_Document",
                                      fileName: suptName,
                                      storedPath: headerData.ZSUPT_PATH,
                                      row: headerData,
                                    });
                                    setPreviewDoc({ url, title: suptName });
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                                  title={`View ${suptName}`}
                                >
                                  <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">{suptName}</span>
                                </button>
                              );
                            })()
                          )}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-left min-w-[160px]">
                          {headerData.isEdit ? (
                            <div className="flex flex-col items-start gap-1">
                              {editSearchInsuranceFiles.ZAPP_DOC?.name ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const file = editSearchInsuranceFiles.ZAPP_DOC;
                                    const url = file ? URL.createObjectURL(file) : "";
                                    setPreviewDoc({ url, title: file?.name || "Approve Document" });
                                  }}
                                  className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                  title={editSearchInsuranceFiles.ZAPP_DOC?.name}
                                >
                                  {editSearchInsuranceFiles.ZAPP_DOC?.name}
                                </button>
                              ) : (
                                (() => {
                                  const existingName =
                                    headerData.ZLOCALFILES?.Approve_Document ||
                                    fileNameFromPath(headerData.ZAPP_PATH) ||
                                    "-";
                                  if (existingName && existingName !== "-") {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const url = getLocalDocumentUrl({
                                            mode: isWithout ? "Without Sap" : "SAP",
                                            screen: "Insurance_Claim",
                                            field: "Approve_Document",
                                            fileName: existingName,
                                            storedPath: headerData.ZAPP_PATH,
                                            row: headerData,
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
                                <span>{editSearchInsuranceFiles.ZAPP_DOC ? "Change" : "Browse"}</span>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => handleSearchPickInsuranceDoc("ZAPP_DOC", e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : (
                            (() => {
                              const appName =
                                headerData.ZLOCALFILES?.Approve_Document ||
                                fileNameFromPath(headerData.ZAPP_PATH);
                              if (!appName || appName === "-" || appName === "NA") {
                                return <span className="text-muted-foreground">-</span>;
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = getLocalDocumentUrl({
                                      mode: isWithout ? "Without Sap" : "SAP",
                                      screen: "Insurance_Claim",
                                      field: "Approve_Document",
                                      fileName: appName,
                                      storedPath: headerData.ZAPP_PATH,
                                      row: headerData,
                                    });
                                    setPreviewDoc({ url, title: appName });
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                                  title={`View ${appName}`}
                                >
                                  <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">{appName}</span>
                                </button>
                              );
                            })()
                          )}
                        </td>

                        <td className="px-2 py-2 text-center min-w-[90px]">
                          {!headerData.isEdit ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={editHeaderRow}
                                className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => deleteRow(headerData)}
                                className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 justify-center">
                              <button
                                onClick={updateSearchRow}
                                className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>

                              <button
                                onClick={cancelHeaderEdit}
                                className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                              >
                                <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                );
              })()}
            </div>
          )}

          {showForm && isGlobalSearch && itemData.length > 0 && (
            <div className="max-h-[400px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant mt-3">
              <div className="p-2 font-semibold">Line Items</div>

              {(() => {
                const ITEM_SEARCH_COLS = [
                  { label: "Map ID", field: "ZMAPID", type: "text", readonly: true, width: "min-w-[110px]" },
                  { label: "Ref No", field: "ZREFNO", type: "text", readonly: true, width: "min-w-[110px]" },
                  { label: "Line No", field: "ZLINE_NO", type: "text", readonly: true, width: "min-w-[80px]" },
                  { label: "Invoice No", field: "ZINV_NO", type: "text", readonly: true, width: "min-w-[120px]" },
                  { label: "Vehicle No", field: "ZTRUCK_NO", type: "text", width: "min-w-[150px]" },
                  { label: "Bill No", field: "ZBILLNO", type: "text", width: "min-w-[130px]" },
                  { label: "Work Order", field: "ZWORK_ORDER", type: "text", readonly: true, width: "min-w-[120px]" },
                  { label: "LR No", field: "ZLRNO", type: "text", readonly: true, width: "min-w-[110px]" },
                  { label: "Transporter", field: "ZTRANSPORTER", type: "text", readonly: true, width: "min-w-[180px]" },
                ];

                return (
                  <table className="w-full text-left border-collapse text-[12.5px]">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                        {ITEM_SEARCH_COLS.map((c) => (
                          <th key={c.field} className={cn("px-3 py-2.5 whitespace-nowrap text-left", c.width)}>
                            {c.label}
                          </th>
                        ))}
                        <th className="px-3 py-2.5 whitespace-nowrap text-center min-w-[90px]">Action</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-hairline/70">
                      {itemData.map((item: any, index: number) => (
                        <tr
                          key={index}
                          className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                        >
                          {ITEM_SEARCH_COLS.map(({ field, type, readonly, width }: any) => (
                            <td key={field} className={cn("px-3 py-2 whitespace-nowrap text-left", width)}>
                              {item.isEdit && !readonly ? (
                                <input
                                  type={type}
                                  className={cn(GREEN_INPUT, width)}
                                  value={item[field] || ""}
                                  onChange={(e) => {
                                    const rows = [...itemData];
                                    rows[index] = { ...rows[index], [field]: e.target.value };
                                    setItemData(rows);
                                  }}
                                />
                              ) : (
                                <span>{item[field] || "-"}</span>
                              )}
                            </td>
                          ))}

                          <td className="px-2 py-2 text-center min-w-[90px]">
                            {!item.isEdit ? (
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  onClick={() => editItemRow(index)}
                                  className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => deleteRow(item)}
                                  className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 justify-center">
                                <button
                                  onClick={updateSearchRow}
                                  className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>

                                <button
                                  onClick={() => cancelItemEdit(index)}
                                  className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                                >
                                  <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            );
          })()}
        </div>
      )}

          {/* ================= GET SCREEN ================= */}

          {!isGlobalSearch && (
            <>
              {/* Field Grid */}
              <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
                  {fields.map((f) => (
                    <SapField
                      key={f.key}
                      field={{ ...f, value: headerData?.[f.key] ?? "" }}
                      setHeaderData={setHeaderData}
                      sapFetched={sapFetched}
                      sapFilledKeys={sapFilledKeys}
                      onReportedDateChange={onReportedDateChange}
                      onFileChange={handlePickDoc}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Table — selectable Line Items for Save */}
              <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                      <th className="px-3 py-0.5 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updated = itemData.map((item) => ({ ...item, selected: checked }));
                            setItemData(updated);
                          }}
                          className="size-4 accent-sky-600"
                        />
                      </th>

                      <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
                      <th className="px-3 py-0.5 text-center">Map ID</th>
                      <th className="px-3 py-0.5 text-center">Vehicle Number</th>
                      <th className="px-3 py-0.5 text-center">LR Number</th>
                      <th className="px-3 py-0.5 text-center">Transporter</th>
                      <th className="px-3 py-0.5 text-center">Bill No</th>
                      <th className="px-3 py-0.5 text-center">Work Order</th>
                      <th className="px-3 py-0.5 text-center w-24">Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {itemData.map((row: any, index: number) => (
                      <tr key={index}>
                        <td className="px-3 py-0.5 text-center">
                          <input
                            type="checkbox"
                            checked={row.selected || false}
                            onChange={(e) => {
                              const updated = [...itemData];
                              updated[index].selected = e.target.checked;
                              setItemData(updated);
                            }}
                            className="size-4 accent-sky-600"
                          />
                        </td>

                        <td className="px-3 py-0.5 text-center">{index + 1}</td>

                        <td className="px-3 py-0.5">
                          <select
                            value={row.ZMAPID || ""}
                            onChange={(e) => onchangeMAPID(index, e.target.value)}
                            className={GREEN_INPUT}
                          >
                            <option value="">Select</option>
                            {selectedItems.map((item) => (
                              <option key={item.MAPID} value={item.MAPID}>
                                {item.MAPID}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-0.5">
                          <input value={row.TRUCK_NO || ""} className={GREEN_INPUT + " text-center"} readOnly />
                        </td>

                        <td className="px-3 py-0.5">
                          <input value={row.LR_NO || ""} className={GREEN_INPUT + " text-center"} readOnly />
                        </td>

                        <td className="px-3 py-0.5">
                          <input value={row.TRANSPORTER || ""} className={GREEN_INPUT + " text-center"} readOnly />
                        </td>

                        <td className="px-3 py-0.5">
                          <input value={row.BILLNO || ""} className={GREEN_INPUT + " text-center"} readOnly />
                        </td>

                        <td className="px-3 py-0.5">
                          <input value={row.WORK_ORDER || ""} className={GREEN_INPUT + " text-center"} readOnly />
                        </td>

                        <td className="px-3 py-0.5 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={addItemRow}
                              className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                            >
                              <Plus className="size-3.5" />
                            </button>

                            <button
                              onClick={() => removeItemRow(index)}
                              className="inline-grid place-items-center size-7 rounded-md bg-rose-500 hover:bg-rose-600 text-white shadow-sm"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => (isWithout ? handleSaveNonSap("stay") : handleSave("stay"))}
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  <Save className="size-3.5" />
                  Save
                </button>

                <button
                  onClick={() => (isWithout ? handleSaveNonSap("next") : handleSave("next"))}
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  Save and Next
                  <ChevronRight className="size-3.5" />
                </button>

                <button
                  onClick={() => (isWithout ? handleSaveNonSap("previous") : handleSave("previous"))}
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  <ChevronLeft className="size-3.5" />
                  Save and Previous
                </button>
              </div>
            </>
          )}
        </>
      )}

      {/* Completed Invoices Modal */}
      <Dialog open={compInvoicesModalOpen} onOpenChange={setCompInvoicesModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-hairline shadow-soft bg-surface">
          <div className="px-5 py-3.5 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
            <div>
              <DialogTitle className="text-[14px] font-bold text-foreground">
                Completed Invoices
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Reference No: <span className="font-semibold text-foreground">{compInvoicesModalData.refNo}</span>
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-accent/10 text-accent">
              {compInvoicesModalData.invoices.length} {compInvoicesModalData.invoices.length === 1 ? "Invoice" : "Invoices"}
            </span>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto scrollbar-elegant">
            {compInvoicesModalData.invoices.length > 0 ? (
              <div className="border border-hairline rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                      <th className="px-3 py-1.5 text-center w-14">#</th>
                      <th className="px-3 py-1.5 text-left">Invoice Number</th>
                      <th className="px-3 py-1.5 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/60">
                    {compInvoicesModalData.invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-accent/[0.04] transition-colors">
                        <td className="px-3 py-1.5 text-center font-mono text-[11px] text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-mono font-medium text-foreground">
                          {inv}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-[12px]">
                No completed invoices available for this reference.
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-hairline bg-surface-2/40 flex justify-end">
            <button
              type="button"
              onClick={() => setCompInvoicesModalOpen(false)}
              className="px-3.5 py-1.5 text-[12px] font-semibold rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-xs"
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

function SapField({
  field,
  setHeaderData,
  sapFetched = false,
  sapFilledKeys,
  onReportedDateChange,
  onFileChange,
}: {
  field: FieldSpec;
  setHeaderData: React.Dispatch<React.SetStateAction<any>>;
  sapFetched?: boolean;
  sapFilledKeys?: Set<string>;
  onReportedDateChange?: (value: string) => void;
  onFileChange?: (key: string, file: File | null) => void;
}) {
  const { label, value = "", type = "text", options = [], placeholder } = field;

  // Fiscal Year is derived by logic (Reported Date → Fiscal Year), so it
  // gets the same "From Logic" violet treatment as the Order Info screen.
  if (field.key === "FI") {
    return (
      <div>
        <label className={LABEL}>
          {label}
          {value && (
            <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-300 leading-tight align-middle">
              From Logic
            </span>
          )}
        </label>
        <input
          value={value || ""}
          readOnly
          placeholder="Auto-filled from Reported Date"
          className={value ? INPUT_FROM_LOGIC : GREEN_INPUT}
        />
      </div>
    );
  }

  // SAP-aware colouring (same pattern as Order Info screen):
  // - SAP filled  → green + readonly
  // - SAP empty   → red + editable
  // - No SAP yet  → normal (file inputs are never coloured)
  const filled = type !== "file" && sapFetched && !!sapFilledKeys?.has(field.key);
  const unfilled = type !== "file" && sapFetched && !sapFilledKeys?.has(field.key);
  const cls = filled ? INPUT_SAP_FILLED : unfilled ? INPUT_SAP_EMPTY : GREEN_INPUT;

  return (
    <div>
      <label className={LABEL}>
        {label}
        {filled && (
          <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 leading-tight align-middle">
            From SAP
          </span>
        )}
      </label>

      {type === "select" ? (
        filled ? (
          <input value={value || ""} readOnly className={INPUT_SAP_FILLED} />
        ) : (
          <select
            value={value ?? ""}
            onChange={(e) => setHeaderData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
            className={cls}
          >
            <option value="">{placeholder ?? "Select"}</option>
            {options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        )
      ) : type === "date" ? (
        <GateDatePicker
          value={value || ""}
          disabled={filled}
          onChange={(_, str) => {
            if (filled) return;
            setHeaderData((prev: any) => ({ ...prev, [field.key]: str }));
            if (field.key === "REP_DATE") onReportedDateChange?.(str);
          }}
          className={cls}
        />
      ) : type === "file" ? (
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onFileChange?.(field.key, e.target.files?.[0] ?? null)}
          className={GREEN_INPUT + " py-1.5"}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          readOnly={filled}
          placeholder={placeholder ?? `Enter ${label}`}
          onChange={(e) => !filled && setHeaderData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
          className={cls}
        />
      )}
    </div>
  );
}