import { useState, useEffect, useRef, useMemo, type Ref } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Eye,
  FileText,
  ExternalLink,
  Trash2,
  CalendarIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger, PopoverAnchor } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
// @ts-ignore
import service, { getLocalDocumentUrl } from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import { GateDatePicker } from "@/components/ui/date-picker";

// ── Style constants (mirrors OrderInfoSapCreate) ────────────────────────────
const INPUT_NORMAL =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const INPUT_READONLY =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";
// Small inline-table edit input (matches OrderInfo's search-results edit cells)
const EDIT_CELL_INPUT =
  "h-6 w-28 rounded border border-input px-1 text-[11px] bg-white outline-none focus:border-ring focus:ring-1 focus:ring-ring/40";

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

type FieldSpec = {
  label: string;
  value?: string;
  type?: "text" | "select" | "date" | "datetime" | "file";
  options?: string[];
  placeholder?: string;
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
//   "D:\Pravah\SAP\Transit_Info\POD\1000_5000_challan.pdf" -> "1000_5000_challan.pdf"
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

const FIELDS: FieldSpec[] = [
  { label: "Invoice Number" },
  { label: "Physical arrived at destination date", type: "datetime" },
  { label: "Unloading date and time", type: "datetime" },
  { label: "POD scan received date", type: "date" },
  {
    label: "SIT/SALE",
    type: "select",
    options: ["SIT", "SALE"],
  },
  { label: "POD Scan", type: "file" },
];

// ── Field/type maps for inline table editing (OrderInfo pattern) ───────────
const HEADER_FIELDS: { field: string; label: string; type: string; options?: string[]; readonly?: boolean }[] = [
  { field: "ZREFNO", label: "Ref No", type: "text", readonly: true },
  { field: "ZINV_NO", label: "Invoice No", type: "text", readonly: true },
  { field: "ZODN_NO", label: "ODN No", type: "text" },
  { field: "ZSONO", label: "SO No", type: "text" },
  { field: "ZSALE_PERSON", label: "Sales Person", type: "text" },
  { field: "ZPY_ARRIVED_DEST", label: "Physical Arrived", type: "datetime-local" },
  { field: "ZUNLOADING_DT", label: "Unloading DT", type: "datetime-local" },
  { field: "ZPOD_SCAN", label: "POD Scan", type: "datetime-local" },
  { field: "ZSIT_SALE", label: "SIT/SALE", type: "select", options: ["SIT", "SALE"] },
  { field: "ZLOCATION", label: "Location", type: "text" },
  { field: "ZPLANT", label: "Plant", type: "plant" },
  { field: "ZDIVISION", label: "Division", type: "division" },
  { field: "ZCREATED_DT", label: "Created Date", type: "date", readonly: true },
  { field: "ZVEH_TYPE", label: "Vehicle Type", type: "text", readonly: true },
];

const ITEM_FIELDS: { field: string; label: string; type: string; readonly?: boolean }[] = [
  { field: "ZREFNO", label: "Reference Number", type: "text", readonly: true },
  { field: "ZINV_NO", label: "Invoice Number", type: "text", readonly: true },
  { field: "ZVEH_NUM", label: "Vehicle Number", type: "text" },
  { field: "ZVEH_LINE", label: "Vehicle Line", type: "number" },
  { field: "ZWORK_ORDER", label: "Work Order", type: "text", readonly: true },
  { field: "ZLRNO", label: "LR No", type: "text", readonly: true },
  { field: "ZTRANSPORTER", label: "Transporter", type: "text", readonly: true },
];

// Small reusable icon-button set (matches OrderInfoSapCreate's search-results action cell)
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

export function padZero(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function parseDateTimeParts(val?: string) {
  if (!val) return null;
  const str = String(val).trim();
  if (!str) return null;

  // Pattern 1: YYYY-MM-DD or YYYY/MM/DD with optional [T or space] HH:mm(:ss)?
  const ymdMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    const hasTime = ymdMatch[4] !== undefined && ymdMatch[5] !== undefined;
    const hour24 = hasTime ? parseInt(ymdMatch[4], 10) : 12;
    const minute = hasTime ? parseInt(ymdMatch[5], 10) : 0;
    const timeStr = `${padZero(hour24)}:${padZero(minute)}`;
    return { year, month, day, hour24, minute, timeStr, hasTime };
  }

  // Pattern 2: DD-MM-YYYY or DD/MM/YYYY with optional [T or space] HH:mm(:ss)?
  const dmyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10);
    const month = parseInt(dmyMatch[2], 10) - 1;
    const year = parseInt(dmyMatch[3], 10);
    const hasTime = dmyMatch[4] !== undefined && dmyMatch[5] !== undefined;
    const hour24 = hasTime ? parseInt(dmyMatch[4], 10) : 12;
    const minute = hasTime ? parseInt(dmyMatch[5], 10) : 0;
    const timeStr = `${padZero(hour24)}:${padZero(minute)}`;
    return { year, month, day, hour24, minute, timeStr, hasTime };
  }

  return null;
}

export function formatDateTimeDisplay(val?: string): string {
  if (!val || !String(val).trim()) return "-";
  const parsed = parseDateTimeParts(val);
  if (parsed) {
    const dateStr = `${padZero(parsed.day)}-${padZero(parsed.month + 1)}-${parsed.year}`;
    return parsed.hasTime ? `${dateStr} ${parsed.timeStr}` : dateStr;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = padZero(d.getDate());
      const mon = padZero(d.getMonth() + 1);
      const yr = d.getFullYear();
      const hh = padZero(d.getHours());
      const mm = padZero(d.getMinutes());
      return `${day}-${mon}-${yr} ${hh}:${mm}`;
    }
  } catch {}
  return String(val);
}

export function formatDateDisplay(val?: string): string {
  if (!val || !String(val).trim()) return "-";
  const parsed = parseDateTimeParts(val);
  if (parsed) {
    return `${padZero(parsed.day)}-${padZero(parsed.month + 1)}-${parsed.year}`;
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = padZero(d.getDate());
      const mon = padZero(d.getMonth() + 1);
      const yr = d.getFullYear();
      return `${day}-${mon}-${yr}`;
    }
  } catch {}
  return String(val);
}

