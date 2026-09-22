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

const searchTypeMap: Record<string, string> = {
  Reference: "REF_NO",
  Invoice: "INV_NO",
  ODN: "ODN_NO",
  "SO Number": "SO_NO",
  "Work Order": "WORKORDER_NO",
  "LR Number": "LR_NO",
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

const labelToKey = (label: string) => {
  switch (label) {
    case "Invoice Date":
      return "INV_DATE";

    case "DC Reference Number":
      return "INV_NO";

    case "FSR Report Date":
      return "FSR_RPT_DT";

    case "Invoice Basic Value":
      return "BASIC_VALUE";

    case "Incident Date":
      return "INC_DATE";

    case "Customer":
      return "CUSTOMER";

    case "C/nee Name":
      return "CONSIGN_NAME";

    case "Damage Remarks":
      return "DAMAGE_RMK";

    case "Settlement":
      return "SETTLEMENT";

    case "Closing Date":
      return "CLOSING_DT";

    default:
      return label;
  }
};

type SearchResult = {
  [key: string]: any;
  isEdit?: boolean;
  _backup?: any;
};
type HeaderData = {
  [key: string]: any;
  isEdit?: boolean;
  _backup?: any;
};

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

// Reads a File as a base64 data URI, with automatic client-side compression for large images
// to prevent 413 Payload Too Large errors while preserving high quality.
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image (e.g. PDF), or if already small (< 1MB), read directly
    if (!file.type.startsWith("image/") || file.size < 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
      return;
    }

    // For large images, scale to max 1920px and compress to avoid 413 Payload Too Large
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxDim = 1920;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
      resolve(canvas.toDataURL(mime, 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    };
    img.src = url;
  });
}

// Show only the file name from a stored document path.
// Show only the file name from a stored document path.
//   "D:\Pravah\SAP\Transit_Damage_Info\Images\1000_5000_dmg1.jpg"
//     -> "1000_5000_dmg1.jpg"
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

// The Images / FSR Report / FIR Report / COF columns hold the base64 only while
// creating; after a fetch they are empty. For those columns we instead show the
// uploaded file name - taken from the folder on disk (ZLOCALFILES), or derived
// from the saved path. Maps the Z-field -> its disk folder key and its path key.
const DOC_LOCAL_KEY: Record<string, string> = {
  ZDIMAGES: "Images",
  ZFSRREP: "FSR_Report",
  ZFIRREP: "FIR_Report",
  ZCOF: "COF",
};
const DOC_PATH_KEY: Record<string, string> = {
  ZDIMAGES: "ZDIMG_PATH",
  ZFSRREP: "ZFSRREP_PATH",
  ZFIRREP: "ZFIRREP_PATH",
  ZCOF: "ZCOF_PATH",
};
function docFileName(headerData: any, field: string): string {
  const localKey = DOC_LOCAL_KEY[field];
  const localFile = headerData?.ZLOCALFILES?.[localKey];
  if (localFile && localFile !== localKey && !KNOWN_FIELD_NAMES.has(localFile)) return localFile;

  const fromPath = fileNameFromPath(headerData?.[DOC_PATH_KEY[field]]);
  if (fromPath && fromPath !== field && fromPath !== localKey && !KNOWN_FIELD_NAMES.has(fromPath)) return fromPath;

  const raw = headerData?.[field];
  if (raw && typeof raw === "string" && !KNOWN_FIELD_NAMES.has(raw) && raw.includes(".")) {
    return fileNameFromPath(raw);
  }

  return "-";
}

