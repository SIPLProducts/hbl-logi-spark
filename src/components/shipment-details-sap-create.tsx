import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import Swal from "sweetalert2";
import { Search, Plus, Trash2, Save, ChevronLeft, ChevronRight, Pencil, Check, X as XIcon } from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60 disabled:cursor-not-allowed";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SEARCH_OPTIONS = [
  { key: "ref_no", label: "Reference No" },
  { key: "inv_no", label: "Invoice No" },
  { key: "odn_no", label: "ODN No" },
  { key: "so_no", label: "SO No" },
  { key: "lr_no", label: "LR NO" },
];

const INSURANCE_SCOPE = ["Buyer", "Supplier"];
const PRODUCTS = [
  "Batteries",
  "Electronics",
  "Fuze",
  "Cement Poles and Piles",
  "Raw Materials",
  "Job Work Material",
  "Machinery",
  "Others",
];
const MATERIAL_TYPES = [
  "Batteries",
  "Acid",
  "Electronic Goods",
  "Scrap",
  "Rack",
  "Stack Box",
  "Packing material",
  "T-CAS",
  "PC Wire",
  "Raw material",
  "Contrate Product",
];
const BATTERY_CONDITIONS = [
  "Dry and discharge with solid electrolyte",
  "Dry and discharge with Liquid electrolyte",
  "Filled and discharged",
  "Filled and charged",
  "Filled and formed no free Acid",
  "Lead acid batteries (Dry)",
  "Lead acid batteries (Filled)",
];

// ---------- Types ----------
type RefRow = {
  MAPID: string;
  referenceNumber: string;
  workOrderNumber: string;
  lrNumber: string;
  transporter: string;
  soNumber: string;
  odnNumber: string;
  materialType: string;
  plantCode: string;
  shippingPoint: string;
  lineNumber: string;
};

const emptyRefRow = (): RefRow => ({
  MAPID: "",
  referenceNumber: "",
  workOrderNumber: "",
  lrNumber: "",
  transporter: "",
  soNumber: "",
  odnNumber: "",
  materialType: "",
  plantCode: "",
  shippingPoint: "",
  lineNumber: "",
});

type ProductRow = {
  selected: boolean;
  ZMAPID: string;
  ZPRODUCT: string;
  MTART: string;
  MTBEZ: string;
  MAKTX: string;
  ZSETS: string;
  ZAH: string;
  ZSHIP_WT: string;
  ZBATCOND: string;
  MANDT: string;
  ZREFNO: string;
  ZLINE_NO: string;
  VBELN: string;
  POSNR: string;
  ZSO_NO: string;
  ZODN_NO: string;
  ZINCO: string;
  ZINS_SCPOE: string;
  ZPIN_PLT: string;
  ZPIN_STP: string;
  ZKM: string;
  ZWORK_ORDER: string;
  ZLRNO: string;
  ZTRANSPORTER: string;
};

const emptyProductRow = (): ProductRow => ({
  selected: false,
  ZMAPID: "",
  ZPRODUCT: "",
  MTART: "",
  MTBEZ: "",
  MAKTX: "",
  ZSETS: "",
  ZAH: "",
  ZSHIP_WT: "",
  ZBATCOND: "",
  MANDT: "",
  ZREFNO: "",
  ZLINE_NO: "",
  VBELN: "",
  POSNR: "",
  ZSO_NO: "",
  ZODN_NO: "",
  ZINCO: "",
  ZINS_SCPOE: "",
  ZPIN_PLT: "",
  ZPIN_STP: "",
  ZKM: "",
  ZWORK_ORDER: "",
  ZLRNO: "",
  ZTRANSPORTER: "",
});

