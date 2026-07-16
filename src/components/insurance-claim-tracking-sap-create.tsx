import { useState, useEffect } from "react";
import { Search, MoreVertical, Save, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

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
};
const EMPTY_ROW = (): TableRow => ({
  REF_NO: "",
  MAPID: "",
  WORK_ORDER_NO: "",
  LR_NO: "",
  TRANSPORTER: "",
  LINE_NO: "",
  selected: false,
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

const BASE_FIELDS: FieldSpec[] = [
  { label: "Fiscal Year", key: "FI" },
  { label: "Reported Date", key: "REP_DATE", type: "date" },
  { label: "Claim Reference", key: "CLAIM_REF" },
  { label: "Invoice Date", key: "INV_DATE", type: "date" },
  { label: "Invoice Basic Value", key: "INV_BV" },
  { label: "Loss Declared", key: "LOSS_DCL" },
  { label: "Claim Received", key: "CLM_RF", type: "date" },
  { label: "Salvage Value", key: "SOL_VAL" },
  { label: "Customer", key: "CUSTOMER" },
  { label: "SO Number", key: "SO_NO" },
  { label: "Location", key: "LOCATION" },
  { label: "Damage Remarks", key: "DAMAGE_RMK", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"] },
  { label: "Claim Info Sent", key: "CLM_INF" },
  { label: "Claim Status", key: "CLM_ST", type: "select", options: ["Under preparation", "Submitted", "Not submitted"] },
  { label: "Claim Document Status", key: "CLM_DOC_ST" },
  { label: "Courier Details", key: "COURIER_DET" },
  { label: "Payment Status", key: "PAY_ST", type: "select", options: ["Pending", "Settled"] },
  { label: "Payment Info", key: "PAY_INFO" },
  { label: "UTR", key: "UTR" },
  { label: "Claim Settlement Date", key: "CLM_SET_DT", type: "date" },
  { label: "Supporting Document", key: "ZSUPT_DOC", type: "file" },
  { label: "Approve Document", key: "ZAPP_DOC", type: "file" },
];

export function InsuranceClaimTrackingSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {

  const isWithout = mode === "without";
  const isSap = !isWithout;

  const [checked, setChecked] = useState(!isWithout);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [lookupValue, setLookupValue] = useState("");
  const [tableData, setTableData] = useState<TableRow[]>([EMPTY_ROW()]);
  const [revealed, setRevealed] = useState(false);

  const [headerData, setHeaderData] = useState<any>({});
  const [itemData, setItemData] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<TableRow[]>([]);

  const [supportingBase64, setSupportingBase64] = useState("");
  const [supportingPath, setSupportingPath] = useState("");
  const [approveBase64, setApproveBase64] = useState("");
  const [approvePath, setApprovePath] = useState("");

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
    setApproveBase64("");
    setApprovePath("");
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

  // ---------------------------------------------------------------------
  // Reference table (top) — multi-select, drives the F4 invoice list
  // ---------------------------------------------------------------------

  const onCheckboxChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const checked = event.target.checked;
    const rowValue = tableData[index];

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

        return {
          MAPID: d.MAPID || "",
          REF_NO: d.REF_NO || "",
          WORK_ORDER_NO: d.WORK_ORDER_NO || "",
          LR_NO: d.LR_NO || "",
          TRANSPORTER: d.TRANSPORTER || "",
          LINE_NO: d.LINE_NO || "",
          selected: false,
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
      WORK_ORDER: selectedObj.WORK_ORDER_NO || "",
      LR_NO: selectedObj.LR_NO || "",
      TRANSPORTER: selectedObj.TRANSPORTER || "",
      ZLINE_NO: selectedObj.LINE_NO,
    };
    setItemData(updatedItems);
  };

  const addItemRow = () => {
    setItemData((prev: any[]) => [
      ...prev,
      {
        selected: false,
        ZMAPID: "",
        ZREFNO: "",
        ZLINE_NO: "",
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
    if (!lookupValue.trim()) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter Invoice Number" });
      return;
    }

    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select one reference row" });
      return;
    }

    const payload = {
      VBELN: lookupValue,
      ZREFNO: selectedRow.REF_NO || "",
      ZMAPID: selectedRow.MAPID || "",
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

      const header = res?.[0]?.HEADER || {};
      const items = res?.[0]?.ITEM || [];

      setHeaderData({
        INV_NO: header.INV_NO || "",
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
        items.map((x: any) => ({
          selected: false,
          ZMAPID: x.ZMAPID || x.MAPID || "",
          ZREFNO: x.ZREFNO || "",
          ZLINE_NO: x.ZLINE_NO || "",
          INV_NO: x.INV_NO || "",
          TRUCK_NO: x.TRUCK_NO || "",
          LR_NO: x.LR_NO || "",
          TRANSPORTER: x.TRANSPORTER || "",
          WORK_ORDER: x.WORK_ORDER || "",
          BILLNO: x.BILLNO || "",
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

    const header = {
      ...headerData,
      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: selectedRow.LINE_NO,
      ZSUPT_DOC: supportingBase64,
      ZSUPT_PATH: supportingPath,
      ZAPP_DOC: approveBase64,
      ZAPP_PATH: approvePath,
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

    if (!dcRef) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please enter DC Reference Number" });
      return;
    }

    const selectedRow = tableData.find((row) => row.selected);

    if (!selectedRow) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select one reference row" });
      return;
    }

    const payload = {
      VBELN: dcRef,
      ZREFNO: selectedRow.REF_NO || "",
      ZMAPID: selectedRow.MAPID || "",
    };

    try {
      setLoading(true);
      const res: any = await service.fetchinvoicelistnonsap(payload);
      setLoading(false);

      if (!res || res.STATUS === "False") {
        Swal.fire({ icon: "info", title: "Info", text: res?.MESSAGE || "No Data Found" });
        return;
      }

      const header = res?.[0]?.HEADER || {};
      const items = res?.[0]?.ITEM || [];

      setHeaderData({
        ...header,
        INV_NO: header.INV_NO || dcRef,
        REFNO: selectedRow.REF_NO,
        LINE_NO: selectedRow.LINE_NO,
      });

      setItemData(
        items.map((item: any) => ({
          ...item,
          selected: false,
          ZMAPID: selectedRow.MAPID,
          REFNO: selectedRow.REF_NO,
          ZLINE_NO: selectedRow.LINE_NO,
          TRUCK_NO: item.TRUCK_NO ?? "",
          LR_NO: item.LR_NO ?? "",
          TRANSPORTER: item.TRANSPORTER ?? "",
          WORK_ORDER: item.WORK_ORDER ?? "",
          BILLNO: item.BILLNO ?? "",
          INV_NO: dcRef,
        }))
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

    const header = {
      ...headerData,
      INV_NO: lookupValue,
      REFNO: selectedRow.REF_NO,
      LINE_NO: selectedRow.LINE_NO,
      ZUSER: getLoggedInUser(),
      ZUSER_CH: "",
      ZSUPT_DOC: supportingBase64 || "",
      ZSUPT_PATH: supportingPath || "",
      ZAPP_DOC: approveBase64 || "",
      ZAPP_PATH: approvePath || "",
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
        resetAll();
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
    setApproveBase64("");
    setApprovePath("");
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

      setHeaderData(header);
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
    setHeaderData((prev: any) => ({ ...prev, _backup: { ...prev }, isEdit: true }));
  };

  const cancelHeaderEdit = () => {
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

    const payload = {
      ZSUPT_DOC: supportingBase64 || "",
      ZSUPT_PATH: supportingPath || "",
      ZAPP_DOC: approveBase64 || "",
      ZAPP_PATH: approvePath || "",
      HEAD: { ...headerData, ZUSER_CH: getLoggedInUser() },
      ITEM: itemData.map((item: any) => ({ ...item, ZUSER_CH: getLoggedInUser() })),
    };

    try {
      const res: any = isSap
        ? await service.InsuranceClaimTrackingChangeWithSap(payload)
        : await service.InsuranceClaimTrackingChangeWithoutSap(payload);

      if (res.STATUS === "TRUE" || res.NUMBER === "200") {
        Swal.fire("Success", res.MESSAGE || "Updated Successfully", "success");

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
            {tableData.map((row, index) => (
              <tr key={index}>
                <td className="px-3 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={(e) => onCheckboxChange(e, index)}
                    className="size-4 accent-sky-600"
                  />
                </td>

                <td className="px-3 py-0.5 text-center">{index + 1}</td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.MAPID}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].MAPID = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "MAPID")}
                    placeholder="Enter Map ID"
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.REF_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].REF_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                    placeholder="Enter Ref. No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.WORK_ORDER_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].WORK_ORDER_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                    placeholder="Enter Work Order No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.LR_NO}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].LR_NO = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                    placeholder="Enter LR No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.TRANSPORTER}
                    onChange={(e) => {
                      const data = [...tableData];
                      data[index].TRANSPORTER = e.target.value;
                      setTableData(data);
                    }}
                    onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                    placeholder="Enter Transporter"
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
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
          <div className="flex items-end gap-2 max-w-md">
            <div className="flex-1 min-w-[220px]">
              <label className={LABEL}>
                {isWithout ? "DC Reference Number" : "Invoice Number"}
              </label>

              <select
                value={lookupValue}
                onChange={(e) => {
                  const value = e.target.value;
                  setLookupValue(value);
                  if (isWithout) {
                    fetchInvoiceDetailsNonSap(value);
                    setRevealed(true);
                  }
                }}
                className={GREEN_INPUT}
              >
                <option value="" disabled>
                  {isWithout ? "Select DC Reference" : "Select Invoice"}
                </option>
                {invoiceF4List.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
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

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Ref No", "Line No", "Invoice No", "ODN No", "SO No",
                      "Fiscal Year", "Reported Date", "Claim Ref", "Invoice Date",
                      "Base Value", "Loss Declared", "Customer", "Location",
                      "Damage", "Claim Status", "Payment Status", "Plant",
                      "Division", "Action",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  <tr className="bg-surface hover:bg-muted/50">
                    {[
                      { field: "REFNO", alt: "ZREFNO", type: "text" },
                      { field: "LINE_NO", alt: "ZLINE_NO", type: "text" },
                      { field: "INV_NO", alt: "ZINV_NO", type: "text" },
                      { field: "ODN_NO", alt: "ZODN_NO", type: "text" },
                      { field: "SO_NO", alt: "ZSO_NO", type: "text" },
                      { field: "FI", alt: "ZFI", type: "text" },
                      { field: "REP_DATE", alt: "ZREP_DATE", type: "date" },
                      { field: "CLAIM_REF", alt: "ZCLAIM_REF", type: "text" },
                      { field: "INV_DATE", alt: "ZINV_DATE", type: "date" },
                      { field: "INV_BV", alt: "ZINV_BV", type: "number" },
                      { field: "LOSS_DCL", alt: "ZLOSS_DCL", type: "text" },
                      { field: "CUSTOMER", alt: "ZCUSTOMER", type: "text" },
                      { field: "LOCATION", alt: "ZLOCATION", type: "text" },
                      { field: "DAMAGE_RMK", alt: "ZDAMAGE_RMK", type: "textarea" },
                      { field: "CLM_ST", alt: "ZCLM_ST", type: "text" },
                      { field: "PAY_ST", alt: "ZPAY_ST", type: "text" },
                      { field: "PLANT", alt: "ZPLANT", type: "text" },
                      { field: "DIVISION", alt: "ZDIVISION", type: "text" },
                    ].map(({ field, alt, type }) => {
                      const value = headerData[field] ?? headerData[alt];
                      return (
                        <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                          {headerData.isEdit ? (
                            type === "textarea" ? (
                              <textarea
                                className={`${GREEN_INPUT} h-16`}
                                value={value || ""}
                                onChange={(e) =>
                                  setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))
                                }
                              />
                            ) : (
                              <input
                                type={type}
                                className={GREEN_INPUT}
                                value={value || ""}
                                onChange={(e) =>
                                  setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))
                                }
                              />
                            )
                          ) : (
                            <span>
                              {type === "date" && value
                                ? new Date(value).toLocaleDateString("en-GB")
                                : value || "-"}
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="px-2 py-2 text-center">
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
            </div>
          )}

          {showForm && isGlobalSearch && itemData.length > 0 && (
            <div className="max-h-[400px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant mt-3">
              <div className="p-2 font-semibold">Line Items</div>

              <table className="w-full text-left border-collapse text-[12.5px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Map ID", "Ref No", "Line No", "Invoice No", "Vehicle No",
                      "Bill No", "Work Order", "LR No", "Transporter", "Action",
                    ].map((h) => (
                      <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-hairline/70">
                  {itemData.map((item: any, index: number) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                    >
                      {[
                        { field: "ZMAPID", type: "text" },
                        { field: "ZREFNO", type: "text" },
                        { field: "ZLINE_NO", type: "text" },
                        { field: "ZINV_NO", type: "text" },
                        { field: "ZTRUCK_NO", type: "text" },
                        { field: "ZBILLNO", type: "text" },
                        { field: "ZWORK_ORDER", type: "text" },
                        { field: "ZLRNO", type: "text" },
                        { field: "ZTRANSPORTER", type: "text" },
                      ].map(({ field, type }) => (
                        <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                          {item.isEdit ? (
                            <input
                              type={type}
                              className={GREEN_INPUT}
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

                      <td className="px-2 py-2 text-center">
                        {!item.isEdit ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => editItemRow(index)}
                              className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              ✏️
                            </button>

                            <button
                              onClick={() => deleteRow(item)}
                              className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              🗑️
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
                      key={f.key}
                      field={{ ...f, value: headerData?.[f.key] ?? "" }}
                      setHeaderData={setHeaderData}
                      sapFetched={sapFetched}
                      sapFilledKeys={sapFilledKeys}
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
    </div>
  );
}

function SapField({
  field,
  setHeaderData,
  sapFetched = false,
  sapFilledKeys,
}: {
  field: FieldSpec;
  setHeaderData: React.Dispatch<React.SetStateAction<any>>;
  sapFetched?: boolean;
  sapFilledKeys?: Set<string>;
}) {
  const { label, value = "", type = "text", options = [], placeholder } = field;

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
        <input
          type="date"
          value={value || ""}
          readOnly={filled}
          onChange={(e) => !filled && setHeaderData((prev: any) => ({ ...prev, [field.key]: e.target.value }))}
          className={cls}
        />
      ) : type === "file" ? (
        <input type="file" className={GREEN_INPUT + " py-1.5"} />
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