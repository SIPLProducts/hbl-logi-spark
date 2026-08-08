import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Swal from "sweetalert2";
// @ts-ignore
import service from "@/services/generalservice_service";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Filter,
  FileText,
  FileDown,
  CalendarIcon,
  ClipboardList,
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
import { VEHICLE_TYPES } from "@/lib/dispatch-mock";
import { cn } from "@/lib/utils";
import { FreightBillingSapCreate } from "@/components/freight-billing-sap-create";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/freight-billing")({
  component: FreightBillingPage,
});

// ─────────────────────────────────────────────────────────────
// Types
// NOTE: field names below are taken 1:1 from the Angular
// freight-billing.component.ts / .html reference, and from the
// documented service endpoints (fetchOrderInfoFiltered /
// fetchGlobalFilteredNonSap). Do not rename these — they are the
// literal keys returned by / sent to the SAP + Non-SAP backends.
// ─────────────────────────────────────────────────────────────

type SapMode = "with" | "without"; // "with" => SAP, "without" => Non-SAP
type Category = "Internal" | "External" | "";

const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;
const PA_CHECK_OPTIONS = ["Provision", "Account", "Both"] as const;

// Plant / Division / Transporter ALL come from a single fetchVendorCode()
// call: res[0].PLANT (one row per PLANT+DIVISION combo, already carrying
// pre-built PLANT_TEXT / DIV_TEXT display labels) and res[0].VEND_CODE.
type PlantRow = { PLANT: string; PLANT_DESC: string; DIVISION: string; PLANT_TEXT: string; DIV_TEXT: string };
type DivisionRow = { DIVISION: string; DIV_TEXT: string };
type TransporterData = { code: string; name: string };

const PAGE_TITLE = "Freight Billing";

function renderDirectionExtras(casesCount: number) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-indigo-300/60 bg-indigo-100 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
      <ClipboardList className="size-3" />
      No. of Invoices
      <span className="font-mono">{casesCount}</span>
    </span>
  );
}

function renderCreateBody({ sap, direction }: { sap: SapMode; direction: "outward" | "inward" }) {
  return direction === "outward" ? (
    <FreightBillingSapCreate mode={sap === "with" ? "with" : "without"} />
  ) : null;
}

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────

function FreightBillingPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);

  // Filter & Download filter state
  const [searchSap, setSearchSap] = useState<SapMode | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fPlant, setFPlant] = useState("");
  const [fDivision, setFDivision] = useState("");
  const [fTransporter, setFTransporter] = useState("");
  const [fVehicleType, setFVehicleType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPACheck, setFPACheck] = useState(""); // ZPACHECK — was missing entirely
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);

  // Completed records: ONE flat array (Angular does NOT split HEADER/ITEMS
  // for Freight Billing — every completed record already carries header +
  // charge + provision + account fields together).
  const [freightBillingData, setFreightBillingData] = useState<any[]>([]);
  // Pending / dispatch records
  const [pendingData, setPendingData] = useState<any[]>([]);

  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [casesCount, setCasesCount] = useState(0);

  const [plantList, setPlantList] = useState<PlantRow[]>([]);
  const [divisionList, setDivisionList] = useState<DivisionRow[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<TransporterData[]>([]);
  const [f4Loading, setF4Loading] = useState(false);
  const [category, setCategory] = useState<Category>("");

  function getLoggedInUser(): string {
    try {
      const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
      const u = JSON.parse(raw) as Record<string, unknown>;
      return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
    } catch {
      return "";
    }
  }

  // Category (Internal / External) still comes from the login payload.
  function loadLoginCategory() {
    try {
      const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
      const u = JSON.parse(raw) as any;
      setCategory((u?.CATEGORY as Category) || "");
    } catch {
      setCategory("");
    }
  }

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setFPACheck("");

    setPendingData([]);
    setFreightBillingData([]);

    setApplied(false);
  };

  const handleDirectionChange = (dir: "outward" | "inward") => {
    setDirection(dir);
    setSap(null);

    setPendingCount(0);
    setCompletedCount(0);
    setCasesCount(0);
  };

  const handleSearchSapChange = (value: SapMode) => {
    setSearchSap(value);

    setPendingData([]);
    setFreightBillingData([]);

    setApplied(false);
    setLoading(false);

    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setFPACheck("");
  };

  // ── Category from login payload ──
  useEffect(() => {
    loadLoginCategory();
  }, []);

  // ── Plant / Division / Transporter F4 — ALL from one fetchVendorCode() call ──
  // Response shape:
  //   res[0].PLANT     -> [{ PLANT, PLANT_DESC, DIVISION, PLANT_TEXT, DIV_TEXT }, ...]
  //   res[0].VEND_CODE -> [{ VENDOR_CODE, TRANSPORTER }, ...]
  useEffect(() => {
    const loadF4Data = async () => {
      setF4Loading(true);
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        const plantRows: PlantRow[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: any) => ({
              PLANT: String(p.PLANT ?? ""),
              PLANT_DESC: p.PLANT_DESC || "",
              DIVISION: p.DIVISION || "",
              PLANT_TEXT: p.PLANT_TEXT || p.PLANT_DESC || "",
              DIV_TEXT: p.DIV_TEXT || p.DIVISION || "",
            }))
          : [];

        // Dedupe plants by PLANT_DESC (a plant can repeat once per division)
        const plants: PlantRow[] = Array.from(
          new Map(plantRows.map((p) => [p.PLANT_DESC, p])).values()
        );

        // Dedupe divisions by DIVISION
        const divisions: DivisionRow[] = Array.from(
          new Map(plantRows.map((p) => [p.DIVISION, { DIVISION: p.DIVISION, DIV_TEXT: p.DIV_TEXT }])).values()
        );

        const transporters: TransporterData[] = Array.isArray(data.VEND_CODE)
          ? data.VEND_CODE.map((v: any) => ({
              code: String(v.VENDOR_CODE ?? ""),
              name: v.TRANSPORTER || "",
            }))
          : [];

        setPlantList(plants);
        setDivisionList(divisions);
        setTransporterOptions(transporters);
      } catch (err) {
        console.error("F4 fetch error:", err);
        setPlantList([]);
        setDivisionList([]);
        setTransporterOptions([]);
      } finally {
        setF4Loading(false);
      }
    };

    void loadF4Data();
  }, []);

  // ── Pending / Completed counts ──
  const fetchPendingAndCompletedCounts = async (sapMode: SapMode) => {
    try {
      const payload = {
        INOUT: "OUTWARD",
        TRANS_TYPE: sapMode === "with" ? "WITHSAP" : "WITHOUTSAP",
        SCREEN: "FREIGHT BILLING",
      };

      const response = await service.OutwardCountGlobalWithSap(payload);

      setPendingCount(response?.ZPEND_CNT || 0);
      setCompletedCount(response?.ZCONF_CNT || 0);
      setCasesCount(response?.ZCASE_REP || 0);
    } catch (error) {
      console.error("Error fetching counts:", error);
      setPendingCount(0);
      setCompletedCount(0);
      setCasesCount(0);
    }
  };

  // ── Apply filter ──
  // Correct service methods (matched to Angular / generalservice_service):
  //   With SAP     -> service.fetchOrderInfoFiltered   (POST)
  //   Without SAP  -> service.fetchGlobalFilteredNonSap (PUT)
  // Dates are sent as plain yyyy-MM-dd (same as the native <input type="date">
  // value Angular sends) — NOT yyyyMMdd.
  const applyFilter = async () => {
    if (!fromDate || !toDate) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select From Date and To Date" });
      return;
    }

    setApplied(false);
    setPendingData([]);
    setFreightBillingData([]);

    const payload = {
      GLOBAL: "FREIGHT BILLING",
      ZUSER: getLoggedInUser(),
      DATE_FROM: format(fromDate, "yyyy-MM-dd"),
      DATE_TO: format(toDate, "yyyy-MM-dd"),
      PLANT: fPlant || "",
      DIVISION: fDivision || "",
      TRANSPORTER: fTransporter || "",
      VEHICLE_TYPE: fVehicleType || "",
      STATUS: fStatus || "",
      ZPACHECK: fPACheck || "",
    };

    try {
      setLoading(true);

      let res;
      if (searchSap === "with") {
        res = await service.fetchOrderInfoFiltered(payload);
      } else if (searchSap === "without") {
        res = await service.fetchGlobalFilteredNonSap(payload);
      } else {
        setLoading(false);
        Swal.fire({ icon: "error", title: "Error", text: "Invalid SAP Type selected" });
        return;
      }

      setLoading(false);

      if (res?.STATUS === "FALSE") {
        setFreightBillingData([]);
        setPendingData([]);
        Swal.fire({ icon: "info", title: "No Data Found", text: res?.MSG || "No records available for selected filters" });
        return;
      }

      // Flatten response the same way Angular does
      let records: any[] = [];
      if (Array.isArray(res)) records = res;
      else if (res?.HEADER) records = res.HEADER;
      else if (res?.DATA) records = res.DATA;

      setApplied(true);

      if (fStatus === "Completed") {
        let filtered = records;
        if (fPACheck === "Provision") {
          filtered = records.filter((r: any) => r.ZPRO_CHK === "X" && r.ZACC_CHK !== "X");
        } else if (fPACheck === "Account") {
          filtered = records.filter((r: any) => r.ZACC_CHK === "X" && r.ZPRO_CHK !== "X");
        } else if (fPACheck === "Both") {
          filtered = records.filter((r: any) => r.ZPRO_CHK === "X" && r.ZACC_CHK === "X");
        }

        setFreightBillingData(filtered);
        setPendingData([]);
        Swal.fire({ icon: "success", title: "Success", text: `Freight Billing records: ${filtered.length}` });
      } else if (fStatus === "Pending") {
        setPendingData(records);
        setFreightBillingData([]);
        Swal.fire({ icon: "success", title: "Success", text: `Dispatch records: ${records.length}` });
      } else {
        setFreightBillingData([]);
        setPendingData([]);
        Swal.fire({ icon: "info", title: "Info", text: "Please select valid status" });
      }
    } catch (error) {
      console.error("Filter Error:", error);
      setLoading(false);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch data" });
    }
  };

  // ── Excel export ── (columns match Angular's downloadExcel() exactly)
  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      exportSource = freightBillingData;
      fileName = searchSap === "with" ? "FreightBilling_Completed_SAP.xlsx" : "FreightBilling_Completed_NonSAP.xlsx";
    } else if (fStatus === "Pending") {
      exportSource = pendingData;
      fileName = searchSap === "with" ? "Dispatch_Pending_SAP.xlsx" : "Dispatch_Pending_NonSAP.xlsx";
    } else {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select valid status before download." });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({ icon: "warning", title: "Warning", text: "No data available to download." });
      return;
    }

    let exportData: any[] = [];

    if (fStatus === "Completed") {
      exportData = exportSource.map((record) => ({
        REFNO: record.ZREFNO || "",
        "Invoice No": record.ZINV_NO || "",
        "Odn Number": record.ZODN_NO || "",
        "SO Number": record.ZSONO || "",
        "Sale Person": record.ZSALE_PERSON || "",
        "Freight Bill No": record.ZBILLNO || "",
        "Freight Bill Date": record.ZBILLDATE || "",
        "Physical Submission Date": record.ZPHY_DATE || "",
        "Freight Charges": record.ZFRT_CHARGES || "",
        "Work Order Type": record.ZWORKORDER || "",
        "Bill Submission": record.ZBILL_SUBMISSION || "",
        Location: record.ZLOCATION || "",
        "Vehicle Line": record.ZVEH_LINE || "",
        "Vehicle Number": record.ZVEH_NUM || "",
        Plant: record.ZPLANT || "",
        Division: record.ZDIVISION || "",
        "Work Order": record.ZWORK_ORDER || "",
        "LR No": record.ZLRNO || "",
        Transporter: record.ZTRANSPORTER || "",
        "Created Date": record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        "Vehicle Type": record.ZVEH_TYPE || "",
        Provision: record.ZPRO_CHK === "X" ? "Yes" : "No",
        "Provision Amount": record.ZPROVAMT || "",
        "Provision Date": record.ZPROVDT || "",
        "Provision Basic Freight": record.ZPR_BASIC || "",
        "Provision Detention loading": record.ZPR_DELOAD || "",
        "Provision Detention Unloading": record.ZPR_DEUNLOAD || "",
        "Provision Loading Charges": record.ZPR_LOAD || "",
        "Provision Unloading Charges": record.ZPR_UNLOAD || "",
        "Provision Route Charges": record.ZPR_ROUTE || "",
        "Provision Transhipment Charges": record.ZPR_TSHIP || "",
        "Provision Other Charges": record.ZPR_OTHER || "",
        "Provision Deduction": record.ZPR_DEDUCT || "",
        Account: record.ZACC_CHK === "X" ? "Yes" : "No",
        "Account Basic Freight": record.ZFC_BASIC || "",
        "Account Detention loading": record.ZFC_DELOAD || "",
        "Account Detention Unloading": record.ZFC_DEUNLOAD || "",
        "Account Loading Charges": record.ZFC_LOAD || "",
        "Account Unloading Charges": record.ZFC_UNLOAD || "",
        "Account Route Charges": record.ZFC_ROUTE || "",
        "Account Transhipment Charges": record.ZFC_TSHIP || "",
        "Account Other Charges": record.ZFC_OTHER || "",
        "Account Deduction": record.ZFC_DEDUCT || "",
      }));
    } else {
      exportData = exportSource.map((record) => ({
        "Reference No": record.ZREFNO || "",
        "Line No": record.ZLINE_NO || "",
        Date: record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        Plant: record.ZWERKS || "",
        Division: record.ZDIVISION || "",
        "Vehicle Type": record.ZVEH_TYPE || "",
        "No. of Trucks": record.ZNO_TRUCKS || "",
        "Work Order": record.ZWORK_ORDER || "",
        "Vendor Code": record.ZVENDOR_CD || "",
        Transporter: record.ZTRANSPORTER || "",
        "No. of LRs": record.ZNO_LRS || "",
        "LR Number": record.ZLR_NO || "",
        "Loading Point": record.ZLOAD_PT || "",
        "Unloading Point": record.ZUNLOAD_PT || "",
        "No Of Invoices": record.ZNO_INVOICES || "",
      }));
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length + 5, 18) }));
    XLSX.writeFile(workbook, fileName);

    Swal.fire({ icon: "success", title: "Success", text: `${fileName} downloaded successfully.` });
  };

  // ── PDF export ── (columns match Angular's downloadPDF() exactly)
  const downloadPDF = () => {
    let exportSource: any[] = [];
    let fileName = "";
    let reportTitle = "";

    if (fStatus === "Completed") {
      exportSource = freightBillingData;
      fileName = searchSap === "with" ? "Freight_Billing_Completed_SAP.pdf" : "Freight_Billing_Completed_NonSAP.pdf";
      reportTitle = "Freight Billing Records (Completed)";
    } else if (fStatus === "Pending") {
      exportSource = pendingData;
      fileName = searchSap === "with" ? "Dispatch_Pending_SAP.pdf" : "Dispatch_Pending_NonSAP.pdf";
      reportTitle = "Dispatch Records (Pending)";
    } else {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select valid status." });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({ icon: "warning", title: "Warning", text: "No data available." });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [420, 297] });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    let headers: any[] = [];
    let rows: any[] = [];

    if (fStatus === "Completed") {
      headers = [[
        "SI.No", "REFNO", "Invoice No", "Odn Number", "SO Number", "Sale Person",
        "Freight Bill No", "Freight Bill Date", "Physical Submission Date", "Freight Charges",
        "Work Order Type", "Bill Submission", "Location", "Vehicle Line", "Vehicle Number",
        "Plant", "Division", "Work Order", "LR No", "Transporter", "Created Date", "Vehicle Type",
        "Provision", "Provision Amount", "Provision Date",
        "Provision Basic Amount", "Provision Detention loading Charges", "Provision Detention Unloading Charges",
        "Provision Loading Charges", "Provision Unloading Charges", "Provision Route Charges",
        "Provision Transhipment Charges", "Provision Other Charges", "Provision Deduction",
        "Account", "Account Basic Amount", "Account Detention loading Charges", "Account Detention Unloading Charges",
        "Account Loading Charges", "Account Unloading Charges", "Account Route Charges",
        "Account Transhipment Charges", "Account Other Charges", "Account Deduction",
      ]];

      rows = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || "",
        record.ZINV_NO || "",
        record.ZODN_NO || "",
        record.ZSONO || "",
        record.ZSALE_PERSON || "",
        record.ZBILLNO || "",
        record.ZBILLDATE || "",
        record.ZPHY_DATE || "",
        record.ZFRT_CHARGES || "",
        record.ZWORKORDER || "",
        record.ZBILL_SUBMISSION || "",
        record.ZLOCATION || "",
        record.ZVEH_LINE || "",
        record.ZVEH_NUM || "",
        record.ZPLANT || "",
        record.ZDIVISION || "",
        record.ZWORK_ORDER || "",
        record.ZLRNO || "",
        record.ZTRANSPORTER || "",
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        record.ZVEH_TYPE || "",
        record.ZPRO_CHK === "X" ? "Yes" : "No",
        record.ZPROVAMT || "",
        record.ZPROVDT ? new Date(record.ZPROVDT).toLocaleDateString("en-GB") : "",
        record.ZPR_BASIC || "",
        record.ZPR_DELOAD || "",
        record.ZPR_DEUNLOAD || "",
        record.ZPR_LOAD || "",
        record.ZPR_UNLOAD || "",
        record.ZPR_ROUTE || "",
        record.ZPR_TSHIP || "",
        record.ZPR_OTHER || "",
        record.ZPR_DEDUCT || "",
        record.ZACC_CHK === "X" ? "Yes" : "No",
        record.ZFC_BASIC || "",
        record.ZFC_DELOAD || "",
        record.ZFC_DEUNLOAD || "",
        record.ZFC_LOAD || "",
        record.ZFC_UNLOAD || "",
        record.ZFC_ROUTE || "",
        record.ZFC_TSHIP || "",
        record.ZFC_OTHER || "",
        record.ZFC_DEDUCT || "",
      ]));
    } else {
      headers = [[
        "SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type",
        "No. of Trucks", "Work Order", "Vendor Code", "Transporter", "No. of LRs",
        "LR Number", "Loading Point", "Unloading Point", "No Of Invoices",
      ]];

      rows = exportSource.map((record, index) => ([
        index + 1,
        record.ZREFNO || "",
        record.ZLINE_NO || "",
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        record.ZWERKS || "",
        record.ZDIVISION || "",
        record.ZVEH_TYPE || "",
        record.ZNO_TRUCKS || "",
        record.ZWORK_ORDER || "",
        record.ZVENDOR_CD || "",
        record.ZTRANSPORTER || "",
        record.ZNO_LRS || "",
        record.ZLR_NO || "",
        record.ZLOAD_PT || "",
        record.ZUNLOAD_PT || "",
        record.ZNO_INVOICES || "",
      ]));
    }

    autoTable(doc, {
      head: headers,
      body: rows,
      startY: 25,
      theme: "grid",
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [52, 152, 219], textColor: 255, fontStyle: "bold", fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(fileName);
    Swal.fire({ icon: "success", title: "Success", text: `${fileName} downloaded successfully.` });
  };

  const resultCount = fStatus === "Completed" ? freightBillingData.length : pendingData.length;

  const showProvisionCols = fPACheck !== "Account";
  const showAccountCols = fPACheck !== "Provision";

  return (
    <div className="flex flex-col min-h-full">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  {PAGE_TITLE}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <TabsList className="bg-surface border border-hairline rounded-lg p-0.5 h-7 shadow-soft">
                <TabsTrigger value="create" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-md px-2 py-0.5 text-[11px] font-semibold gap-1 transition-all">
                  <Plus className="size-3" /> Create
                </TabsTrigger>
                <TabsTrigger value="search" className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-md px-2 py-0.5 text-[11px] font-semibold gap-1 transition-all">
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

        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">
          {/* ───────── Create tab ───────── */}
          <TabsContent value="create" className="mt-0 space-y-2">
            <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio
                  label="Outward"
                  checked={direction === "outward"}
                  onSelect={() => handleDirectionChange("outward")}
                />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
                    <SapToggle
                      value={sap}
                      onChange={(value) => {
                        setSap(value);
                        fetchPendingAndCompletedCounts(value);
                      }}
                    />
                  </>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  {/* {direction && sap && renderDirectionExtras(casesCount)} */}
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
                  Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span> to continue.
                </p>
              )}
            </div>

            {direction && sap && renderCreateBody({ sap, direction })}
          </TabsContent>

          {/* ───────── Filter & Download tab ───────── */}
          <TabsContent value="search" className="mt-5 space-y-5">
            <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
              <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-accent" />
                  <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                    Filter Options
                  </h3>
                </div>
                <SearchSapToggle value={searchSap} onChange={handleSearchSapChange} />
              </div>

              {!searchSap && (
                <div className="p-6 text-center text-[12px] text-muted-foreground">
                  Select <span className="font-semibold">With SAP</span> or{" "}
                  <span className="font-semibold">Without SAP</span> to view filters.
                </div>
              )}

              {searchSap && (
                <>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <DateField label="From Date" value={fromDate} onChange={setFromDate} />
                    <DateField label="To Date" value={toDate} onChange={setToDate} />

                    {/* Plant / Division / Transporter: all sourced from fetchVendorCode() */}
                    <PlantF4Field value={fPlant} onChange={setFPlant} options={plantList} loading={f4Loading} />
                    <DivisionF4Field value={fDivision} onChange={setFDivision} options={divisionList} loading={f4Loading} />

                    <TransporterF4Field
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={transporterOptions}
                      loading={f4Loading}
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
                      options={[...STATUS_OPTIONS]}
                      placeholder="Select Status"
                    />
                    {/* P/A Check — Internal users only, matches Angular *ngIf="loginData?.CATEGORY=='Internal'" */}
                    {category === "Internal" && (
                      <SelectField
                        label="P/A Check"
                        value={fPACheck}
                        onChange={setFPACheck}
                        options={[...PA_CHECK_OPTIONS]}
                        placeholder="Select P/A Check"
                      />
                    )}
                  </div>

                  <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={downloadPDF}
                      disabled={
                        !applied ||
                        (fStatus === "Completed" && freightBillingData.length === 0) ||
                        (fStatus === "Pending" && pendingData.length === 0)
                      }
                    >
                      <FileText className="size-3.5 text-red-600" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={downloadExcel}
                      disabled={
                        !applied ||
                        (fStatus === "Completed" && freightBillingData.length === 0) ||
                        (fStatus === "Pending" && pendingData.length === 0)
                      }
                    >
                      <FileDown className="size-3.5 text-emerald-600" />
                      Download Excel
                    </Button>
                    <Button size="sm" onClick={applyFilter} disabled={loading} className="gap-1.5">
                      <Filter className="size-3.5" />
                      {loading ? "Loading..." : "Apply Filter"}
                    </Button>
                  </div>
                </>
              )}
            </div>

            {!applied ? (
              <div className="bg-surface border border-dashed border-hairline rounded-2xl p-10 text-center">
                <div className="mx-auto size-12 grid place-items-center rounded-full bg-muted text-muted-foreground">
                  <Filter className="size-5" />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                  No results yet
                </h3>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
                  Choose your filters above and click{" "}
                  <span className="font-semibold">Apply Filter</span> to load records.
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                      Results
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {resultCount} row{resultCount === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>

                {applied && fStatus === "Completed" && (
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                          <th className="px-3 py-2.5 whitespace-nowrap">SI.No</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">REFNO</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Invoice No</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Odn Number</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">SO Number</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Sale Person</th>

                          {showProvisionCols && (
                            <>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Amount</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Basic Freight</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Detention loading</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Detention Unloading</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Loading Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Unloading Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Route Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Transhipment Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Other Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Provision Deduction</th>
                            </>
                          )}

                          {showAccountCols && (
                            <>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Basic Freight</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Detention loading</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Detention Unloading</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Loading Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Unloading Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Route Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Transhipment Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Other Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Account Deduction</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Freight Bill No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Freight Bill Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Physical Submission Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Freight Charges</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Bill Submission</th>
                            </>
                          )}

                          <th className="px-3 py-2.5 whitespace-nowrap">Work Order Type</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Location</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Line</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Number</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Plant</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Division</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Work Order</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">LR No</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Transporter</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Created Date</th>
                          <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Type</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-hairline/70">
                        {freightBillingData.length === 0 ? (
                          <tr>
                            <td colSpan={40} className="px-3 py-10 text-center text-muted-foreground">
                              No Records Found
                            </td>
                          </tr>
                        ) : (
                          freightBillingData.map((item: any, index: number) => (
                            <tr
                              key={index}
                              className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZREFNO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_NO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZODN_NO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZSONO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZSALE_PERSON}</td>

                              {showProvisionCols && (
                                <>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZPRO_CHK === "X" ? "X" : "No"}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPROVAMT}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZPROVDT ? new Date(item.ZPROVDT).toLocaleDateString("en-GB") : ""}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_BASIC}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_DELOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_DEUNLOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_LOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_UNLOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_ROUTE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_TSHIP}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_OTHER}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZPR_DEDUCT}</td>
                                </>
                              )}

                              {showAccountCols && (
                                <>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZACC_CHK === "X" ? "X" : "No"}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_BASIC}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_DELOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_DEUNLOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_LOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_UNLOAD}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_ROUTE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_TSHIP}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_OTHER}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFC_DEDUCT}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZBILLNO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZBILLDATE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZPHY_DATE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZFRT_CHARGES}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZBILL_SUBMISSION}</td>
                                </>
                              )}

                              <td className="px-3 py-2 whitespace-nowrap">{item.ZWORKORDER}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZLOCATION}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_LINE}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_NUM}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZPLANT}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZLRNO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : ""}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {applied && fStatus === "Pending" && (
                  <div className="overflow-x-auto max-h-[550px]">
                    <table className="w-full text-left border-collapse text-[12px]">
                      <thead className="sticky top-0 z-30">
                        <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                          <th className="px-3 py-2 whitespace-nowrap">SI.No</th>
                          <th className="px-3 py-2 whitespace-nowrap">Reference No</th>
                          <th className="px-3 py-2 whitespace-nowrap">Line No</th>
                          <th className="px-3 py-2 whitespace-nowrap">Date</th>
                          <th className="px-3 py-2 whitespace-nowrap">Plant</th>
                          <th className="px-3 py-2 whitespace-nowrap">Division</th>
                          <th className="px-3 py-2 whitespace-nowrap">Vehicle Type</th>
                          <th className="px-3 py-2 whitespace-nowrap">No. of Trucks</th>
                          <th className="px-3 py-2 whitespace-nowrap">Work Order</th>
                          <th className="px-3 py-2 whitespace-nowrap">Vendor Code</th>
                          <th className="px-3 py-2 whitespace-nowrap">Transporter</th>
                          <th className="px-3 py-2 whitespace-nowrap">No. of LRs</th>
                          <th className="px-3 py-2 whitespace-nowrap">LR Number</th>
                          <th className="px-3 py-2 whitespace-nowrap">Loading Point</th>
                          <th className="px-3 py-2 whitespace-nowrap">Unloading Point</th>
                          <th className="px-3 py-2 whitespace-nowrap">No Of Invoices</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-hairline/70">
                        {pendingData.length === 0 ? (
                          <tr>
                            <td colSpan={16} className="px-3 py-10 text-center text-muted-foreground">
                              No Pending Records Found
                            </td>
                          </tr>
                        ) : (
                          pendingData.map((item, index) => (
                            <tr
                              key={index}
                              className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                            >
                              <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                              <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                {item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : ""}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZWERKS}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZNO_TRUCKS}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZVENDOR_CD}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZNO_LRS}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZLR_NO}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZLOAD_PT}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZUNLOAD_PT}</td>
                              <td className="px-3 py-2 whitespace-nowrap">{item.ZNO_INVOICES}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Helper components
