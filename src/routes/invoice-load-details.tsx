import { useState, useEffect, type ReactNode } from "react";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import * as XLSX from "xlsx";
// @ts-ignore
import jsPDF from "jspdf";
// @ts-ignore
import autoTable from "jspdf-autotable";
import {
  Plus,
  RefreshCw,
  Search,
  MoreVertical,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
  FileText,
  FileDown,
  CalendarIcon,
  X,
  Check,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// NOTE: TRANSPORTERS/VEHICLE_TYPES still back a couple of static dropdowns exactly like the
// Angular template did (Vehicle Type list is hardcoded there too). PLANTS/DIVISIONS are no
// longer used from the mock file — Plant/Division now come from localStorage("currentUser"),
// mirroring the Angular component (`userData.PLANTS`, `userData.DIV`).
import { TRANSPORTERS, VEHICLE_TYPES } from "@/lib/dispatch-mock";
import { counts, type WorklistRow } from "@/lib/le-mock-data";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function getCurrentUser(): { USER: string; PLANTS: any[]; DIV: any[] } {
  try {
    const raw =
      localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const parsed = JSON.parse(raw || "{}");
    const userVal = String(
      parsed?.USER ?? parsed?.USERNAME ?? parsed?.USER_ID ?? parsed?.user ?? ""
    );
    return {
      USER: userVal,
      PLANTS: parsed?.PLANTS || parsed?.PLANT || [],
      DIV: parsed?.DIV || parsed?.DIVISION || [],
    };
  } catch {
    return { USER: "", PLANTS: [], DIV: [] };
  }
}

type BannerTone = "success" | "error" | "warning" | "info";

const TONE_TO_ICON: Record<BannerTone, "success" | "error" | "warning" | "info"> = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
};

// Central alert used everywhere the old InlineBanner used to be shown. Styled the same way
// as the Order Info screen's SweetAlert calls: a plain centered modal with icon + text
// (optional title). Success messages auto-dismiss quickly with no "Ok" button since they're
// just confirmations; warnings/errors/info require the user to dismiss them, since those
// need to be noticed and acted on.
function fireAlert(tone: BannerTone, text: string, title?: string) {
  Swal.fire({
    icon: TONE_TO_ICON[tone],
    title,
    text,
    ...(tone === "success" ? { timer: 1500, showConfirmButton: false } : {}),
  });
}

/* ------------------------------------------------------------------ */
/* Invoice Load Details — SAP create body                              */
/* ------------------------------------------------------------------ */

const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

// Angular's searchOptions -> payload key mapping (global_Fields_SearchOption "data" object)
const SEARCH_OPTIONS: { label: string; key: string }[] = [
  { label: "Reference", key: "ref_no" },
  { label: "Invoice", key: "inv_no" },
  { label: "ODN", key: "odn_no" },
  { label: "SO Number", key: "so_no" },
  { label: "Work Order", key: "workorder_no" },
  { label: "LR Number", key: "lr_no" },
];

const WEEKS = ["Week1", "Week2", "Week3", "Week4", "Week5"];

type ReferenceRow = {
  MAPID: string;
  referenceNumber: string;
  workOrderNumber: string;
  lrNumber: string;
  transporter: string;
  soNumber: string;
  odnNumber: string;
  lineNumber: string;
  ZNO_TRUCKS?: number;
  INV_NO?: { VBELN: string }[];
};

const emptyReferenceRow = (): ReferenceRow => ({
  MAPID: "",
  referenceNumber: "",
  workOrderNumber: "",
  lrNumber: "",
  transporter: "",
  soNumber: "",
  odnNumber: "",
  lineNumber: "",
});

type LoadRow = {
  id: number;
  checked: boolean;
  ZMAPID: string;
  VBELN: string;
  POSNR: string;
  ZTRUC_TYPE: string;
  ZTRUC_WT: string;
  ZACT_LOAD: string;
  ZACT_VOL: string;
  ZLF_VOL: string;
  ZLF_WT: string;
  ZWEEK_SF: string;
  ZEWAYBILL_NO: string;
  ZEWAYBILL_DT: string;
  ZREFNO: string;
  ZWORK_ORDER: string;
  ZLRNO: string;
  ZTRANSPORTER: string;
  ZSO_NO: string;
  ZODN_NO: string;
  ZLINE_NO: string | number;
  ZTRUCK_LINE?: number;
};

const newRow = (id: number, patch: Partial<LoadRow> = {}): LoadRow => ({
  id,
  checked: false,
  ZMAPID: "",
  VBELN: "",
  POSNR: "",
  ZTRUC_TYPE: "",
  ZTRUC_WT: "",
  ZACT_LOAD: "",
  ZACT_VOL: "",
  ZLF_VOL: "",
  ZLF_WT: "",
  ZWEEK_SF: "",
  ZEWAYBILL_NO: "",
  ZEWAYBILL_DT: "",
  ZREFNO: "",
  ZWORK_ORDER: "",
  ZLRNO: "",
  ZTRANSPORTER: "",
  ZSO_NO: "",
  ZODN_NO: "",
  ZLINE_NO: "",
  ...patch,
});