export function TransitInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isSap = mode === "with";
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
  const navigate = useNavigate();

  const isWithout = mode === "without";

  const [checked, setChecked] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [physicalArrivedDate, setPhysicalArrivedDate] = useState("");
  const [unloadingDate, setUnloadingDate] = useState("");
  const [podScanDate, setPodScanDate] = useState("");
  const [sitSale, setSitSale] = useState("");
  const [headerData, setHeaderData] = useState<any>(null);
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; title: string } | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const [referenceItems, setReferenceItems] = useState([
    {
      referenceNumber: "",
      workOrderNumber: "",
      lrNumber: "",
      transporter: "",
      lineNumber: "",
    },
  ]);

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

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  // POD Scan document chosen by the user (sent to the backend on Save).
  const [podFile, setPodFile] = useState<File | null>(null);
  const [editSearchPodFile, setEditSearchPodFile] = useState<File | null>(null);
  const podInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Reset search fields
    setSearchType("");
    setSearchValue("");

    // Reset form fields
    setInvoiceNumber("");
    setPhysicalArrivedDate("");
    setUnloadingDate("");
    setPodScanDate("");
    setSitSale("");

    // Reset table data
    setHeaderData(null);
    setItemsList([]);
    setShowTable(false);
    setTableData([EMPTY_ROW()]);
    setFullReferenceData([]);
    setInvoiceF4List([]);

    // Reset reference items
    setReferenceItems([
      {
        referenceNumber: "",
        workOrderNumber: "",
        lrNumber: "",
        transporter: "",
        lineNumber: "",
      },
    ]);

    setCompInvoicesModalOpen(false);
    setCompInvoicesModalData({ refNo: "", invoices: [] });
  }, [mode]);
  const handleInputChange = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...referenceItems];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setReferenceItems(updated);
  };
  const populateReferenceRows = (data: any[]) => {
    if (Array.isArray(data)) {
      const rows = data.map((item) => ({
        referenceNumber: item.REF_NO?.toString() || "",
        workOrderNumber: item.WORK_ORDER_NO || "",
        lrNumber: item.LR_NO || "",
        transporter: item.TRANSPORTER || "",
        lineNumber: item.LINE_NO?.toString() || "",
      }));

      setReferenceItems(rows);
    }
  };

  useEffect(() => {
    if (podScanDate) {
      setSitSale("SALE");
    } else if (physicalArrivedDate || unloadingDate) {
      setSitSale("SIT");
    } else {
      setSitSale("");
    }
  }, [physicalArrivedDate, unloadingDate, podScanDate]);

  const resetAll = () => {
    setSearchType("");
    setSearchValue("");

    setInvoiceNumber("");
    setPhysicalArrivedDate("");
    setUnloadingDate("");
    setPodScanDate("");
    setSitSale("");

    setHeaderData(null);
    setItemsList([]);
    setShowTable(false);

    setTableData([EMPTY_ROW()]);
    setFullReferenceData([]);
    setInvoiceF4List([]);

    setReferenceItems([
      {
        referenceNumber: "",
        workOrderNumber: "",
        lrNumber: "",
        transporter: "",
        lineNumber: "",
      },
    ]);

    // Clear the chosen POD document too.
    setPodFile(null);
    if (podInputRef.current) podInputRef.current.value = "";

    setCompInvoicesModalOpen(false);
    setCompInvoicesModalData({ refNo: "", invoices: [] });
  };

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

  // ── Table helpers (matches OrderInfoSapCreate's reference table) ──
  const toggleRowSelect = (index: number) => {
    const row = tableData[index];
    if (row?.notAllowed) return;
    setTableData((prev) => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));
  };

  const removeRow = (index: number) => {
    if (tableData.length === 1) return;
    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const saveTransitInfo = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {
    const selectedRows = tableData.filter((r) => r.selected);

    if (selectedRows.length === 0) {
      Swal.fire({
        icon: "warning",
        text: "Please select at least one reference row before saving",
      });
      return;
    }

    setLoadingSave(true);
    try {
      // Convert the chosen POD document to base64 (empty string when none picked).
      const podBase64 = podFile ? await fileToBase64(podFile) : "";

      const HEAD = {
        REFNO: selectedRows[0]?.REF_NO || "",
        INV_NO: invoiceNumber || "",

        PY_ARRIVED_DEST: physicalArrivedDate,
        UNLOADING_DT: unloadingDate,
        POD_SCAN: podScanDate,
        SIT_SALE: sitSale || "",

        ZUSER: getLoggedInUser(),
        ZUSER_CH: "",
        ZPOD_FNAME: podBase64,                       // base64 file; backend saves it then clears this
        ZPOD_DOCNAME: podFile ? podFile.name : "",   // original document name
        ZPATH: "",                                   // backend fills this with the saved file path
      };

      const ITEM = selectedRows.map((item, idx) => ({
        REFNO: item.REF_NO,
        INV_NO: invoiceNumber,
        POSNR: (idx + 1) * 10,
        VEH_LINE: idx + 1,
        VEH_NUM: "",
        LRNO: item.LR_NO,
        WORK_ORDER: item.WORK_ORDER_NO,
        TRANSPORTER: item.TRANSPORTER,
        LINE_NO: item.LINE_NO,
      }));

      const payload = {
        HEAD,
        ITEM,
      };

      console.log("TRANSIT PAYLOAD", payload);

      let response: any;

      if (isSap) {
        // With SAP
        response = await service.TransitInfoSave(payload);
      } else {
        // Without SAP
        response = await service.TransitInfoNonSap(payload);
      }

      console.log(response);

      if (
        response?.STATUS?.toUpperCase() === "TRUE" ||
        response?.NUMBER === "200"
      ) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data saved successfully",
          confirmButtonText: "OK",
        });

        if (action === "next") navigate({ to: "/freight-billing" });
        else if (action === "previous") navigate({ to: "/segment-info" });
        else resetAll();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: response.MESSAGE || "Save Failed",
          confirmButtonText: "OK",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error while saving",
        confirmButtonText: "OK",
      });
    } finally {
      setLoadingSave(false);
    }
  };

  const onSearchReference = async () => {
    console.log("SEARCH BUTTON CLICKED");

    // Reset old data
    setHeaderData(null);
    setItemsList([]);
    setShowTable(false);

    if (!searchValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter a value",
      });
      return;
    }

    if (!searchType) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select a search type",
      });
      return;
    }

    const payload = {
      global: "TRANSIT INFO",
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

    const typeMap: Record<string, keyof typeof payload.data> = {
      Reference: "ref_no",
      Invoice: "inv_no",
      ODN: "odn_no",
      "SO Number": "so_no",
      "Work Order": "workorder_no",
      "LR Number": "lr_no",
    };

    const selectedField = typeMap[searchType];

    if (selectedField) {
      payload.data[selectedField] = searchValue.trim();
    }

    setLoadingSearch(true);
    try {

      let res: any;

      if (isSap) {
        // WITH SAP
        res = await service.global_Fields_SearchOption(payload);
      } else {
        // WITHOUT SAP
        res = await service.global_Fields_SearchOption_WithoutSap(payload);
      }

      console.log("SEARCH RESPONSE", res);

      if (
        res?.NUMBER === "100" &&
        res?.STATUS === "FALSE"
      ) {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res?.HEADER || res.HEADER.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
        });
        return;
      }

      // Matches the Angular reference exactly: headerData is a single object
      // built from HEADER[0] (not an array). The header/item Save buttons
      // always submit the CURRENT headerData together with the full
      // itemsList — so header and items must stay in sync as one unit,
      // exactly like TransitInfoComponent.updateSearchRow(headerData, itemsList).
      setHeaderData({ ...res.HEADER[0], isEdit: false });
      setItemsList((res.ITEMS || []).map((item: any) => ({ ...item, isEdit: false })));
      setShowTable(true);

      const firstHeader = res.HEADER[0];

      setInvoiceNumber(firstHeader.ZINV_NO || "");
      setPhysicalArrivedDate(firstHeader.ZPY_ARRIVED_DEST || "");
      setUnloadingDate(firstHeader.ZUNLOADING_DT || "");
      setPodScanDate(firstHeader.ZPOD_SCAN || "");
      setSitSale(firstHeader.ZSIT_SALE || "");

      const rows = (res.ITEMS || []).map((item: any) => ({
        referenceNumber: item.ZREFNO || "",
        workOrderNumber: item.ZWORK_ORDER || "",
        lrNumber: item.ZLRNO || "",
        transporter: item.ZTRANSPORTER || "",
        lineNumber: item.ZLINE_NO || "",
      }));

      setReferenceItems(rows);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Data fetched successfully",
        timer: 1200,
        showConfirmButton: false,
      });

    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Error fetching data",
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  const editSearchRow = (type: "header" | "item", index: number) => {
    if (type === "header") {
      if (!headerData) return;
      setEditSearchPodFile(null);
      setHeaderData({ ...headerData, _backup: { ...headerData }, isEdit: true });
    } else {
      const updated = [...itemsList];
      updated[index]._backup = { ...updated[index] };
      updated[index].isEdit = true;
      setItemsList(updated);
    }
  };
  const sapType = "SAP";

  const updateSearchRow = async (
  headerRow: any,
  itemRows: any[]
) => {
  const result = await Swal.fire({
    title: "Are you sure?",
    text: "Do you want to update this transit record?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Yes, Update",
    cancelButtonText: "Cancel",
  });

  if (!result.isConfirmed) return;

  if (!headerRow?.ZREFNO) {
    Swal.fire("Error", "Missing mandatory ZREFNO in header", "error");
    return;
  }

  const invalidItems = itemRows.filter(
    (item) => !item?.ZREFNO || !item?.ZLINE_NO
  );

  if (invalidItems.length > 0) {
    Swal.fire(
      "Error",
      "Missing mandatory keys in items (ZREFNO/ZLINE_NO)",
      "error"
    );
    return;
  }

  setLoadingSave(true);

  try {
    const editPodBase64 = editSearchPodFile ? await fileToBase64(editSearchPodFile) : "";
    const editPodDocName = editSearchPodFile ? editSearchPodFile.name : (headerRow.ZPODNAME || "POD");

    /*
     * IMPORTANT:
     * Update API expects HEADER as object and ITEM as array.
     * Keep all editable fields in the payload.
     */
    const headerPayload = {
      ZREFNO: headerRow.ZREFNO,
      ZINV_NO: headerRow.ZINV_NO || "",
      ZODN_NO: headerRow.ZODN_NO || "",
      ZSONO: headerRow.ZSONO || "",
      ZSALE_PERSON: headerRow.ZSALE_PERSON || "",

      // Editable date fields
      ZPY_ARRIVED_DEST: headerRow.ZPY_ARRIVED_DEST || "",
      ZUNLOADING_DT: headerRow.ZUNLOADING_DT || "",
      ZPOD_SCAN: headerRow.ZPOD_SCAN || "",

      ZSIT_SALE: headerRow.ZSIT_SALE || "",
      ZPODNAME: editSearchPodFile ? editSearchPodFile.name : (headerRow.ZPODNAME || ""),
      ZLOCATION: headerRow.ZLOCATION || "",
      ZCREATED_DT: headerRow.ZCREATED_DT || "",
      ZPLANT: headerRow.ZPLANT || "",
      ZDIVISION: headerRow.ZDIVISION || "",
      ZVEH_TYPE: headerRow.ZVEH_TYPE || "",
      ZUSER: headerRow.ZUSER || "",
      ZUSER_CH: getLoggedInUser(),
      ZPOD_FNAME: editPodBase64,
      ZPOD_DOCNAME: editPodDocName,
      ZPATH: headerRow.ZPATH || "",
    };

    /*
     * Preserve the existing ITEM values.
     * Do not generate POSNR / VEH_LINE values again.
     */
    const itemPayload = itemRows.map((item: any) => ({
      ZREFNO: String(item.ZREFNO ?? ""),
      ZLINE_NO: String(item.ZLINE_NO ?? ""),
      ZINV_NO: item.ZINV_NO ?? "",
      POSNR: item.POSNR ?? "",
      ZVEH_LINE: item.ZVEH_LINE ?? "",
      ZVEH_NUM: item.ZVEH_NUM ?? "",
      ZLRNO: item.ZLRNO ?? "",
      ZWORK_ORDER: item.ZWORK_ORDER ?? "",
      ZTRANSPORTER: item.ZTRANSPORTER ?? "",
      ZUSER: item.ZUSER ?? "",
      ZUSER_CH: getLoggedInUser(),
    }));

    const payload = {
      REFNO: headerRow.ZREFNO,
      INV_NO: headerRow.ZINV_NO || "",
      ZPOD_FNAME: editPodBase64,
      ZPOD_DOCNAME: editPodDocName,
      ZPATH: headerRow.ZPATH || "",
      HEADER: headerPayload,
      ITEM: itemPayload,
    };

    console.log(
      "========== TRANSIT UPDATE PAYLOAD =========="
    );
    console.log(JSON.stringify(payload, null, 2));

    const response =
      isSap
        ? await service.TransitInfoChangeWithSap(payload)
        : await service.TransitInfoChangeWithoutSap(payload);

    console.log(
      "========== TRANSIT UPDATE RESPONSE =========="
    );
    console.log(response);

    const updateSuccess =
      String(response?.STATUS ?? "").toUpperCase() === "TRUE" ||
      String(response?.NUMBER ?? "") === "200";

    if (!updateSuccess) {
      Swal.fire(
        "Error",
        response?.MESSAGE || response?.MSG || "Update failed",
        "error"
      );
      return;
    }

    /*
     * IMPORTANT:
     * Do not immediately call onSearchReference().
     * First update the UI with the values that were actually submitted.
     */
    setEditSearchPodFile(null);
    setHeaderData({
      ...headerPayload,
      ZLOCALFILES: editSearchPodFile
        ? { ...headerRow.ZLOCALFILES, POD: editSearchPodFile.name }
        : headerRow.ZLOCALFILES,
      ZPODNAME: editSearchPodFile ? editSearchPodFile.name : headerRow.ZPODNAME,
      isEdit: false,
    });

    setItemsList(
      itemPayload.map((item: any) => ({
        ...item,
        isEdit: false,
      }))
    );

    /*
     * Also keep the top form fields synchronized.
     */
    setInvoiceNumber(headerPayload.ZINV_NO || "");
    setPhysicalArrivedDate(
      headerPayload.ZPY_ARRIVED_DEST || ""
    );
    setUnloadingDate(
      headerPayload.ZUNLOADING_DT || ""
    );
    setPodScanDate(
      headerPayload.ZPOD_SCAN || ""
    );
    setSitSale(
      headerPayload.ZSIT_SALE || ""
    );

    /*
     * Remove edit backup data.
     */
    setHeaderData((prev: any) => {
      if (!prev) return prev;

      const { _backup, ...cleanHeader } = prev;

      return {
        ...cleanHeader,
        isEdit: false,
      };
    });

    setItemsList((prev: any[]) =>
      prev.map((item) => {
        const { _backup, ...cleanItem } = item;

        return {
          ...cleanItem,
          isEdit: false,
        };
      })
    );

    await Swal.fire({
      icon: "success",
      title: "Success",
      text: response?.MESSAGE || "Transit data updated successfully",
      confirmButtonText: "OK",
    });

  } catch (err) {
    console.error(
      "Transit update error:",
      err
    );

    Swal.fire(
      "Error",
      "Internal Server Error while updating transit data",
      "error"
    );
  } finally {
    setLoadingSave(false);
  }
};

  const cancelSearchEdit = (type: "header" | "item", index: number) => {
    if (type === "header") {
      setEditSearchPodFile(null);
      if (!headerData) return;
      if (headerData._backup) {
        setHeaderData({ ...headerData._backup, isEdit: false });
      } else {
        setHeaderData({ ...headerData, isEdit: false });
      }
    } else {
      const updated = [...itemsList];
      if (updated[index]._backup) {
        updated[index] = { ...updated[index]._backup, isEdit: false };
      } else {
        updated[index].isEdit = false;
      }
      setItemsList(updated);
    }
  };


  const deleteRow = async (type: "header" | "item", index: number) => {
    const row = type === "header" ? headerData : itemsList[index];
    if (!row) return;

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
          ZLINE_NO: row.ZLINE_NO || "",
        },
      ],
    };

    try {
      const res: any = isSap
        ? await service.TransitInfoDeleteWithSap(payload)
        : await service.TransitInfoDeleteWithOutSap(payload);

      if (res?.STATUS === "TRUE" || res?.STATUS === true || res?.NUMBER === "200") {
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: res.MSG || res.MESSAGE || "Record deleted successfully",
          confirmButtonText: "Ok",
        });

        if (type === "header") {
          // Deleting the header removes the whole record — clear everything.
          setHeaderData(null);
          setItemsList([]);
          setShowTable(false);
        } else {
          setItemsList((prev) => prev.filter((_, i) => i !== index));
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed",
          text: res?.MSG || res?.MESSAGE || "Delete failed",
        });
      }
    } catch (err: any) {
      console.error("Delete Error:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.error?.MESSAGE || "Something went wrong while deleting",
      });
    }
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
                      onChange={() => toggleRowSelect(index)}
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
                          : index !== 0
                          ? INPUT_READONLY
                          : INPUT_NORMAL) + " text-center"
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
                          : index !== 0
                          ? INPUT_READONLY
                          : INPUT_NORMAL) + " text-center"
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
                            : index !== 0
                            ? INPUT_READONLY
                            : INPUT_NORMAL) + " text-center"
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
                            : index !== 0
                            ? INPUT_READONLY
                            : INPUT_NORMAL) + " text-center"
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
                          : index !== 0
                          ? INPUT_READONLY
                          : INPUT_NORMAL) + " text-center"
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
                    {tableData.length > 1 && !isRowDisabled && (
                      <button
                        onClick={() => removeRow(index)}
                        className="size-6 grid place-items-center rounded-md text-red-500 hover:bg-red-50 mx-auto cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
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
              onKeyDown={(e) => { if (e.key === "Enter") onSearchReference(); }}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={onSearchReference}
              disabled={loadingSearch}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta disabled:opacity-50"
            >
              {loadingSearch ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </button>
          </div>
        </div>
      </div>


      {/* Field grid */}
      {searchType === "" && (
        <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">

            <div>
              <label className={LABEL}>Invoice Number</label>
              <F4MultiSelect
                options={invoiceF4List}
                value={invoiceNumber}
                onChange={setInvoiceNumber}
                placeholder="Select Invoice Number"
                className={INPUT_NORMAL}
              />
            </div>

            <SapField
              field={FIELDS[1]}
              value={physicalArrivedDate}
              onChange={setPhysicalArrivedDate}
            />

            <SapField
              field={FIELDS[2]}
              value={unloadingDate}
              onChange={setUnloadingDate}
            />

            <SapField
              field={FIELDS[3]}
              value={podScanDate}
              onChange={setPodScanDate}
            />

            <SapField
              field={FIELDS[4]}
              value={sitSale}
              onChange={setSitSale}
              disabledOptions={!podScanDate || !podScanDate.trim() ? ["SALE"] : []}
            />

            <SapField
              field={FIELDS[5]}
              inputRef={podInputRef}
              onFileChange={(f) => setPodFile(f)}
            />

          </div>
        </div>
      )}

      {showTable && headerData && (
        <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
          <div className="px-3 py-2 border-b border-hairline bg-surface-2/60 font-semibold text-[13px] text-foreground flex items-center justify-between">
            Header Details
          </div>

          <div className="max-h-[560px] overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {HEADER_FIELDS.map(({ label }) => (
                      <th key={label} className="px-3 py-2.5 whitespace-nowrap text-left">{label}</th>
                    ))}
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">POD Name</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  <tr className="bg-surface hover:bg-muted/50">
                    {HEADER_FIELDS.map(({ field, type, options, readonly }: any) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                        {headerData.isEdit && !readonly ? (
                          type === "select" ? (
                            <select
                              value={headerData[field] || ""}
                              onChange={(e) => {
                                if (field === "ZSIT_SALE" && e.target.value === "SALE" && (!headerData.ZPOD_SCAN || !String(headerData.ZPOD_SCAN).trim())) {
                                  return;
                                }
                                setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }));
                              }}
                              className="h-6 min-w-[100px] rounded border border-hairline px-1 text-[11px] bg-white dark:bg-surface"
                            >
                              <option value="">Select</option>
                              {options?.map((o: string) => {
                                const isOptionDisabled =
                                  field === "ZSIT_SALE" &&
                                  o === "SALE" &&
                                  (!headerData.ZPOD_SCAN || !String(headerData.ZPOD_SCAN).trim());
                                return (
                                  <option key={o} value={o} disabled={isOptionDisabled}>
                                    {o}
                                  </option>
                                );
                              })}
                            </select>
                          ) : type === "plant" ? (
                            <select
                              value={headerData[field] || ""}
                              onChange={(e) => setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))}
                              className="h-6 min-w-[90px] rounded border border-hairline px-1 text-[11px] bg-white dark:bg-surface"
                            >
                              <option value="">Select Plant</option>
                              {Array.from(new Set([...(currentUser.PLANTS || []).map((p: any) => typeof p === "string" ? p : p?.PLANT || p?.PLANT_NAME || String(p)), headerData[field]].filter(Boolean))).map((p) => (
                                <option key={p} value={p}>{p}</option>
                              ))}
                            </select>
                          ) : type === "division" ? (
                            <select
                              value={headerData[field] || ""}
                              onChange={(e) => setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))}
                              className="h-6 min-w-[90px] rounded border border-hairline px-1 text-[11px] bg-white dark:bg-surface"
                            >
                              <option value="">Select Division</option>
                              {Array.from(new Set([...(currentUser.DIV || []).map((d: any) => typeof d === "string" ? d : d?.DIVISION || d?.DIV || String(d)), headerData[field]].filter(Boolean))).map((d) => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          ) : type === "datetime-local" ? (
                            <TransitDateTimePicker
                              value={headerData[field] || ""}
                              onChange={(val) =>
                                setHeaderData((prev: any) => ({ ...prev, [field]: val }))
                              }
                              className="h-6 min-w-[150px] text-[11px]"
                            />
                          ) : (
                            <input
                              type={type}
                              value={headerData[field] || ""}
                              onChange={(e) =>
                                setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))
                              }
                              className={EDIT_CELL_INPUT}
                            />
                          )
                        ) : type === "datetime-local" && headerData[field] ? (
                          formatDateTimeDisplay(headerData[field])
                        ) : type === "date" && headerData[field] ? (
                          formatDateDisplay(headerData[field])
                        ) : (
                          headerData[field] || "-"
                        )}
                      </td>
                    ))}

                    {/* POD Name */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {headerData.isEdit ? (
                        <div className="flex flex-col items-center gap-1">
                          {editSearchPodFile?.name ? (
                            <button
                              type="button"
                              onClick={() => {
                                const url = URL.createObjectURL(editSearchPodFile);
                                setPreviewDoc({ url, title: editSearchPodFile.name });
                              }}
                              className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                              title={editSearchPodFile.name}
                            >
                              {editSearchPodFile.name}
                            </button>
                          ) : (
                            (() => {
                              const existingName =
                                headerData.ZLOCALFILES?.POD ||
                                headerData.ZPODNAME ||
                                fileNameFromPath(headerData.ZPATH) ||
                                fileNameFromPath(headerData.ZPODFILE) ||
                                "-";
                              if (existingName && existingName !== "-") {
                                return (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const url = getLocalDocumentUrl({
                                        mode: isWithout ? "Without Sap" : "SAP",
                                        screen: "Transit_Info",
                                        field: "POD",
                                        fileName: existingName,
                                        storedPath: headerData.ZPATH || headerData.ZPODFILE,
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
                            <span>{editSearchPodFile ? "Change" : "Browse"}</span>
                            <input
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              onChange={(e) => setEditSearchPodFile(e.target.files?.[0] || null)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      ) : (
                        (() => {
                          const podName =
                            headerData.ZLOCALFILES?.POD ||
                            headerData.ZPODNAME ||
                            fileNameFromPath(headerData.ZPATH) ||
                            fileNameFromPath(headerData.ZPODFILE);
                          if (!podName || podName === "-" || podName === "NA") {
                            return <span className="text-muted-foreground">-</span>;
                          }
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const url = getLocalDocumentUrl({
                                  mode: isWithout ? "Without Sap" : "SAP",
                                  screen: "Transit_Info",
                                  field: "POD",
                                  fileName: podName,
                                  storedPath: headerData.ZPATH || headerData.ZPODFILE,
                                  row: headerData,
                                });
                                setPreviewDoc({ url, title: podName });
                              }}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[160px]"
                              title={`View ${podName}`}
                            >
                              <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                              <span className="truncate">{podName}</span>
                            </button>
                          );
                        })()
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {!headerData.isEdit ? (
                        <div className="flex gap-2 justify-center">
                          <IconButton variant="blue" title="Edit" path={EDIT_PATH} onClick={() => editSearchRow("header", 0)} />
                          <IconButton variant="red" title="Delete" path={DELETE_PATH} onClick={() => deleteRow("header", 0)} />
                        </div>
                      ) : (
                        <div className="flex gap-2 justify-center">
                          <IconButton
                            variant="emerald"
                            title="Save"
                            path={CHECK_PATH}
                            onClick={() => updateSearchRow(headerData, itemsList)}
                          />
                          <IconButton variant="gray" title="Cancel" path={X_PATH} onClick={() => cancelSearchEdit("header", 0)} />
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showTable && itemsList.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
          <div className="px-3 py-2 border-b border-hairline bg-surface-2/60 font-semibold text-[13px] text-foreground">
            Line Items
          </div>

          <div className="max-h-[560px] overflow-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Reference Number</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Line No</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Invoice Number</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle Number</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Vehicle Line</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Work Order</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">LR No</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Transporter</th>
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  {itemsList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-3 py-6 text-center text-muted-foreground">
                        No Records Found
                      </td>
                    </tr>
                  ) : (
                    itemsList.map((item: any, index: number) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                      >
                        {/* Reference Number */}
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {item.isEdit ? (
                            <input
                              type="text"
                              value={item.ZREFNO ?? ""}
                              onChange={(e) => {
                                const data = [...itemsList];
                                data[index] = { ...data[index], ZREFNO: e.target.value };
                                setItemsList(data);
                              }}
                              className={EDIT_CELL_INPUT}
                            />
                          ) : (
                            item.ZREFNO || "-"
                          )}
                        </td>

                        {/* Line No — always readonly */}
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {item.ZLINE_NO ?? "-"}
                        </td>

                        {ITEM_FIELDS.slice(1).map(({ field, type, readonly }: any) => (
                          <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                            {item.isEdit && !readonly ? (
                              <input
                                type={type}
                                value={item[field] ?? ""}
                                onChange={(e) => {
                                  const data = [...itemsList];
                                  data[index] = {
                                    ...data[index],
                                    [field]: type === "number" ? Number(e.target.value) : e.target.value,
                                  };
                                  setItemsList(data);
                                }}
                                className={EDIT_CELL_INPUT}
                              />
                            ) : (
                              item[field] ?? "-"
                            )}
                          </td>
                        ))}

                        {/* Action */}
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          {!item.isEdit ? (
                            <div className="flex gap-2 justify-center">
                              <IconButton variant="blue" title="Edit" path={EDIT_PATH} onClick={() => editSearchRow("item", index)} />
                              <IconButton variant="red" title="Delete" path={DELETE_PATH} onClick={() => deleteRow("item", index)} />
                            </div>
                          ) : (
                            <div className="flex gap-2 justify-center">
                              <IconButton
                                variant="emerald"
                                title="Save"
                                path={CHECK_PATH}
                                onClick={() => updateSearchRow(headerData, itemsList)}
                              />
                              <IconButton variant="gray" title="Cancel" path={X_PATH} onClick={() => cancelSearchEdit("item", index)} />
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer action bar */}
      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">        
        <button
          onClick={() => saveTransitInfo("stay")}
          disabled={loadingSave}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
        >
          {loadingSave ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save
        </button>
        <button
          onClick={() => saveTransitInfo("next")}
          disabled={loadingSave}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
        >
          Save and Next
          <ChevronRight className="size-3.5" />
        </button>
        <button
          onClick={() => saveTransitInfo("previous")}
          disabled={loadingSave}
          className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
        >
          <ChevronLeft className="size-3.5" />
          Save and Previous
        </button>
      </div>

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
        </DialogContent>
      </Dialog>
    </div>
  );
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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const TIME_SLOTS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 15) {
    const hh = h < 10 ? `0${h}` : `${h}`;
    const mm = m < 10 ? `0${m}` : `${m}`;
    TIME_SLOTS.push(`${hh}:${mm}`);
  }
}

function parseIsoDateTime(val?: string) {
  if (!val) return null;
  const parsed = parseDateTimeParts(val);
  if (!parsed) return null;
  return {
    year: parsed.year,
    month: parsed.month,
    day: parsed.day,
    hour24: parsed.hour24,
    minute: parsed.minute,
    timeStr: parsed.timeStr,
  };
}

function parseTypedDateTime(val: string): string | null {
  if (!val) return null;
  const parsed = parseDateTimeParts(val);
  if (!parsed) return null;
  const { year, month, day, hour24, minute } = parsed;
  const m = month + 1;
  if (m >= 1 && m <= 12 && day >= 1 && day <= 31 && hour24 >= 0 && hour24 <= 23 && minute >= 0 && minute <= 59) {
    return `${year}-${padZero(m)}-${padZero(day)}T${padZero(hour24)}:${padZero(minute)}`;
  }
  return null;
}

/** Date & Time picker matching Gate In/Out screen design */
function TransitDateTimePicker({
  value,
  onChange,
  min,
  placeholder = "Select Date & Time",
  disabled = false,
  className,
}: {
  value?: string;
  onChange?: (value: string) => void;
  min?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const parsed = useMemo(() => parseIsoDateTime(value), [value]);
  const minParsed = useMemo(() => parseIsoDateTime(min), [min]);

  const displayFormatted = useMemo(() => {
    if (!parsed) return "";
    return `${padZero(parsed.day)}-${padZero(parsed.month + 1)}-${parsed.year} ${parsed.timeStr}`;
  }, [parsed]);

  const [rawInput, setRawInput] = useState(displayFormatted);

  useEffect(() => {
    setRawInput(displayFormatted);
  }, [displayFormatted]);

  const now = new Date();
  const [viewYear, setViewYear] = useState<number>(parsed?.year ?? now.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsed?.month ?? now.getMonth());

  const [selectedYear, setSelectedYear] = useState<number | null>(parsed?.year ?? null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(parsed?.month ?? null);
  const [selectedDay, setSelectedDay] = useState<number | null>(parsed?.day ?? null);

  const [selectedTime, setSelectedTime] = useState<string>(parsed?.timeStr ?? "12:00");
  const [customTimeInput, setCustomTimeInput] = useState<string>(parsed?.timeStr ?? "12:00");

  const selectedTimeBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      if (parsed) {
        setViewYear(parsed.year);
        setViewMonth(parsed.month);
        setSelectedYear(parsed.year);
        setSelectedMonth(parsed.month);
        setSelectedDay(parsed.day);
        setSelectedTime(parsed.timeStr);
        setCustomTimeInput(parsed.timeStr);
      } else {
        const d = new Date();
        const curMin = Math.floor(d.getMinutes() / 15) * 15;
        const curH = d.getHours() < 10 ? `0${d.getHours()}` : `${d.getHours()}`;
        const curM = curMin < 10 ? `0${curMin}` : `${curMin}`;
        const fallbackTime = `${curH}:${curM}`;

        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedYear(d.getFullYear());
        setSelectedMonth(d.getMonth());
        setSelectedDay(d.getDate());
        setSelectedTime(fallbackTime);
        setCustomTimeInput(fallbackTime);
      }
    }
  }, [open, parsed]);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        selectedTimeBtnRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [open, selectedTime]);

  const isDateDisabled = (y: number, m: number, d: number) => {
    if (!minParsed) return false;
    const cellDateStr = `${y}-${padZero(m + 1)}-${padZero(d)}`;
    const minDateStr = `${minParsed.year}-${padZero(minParsed.month + 1)}-${padZero(minParsed.day)}`;
    return cellDateStr < minDateStr;
  };

  const isTimeDisabled = (timeStr: string) => {
    if (!minParsed || selectedYear === null || selectedMonth === null || selectedDay === null) return false;
    const curDateStr = `${selectedYear}-${padZero(selectedMonth + 1)}-${padZero(selectedDay)}`;
    const minDateStr = `${minParsed.year}-${padZero(minParsed.month + 1)}-${padZero(minParsed.day)}`;
    if (curDateStr === minDateStr) {
      return timeStr <= minParsed.timeStr;
    }
    return curDateStr < minDateStr;
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
    const mondayOffset = (firstDayIndex + 6) % 7;

    const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: {
      day: number;
      month: number;
      year: number;
      isCurrentMonth: boolean;
      isSelected: boolean;
      isDisabled: boolean;
    }[] = [];

    for (let i = mondayOffset - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: isDateDisabled(y, m, d),
      });
    }

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const isSelected =
        selectedYear === viewYear &&
        selectedMonth === viewMonth &&
        selectedDay === d;
      cells.push({
        day: d,
        month: viewMonth,
        year: viewYear,
        isCurrentMonth: true,
        isSelected,
        isDisabled: isDateDisabled(viewYear, viewMonth, d),
      });
    }

    const remaining = (7 - (cells.length % 7)) % 7;
    const totalSlots = cells.length + remaining < 35 ? 35 : cells.length + remaining;
    const nextPadding = totalSlots - cells.length;

    for (let d = 1; d <= nextPadding; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: d,
        month: m,
        year: y,
        isCurrentMonth: false,
        isSelected: false,
        isDisabled: isDateDisabled(y, m, d),
      });
    }

    return cells;
  }, [viewYear, viewMonth, selectedYear, selectedMonth, selectedDay, minParsed]);

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (cell: (typeof calendarDays)[0]) => {
    if (cell.isDisabled) return;
    setSelectedYear(cell.year);
    setSelectedMonth(cell.month);
    setSelectedDay(cell.day);
    if (!cell.isCurrentMonth) {
      setViewYear(cell.year);
      setViewMonth(cell.month);
    }
  };

  const handleToday = () => {
    const d = new Date();
    if (!isDateDisabled(d.getFullYear(), d.getMonth(), d.getDate())) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
      setSelectedYear(d.getFullYear());
      setSelectedMonth(d.getMonth());
      setSelectedDay(d.getDate());
    }
  };

  const handleClear = () => {
    setSelectedYear(null);
    setSelectedMonth(null);
    setSelectedDay(null);
    onChange?.("");
    setOpen(false);
  };

  const handleConfirm = (confirmedTime: string) => {
    const y = selectedYear ?? now.getFullYear();
    const m = selectedMonth ?? now.getMonth();
    const d = selectedDay ?? now.getDate();

    const isoStr = `${y}-${padZero(m + 1)}-${padZero(d)}T${confirmedTime}`;
    onChange?.(isoStr);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div
          className={cn(
            "relative flex items-center h-7 w-full rounded-md border border-input bg-white dark:bg-surface text-[12px] transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30",
            disabled && "opacity-60 cursor-not-allowed",
            className
          )}
        >
          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder}
            value={rawInput}
            onClick={() => !disabled && setOpen((prev) => !prev)}
            onChange={(e) => {
              const typed = e.target.value;
              setRawInput(typed);
              const parsedIso = parseTypedDateTime(typed);
              if (parsedIso) {
                onChange?.(parsedIso);
              }
            }}
            onBlur={() => {
              if (parsed) {
                setRawInput(displayFormatted);
              } else if (!rawInput.trim()) {
                onChange?.("");
                setRawInput("");
              }
            }}
            className="h-full w-full bg-transparent px-2 text-[12px] text-foreground font-medium outline-none placeholder:text-muted-foreground placeholder:font-normal"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              className="h-full px-1.5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
              aria-label="Open Calendar and Time Picker"
            >
              <CalendarIcon className="size-3.5 opacity-70 hover:opacity-100" />
            </button>
          </PopoverTrigger>
        </div>
      </PopoverAnchor>

      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={4}
        avoidCollisions={true}
        collisionPadding={8}
        className="w-auto p-0 bg-white dark:bg-surface border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          
          {/* LEFT: Date Calendar */}
          <div className="p-3.5 w-[260px] flex flex-col justify-between select-none">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[13.5px] font-bold text-slate-800 dark:text-slate-100">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </span>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 text-center mb-1">
                {WEEKDAYS.map((wd) => (
                  <span key={wd} className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 py-0.5">
                    {wd}
                  </span>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-y-1 place-items-center text-[12px]">
                {calendarDays.map((cell, i) => {
                  const isCurMonth = cell.isCurrentMonth;
                  const isSel = cell.isSelected;
                  const isDis = cell.isDisabled;

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isDis}
                      onClick={() => handleSelectDay(cell)}
                      className={cn(
                        "size-7.5 rounded-lg flex items-center justify-center font-medium transition-all",
                        isSel
                          ? "bg-blue-600 text-white shadow-sm font-semibold"
                          : isDis
                          ? "text-slate-300 dark:text-slate-700 cursor-not-allowed pointer-events-none"
                          : isCurMonth
                          ? "text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                          : "text-slate-300 dark:text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      {cell.day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11.5px] font-semibold">
              <button
                type="button"
                onClick={handleClear}
                className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 transition-colors"
              >
                Today
              </button>
            </div>
          </div>

          {/* RIGHT: Time Slots with Manual Typing Input + [Time] [Confirm] List */}
          <div className="p-3 w-[195px] flex flex-col select-none bg-slate-50/50 dark:bg-surface/50">
            <div className="flex items-center justify-between px-0.5 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Time
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">HH:MM</span>
            </div>

            {/* Manual time typing input bar */}
            <div className="flex items-center gap-1 mb-2 px-0.5">
              <input
                type="text"
                placeholder="HH:mm"
                maxLength={5}
                value={customTimeInput}
                onChange={(e) => {
                  let val = e.target.value.replace(/[^0-9:]/g, "");
                  if (val.length === 2 && !val.includes(":") && (e.nativeEvent as any)?.inputType !== "deleteContentBackward") {
                    val = val + ":";
                  }
                  setCustomTimeInput(val);
                  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(val)) {
                    setSelectedTime(val);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(customTimeInput)) {
                      if (!isTimeDisabled(customTimeInput)) {
                        handleConfirm(customTimeInput);
                      }
                    }
                  }
                }}
                className="h-7 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface px-2 text-center font-mono text-[12px] font-semibold text-slate-800 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-2xs"
              />
              <button
                type="button"
                disabled={!/^([01]\d|2[0-3]):([0-5]\d)$/.test(customTimeInput) || isTimeDisabled(customTimeInput)}
                onClick={() => {
                  if (/^([01]\d|2[0-3]):([0-5]\d)$/.test(customTimeInput) && !isTimeDisabled(customTimeInput)) {
                    handleConfirm(customTimeInput);
                  }
                }}
                className="h-7 px-2.5 rounded-md bg-[#324baf] hover:bg-[#283e96] disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-[11.5px] shadow-sm transition-all flex items-center justify-center cursor-pointer active:scale-95 shrink-0"
              >
                Set
              </button>
            </div>

            <div className="h-[240px] overflow-y-auto scrollbar-elegant pr-1 space-y-1.5">
              {TIME_SLOTS.map((timeStr) => {
                const isSelected = selectedTime === timeStr;
                const isDis = isTimeDisabled(timeStr);

                if (isSelected) {
                  return (
                    <div
                      key={timeStr}
                      ref={selectedTimeBtnRef}
                      className="flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-150"
                    >
                      <button
                        type="button"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-[13px] text-center"
                      >
                        {timeStr}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirm(timeStr)}
                        className="py-1.5 px-3 rounded-lg bg-[#324baf] hover:bg-[#283e96] text-white font-semibold text-[12.5px] shadow-sm active:scale-95 transition-all flex items-center justify-center cursor-pointer"
                      >
                        Confirm
                      </button>
                    </div>
                  );
                }

                return (
                  <button
                    key={timeStr}
                    type="button"
                    disabled={isDis}
                    onClick={() => {
                      if (!isDis) {
                        setSelectedTime(timeStr);
                        setCustomTimeInput(timeStr);
                      }
                    }}
                    className={cn(
                      "w-full py-1.5 px-3 rounded-lg border text-center text-[13px] font-medium transition-all",
                      isDis
                        ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-700 bg-slate-50/50 cursor-not-allowed"
                        : "border-slate-200 dark:border-slate-700/80 bg-white dark:bg-surface text-slate-700 dark:text-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-2xs"
                    )}
                  >
                    {timeStr}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}

function SapField({
  field,
  value = "",
  onChange,
  onFileChange,
  inputRef,
  disabledOptions = [],
}: {
  field: FieldSpec;
  value?: string;
  onChange?: (value: string) => void;
  onFileChange?: (file: File | null) => void;
  inputRef?: Ref<HTMLInputElement>;
  disabledOptions?: string[];
}) {
  const {
    label,
    type = "text",
    options,
    placeholder,
  } = field;

  return (
    <div>
      <label className={LABEL}>{label}</label>

      {type === "datetime" ? (
        <TransitDateTimePicker
          value={value}
          onChange={onChange}
          placeholder={placeholder ?? `Select ${label}`}
        />
      ) : type === "date" ? (
        <GateDatePicker
          value={value}
          onChange={(_, str) => onChange?.(str)}
          placeholder={placeholder ?? `Select ${label}`}
          className={INPUT_NORMAL}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => {
            if (disabledOptions.includes(e.target.value)) return;
            onChange?.(e.target.value);
          }}
          className={INPUT_NORMAL}
        >
          <option value="">Select</option>
          {options?.map((option) => (
            <option
              key={option}
              value={option}
              disabled={disabledOptions.includes(option)}
            >
              {option}
            </option>
          ))}
        </select>
      ) : type === "file" ? (
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onFileChange?.(e.target.files?.[0] ?? null)}
          className={INPUT_NORMAL + " py-1.5"}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder ?? `Enter ${label}`}
          className={INPUT_NORMAL}
        />
      )}
    </div>
  );
}