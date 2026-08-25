import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Search,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
} from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

// ── Style constants (mirrors OrderInfoSapCreate) ────────────────────────────
const INPUT_NORMAL =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const INPUT_READONLY =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";
// Small inline-table edit input (matches OrderInfo's search-results edit cells)
const EDIT_CELL_INPUT =
  "h-6 w-28 rounded border border-input px-1 text-[11px] bg-white outline-none focus:border-ring focus:ring-1 focus:ring-ring/40";

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
};

const EMPTY_ROW = (): TableRow => ({
  MAPID: "", REF_NO: "", WORK_ORDER_NO: "", LR_NO: "", TRANSPORTER: "", LINE_NO: "", selected: false,
});

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
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
const HEADER_FIELDS: { field: string; label: string; type: string }[] = [
  { field: "ZREFNO", label: "Ref No", type: "text" },
  { field: "ZINV_NO", label: "Invoice No", type: "text" },
  { field: "ZODN_NO", label: "ODN No", type: "text" },
  { field: "ZSONO", label: "SO No", type: "text" },
  { field: "ZSALE_PERSON", label: "Sales Person", type: "text" },
  { field: "ZPY_ARRIVED_DEST", label: "Physical Arrived", type: "datetime-local" },
  { field: "ZUNLOADING_DT", label: "Unloading DT", type: "datetime-local" },
  { field: "ZPOD_SCAN", label: "POD Scan", type: "datetime-local" },
  { field: "ZSIT_SALE", label: "SIT/SALE", type: "text" },
  { field: "ZLOCATION", label: "Location", type: "text" },
  { field: "ZPLANT", label: "Plant", type: "text" },
  { field: "ZDIVISION", label: "Division", type: "text" },
  { field: "ZCREATED_DT", label: "Created Date", type: "date" },
  { field: "ZVEH_TYPE", label: "Vehicle Type", type: "text" },
];

