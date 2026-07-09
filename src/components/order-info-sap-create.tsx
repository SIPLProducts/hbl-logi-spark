import { useEffect, useState, useCallback, useRef } from "react";
import { Search, Save, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";

// ── Style constants ───────────────────────────────────────────────────────────
// Normal editable field
const INPUT_NORMAL =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

// Normal readonly (non-SAP, auto-filled like zone)
const INPUT_READONLY =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";

// SAP fetched & has value → GREEN, readonly
const INPUT_SAP_FILLED =
  "h-7 w-full rounded-md bg-emerald-50 border-2 border-emerald-400 px-2 text-[12px] text-emerald-900 font-semibold outline-none cursor-not-allowed";

// SAP fetched but empty → RED, EDITABLE (user must fill)
const INPUT_SAP_EMPTY =
  "h-7 w-full rounded-md bg-red-50 border-2 border-red-400 px-2 text-[12px] text-foreground font-medium outline-none focus:border-red-500 focus:ring-2 focus:ring-red-300";

// Highlighted (yellow) — used for the Incoterms field
const INPUT_YELLOW =
  "h-7 w-full rounded-md bg-yellow-50 border-2 border-yellow-400 px-2 text-[12px] text-yellow-900 font-semibold outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300";
const LABEL_YELLOW = "block text-[11px] font-semibold text-yellow-700 mb-0.5";

const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

// ── Search options ────────────────────────────────────────────────────────────
const SEARCH_OPTIONS = [
  { key: "ref_no", label: "Reference No" },
  { key: "inv_no", label: "Invoice No" },
  { key: "odn_no", label: "ODN No" },
  { key: "so_no", label: "SO No" },
  { key: "lr_no", label: "LR No" },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type PlantData = { PLANT: string; PLANT_DESC: string; WERKS?: string };
type DivData = { DIVISION: string; DIV_TEXT: string };
type BillingData = { BILL_TYPE: string; BILL_TYPE_DESC: string };
type StateData = { STATE: string };
type CustomerData = { CUSTOMER: string; CUSTOMER_NAME: string };

type FormState = {
  TaxInvoice: string;
  DCReference: string;
  InvoiceDate: string;
  ReferenceDate: string;
  ODN: string;
  BasicShipment: string;
  InvoiceWithGst: string;
  FiscalYear: string;
  FiscalQuarter: string;
  Month: string;
  RequiredDateTime: string;
  ReportedDateTime: string;
  PhysicalDispatchDateTime: string;
  Plant: string;
  TransactionType: string;
  BillingTransactionType: string;
  Division: string;
  SubDivision: string;
  RefNumber: string;
  Customer: string;
  CustomerGroup: string;
  CUST_CODE: string;
  CNee: string;
  DestinationLocation: string;
  DestinationState: string;
  DestinationZone: string;
  Incoterms: string;
};

const EMPTY_FORM: FormState = {
  TaxInvoice: "", DCReference: "", InvoiceDate: "", ReferenceDate: "",
  ODN: "", BasicShipment: "", InvoiceWithGst: "",
  FiscalYear: "", FiscalQuarter: "", Month: "",
  RequiredDateTime: "", ReportedDateTime: "", PhysicalDispatchDateTime: "",
  Plant: "", TransactionType: "", BillingTransactionType: "",
  Division: "", SubDivision: "", RefNumber: "",
  Customer: "", CustomerGroup: "", CUST_CODE: "",
  CNee: "", DestinationLocation: "", DestinationState: "", DestinationZone: "",
  Incoterms: "",
};

type ComboOption = { code: string; label: string };

function SearchableCombobox({
  value,
  onSelect,
  options,
  placeholder,
  className,
}: {
  value: string;
  onSelect: (label: string) => void;
  options: ComboOption[];
  placeholder: string;
  className: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);   // what's shown in the input
  const [search, setSearch] = useState("");    // what's used to filter the list
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const q = search.trim().toLowerCase();
  const filtered = (q
    ? options.filter((o) => o.label.toLowerCase().includes(q) || o.code.toLowerCase().includes(q))
    : options
  ).slice(0, 100);

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSearch(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          setSearch("");      // reset filter so full list shows again
          e.target.select();  // select existing text so typing replaces it
        }}
        placeholder={placeholder}
        className={className}
      />
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-md border border-input bg-white dark:bg-surface shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-2 py-1.5 text-[12px] text-muted-foreground">No matches</div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.code}
                type="button"
                onClick={() => {
                  onSelect(o.label);
                  setQuery(o.label);
                  setSearch(o.label);
                  setOpen(false);
                }}
                className="block w-full text-left px-2 py-1 text-[12px] hover:bg-accent/10"
              >
                {o.code} - {o.label}
              </button>
            ))
          )}
          {q && filtered.length === 100 && (
            <div className="px-2 py-1 text-[10px] text-muted-foreground border-t border-hairline">
              Showing first 100 — keep typing to narrow down
            </div>
          )}
        </div>
      )}
    </div>
  );
}



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

