import { useEffect, useState, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Check,
  X as XIcon,
  Eye,
  FileText,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const READONLY_INPUT =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";
// SAP fetched & has value → GREEN, readonly (matches order-info-sap-create.tsx)
const INPUT_SAP_FILLED =
  "h-7 w-full rounded-md bg-emerald-50 border-2 border-emerald-400 px-2 text-[12px] text-emerald-900 font-semibold outline-none cursor-not-allowed";
// SAP fetched but empty → RED, editable (matches order-info-sap-create.tsx)
const INPUT_SAP_EMPTY =
  "h-7 w-full rounded-md bg-red-50 border-2 border-red-400 px-2 text-[12px] text-foreground font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-300";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

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

  // Invoice Number allows only one selection: picking an option replaces the current
  // value (instead of adding to it), and closes the dropdown; clicking the already
  // selected option clears it.
  const toggle = (v: string) => {
    if (selected.includes(v)) {
      onChange("");
      return;
    }
    onChange(v);
    setOpen(false);
    setSearch("");
  };

  const displayLabel = () => {
    if (selected.length === 0) return "";
    return selected[0];
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
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted-foreground">No options</div>
          ) : (
            filtered.map((o) => (
              <div
                key={o}
                onClick={() => toggle(o)}
                className={
                  "px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted cursor-pointer truncate" +
                  (selected.includes(o) ? " bg-accent/10 font-semibold" : "")
                }
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

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

/** Label with optional green "From SAP" badge (matches order-info-sap-create.tsx) */
function FieldLabel({ label, fromSap }: { label: string; fromSap: boolean }) {
  return (
    <label className={LABEL}>
      {label}
      {fromSap && (
        <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 leading-tight align-middle">
          From SAP
        </span>
      )}
    </label>
  );
}

// Matches Angular's segmentInfo.searchOptions exactly (key -> API payload key)
const SEARCH_OPTIONS = [
  { key: "ref_no", label: "Reference No" },
  { key: "inv_no", label: "Invoice No" },
  { key: "odn_no", label: "ODN No" },
  { key: "so_no", label: "SO No" },
  { key: "lr_no", label: "LR No" },
];

const TAT_TYPES = [
  "Direct Truck TAT(Vizag)",
  "Direct Truck TAT(Hyd)",
  "Revised TAT",
  "Safe Express TAT",
  "Delivery TAT",
  "GATI TAT",
];

// ── Types ────────────────────────────────────────────────────────────────────
type TableRow = {
  MAPID: any;
  referenceNumber: string;
  workOrderNumber: string;
  lrNumber: string;
  transporter: string;
  soNumber: string;
  odnNumber: string;
  // Angular's save payload reads SONO/ODN_NO (never populated by the fetch,
  // which fills soNumber/odnNumber instead) — kept here to faithfully mirror
  // that existing behaviour rather than silently "fixing" it.
  SONO: string;
  ODN_NO: string;
  lineNumber: string;
  selected: boolean;
  lrOptions?: string[];
  compInvoices?: string[];
  notAllowed?: boolean;
};

const EMPTY_ROW = (): TableRow => ({
  MAPID: "",
  referenceNumber: "",
  workOrderNumber: "",
  lrNumber: "",
  transporter: "",
  soNumber: "",
  odnNumber: "",
  SONO: "",
  ODN_NO: "",
  lineNumber: "",
  selected: false,
  lrOptions: [],
  compInvoices: [],
  notAllowed: false,
});

type FormState = {
  SALE_PERSON: string;
  SEGMENT: string;
  APPTYP: any; // string (SAP readonly) or {APPTYP,DESC} object (dropdown-selected)
  CUST_PROF: string;
  BRANCH: string;
  BRANCH_ZONE: string;
  ZSTATE: string;
  ZZONE: string;
  TAT_Type: string;
  TAT_DAYS: string;
  ETA_DATE: string;
  INV_VBELN: string;
};

const EMPTY_FORM: FormState = {
  SALE_PERSON: "",
  SEGMENT: "",
  APPTYP: "",
  CUST_PROF: "",
  BRANCH: "",
  BRANCH_ZONE: "",
  ZSTATE: "",
  ZZONE: "",
  TAT_Type: "",
  TAT_DAYS: "",
  ETA_DATE: "",
  INV_VBELN: "",
};

type ShowF4 = {
  SALE_PERSON: boolean;
  SEGMENT: boolean;
  CUST_PROF: boolean;
  APPTYP: boolean;
};

const ALL_F4_ON: ShowF4 = { SALE_PERSON: true, SEGMENT: true, CUST_PROF: true, APPTYP: true };
const ALL_F4_OFF: ShowF4 = { SALE_PERSON: false, SEGMENT: false, CUST_PROF: false, APPTYP: false };

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch {
    return "";
  }
}

const REF_FIELDS = ["referenceNumber", "workOrderNumber", "lrNumber", "transporter"] as const;
const REF_FIELD_KEY: Record<(typeof REF_FIELDS)[number], "REF_NO" | "WORK_ORDER_NO" | "LR_NO" | "TRANSPORTER"> = {
  referenceNumber: "REF_NO",
  workOrderNumber: "WORK_ORDER_NO",
  lrNumber: "LR_NO",
  transporter: "TRANSPORTER",
};

export function SegmentInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const isSap = !isWithout;
  const navigate = useNavigate();

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

  // ── Reference table ──
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);

  // ── Invoice / search bar ──
  const [invoiceNumber, setInvoiceNumber] = useState(""); // SAP-only plain invoice select
  const [invoiceTouched, setInvoiceTouched] = useState(false);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // ── Form ──
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(isWithout);
  const [showF4, setShowF4] = useState<ShowF4>(isWithout ? ALL_F4_ON : ALL_F4_OFF);
  // Snapshot of which secondary fields SAP's GET response actually filled — used only for
  // "From SAP" (green) vs "manually entered" (red) colouring, mirrors order-info-sap-create.tsx.
  const [sapAuxFilled, setSapAuxFilled] = useState<Set<string>>(new Set());

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
      refNo: row.referenceNumber || "",
      invoices: row.compInvoices || [],
    });
    setCompInvoicesModalOpen(true);
  };

  // ── F4 master data ──
  const [supplierList, setSupplierList] = useState<any[]>([]);
  const [segmentList, setSegmentList] = useState<any[]>([]);
  const [custGrpList, setCustGrpList] = useState<any[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [appTypeList, setAppTypeList] = useState<any[]>([]);

  // ── Loading ──
  const [loadingGet, setLoadingGet] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const setField = (key: keyof FormState, value: any) => setForm((p) => ({ ...p, [key]: value }));

  // Reset everything when SAP/Non-SAP mode toggles — mirrors Angular's onSapTypeChange()
  useEffect(() => {
    setForm(EMPTY_FORM);
    setTableData([EMPTY_ROW()]);
    setInvoiceF4List([]);
    setFullReferenceData([]);
    setSearchResults([]);
    setInvoiceNumber("");
    setInvoiceTouched(false);
    setSearchType("");
    setSearchValue("");
    setSapAuxFilled(new Set());
    setCompInvoicesModalOpen(false);
    setCompInvoicesModalData({ refNo: "", invoices: [] });
    if (isWithout) {
      setShowF4(ALL_F4_ON);
      setShowForm(true);
    } else {
      setShowF4(ALL_F4_OFF);
      setShowForm(false);
    }
  }, [isWithout]);

  // F4 dropdown master data — service.getssc()
  useEffect(() => {
    (async () => {
      try {
        const res: any = await service.getssc();
        const data: any = Array.isArray(res) && res.length > 0 ? res[0] : {};
        setSupplierList(data.SUPPLIERS || []);
        setSegmentList(data.SEGMENTS || []);
        setCustGrpList(data.CUST_PROF || []);
        setBranchList(data.BRANCH || []);
        setAppTypeList(data.APP_TYPE || []);
      } catch (err) {
        console.error("F4 fetch error", err);
        Swal.fire("Error", "Failed to load master dropdown data (F4).", "error");
      }
    })();
  }, []);

  // ── Reference row population (shared by blur-lookup) ──
  const populateReferenceRows = (data: any[]) => {
    if (data && data.length > 0) {
      setFullReferenceData(data);
      const f4: string[] = [];
      const rows: TableRow[] = data.map((d: any) => {
        if (d.INV_NO && Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
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

        let initialLr = "";
        if (Array.isArray(d.LR_NO)) {
          initialLr = lrOptions.join(",");
        } else if (typeof d.LR_NO === "string") {
          initialLr = d.LR_NO;
        }

        return {
          MAPID: d.MAPID,
          referenceNumber: d.REF_NO || d.referenceNumber || "",
          workOrderNumber: d.WORK_ORDER_NO || d.workOrderNumber || "",
          lrNumber: initialLr || d.lrNumber || "",
          transporter: d.TRANSPORTER || d.transporter || "",
          soNumber: d.SO_NO || d.soNumber || "",
          odnNumber: d.ODN_NO || d.odnNumber || "",
          SONO: "",
          ODN_NO: "",
          lineNumber: d.LINE_NO || d.ZLINE_NO || d.lineNumber || "",
          selected: false,
          lrOptions,
          compInvoices,
          notAllowed: isNotAllowed,
        };
      });
      setInvoiceF4List(f4);
      setField("INV_VBELN", "");
      setTableData(rows);
    } else {
      setFullReferenceData([]);
      setInvoiceF4List([]);
      Swal.fire({
        icon: "info",
        title: "No Records Found",
        text: "No matching reference details were found.",
        timer: 1500,
        showConfirmButton: false,
        width: "300px",
      });
      setTableData([EMPTY_ROW()]);
    }
  };

  // ── Row 0 field blur/enter/tab -> global reference lookup ──
  const onRowFieldCommit = async (index: number, field: (typeof REF_FIELDS)[number]) => {
    if (index !== 0) return;
    const row = tableData[0];

    if (!row.referenceNumber && !row.workOrderNumber && !row.lrNumber && !row.transporter) {
      setTableData([EMPTY_ROW()]);
      return;
    }

    const fieldKey = REF_FIELD_KEY[field];
    const obj = {
      global_scr: "SEGMENT INFO",
      REF_NO: fieldKey === "REF_NO" ? row.referenceNumber : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? row.workOrderNumber : "",
      LR_NO: fieldKey === "LR_NO" ? row.lrNumber : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? row.transporter : "",
      LINE_NO: row.lineNumber || "",
    };

    try {
      const res: any = isSap
        ? await service.GlobalReferenceNoFetch(obj)
        : await service.GlobalReferenceNoFetchwithoutsap(obj);
      populateReferenceRows(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("GlobalReference fetch error:", err);
    }
  };

  const handleRowChange = (index: number, field: (typeof REF_FIELDS)[number], value: string) => {
    setTableData((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };

  const recomputeInvoiceList = (rows: TableRow[]) => {
    const selectedRows = rows.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      setInvoiceF4List([]);
      setField("INV_VBELN", "");
      return;
    }
    const selectedMapIds = new Set(selectedRows.map((r) => r.MAPID));
    const f4: string[] = [];
    fullReferenceData.forEach((refItem) => {
      if (selectedMapIds.has(refItem.MAPID) && Array.isArray(refItem.INV_NO)) {
        refItem.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
        });
      }
    });
    setInvoiceF4List(f4);
    setField("INV_VBELN", "");
  };

  const toggleRowSelect = (index: number) => {
    const row = tableData[index];
    if (row?.notAllowed) return;
    setTableData((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r));
      recomputeInvoiceList(next);
      return next;
    });
  };

  const removeRow = (index: number) => {
    if (tableData.length === 1) return;
    setTableData((prev) => {
      const next = prev.filter((_, i) => i !== index);
      recomputeInvoiceList(next);
      return next;
    });
  };

  // ── SAP: GET invoice ──
  const patchForm = (data: any) => {
    setForm((p) => ({
      ...p,
      INV_VBELN: data.INV_NUM || "",
      SALE_PERSON: data.SALE_PERSON || "",
      SEGMENT: data.SEGMENT || "",
      APPTYP: data.APPTYP || "",
      CUST_PROF: data.CUST_PROFILE || "",
      BRANCH: data.BRANCH || "",
      BRANCH_ZONE: data.BRANCH_ZONE || "",
      ZSTATE: data.ZSTATE || "",
      ZZONE: data.ZZONE || "",
      TAT_Type: data.TAT_TYPE || "",
      TAT_DAYS: data.TAT || "",
      ETA_DATE: data.ETA || "",
    }));
    setShowF4({
      SALE_PERSON: !data.SALE_PERSON,
      SEGMENT: !data.SEGMENT,
      CUST_PROF: !data.CUST_PROFILE,
      APPTYP: !data.APPTYP,
    });
    const auxFilled = new Set<string>();
    if (data.BRANCH) auxFilled.add("BRANCH");
    if (data.BRANCH_ZONE) auxFilled.add("BRANCH_ZONE");
    if (data.ZSTATE) auxFilled.add("ZSTATE");
    if (data.TAT_TYPE) auxFilled.add("TAT_Type");
    if (data.TAT) auxFilled.add("TAT_DAYS");
    if (data.ETA) auxFilled.add("ETA_DATE");
    setSapAuxFilled(auxFilled);
    setShowForm(true);
  };

  const handleGet = async () => {
    // 1. Split multiple invoice numbers entered/selected by comma
    const selectedInvoiceNumbers = invoiceNumber
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (selectedInvoiceNumbers.length === 0) return;

    // 2. Identify candidate reference rows
    const candidateRows = tableData.filter((row) => row.referenceNumber);
    const selectedRows = candidateRows.filter((row) => row.selected);
    const activeRefs = selectedRows.length > 0 ? selectedRows : candidateRows;

    // 3. Map each selected invoice number to its owner reference row
    const invGetPayload = selectedInvoiceNumbers.map((inv, idx) => {
      const ownerRef = activeRefs.find((refItem: any) => {
        const raw = fullReferenceData.find(
          (f: any) =>
            (refItem.MAPID && String(f.MAPID) === String(refItem.MAPID)) ||
            (refItem.referenceNumber && String(f.REF_NO) === String(refItem.referenceNumber))
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

      const matchedRef = ownerRef || (activeRefs.length === selectedInvoiceNumbers.length ? activeRefs[idx] : activeRefs[0]);

      return {
        INVOICE: inv,
        ZREFNO: matchedRef?.referenceNumber || matchedRef?.REF_NO || "",
        ZLINE_NO: matchedRef?.lineNumber || matchedRef?.LINE_NO || "",
      };
    });

    setLoadingGet(true);
    try {
      const res: any = await service.SegmentInfoOutwardFetch({
        INV_GET: invGetPayload,
        SCREEN: "WITHSAP",
      });
      if (res && res.length > 0) {
        patchForm(res[0]);
        setSearchResults([]);
        Swal.fire("Success", "Invoice Details fetched successfully!", "success");
      } else {
        Swal.fire("No data found", "", "info");
      }
    } catch {
      Swal.fire("Error fetching SAP data", "", "error");
    } finally {
      setLoadingGet(false);
    }
  };

  // ── Non-SAP: invoice select change ──
  const onInvoiceChange = async (invNo: string) => {
    setField("INV_VBELN", invNo);
    if (!invNo) return;

    // 1. Split multiple invoice numbers entered/selected by comma
    const selectedInvoiceNumbers = invNo
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (selectedInvoiceNumbers.length === 0) return;

    const candidateRows = tableData.filter((row) => row.referenceNumber);
    const selectedRows = candidateRows.filter((row) => row.selected);
    const activeRefs = selectedRows.length > 0 ? selectedRows : candidateRows;

    const invGetPayload = selectedInvoiceNumbers.map((inv, idx) => {
      const ownerRef = activeRefs.find((refItem: any) => {
        const raw = fullReferenceData.find(
          (f: any) =>
            (refItem.MAPID && String(f.MAPID) === String(refItem.MAPID)) ||
            (refItem.referenceNumber && String(f.REF_NO) === String(refItem.referenceNumber))
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

      const matchedRef = ownerRef || (activeRefs.length === selectedInvoiceNumbers.length ? activeRefs[idx] : activeRefs[0]);

      return {
        INVOICE: inv,
        ZREFNO: matchedRef?.referenceNumber || matchedRef?.REF_NO || "",
        ZLINE_NO: matchedRef?.lineNumber || matchedRef?.LINE_NO || "",
      };
    });

    try {
      const res: any = await service.SegmentInfoOutwardwithoutSapFetch({
        INV_GET: invGetPayload,
        SCREEN: "WITHOUTSAP",
      });
      if (res?.STATUS === "FALSE") {
        Swal.fire("Error", res?.MESSAGE || "Error fetching invoice details", "error");
      } else if (res) {
        const data = Array.isArray(res) ? res[0] : res;
        setForm((p) => ({ ...p, ZSTATE: data.ZSTATE || "", ZZONE: data.ZZONE || "" }));
      } else {
        Swal.fire("No Data Found", "", "info");
      }
    } catch (err: any) {
      Swal.fire("Error", err?.error?.MESSAGE || "Error fetching invoice details", "error");
    }
  };

  // ── Branch -> Zone ──
  const fetchZoneChange = async (branchDesc: string) => {
    setField("BRANCH", branchDesc);
    if (!branchDesc) {
      setField("BRANCH_ZONE", "");
      return;
    }
    try {
      const res: any = await service.fetchzoneTat({ STATE: branchDesc });
      setField("BRANCH_ZONE", res?.ZZONE || "");
    } catch (err) {
      console.error("Error fetching Zone:", err);
      Swal.fire("Error fetching Zone details", "", "error");
      setField("BRANCH_ZONE", "");
    }
  };

  // ── TAT Type -> TAT Days / ETA ──
  const onTatTypeChange = async (tatType: string) => {
    setField("TAT_Type", tatType);
    const invNo = invoiceNumber || form.INV_VBELN || "";
    const payload: any = { BRANCH: form.ZSTATE, BRANCH_ZONE: form.ZZONE, TAT_TYPE: tatType };
    if (isSap) payload.VBELN = invNo;
    else payload.INV_NO = invNo;

    try {
      const res: any = isSap ? await service.fetchTAT(payload) : await service.fetchNonSapTAT(payload);
      if (res?.TAT || res?.ETA) {
        setForm((p) => ({ ...p, TAT_DAYS: res.TAT || "", ETA_DATE: res.ETA || "" }));
      } else {
        Swal.fire("No TAT data found for selected type", "", "info");
      }
    } catch {
      Swal.fire("Error fetching TAT details", "", "error");
    }
  };

  // ── Global Search ──
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      Swal.fire("Please enter a value", "", "warning");
      return;
    }
    if (!searchType) {
      Swal.fire("Please select a search type", "", "info");
      return;
    }

    const payload: any = {
      global: "SEGMENT INFO",
      ZUSER: getLoggedInUser(),
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
    payload.data[searchType] = searchValue.trim();

    setLoadingSearch(true);
    try {
      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        setSearchResults([]);
        Swal.fire("", res.MESSAGE, "warning");
      } else if (!res?.HEADER || res.HEADER.length === 0) {
        setSearchResults([]);
        Swal.fire("No records found", "", "info");
      } else {
        setSearchResults(res.HEADER.map((item: any) => ({ ...item, isEdit: false })));
        setShowForm(false);
        Swal.fire("Data fetched successfully!", "", "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error fetching data", "", "error");
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── Search result row edit/update/delete ──
  const editSearchRow = (index: number) => {
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, _backup: { ...r }, isEdit: true } : r)));
  };
  const cancelSearchEdit = (index: number) => {
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r._backup, isEdit: false } : r)));
  };
  const updateSearchField = (index: number, key: string, value: any) => {
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)));
  };
  const updateSearchBranch = async (index: number, branchDesc: string) => {
    updateSearchField(index, "ZBRANCH", branchDesc);
    if (!branchDesc) {
      updateSearchField(index, "ZBRANCH_ZONE", "");
      return;
    }
    try {
      const res: any = await service.fetchzoneTat({ STATE: branchDesc });
      updateSearchField(index, "ZBRANCH_ZONE", res?.ZZONE || "");
    } catch (err) {
      console.error("Error fetching Zone for branch:", err);
    }
  };

  const updateSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    if (!row.ZREFNO || !row.ZLINE_NO) {
      Swal.fire("Error", "Missing mandatory keys (ZREFNO / ZLINE_NO)", "error");
      return;
    }

    const changePayload = {
      ZREFNO: String(row.ZREFNO),
      ZLINE_NO: String(row.ZLINE_NO),
      ZINV_NUM: row.ZINV_NUM || "",
      ZODN_NO: row.ZODN_NO || "",
      ZSO_NO: row.ZSO_NO || "",
      ZSALE_PERSON: row.ZSALE_PERSON || "",
      ZSEGMENT: row.ZSEGMENT || "",
      ZAPPTYP: row.ZAPPTYP || "",
      ZCUST_PROFILE: row.ZCUST_PROFILE || "",
      ZBRANCH: row.ZBRANCH || "",
      ZBRANCH_ZONE: row.ZBRANCH_ZONE || "",
      ZTAT_TYPE: row.ZTAT_TYPE || "",
      ZTAT: String(row.ZTAT || ""),
      ZETA: row.ZETA || "",
      ZWORK_ORDER: row.ZWORK_ORDER || "",
      ZLRNO: row.ZLRNO || "",
      ZTRANSPORTER: row.ZTRANSPORTER || "",
      ZCREATED_DT: row.ZCREATED_DT || "",
      ZPLANT: row.ZPLANT || "",
      ZDIVISION: row.ZDIVISION || "",
      ZVEH_TYPE: row.ZVEH_TYPE || "",
      ZUSER: row.ZUSER,
      ZUSER_CH: getLoggedInUser(),
    };

    try {
      const res: any = isSap
        ? await service.SegmentInfoChangeWithSap({ CHANGE: [changePayload] })
        : await service.SegmentInfoChangeWithoutSap({ CHANGE: [changePayload] });

      if (res?.STATUS === "TRUE" || res?.NUMBER === "200") {
        await Swal.fire({
          title: "Success",
          text: res.MESSAGE || "Data updated successfully",
          icon: "success",
          confirmButtonText: "Ok",
        });
        setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, isEdit: false } : r)));
        handleSearch();
      } else {
        Swal.fire({ title: "Error", text: res?.MESSAGE || "Update failed", icon: "error" });
      }
    } catch {
      Swal.fire("Error", "Internal Server Error", "error");
    }
  };

  const deleteSearchRow = async (row: any, index: number) => {
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

    const payload = { DELETE: [{ ZREFNO: row.ZREFNO, ZINV_NO: row.ZINV_NUM, ZLINE_NO: row.ZLINE_NO }] };
    try {
      const res: any = isSap
        ? await service.SegmentInfoDeleteWithSap(payload)
        : await service.SegmentInfoDeleteWithoutSap(payload);

      if (res?.STATUS === "TRUE" || res?.STATUS === true) {
        setSearchResults((prev) => prev.filter((_, i) => i !== index));
        Swal.fire({ title: "Deleted", text: res.MESSAGE || "Record deleted successfully", icon: "success", confirmButtonText: "Ok" });
      } else {
        Swal.fire({ title: "Failed", text: res?.MESSAGE || "Delete failed", icon: "error" });
      }
    } catch (err: any) {
      console.error("Delete Error:", err);
      Swal.fire({ title: "Error", text: err?.error?.MESSAGE || "Something went wrong while deleting", icon: "error" });
    }
  };

  // ── Save ──
  const requiredFieldsMissing = () =>
    !form.INV_VBELN || !form.SALE_PERSON || !form.SEGMENT || !form.APPTYP || !form.BRANCH;

  const handleSave = async (action: "stay" | "next" | "previous" = "stay") => {
    if (requiredFieldsMissing()) {
      Swal.fire({ title: "Validation Error", text: "Please fill all required fields before saving.", icon: "warning", confirmButtonText: "Ok" });
      return;
    }

    const selectedItems = tableData.filter((r) => r.selected);
    if (selectedItems.length === 0) {
      Swal.fire({ icon: "warning", text: "Please select at least one reference row before saving" });
      return;
    }

    const loggedInUser = getLoggedInUser();
    const apptypDesc = (form.APPTYP && typeof form.APPTYP === "object" ? form.APPTYP.DESC : undefined) ?? form.APPTYP;

    setLoadingSave(true);
    try {
      let res: any;
      if (isSap) {
        const saveArray = selectedItems.map((item) => ({
          REFNO: item.referenceNumber || 0,
          WORK_ORDER: item.workOrderNumber || "",
          LRNO: item.lrNumber || "",
          TRANSPORTER: item.transporter || "",
          LINE_NO: item.lineNumber || "",
          SO_NO: item.SONO || "",
          ODN_NO: item.ODN_NO || "",
          INV_NUM: form.INV_VBELN || invoiceNumber || "",
          SALE_PERSON: form.SALE_PERSON || "",
          SEGMENT: form.SEGMENT || "",
          APPTYP: apptypDesc || "",
          CUST_PROFILE: form.CUST_PROF || "",
          BRANCH: form.BRANCH || "",
          BRANCH_ZONE: form.BRANCH_ZONE || "",
          ZSTATE: form.ZSTATE || "",
          ZZONE: form.ZZONE || "",
          TAT_TYPE: form.TAT_Type || "",
          TAT: form.TAT_DAYS || "",
          ETA: form.ETA_DATE || "",
          ZUSER: loggedInUser,
          ZUSER_CH: "",
        }));
        res = await service.SegmentInfoOutwardSave({ SAVE: saveArray });
      } else {
        const createArray = selectedItems.map((item) => ({
          REFNO: item.referenceNumber || 0,
          LINE_NO: item.lineNumber || "",
          WORK_ORDER: item.workOrderNumber || "",
          LRNO: item.lrNumber || "",
          TRANSPORTER: item.transporter || "",
          SONO: item.SONO || "",
          ODN_NO: item.ODN_NO || "",
          INV_NUM: form.INV_VBELN || invoiceNumber || "",
          SALES_EMP: form.SALE_PERSON || "",
          SEGMENT: form.SEGMENT || "",
          APPTYP: apptypDesc || "",
          CUST_PROF: form.CUST_PROF || "",
          BRANCH: form.BRANCH || "",
          BRANCH_ZONE: form.BRANCH_ZONE || "",
          ZSTATE: form.ZSTATE || "",
          ZZONE: form.ZZONE || "",
          TAT_TYPE: form.TAT_Type || "",
          TAT: form.TAT_DAYS || "",
          ETA: form.ETA_DATE || "",
        }));
        res = await service.SegmentInfoNonSap({ CREATE: createArray });
      }

      if (res?.STATUS === "true" || res?.NUMBER === "200") {
        await Swal.fire({ title: "Success", text: res.MESSAGE, icon: "success", confirmButtonText: "Ok" });
        if (action === "next") {
          navigate({ to: "/transit-info" });
        } else if (action === "previous") {
          navigate({ to: "/shipment-details" });
        } else {
          setForm(EMPTY_FORM);
          setTableData([EMPTY_ROW()]);
          setInvoiceNumber("");
          setInvoiceF4List([]);
          setFullReferenceData([]);
          setShowForm(isSap ? false : true);
        }
      } else {
        Swal.fire({ text: res?.MESSAGE, icon: "warning", confirmButtonText: "Ok" });
      }
    } catch {
      Swal.fire(isSap ? "Server error while saving" : "Error saving Non-SAP data", "", "error");
    } finally {
      setLoadingSave(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────
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
            {tableData.map((row, i) => {
              const isRowDisabled = Boolean(row.notAllowed);
              return (
                <tr
                  key={i}
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
                      onChange={() => toggleRowSelect(i)}
                      className={
                        "size-4 accent-sky-600 " +
                        (isRowDisabled ? "cursor-not-allowed opacity-30" : "cursor-pointer")
                      }
                    />
                  </td>
                  <td className="px-3 py-0.5 text-center font-mono">{i + 1}</td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.referenceNumber}
                      readOnly={i !== 0 || isRowDisabled}
                      maxLength={10}
                      placeholder="Enter Ref. No."
                      onChange={(e) => handleRowChange(i, "referenceNumber", e.target.value)}
                      onBlur={() => onRowFieldCommit(i, "referenceNumber")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "referenceNumber");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed"
                          : i !== 0
                          ? READONLY_INPUT
                          : GREEN_INPUT) + " text-center"
                      }
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.workOrderNumber}
                      readOnly={i !== 0 || isRowDisabled}
                      placeholder="Enter Work Order No."
                      onChange={(e) => handleRowChange(i, "workOrderNumber", e.target.value)}
                      onBlur={() => onRowFieldCommit(i, "workOrderNumber")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "workOrderNumber");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed"
                          : i !== 0
                          ? READONLY_INPUT
                          : GREEN_INPUT) + " text-center"
                      }
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    {row.lrOptions && row.lrOptions.length > 0 ? (
                      <TableMultiSelect
                        options={row.lrOptions}
                        value={row.lrNumber}
                        readOnly={isRowDisabled}
                        onChange={(val) => handleRowChange(i, "lrNumber", val)}
                        placeholder="Select LR No"
                        className={
                          (isRowDisabled
                            ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-pointer"
                            : i !== 0
                            ? READONLY_INPUT
                            : GREEN_INPUT) + " text-center"
                        }
                      />
                    ) : (
                      <input
                        value={row.lrNumber}
                        readOnly={i !== 0 || isRowDisabled}
                        placeholder="Enter LR No."
                        onChange={(e) => handleRowChange(i, "lrNumber", e.target.value)}
                        onBlur={() => onRowFieldCommit(i, "lrNumber")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "lrNumber");
                        }}
                        className={
                          (isRowDisabled
                            ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed"
                            : i !== 0
                            ? READONLY_INPUT
                            : GREEN_INPUT) + " text-center"
                        }
                      />
                    )}
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.transporter}
                      readOnly={i !== 0 || isRowDisabled}
                      placeholder="Enter Transporter"
                      onChange={(e) => handleRowChange(i, "transporter", e.target.value)}
                      onBlur={() => onRowFieldCommit(i, "transporter")}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "transporter");
                      }}
                      className={
                        (isRowDisabled
                          ? "h-7 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed"
                          : i !== 0
                          ? READONLY_INPUT
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
                    {tableData.length > 1 && !isRowDisabled && (
                      <button
                        onClick={() => removeRow(i)}
                        className="inline-grid place-items-center size-7 rounded-md text-red-500 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
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
          {isSap && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={LABEL}>Invoice Number</label>
                <F4MultiSelect
                  options={invoiceF4List}
                  value={invoiceNumber}
                  onChange={setInvoiceNumber}
                  onBlur={() => setInvoiceTouched(true)}
                  placeholder="Select Invoice"
                  className={GREEN_INPUT}
                />
              </div>
              <button
                onClick={handleGet}
                disabled={!invoiceNumber.trim() || loadingGet}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm flex items-center gap-1.5"
              >
                GET
              </button>
            </>
          )}
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
            >
              <option value="">Select</option>
              {SEARCH_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button
              onClick={handleSearch}
              disabled={loadingSearch}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta disabled:opacity-50"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {isSap && !showForm && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {/* ── Colour legend (only shown after SAP GET) ── */}
      {isSap && showForm && (
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

      {/* Search results table */}
      {searchResults.length > 0 && (
        <div className="max-h-[560px] overflow-auto">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  {["Ref No", "Invoice No", "Line No", "ODN No", "SO NO", "Sales Person", "Segment", "Application Type",
                    "Customer Profile", "Branch", "Branch Zone", "Work Order", "LR No",
                    "Transporter", "Plant", "Division", "Created Date", "Vehicle Type", "Action"].map((h) => (
                      <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {searchResults.map((item, i) => (
                  <tr
                    key={i}
                    className={
                      i % 2 === 0
                        ? "bg-surface hover:bg-muted/50"
                        : "bg-surface-2/40 hover:bg-muted/50"
                    }
                  >
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZINV_NUM}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>
                    {[
                      { field: "ZODN_NO", type: "text" },
                      { field: "ZSO_NO", type: "text" },
                      {
                        field: "ZSALE_PERSON",
                        type: "select",
                        // Same list the create form's Sales Person dropdown uses (supplierList),
                        // plus the fetched value itself so it's never missing from the list.
                        options: Array.from(new Set([...supplierList.map((s: any) => s.SUPPLIER_NAME), item.ZSALE_PERSON].filter(Boolean))),
                      },
                      {
                        field: "ZSEGMENT",
                        type: "select",
                        options: Array.from(new Set([...segmentList.map((s: any) => s.SEGMENT_DESC || s.SEGMENT || String(s)), item.ZSEGMENT].filter(Boolean))),
                      },
                      {
                        field: "ZAPPTYP",
                        type: "select",
                        options: Array.from(new Set([...appTypeList.map((a: any) => a.DESC || a.APPTYP || (typeof a === "object" ? a.APPTYP : String(a))), typeof item.ZAPPTYP === "object" ? item.ZAPPTYP?.DESC || item.ZAPPTYP?.APPTYP : item.ZAPPTYP].filter(Boolean))),
                      },
                      {
                        field: "ZCUST_PROFILE",
                        type: "select",
                        options: Array.from(new Set([...custGrpList.map((c: any) => c.CUST_PROF_DESC || c.CUST_PROF || String(c)), item.ZCUST_PROFILE].filter(Boolean))),
                      },
                      {
                        field: "ZBRANCH",
                        type: "branch",
                        options: Array.from(new Set([...branchList.map((b: any) => b.BRANCH_DESC || b.BRANCH || String(b)), item.ZBRANCH].filter(Boolean))),
                      },
                      { field: "ZBRANCH_ZONE", type: "text" },
                      // { field: "ZTAT_TYPE", type: "text" },
                      // { field: "ZTAT", type: "text" },
                      // { field: "ZETA", type: "date" },
                      { field: "ZWORK_ORDER", type: "text", readonly: true },
                      { field: "ZLRNO", type: "text", readonly: true },
                      { field: "ZTRANSPORTER", type: "text", readonly: true },
                      {
                        field: "ZPLANT",
                        type: "select",
                        options: Array.from(new Set([...(currentUser.PLANTS || []).map((p: any) => typeof p === "string" ? p : p?.PLANT || p?.PLANT_NAME || String(p)), item.ZPLANT].filter(Boolean))),
                      },
                      {
                        field: "ZDIVISION",
                        type: "select",
                        options: Array.from(new Set([...(currentUser.DIV || []).map((d: any) => typeof d === "string" ? d : d?.DIVISION || d?.DIV || String(d)), item.ZDIVISION].filter(Boolean))),
                      },
                      { field: "ZCREATED_DT", type: "date", readonly: true },
                      { field: "ZVEH_TYPE", type: "text", readonly: true },
                    ].map(({ field, type, options, readonly }: any) => (
                      <td key={field} className="px-2 py-1 whitespace-nowrap">
                        {item.isEdit && !readonly ? (
                          type === "select" ? (
                            <select
                              value={typeof item[field] === "object" ? item[field]?.DESC || item[field]?.APPTYP || "" : item[field] || ""}
                              onChange={(e) => updateSearchField(i, field, e.target.value)}
                              className="h-6 min-w-[100px] rounded border border-input px-1 text-[11px] bg-white dark:bg-surface"
                            >
                              <option value="">Select</option>
                              {options?.map((o: string) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : type === "branch" ? (
                            <select
                              value={item[field] || ""}
                              onChange={(e) => updateSearchBranch(i, e.target.value)}
                              className="h-6 min-w-[110px] rounded border border-input px-1 text-[11px] bg-white dark:bg-surface"
                            >
                              <option value="">Select Branch</option>
                              {options?.map((o: string) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={type}
                              value={item[field] || ""}
                              onChange={(e) => updateSearchField(i, field, e.target.value)}
                              className="h-6 w-24 rounded border border-input px-1 text-[11px] bg-white"
                            />
                          )
                        ) : (
                          <span>
                            {type === "date" && item[field]
                              ? new Date(item[field]).toLocaleDateString("en-GB")
                              : typeof item[field] === "object"
                              ? item[field]?.DESC || item[field]?.APPTYP || ""
                              : item[field] || ""}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center">
                      {!item.isEdit ? (
                        <div className="flex items-center gap-1 justify-center">
                          <button onClick={() => editSearchRow(i)} className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                            <Pencil className="size-3.5" />
                          </button>
                          <button onClick={() => deleteSearchRow(item, i)} className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100">
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button onClick={() => updateSearchRow(item, i)} className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <Check className="size-3.5" />
                          </button>
                          <button onClick={() => cancelSearchEdit(i)} className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                            <XIcon className="size-3.5" />
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

      {showForm && (
        <>
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">

              {/* Invoice Number (Non-SAP only) */}
              {isWithout && (
                <div>
                  <label className={LABEL}>Invoice Number</label>
                  <F4MultiSelect
                    options={invoiceF4List}
                    value={form.INV_VBELN}
                    onChange={(value) => onInvoiceChange(value)}
                    onBlur={() => setInvoiceTouched(true)}
                    placeholder="Select Invoice Number"
                    className={GREEN_INPUT}
                  />
                  {invoiceTouched && !form.INV_VBELN && (
                    <span className="text-[10px] text-destructive">Invoice Number is required</span>
                  )}
                </div>
              )}

              {/* Sales Person */}
              <div>
                <FieldLabel label="Sales Person" fromSap={!isWithout && !showF4.SALE_PERSON} />
                {isWithout || showF4.SALE_PERSON ? (
                  <select
                    value={form.SALE_PERSON}
                    onChange={(e) => setField("SALE_PERSON", e.target.value)}
                    className={isWithout ? GREEN_INPUT : INPUT_SAP_EMPTY}
                  >
                    <option value="" disabled>Select Sales Person</option>
                    {supplierList.map((s: any, idx: number) => (
                      <option key={idx} value={s.SUPPLIER_NAME}>
                        {s.SUPPLIER} - {s.SUPPLIER_NAME}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={form.SALE_PERSON} readOnly className={INPUT_SAP_FILLED} />
                )}
              </div>

              {/* Segment */}
              <div>
                <FieldLabel label="Segment" fromSap={!isWithout && !showF4.SEGMENT} />
                {isWithout || showF4.SEGMENT ? (
                  <select value={form.SEGMENT} onChange={(e) => setField("SEGMENT", e.target.value)} className={isWithout ? GREEN_INPUT : INPUT_SAP_EMPTY}>
                    <option value="" disabled>Select Segment</option>
                    {segmentList.map((seg: any, idx: number) => (
                      <option key={idx} value={seg.SEGMENT_DESC}>{seg.SEGMENT} - {seg.SEGMENT_DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.SEGMENT} readOnly className={INPUT_SAP_FILLED} />
                )}
              </div>

              {/* Application Type */}
              <div>
                <FieldLabel label="Application Type" fromSap={!isWithout && !showF4.APPTYP} />
                {isWithout || showF4.APPTYP ? (
                  <select
                    value={form.APPTYP && typeof form.APPTYP === "object" ? JSON.stringify(form.APPTYP) : ""}
                    onChange={(e) => {
                      const app = appTypeList.find((a: any) => JSON.stringify(a) === e.target.value);
                      setField("APPTYP", app || "");
                    }}
                    className={isWithout ? GREEN_INPUT : INPUT_SAP_EMPTY}
                  >
                    <option value="">Select Application Type</option>
                    {appTypeList.map((app: any, idx: number) => (
                      <option key={idx} value={JSON.stringify(app)}>{app.APPTYP} - {app.DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={typeof form.APPTYP === "string" ? form.APPTYP : ""} readOnly className={INPUT_SAP_FILLED} />
                )}
              </div>

              {/* Customer Profile */}
              <div>
                <FieldLabel label="Customer Profile" fromSap={!isWithout && !showF4.CUST_PROF} />
                {isWithout || showF4.CUST_PROF ? (
                  <select value={form.CUST_PROF} onChange={(e) => setField("CUST_PROF", e.target.value)} className={isWithout ? GREEN_INPUT : INPUT_SAP_EMPTY}>
                    <option value="">Select Customer Profile</option>
                    {custGrpList.map((c: any, idx: number) => (
                      <option key={idx} value={c.CUST_PROF_DESC}>{c.CUST_PROF} - {c.CUST_PROF_DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.CUST_PROF} readOnly className={INPUT_SAP_FILLED} />
                )}
              </div>

              {/* Branch */}
              <div>
                <FieldLabel label="Branch" fromSap={!isWithout && sapAuxFilled.has("BRANCH")} />
                {!isWithout && sapAuxFilled.has("BRANCH") ? (
                  <input value={form.BRANCH} readOnly className={INPUT_SAP_FILLED} />
                ) : (
                  <select
                    value={form.BRANCH}
                    onChange={(e) => fetchZoneChange(e.target.value)}
                    className={!isWithout && showForm ? INPUT_SAP_EMPTY : GREEN_INPUT}
                  >
                    <option value="">Select Branch (State)</option>
                    {branchList.map((b: any, idx: number) => (
                      <option key={idx} value={b.BRANCH_DESC}>{b.BRANCH_DESC}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Branch Zone */}
              <div>
                <label className={LABEL}>
                  Branch Zone
                  {form.BRANCH_ZONE && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-300 leading-tight align-middle">
                      From Logic
                    </span>
                  )}
                </label>
                <input
                  value={form.BRANCH_ZONE}
                  onChange={(e) => setField("BRANCH_ZONE", e.target.value)}
                  className={
                    form.BRANCH_ZONE
                      ? "h-7 w-full rounded-md bg-violet-50 border-2 border-violet-400 px-2 text-[12px] text-violet-900 font-semibold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300"
                      : GREEN_INPUT
                  }
                />
              </div>

              {/* Destination State */}
              <div>
                <FieldLabel label="Destination State" fromSap={!isWithout && sapAuxFilled.has("ZSTATE")} />
                <input
                  value={form.ZSTATE}
                  readOnly={!isWithout && sapAuxFilled.has("ZSTATE")}
                  onChange={(e) => setField("ZSTATE", e.target.value)}
                  className={
                    !isWithout && sapAuxFilled.has("ZSTATE")
                      ? INPUT_SAP_FILLED
                      : !isWithout && showForm
                        ? INPUT_SAP_EMPTY
                        : GREEN_INPUT
                  }
                />
              </div>

              {/* Destination Zone */}
              <div>
                <label className={LABEL}>
                  Destination Zone
                  {form.ZZONE && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-300 leading-tight align-middle">
                      From Logic
                    </span>
                  )}
                </label>
                <input
                  value={form.ZZONE}
                  onChange={(e) => setField("ZZONE", e.target.value)}
                  className={
                    form.ZZONE
                      ? "h-7 w-full rounded-md bg-violet-50 border-2 border-violet-400 px-2 text-[12px] text-violet-900 font-semibold outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-300"
                      : GREEN_INPUT
                  }
                />
              </div>

              {/* TAT Type */}
              {/* <div>
                <FieldLabel label="TAT Type" fromSap={!isWithout && sapAuxFilled.has("TAT_Type")} />
                {!isWithout && sapAuxFilled.has("TAT_Type") ? (
                  <input value={form.TAT_Type} readOnly className={INPUT_SAP_FILLED} />
                ) : (
                  <select
                    value={form.TAT_Type}
                    onChange={(e) => onTatTypeChange(e.target.value)}
                    className={!isWithout && showForm ? INPUT_SAP_EMPTY : GREEN_INPUT}
                  >
                    <option value="">Select TAT Type</option>
                    {TAT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                )}
              </div> */}

              {/* TAT Days */}
              {/* <div>
                <FieldLabel label="TAT (Days)" fromSap={!isWithout && sapAuxFilled.has("TAT_DAYS")} />
                <input
                  value={form.TAT_DAYS}
                  readOnly={!isWithout && sapAuxFilled.has("TAT_DAYS")}
                  onChange={(e) => setField("TAT_DAYS", e.target.value)}
                  className={
                    !isWithout && sapAuxFilled.has("TAT_DAYS")
                      ? INPUT_SAP_FILLED
                      : !isWithout && showForm
                        ? INPUT_SAP_EMPTY
                        : GREEN_INPUT
                  }
                />
              </div> */}

              {/* ETA */}
              {/* <div>
                <FieldLabel label="ETA" fromSap={!isWithout && sapAuxFilled.has("ETA_DATE")} />
                <input
                  type="date"
                  value={form.ETA_DATE}
                  readOnly={!isWithout && sapAuxFilled.has("ETA_DATE")}
                  onChange={(e) => setField("ETA_DATE", e.target.value)}
                  className={
                    !isWithout && sapAuxFilled.has("ETA_DATE")
                      ? INPUT_SAP_FILLED
                      : !isWithout && showForm
                        ? INPUT_SAP_EMPTY
                        : GREEN_INPUT
                  }
                />
              </div> */}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              onClick={() => handleSave("previous")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
            <button
              onClick={() => handleSave("stay")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              <Save className="size-3.5" /> Save
            </button>
            <button
              onClick={() => handleSave("next")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              Save and Next <ChevronRight className="size-3.5" />
            </button>
          </div>
        </>
      )}

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
    </div>
  );
}