export function TransitDamageInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
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

  const [headerData, setHeaderData] = useState<HeaderData>({});
  // Search bar (onSearchReference) can return several HEADER rows for one reference
  // (one per line item). headerData/the editable row above stays HEADER[0], unchanged;
  // this holds HEADER[1..] purely for display in the same table, read-only.
  const [extraHeaderRows, setExtraHeaderRows] = useState<any[]>([]);
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

  // file states
  const [imagesBase64, setImagesBase64] = useState("");
  const [imagesPath, setImagesPath] = useState("");

  const [fsrReportBase64, setFsrReportBase64] = useState("");
  const [fsrReportPath, setFsrReportPath] = useState("");

  const [firReportBase64, setFirReportBase64] = useState("");
  const [firReportPath, setFirReportPath] = useState("");

  const [cofBase64, setCofBase64] = useState("");
  const [cofPath, setCofPath] = useState("");

  // original file names for the picked documents
  const [imagesName, setImagesName] = useState("");
  const [fsrReportName, setFsrReportName] = useState("");
  const [firReportName, setFirReportName] = useState("");
  const [cofName, setCofName] = useState("");

  // Search table edit files: fieldKey -> File
  const [editSearchDamageFiles, setEditSearchDamageFiles] = useState<{ [key: string]: File }>({});
  const handleSearchPickDamageDoc = (field: string, file: File | null) => {
    setEditSearchDamageFiles((prev) => {
      const next = { ...prev };
      if (file) {
        next[field] = file;
      } else {
        delete next[field];
      }
      return next;
    });
  };

  // Capture a picked document as base64 + its file name, keyed by the field label.
  const handlePickDoc = async (label: string, file: File | null) => {
    if (!file) {
      if (label === "Images") { setImagesBase64(""); setImagesName(""); }
      else if (label === "FSR Report") { setFsrReportBase64(""); setFsrReportName(""); }
      else if (label === "FIR Report") { setFirReportBase64(""); setFirReportName(""); }
      else if (label === "COF") { setCofBase64(""); setCofName(""); }
      return;
    }
    const b64 = await fileToBase64(file);
    if (label === "Images") { setImagesBase64(b64); setImagesName(file.name); }
    else if (label === "FSR Report") { setFsrReportBase64(b64); setFsrReportName(file.name); }
    else if (label === "FIR Report") { setFirReportBase64(b64); setFirReportName(file.name); }
    else if (label === "COF") { setCofBase64(b64); setCofName(file.name); }
  };
  const [showForm, setShowForm] = useState(false);
  const showFields = isWithout || revealed;
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>({});

  /**
   * SAP colouring — same pattern as Order Info screen.
   * - sapFilledKeys: header keys that came back NON-EMPTY from SAP → GREEN + readonly
   * - key NOT in set (but sapFetched=true) → SAP returned empty → RED + editable
   * - sapFetched=false (Non-SAP or before GET) → normal styling
   */
  const [sapFetched, setSapFetched] = useState(false);
  const [sapFilledKeys, setSapFilledKeys] = useState<Set<string>>(new Set());

  const editSearchRow = () => {
    setHeaderData((prev: any) => ({
      ...prev,
      _backup: { ...prev },
      isEdit: true,
    }));
  };
  const cancelSearchEdit = () => {
    setHeaderData((prev: any) => {
      if (!prev._backup) return prev;

      const backup = prev._backup;

      return {
        ...backup,
        isEdit: false,
      };
    });
  };
  const editItemRow = (index: number) => {
    const rows = [...itemData];

    rows[index] = {
      ...rows[index],
      _backup: { ...rows[index] },
      isEdit: true,
    };

    setItemData(rows);
  };
  const cancelItemEdit = (index: number) => {
    const rows = [...itemData];

    if (rows[index]._backup) {
      rows[index] = {
        ...rows[index]._backup,
        isEdit: false,
      };
    }

    setItemData(rows);
  };
  useEffect(() => {
  setChecked(!isWithout);
  setSearchType("");
  setSearchValue("");
  setLookupValue("");
  setTableData([EMPTY_ROW()]);
  setRevealed(false);
  setHeaderData({});
  setExtraHeaderRows([]);
  setItemData([]);
  setSelectedItems([]);
  setImagesBase64("");
  setImagesPath("");
  setImagesName("");
  setFsrReportBase64("");
  setFsrReportPath("");
  setFsrReportName("");
  setFirReportBase64("");
  setFirReportPath("");
  setFirReportName("");
  setCofBase64("");
  setCofPath("");
  setCofName("");
  setShowForm(false);
  setInvoiceF4List([]);
  setFullReferenceData([]);
  setIsGlobalSearch(false);
  setSearchResults([]);
  setSelectedItem({});
  setSapFetched(false);
  setSapFilledKeys(new Set());
}, [mode]);

  const handleHeaderChange = (key: string, value: any) => {
    setHeaderData((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };


  const fields: FieldSpec[] = [
    {
      label: "Invoice Date",
      type: "date",
      value: headerData.INV_DATE || "",
    },
    ...(isWithout
      ? [
        {
          label: "DC Reference Number",
          value: headerData.INV_NO || lookupValue || "",
        },
      ]
      : []),
    {
      label: "Invoice Basic Value",
      value: String(headerData.BASIC_VALUE || ""),
    },
    {
      label: "Customer",
      value: headerData.CUSTOMER || "",
    },
    {
      label: "C/nee Name",
      value: headerData.CONSIGN_NAME || "",
    },
    {
      label: "Damage Remarks",
      type: "select",
      value: headerData.DAMAGE_RMK || "",
      options: [
        "Packing material damage",
        "Pallet damage",
        "Cells damage",
        "Cell Bank damage",
        "Can damage",
        "Accident",
        "Prohibited material loading and seized by Police",
        "Damage during unloading",
        "Material in wet condition",
        "Damage due to other materials loaded",
      ],
    },
    {
      label: "Incident Date",
      type: "date",
      value: headerData.INC_DATE || "",
    },
    {
      label: "Settlement",
      type: "select",
      value: headerData.SETTLEMENT || "",
      options: [
        "Claim Settlement",
        "Direct Deduction",
        "Insurance claim",
        "Repair Locally with cost",
        "Repair Locally without cost",
      ],
    },
    {
      label: "Closing Date",
      type: "date",
      value: headerData.CLOSING_DT || "",
    },
    {
      label: "FSR Report Date",
      type: "date",
      value: headerData.FSR_RPT_DT || "",
    },
    {
      label: "Images",
      type: "file",
    },
    {
      label: "FSR Report",
      type: "file",
    },
    {
      label: "FIR Report",
      type: "file",
    },
    {
      label: "COF",
      type: "file",
    },
  ];


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

    // Recompute the F4 list scoped to only the currently-checked reference rows
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



  const updateInvoiceListForSelectedItems = (items: TableRow[]) => {
    if (items.length === 0) {
      setInvoiceF4List([]);
      setLookupValue("");
      return;
    }

    const selectedMapIds = [...new Set(items.map((i) => i.MAPID))];
    const list: string[] = [];

    fullReferenceData.forEach((refItem: any) => {
      if (selectedMapIds.includes(refItem.MAPID) && Array.isArray(refItem.INV_NO)) {
        refItem.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !list.includes(inv.VBELN)) {
            list.push(inv.VBELN);
          }
        });
      }
    });

    setInvoiceF4List(list);
    setLookupValue("");

    console.log("📋 Filtered Invoice List:", list);
  };

  const populateReferenceRows = (data: any[]) => {

    // Reset
    setInvoiceF4List([]);
    setFullReferenceData([]);

    if (data && data.length > 0) {

      setFullReferenceData(data);

      const invoiceList: string[] = [];

      const rows = data.map((d: any) => {

        // Same as Angular
        if (d.INV_NO && Array.isArray(d.INV_NO)) {

          d.INV_NO.forEach((inv: any) => {

            if (
              inv.VBELN &&
              !invoiceList.includes(inv.VBELN)
            ) {
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

        return {
          MAPID: d.MAPID || "",
          REF_NO: d.REF_NO ? String(d.REF_NO) : (d.referenceNumber || ""),
          WORK_ORDER_NO: d.WORK_ORDER_NO ? String(d.WORK_ORDER_NO) : (d.workOrderNumber || ""),
          LR_NO: lrOptions.length > 0 ? lrOptions.join(", ") : (typeof d.LR_NO === "string" ? d.LR_NO : (d.lrNumber || "")),
          TRANSPORTER: d.TRANSPORTER ? String(d.TRANSPORTER) : (d.transporter || ""),
          LINE_NO: d.LINE_NO ? String(d.LINE_NO) : (d.lineNumber || ""),
          selected: false,
          lrOptions,
          compInvoices,
          notAllowed: isNotAllowed,
        };

      });

      setInvoiceF4List(invoiceList);

      setLookupValue("");

      setTableData(rows);

      console.log("🟢 Invoice F4 List:", invoiceList);

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
      global_scr: "TRANSIT DAMAGE INFO",
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

  const onchangeMAPID = (
    index: number,
    selectedMapId: any
  ) => {

    console.log("Selected MAPID:", selectedMapId);

    const selectedObj = selectedItems.find(
      item => item.MAPID == selectedMapId
    );

    console.log("Selected MAPID object:", selectedObj);

    if (!selectedObj) return;

    const updatedItems = [...itemData];

    updatedItems[index] = {

      ...updatedItems[index],

      REFNO: selectedObj.REF_NO || "",

      WORK_ORDER: selectedObj.WORK_ORDER_NO || "",

      LR_NO: selectedObj.LR_NO || "",

      TRANSPORTER: selectedObj.TRANSPORTER || "",

      ZMAPID: selectedObj.MAPID || "",

      ZLINE_NO: selectedObj.LINE_NO,

    };

    setItemData(updatedItems);

    console.log("Updated items:", updatedItems);

  };


  const fetchInvoiceDetails = async () => {
    // 1. Split multiple invoice numbers entered/selected by comma
    const selectedInvoiceNumbers = lookupValue
      .split(",")
      .map((num) => num.trim())
      .filter(Boolean);

    if (selectedInvoiceNumbers.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter Invoice Number",
      });
      return;
    }

    const selectedRows = tableData.filter((row) => row.selected);
    const activeRefs = selectedRows.length > 0 ? selectedRows : tableData.filter((r) => r.REF_NO);

    if (activeRefs.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one reference row",
      });
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

    console.log("Invoice Payload", payload);

    try {
      const res: any = await service.TransitDamageInfofetch(payload);

      console.log("Invoice Response", res);

      if (res?.STATUS === "False") {
        Swal.fire({
          icon: "info",
          text: res.MESSAGE,
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Invoice Details fetched successfully",
      });

      const header = res?.[0]?.HEADER || {};
      const allItems = Array.isArray(res) ? res.flatMap((r: any) => r?.ITEM || []) : [];
      const items = allItems.length > 0 ? allItems : (res?.[0]?.ITEM || []);

      setHeaderData(header);
      setItemData(
        items.map((item: any) => ({
          ...item,
          VEHICLE_NO: item.TRUCK_NO ?? item.VEHICLE_NO ?? "",
        }))
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
      console.error(err);

      Swal.fire({
        icon: "error",
        text: "Error fetching invoice details",
      });
    }
  };

  const handleSave = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {

    // Selected reference
    const selectedRow = tableData.find((r) => r.selected);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Invoice Number is required",
      });
      return;
    }


    const header = {
      ...headerData,

      INV_NO: lookupValue,

      REFNO: selectedRow.REF_NO,

      LINE_NO: selectedRow.LINE_NO,

      INC_DATE: headerData.INC_DATE || null,

      CLOSING_DT: headerData.CLOSING_DT || null,

      ROUTE: headerData.ROUTE || null,

      ZDIMAGES: imagesBase64,
      ZDIMAGES_NAME: imagesName,

      ZDIMG_PATH: imagesPath,

      ZFSRREP: fsrReportBase64,
      ZFSRREP_NAME: fsrReportName,

      ZFSRREP_PATH: fsrReportPath,

      ZFIRREP: firReportBase64,
      ZFIRREP_NAME: firReportName,

      ZFIRREP_PATH: firReportPath,

      ZCOF: cofBase64,
      ZCOF_NAME: cofName,

      ZCOF_PATH: cofPath,

      ZUSER: getLoggedInUser(),

      ZUSER_CH: "",
    };


    const items = itemData
      .filter((x: any) => x.selected)
      .map((row: any) => ({
        ...row,

        INV_NO: lookupValue,

        REFNO: selectedRow.REF_NO,

        ZLINE_NO: row.ZLINE_NO || selectedRow.LINE_NO,
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one item",
      });
      return;
    }

    const payload = {
      HEADER: header,
      ITEM: items,
    };

    console.log("SAVE PAYLOAD", payload);

    try {

      const res: any = await service.TransitDamageInfoSave(payload);

      if (res?.STATUS === "TRUE") {

        Swal.fire({
          icon: "success",
          text: res.MESSAGE || "Saved Successfully",
        });

        if (action === "next") {
          navigate({ to: "/insurance-claim-tracking" });
        } else if (action === "previous") {
          navigate({ to: "/service-level" });
        } else {
          resetAll(); 
        }

      } else {

        Swal.fire({
          icon: "warning",
          title: "Save Failed",
          text: res?.MESSAGE || "",
        });

      }

    } catch (err) {

      console.log(err);

      Swal.fire({
        icon: "error",
        text: "Save Failed",
      });

    }
  };

  const resetAll = () => {
  setSearchType("");
  setSearchValue("");
  setLookupValue("");
  setTableData([EMPTY_ROW()]);
  setRevealed(false);
  setHeaderData({});
  setExtraHeaderRows([]);
  setItemData([]);
  setSelectedItems([]);
  setImagesBase64("");
  setImagesPath("");
  setImagesName("");
  setFsrReportBase64("");
  setFsrReportPath("");
  setFsrReportName("");
  setFirReportBase64("");
  setFirReportPath("");
  setFirReportName("");
  setCofBase64("");
  setCofPath("");
  setCofName("");
  setShowForm(false);
  setInvoiceF4List([]);
  setFullReferenceData([]);
  setIsGlobalSearch(false);
  setSearchResults([]);
  setSelectedItem({});
  setSapFetched(false);
  setSapFilledKeys(new Set());
};


  const onSearchReference = async () => {
    // Reset
    setHeaderData({});
    setExtraHeaderRows([]);
    setItemData([]);
    setShowForm(false);
    setRevealed(false);
    setIsGlobalSearch(true);


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
        icon: "info",
        title: "Info",
        text: "Please select a search type",
      });
      return;
    }

    const payload: any = {
      global: "TRANSIT DAMAGE INFO",
      ZUSER: getLoggedInUser(),
      data: {
        REF_NO: "",
        INV_NO: "",
        SO_NO: "",
        TRANSPORTER: "",
        LR_NO: "",
        WORKORDER_NO: "",
        SALES_PERSON: "",
        LOCATION: "",
        ODN_NO: "",
        VEHICLE_NO: "",
        FREIGHT_BILLNO: "",
        PRODUCT: "",
        ROUTE: "",
        NATURE_DAMAGE: "",
        CLAIM_STATUS: "",
      },
    };

    const apiField = searchTypeMap[searchType];

    if (apiField) {
      payload.data[apiField] = searchValue.trim();
    }

    console.log("Search Payload", payload);

    try {
      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      console.log("Search Response", res);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        Swal.fire({
          icon: "warning",
          text: res.MESSAGE,
        });
        return;
      }

      if (!res?.HEADER || res.HEADER.length === 0) {
        Swal.fire({
          icon: "info",
          text: "No records found",
        });
        return;
      }

      const header = res.HEADER[0];

      const items = (res.ITEMS || []).map((item: any) => ({
        ...item,
        selected: false,
      }));

      const dmgRmk = header.ZDAMAGE_RMK ?? header.DAMAGE_RMK ?? "";
      setHeaderData({
        ...header,
        ZDAMAGE_RMK: dmgRmk,
        DAMAGE_RMK: dmgRmk,
      });
      // Any further HEADER rows (e.g. one per ZLINE_NO) — shown read-only below the
      // editable row above so every HEADER record from the response is visible.
      setExtraHeaderRows(
        res.HEADER.slice(1).map((h: any) => {
          const rmk = h.ZDAMAGE_RMK ?? h.DAMAGE_RMK ?? "";
          return { ...h, ZDAMAGE_RMK: rmk, DAMAGE_RMK: rmk };
        })
      );
      setItemData(items);
      setShowForm(true);
      setRevealed(true);

      Swal.fire({
        icon: "success",
        text: "Data fetched successfully!",
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
    }
  };


 const fetchInvoiceDetailsNonSap = async (valueOverride?: string) => {
  const dcRef = (valueOverride ?? lookupValue).trim();

  // 1. Split multiple invoice / DC Reference numbers
  const selectedInvoiceNumbers = dcRef
    .split(",")
    .map((num) => num.trim())
    .filter(Boolean);

  if (selectedInvoiceNumbers.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Please enter DC Reference Number",
    });
    return;
  }

  const selectedRows = tableData.filter((row) => row.selected);
  const activeRefs = selectedRows.length > 0 ? selectedRows : tableData.filter((r) => r.REF_NO);

  if (activeRefs.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Warning",
      text: "Please select at least one reference row",
    });
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

  console.log("Non-SAP Payload:", payload);

  try {
    const res: any = await service.TransitDamageinfofetchNonsap(payload);

    console.log("Non-SAP Response:", res);

    if (!res || res.STATUS === "False") {
      Swal.fire({
        icon: "info",
        title: "Info",
        text: res?.MESSAGE || "No Data Found",
      });
      return;
    }

    const primaryRef = selectedRows[0] || tableData[0];
    const header = res?.[0]?.HEADER || {};
    const allItems = Array.isArray(res) ? res.flatMap((r: any) => r?.ITEM || []) : [];
    const items = allItems.length > 0 ? allItems : (res?.[0]?.ITEM || []);

    // Header
    setHeaderData({
      ...header,
      INV_NO: header.INV_NO || dcRef,
      REFNO: primaryRef?.REF_NO || "",
      LINE_NO: primaryRef?.LINE_NO || "",
    });

    // Item Table
    const updatedItems = items.map((item: any) => ({
      ...item,

      selected: false,

      // Reference Details
      ZMAPID: primaryRef?.MAPID || "",
      REFNO: primaryRef?.REF_NO || "",
      ZLINE_NO: primaryRef?.LINE_NO || "",

      // Display Columns (Only API values)
      VEHICLE_NO: item.TRUCK_NO ?? "",
      LR_NO: item.LR_NO ?? "",
      TRANSPORTER: item.TRANSPORTER ?? "",
      WORK_ORDER: item.WORK_ORDER ?? "",

      PRODUCT: item.PRODUCT ?? "",
      BILLNO: item.BILLNO ?? "",
      INV_NO: dcRef,
    }));

    console.log("Updated Items:", updatedItems);

    setItemData(updatedItems);

    setShowForm(true);
    setRevealed(true);
    setIsGlobalSearch(false);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Invoice Details fetched successfully.",
      timer: 1200,
      showConfirmButton: false,
    });
  } catch (error) {
    console.error("Non-SAP Fetch Error:", error);

    Swal.fire({
      icon: "error",
      title: "Error",
      text: "Failed to fetch Invoice Details.",
    });
  }
};

  const handleSaveNonSap = async (
    action: "stay" | "next" | "previous" = "stay"
  ) => {

    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select one reference row",
      });
      return;
    }

    if (!lookupValue.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please enter DC Reference Number",
      });
      return;
    }

    const header = {
      ...headerData,

      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: selectedRow.LINE_NO,

      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",

      ZDIMAGES: imagesBase64 || "",
      ZDIMAGES_NAME: imagesName || "",
      ZDIMG_PATH: imagesPath || "",

      ZFSRREP: fsrReportBase64 || "",
      ZFSRREP_NAME: fsrReportName || "",
      ZFSRREP_PATH: fsrReportPath || "",

      ZFIRREP: firReportBase64 || "",
      ZFIRREP_NAME: firReportName || "",
      ZFIRREP_PATH: firReportPath || "",

      ZCOF: cofBase64 || "",
      ZCOF_NAME: cofName || "",
      ZCOF_PATH: cofPath || "",
    };

    const items = itemData
      .filter((item: any) => item.selected)
      .map((item: any) => ({
        ...item,

        INV_NO: lookupValue,
        REFNO: selectedRow.REF_NO,

        ZUSER: getLoggedInUser(),
        ZUSER_CH: "",

        ZLINE_NO: selectedRow.LINE_NO,
      }));

    if (items.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select at least one item",
      });
      return;
    }

    const payload = {
      HEADER: header,
      ITEM: items,
    };

    console.log("Non-SAP SAVE Payload:", payload);

    try {
      const res: any = await service.withoutsapSave(payload);

      if (res?.STATUS === true || res?.STATUS === "TRUE") {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data Saved Successfully",
        });

         resetAll();  

        // reset form if required
        // resetForm();

        if (action === "next") {
          navigate({ to: "/insurance-claim-tracking" });
        } else if (action === "previous") {
          navigate({ to: "/service-level" });
        }
      } else {
        Swal.fire({
          icon: "warning",
          title: "Save Failed",
          text: res?.MESSAGE || "",
        });
      }
    } catch (err) {
      console.error(err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Save Failed",
      });
    }
  };

  const updateSearchRow = async () => {
    const imgB64 = editSearchDamageFiles.ZDIMAGES ? await fileToBase64(editSearchDamageFiles.ZDIMAGES) : "";
    const fsrB64 = editSearchDamageFiles.ZFSRREP ? await fileToBase64(editSearchDamageFiles.ZFSRREP) : "";
    const firB64 = editSearchDamageFiles.ZFIRREP ? await fileToBase64(editSearchDamageFiles.ZFIRREP) : "";
    const cofB64 = editSearchDamageFiles.ZCOF ? await fileToBase64(editSearchDamageFiles.ZCOF) : "";

    const { _backup, isEdit, ...cleanHeader } = headerData;

    const updatedHead = {
      ...cleanHeader,
      ZUSER_CH: getLoggedInUser(),
      ...(imgB64 ? { ZDIMAGES: imgB64, ZDIMAGES_NAME: editSearchDamageFiles.ZDIMAGES?.name || "" } : {}),
      ...(fsrB64 ? { ZFSRREP: fsrB64, ZFSRREP_NAME: editSearchDamageFiles.ZFSRREP?.name || "" } : {}),
      ...(firB64 ? { ZFIRREP: firB64, ZFIRREP_NAME: editSearchDamageFiles.ZFIRREP?.name || "" } : {}),
      ...(cofB64 ? { ZCOF: cofB64, ZCOF_NAME: editSearchDamageFiles.ZCOF?.name || "" } : {}),
    };

    const payload = {
      ZDIMG_PATH: headerData.ZDIMG_PATH || "",
      ZFSRREP_PATH: headerData.ZFSRREP_PATH || "",
      ZFIRREP_PATH: headerData.ZFIRREP_PATH || "",
      ZCOF_PATH: headerData.ZCOF_PATH || "",

      HEAD: updatedHead,

      ITEM: itemData.map((item: any) => {
        const { _backup: ib, isEdit: ie, ...cleanItem } = item;
        return {
          ...cleanItem,
          ZUSER_CH: getLoggedInUser(),
        };
      }),
    };

    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this transit record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
    });

    if (!result.isConfirmed) return;

    try {
      const res = isSap
        ? await service.TransitDamageInfoChangeWithSap(payload)
        : await service.TransitDamageInfoChangeWithoutSap(payload);

      const isSuccess =
        res?.STATUS === true ||
        String(res?.STATUS ?? "").toUpperCase() === "TRUE" ||
        String(res?.NUMBER ?? "") === "200" ||
        String(res?.STATUS ?? "").toUpperCase() === "S";

      if (isSuccess) {
        Swal.fire("Success", res?.MESSAGE || "Updated Successfully", "success");

        const updatedLocalFiles = { ...(headerData.ZLOCALFILES || {}) };
        if (editSearchDamageFiles.ZDIMAGES) updatedLocalFiles.Images = editSearchDamageFiles.ZDIMAGES.name;
        if (editSearchDamageFiles.ZFSRREP) updatedLocalFiles.FSR_Report = editSearchDamageFiles.ZFSRREP.name;
        if (editSearchDamageFiles.ZFIRREP) updatedLocalFiles.FIR_Report = editSearchDamageFiles.ZFIRREP.name;
        if (editSearchDamageFiles.ZCOF) updatedLocalFiles.COF = editSearchDamageFiles.ZCOF.name;

        setEditSearchDamageFiles({});

        setHeaderData((prev: any) => ({
          ...prev,
          ...cleanHeader,
          ZLOCALFILES: updatedLocalFiles,
          isEdit: false,
        }));

        setItemData((prev: any[]) =>
          prev.map((x) => ({
            ...x,
            isEdit: false,
          }))
        );

        onSearchReference();
      } else {
        Swal.fire("Error", res?.MESSAGE || "Update Failed", "error");
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
      DELETE: [
        {
          ZREFNO: row.ZREFNO,
          ZINV_NO: row.ZINV_NO,
          ZLINE_NO: row.ZLINE_NO || "",
        },
      ],
    };

    try {
      const res = isSap
        ? await service.TransitDamageInfoDeleteWithSap(payload)
        : await service.TransitDamageInfoDeleteWithoutSap(payload);

      if (res.STATUS === "TRUE" || res.NUMBER === "200") {
        Swal.fire("Deleted", "Record deleted successfully", "success");

        setItemData((prev) =>
          prev.filter(
            (x) =>
              !(
                x.ZREFNO === row.ZREFNO &&
                x.ZINV_NO === row.ZINV_NO &&
                x.ZLINE_NO === row.ZLINE_NO
              )
          )
        );

        if (
          headerData.ZREFNO === row.ZREFNO &&
          headerData.ZINV_NO === row.ZINV_NO
        ) {
          setHeaderData({});
          setExtraHeaderRows([]);
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
                if (e.key === "Enter") {
                  onSearchReference();
                }
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

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Ref No", "Line No", "Invoice No", "ODN No", "SO No",
                      "Invoice Date", "FSR Report Date", "Base Value", "Incident Date",
                      "Customer", "C/nee Name", "Damage Remarks", "Settlement",
                      "Closing Date", "Images", "FSR Report", "FIR Report", "COF",
                      "Sales Person", "Location", "Route", "Plant", "Division",
                      "Created Date", "Vehicle Type", "Action"
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  <tr className="bg-surface hover:bg-muted/50">

                    {[
                      { field: "ZREFNO", type: "text", readonly: true },
                      { field: "ZLINE_NO", type: "text", readonly: true },
                      { field: "ZINV_NO", type: "text", readonly: true },
                      { field: "ZODN_NO", type: "text" },
                      { field: "ZSONO", type: "text" },
                      { field: "ZINV_DATE", type: "date", readonly: true },
                      { field: "ZFSR_RPT_DT", type: "date" },
                      { field: "ZBASIC_VALUE", type: "number" },
                      { field: "ZINC_DATE", type: "date" },
                      { field: "ZCUSTOMER", type: "text" },
                      { field: "ZCONSIGN_NAME", type: "text" },
                      {
                        field: "ZDAMAGE_RMK",
                        type: "select",
                        options: Array.from(
                          new Set([
                            "Packing material damage",
                            "Pallet damage",
                            "Cells damage",
                            "Cell Bank damage",
                            "Can damage",
                            "Accident",
                            "Prohibited material loading and seized by Police",
                            "Damage during unloading",
                            "Material in wet condition",
                            "Damage due to other materials loaded",
                            headerData.ZDAMAGE_RMK,
                            headerData.DAMAGE_RMK,
                          ].filter(Boolean))
                        ),
                      },
                      {
                        field: "ZSETTLEMENT",
                        type: "select",
                        options: [
                          "Claim Settlement",
                          "Direct Deduction",
                          "Insurance claim",
                          "Repair Locally with cost",
                          "Repair Locally without cost",
                        ],
                      },
                      { field: "ZCLOSING_DT", type: "date" },
                      { field: "ZDIMAGES", type: "text" },
                      { field: "ZFSRREP", type: "text" },
                      { field: "ZFIRREP", type: "text" },
                      { field: "ZCOF", type: "text" },
                      { field: "ZSALE_PERSON", type: "text" },
                      { field: "ZLOCATION", type: "text" },
                      { field: "ZROUTE", type: "text" },
                      {
                        field: "ZPLANT",
                        type: "select",
                        options: Array.from(new Set([...(currentUser.PLANTS || []).map((p: any) => typeof p === "string" ? p : p?.PLANT || p?.PLANT_NAME || String(p)), headerData.ZPLANT].filter(Boolean))),
                      },
                      {
                        field: "ZDIVISION",
                        type: "select",
                        options: Array.from(new Set([...(currentUser.DIV || []).map((d: any) => typeof d === "string" ? d : d?.DIVISION || d?.DIV || String(d)), headerData.ZDIVISION].filter(Boolean))),
                      },
                      { field: "ZCREATED_DT", type: "date", readonly: true },
                      { field: "ZVEH_TYPE", type: "text", readonly: true },
                    ].map(({ field, type, options, readonly }: any) => (
                      <td
                        key={field}
                        className="px-3 py-2 whitespace-nowrap text-center"
                      >
                        {headerData.isEdit && !readonly ? (
                          DOC_LOCAL_KEY[field] ? (
                            <div className="flex flex-col items-center gap-1">
                              {editSearchDamageFiles[field]?.name ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const file = editSearchDamageFiles[field];
                                    const url = file ? URL.createObjectURL(file) : "";
                                    setPreviewDoc({ url, title: file?.name || field });
                                  }}
                                  className="text-[12px] truncate max-w-[140px] text-blue-600 hover:underline font-medium cursor-pointer"
                                  title={editSearchDamageFiles[field]?.name}
                                >
                                  {editSearchDamageFiles[field]?.name}
                                </button>
                              ) : (
                                (() => {
                                  const existingName = docFileName(headerData, field);
                                  if (existingName && existingName !== "-") {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const url = getLocalDocumentUrl({
                                            mode: isWithout ? "Without Sap" : "SAP",
                                            screen: "Transit_Damage_Info",
                                            field: DOC_LOCAL_KEY[field],
                                            fileName: existingName,
                                            storedPath: headerData?.[DOC_PATH_KEY[field]],
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
                                <span>{editSearchDamageFiles[field] ? "Change" : "Browse"}</span>
                                <input
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => handleSearchPickDamageDoc(field, e.target.files?.[0] || null)}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          ) : type === "select" ? (
                            <select
                              className={GREEN_INPUT + (field === "ZDAMAGE_RMK" ? " min-w-[220px]" : " min-w-[160px]")}
                              value={headerData[field] || (field === "ZDAMAGE_RMK" ? headerData.DAMAGE_RMK : "") || ""}
                              onChange={(e) =>
                                setHeaderData((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                  ...(field === "ZDAMAGE_RMK" ? { DAMAGE_RMK: e.target.value } : {}),
                                }))
                              }
                            >
                              <option value="">Select</option>
                              {options?.map((o: string) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : type === "textarea" ? (
                            <textarea
                              className={`${GREEN_INPUT} h-16 min-w-[180px]`}
                              value={headerData[field] || ""}
                              onChange={(e) =>
                                setHeaderData((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <input
                              type={type}
                              className={GREEN_INPUT + " min-w-[140px]"}
                              value={headerData[field] || ""}
                              onChange={(e) =>
                                setHeaderData((prev) => ({
                                  ...prev,
                                  [field]: e.target.value,
                                }))
                              }
                            />
                          )
                        ) : DOC_LOCAL_KEY[field] ? (
                          // Images / FSR Report / FIR Report / COF -> uploaded file name
                          (() => {
                            const fileName = docFileName(headerData, field);
                            if (!fileName || fileName === "-" || fileName === "NA") {
                              return <span className="text-muted-foreground">-</span>;
                            }
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  const url = getLocalDocumentUrl({
                                    mode: isWithout ? "Without Sap" : "SAP",
                                    screen: "Transit_Damage_Info",
                                    field: DOC_LOCAL_KEY[field],
                                    fileName,
                                    storedPath: headerData?.[DOC_PATH_KEY[field]],
                                    row: headerData,
                                  });
                                  setPreviewDoc({ url, title: fileName });
                                }}
                                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                                title={`View ${fileName}`}
                              >
                                <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                                <span className="truncate">{fileName}</span>
                              </button>
                            );
                          })()
                        ) : (
                          <span>
                            {type === "date" && headerData[field]
                              ? new Date(headerData[field]).toLocaleDateString("en-GB")
                              : headerData[field] || (field === "ZDAMAGE_RMK" ? headerData.DAMAGE_RMK : "") || "-"}
                          </span>
                        )}
                      </td>
                    ))}

                    {/* Action */}
                    <td className="px-2 py-2 text-center">
                      {!headerData.isEdit ? (
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => {
                              setEditSearchDamageFiles({});
                              const dmgRmk = headerData.ZDAMAGE_RMK || headerData.DAMAGE_RMK || "";
                              setHeaderData((prev) => ({
                                ...prev,
                                ZDAMAGE_RMK: dmgRmk,
                                DAMAGE_RMK: dmgRmk,
                                _backup: { ...prev, ZDAMAGE_RMK: dmgRmk, DAMAGE_RMK: dmgRmk },
                                isEdit: true,
                              }));
                            }}
                            className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                          >
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => deleteRow(headerData)}
                            className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={updateSearchRow}
                            className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                          >
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => {
                              setEditSearchDamageFiles({});
                              setHeaderData((prev) => ({
                                ...prev._backup,
                                isEdit: false,
                              }));
                            }}
                            className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            <svg
                              className="size-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>

                  {/* Any further HEADER rows from the search response (e.g. one per
                      ZLINE_NO) — read-only, same columns as above, so every HEADER
                      record is visible. Editing stays on the row above only. */}
                  {extraHeaderRows.map((row: any, rowIndex: number) => (
                    <tr key={`extra-header-${rowIndex}`} className="bg-surface hover:bg-muted/50">
                      {[
                        { field: "ZREFNO", type: "text" },
                        { field: "ZLINE_NO", type: "text" },
                        { field: "ZINV_NO", type: "text" },
                        { field: "ZODN_NO", type: "text" },
                        { field: "ZSONO", type: "text" },
                        { field: "ZINV_DATE", type: "date" },
                        { field: "ZFSR_RPT_DT", type: "date" },
                        { field: "ZBASIC_VALUE", type: "number" },
                        { field: "ZINC_DATE", type: "date" },
                        { field: "ZCUSTOMER", type: "text" },
                        { field: "ZCONSIGN_NAME", type: "text" },
                        { field: "ZDAMAGE_RMK", type: "text" },
                        { field: "ZSETTLEMENT", type: "text" },
                        { field: "ZCLOSING_DT", type: "date" },
                        { field: "ZDIMAGES", type: "text" },
                        { field: "ZFSRREP", type: "text" },
                        { field: "ZFIRREP", type: "text" },
                        { field: "ZCOF", type: "text" },
                        { field: "ZSALE_PERSON", type: "text" },
                        { field: "ZLOCATION", type: "text" },
                        { field: "ZROUTE", type: "text" },
                        { field: "ZPLANT", type: "text" },
                        { field: "ZDIVISION", type: "text" },
                        { field: "ZCREATED_DT", type: "date" },
                        { field: "ZVEH_TYPE", type: "text" },
                      ].map(({ field, type }) => (
                        <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                          {DOC_LOCAL_KEY[field] ? (
                            (() => {
                              const fileName = docFileName(row, field);
                              if (!fileName || fileName === "-" || fileName === "NA") {
                                return <span className="text-muted-foreground">-</span>;
                              }
                              return (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const url = getLocalDocumentUrl({
                                      mode: isWithout ? "Without Sap" : "SAP",
                                      screen: "Transit_Damage_Info",
                                      field: DOC_LOCAL_KEY[field],
                                      fileName,
                                      storedPath: row?.[DOC_PATH_KEY[field]],
                                      row,
                                    });
                                    setPreviewDoc({ url, title: fileName });
                                  }}
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline underline-offset-2 transition-colors cursor-pointer group max-w-[150px]"
                                  title={`View ${fileName}`}
                                >
                                  <FileText className="size-3.5 shrink-0 opacity-70 group-hover:opacity-100 text-blue-600 dark:text-blue-400" />
                                  <span className="truncate">{fileName}</span>
                                </button>
                              );
                            })()
                          ) : (
                            <span>
                              {type === "date" && row[field]
                                ? new Date(row[field]).toLocaleDateString("en-GB")
                                : row[field] || (field === "ZDAMAGE_RMK" ? row.DAMAGE_RMK : "") || "-"}
                            </span>
                          )}
                        </td>
                      ))}

                      <td className="px-2 py-2 text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <button
                            onClick={() => {
                              // Edit is only wired to the single headerData row above, so make
                              // this row that one: swap it into headerData (same edit init the
                              // row above uses) and put the row it displaced back here in its
                              // place, so every row stays visible and only headerData is "live".
                              setEditSearchDamageFiles({});
                              const dmgRmk = row.ZDAMAGE_RMK || row.DAMAGE_RMK || "";
                              const nextEdit = {
                                ...row,
                                ZDAMAGE_RMK: dmgRmk,
                                DAMAGE_RMK: dmgRmk,
                                _backup: { ...row, ZDAMAGE_RMK: dmgRmk, DAMAGE_RMK: dmgRmk },
                                isEdit: true,
                              };
                              const { isEdit: _prevIsEdit, _backup: _prevBackup, ...displaced } = headerData;
                              setExtraHeaderRows((prev) =>
                                prev.map((r, i) => (i === rowIndex ? displaced : r))
                              );
                              setHeaderData(nextEdit);
                            }}
                            className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Edit"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>

                          <button
                            onClick={() => deleteRow(row)}
                            className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                            title="Delete"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}

          {showForm && isGlobalSearch && itemData.length > 0 && (
            <div className="max-h-[400px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant mt-3">
              <div className="p-2 font-semibold">Line Items</div>

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Map ID",
                      "Ref No",
                      "Line No",
                      "Invoice No",
                      "Vehicle No",
                      "Bill No",
                      "Product",
                      "Work Order",
                      "LR No",
                      "Transporter",
                      "Action",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2.5 whitespace-nowrap text-left"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  {itemData.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className={
                        index % 2 === 0
                          ? "bg-surface hover:bg-muted/50"
                          : "bg-surface-2/40 hover:bg-muted/50"
                      }
                    >
                      {[
                        { field: "ZMAPID", type: "text", readonly: true },
                        { field: "ZREFNO", type: "text", readonly: true },
                        { field: "ZLINE_NO", type: "text", readonly: true },
                        { field: "ZINV_NO", type: "text", readonly: true },
                        { field: "ZTRUCK_NO", type: "text" },
                        { field: "ZBILLNO", type: "text" },
                        { field: "ZPRODUCT", type: "text" },
                        { field: "ZWORK_ORDER", type: "text", readonly: true },
                        { field: "ZLRNO", type: "text", readonly: true },
                        { field: "ZTRANSPORTER", type: "text", readonly: true },
                      ].map(({ field, type, readonly }: any) => (
                        <td
                          key={field}
                          className="px-3 py-2 whitespace-nowrap text-center"
                        >
                          {item.isEdit && !readonly ? (
                            <input
                              type={type}
                              className={GREEN_INPUT}
                              value={item[field] || ""}
                              onChange={(e) => {
                                const rows = [...itemData];
                                rows[index] = {
                                  ...rows[index],
                                  [field]: e.target.value,
                                };
                                setItemData(rows);
                              }}
                            />
                          ) : (
                            <span>{item[field] || "-"}</span>
                          )}
                        </td>
                      ))}

                      {/* Action */}
                      <td className="px-2 py-2 text-center">
                        {!item.isEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => editItemRow(index)}
                              className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <svg
                                className="size-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                                />
                              </svg>
                            </button>

                            <button
                              onClick={() => deleteRow(item)}
                              className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <svg
                                className="size-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={updateSearchRow}
                              className="size-6 grid place-items-center rounded bg-green-50 text-green-600 hover:bg-green-100"
                            >
                              ✔
                            </button>

                            <button
                              onClick={() => cancelItemEdit(index)}
                              className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                              ✖
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>

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
                      key={f.label}
                      field={f}
                      onChange={handleHeaderChange}
                      sapFetched={sapFetched}
                      sapFilledKeys={sapFilledKeys}
                      onFileChange={handlePickDoc}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Table */}
              <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                      <th className="px-3 py-0.5 text-center w-12">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            const checked = e.target.checked;

                            const updated = itemData.map((item) => ({
                              ...item,
                              selected: checked,
                            }));

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

                        <td className="px-3 py-0.5 text-center">
                          {index + 1}
                        </td>

                        <td className="px-3 py-0.5">
                          <select
                            value={row.ZMAPID || ""}
                            onChange={(e) =>
                              onchangeMAPID(index, e.target.value)
                            }
                            className={GREEN_INPUT}
                          >
                            <option value="">Select</option>

                            {selectedItems.map((item) => (
                              <option
                                key={item.MAPID}
                                value={item.MAPID}
                              >
                                {item.MAPID}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-0.5">
                          <input
                            value={row.VEHICLE_NO || ""}
                            className={GREEN_INPUT + " text-center"}
                            readOnly
                          />
                        </td>

                        <td className="px-3 py-0.5">
                          <input
                            value={row.LR_NO || ""}
                            className={GREEN_INPUT + " text-center"}
                            readOnly
                          />
                        </td>

                        <td className="px-3 py-0.5">
                          <input
                            value={row.TRANSPORTER || ""}
                            className={GREEN_INPUT + " text-center"}
                            readOnly
                          />
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
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  onClick={() =>
                    isWithout
                      ? handleSaveNonSap("stay")
                      : handleSave("stay")
                  }
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  <Save className="size-3.5" />
                  Save
                </button>

                <button
                  onClick={() =>
                    isWithout
                      ? handleSaveNonSap("next")
                      : handleSave("next")
                  }
                  className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  Save and Next
                  <ChevronRight className="size-3.5" />
                </button>

                <button
                  onClick={() =>
                    isWithout
                      ? handleSaveNonSap("previous")
                      : handleSave("previous")
                  }
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
  onChange,
  sapFetched = false,
  sapFilledKeys,
  onFileChange,
}: {
  field: FieldSpec;
  onChange: (key: string, value: any) => void;
  sapFetched?: boolean;
  sapFilledKeys?: Set<string>;
  onFileChange?: (label: string, file: File | null) => void;
}) {
  const {
    label,
    value = "",
    type = "text",
    options = [],
    placeholder,
  } = field;

  const key = labelToKey(label);

  // SAP-aware colouring (same pattern as Order Info screen):
  // - SAP filled  → green + readonly
  // - SAP empty   → red + editable
  // - No SAP yet  → normal (file inputs are never coloured)
  const filled = type !== "file" && sapFetched && !!sapFilledKeys?.has(key);
  const unfilled = type !== "file" && sapFetched && !sapFilledKeys?.has(key);
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
            value={value || ""}
            onChange={(e) => onChange(key, e.target.value)}
            className={cls}
          >
            <option value="">
              {placeholder || "Select"}
            </option>

            {options.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        )
      ) : type === "date" ? (
        <GateDatePicker
          value={value || ""}
          disabled={filled}
          onChange={(_, str) => !filled && onChange(key, str)}
          className={cls}
        />
      ) : type === "file" ? (
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={(e) => onFileChange?.(label, e.target.files?.[0] ?? null)}
          className={GREEN_INPUT + " py-1.5"}
        />
      ) : (
        <input
          type="text"
          value={value || ""}
          readOnly={filled}
          onChange={(e) => !filled && onChange(key, e.target.value)}
          placeholder={placeholder || `Enter ${label}`}
          className={cls}
        />
      )}
    </div>
  );
}