// ─────────────────────────────────────────────────────────────

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

function PremiumRadio({ label, checked, onSelect }: { label: string; checked: boolean; onSelect: () => void }) {
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
      <span className={cn("grid place-items-center size-4 rounded-full border-2 transition-all", checked ? "border-accent" : "border-hairline")}>
        <span className={cn("size-1.5 rounded-full transition-all", checked ? "bg-accent scale-100" : "bg-transparent scale-0")} />
      </span>
      {label}
    </button>
  );
}

function SearchSapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
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

function DateField({ label, value, onChange }: { label: string; value: Date | undefined; onChange: (d: Date | undefined) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 justify-start text-left font-normal", !value && "text-muted-foreground")}>
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
  label, value, onChange, options, placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Plant dropdown — sourced from fetchVendorCode() res[0].PLANT.
// value = PLANT_DESC (what the filter payload's PLANT field expects),
// label = PLANT_TEXT (pre-built "CODE_DESC_DIVISION" string from the API).
function PlantF4Field({
  value, onChange, options, loading,
}: {
  value: string; onChange: (v: string) => void; options: PlantRow[]; loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.PLANT_DESC === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Plant</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 justify-between font-normal", !value && "text-muted-foreground")}>
            <span className="truncate">{selected ? (selected.PLANT_TEXT || selected.PLANT_DESC) : "Select Plant"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">Loading…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">No plants available</div>
            ) : (
              options.map((o, i) => (
                <button
                  key={`${o.PLANT}-${i}`}
                  type="button"
                  onClick={() => { onChange(o.PLANT_DESC); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-[12px] hover:bg-muted", value === o.PLANT_DESC && "bg-accent/10 font-semibold")}
                >
                  {o.PLANT_TEXT || o.PLANT_DESC}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Division dropdown — sourced from the same fetchVendorCode() res[0].PLANT
// array, deduped by DIVISION. value = DIVISION, label = DIV_TEXT.
function DivisionF4Field({
  value, onChange, options, loading,
}: {
  value: string; onChange: (v: string) => void; options: DivisionRow[]; loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.DIVISION === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Division</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 justify-between font-normal", !value && "text-muted-foreground")}>
            <span className="truncate">{selected ? selected.DIV_TEXT : "Select Division"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="max-h-56 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">Loading…</div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">No divisions available</div>
            ) : (
              options.map((o) => (
                <button
                  key={o.DIVISION}
                  type="button"
                  onClick={() => { onChange(o.DIVISION); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-[12px] hover:bg-muted", value === o.DIVISION && "bg-accent/10 font-semibold")}
                >
                  {o.DIV_TEXT}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Transporter dropdown: value = TRANSPORTER name (Angular's filter select
// uses transporter.TRANSPORTER for BOTH value and label — it does not use
// a separate vendor code as the value), sourced from fetchVendorCode() -> VEND_CODE.
function TransporterF4Field({
  value, onChange, options, loading,
}: {
  value: string; onChange: (v: string) => void; options: TransporterData[]; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.name === value);

  const filtered = search.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
    : options;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Transporter</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 justify-between font-normal w-full", !value && "text-muted-foreground")}>
            <span className="truncate">{selected ? selected.name : "Select Transporter"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="border-b border-hairline p-2">
            <input
              type="text"
              value={search}
              placeholder="Search transporter..."
              className="w-full rounded border border-input px-2 py-1 text-[12px] outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/30"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">Loading…</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">No transporters found</div>
            ) : (
              filtered.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => { onChange(o.name); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-[12px] hover:bg-muted", value === o.name && "bg-accent/10 font-semibold")}
                >
                  {o.name}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}