// ── Helpers ───────────────────────────────────────────────────────────────────
function convertPhysDispatchFormat(v: string): string {
  if (!v) return "";
  const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2}):(\d{2})(?::\d{2})?$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}`;
  return "";
}

function convertToDateFormat(v: string): string {
  if (!v) return "";
  if (v.includes("T")) return v.split("T")[0];
  if (/^\d{8}$/.test(v)) return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  return v;
}

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

// ── Sub-components ────────────────────────────────────────────────────────────

/** Label with optional green "From SAP" badge */
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

// ── Main Component ────────────────────────────────────────────────────────────
export function OrderInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {
  const isWithout = mode === "without";
  const isSap = !isWithout;

  // table rows
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);

  // invoice / search bar
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // form values
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [showFiscalFields, setShowFiscalFields] = useState(false);

  /**
   * sapFilledKeys — tracks which FormState keys came back NON-EMPTY from SAP.
   * - Key IN set   → SAP returned a value → GREEN + readonly
   * - Key NOT in set (but sapFetched=true) → SAP returned empty → RED + editable
   * - sapFetched=false (Non-SAP or before GET) → normal styling
   */
  const [sapFilledKeys, setSapFilledKeys] = useState<Set<keyof FormState>>(new Set());
  const [sapFetched, setSapFetched] = useState(false);

  // dropdowns
  const [plantList, setPlantList] = useState<PlantData[]>([]);
  const [divisionList, setDivisionList] = useState<DivData[]>([]);
  const [billingList, setBillingList] = useState<BillingData[]>([]);
  const [statesList, setStatesList] = useState<StateData[]>([]);
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);
  const [incotermsList, setIncotermsList] = useState<any[]>([]);

  // loading
  const [loadingGet, setLoadingGet] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // ── helpers ──
  const setField = (key: keyof FormState, value: string) =>
    setForm((p) => ({ ...p, [key]: value }));

  /**
   * Returns the correct CSS class for a field:
   *   - Not SAP fetched yet   → normal input / readonly
   *   - SAP fetched + filled  → green readonly
   *   - SAP fetched + empty   → red editable
   */
  const getInputClass = (key: keyof FormState, alwaysReadonly = false): string => {
    if (!sapFetched) return alwaysReadonly ? INPUT_READONLY : INPUT_NORMAL;
    if (sapFilledKeys.has(key)) return INPUT_SAP_FILLED;   // green, readonly enforced
    return INPUT_SAP_EMPTY;                                 // red, editable
  };

  const isReadonly = (key: keyof FormState, alwaysReadonly = false): boolean => {
    if (!sapFetched) return alwaysReadonly;
    return sapFilledKeys.has(key); // only readonly if SAP filled it
  };

  // ── Non-SAP: show form immediately ──
  useEffect(() => {
    if (isWithout) {
      setShowForm(true);
      setSapFetched(false);
      setSapFilledKeys(new Set());
    } else {
      setShowForm(false);
      setSapFetched(false);
      setSapFilledKeys(new Set());
    }
  }, [isWithout]);

  // ── Load plants + divisions from localStorage ──
  // useEffect(() => {
  //   try {
  //     const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
  //     setPlantList(userData.PLANTS || []);
  //     setDivisionList(
  //       (userData.DIV || []).map((d: any) => ({
  //         DIVISION: d.DIVISION,
  //         DIV_TEXT: d.DIV_TEXT || d.DIVISION_DESC || d.DIVISION,
  //       }))
  //     );
  //   } catch { /* ignore */ }
  // }, []);

  // ── Load plants + divisions via F4 API (same pattern as Dispatch screen) ──
  useEffect(() => {
    const loadF4 = async () => {
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        const plants: PlantData[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: any) => ({
            PLANT: p.PLANT,
            PLANT_DESC: p.PLANT_DESC,
            WERKS: p.PLANT,
          }))
          : [];

        const divisions: DivData[] = Array.isArray(data.PLANT)
          ? Array.from(
            new Map<string, DivData>(
              data.PLANT.map((p: any) => [
                p.DIVISION,
                { DIVISION: p.DIVISION, DIV_TEXT: p.DIV_TEXT || p.DIVISION } as DivData,
              ])
            ).values()
          )
          : [];

        setPlantList(plants);
        setDivisionList(divisions);
      } catch (err) {
        // ignore failures for now — leave defaults in place
        // console.error('F4 fetch failed', err);
      }
    };
    void loadF4();
  }, []);

  // ── Load pdb dropdowns ──
  useEffect(() => {
    (async () => {
      try {
        const res: any = await service.getpdb();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};
        setBillingList(Array.isArray(data.BILLING_TYPE) ? data.BILLING_TYPE : []);
        setStatesList(Array.isArray(data.STATES) ? data.STATES : []);
        setCustomerList(Array.isArray(data.CUSTOMER) ? data.CUSTOMER : []);
      } catch (e) { console.error("getpdb failed:", e); }
    })();
  }, []);

  // ── Load Incoterms (for Non-SAP dropdown / display) ──
  useEffect(() => {
    (async () => {
      try {
        const res: any = await service.Incoterms({ INCO1: "", BEZEI: "" });
        setIncotermsList(Array.isArray(res) ? res : res?.data || []);
      } catch (err) { console.error("Error fetching Incoterms:", err); }
    })();
  }, []);

  // ── patchForm: fill form from SAP response, track which keys are non-empty ──
  const patchForm = useCallback((data: any) => {
    const physDispatch = convertPhysDispatchFormat(data.PHYS_DISPATCH || "");
    const invDate = convertToDateFormat(data.INV_DATE || "");

    const patched: FormState = {
      TaxInvoice: data.INV_VBELN || "",
      DCReference: data.INV_VBELN || "",
      InvoiceDate: isSap ? invDate : "",
      ReferenceDate: isSap ? "" : invDate,
      ODN: data.INV_ODNO || "",
      BasicShipment: data.BASIC_SHIP_VALUE || "",
      InvoiceWithGst: data.INV_VALUE_GST || "",
      FiscalYear: data.FISCAL_YEAR || "",
      FiscalQuarter: data.FISCAL_QUARTER || "",
      Month: data.MONTH || "",
      RequiredDateTime: data.ZVEHREQDT || "",
      ReportedDateTime: data.ZVEHREPDT || "",
      PhysicalDispatchDateTime: physDispatch,
      Plant: data.PLANT_NAME || "",
      TransactionType: data.TRAN_TYPE || "",
      BillingTransactionType: data.TRAN_TEXT_BILL || "",
      Division: data.DIVISION_TEXT || data.DIVISION || "",
      SubDivision: data.SUB_DIVISION || "",
      RefNumber: data.SO_REF_NO || "",
      Customer: data.CUST_NAME || "",
      CustomerGroup: data.CUST_GROUP || "",
      CUST_CODE: data.CUST_CODE || "",
      CNee: data.CNEE_NAME || "",
      DestinationLocation: data.DEST_LOC || "",
      DestinationState: data.DEST_STATE || "",
      DestinationZone: data.DEST_ZONE || "",
      Incoterms: data.ZINCO || "",
    };

    setForm(patched);

    // Track only keys that have a NON-EMPTY value from SAP
    const filled = new Set<keyof FormState>(
      (Object.keys(patched) as (keyof FormState)[]).filter((k) => patched[k] !== "")
    );
    setSapFilledKeys(filled);
    setSapFetched(true);

    if (physDispatch) setShowFiscalFields(true);
    setShowForm(true);
  }, [isSap]);

  // ── GET button ──
  const handleGet = async () => {
    if (isSap && !invoiceNumber.trim()) return;

    if (isSap) {
      const ZDATA = tableData
        .filter((r) => r.selected)
        .map((r) => ({ ZREFNO: r.REF_NO, LINENO: r.LINE_NO }));

      setLoadingGet(true);
      try {
        const res: any = await service.OrderinfoOutward({ VBELN: invoiceNumber.trim(), ZDATA });

        if (Array.isArray(res) && res[0]?.STATUS === "FALSE") {
          Swal.fire({ icon: "error", title: "Invoice Error", text: res[0].MESSAGE });
          return;
        }
        if (Array.isArray(res) && res.length > 0) {
          patchForm(res[0]);
          Swal.fire({ icon: "success", title: "Success", text: "Invoice details loaded", timer: 1500, showConfirmButton: false });
        } else {
          setShowForm(false);
          Swal.fire({ icon: "warning", text: "No Data" });
        }
      } catch {
        setShowForm(false);
        Swal.fire({ icon: "error", text: "Internal Server Error. Please try again later." });
      } finally {
        setLoadingGet(false);
      }
    } else {
      setShowForm(true);
    }
  };

  // ── Physical Dispatch → fiscal info ──
  const onPhysicalDispatchChange = async (value: string) => {
    setField("PhysicalDispatchDateTime", value);
    if (!value) {
      setField("Month", ""); setField("FiscalQuarter", ""); setField("FiscalYear", "");
      setShowFiscalFields(false);
      return;
    }
    try {
      const res: any = await service.OrderInfoPhysicaldispatch({ phys_dispatch: value });
      if (res) {
        setForm((p) => ({
          ...p,
          Month: res.FISCAL_MONTH || "",
          FiscalQuarter: res.FISCAL_QUARTER || "",
          FiscalYear: res.FISCAL_YEAR || "",
        }));
        setShowFiscalFields(true);
      }
    } catch (e) { console.error("Fiscal info error:", e); }
  };

  // ── State → zone ──
  const onDestinationStateChange = async (value: string) => {
    setField("DestinationState", value);
    if (!value) return;
    try {
      const res: any = await service.fetchzone({ STATE: value });
      setField("DestinationZone", res?.ZONE || "");
    } catch (e) { console.error("Zone fetch error:", e); }
  };

  // ── Row blur → global reference fetch ──
  const fetchGlobalReferences = async (row: TableRow, index: number, fieldKey: string) => {
    if (index !== 0) return;
    const value = (row as any)[fieldKey]?.trim();
    if (!value) return;

    const payload = {
      global_scr: "ORDER INFO",
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

  // ── Global Search ──
  const handleSearch = async () => {
    if (!searchValue.trim()) { Swal.fire({ icon: "warning", text: "Please enter a value" }); return; }
    if (!searchType) { Swal.fire({ icon: "info", text: "Please select a search type" }); return; }

    const payload = {
      global: "ORDER INFO",
      ZUSER: getLoggedInUser(),
      data: {
        ref_no: "", inv_no: "", so_no: "", transporter: "",
        lr_no: "", workorder_no: "", sales_person: "", location: "",
        odn_no: "", vehicle_no: "", freight_billno: "",
        nature_damage: "", claim_status: "",
        [searchType]: searchValue.trim(),
      },
    };

    setLoadingSearch(true);
    try {
      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        setSearchResults([]);
        Swal.fire({ icon: "warning", text: res.MESSAGE });
      } else if (!res?.HEADER || res.HEADER.length === 0) {
        setSearchResults([]);
        Swal.fire({ icon: "info", text: "No records found" });
      } else {
        setSearchResults(res.HEADER.map((item: any) => ({ ...item, isEdit: false })));
        setShowForm(false);
        Swal.fire({ icon: "success", text: "Data fetched successfully!", timer: 1200, showConfirmButton: false });
      }
    } catch {
      Swal.fire({ icon: "error", text: "Error fetching data" });
    } finally {
      setLoadingSearch(false);
    }
  };

  // ── Save ──
  const handleSave = async (action: "stay" | "next" | "previous" = "stay") => {
    const selectedRows = tableData.filter((r) => r.selected);
    if (selectedRows.length === 0) {
      Swal.fire({ icon: "warning", text: "Please select at least one row before saving" });
      return;
    }

    const invVbeln = isSap ? form.TaxInvoice : form.DCReference;
    const invDate = isSap ? form.InvoiceDate : form.ReferenceDate;

    const record = selectedRows.map((row) => ({
      REF_NO: row.REF_NO || "",
      WORK_ORDER_NO: row.WORK_ORDER_NO || "",
      LR_NO: row.LR_NO || "",
      TRANSPORTER: row.TRANSPORTER || "",
      LINE_NO: row.LINE_NO || "",
      INV_VBELN: invVbeln,
      INV_ODNO: form.ODN,
      INV_DATE: invDate,
      BASIC_SHIP_VALUE: form.BasicShipment,
      INV_VALUE_GST: form.InvoiceWithGst,
      ZVEHREQDT: form.RequiredDateTime,
      ZVEHREPDT: form.ReportedDateTime,
      PHYS_DISPATCH: form.PhysicalDispatchDateTime,
      FISCAL_YEAR: form.FiscalYear,
      FISCAL_QUARTER: form.FiscalQuarter,
      MONTH: form.Month,
      PLANT_NAME: form.Plant,
      TRAN_TYPE: form.TransactionType,
      TRAN_TEXT_BILL: form.BillingTransactionType,
      DIVISION: form.Division,
      SUB_DIVISION: form.SubDivision,
      SO_REF_NO: form.RefNumber,
      CUST_NAME: form.Customer,
      CUST_CODE: form.CUST_CODE,
      CUST_GROUP: form.CustomerGroup,
      CNEE_NAME: form.CNee,
      DEST_LOC: form.DestinationLocation,
      DEST_STATE: form.DestinationState,
      DEST_ZONE: form.DestinationZone,
      ZINCO: form.Incoterms,
      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",
    }));

    setLoadingSave(true);
    try {
      const res: any = isSap
        ? await service.OrderInfoOutwardSave({ CHANGE: "", SAVE: record })
        : await service.OrderInfoNonSap({ CHANGE: "", CREATE: record });

      if (res?.STATUS === "true" || res?.NUMBER === "200") {
        await Swal.fire({ icon: "success", title: "Success", text: res.MESSAGE || "Data saved successfully", confirmButtonText: "Ok" });
        if (action === "stay") {
          setForm(EMPTY_FORM);
          setTableData([EMPTY_ROW()]);
          setShowForm(false);
          setShowFiscalFields(false);
          setInvoiceNumber("");
          setSapFetched(false);
          setSapFilledKeys(new Set());
        }
        // For next/previous: parent handles navigation
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res?.MESSAGE || "Failed to save data" });
      }
    } catch {
      Swal.fire({ icon: "error", text: "Internal Server Error. Please try again later." });
    } finally {
      setLoadingSave(false);
    }
  };

  // ── Update search result row ──
  const updateSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "Do you want to update this record?",
      icon: "question", showCancelButton: true,
      confirmButtonText: "Yes, Update", cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    const payload = {
      REF_NO: row.ZREFNO || "", WORK_ORDER_NO: row.ZWORK_ORDER || "",
      LR_NO: row.ZLRNO || "", TRANSPORTER: row.ZTRANSPORTER || "",
      INV_VBELN: row.ZINV_NO || "", INV_ODNO: row.ZODN_NO || "",
      INV_DATE: row.ZINV_DATE || "", BASIC_SHIP_VALUE: row.ZBASIC_VALUE || "",
      INV_VALUE_GST: row.ZINV_VALUE_GST || "", PHYS_DISPATCH: row.ZPHY_DISPATCH || "",
      FISCAL_YEAR: row.ZFYEAR || "", FISCAL_QUARTER: row.ZFIS_QUARTER || "",
      MONTH: row.ZFIS_MONTH || "", PLANT_NAME: row.ZPLANT || "",
      TRAN_TYPE: row.ZTRX_TYPE || "", TRAN_TEXT_BILL: row.ZBILL_TRX_TEXT || "",
      ZVEHREQDT: row.ZVEHREQDT || "", ZVEHREPDT: row.ZVEHREPDT || "",
      DIVISION: row.ZDIVISION || "", SUB_DIVISION: row.ZSUB_DIVISION || "",
      SO_REF_NO: row.ZSO_NO || "", CUST_NAME: row.ZCUST_NAME || "",
      CUST_CODE: row.ZCUST_CODE || "", LINE_NO: row.ZLINE_NO || "",
      CUST_GROUP: row.ZCUST_GRP || "", CNEE_NAME: row.ZCONSIGN_NAME || "",
      DEST_LOC: row.ZDES_LOC || "", DEST_STATE: row.ZSTATE || "",
      DEST_ZONE: row.ZZONE || "", ZUSER: row.ZUSER,
      ZUSER_CH: getLoggedInUser(),
    };

    try {
      const res: any = isSap
        ? await service.OrderInfoOutwardSave({ CHANGE: "X", SAVE: [payload] })
        : await service.OrderInfoNonSap({ CHANGE: "X", CREATE: [payload] });

      if (res?.STATUS === "true" || res?.NUMBER === "200") {
        setSearchResults((prev) => prev.map((r, i) => i === index ? { ...r, isEdit: false } : r));
        Swal.fire({ icon: "success", title: "Success", text: res.MESSAGE || "Updated successfully" });
        handleSearch();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res?.MESSAGE || "Failed to update" });
      }
    } catch {
      Swal.fire({ icon: "error", text: "Internal Server Error." });
    }
  };

  // ── Delete search result row ──
  const deleteSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?", text: "This action cannot be undone.",
      icon: "warning", showCancelButton: true,
      confirmButtonText: "Yes, Delete", cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    const payload = { DELETE: [{ ZREFNO: row.ZREFNO, ZINV_NO: row.ZINV_NO, ZLINE_NO: row.ZLINE_NO }] };

    try {
      const res: any = isSap
        ? await service.OrderInfoDeleteWithSap(payload)
        : await service.OrderInfoDeleteWithoutSap(payload);

      if (res?.STATUS === "TRUE" || res?.STATUS === true) {
        setSearchResults((prev) => prev.filter((_, i) => i !== index));
        Swal.fire({ icon: "success", title: "Deleted", text: res.MESSAGE || "Record deleted" });
      } else {
        Swal.fire({ icon: "error", title: "Failed", text: res?.MESSAGE || "Delete failed" });
      }
    } catch {
      Swal.fire({ icon: "error", text: "Something went wrong while deleting." });
    }
  };

  // ── Table helpers ──
  const handleRowChange = (index: number, field: keyof TableRow, value: string) =>
    setTableData((prev) => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));

  const toggleRowSelect = (index: number) =>
    setTableData((prev) => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));

  const removeRow = (index: number) => {
    if (tableData.length === 1) return;
    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Renders a text/date/datetime input field with SAP-aware colouring.
   * - SAP filled  → green + readonly
   * - SAP empty   → red + editable
   * - No SAP yet  → normal
   */
  const renderInput = (
    key: keyof FormState,
    type: string = "text",
    alwaysReadonly: boolean = false
  ) => {
    const filled = sapFetched && sapFilledKeys.has(key);
    const unfilled = sapFetched && !sapFilledKeys.has(key);
    const cls = filled ? INPUT_SAP_FILLED : unfilled ? INPUT_SAP_EMPTY : alwaysReadonly ? INPUT_READONLY : INPUT_NORMAL;
    const ro = filled || alwaysReadonly;

    return (
      <input
        type={type}
        value={form[key]}
        readOnly={ro}
        onChange={(e) => !ro && setField(key, e.target.value)}
        className={cls}
      />
    );
  };

  /**
   * Renders a <select> with SAP-aware colouring.
   * - SAP filled  → show as readonly green input (value as text, not dropdown)
   * - SAP empty   → red editable dropdown
   * - No SAP yet  → normal dropdown
   */
  const renderSelect = (
    key: keyof FormState,
    children: React.ReactNode
  ) => {
    const filled = sapFetched && sapFilledKeys.has(key);
    const unfilled = sapFetched && !sapFilledKeys.has(key);

    if (filled) {
      // Green readonly input showing the value text
      return <input value={form[key]} readOnly className={INPUT_SAP_FILLED} />;
    }

    const cls = unfilled ? INPUT_SAP_EMPTY : INPUT_NORMAL;
    return (
      <select value={form[key]} onChange={(e) => setField(key, e.target.value)} className={cls}>
        {children}
      </select>
    );
  };

  const renderCustomerCombobox = (key: keyof FormState, placeholder: string) => {
    const filled = sapFetched && sapFilledKeys.has(key);
    const unfilled = sapFetched && !sapFilledKeys.has(key);

    if (filled) {
      return <input value={form[key]} readOnly className={INPUT_SAP_FILLED} />;
    }

    const cls = unfilled ? INPUT_SAP_EMPTY : INPUT_NORMAL;
    const options: ComboOption[] = customerList.map((c) => ({ code: c.CUSTOMER, label: c.CUSTOMER_NAME }));

    return (
      <SearchableCombobox
        value={form[key]}
        onSelect={(label) => setField(key, label)}
        options={options}
        placeholder={placeholder}
        className={cls}
      />
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // JSX
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-2">

      {/* ── Reference table ── */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              {["Select", "Sl.No", "Reference Number", "Work Order Number", "LR Number", "Transporter", "Action"].map(h => (
                <th key={h} className="px-3 py-1 text-center">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, i) => (
              <tr key={i} className="border-t border-hairline/60">
                <td className="px-3 py-1 text-center">
                  <input type="checkbox" checked={row.selected}
                    onChange={() => toggleRowSelect(i)} className="size-4 accent-sky-600" />
                </td>
                <td className="px-3 py-1 text-center">{i + 1}</td>
                {(["REF_NO", "WORK_ORDER_NO", "LR_NO", "TRANSPORTER"] as const).map((field) => (
                  <td key={field} className="px-3 py-1">
                    <input
                      value={(row as any)[field] || ""}
                      readOnly={i !== 0}
                      onChange={(e) => handleRowChange(i, field, e.target.value)}
                      onBlur={() => fetchGlobalReferences(row, i, field)}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") fetchGlobalReferences(row, i, field); }}
                      className={i !== 0 ? INPUT_READONLY : INPUT_NORMAL}
                    />
                  </td>
                ))}
                <td className="px-3 py-1 text-center">
                  {tableData.length > 1 && (
                    <button onClick={() => removeRow(i)}
                      className="size-6 grid place-items-center rounded-md text-red-500 hover:bg-red-50">
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Invoice lookup + search bar ── */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">

          {/* SAP: Invoice Number + GET */}
          {isSap && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={LABEL}>Invoice Number</label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGet(); }}
                  className={INPUT_NORMAL}
                  placeholder="Enter invoice number"
                />
              </div>
              <button
                onClick={handleGet}
                disabled={!invoiceNumber.trim() || loadingGet}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm flex items-center gap-1.5"
              >
                {loadingGet && <Loader2 className="size-3.5 animate-spin" />}
                GET
              </button>
            </>
          )}

          {/* Search type */}
          <div className="min-w-[160px]">
            <label className={LABEL}>Search By</label>
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

          {/* Search input + button */}
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
              {loadingSearch ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </button>
          </div>
        </div>

        {/* Hints */}
        {isSap && !showForm && !sapFetched && (
          <p className="mt-2 text-[12px] text-muted-foreground px-1">
            Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
          </p>
        )}
      </div>

      {/* ── Colour legend (only shown after SAP GET) ── */}
      {isSap && sapFetched && (
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

      {/* ── Search results table ── */}
      {searchResults.length > 0 && (
        <div className="max-h-[560px] overflow-auto">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  {["REFNO", "Invoice No", "Line No", "ODN No", "Invoice Date", "Basic Value", "Invoice Value (GST)",
                    "Required D&T", "Reported D&T", "Physical Dispatch", "Fiscal Year", "System Date",
                    "Fiscal Quarter", "Fiscal Month", "Plant", "Txn Type", "Bill Text", "Division", "Sub Division",
                    "SO Ref No", "Customer", "Cust. Group", "Consignee", "Dest. Location", "State", "Zone",
                    "Work Order", "LR No", "Transporter", "Created Date", "Veh. Type", "Action"].map(h => (
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
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZINV_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZODN_NO}</td>
                    {[
                      { field: "ZINV_DATE", type: "date" },
                      { field: "ZBASIC_VALUE", type: "number" },
                      { field: "ZINV_VALUE_GST", type: "number" },
                      { field: "ZVEHREQDT", type: "datetime-local" },
                      { field: "ZVEHREPDT", type: "datetime-local" },
                      { field: "ZPHY_DISPATCH", type: "datetime-local" },
                      { field: "ZFYEAR", type: "text" },
                      { field: "ZSYS_DATE", type: "date" },
                      { field: "ZFIS_QUARTER", type: "text" },
                      { field: "ZFIS_MONTH", type: "text" },
                      { field: "ZPLANT", type: "text" },
                      { field: "ZTRX_TYPE", type: "text" },
                      { field: "ZBILL_TRX_TEXT", type: "text" },
                      { field: "ZDIVISION", type: "text" },
                      { field: "ZSUB_DIVISION", type: "text" },
                      { field: "ZSO_NO", type: "text" },
                      { field: "ZCUST_NAME", type: "text" },
                      { field: "ZCUST_GRP", type: "text" },
                      { field: "ZCONSIGN_NAME", type: "text" },
                      { field: "ZDES_LOC", type: "text" },
                      { field: "ZSTATE", type: "text" },
                      { field: "ZZONE", type: "text" },
                      { field: "ZWORK_ORDER", type: "text" },
                      { field: "ZLRNO", type: "text" },
                      { field: "ZTRANSPORTER", type: "text" },
                      { field: "ZCREATED_DT", type: "date" },
                      { field: "ZVEH_TYPE", type: "text" },
                    ].map(({ field, type }) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                        {item.isEdit ? (
                          <input type={type} value={item[field] || ""}
                            onChange={(e) => setSearchResults((prev) =>
                              prev.map((r, idx) => idx === i ? { ...r, [field]: e.target.value } : r))}
                            className="h-6 w-24 rounded border border-input px-1 text-[11px] bg-white" />
                        ) : (
                          <span>{type === "date" && item[field]
                            ? new Date(item[field]).toLocaleDateString("en-GB")
                            : item[field] || ""}</span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-0.5 text-center">
                      {!item.isEdit ? (
                        <div className="flex items-center gap-1 justify-center">
                          <button onClick={() => setSearchResults((prev) =>
                            prev.map((r, idx) => idx === i ? { ...r, _backup: { ...r }, isEdit: true } : r))}
                            className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button onClick={() => deleteSearchRow(item, i)}
                            className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 justify-center">
                          <button onClick={() => updateSearchRow(item, i)}
                            className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button onClick={() => setSearchResults((prev) =>
                            prev.map((r, idx) => idx === i ? { ...r._backup, isEdit: false } : r))}
                            className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
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
          </div>
        </div>
      )}

      {/* ── Main form ── */}
      {showForm && (
        <>
          <div className="bg-surface border border-hairline rounded-xl p-3 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-3">

              {/* Tax Invoice / DC Reference */}
              <div>
                <FieldLabel label={isSap ? "Tax Invoice" : "DC Reference Number"} fromSap={sapFetched && sapFilledKeys.has("TaxInvoice")} />
                {renderInput(isSap ? "TaxInvoice" : "DCReference")}
              </div>

              {/* ODN */}
              <div>
                <FieldLabel label="ODN Number" fromSap={sapFetched && sapFilledKeys.has("ODN")} />
                {renderInput("ODN")}
              </div>

              {/* Invoice Date / Reference Date */}
              <div>
                <FieldLabel label={isSap ? "Invoice Date" : "Reference Date"} fromSap={sapFetched && sapFilledKeys.has("InvoiceDate")} />
                {renderInput(isSap ? "InvoiceDate" : "ReferenceDate", "date")}
              </div>

              {/* Basic Shipment */}
              <div>
                <FieldLabel label="Basic Shipment Value" fromSap={sapFetched && sapFilledKeys.has("BasicShipment")} />
                {renderInput("BasicShipment")}
              </div>

              {/* Invoice With GST */}
              <div>
                <FieldLabel label="Invoice Value With GST" fromSap={sapFetched && sapFilledKeys.has("InvoiceWithGst")} />
                {renderInput("InvoiceWithGst")}
              </div>

              {/* Required DateTime */}
              {/* <div>
                <FieldLabel label="Required Date & Time" fromSap={sapFetched && sapFilledKeys.has("RequiredDateTime")} />
                {renderInput("RequiredDateTime", "datetime-local")}
              </div> */}

              {/* Reported DateTime */}
              {/* <div>
                <FieldLabel label="Reported Date & Time" fromSap={sapFetched && sapFilledKeys.has("ReportedDateTime")} />
                {renderInput("ReportedDateTime", "datetime-local")}
              </div> */}

              {/* Physical Dispatch — always editable, triggers fiscal fetch */}
              {/* <div>
                <FieldLabel label="Physical Dispatch Date & Time" fromSap={sapFetched && sapFilledKeys.has("PhysicalDispatchDateTime")} />
                <input
                  type="datetime-local"
                  value={form.PhysicalDispatchDateTime}
                  onChange={(e) => onPhysicalDispatchChange(e.target.value)}
                  className={
                    sapFetched && sapFilledKeys.has("PhysicalDispatchDateTime")
                      ? INPUT_SAP_FILLED
                      : sapFetched
                      ? INPUT_SAP_EMPTY
                      : INPUT_NORMAL
                  }
                  readOnly={sapFetched && sapFilledKeys.has("PhysicalDispatchDateTime")}
                />
              </div> */}

              {/* Fiscal fields (shown after physical dispatch) */}
              {/* {showFiscalFields && (
                <>
                  <div>
                    <FieldLabel label="Fiscal Year" fromSap={sapFetched && sapFilledKeys.has("FiscalYear")} />
                    {renderInput("FiscalYear", "text", true)}
                  </div>
                  <div>
                    <FieldLabel label="Fiscal Quarter" fromSap={sapFetched && sapFilledKeys.has("FiscalQuarter")} />
                    {renderInput("FiscalQuarter", "text", true)}
                  </div>
                  <div>
                    <FieldLabel label="Month" fromSap={sapFetched && sapFilledKeys.has("Month")} />
                    {renderInput("Month", "text", true)}
                  </div>
                </>
              )} */}

              {/* Plant */}
              <div>
                <FieldLabel label="Plant" fromSap={sapFetched && sapFilledKeys.has("Plant")} />
                {renderSelect("Plant",
                  <>
                    <option value="">Select Plant</option>
                    {plantList.map((p: any) => (
                      <option key={p.WERKS || p.PLANT} value={p.PLANT_DESC}>
                        {p.WERKS || p.PLANT} - {p.PLANT_DESC}
                      </option>
                    ))}
                  </>
                )}
              </div>

              {/* Transaction Type */}


              {/* Billing Transaction Type */}
              <div>
                <FieldLabel label="Billing Transaction Type" fromSap={sapFetched && sapFilledKeys.has("BillingTransactionType")} />
                {renderSelect("BillingTransactionType",
                  <>
                    <option value="">Select Billing Type</option>
                    {billingList.map((b) => (
                      <option key={b.BILL_TYPE} value={b.BILL_TYPE_DESC}>
                        {b.BILL_TYPE} - {b.BILL_TYPE_DESC}
                      </option>
                    ))}
                  </>
                )}
              </div>

              {/* Division */}
              <div>
                <FieldLabel label="Division" fromSap={sapFetched && sapFilledKeys.has("Division")} />
                {renderSelect("Division",
                  <>
                    <option value="">Select Division</option>
                    {divisionList.map((d) => (
                      <option key={d.DIVISION} value={d.DIVISION}>{d.DIV_TEXT}</option>
                    ))}
                  </>
                )}
              </div>



              {/* SO / Ref Number */}
              <div>
                <FieldLabel label="SO / Ref. Number" fromSap={sapFetched && sapFilledKeys.has("RefNumber")} />
                {renderInput("RefNumber")}
              </div>

              {/* Customer Name */}
              <div>
                <FieldLabel label="Customer Name" fromSap={sapFetched && sapFilledKeys.has("Customer")} />
                {renderCustomerCombobox("Customer", "Search customer code/name...")}
              </div>



              {/* Consignee Name */}
              <div>
                <FieldLabel label="Consignee Name" fromSap={sapFetched && sapFilledKeys.has("CNee")} />
                {renderCustomerCombobox("CNee", "Search consignee code/name...")}
              </div>

              {/* Destination Location */}
              <div>
                <FieldLabel label="Destination Location" fromSap={sapFetched && sapFilledKeys.has("DestinationLocation")} />
                {renderInput("DestinationLocation")}
              </div>

              {/* Destination State */}
              <div>
                <FieldLabel label="Destination State" fromSap={sapFetched && sapFilledKeys.has("DestinationState")} />
                {(() => {
                  const filled = sapFetched && sapFilledKeys.has("DestinationState");
                  const unfilled = sapFetched && !sapFilledKeys.has("DestinationState");
                  if (filled) return <input value={form.DestinationState} readOnly className={INPUT_SAP_FILLED} />;
                  return (
                    <select
                      value={form.DestinationState}
                      onChange={(e) => onDestinationStateChange(e.target.value)}
                      className={unfilled ? INPUT_SAP_EMPTY : INPUT_NORMAL}
                    >
                      <option value="">Select State</option>
                      {statesList.map((s) => (
                        <option key={s.STATE} value={s.STATE}>{s.STATE}</option>
                      ))}
                    </select>
                  );
                })()}
              </div>

              {/* Destination Zone — always readonly, auto-filled by zone API from State */}
              <div>
                <label className={LABEL}>
                  Destination Zone
                  {form.DestinationZone && (
                    <span className="ml-1.5 inline-flex items-center px-1.5 rounded text-[9px] font-bold bg-violet-100 text-violet-700 border border-violet-300 leading-tight align-middle">
                      From Logic
                    </span>
                  )}
                </label>
                <input
                  value={form.DestinationZone}
                  readOnly
                  placeholder="Auto-filled from State"
                  className={
                    form.DestinationZone
                      ? "h-7 w-full rounded-md bg-violet-50 border-2 border-violet-400 px-2 text-[12px] text-violet-900 font-semibold outline-none cursor-not-allowed"
                      : INPUT_READONLY
                  }
                />
              </div>

              <div>
                <FieldLabel label="Transaction Type" fromSap={sapFetched && sapFilledKeys.has("TransactionType")} />
                {renderSelect("TransactionType",
                  <>
                    <option value="">Select Mode of Transport</option>
                    {[
                      { value: "FULL TRUCK LOAD", label: "FULL TRUCK LOAD" },
                      { value: "CARGO", label: "CARGO" },
                      { value: "RATECONTRACT", label: "RATE CONTRACT" },
                      { value: "LOCALTRANSPORTATION", label: "LOCAL TRANSPORTATION" },
                      { value: "CUSTOMERTRANSPORTER", label: "CUSTOMER TRANSPORTER" },
                      { value: "COMPANYVEHICLE", label: "COMPANY VEHICLE" },
                      { value: "COURIER", label: "COURIER" },
                      { value: "BYHAND", label: "BY HAND" },
                    ].map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </>
                )}
              </div>

              {/* Sub Division */}
              <div>
                <FieldLabel label="Sub Division" fromSap={sapFetched && sapFilledKeys.has("SubDivision")} />
                {renderSelect("SubDivision",
                  <>
                    <option value="">Select Sub Division</option>
                    {["FUZE", "IPS SYSTEM", "LITHIUM", "NCFP", "NCPP", "NCPP-VSEZ", "NCPP/ETP",
                      "NCSP", "PE", "SILVER ZINC", "SYSTEM ORDERS", "THERMAL", "THERMAL,FUZE,SZ"].map(v => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                  </>
                )}
              </div>

              {/* Customer Group */}
              <div>
                <FieldLabel label="Customer Group" fromSap={sapFetched && sapFilledKeys.has("CustomerGroup")} />
                {renderInput("CustomerGroup")}
              </div>

            </div>
          </div>

          {/* ── Save buttons ── */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button
              onClick={() => handleSave("previous")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              <ChevronLeft className="size-3.5" /> Save &amp; Previous
            </button>
            <button
              onClick={() => handleSave("stay")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              {loadingSave ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Save
            </button>
            <button
              onClick={() => handleSave("next")}
              disabled={loadingSave}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              Save &amp; Next <ChevronRight className="size-3.5" />
            </button>
          </div>
        </>

        
      )}
      
    </div>
  );
}