const ITEM_FIELDS: { field: string; label: string; type: string }[] = [
  { field: "ZREFNO", label: "Reference Number", type: "text" },
  { field: "ZINV_NO", label: "Invoice Number", type: "text" },
  { field: "ZVEH_NUM", label: "Vehicle Number", type: "text" },
  { field: "ZVEH_LINE", label: "Vehicle Line", type: "number" },
  { field: "ZWORK_ORDER", label: "Work Order", type: "text" },
  { field: "ZLRNO", label: "LR No", type: "text" },
  { field: "ZTRANSPORTER", label: "Transporter", type: "text" },
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

export function TransitInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" }) {
  const navigate = useNavigate();

  const isWithout = mode === "without";
  const isSap = !isWithout;

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

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

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
    if (unloadingDate || podScanDate) {
      setSitSale("SALE");
    } else if (physicalArrivedDate) {
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
        setTableData(res.map((item: any) => ({
          MAPID: item.MAPID || "",
          REF_NO: item.REF_NO || "",
          WORK_ORDER_NO: item.WORK_ORDER_NO || "",
          LR_NO: item.LR_NO || "",
          TRANSPORTER: item.TRANSPORTER || "",
          LINE_NO: item.LINE_NO || "",
          selected: false,
        })));
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
  const toggleRowSelect = (index: number) =>
    setTableData((prev) => prev.map((r, i) => i === index ? { ...r, selected: !r.selected } : r));

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
      const HEAD = {
        REFNO: selectedRows[0]?.REF_NO || "",
        INV_NO: invoiceNumber || "",

        PY_ARRIVED_DEST: physicalArrivedDate,
        UNLOADING_DT: unloadingDate,
        POD_SCAN: podScanDate,
        SIT_SALE: sitSale || "",

        ZUSER: getLoggedInUser(),
        ZUSER_CH: "",
        // ZPOD_FNAME: podFileBase64 || "",
        // ZPATH: podFilePath || "",
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
      ZPODNAME: headerRow.ZPODNAME || "",
      ZLOCATION: headerRow.ZLOCATION || "",
      ZCREATED_DT: headerRow.ZCREATED_DT || "",
      ZPLANT: headerRow.ZPLANT || "",
      ZDIVISION: headerRow.ZDIVISION || "",
      ZVEH_TYPE: headerRow.ZVEH_TYPE || "",
      ZUSER: headerRow.ZUSER || "",
      ZUSER_CH: getLoggedInUser(),
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
      ZPOD_FNAME: "",
      ZPATH: "",
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
    setHeaderData({
      ...headerPayload,
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
                    onChange={() => toggleRowSelect(index)}
                    className="size-4 accent-sky-600"
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  {index + 1}
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.REF_NO}
                    readOnly={index !== 0}
                    placeholder="Enter Ref. No."
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].REF_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "REF_NO")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchGlobalReferences(row, index, "REF_NO");
                    }}
                    className={(index !== 0 ? INPUT_READONLY : INPUT_NORMAL) + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.WORK_ORDER_NO}
                    readOnly={index !== 0}
                    placeholder="Enter Work Order No."
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].WORK_ORDER_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "WORK_ORDER_NO")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchGlobalReferences(row, index, "WORK_ORDER_NO");
                    }}
                    className={(index !== 0 ? INPUT_READONLY : INPUT_NORMAL) + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.LR_NO}
                    readOnly={index !== 0}
                    placeholder="Enter LR No."
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].LR_NO = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "LR_NO")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchGlobalReferences(row, index, "LR_NO");
                    }}
                    className={(index !== 0 ? INPUT_READONLY : INPUT_NORMAL) + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5">
                  <input
                    value={row.TRANSPORTER}
                    readOnly={index !== 0}
                    placeholder="Enter Transporter"
                    onChange={(e) =>
                      setTableData(prev => {
                        const copy = [...prev];
                        copy[index].TRANSPORTER = e.target.value;
                        return copy;
                      })
                    }
                    onBlur={() => fetchGlobalReferences(row, index, "TRANSPORTER")}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") fetchGlobalReferences(row, index, "TRANSPORTER");
                    }}
                    className={(index !== 0 ? INPUT_READONLY : INPUT_NORMAL) + " text-center"}
                  />
                </td>

                <td className="px-3 py-0.5 text-center">
                  {tableData.length > 1 && (
                    <button
                      onClick={() => removeRow(index)}
                      className="size-6 grid place-items-center rounded-md text-red-500 hover:bg-red-50 mx-auto"
                    >
                      <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={DELETE_PATH} />
                      </svg>
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
            />

            <SapField field={FIELDS[5]} />

          </div>
        </div>
      )}

      {showTable && headerData && (
        <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
          <div className="bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold text-[13px]">
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
                    {HEADER_FIELDS.map(({ field, type }) => (
                      <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                        {headerData.isEdit ? (
                          <input
                            type={type}
                            value={headerData[field] || ""}
                            onChange={(e) =>
                              setHeaderData((prev: any) => ({ ...prev, [field]: e.target.value }))
                            }
                            className={EDIT_CELL_INPUT}
                          />
                        ) : (type === "date" || type === "datetime-local") && headerData[field] ? (
                          new Date(headerData[field]).toLocaleDateString("en-GB")
                        ) : (
                          headerData[field] || "-"
                        )}
                      </td>
                    ))}

                    {/* POD Name */}
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {headerData.isEdit ? (
                        <input type="file" accept=".jpg,.jpeg,.png" className={EDIT_CELL_INPUT + " py-0.5"} />
                      ) : (
                        headerData.ZPODNAME || "-"
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
          <div className="bg-gradient-primary text-primary-foreground px-4 py-2 font-semibold text-[13px]">
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

                        {ITEM_FIELDS.slice(1).map(({ field, type }) => (
                          <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                            {item.isEdit ? (
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

function SapField({
  field,
  value = "",
  onChange,
}: {
  field: FieldSpec;
  value?: string;
  onChange?: (value: string) => void;
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
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={INPUT_NORMAL}
        />
      ) : type === "date" ? (
        <input
          type="date"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={INPUT_NORMAL}
        />
      ) : type === "select" ? (
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={INPUT_NORMAL}
        >
          <option value="">Select</option>
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : type === "file" ? (
        <input
          type="file"
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