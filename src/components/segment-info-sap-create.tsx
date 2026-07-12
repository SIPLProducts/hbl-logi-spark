import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, Trash2, Save, ChevronLeft, ChevronRight, Loader2, Pencil, Check, X as XIcon } from "lucide-react";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const READONLY_INPUT =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

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
        return {
          MAPID: d.MAPID,
          referenceNumber: d.REF_NO || d.referenceNumber || "",
          workOrderNumber: d.WORK_ORDER_NO || d.workOrderNumber || "",
          lrNumber: d.LR_NO || d.lrNumber || "",
          transporter: d.TRANSPORTER || d.transporter || "",
          soNumber: d.SO_NO || d.soNumber || "",
          odnNumber: d.ODN_NO || d.odnNumber || "",
          SONO: "",
          ODN_NO: "",
          lineNumber: d.LINE_NO || d.ZLINE_NO || d.lineNumber || "",
          selected: false,
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
    setShowForm(true);
  };

  const handleGet = async () => {
    if (!invoiceNumber.trim()) return;
    setLoadingGet(true);
    try {
      const res: any = await service.SegmentInfoOutwardFetch({ VBELN: invoiceNumber.trim(), SCREEN: "WITHSAP" });
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
    try {
      const res: any = await service.SegmentInfoOutwardwithoutSapFetch({ INV_VBELN: invNo, SCREEN: "WITHOUTSAP" });
      if (res) {
        setForm((p) => ({ ...p, ZSTATE: res.ZSTATE || "", ZZONE: res.ZZONE || "" }));
      } else {
        Swal.fire("No Data Found", "", "info");
      }
    } catch {
      Swal.fire("Error fetching invoice details", "", "error");
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
    !form.INV_VBELN || !form.SALE_PERSON || !form.SEGMENT || !form.APPTYP || !form.BRANCH || !form.TAT_Type || !form.TAT_DAYS || !form.ETA_DATE;

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
          navigate({ to: "/vehicle-info" });
        } else if (action === "previous") {
          navigate({ to: "/invoice-load-details" });
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
            {tableData.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRowSelect(i)}
                    className="size-4 accent-sky-600"
                  />
                </td>
                <td className="px-3 py-0.5 text-center">{i + 1}</td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.referenceNumber}
                    readOnly={i !== 0}
                    maxLength={10}
                    placeholder="Enter Ref. No."
                    onChange={(e) => handleRowChange(i, "referenceNumber", e.target.value)}
                    onBlur={() => onRowFieldCommit(i, "referenceNumber")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "referenceNumber"); }}
                    className={(i !== 0 ? READONLY_INPUT : GREEN_INPUT) + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.workOrderNumber}
                    readOnly={i !== 0}
                    placeholder="Enter Work Order No."
                    onChange={(e) => handleRowChange(i, "workOrderNumber", e.target.value)}
                    onBlur={() => onRowFieldCommit(i, "workOrderNumber")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "workOrderNumber"); }}
                    className={(i !== 0 ? READONLY_INPUT : GREEN_INPUT) + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.lrNumber}
                    readOnly={i !== 0}
                    placeholder="Enter LR No."
                    onChange={(e) => handleRowChange(i, "lrNumber", e.target.value)}
                    onBlur={() => onRowFieldCommit(i, "lrNumber")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "lrNumber"); }}
                    className={(i !== 0 ? READONLY_INPUT : GREEN_INPUT) + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.transporter}
                    readOnly={i !== 0}
                    placeholder="Enter Transporter"
                    onChange={(e) => handleRowChange(i, "transporter", e.target.value)}
                    onBlur={() => onRowFieldCommit(i, "transporter")}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Tab") onRowFieldCommit(i, "transporter"); }}
                    className={(i !== 0 ? READONLY_INPUT : GREEN_INPUT) + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5 text-center">
                  {tableData.length > 1 && (
                    <button
                      onClick={() => removeRow(i)}
                      className="inline-grid place-items-center size-7 rounded-md text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
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
                <select
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onBlur={() => setInvoiceTouched(true)}
                  className={GREEN_INPUT}
                >
                  <option value="" disabled>Select Invoice</option>
                  {invoiceF4List.map((inv) => (
                    <option key={inv} value={inv}>{inv}</option>
                  ))}
                </select>
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
              {loadingSearch ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            </button>
          </div>
        </div>
      </div>

      {isSap && !showForm && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {/* Search results table */}
      {searchResults.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                  {["Ref No", "Invoice No", "Line No", "ODN No", "SO NO", "Sales Person", "Segment", "Application Type",
                    "Customer Profile", "Branch", "Branch Zone", "TAT Type", "TAT Days", "ETA", "Work Order", "LR No",
                    "Transporter", "Plant", "Division", "Created Date", "Vehicle Type", "Action"].map((h) => (
                      <th key={h} className="px-2 py-1.5 whitespace-nowrap text-left">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {searchResults.map((item, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface" : "bg-surface-2/40"}>
                    <td className="px-2 py-1 whitespace-nowrap">{item.ZREFNO}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{item.ZINV_NUM}</td>
                    <td className="px-2 py-1 whitespace-nowrap">{item.ZLINE_NO}</td>
                    {[
                      { field: "ZODN_NO", type: "text" },
                      { field: "ZSO_NO", type: "text" },
                      { field: "ZSALE_PERSON", type: "text" },
                      { field: "ZSEGMENT", type: "text" },
                      { field: "ZAPPTYP", type: "text" },
                      { field: "ZCUST_PROFILE", type: "text" },
                      { field: "ZBRANCH", type: "text" },
                      { field: "ZBRANCH_ZONE", type: "text" },
                      { field: "ZTAT_TYPE", type: "text" },
                      { field: "ZTAT", type: "text" },
                      { field: "ZETA", type: "date" },
                      { field: "ZWORK_ORDER", type: "text" },
                      { field: "ZLRNO", type: "text" },
                      { field: "ZTRANSPORTER", type: "text" },
                      { field: "ZPLANT", type: "text" },
                      { field: "ZDIVISION", type: "text" },
                      { field: "ZCREATED_DT", type: "date" },
                      { field: "ZVEH_TYPE", type: "text" },
                    ].map(({ field, type }) => (
                      <td key={field} className="px-2 py-1 whitespace-nowrap">
                        {item.isEdit ? (
                          <input
                            type={type}
                            value={item[field] || ""}
                            onChange={(e) => updateSearchField(i, field, e.target.value)}
                            className="h-6 w-24 rounded border border-input px-1 text-[11px] bg-white"
                          />
                        ) : (
                          <span>
                            {type === "date" && item[field] ? new Date(item[field]).toLocaleDateString("en-GB") : item[field] || ""}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center">
                      {!item.isEdit ? (
                        <div className="inline-flex items-center gap-1">
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
                  <select
                    value={form.INV_VBELN}
                    onChange={(e) => onInvoiceChange(e.target.value)}
                    onBlur={() => setInvoiceTouched(true)}
                    className={GREEN_INPUT}
                  >
                    <option value="" disabled>Select Invoice Number</option>
                    {invoiceF4List.map((inv) => (
                      <option key={inv} value={inv}>{inv}</option>
                    ))}
                  </select>
                  {invoiceTouched && !form.INV_VBELN && (
                    <span className="text-[10px] text-destructive">Invoice Number is required</span>
                  )}
                </div>
              )}

              {/* Sales Person */}
              <div>
                <label className={LABEL}>Sales Person</label>
                {isWithout || showF4.SALE_PERSON ? (
                  <select
                    value={form.SALE_PERSON}
                    onChange={(e) => setField("SALE_PERSON", e.target.value)}
                    className={GREEN_INPUT}
                  >
                    <option value="" disabled>Select Sales Person</option>
                    {supplierList.map((s: any, idx: number) => (
                      <option key={idx} value={s.SUPPLIER_NAME}>
                        {s.SUPPLIER} - {s.SUPPLIER_NAME}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input value={form.SALE_PERSON} readOnly className={READONLY_INPUT} />
                )}
              </div>

              {/* Segment */}
              <div>
                <label className={LABEL}>Segment</label>
                {isWithout || showF4.SEGMENT ? (
                  <select value={form.SEGMENT} onChange={(e) => setField("SEGMENT", e.target.value)} className={GREEN_INPUT}>
                    <option value="" disabled>Select Segment</option>
                    {segmentList.map((seg: any, idx: number) => (
                      <option key={idx} value={seg.SEGMENT_DESC}>{seg.SEGMENT} - {seg.SEGMENT_DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.SEGMENT} readOnly className={READONLY_INPUT} />
                )}
              </div>

              {/* Application Type */}
              <div>
                <label className={LABEL}>Application Type</label>
                {isWithout || showF4.APPTYP ? (
                  <select
                    value={form.APPTYP && typeof form.APPTYP === "object" ? JSON.stringify(form.APPTYP) : ""}
                    onChange={(e) => {
                      const app = appTypeList.find((a: any) => JSON.stringify(a) === e.target.value);
                      setField("APPTYP", app || "");
                    }}
                    className={GREEN_INPUT}
                  >
                    <option value="">Select Application Type</option>
                    {appTypeList.map((app: any, idx: number) => (
                      <option key={idx} value={JSON.stringify(app)}>{app.APPTYP} - {app.DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={typeof form.APPTYP === "string" ? form.APPTYP : ""} readOnly className={READONLY_INPUT} />
                )}
              </div>

              {/* Customer Profile */}
              <div>
                <label className={LABEL}>Customer Profile</label>
                {isWithout || showF4.CUST_PROF ? (
                  <select value={form.CUST_PROF} onChange={(e) => setField("CUST_PROF", e.target.value)} className={GREEN_INPUT}>
                    <option value="">Select Customer Profile</option>
                    {custGrpList.map((c: any, idx: number) => (
                      <option key={idx} value={c.CUST_PROF_DESC}>{c.CUST_PROF} - {c.CUST_PROF_DESC}</option>
                    ))}
                  </select>
                ) : (
                  <input value={form.CUST_PROF} readOnly className={READONLY_INPUT} />
                )}
              </div>

              {/* Branch */}
              <div>
                <label className={LABEL}>Branch</label>
                <select value={form.BRANCH} onChange={(e) => fetchZoneChange(e.target.value)} className={GREEN_INPUT}>
                  <option value="">Select Branch (State)</option>
                  {branchList.map((b: any, idx: number) => (
                    <option key={idx} value={b.BRANCH_DESC}>{b.BRANCH_DESC}</option>
                  ))}
                </select>
              </div>

              {/* Branch Zone */}
              <div>
                <label className={LABEL}>Branch Zone</label>
                <input value={form.BRANCH_ZONE} onChange={(e) => setField("BRANCH_ZONE", e.target.value)} className={GREEN_INPUT} />
              </div>

              {/* Destination State */}
              <div>
                <label className={LABEL}>Destination State</label>
                <input value={form.ZSTATE} onChange={(e) => setField("ZSTATE", e.target.value)} className={GREEN_INPUT} />
              </div>

              {/* Destination Zone */}
              <div>
                <label className={LABEL}>Destination Zone</label>
                <input value={form.ZZONE} onChange={(e) => setField("ZZONE", e.target.value)} className={GREEN_INPUT} />
              </div>

              {/* TAT Type */}
              <div>
                <label className={LABEL}>TAT Type</label>
                <select value={form.TAT_Type} onChange={(e) => onTatTypeChange(e.target.value)} className={GREEN_INPUT}>
                  <option value="">Select TAT Type</option>
                  {TAT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* TAT Days */}
              <div>
                <label className={LABEL}>TAT (Days)</label>
                <input value={form.TAT_DAYS} onChange={(e) => setField("TAT_DAYS", e.target.value)} className={GREEN_INPUT} />
              </div>

              {/* ETA */}
              <div>
                <label className={LABEL}>ETA</label>
                <input type="date" value={form.ETA_DATE} onChange={(e) => setField("ETA_DATE", e.target.value)} className={GREEN_INPUT} />
              </div>
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
              {loadingSave ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />} Save
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
    </div>
  );
}