function InvoiceLoadDetailsSapCreate({ mode = "with" }: { mode?: "with" | "without" } = {}) {
  const isWithout = mode === "without";
  const user = getCurrentUser();

  const notify = (tone: BannerTone, text: string, title?: string) => fireAlert(tone, text, title);

  // ── Reference table (mirrors Angular's `referenceItems` FormArray) ──
  const [referenceItems, setReferenceItems] = useState<ReferenceRow[]>([emptyReferenceRow()]);
  const [selectedItems, setSelectedItems] = useState<ReferenceRow[]>([]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);

  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [editBackup, setEditBackup] = useState<Record<number, any>>({});

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [dcRef, setDcRef] = useState("");
  const [dcTouched, setDcTouched] = useState(false);
  const [revealed, setRevealed] = useState(false);

  const [rows, setRows] = useState<LoadRow[]>([newRow(1)]);
  const [nextId, setNextId] = useState(2);
  const [allChecked, setAllChecked] = useState(false);

  const [vehicleTypes, setVehicleTypes] = useState<{ ZTRUC_TYPE: string; ZTRUC_WT: string }[]>([]);
  const [fTransporter, setFTransporter] = useState("");
  const [saving, setSaving] = useState(false);

  const showFields = isWithout || revealed;

  /* ── Load vehicle types (Angular: getVehicleTypes) ── */
  useEffect(() => {
    (async () => {
      try {
        const res: any = await service.gettypeofvehicle();
        setVehicleTypes(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error("Vehicle type fetch failed:", err);
        await Swal.fire('Error', "Failed to load vehicle types", 'error');
      }
    })();
  }, []);


  /* ── Reference row field blur -> global reference lookup (Angular: onFieldBlur) ── */
  const onFieldBlur = async (fieldKey: "REF_NO" | "WORK_ORDER_NO" | "LR_NO" | "TRANSPORTER") => {
    const row = referenceItems[0];
    if (!row) return;
    if (!row.referenceNumber && !row.workOrderNumber && !row.lrNumber && !row.transporter) {
      setReferenceItems([emptyReferenceRow()]);
      return;
    }

    const payload = {
      global_scr: "INVOICE LOAD DETAILS",
      REF_NO: fieldKey === "REF_NO" ? row.referenceNumber : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? row.workOrderNumber : "",
      LR_NO: fieldKey === "LR_NO" ? row.lrNumber : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? row.transporter : "",
      LINE_NO: row.lineNumber || "",
      ZUSER: user.USER,
    };

    try {
      const res: any = isWithout
        ? await service.GlobalReferenceNoFetchwithoutsap(payload)
        : await service.GlobalReferenceNoFetch(payload);
      populateReferenceRows(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error("Reference lookup failed:", err);
      await Swal.fire('Error', "Reference lookup failed", 'error');
    }
  };

  const populateReferenceRows = (data: any[]) => {
    setFullReferenceData(data);
    const f4: string[] = [];

    if (data && data.length > 0) {
      const nextRows: ReferenceRow[] = data.map((d) => {
        if (Array.isArray(d.INV_NO)) {
          d.INV_NO.forEach((inv: any) => {
            if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
          });
        }
        return {
          MAPID: d.MAPID || "",
          referenceNumber: d.REF_NO || "",
          workOrderNumber: d.WORK_ORDER_NO || "",
          lrNumber: d.LR_NO || "",
          transporter: d.TRANSPORTER || "",
          soNumber: "",
          odnNumber: "",
          lineNumber: d.LINE_NO || "",
          ZNO_TRUCKS: d.ZNO_TRUCKS,
          INV_NO: d.INV_NO || [],
        };
      });
      setReferenceItems(nextRows);
      setInvoiceF4List(f4);
      setInvoiceNumber("");
    }
    else {
      Swal.fire({
        icon: 'info',
        title: 'No Records Found',
        text: 'No matching reference details were found.',
        timer: 1500,
        showConfirmButton: false,
        width: '300px'
      });
      setReferenceItems([emptyReferenceRow()]);
      setInvoiceF4List([]);
    }
  };

  const updateReferenceField = (index: number, patch: Partial<ReferenceRow>) => {
    setReferenceItems((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const removeReferenceRow = (index: number) => {
    const removed = referenceItems[index];
    setReferenceItems((prev) => prev.filter((_, i) => i !== index));
    setSelectedItems((prev) =>
      prev.filter(
        (item) =>
          !(
            item.referenceNumber === removed.referenceNumber &&
            item.workOrderNumber === removed.workOrderNumber &&
            item.lrNumber === removed.lrNumber &&
            item.transporter === removed.transporter
          ),
      ),
    );
  };

  /* ── Reference row select checkbox (Angular: onCheckboxChange / updateInvoiceListForSelectedItems) ── */
  const isRowSelected = (row: ReferenceRow) =>
    selectedItems.some(
      (item) =>
        item.MAPID === row.MAPID &&
        item.referenceNumber === row.referenceNumber &&
        item.workOrderNumber === row.workOrderNumber &&
        item.lrNumber === row.lrNumber &&
        item.transporter === row.transporter,
    );

  const toggleReferenceSelection = (row: ReferenceRow, checked: boolean) => {
    let nextSelected: ReferenceRow[];
    if (checked) {
      nextSelected = isRowSelected(row) ? selectedItems : [...selectedItems, row];
    } else {
      nextSelected = selectedItems.filter(
        (item) =>
          !(
            item.MAPID === row.MAPID &&
            item.referenceNumber === row.referenceNumber &&
            item.workOrderNumber === row.workOrderNumber &&
            item.lrNumber === row.lrNumber &&
            item.transporter === row.transporter
          ),
      );
      setRows([newRow(1)]);
      setNextId(2);
      setRevealed(false);
      setDcRef("");
    }
    setSelectedItems(nextSelected);

    const mapIds = new Set(nextSelected.map((i) => i.MAPID));
    const f4: string[] = [];
    fullReferenceData.forEach((ref) => {
      if (mapIds.has(ref.MAPID) && Array.isArray(ref.INV_NO)) {
        ref.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !f4.includes(inv.VBELN)) f4.push(inv.VBELN);
        });
      }
    });
    setInvoiceF4List(f4);
  };

  /* ── GET (With SAP): fetchInvoiceDetails ── */
  const handleGetInvoice = async () => {
    if (!invoiceNumber.trim()) {
      Swal.fire(
        'Warning',
        `Please enter invoice number`,
        'warning'
      );
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one reference row', 'warning');
      return;
    }

    try {
      const res: any = await service.Invoiceloaddetailsfetch({
        INV_GET: invoiceNumber.trim(),
        SCREEN: "WITHSAP",
      });

      if (Array.isArray(res) && res.length > 0) {
        const built: LoadRow[] = [];
        let id = nextId;
        selectedItems.forEach((ref) => {
          const truckCount = Number(ref.ZNO_TRUCKS) || 1;
          for (let i = 0; i < truckCount; i++) {
            built.push(
              newRow(id++, {
                VBELN: invoiceNumber,
                POSNR: res[0]?.POSNR || "",
                ZMAPID: ref.MAPID || "",
                ZREFNO: ref.referenceNumber || "",
                ZWORK_ORDER: ref.workOrderNumber || "",
                ZLRNO: ref.lrNumber || "",
                ZTRANSPORTER: ref.transporter || "",
                ZLINE_NO: ref.lineNumber || "",
                ZTRUCK_LINE: i + 1,
                ZWEEK_SF: res[0]?.ZWEEK_SF || "",
                ZODN_NO: res[0]?.ZODN_NO || "",
                ZSO_NO: res[0]?.ZSO_NO || "",
              }),
            );
          }
        });
        setRows(built);
        setNextId(id);
        setRevealed(true);
        await Swal.fire(
          'Success',
          `Invoice rows created based on No of Trucks`,
          'success'
        );
      } else {
        Swal.fire({
          icon: 'info',
          title: 'No Records Found',
          text: 'No records found for this invoice',
          timer: 1500,
          showConfirmButton: false,
          width: '300px'
        });
      }
    } catch (err) {
      console.error("Invoice fetch failed:", err);
      await Swal.fire('Error', "Fetch failed", 'error');
    }
  };

  /* ── DC Reference select (Without SAP): fetchDcRef ── */
  const handleDcRefChange = async (value: string) => {
    setDcRef(value);
    if (!value.trim()) return;
    if (selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one reference row', 'warning');
      return;
    }

    try {
      const res: any = await service.Invoiceloaddetailsfetch({
        INV_GET: value.trim(),
        SCREEN: "WITHOUTSAP",
      });

      if (Array.isArray(res) && res.length > 0) {
        const built: LoadRow[] = [];
        let id = nextId;
        selectedItems.forEach((ref) => {
          const truckCount = Number(ref.ZNO_TRUCKS) || 1;
          for (let i = 0; i < truckCount; i++) {
            built.push(
              newRow(id++, {
                VBELN: value,
                ZMAPID: ref.MAPID || "",
                ZREFNO: ref.referenceNumber || "",
                ZLINE_NO: ref.lineNumber || "",
                ZWORK_ORDER: ref.workOrderNumber || "",
                ZLRNO: ref.lrNumber || "",
                ZTRANSPORTER: ref.transporter || "",
                ZTRUCK_LINE: i + 1,
                ZWEEK_SF: res[0]?.ZWEEK_SF || "",
              }),
            );
          }
        });
        setRows(built);
        setNextId(id);
        Swal.fire(
          'Success',
          'Invoice rows created based on No of Trucks',
          'success'
        );
      } else {
        await Swal.fire('Info', 'No records found for this invoice', 'info');
      }
    } catch (err) {
      console.error("DC reference fetch failed:", err);
      await Swal.fire('Error', 'Fetch failed', 'error');
    }
  };

  /* ── Load-row helpers ── */
  const addRow = () => {
    setRows((prev) => [...prev, newRow(nextId)]);
    setNextId((n) => n + 1);
  };
  const removeRow = (id: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));
  };
  const updateRow = (id: number, patch: Partial<LoadRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const toggleAll = (checked: boolean) => {
    setAllChecked(checked);
    setRows((prev) => prev.map((r) => ({ ...r, checked })));
  };

  /* ── Row Map ID change -> patch from selectedItems (Angular: onchangeMAPID) ── */
  const onMapIdChange = (rowId: number, mapId: string) => {
    const match = selectedItems.find((i) => i.MAPID === mapId);
    updateRow(rowId, {
      ZMAPID: mapId,
      ZREFNO: match?.referenceNumber || "",
      ZWORK_ORDER: match?.workOrderNumber || "",
      ZLRNO: match?.lrNumber || "",
      ZTRANSPORTER: match?.transporter || "",
      ZLINE_NO: match?.lineNumber ?? "",
    });
  };

  /* ── Truck type change -> auto weight + part-load handling (Angular: onVehicleTypeChange) ── */
  const onTruckTypeSelect = (rowId: number, truckType: string) => {
    if (!truckType) {
      updateRow(rowId, { ZTRUC_TYPE: "", ZTRUC_WT: "", ZACT_LOAD: "" });
      return;
    }
    const matched = vehicleTypes.find((v) => v.ZTRUC_TYPE === truckType);
    const weight = matched?.ZTRUC_WT || "";
    updateRow(rowId, {
      ZTRUC_TYPE: truckType,
      ZTRUC_WT: weight,
      ...(truckType === "PART LOAD" ? { ZACT_LOAD: weight } : {}),
    });
  };

  const onPassingWeightChange = (rowId: number, value: string) => {
    const row = rows.find((r) => r.id === rowId);
    const patch: Partial<LoadRow> = { ZTRUC_WT: value };
    if (row?.ZTRUC_TYPE === "PART LOAD") patch.ZACT_LOAD = value;
    updateRow(rowId, patch);
  };

  /* ── Actual Volume change -> SAP truck lookup (Angular: onTruckTypeChange -> service.sapget) ── */
  const onActualVolumeBlur = async (rowId: number) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row?.ZTRUC_TYPE) return;
    try {
      const res: any = await service.sapget({
        TRUCK: row.ZTRUC_TYPE,
        ZACT_LOAD: Number(row.ZACT_LOAD),
        ZACT_VOL: Number(row.ZACT_VOL),
      });
      const data = Array.isArray(res) ? res[0] : res;
      if (!data) return;
      updateRow(rowId, {
        ZTRUC_TYPE: data.ZTRUC_TYPE ?? row.ZTRUC_TYPE,
        ZACT_LOAD: data.ZACT_LOAD !== undefined ? String(data.ZACT_LOAD) : row.ZACT_LOAD,
        ZACT_VOL: data.ZACT_VOL !== undefined ? String(data.ZACT_VOL) : row.ZACT_VOL,
        ZLF_VOL: data.ZLF_VOL !== undefined ? String(data.ZLF_VOL) : row.ZLF_VOL,
        ZLF_WT: data.ZLF_WT ?? row.ZLF_WT,
        ZTRUC_WT: data.ZTRUC_WT ?? row.ZTRUC_WT,
      });
    } catch (err) {
      console.error("SAP truck lookup failed:", err);
      Swal.fire('Error', 'SAP Truck API failed', 'error');
    }
  };

  /* ── Global search bar (Angular: onSearchReference) ── */
  const handleSearch = async () => {
    if (!searchValue.trim()) {
      Swal.fire('Warning', 'Please enter a value', 'warning');
      return;
    }
    if (!searchType) {
      Swal.fire('Warning', 'Please select a search type', 'warning');
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
    data[searchType] = searchValue.trim();

    const payload = { global: "INVOICE LOAD DETAILS", ZUSER: user.USER, data };

    try {
      const res: any = isWithout
        ? await service.global_Fields_SearchOption_WithoutSap(payload)
        : await service.global_Fields_SearchOption(payload);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        setSearchResults([]);
        Swal.fire('Warning', res.MESSAGE, 'warning');
      } else if (!res?.HEADER || res.HEADER.length === 0) {
        setSearchResults([]);
        Swal.fire('Info', 'No records found', 'info');
      } else {
        setSearchResults(res.HEADER.map((item: any) => ({ ...item, isEdit: false })));
        setRevealed(false);
        Swal.fire('Data fetched successfully!', '', 'success');
      }
    } catch (err) {
      console.error("Search failed:", err);
      Swal.fire('Error', 'Error fetching data', 'error');
    }
  };

  const editSearchRow = (index: number) => {
    setEditBackup((prev) => ({ ...prev, [index]: { ...searchResults[index] } }));
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, isEdit: true } : r)));
  };

  const cancelSearchEdit = (index: number) => {
    const backup = editBackup[index];
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...backup, isEdit: false } : r)));
  };

  const patchSearchRow = (index: number, patch: Record<string, any>) => {
    setSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  };

  const updateSearchRow = async (index: number) => {
    const row = searchResults[index];
    if (!row.ZREFNO || !row.VBELN || !row.ZMAPID || !row.ZLINE_NO) {
      Swal.fire('Error', 'Primary key missing', 'error');
      return;
    }
    const confirmResult = await Swal.fire({
      icon: "question",
      title: "Are you sure?",
      text: "Do you want to update this invoice record?",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      const res: any = isWithout
        ? await service.InvoiceloaddetailsNonSap({
          CHANGE: "X",
          NSAP_LOAD: [
            {
              MANDT: "",
              ZMAPID: row.ZMAPID,
              VBELN: row.VBELN,
              POSNR: row.POSNR,
              ZLINE_NO: row.ZLINE_NO,
              ZREFNO: row.ZREFNO,
              ZWORK_ORDER: row.ZWORK_ORDER,
              ZLRNO: row.ZLRNO,
              ZTRANSPORTER: row.ZTRANSPORTER,
              ZTRUC_TYPE: row.ZTRUC_TYPE,
              ZTRUC_WT: row.ZTRUC_WT,
              ZACT_LOAD: row.ZACT_LOAD,
              ZACT_VOL: row.ZACT_VOL,
              ZLF_VOL: row.ZLF_VOL,
              ZLF_WT: row.ZLF_WT,
              ZWEEK_SF: row.ZWEEK_SF,
              ZEWAYBILL_NO: row.ZEWAYBILL_NO,
              ZEWAYBILL_DT: row.ZEWAYBILL_DT,
              ZUSER: row.ZUSER,
              ZUSER_CH: user.USER,
            },
          ],
        })
        : await service.InvoiceloaddetailsSave({
          CHANGE: "X",
          INV_SAP: [
            {
              ZMAPID: row.ZMAPID,
              VBELN: row.VBELN,
              POSNR: row.POSNR,
              ZLINE_NO: row.ZLINE_NO,
              ZREFNO: row.ZREFNO,
              ZWORK_ORDER: row.ZWORK_ORDER,
              ZLRNO: row.ZLRNO,
              ZTRANSPORTER: row.ZTRANSPORTER,
              ZSO_NO: row.ZSO_NO,
              ZODN_NO: row.ZODN_NO,
              ZTRUC_TYPE: row.ZTRUC_TYPE,
              ZTRUC_WT: row.ZTRUC_WT,
              ZACT_LOAD: row.ZACT_LOAD,
              ZACT_VOL: row.ZACT_VOL,
              ZLF_VOL: row.ZLF_VOL,
              ZLF_WT: row.ZLF_WT,
              ZWEEK_SF: row.ZWEEK_SF,
              ZEWAYBILL_NO: row.ZEWAYBILL_NO,
              ZEWAYBILL_DT: row.ZEWAYBILL_DT,
              ZUSER: row.ZUSER,
              ZUSER_CH: user.USER,
            },
          ],
        });

      if (res?.NUMBER === "200" || res?.STATUS === "true") {
        Swal.fire('Success', 'Invoice updated successfully', 'success');
        patchSearchRow(index, { isEdit: false });
        handleSearch();
      } else {
        Swal.fire('Error', res?.MSG || res?.MESSAGE || "Update failed", 'error');
      }
    } catch (err) {
      console.error("Update failed:", err);
      Swal.fire('Error', 'Server error', 'error');
    }
  };

  const deleteSearchRow = async (index: number) => {
    const row = searchResults[index];
    const confirmResult = await Swal.fire({
      icon: "warning",
      title: "Are you sure?",
      text: "Do you want to delete this record? This action cannot be undone.",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!confirmResult.isConfirmed) return;

    const payload = { DELETE: [{ ZREFNO: row.ZREFNO, ZINV_NO: row.VBELN, ZLINE_NO: row.ZLINE_NO }] };

    try {
      const res: any = isWithout
        ? await service.InvoiceloaddetailsDeleteWithoutsap(payload)
        : await service.InvoiceloaddetailsDeleteWithsap(payload);

      if (res?.STATUS === "TRUE" || res?.STATUS === true || res?.NUMBER === "200") {
        setSearchResults((prev) => prev.filter((_, i) => i !== index));
        Swal.fire('Success', res.MSG || res.MESSAGE || "Record deleted successfully", 'success');
      } else {
        Swal.fire('Error', res?.MSG || res?.MESSAGE || "Delete failed", 'error');
      }
    } catch (err) {
      console.error("Delete failed:", err);
      Swal.fire('Error', "Something went wrong while deleting", 'error');
    }
  };

  /* ── Save (Angular: saveInvoiceDetails / saveInvoiceNonsapDetails) ── */
  const resetAll = () => {
    setRows([newRow(1)]);
    setNextId(2);
    setReferenceItems([emptyReferenceRow()]);
    setSelectedItems([]);
    setInvoiceF4List([]);
    setFullReferenceData([]);
    setInvoiceNumber("");
    setDcRef("");
    setRevealed(false);
  };

  const handleSave = async (action: "stay" | "next" | "previous" = "stay") => {
    const selected = rows.filter((r) => r.checked);
    if (selected.length === 0) {
      Swal.fire('Warning', 'Please select at least one row to save.', 'warning');
      return;
    }
    if (selectedItems.length === 0) {
      Swal.fire('Warning', 'Please select at least one reference row before saving', 'warning');
      return;
    }
    if (isWithout && !dcRef.trim()) {
      Swal.fire('Warning', 'Please enter DC Reference Number', 'warning');
      return;
    }

    setSaving(true);
    try {
      let res: any;
      if (isWithout) {
        const payload = {
          CHANGE: "",
          NSAP_LOAD: selected.map((inv, index) => ({
            MANDT: "",
            ZREFNO: inv.ZREFNO || "",
            ZWORK_ORDER: inv.ZWORK_ORDER || "",
            ZLRNO: inv.ZLRNO || "",
            ZTRANSPORTER: inv.ZTRANSPORTER || "",
            VBELN: dcRef,
            POSNR: index + 10,
            ZLINE_NO: inv.ZLINE_NO || 1,
            ZTRUC_TYPE: inv.ZTRUC_TYPE || "",
            ZTRUC_WT: inv.ZTRUC_WT || "",
            ZACT_LOAD: inv.ZACT_LOAD || "",
            ZACT_VOL: inv.ZACT_VOL || "",
            ZLF_VOL: inv.ZLF_VOL || "",
            ZLF_WT: inv.ZLF_WT || "",
            ZODN_NO: inv.ZODN_NO || "",
            ZSO_NO: inv.ZSO_NO || "",
            ZWEEK_SF: inv.ZWEEK_SF || "",
            ZEWAYBILL_NO: inv.ZEWAYBILL_NO || "",
            ZEWAYBILL_DT: inv.ZEWAYBILL_DT || "",
            ZMAPID: inv.ZMAPID || "",
            ZUSER: user.USER,
            ZUSER_CH: "",
          })),
        };
        console.debug("InvoiceloaddetailsNonSap payload:", payload);
        res = await service.InvoiceloaddetailsNonSap(payload);
        console.debug("InvoiceloaddetailsNonSap response:", res);
      } else {
        const payload = {
          CHANGE: "",
          INV_SAP: selected.map(({ id, checked, ...rest }) => ({
            ...rest,
            ZUSER: user.USER,
            ZUSER_CH: "",
          })),
        };
        console.debug("InvoiceloaddetailsSave payload:", payload);
        res = await service.InvoiceloaddetailsSave(payload);
        console.debug("InvoiceloaddetailsSave response:", res);
      }

      if (res?.NUMBER === "200" || res?.STATUS === "TRUE" || res?.STATUS === true) {
        await Swal.fire({
          icon: "success",
          title: "Success",
          text: res.MSG || res.MESSAGE || "Saved Successfully",
          confirmButtonText: "Ok",
        });
        if (action === "stay") resetAll();
      } else {
        const info = res && typeof res === 'object' ? JSON.stringify(res) : String(res);
        await Swal.fire('Info', res?.MSG || res?.MESSAGE || `Unexpected response: ${info}`, 'info');
      }
    } catch (err: any) {
      console.error("Save failed:", err);
      const msg = err?.message || String(err);
      await Swal.fire('Error', `Save failed: ${msg}`, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selection table — hidden while search results are being shown, same idea as
          Angular's showForm=false on search: the create workflow steps aside for search. */}
      {searchResults.length === 0 && (
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
              {referenceItems.map((row, i) => (
                <tr key={i}>
                  <td className="px-3 py-0.5 text-center">
                    <input
                      type="checkbox"
                      checked={isRowSelected(row)}
                      onChange={(e) => toggleReferenceSelection(row, e.target.checked)}
                      className="size-4 accent-sky-600"
                    />
                  </td>
                  <td className="px-3 py-0.5 text-center">{i + 1}</td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.MAPID}
                      readOnly
                      placeholder="Enter Map ID"
                      className={GREEN_INPUT + " text-center bg-muted/50"}
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.referenceNumber}
                      onChange={(e) => updateReferenceField(i, { referenceNumber: e.target.value })}
                      onBlur={() => i === 0 && onFieldBlur("REF_NO")}
                      onKeyDown={(e) => i === 0 && e.key === "Enter" && onFieldBlur("REF_NO")}
                      readOnly={i !== 0}
                      maxLength={10}
                      placeholder="Enter Ref. No."
                      className={GREEN_INPUT + " text-center"}
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.workOrderNumber}
                      onChange={(e) => updateReferenceField(i, { workOrderNumber: e.target.value })}
                      onBlur={() => i === 0 && onFieldBlur("WORK_ORDER_NO")}
                      onKeyDown={(e) => i === 0 && e.key === "Enter" && onFieldBlur("WORK_ORDER_NO")}
                      readOnly={i !== 0}
                      placeholder="Enter Work Order No."
                      className={GREEN_INPUT + " text-center"}
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.lrNumber}
                      onChange={(e) => updateReferenceField(i, { lrNumber: e.target.value })}
                      onBlur={() => i === 0 && onFieldBlur("LR_NO")}
                      onKeyDown={(e) => i === 0 && e.key === "Enter" && onFieldBlur("LR_NO")}
                      readOnly={i !== 0}
                      placeholder="Enter LR No."
                      className={GREEN_INPUT + " text-center"}
                    />
                  </td>
                  <td className="px-3 py-0.5">
                    <input
                      value={row.transporter}
                      onChange={(e) => updateReferenceField(i, { transporter: e.target.value })}
                      onBlur={() => i === 0 && onFieldBlur("TRANSPORTER")}
                      onKeyDown={(e) => i === 0 && e.key === "Enter" && onFieldBlur("TRANSPORTER")}
                      readOnly={i !== 0}
                      placeholder="Enter Transporter"
                      className={GREEN_INPUT + " text-center"}
                    />
                  </td>
                  <td className="px-3 py-0.5 text-center">
                    {referenceItems.length > 1 && (
                      <button
                        onClick={() => removeReferenceRow(i)}
                        className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted hover:text-destructive"
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
      )}

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && searchResults.length === 0 && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={LABEL}>Invoice Number</label>
                <select
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
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
                onClick={handleGetInvoice}
                disabled={!invoiceNumber.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
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
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button
              onClick={handleSearch}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta"
            >
              <Search className="size-4" />
            </button>
          </div>

          {isWithout && searchResults.length === 0 && (
            <div className="w-full">
              <label className={LABEL}>DC Reference Number</label>
              <select
                value={dcRef}
                onChange={(e) => {
                  setDcTouched(true);
                  handleDcRefChange(e.target.value);
                }}
                onBlur={() => setDcTouched(true)}
                className={GREEN_INPUT}
              >
                <option value="" disabled>
                  Select DC Reference
                </option>
                {invoiceF4List.map((inv) => (
                  <option key={inv} value={inv}>
                    {inv}
                  </option>
                ))}
              </select>
              {dcTouched && !dcRef.trim() && (
                <p className="mt-1 text-[11px] text-red-500 font-medium">DC Reference Number is required</p>
              )}
            </div>
          )}

          {searchResults.length > 0 && (
            <button
              onClick={() => setSearchResults([])}
              className="h-7 px-3 rounded-md border border-hairline bg-surface hover:bg-muted text-[12px] font-semibold text-foreground"
            >
              ← Back to Create
            </button>
          )}
        </div>
      </div>

      {!isWithout && !revealed && searchResults.length === 0 && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && searchResults.length === 0 && (
        <>
          {/* Load details table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface max-h-[600px] overflow-y-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] min-w-[1400px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                    <th className="px-2 py-1.5 text-center w-10">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        onChange={(e) => toggleAll(e.target.checked)}
                        className="size-4 accent-white"
                      />
                    </th>
                    <th className="px-2 py-1.5 text-center w-14">Sl.No</th>
                    <th className="px-2 py-1.5 text-center">Map ID</th>
                    <th className="px-2 py-1.5 text-center">Truck Type</th>
                    <th className="px-2 py-1.5 text-center">
                      Passing Weight
                      <br />
                      (Tons)
                    </th>
                    <th className="px-2 py-1.5 text-center">
                      Actual Load
                      <br />
                      (Tons)
                    </th>
                    <th className="px-2 py-1.5 text-center">
                      Loading factor%
                      <br />
                      (w.r.t weight)
                    </th>
                    <th className="px-2 py-1.5 text-center">Actual Volume Occupied</th>
                    <th className="px-2 py-1.5 text-center">Loading Factor w.r.t Volume</th>
                    {/* <th className="px-2 py-1.5 text-center">Week Wise Shipment Flow</th>
                    <th className="px-2 py-1.5 text-center">Eway Bill Number</th>
                    <th className="px-2 py-1.5 text-center">Eway Bill Expiry Date</th> */}
                    <th className="px-2 py-1.5 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const isPartLoad = row.ZTRUC_TYPE === "PART LOAD";
                    return (
                      <tr key={row.id}>
                        <td className="px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={row.checked}
                            onChange={(e) => updateRow(row.id, { checked: e.target.checked })}
                            className="size-4 accent-sky-600"
                          />
                        </td>
                        <td className="px-2 py-1 text-center">{idx + 1}</td>
                        <td className="px-2 py-1">
                          <select
                            value={row.ZMAPID}
                            onChange={(e) => onMapIdChange(row.id, e.target.value)}
                            className={GREEN_INPUT}
                          >
                            <option value="">Select</option>
                            {selectedItems.map((opt) => (
                              <option key={opt.MAPID} value={opt.MAPID}>
                                {opt.MAPID}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <select
                            value={row.ZTRUC_TYPE}
                            onChange={(e) => onTruckTypeSelect(row.id, e.target.value)}
                            className={GREEN_INPUT}
                          >
                            <option value="">-- Select Vehicle Type</option>
                            {vehicleTypes.map((v) => (
                              <option key={v.ZTRUC_TYPE} value={v.ZTRUC_TYPE}>
                                {v.ZTRUC_TYPE}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={row.ZTRUC_WT}
                            onChange={(e) => onPassingWeightChange(row.id, e.target.value)}
                            className={GREEN_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            type="number"
                            value={row.ZACT_LOAD}
                            onChange={(e) => updateRow(row.id, { ZACT_LOAD: e.target.value })}
                            className={GREEN_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.ZLF_WT}
                            onChange={(e) => updateRow(row.id, { ZLF_WT: e.target.value })}
                            className={GREEN_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.ZACT_VOL}
                            disabled={isPartLoad}
                            onChange={(e) => updateRow(row.id, { ZACT_VOL: e.target.value })}
                            onBlur={() => onActualVolumeBlur(row.id)}
                            className={GREEN_INPUT + " text-center disabled:opacity-50"}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.ZLF_VOL}
                            disabled={isPartLoad}
                            onChange={(e) => updateRow(row.id, { ZLF_VOL: e.target.value })}
                            className={GREEN_INPUT + " text-center disabled:opacity-50"}
                          />
                        </td>
                        {/* <td className="px-2 py-1">
                          <select
                            value={row.ZWEEK_SF}
                            onChange={(e) => updateRow(row.id, { ZWEEK_SF: e.target.value })}
                            className={GREEN_INPUT}
                          >
                            <option value="">Select</option>
                            {WEEKS.map((w) => (
                              <option key={w} value={w}>
                                {w}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1">
                          <input
                            value={row.ZEWAYBILL_NO}
                            onChange={(e) => updateRow(row.id, { ZEWAYBILL_NO: e.target.value })}
                            className={GREEN_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-2 py-1">
                          <div className="relative">
                            <input
                              type="date"
                              value={row.ZEWAYBILL_DT}
                              onChange={(e) => updateRow(row.id, { ZEWAYBILL_DT: e.target.value })}
                              className={GREEN_INPUT + " pr-7"}
                            />
                            <CalendarIcon className="size-3.5 absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                          </div>
                        </td> */}
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
                              onClick={() => removeRow(row.id)}
                              disabled={rows.length === 1}
                              aria-label="Delete row"
                              className="inline-grid place-items-center size-7 rounded-md bg-red-500 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-sm"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer action bar */}
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              disabled={saving}
              onClick={() => handleSave("stay")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              <Save className="size-3.5" /> Save
            </button>
            <button
              disabled={saving}
              onClick={() => handleSave("next")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button
              disabled={saving}
              onClick={() => handleSave("previous")}
              className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[12px] font-semibold shadow-sm"
            >
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}

      {/* Search results (Angular: searchOptionsList table with inline edit/delete) */}
      {searchResults.length > 0 && (
        <div className="max-h-[560px] overflow-auto">
          <div className="max-h-[560px] overflow-auto">
            <table className="w-full text-left border-collapse text-[12.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Map ID</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Ref No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Invoice No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Line No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">ODN No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">SO No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Truck Type</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Actual Load</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Actual Volume</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">E-Way Bill No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">E-Way Bill Date</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Work Order</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">LR No</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center">Transporter</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-center w-20">Action</th>
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
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZMAPID}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZREFNO}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.VBELN}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">{item.ZLINE_NO}</td>
                    <td className="px-2 py-1">
                      {item.isEdit ? (
                        <input
                          value={item.ZODN_NO || ""}
                          onChange={(e) => patchSearchRow(i, { ZODN_NO: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZODN_NO}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZSO_NO || ""}
                          onChange={(e) => patchSearchRow(i, { ZSO_NO: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZSO_NO}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZTRUC_TYPE || ""}
                          onChange={(e) => patchSearchRow(i, { ZTRUC_TYPE: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZTRUC_TYPE}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          type="number"
                          value={item.ZACT_LOAD || ""}
                          onChange={(e) => patchSearchRow(i, { ZACT_LOAD: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZACT_LOAD}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          type="number"
                          value={item.ZACT_VOL || ""}
                          onChange={(e) => patchSearchRow(i, { ZACT_VOL: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZACT_VOL}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZEWAYBILL_NO || ""}
                          onChange={(e) => patchSearchRow(i, { ZEWAYBILL_NO: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZEWAYBILL_NO}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          type="date"
                          value={item.ZEWAYBILL_DT || ""}
                          onChange={(e) => patchSearchRow(i, { ZEWAYBILL_DT: e.target.value })}
                          className={GREEN_INPUT}
                        />
                      ) : (
                        <span>{item.ZEWAYBILL_DT ? format(new Date(item.ZEWAYBILL_DT), "dd-MM-yyyy") : ""}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZWORK_ORDER || ""}
                          onChange={(e) => patchSearchRow(i, { ZWORK_ORDER: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZWORK_ORDER}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZLRNO || ""}
                          onChange={(e) => patchSearchRow(i, { ZLRNO: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZLRNO}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {item.isEdit ? (
                        <input
                          value={item.ZTRANSPORTER || ""}
                          onChange={(e) => patchSearchRow(i, { ZTRANSPORTER: e.target.value })}
                          className={GREEN_INPUT + " text-center"}
                        />
                      ) : (
                        <span>{item.ZTRANSPORTER}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center">
                      {!item.isEdit ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => editSearchRow(i)}
                            className="inline-grid place-items-center size-6 rounded-md text-sky-600 hover:bg-sky-50"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                          <button
                            onClick={() => deleteSearchRow(i)}
                            className="inline-grid place-items-center size-6 rounded-md text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => updateSearchRow(i)}
                            className="inline-grid place-items-center size-6 rounded-md text-emerald-600 hover:bg-emerald-50"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => cancelSearchEdit(i)}
                            className="inline-grid place-items-center size-6 rounded-md text-muted-foreground hover:bg-muted"
                          >
                            <X className="size-3.5" />
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filter & Download tab — invoice-specific wiring                     */
/* ------------------------------------------------------------------ */

function InvoiceFilterDownload({
  sap,
  setSap,
}: {
  sap: "with" | "without" | null;
  setSap: (v: "with" | "without") => void;
}) {
  const mode = sap ?? "with";
  const user = getCurrentUser();
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fPlant, setFPlant] = useState("");
  const [fDivision, setFDivision] = useState("");
  const [fTransporter, setFTransporter] = useState("");
  const [fetchedTransporters, setFetchedTransporters] = useState<string[]>([]);
  const [fVehicleType, setFVehicleType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [applied, setApplied] = useState(false);
  const [completedRows, setCompletedRows] = useState<any[]>([]);
  const [pendingRows, setPendingRows] = useState<any[]>([]);
  const notify = (tone: BannerTone, text: string, title?: string) => fireAlert(tone, text, title);

  const reset = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setApplied(false);
    setCompletedRows([]);
    setPendingRows([]);
  };

  useEffect(() => {
    if (!sap) return;
    (async () => {
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};
        const transporters: string[] = Array.isArray(data.VEND_CODE)
          ? Array.from(new Set(data.VEND_CODE.map((v: any) => String(v.TRANSPORTER)).filter(Boolean)))
          : [];
        setFetchedTransporters(transporters);
      } catch (err) {
        console.error("Transporter fetch failed:", err);
      }
    })();
  }, [sap]);

  const applyFilter = async () => {
    if (!fromDate || !toDate) {
      await Swal.fire('Warning', 'Please select From Date and To Date', 'warning');
      return;
    }
    if (!fStatus) {
      await Swal.fire('Info', 'Please select valid status', 'info');
      return;
    }

    const payload = {
      GLOBAL: "INVOICE LOAD DETAILS",
      ZUSER: user.USER,
      DATE_FROM: format(fromDate, "yyyy-MM-dd"),
      DATE_TO: format(toDate, "yyyy-MM-dd"),
      PLANT: fPlant,
      DIVISION: fDivision,
      TRANSPORTER: fTransporter,
      VEHICLE_TYPE: fVehicleType,
      STATUS: fStatus,
    };

    try {
      const res: any =
        mode === "with"
          ? await service.fetchOrderInfoFiltered(payload)
          : await service.fetchGlobalFilteredNonSap(payload);

      if (res?.STATUS === "FALSE") {
        setCompletedRows([]);
        setPendingRows([]);
        setApplied(false);
        await Swal.fire('Info', res.MSG || "No records available for selected filters", 'info');
        return;
      }

      let records: any[] = [];
      if (Array.isArray(res)) records = res;
      else if (res?.HEADER) records = res.HEADER;
      else if (res?.DATA) records = res.DATA;

      setApplied(true);
      if (fStatus === "Completed") {
        setCompletedRows(records);
        setPendingRows([]);
        await Swal.fire('Success', `Invoice Load Details records: ${records.length}`, 'success');
      } else {
        setPendingRows(records);
        setCompletedRows([]);
        await Swal.fire('Success', `Dispatch records: ${records.length}`, 'success');
      }
    } catch (err) {
      console.error("Filter fetch failed:", err);
      await Swal.fire('Error', "Failed to fetch filtered data", 'error');
    }
  };

  const downloadExcel = () => {
    const exportSource = fStatus === "Completed" ? completedRows : pendingRows;
    if (!exportSource.length) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }
    const fileName =
      fStatus === "Completed"
        ? mode === "with"
          ? "InvoiceLoadDetails_Completed_SAP.xlsx"
          : "InvoiceLoadDetails_Completed_NonSAP.xlsx"
        : mode === "with"
          ? "Dispatch_Pending_SAP.xlsx"
          : "Dispatch_Pending_NonSAP.xlsx";

    const exportData =
      fStatus === "Completed"
        ? exportSource.map((item) => ({
          "Map ID": item.ZMAPID || "",
          "Line No": item.ZLINE_NO || "",
          REFNO: item.ZREFNO || "",
          "Invoice No": item.VBELN || "",
          "ODN Number": item.ZODN_NO || "",
          "SO Number": item.ZSO_NO || "",
          "Truck Type": item.ZTRUC_TYPE || "",
          "Passing Weight (Tons)": item.ZTRUC_WT || "",
          "Actual Load (Tons)": item.ZACT_LOAD || "",
          "Loading factor % (w.r.t weight)": item.ZLF_WT || "",
          "Actual Volume Occupied": item.ZACT_VOL || "",
          "Loading Factor w.r.t Volume": item.ZLF_VOL || "",
          "Week Wise Shipment Flow": item.ZWEEK_SF || "",
          "Eway Bill Number": item.ZEWAYBILL_NO || "",
          "Eway Bill Expiry Date": item.ZEWAYBILL_DT || "",
          Plant: item.ZPLANT || "",
          Division: item.ZDIVISION || "",
          "Work Order": item.ZWORK_ORDER || "",
          "LR No": item.ZLRNO || "",
          Transporter: item.ZTRANSPORTER || "",
          "Created Date": item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : "",
          "Vehicle Type": item.ZVEH_TYPE || "",
        }))
        : exportSource.map((item, index) => ({
          "SI.No": index + 1,
          "Reference No": item.ZREFNO || "",
          "Line No": item.ZLINE_NO || "",
          Date: item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : "",
          Plant: item.ZWERKS || "",
          Division: item.ZDIVISION || "",
          "Vehicle Type": item.ZVEH_TYPE || "",
          "No. of Trucks": item.ZNO_TRUCKS || "",
          "Work Order": item.ZWORK_ORDER || "",
          "Vendor Code": item.ZVENDOR_CD || "",
          Transporter: item.ZTRANSPORTER || "",
          "No. of LRs": item.ZNO_LRS || "",
          "LR Number": item.ZLR_NO || "",
          "Loading Point": item.ZLOAD_PT || "",
          "Unloading Point": item.ZUNLOAD_PT || "",
        }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    ws["!cols"] = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length + 5, 18) }));
    XLSX.writeFile(wb, fileName);
    Swal.fire('Success', `Excel file downloaded: ${fileName}`, 'success');
  };

  const downloadPDF = () => {
    const exportSource = fStatus === "Completed" ? completedRows : pendingRows;
    if (!exportSource.length) {
      Swal.fire('Warning', 'No data available to download', 'warning');
      return;
    }
    const fileName =
      fStatus === "Completed"
        ? mode === "with"
          ? "Invoice-load-details_Completed_SAP.pdf"
          : "Invoice-load-details_Completed_NonSAP.pdf"
        : mode === "with"
          ? "Dispatch_Pending_SAP.pdf"
          : "Dispatch_Pending_NonSAP.pdf";
    const reportTitle =
      fStatus === "Completed" ? "Invoice Load Details Records (Completed)" : "Dispatch Records (Pending)";

    const doc = new (jsPDF as any)({ orientation: "landscape", unit: "mm", format: [420, 297] });
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 18, {
      align: "center",
    });

    let headers: any[] = [];
    let data: any[] = [];

    if (fStatus === "Completed") {
      headers = [
        [
          "SI.No", "Map ID", "Line No", "REFNO", "Invoice No", "ODN Number", "SO Number",
          "Truck Type", "Passing Weight (Tons)", "Actual Load (Tons)", "Loading factor % (Wt)",
          "Actual Volume", "Loading Factor (Vol)", "Week Wise Shipment Flow", "Eway Bill No",
          "Eway Bill Expiry", "Plant", "Division", "Work Order", "LR No", "Transporter",
          "Created Date", "Vehicle Type",
        ],
      ];
      data = exportSource.map((item, index) => [
        index + 1, item.ZMAPID || "", item.ZLINE_NO || "", item.ZREFNO || "", item.VBELN || "",
        item.ZODN_NO || "", item.ZSO_NO || "", item.ZTRUC_TYPE || "", item.ZTRUC_WT || "",
        item.ZACT_LOAD || "", item.ZLF_WT || "", item.ZACT_VOL || "", item.ZLF_VOL || "",
        item.ZWEEK_SF || "", item.ZEWAYBILL_NO || "", item.ZEWAYBILL_DT || "", item.ZPLANT || "",
        item.ZDIVISION || "", item.ZWORK_ORDER || "", item.ZLRNO || "", item.ZTRANSPORTER || "",
        item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : "", item.ZVEH_TYPE || "",
      ]);
    } else {
      headers = [
        [
          "SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type",
          "No. of Trucks", "Work Order", "Vendor Code", "Transporter", "No. of LRs", "LR Number",
          "Loading Point", "Unloading Point",
        ],
      ];
      data = exportSource.map((item, index) => [
        index + 1, item.ZREFNO || "", item.ZLINE_NO || "",
        item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : "",
        item.ZWERKS || "", item.ZDIVISION || "", item.ZVEH_TYPE || "", item.ZNO_TRUCKS || "",
        item.ZWORK_ORDER || "", item.ZVENDOR_CD || "", item.ZTRANSPORTER || "", item.ZNO_LRS || "",
        item.ZLR_NO || "", item.ZLOAD_PT || "", item.ZUNLOAD_PT || "",
      ]);
    }

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [52, 152, 219], fontStyle: "bold", fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
    });

    doc.save(fileName);
    Swal.fire('Success', `PDF file downloaded: ${fileName}`, 'success');
  };

  return (
    <div className="space-y-3">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-accent" />
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
              Filter Options
            </h3>
          </div>
          <SearchSapToggle value={sap} onChange={setSap} />
        </div>

        {!sap ? (
          <div className="p-6 text-center text-[12px] text-muted-foreground">
            Select <span className="font-semibold">With SAP</span> or{" "}
            <span className="font-semibold">Without SAP</span> to view filters.
          </div>
        ) : (
          <>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-x-3 gap-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <DateField label="From Date" value={fromDate} onChange={setFromDate} />
              <DateField label="To Date" value={toDate} onChange={setToDate} />
              <PlantField value={fPlant} onChange={setFPlant} />
              <DivisionField value={fDivision} onChange={setFDivision} />
              <SelectField
                label="Transporter"
                value={fTransporter}
                onChange={setFTransporter}
                options={fetchedTransporters.length > 0 ? fetchedTransporters : TRANSPORTERS}
                placeholder="Select Transporter"
              />
              <SelectField
                label="Vehicle Type"
                value={fVehicleType}
                onChange={setFVehicleType}
                options={VEHICLE_TYPES}
                placeholder="Select Vehicle Type"
              />
              <SelectField
                label="Status"
                value={fStatus}
                onChange={setFStatus}
                options={["Pending", "Completed"]}
                placeholder="Select Status Type"
              />
            </div>

            <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                Reset
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF} disabled={!applied}>
                <FileText className="size-3.5" /> Download PDF
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadExcel} disabled={!applied}>
                <FileDown className="size-3.5 text-emerald-600" /> Download Excel
              </Button>
              <Button size="sm" onClick={applyFilter} className="gap-1.5">
                <Filter className="size-3.5" /> Apply Filter
              </Button>
            </div>
          </>
        )}
      </div>

      {sap && !applied ? (
        <div className="bg-surface border border-dashed border-hairline rounded-2xl p-10 text-center">
          <div className="mx-auto size-12 grid place-items-center rounded-full bg-muted text-muted-foreground">
            <Filter className="size-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No results yet</h3>
          <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
            Choose your filters above and click <span className="font-semibold">Apply Filter</span> to load records.
          </p>
        </div>
      ) : sap && fStatus === "Completed" ? (
        <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
          <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
            <div>
              <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                Loading Factor— Completed
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                {completedRows.length} row{completedRows.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-elegant">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead>
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                  {["SI.No", "Map ID", "Line No", "REFNO", "Invoice No", "ODN Number", "SO Number",
                    "Truck Type", "Passing Weight (Tons)", "Actual Load (Tons)",
                    "Loading factor% (w.r.t weight)", "Actual Volume Occupied",
                    "Loading Factor w.r.t Volume", "Week Wise Shipment Flow", "Eway Bill Number",
                    "Eway Bill Expiry Date", "Plant", "Division", "Work Order", "LR No",
                    "Transporter", "Created date", "Vehicle Type"].map((h) => (
                      <th key={h} className="px-2 py-1.5 whitespace-nowrap">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/60">
                {completedRows.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  completedRows.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                      <td className="px-3 py-2 whitespace-nowrap">{i + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZMAPID}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.VBELN}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZODN_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZSO_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZTRUC_TYPE}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZTRUC_WT}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZACT_LOAD}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZLF_WT}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZACT_VOL}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZLF_VOL}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZWEEK_SF}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZEWAYBILL_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZEWAYBILL_DT}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZPLANT}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZLRNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : ""}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : sap ? (
        <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
          <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
            <div>
              <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                Results — Pending
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                {pendingRows.length} row{pendingRows.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="overflow-x-auto scrollbar-elegant">
            <table className="w-full text-left border-collapse text-[11.5px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
                  {["SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type",
                    "No. of Trucks", "Work Order", "Vendor Code", "Transporter", "No. of LRs",
                    "LR Number", "Loading Point", "Unloading Point"].map((h) => (
                      <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left bg-gradient-primary shadow-soft">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                      No records found.
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((item, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                      <td className="px-3 py-2 whitespace-nowrap">{i + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        {item.ZCREATED_DT ? format(new Date(item.ZCREATED_DT), "dd-MM-yyyy") : ""}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZWERKS}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZNO_TRUCKS}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZVENDOR_CD}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZNO_LRS}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZLR_NO}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZLOAD_PT}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{item.ZUNLOAD_PT}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlantField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const user = getCurrentUser();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Plant</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select Plant" />
        </SelectTrigger>
        <SelectContent>
          {user.PLANTS.map((p: any) => (
            <SelectItem key={p.PLANT_DESC || p.PLANT_TEXT} value={p.PLANT_DESC || p.PLANT_TEXT}>
              {p.PLANT_TEXT}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function DivisionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const user = getCurrentUser();
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Division</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder="Select Division" />
        </SelectTrigger>
        <SelectContent>
          {user.DIV.map((d: any) => (
            <SelectItem key={d.DIVISION} value={d.DIVISION}>
              {d.DIV_TEXT}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Screen shell — inlined from the former le-screen-shell.tsx          */
/* ------------------------------------------------------------------ */

type SapMode = "with" | "without";

type FieldDef = {
  label: string;
  value?: string | number;
  type?: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  span?: 1 | 2 | 3 | 4;
};

type FieldGroup = {
  title: string;
  fields: FieldDef[];
};

type WorklistColumn = {
  key: keyof WorklistRow | string;
  header: string;
  render?: (r: WorklistRow) => ReactNode;
  className?: string;
};

type KpiTile = {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

function LeScreenShell({
  title,
  description,
  kpis,
  groups,
  topFields,
  lineItems,
  children,
  renderCreateBody,
  renderFilterBody,
  renderDirectionExtras,
}: {
  title: string;
  description?: string;
  kpis?: KpiTile[];
  groups?: FieldGroup[];
  topFields?: FieldDef[];
  lineItems?: { columns: string[]; rows: (string | number)[][] };
  children?: ReactNode;
  renderCreateBody?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
  renderFilterBody?: (ctx: {
    sap: SapMode | null;
    setSap: (v: SapMode) => void;
  }) => ReactNode;
  renderDirectionExtras?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
}) {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [searchSap, setSearchSap] = useState<SapMode | null>(null);

  useEffect(() => {
    if (!sap) return;
    (async () => {
      try {
        const res: any = await service.OutwardCountGlobalWithSap({
          INOUT: "OUTWARD",
          TRANS_TYPE: sap === "with" ? "WITHSAP" : "WITHOUTSAP",
          SCREEN: "INVOICE LOAD DETAILS",
        });
        setPendingCount(res?.ZPEND_CNT ?? 0);
        setCompletedCount(res?.ZCONF_CNT ?? 0);
      } catch (err) {
        console.error("Count fetch failed:", err);
      }
    })();
  }, [sap]);

  return (
    <div className="flex flex-col min-h-full">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "create" | "search")}
        className="w-full"
      >
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  {title}
                </h1>
                {description && (
                  <p className="text-[11.5px] text-muted-foreground mt-1 max-w-2xl">{description}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <TabsList className="bg-surface border border-hairline rounded-lg p-0.5 h-7 shadow-soft">
                <TabsTrigger
                  value="create"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-md px-2 py-0.5 text-[11px] font-semibold gap-1 transition-all"
                >
                  <Plus className="size-3" /> Create
                </TabsTrigger>
                <TabsTrigger
                  value="search"
                  className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-md px-2 py-0.5 text-[11px] font-semibold gap-1 transition-all"
                >
                  <Filter className="size-3" /> Filter &amp; Download
                </TabsTrigger>
              </TabsList>
              <div className="h-5 w-px bg-hairline" />
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">
          {/* ───────── Create tab ───────── */}
          <TabsContent value="create" className="mt-0 space-y-2">
            {/* Direction + SAP */}
            <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio
                  label="Outward"
                  checked={direction === "outward"}
                  onSelect={() => setDirection("outward")}
                />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
                    <SapToggle value={sap} onChange={setSap} />
                  </>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  {direction && sap && renderDirectionExtras?.({ sap, direction })}
                  <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-amber-300/60 bg-amber-100 dark:bg-amber-500/15 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                    <span className="size-1.5 rounded-full bg-warning" />
                    Pending
                    <span className="font-mono">{pendingCount}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-emerald-300/60 bg-emerald-100 dark:bg-emerald-500/15 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                    <span className="size-1.5 rounded-full bg-success" />
                    Completed
                    <span className="font-mono">{completedCount}</span>
                  </span>
                </div>
              </div>
              {!direction && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">Select a direction to continue.</p>
              )}
              {direction && !sap && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Select <span className="font-semibold">With SAP</span> or{" "}
                  <span className="font-semibold">Without SAP</span> to continue.
                </p>
              )}
            </div>

            {direction && sap && renderCreateBody?.({ sap, direction })}

            {children}
          </TabsContent>

          {/* ───────── Filter & Download tab ───────── */}
          <TabsContent value="search" className="mt-5 space-y-5">
            {renderFilterBody?.({ sap: searchSap, setSap: setSearchSap })}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function SapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
  const idx = value === "without" ? 1 : 0;
  return (
    <div className="relative inline-flex items-center p-0 rounded-full bg-accent/10 text-[12px]">
      {value && (
        <span
          className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-surface shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${idx * 100}%)` }}
          aria-hidden
        />
      )}
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 px-3 py-1 rounded-full font-medium transition-colors",
            value === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "with" ? "With SAP" : "Without SAP"}
        </button>
      ))}
    </div>
  );
}

function PremiumRadio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={cn(
        "inline-flex items-center gap-2 text-[12px] font-medium cursor-pointer rounded-full pl-1.5 pr-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        checked ? "text-foreground bg-accent/10" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span
        className={cn(
          "grid place-items-center size-4 rounded-full border-2 transition-all",
          checked ? "border-accent" : "border-hairline",
        )}
      >
        <span
          className={cn(
            "size-1.5 rounded-full transition-all",
            checked ? "bg-accent scale-100" : "bg-transparent scale-0",
          )}
        />
      </span>
      {label}
    </button>
  );
}

function SearchSapToggle({
  value,
  onChange,
}: {
  value: SapMode | null;
  onChange: (v: SapMode) => void;
}) {
  const idx = value === "with" ? 0 : value === "without" ? 1 : -1;
  return (
    <div className="relative inline-flex items-center p-0 rounded-full bg-accent/10 text-[12px]">
      {idx >= 0 && (
        <span
          className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-surface shadow-sm transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${idx * 100}%)` }}
          aria-hidden
        />
      )}
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 px-3 py-1 rounded-full font-medium transition-colors",
            value === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "with" ? "With SAP" : "Without SAP"}
        </button>
      ))}
    </div>
  );
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("h-8 justify-start text-left font-normal", !value && "text-muted-foreground")}
          >
            <CalendarIcon className="size-4 mr-2 text-muted-foreground" />
            {value ? format(value, "dd-MM-yyyy") : <span>dd-mm-yyyy</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={value} onSelect={onChange} initialFocus className={cn("p-3 pointer-events-auto")} />
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Route                                                                */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/invoice-load-details")({
  component: InvoiceLoadDetailsPage,
});

function InvoiceLoadDetailsPage() {
  return (
    <LeScreenShell
      title="Loading Factor"
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          // key={sap} forces a remount when the With/Without SAP toggle changes, so all
          // local state (reference rows, selected items, load rows, etc.) resets — mirroring
          // the Angular component's explicit resetConditionalFields() on sapType change.
          <InvoiceLoadDetailsSapCreate key={sap} mode={sap === "with" ? "with" : "without"} />
        ) : null
      }
      renderFilterBody={({ sap, setSap }) => (
        // key={sap} forces remount when the With/Without SAP toggle changes so all
        // local filter state resets — mirroring Angular's onFilterSapTypeChange().
        <InvoiceFilterDownload key={sap ?? "none"} sap={sap} setSap={setSap} />
      )}
    />
  );
}