export function ShipmentDetailsSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isSap = mode === "with";
  const navigate = useNavigate();

  const currentUser = (() => {
    try {
      const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
      const parsed = JSON.parse(raw || "{}");
      const USER = String(parsed?.USER ?? parsed?.USERNAME ?? parsed?.USER_ID ?? parsed?.user ?? "");
      const PLANTS = parsed?.PLANTS || parsed?.PLANT || [];
      const DIV = parsed?.DIV || parsed?.DIVISION || [];
      return { ...parsed, USER, PLANTS, DIV };
    } catch {
      return { USER: "", PLANTS: [], DIV: [] };
    }
  })();
  const loggedInUser = currentUser.USER || "";

  // ---- Reference table ----
  const [referenceItems, setReferenceItems] = useState<RefRow[]>([emptyRefRow()]);
  const [selectedItems, setSelectedItems] = useState<RefRow[]>([]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);

  // ---- Invoice / DC reference / common fields ----
  const [invoicenumber, setInvoicenumber] = useState("");
  const [showForm, setShowForm] = useState(!isSap); // Non-SAP shows form immediately
  const [zinco, setZinco] = useState("");
  const [zinsScope, setZinsScope] = useState("");
  const [zkm, setZkm] = useState("");
  const [vbeln, setVbeln] = useState(""); // DC reference (non-SAP)
  const [incotermsList, setIncotermsList] = useState<any[]>([]);

  // ---- Product table ----
  const [items, setItems] = useState<ProductRow[]>([emptyProductRow()]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // ---- Global search ----
  const [selectedType, setSelectedType] = useState("");
  const [searchReference, setSearchReference] = useState("");
  const [searchOptionsList, setSearchOptionsList] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);

  // ---------- Reference row field-blur lookup (only row 0 is editable/live) ----------
  const updateRefRow = (index: number, patch: Partial<RefRow>) => {
    setReferenceItems((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const populateReferenceRows = (data: any[]) => {
    setInvoiceF4List([]);
    setSelectedItems([]);
    setFullReferenceData([]);

    if (data && data.length > 0) {
      setFullReferenceData(data);
      const f4: string[] = [];
      const rows: RefRow[] = data.map((d: any) => {
        if (d.INV_NO && Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
          });
        }
        return {
          MAPID: d.MAPID || "",
          referenceNumber: d.REF_NO || d.referenceNumber || "",
          workOrderNumber: d.WORK_ORDER_NO || d.workOrderNumber || "",
          lrNumber: d.LR_NO || d.lrNumber || "",
          transporter: d.TRANSPORTER || d.transporter || "",
          soNumber: d.SO_NO || d.soNumber || "",
          odnNumber: d.ODN_NO || d.odnNumber || "",
          materialType: d.MTART || d.materialType || "",
          plantCode: d.PLANT_CODE || d.ZPIN_PLT || d.plantCode || "",
          shippingPoint: d.SHIPPING_POINT || d.ZPIN_STP || d.shippingPoint || "",
          lineNumber: d.LINE_NO || d.lineNumber || "",
        };
      });
      setReferenceItems(rows);
      setInvoiceF4List(f4);
      setVbeln("");
    } else {
      Swal.fire({
        icon: "info",
        title: "No Records Found",
        text: "No matching reference details were found.",
        timer: 1500,
        showConfirmButton: false,
        width: 300,
      });
      setReferenceItems([emptyRefRow()]);
    }
  };

  const onFieldBlur = async (index: number, fieldKey: "REF_NO" | "WORK_ORDER_NO" | "LR_NO" | "TRANSPORTER") => {
    if (index !== 0) return;
    const values = referenceItems[0];

    if (!values.referenceNumber && !values.workOrderNumber && !values.lrNumber && !values.transporter) {
      setReferenceItems([emptyRefRow()]);
      return;
    }

    const obj = {
      global_scr: "SHIPMENT DETAILS",
      REF_NO: fieldKey === "REF_NO" ? values.referenceNumber : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? values.workOrderNumber : "",
      LR_NO: fieldKey === "LR_NO" ? values.lrNumber : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? values.transporter : "",
      LINE_NO: values.lineNumber || "",
      ZUSER: loggedInUser,
    };

    setLoading(true);
    try {
      const res = isSap
        ? await service.GlobalReferenceNoFetch(obj)
        : await service.GlobalReferenceNoFetchwithoutsap(obj);
      populateReferenceRows(res);
    } catch (err) {
      console.error("Reference fetch error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch reference details." });
    } finally {
      setLoading(false);
    }
  };

  const removeReferenceRow = (index: number) => {
    const rowValue = referenceItems[index];
    setReferenceItems((prev) => prev.filter((_, i) => i !== index));
    setSelectedItems((prev) => prev.filter((item) => String(item.MAPID) !== String(rowValue.MAPID)));
  };

  const updateInvoiceListForSelectedItems = (nextSelected: RefRow[]) => {
    if (nextSelected.length === 0) {
      setInvoiceF4List([]);
      return;
    }
    const selectedMapIds = [...new Set(nextSelected.map((i) => String(i.MAPID)))];
    const f4: string[] = [];
    fullReferenceData.forEach((refItem) => {
      if (selectedMapIds.includes(String(refItem.MAPID)) && refItem.INV_NO && Array.isArray(refItem.INV_NO)) {
        refItem.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
        });
      }
    });
    setInvoiceF4List(f4);
  };

  const isItemSelected = (index: number) => {
    const rowValue = referenceItems[index];
    return selectedItems.some((item) => String(item.MAPID) === String(rowValue.MAPID));
  };

  const onCheckboxChange = (index: number, checked: boolean) => {
    const rowValue = referenceItems[index];
    setSelectedItems((prev) => {
      let next: RefRow[];
      if (checked) {
        next = prev.some((i) => String(i.MAPID) === String(rowValue.MAPID))
          ? prev
          : [...prev, { ...rowValue, MAPID: String(rowValue.MAPID) }];
      } else {
        next = prev.filter((i) => String(i.MAPID) !== String(rowValue.MAPID));
      }
      updateInvoiceListForSelectedItems(next);
      return next;
    });
  };

  // ---------- Invoice GET (SAP) ----------
  const fetchInvoiceDetails = async () => {
    if (!invoicenumber.trim()) {
      Swal.fire({ icon: "warning", title: "Please enter a valid Invoice Number" });
      return;
    }
    setLoading(true);
    try {
      const res = await service.shipmentdetailsfetch({ INV_GET: invoicenumber.trim() });
      const result = Array.isArray(res) ? res : [];
      if (result.length === 0) {
        Swal.fire({ icon: "info", title: "No data found for this reference." });
        return;
      }
      const firstItem = result[0];
      setZinco(firstItem.ZINCO || "");
      setZinsScope(firstItem.ZINS_SCPOE || "");
      setZkm(firstItem.ZKM ?? "");
      setVbeln(firstItem.VBELN || "");

      setItems(
        result.map((item: any) => ({
          selected: false,
          ZMAPID: String(item.ZMAPID ?? ""),
          ZPRODUCT: item.ZPRODUCT || "",
          MTART: item.MTART || "",
          MTBEZ: item.MTBEZ || "",
          MAKTX: item.MAKTX || "",
          ZSETS: item.ZSETS ?? "",
          ZAH: item.ZAH ?? "",
          ZSHIP_WT: item.ZSHIP_WT ?? "",
          ZBATCOND: item.ZBATCOND || "",
          MANDT: item.MANDT || "",
          ZREFNO: item.ZREFNO || "",
          ZLINE_NO: item.ZLINE_NO || "",
          VBELN: item.VBELN || "",
          POSNR: item.POSNR || "",
          ZSO_NO: item.ZSO_NO || "",
          ZODN_NO: item.ZODN_NO || "",
          ZINCO: item.ZINCO || "",
          ZINS_SCPOE: item.ZINS_SCPOE || "",
          ZPIN_PLT: item.ZPIN_PLT || "",
          ZPIN_STP: item.ZPIN_STP || "",
          ZKM: item.ZKM || "",
          ZWORK_ORDER: item.ZWORK_ORDER || "",
          ZLRNO: item.ZLRNO || "",
          ZTRANSPORTER: item.ZTRANSPORTER || "",
        })),
      );
      setShowForm(true);
      setSearchOptionsList([]);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Invoice details loaded successfully",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Invoice fetch error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Error fetching data from SAP." });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Product rows ----------
  const addRow = () => setItems((prev) => [...prev, emptyProductRow()]);
  const removeRow = (index: number) => {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };
  const updateRow = (index: number, patch: Partial<ProductRow>) => {
    setItems((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };
  const toggleAllSelection = (checked: boolean) => {
    setIsAllSelected(checked);
    setItems((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };
  const onRowCheckboxChange = (index: number, checked: boolean) => {
    setItems((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, selected: checked } : r));
      setIsAllSelected(next.length > 0 && next.every((r) => r.selected));
      return next;
    });
  };

  const onChangeMapId = (index: number, mapId: string) => {
    const selectedObj = selectedItems.find((item) => item.MAPID === mapId);
    if (!selectedObj) {
      updateRow(index, { ZMAPID: mapId });
      return;
    }
    updateRow(index, {
      ZMAPID: selectedObj.MAPID,
      ZREFNO: selectedObj.referenceNumber,
      ZWORK_ORDER: selectedObj.workOrderNumber,
      ZLRNO: selectedObj.lrNumber,
      ZTRANSPORTER: selectedObj.transporter,
      ZLINE_NO: selectedObj.lineNumber,
    });
  };

  // ---------- Global search ----------
  const onSearchTypeChange = (val: string) => {
    setSelectedType(val);
    setSearchReference("");
    setSearchOptionsList([]);
  };

  const onSearchReference = async () => {
    if (!searchReference.trim()) {
      Swal.fire({ icon: "warning", title: "Please enter a value" });
      return;
    }
    if (!selectedType) {
      Swal.fire({ icon: "info", title: "Please select a search type" });
      return;
    }
    const data: Record<string, string> = {
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
    };
    data[selectedType] = searchReference.trim();
    const payload1 = { global: "SHIPMENT DETAILS", ZUSER: loggedInUser, data };

    setLoading(true);
    try {
      const res = isSap
        ? await service.global_Fields_SearchOption(payload1)
        : await service.global_Fields_SearchOption_WithoutSap(payload1);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        setSearchOptionsList([]);
        Swal.fire({ title: "", text: res.MESSAGE, icon: "warning" });
      } else if (!res?.HEADER || res.HEADER.length === 0) {
        setSearchOptionsList([]);
        Swal.fire({ title: "No records found", icon: "info" });
      } else {
        setSearchOptionsList(res.HEADER.map((item: any) => ({ ...item, isEdit: false })));
        setShowForm(false);
        Swal.fire({ title: "Data fetched successfully!", icon: "success", timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      console.error("Search error:", err);
      Swal.fire({ title: "Error fetching data", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const editSearchRow = (index: number) => {
    setSearchOptionsList((prev) =>
      prev.map((r, i) => (i === index ? { ...r, _backup: { ...r }, isEdit: true } : r)),
    );
  };

  const cancelSearchEdit = (index: number) => {
    setSearchOptionsList((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const restored = r._backup ? { ...r._backup } : r;
        return { ...restored, isEdit: false };
      }),
    );
  };

  const patchSearchRow = (index: number, patch: Record<string, any>) => {
    setSearchOptionsList((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const buildChangePayload = (row: any) => ({
    CHANGE: [
      {
        ZREFNO: row.ZREFNO,
        ZLINE_NO: row.ZLINE_NO,
        VBELN: row.VBELN,
        POSNR: row.POSNR,
        ZMAPID: row.ZMAPID,
        ZSO_NO: row.ZSO_NO,
        ZODN_NO: row.ZODN_NO,
        ZPRODUCT: row.ZPRODUCT,
        MTART: row.MTART,
        MAKTX: row.MAKTX,
        ZSETS: row.ZSETS,
        ZAH: row.ZAH,
        ZSHIP_WT: row.ZSHIP_WT,
        ZBATCOND: row.ZBATCOND,
        ZINCO: row.ZINCO,
        ZINS_SCPOE: row.ZINS_SCPOE,
        ZPIN_PLT: row.ZPIN_PLT,
        ZPIN_STP: row.ZPIN_STP,
        ZKM: row.ZKM,
        ZWORK_ORDER: row.ZWORK_ORDER,
        ZLRNO: row.ZLRNO,
        ZTRANSPORTER: row.ZTRANSPORTER,
        ZPLANT: row.ZPLANT,
        ZDIVISION: row.ZDIVISION,
        ZCREATED_DT: row.ZCREATED_DT,
        ZVEH_TYPE: row.ZVEH_TYPE,
        ZUSER: row.ZUSER,
        ZUSER_CH: loggedInUser,
      },
    ],
  });

  const updateSearchRow = async (index: number) => {
    const row = searchOptionsList[index];

    if (!row.ZREFNO || !row.VBELN || !row.POSNR || (isSap && !row.ZLINE_NO)) {
      Swal.fire({ title: "Error", text: "Primary key missing", icon: "error" });
      return;
    }

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this shipment record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;

    setLoading(true);
    try {
      const payload = buildChangePayload(row);
      const res = isSap
        ? await service.Shipmentchangewithsap(payload)
        : await service.Shipmentchangewithoutsap(payload);

      if (res?.STATUS === "true" || res?.NUMBER === "200") {
        Swal.fire({
          title: "Success",
          text: res.MESSAGE || "Record updated successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          patchSearchRow(index, { isEdit: false, _backup: undefined });
          onSearchReference();
        });
      } else {
        Swal.fire({ title: "Error", text: res?.MSG || res?.MESSAGE || "Update failed", icon: "error" });
      }
    } catch (err) {
      console.error("Update error:", err);
      Swal.fire({ title: "Error", text: "Internal Server Error", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (index: number) => {
    const row = searchOptionsList[index];
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!confirm.isConfirmed) return;

    const payload = { DELETE: [{ ZREFNO: row.ZREFNO, ZINV_NO: row.VBELN, ZLINE_NO: row.ZLINE_NO }] };

    setLoading(true);
    try {
      const res = isSap
        ? await service.ShipmentDeleteWithSap(payload)
        : await service.ShipmentDeleteWithoutSap(payload);

      if (res?.NUMBER === "200") {
        setSearchOptionsList((prev) => prev.filter((_, i) => i !== index));
        Swal.fire({
          title: "Deleted",
          text: res.MSG || "Record deleted successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        Swal.fire({ title: "Failed", text: res?.MSG || "Delete failed", icon: "error" });
      }
    } catch (err: any) {
      console.error("Delete error:", err);
      Swal.fire({ title: "Error", text: err?.error?.MSG || "Something went wrong while deleting", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  // ---------- Incoterms (fetched once, used for Non-SAP select) ----------
  const fetchIncoterms = async () => {
    try {
      const res = await service.Incoterms({ INCO1: "", BEZEI: "" });
      setIncotermsList(Array.isArray(res) ? res : res?.data || []);
    } catch (err) {
      console.error("Error fetching Incoterms:", err);
    }
  };

  // fetch once on mount
  useEffect(() => {
    fetchIncoterms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Save ----------
  const saveShipmentOutward = async (action: "stay" | "next" | "previous" = "stay") => {
    const selectedRows = items.filter((r) => r.selected).map(({ selected, ...rest }) => rest);

    if (selectedRows.length === 0) {
      Swal.fire({
        title: "Warning",
        text: "Please select at least one product row to save.",
        icon: "warning",
        confirmButtonText: "Ok",
      });
      return;
    }

    if (selectedItems.length === 0) {
      Swal.fire({ icon: "warning", text: "Please select at least one reference row before saving" });
      return;
    }

    const commonFields = { ZINCO: zinco || "", ZINS_SCPOE: zinsScope || "", ZKM: zkm || "", VBELN: vbeln || "" };

    // A row's ZMAPID may have arrived pre-filled from the invoice fetch, which never
    // carries reference/work-order/LR/transporter data. Fall back to the matching
    // reference-table row (the one the user checked off) for those fields, by MAPID.
    const refForRow = (mapId: string) => selectedItems.find((r) => r.MAPID === mapId);

    // Helper: some fields can come back from the API as numbers (or null/undefined)
    // rather than strings, which breaks .trim(). Normalize to a string first.
    const asTrimmed = (val: unknown): string => (val === null || val === undefined ? "" : String(val).trim());

    const finalPayload = selectedRows.map((row) => {
      const ref = refForRow(row.ZMAPID);
      return {
        ...row,
        ZINS_SCPOE: asTrimmed(row.ZINS_SCPOE) ? row.ZINS_SCPOE : commonFields.ZINS_SCPOE,
        ZKM: row.ZKM !== "" && row.ZKM != null ? row.ZKM : commonFields.ZKM,
        ZINCO: asTrimmed(row.ZINCO) ? row.ZINCO : commonFields.ZINCO,
        VBELN: asTrimmed(row.VBELN) ? row.VBELN : commonFields.VBELN,
        ZREFNO: asTrimmed(row.ZREFNO) ? row.ZREFNO : ref?.referenceNumber || "",
        ZLINE_NO: asTrimmed(row.ZLINE_NO) ? row.ZLINE_NO : ref?.lineNumber || "",
        ZWORK_ORDER: asTrimmed(row.ZWORK_ORDER) ? row.ZWORK_ORDER : ref?.workOrderNumber || "",
        ZLRNO: asTrimmed(row.ZLRNO) ? row.ZLRNO : ref?.lrNumber || "",
        ZTRANSPORTER: asTrimmed(row.ZTRANSPORTER) ? row.ZTRANSPORTER : ref?.transporter || "",
        ZUSER: loggedInUser,
        ZUSER_CH: "",
      };
    });

    setLoading(true);
    try {
      // IMPORTANT: the backend for ShipmentOutwardSave / shipmentdetailsNonSapSave expects
      // the row array directly as the request body (see the Angular original), NOT wrapped
      // in an object like { CHANGE: "", SAVE: [...] }. Wrapping it was the reason saves
      // were silently failing.
      const res = isSap
        ? await service.ShipmentOutwardSave(finalPayload)
        : await service.shipmentdetailsNonSapSave(finalPayload);

      if (res?.STATUS === "true" || res?.NUMBER === "200") {
        Swal.fire({
          title: "Success",
          text: res.MESSAGE || res.MSG || "Data saved successfully",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          if (action === "next") navigate({ to: "/invoice-load-details" });
          else if (action === "previous") navigate({ to: "/order-info" });
          else resetForm();
        });
      } else {
        Swal.fire({
          title: "Error",
          text: res.MESSAGE || res.MSG || "Failed to save data",
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    } catch (err) {
      console.error("Save error:", err);
      Swal.fire({ title: "Error", text: "Internal Server Error. Please try again later.", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setReferenceItems([emptyRefRow()]);
    setSelectedItems([]);
    setFullReferenceData([]);
    setInvoiceF4List([]);
    setInvoicenumber("");
    setShowForm(!isSap);
    setZinco("");
    setZinsScope("");
    setZkm("");
    setVbeln("");
    setItems([emptyProductRow()]);
    setIsAllSelected(false);
    setSearchOptionsList([]);
    setSelectedType("");
    setSearchReference("");
  };

  // Reset form whenever the parent toggles SAP mode
  useEffect(() => {
    resetForm();
  }, [mode]);

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
            {referenceItems.map((row, idx) => (
              <tr key={idx}>
                <td className="px-3 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={isItemSelected(idx)}
                    onChange={(e) => onCheckboxChange(idx, e.target.checked)}
                    className="size-4 accent-sky-600"
                  />
                </td>
                <td className="px-3 py-0.5 text-center">{idx + 1}</td>
                <td className="px-3 py-0.5">
                  <input value={row.MAPID} readOnly className={GREEN_INPUT + " text-center"} />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.referenceNumber}
                    maxLength={10}
                    readOnly={idx !== 0}
                    onChange={(e) => updateRefRow(idx, { referenceNumber: e.target.value })}
                    onBlur={() => onFieldBlur(idx, "REF_NO")}
                    onKeyDown={(e) => e.key === "Enter" && onFieldBlur(idx, "REF_NO")}
                    placeholder="Enter Ref. No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.workOrderNumber}
                    readOnly={idx !== 0}
                    onChange={(e) => updateRefRow(idx, { workOrderNumber: e.target.value })}
                    onBlur={() => onFieldBlur(idx, "WORK_ORDER_NO")}
                    onKeyDown={(e) => e.key === "Enter" && onFieldBlur(idx, "WORK_ORDER_NO")}
                    placeholder="Enter Work Order No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.lrNumber}
                    readOnly={idx !== 0}
                    onChange={(e) => updateRefRow(idx, { lrNumber: e.target.value })}
                    onBlur={() => onFieldBlur(idx, "LR_NO")}
                    onKeyDown={(e) => e.key === "Enter" && onFieldBlur(idx, "LR_NO")}
                    placeholder="Enter LR No."
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5">
                  <input
                    value={row.transporter}
                    readOnly={idx !== 0}
                    onChange={(e) => updateRefRow(idx, { transporter: e.target.value })}
                    onBlur={() => onFieldBlur(idx, "TRANSPORTER")}
                    onKeyDown={(e) => e.key === "Enter" && onFieldBlur(idx, "TRANSPORTER")}
                    placeholder="Enter Transporter"
                    className={GREEN_INPUT + " text-center"}
                  />
                </td>
                <td className="px-3 py-0.5 text-center">
                  {referenceItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeReferenceRow(idx)}
                      aria-label="Remove row"
                      className="inline-grid place-items-center size-7 rounded-md text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAP: Invoice lookup + global search | Non-SAP: global search only */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {isSap && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={LABEL}>Invoice Number</label>
                <select
                  value={invoicenumber}
                  onChange={(e) => setInvoicenumber(e.target.value)}
                  className={GREEN_INPUT}
                >
                  <option value="" disabled>
                    Select Invoice
                  </option>
                  {invoiceF4List.map((inv) => (
                    <option key={inv} value={inv}>
                      {inv}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchInvoiceDetails}
                disabled={!invoicenumber.trim() || loading}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </>
          )}
          <div className="min-w-[160px]">
            <select
              value={selectedType}
              onChange={(e) => onSearchTypeChange(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
            >
              <option value="" disabled>
                Select
              </option>
              {SEARCH_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchReference}
              onChange={(e) => setSearchReference(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearchReference()}
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

      {isSap && !showForm && (
        <p className="text-[12px] text-muted-foreground px-1">
          Select an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showForm && (
        <>
          {/* Top fields */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              {/* <div>
                <label className={LABEL}>Incoterms</label>
                {isSap ? (
                  <input value={zinco} readOnly className={GREEN_INPUT} />
                ) : (
                  <select value={zinco} onChange={(e) => setZinco(e.target.value)} className={GREEN_INPUT}>
                    <option value="">Select Incoterm</option>
                    {incotermsList.map((i, idx) => (
                      <option key={idx} value={i.INCO1}>
                        {i.INCO1} - {i.BEZEI}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className={LABEL}>Insurance Scope</label>
                <select value={zinsScope} onChange={(e) => setZinsScope(e.target.value)} className={GREEN_INPUT}>
                  <option value="">Select Insurance Scope</option>
                  {INSURANCE_SCOPE.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={LABEL}>Kilometres</label>
                <input
                  type="number"
                  value={zkm}
                  onChange={(e) => setZkm(e.target.value)}
                  placeholder="0"
                  className={GREEN_INPUT}
                />
              </div> */}
              {!isSap && (
                <div>
                  <label className={LABEL}>DC Reference Number</label>
                  <select value={vbeln} onChange={(e) => setVbeln(e.target.value)} className={GREEN_INPUT}>
                    <option value="" disabled>
                      Select DC Reference
                    </option>
                    {invoiceF4List.map((inv) => (
                      <option key={inv} value={inv}>
                        {inv}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Product table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                  <th className="px-2 py-1.5 text-center w-10">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => toggleAllSelection(e.target.checked)}
                      className="size-4 accent-white"
                    />
                  </th>
                  <th className="px-2 py-1.5 text-center w-14">Sl.No</th>
                  <th className="px-2 py-1.5 text-center">Map ID</th>
                  <th className="px-2 py-1.5 text-center">Product</th>
                  <th className="px-2 py-1.5 text-center">Type of Material</th>
                  <th className="px-2 py-1.5 text-center">Material Description</th>
                  <th className="px-2 py-1.5 text-center">No of Sets/No (Qty)</th>
                  <th className="px-2 py-1.5 text-center">Ah Loaded</th>
                  <th className="px-2 py-1.5 text-center">Shipment Weight (kg)</th>
                  <th className="px-2 py-1.5 text-center">Battery Condition</th>
                  <th className="px-2 py-1.5 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx}>
                    <td className="px-2 py-1 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => onRowCheckboxChange(idx, e.target.checked)}
                        className="size-4 accent-sky-600"
                      />
                    </td>
                    <td className="px-2 py-1 text-center">{idx + 1}</td>
                    <td className="px-2 py-1">
                      <select
                        value={row.ZMAPID}
                        onChange={(e) => onChangeMapId(idx, e.target.value)}
                        className={GREEN_INPUT}
                      >
                        <option value="">Select</option>
                        {selectedItems.map((o) => (
                          <option key={o.MAPID} value={o.MAPID}>
                            {o.MAPID}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.ZPRODUCT}
                        onChange={(e) => updateRow(idx, { ZPRODUCT: e.target.value })}
                        className={GREEN_INPUT}
                      >
                        <option value="">Select Product</option>
                        {PRODUCTS.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={row.MTART}
                        onChange={(e) => updateRow(idx, { MTART: e.target.value })}
                        className={GREEN_INPUT}
                      >
                        <option value="">Select Type</option>
                        {MATERIAL_TYPES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1">
                      <input
                        value={row.MAKTX}
                        onChange={(e) => updateRow(idx, { MAKTX: e.target.value })}
                        placeholder="Enter Description"
                        className={GREEN_INPUT}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        value={row.ZSETS}
                        onChange={(e) => updateRow(idx, { ZSETS: e.target.value })}
                        placeholder="0"
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>
                    <td className="px-2 py-1">
                      {row.ZPRODUCT === "Batteries" && (
                        <input
                          type="number"
                          min={0}
                          value={row.ZAH}
                          onChange={(e) => updateRow(idx, { ZAH: e.target.value })}
                          placeholder="Ah"
                          className={GREEN_INPUT + " text-center"}
                        />
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <input
                        type="number"
                        min={0}
                        value={row.ZSHIP_WT}
                        onChange={(e) => updateRow(idx, { ZSHIP_WT: e.target.value })}
                        className={GREEN_INPUT + " text-center"}
                      />
                    </td>
                    <td className="px-2 py-1">
                      {row.ZPRODUCT === "Batteries" && (
                        <select
                          value={row.ZBATCOND}
                          onChange={(e) => updateRow(idx, { ZBATCOND: e.target.value })}
                          className={GREEN_INPUT}
                        >
                          <option value="">Select Condition</option>
                          {BATTERY_CONDITIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="px-2 py-1">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={addRow}
                          aria-label="Add row"
                          className="inline-grid place-items-center size-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
                        >
                          <Plus className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeRow(idx)}
                          disabled={items.length === 1}
                          aria-label="Delete row"
                          className="inline-grid place-items-center size-7 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm"
                        >
                          <XIcon className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footer action bar */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              onClick={() => saveShipmentOutward("stay")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm"
            >
              <Save className="size-3.5" /> Save
            </button>
            <button
              onClick={() => saveShipmentOutward("next")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm"
            >
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button
              onClick={() => saveShipmentOutward("previous")}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-[12px] font-semibold shadow-sm"
            >
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}

      {/* Global search results (edit/delete) */}
      {searchOptionsList.length > 0 && (
        <div className="overflow-x-auto max-h-[560px]">
          <table className="w-full text-left border-collapse text-[12.5px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                {[
                  "Map ID",
                  "Ref No",
                  "Invoice No",
                  "Line No",
                  "POSNR",
                  "ODN No",
                  "SO No",
                  "Product",
                  "Material Type",
                  "Material Description",
                  "No of Sets",
                  "Ah Loaded",
                  "Shipment Weight",
                  "Battery Condition",
                  // "Incoterms",
                  // "Insurance Scope",
                  // "Kilometres",
                  "Plant",
                  "Division",
                  "Work Order",
                  "LR No",
                  "Transporter",
                  "Created Date",
                  "Vehicle Type",
                  "Action",
                ].map((h) => (
                  <th key={h} className="px-2 py-1.5 whitespace-nowrap text-center">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {searchOptionsList.map((item, i) => (
                <tr
                  key={i}
                  className={
                    i % 2 === 0
                      ? "bg-surface hover:bg-muted/50"
                      : "bg-surface-2/40 hover:bg-muted/50"
                  }
                >
                  <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZMAPID}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">{item.VBELN}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">{item.POSNR}</td>
                  {[
                    ["ZODN_NO"],
                    ["ZSO_NO"],
                    ["ZPRODUCT"],
                    ["MTART"],
                    ["MAKTX"],
                  ].map(([field]) => (
                    <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item[field] ?? ""}
                          onChange={(e) => patchSearchRow(i, { [field]: e.target.value })}
                          className="h-6 w-24 rounded border border-hairline px-1 text-[11px]"
                        />
                      ) : (
                        item[field] || "-"
                      )}
                    </td>
                  ))}
                  {[["ZSETS"], ["ZAH"]].map(([field]) => (
                    <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          type="number"
                          value={item[field] ?? ""}
                          onChange={(e) => patchSearchRow(i, { [field]: e.target.value })}
                          className="h-6 w-16 rounded border border-hairline px-1 text-[11px]"
                        />
                      ) : (
                        item[field]
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.isEdit ? (
                      <input
                        type="number"
                        value={item.ZSHIP_WT ?? ""}
                        onChange={(e) => patchSearchRow(i, { ZSHIP_WT: e.target.value })}
                        className="h-6 w-16 rounded border border-hairline px-1 text-[11px]"
                      />
                    ) : (
                      Number(item.ZSHIP_WT ?? 0).toFixed(2)
                    )}
                  </td>
                  {["ZBATCOND"].map((field) => (
                    <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item[field] ?? ""}
                          onChange={(e) => patchSearchRow(i, { [field]: e.target.value })}
                          className="h-6 w-24 rounded border border-hairline px-1 text-[11px]"
                        />
                      ) : (
                        item[field] || "-"
                      )}
                    </td>
                  ))}
                  {/* <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.isEdit ? (
                      <input
                        type="number"
                        value={item.ZKM ?? ""}
                        onChange={(e) => patchSearchRow(i, { ZKM: e.target.value })}
                        className="h-6 w-16 rounded border border-hairline px-1 text-[11px]"
                      />
                    ) : (
                      item.ZKM
                    )}
                  </td> */}
                  {["ZPLANT", "ZDIVISION", "ZWORK_ORDER", "ZLRNO", "ZTRANSPORTER"].map((field) => (
                    <td key={field} className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item[field] ?? ""}
                          onChange={(e) => patchSearchRow(i, { [field]: e.target.value })}
                          className="h-6 w-24 rounded border border-hairline px-1 text-[11px]"
                        />
                      ) : (
                        item[field] || "-"
                      )}
                    </td>
                  ))}
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : "-"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    {item.isEdit ? (
                      <input
                        value={item.ZVEH_TYPE ?? ""}
                        onChange={(e) => patchSearchRow(i, { ZVEH_TYPE: e.target.value })}
                        className="h-6 w-24 rounded border border-hairline px-1 text-[11px]"
                      />
                    ) : (
                      item.ZVEH_TYPE || "-"
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-1">
                      {!item.isEdit ? (
                        <>
                          <button
                            onClick={() => editSearchRow(i)}
                            title="Edit"
                            className="size-6 grid place-items-center rounded-md text-primary hover:bg-accent/10"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteRow(i)}
                            title="Delete"
                            className="size-6 grid place-items-center rounded-md text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => updateSearchRow(i)}
                            title="Update"
                            className="size-6 grid place-items-center rounded-md text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => cancelSearchEdit(i)}
                            title="Cancel"
                            className="size-6 grid place-items-center rounded-md text-muted-foreground hover:bg-muted"
                          >
                            <XIcon className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}