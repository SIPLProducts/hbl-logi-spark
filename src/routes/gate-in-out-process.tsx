import { useState, useEffect, useRef, type ReactNode } from "react";
import { format } from "date-fns";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Plus,
  RefreshCw,
  Filter,
  FileText,
  FileDown,
  CalendarIcon,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  Search,
  Loader2,
  ChevronDown,
  Check,
  X,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { PLANTS, DIVISIONS, TRANSPORTERS, VEHICLE_TYPES } from "@/lib/dispatch-mock";
import { counts, type WorklistRow } from "@/lib/le-mock-data";
import { OrderInfoSapCreate } from "@/components/order-info-sap-create";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportRowsToXls } from "@/lib/export-xls.js";
// @ts-ignore
import service from "@/services/generalservice_service.js";

type SapMode = "with" | "without";

const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;

const DEFAULT_COLUMNS = [
  { key: "slNo", header: "Sl.No", render: (r: WorklistRow) => r.slNo },
  { key: "reference", header: "Reference", render: (r: WorklistRow) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r: WorklistRow) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r: WorklistRow) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r: WorklistRow) => r.transporter },
];

export const Route = createFileRoute("/gate-in-out-process")({
  component: GateInOutProcessPage,
});

function GateInOutProcessPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [fetchedPlants, setFetchedPlants] = useState<string[]>([]);
  const [fetchedDivisions, setFetchedDivisions] = useState<string[]>([]);
  const [fetchedTransporters, setFetchedTransporters] = useState<string[]>([]);
  const [orderInfoData, setOrderInfoData] = useState<any[]>([]);
  const [dispatchData, setDispatchData] = useState<any[]>([]);
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Filter & Download state
  const [searchSap, setSearchSap] = useState<SapMode | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fPlant, setFPlant] = useState("");
  const [fDivision, setFDivision] = useState("");
  const [fTransporter, setFTransporter] = useState("");
  const [fVehicleType, setFVehicleType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [applied, setApplied] = useState(false);

  const rows: WorklistRow[] = [];

  useEffect(() => {
    if (!sap) return;
    (async () => {
      try {
        const res: any = await service.OutwardCountGlobalWithSap({
          INOUT: "OUTWARD",
          TRANS_TYPE: sap === "with" ? "WITHSAP" : "WITHOUTSAP",
          SCREEN: "GATE IN OUT",
        });
        setPendingCount(res?.ZPEND_CNT ?? 0);
        setCompletedCount(res?.ZCONF_CNT ?? 0);
      } catch (err) {
        console.error("Count fetch failed:", err);
      }
    })();
  }, [sap]);

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setApplied(false);
    setSearchSap(null);
  };

  useEffect(() => {
    if (!searchSap) return;
    (async () => {
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        const plants: string[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: any) => {
            const desc = String(p.PLANT_DESC || "").split("_")[0].trim();
            return `${p.PLANT}_${desc}`;
          })
          : [];

        const divisions: string[] = Array.isArray(data.PLANT)
          ? Array.from(new Set(data.PLANT.map((p: any) => String(p.DIVISION || "")).filter(Boolean)))
          : [];

        const transporters: string[] = Array.isArray(data.VEND_CODE)
          ? Array.from(new Set(data.VEND_CODE.map((v: any) => String(v.TRANSPORTER)).filter(Boolean)))
          : [];

        setFetchedPlants(plants);
        setFetchedDivisions(divisions);
        setFetchedTransporters(transporters);
      } catch (err) {
        console.error("Transporter/Plant/Division fetch failed:", err);
      }
    })();
  }, [searchSap]);

  const onApply = async () => {
    if (!fromDate || !toDate) {
      Swal.fire("Warning", "Please select From Date and To Date", "warning");
      return;
    }

    if (searchSap !== "with") {
      Swal.fire("Info", "Only 'With SAP' is supported for Gate In Out filter.", "info");
      return;
    }

    try {
      setIsFilterLoading(true);
      const payload = {
        GLOBAL: "GATE IN OUT",
        ZUSER: getLoggedInUser(),
        DATE_FROM: format(fromDate, "yyyyMMdd"),
        DATE_TO: format(toDate, "yyyyMMdd"),
        PLANT: fPlant || "",
        DIVISION: fDivision || "",
        TRANSPORTER: fTransporter || "",
        VEHICLE_TYPE: fVehicleType || "",
        STATUS: fStatus || "",
      };

      const res: any = await service.FilterRecordsGateInOutWithSap(payload);

      setApplied(true);
      setOrderInfoData([]);
      setDispatchData([]);

      if (!res || (Array.isArray(res) && res.length === 0) || res?.STATUS === "FALSE") {
        Swal.fire("Info", res?.MSG || "No records found.", "info");
      } else {
        if (fStatus === "Pending") {
          setDispatchData(Array.isArray(res) ? res : [res]);
        } else if (fStatus === "Completed") {
          setOrderInfoData(Array.isArray(res) ? res : [res]);
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch filter records.", "error");
    } finally {
      setIsFilterLoading(false);
    }
  };

  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      exportSource = orderInfoData;
      fileName = searchSap === "with" ? "Gate-In-Out_Completed_SAP.xls" : "Gate-In-Out_Completed_NonSAP.xls";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;
      fileName = searchSap === "with" ? "Gate-In-Out_Pending_SAP.xls" : "Gate-In-Out_Pending_NonSAP.xls";
    } else {
      Swal.fire("Warning", "Please select valid status before download", "warning");
      return;
    }

    if (!exportSource || exportSource.length === 0) {
      Swal.fire("Warning", "No data available to download", "warning");
      return;
    }

    if (fStatus === "Completed") {
      const combinedData: any[] = [];
      exportSource.forEach((record) => {
        const header = record.HEADER || {};
        const items = Array.isArray(record.ITEMS) ? record.ITEMS : [];
        if (items.length > 0) {
          items.forEach((item: any) => combinedData.push({ ...header, ...item }));
        } else {
          combinedData.push(header);
        }
      });

      exportRowsToXls(
        fileName,
        [
          // Header Fields
          { header: "Reference No", value: (r: any) => r.REFERENCE_NUMBER || "" },
          { header: "Reference Line Item", value: (r: any) => r.REFERENCE_LINE_ITEM || "" },
          { header: "Invoice No", value: (r: any) => r.ZINV_NO || "" },
          { header: "Plant", value: (r: any) => r.ZPLANT || "" },
          { header: "Eway Bill Applicable", value: (r: any) => r.EWAY_BILL_APPLICABLE || "" },
          { header: "Eway Bill Date", value: (r: any) => r.EWAY_BILL_DATE ? new Date(r.EWAY_BILL_DATE).toLocaleDateString("en-GB") : "" },
          { header: "Eway Bill Number", value: (r: any) => r.EWAY_BILL_NUMBER || "" },
          { header: "Eway Bill Expire Date", value: (r: any) => r.EWAY_BILL_EXPIRE_DATE ? new Date(r.EWAY_BILL_EXPIRE_DATE).toLocaleDateString("en-GB") : "" },
          { header: "Insurance Scope", value: (r: any) => r.INSURANCE_SCOPE || "" },
          { header: "Kilometers", value: (r: any) => r.KILLOMETERS || "" },
          { header: "Work Order", value: (r: any) => r.ZWORK_ORDER || "" },
          { header: "LR No", value: (r: any) => r.ZLRNO || "" },
          { header: "Transporter", value: (r: any) => r.ZTRANSPORTER || "" },
          { header: "Created Date", value: (r: any) => r.ZCREATED_DT ? new Date(r.ZCREATED_DT).toLocaleDateString("en-GB") : "" },
          { header: "Created User", value: (r: any) => r.ZUSER || "" },
          { header: "Changed User", value: (r: any) => r.ZUSER_CH || "" },

          // Item Fields
          { header: "Line Item", value: (r: any) => r.INVOICE_LINE_ITEM || "" },
          { header: "Sl No", value: (r: any) => r.SL_NO || "" },
          { header: "Required Date", value: (r: any) => r.REQUIRED_DATE_AND_TIME ? new Date(r.REQUIRED_DATE_AND_TIME).toLocaleString("en-GB") : "" },
          { header: "Reported Date", value: (r: any) => r.REPORTED_DATE_AND_TIME ? new Date(r.REPORTED_DATE_AND_TIME).toLocaleString("en-GB") : "" },
          { header: "Dispatch Date", value: (r: any) => r.PHYSICAL_DISPATCH_DATE_TIME ? new Date(r.PHYSICAL_DISPATCH_DATE_TIME).toLocaleString("en-GB") : "" },
          { header: "Truck Type", value: (r: any) => r.TRUCK_TYPE || "" },
          { header: "Type of Transporter", value: (r: any) => r.TYPE_OF_TRANSPORTER || "" },
          { header: "Vehicle Number", value: (r: any) => r.VEHICLE_NUMBER || "" },
          { header: "No of Vehicles", value: (r: any) => r.NO_OF_VEHICLES || "" },
          { header: "Driver Number", value: (r: any) => r.DRIVER_NUMBER || "" },
          { header: "Driver Name", value: (r: any) => r.DRIVER_NAME || "" },
          { header: "Customer Emails", value: (r: any) => Array.isArray(r.CUSTOMER_EMAIL_DETAILS) ? r.CUSTOMER_EMAIL_DETAILS.map((e: any) => e.CUSTOMER_EMAIL_ID).join(", ") : "" },
          { header: "Salesperson Emails", value: (r: any) => Array.isArray(r.SALESPERSON_EMAIL_DETAILS) ? r.SALESPERSON_EMAIL_DETAILS.map((e: any) => e.SALESPERSON_EMAIL_ID).join(", ") : "" },
          { header: "GPS Loc", value: (r: any) => r.GPS_LIVE_LOCATION || "" },
          { header: "TAT Type", value: (r: any) => r.TAT_TYPE || "" },
          { header: "TAT Days", value: (r: any) => r.TAT_DAYS || "" },
          { header: "ETA", value: (r: any) => r.ETA ? new Date(r.ETA).toLocaleDateString("en-GB") : "" },
        ],
        combinedData,
      );
    } else {
      exportRowsToXls(
        fileName,
        [
          { header: "Reference No", value: (r: any) => r.ZREFNO || "" },
          { header: "Line No", value: (r: any) => r.ZLINE_NO || "" },
          { header: "Date", value: (r: any) => (r.ZCREATED_DT ? new Date(r.ZCREATED_DT).toLocaleDateString("en-GB") : "") },
          { header: "Plant", value: (r: any) => r.ZWERKS || "" },
          { header: "Division", value: (r: any) => r.ZDIVISION || "" },
          { header: "Vehicle Type", value: (r: any) => r.ZVEH_TYPE || "" },
          { header: "No. of Trucks", value: (r: any) => r.ZNO_TRUCKS || "" },
          { header: "Work Order", value: (r: any) => r.ZWORK_ORDER || "" },
          { header: "Vendor Code", value: (r: any) => r.ZVENDOR_CD || "" },
          { header: "Transporter", value: (r: any) => r.ZTRANSPORTER || "" },
          { header: "No. of LRs", value: (r: any) => r.ZNO_LRS || "" },
          { header: "LR Number", value: (r: any) => r.ZLR_NO || "" },
          { header: "Loading Point", value: (r: any) => r.ZLOAD_PT || "" },
          { header: "Unloading Point", value: (r: any) => r.ZUNLOAD_PT || "" },
          { header: "No Of Invoices", value: (r: any) => r.ZNO_INVOICES || "" },
        ],
        exportSource,
      );
    }

    Swal.fire("Success", `Excel file downloaded: ${fileName}`, "success");
  };

  const downloadPdf = () => {
    let exportSource: any[] = [];
    let fileName = "";
    let reportTitle = "";

    if (fStatus === "Completed") {
      exportSource = orderInfoData;
      fileName = searchSap === "with" ? "Gate_In_Out_Completed_SAP.pdf" : "Gate_In_Out_Completed_NonSAP.pdf";
      reportTitle = "Gate-In-Out Records (Completed)";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;
      fileName = searchSap === "with" ? "Dispatch_Pending_SAP.pdf" : "Dispatch_Pending_NonSAP.pdf";
      reportTitle = "Dispatch Records (Pending)";
    } else {
      Swal.fire("Warning", "Please select valid status before download", "warning");
      return;
    }

    if (!exportSource || exportSource.length === 0) {
      Swal.fire("Warning", "No data available to download", "warning");
      return;
    }

    const doc = new jsPDF("landscape", "mm", [800, 297]);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    let headers: any[] = [];
    let data: any[] = [];

    if (fStatus === "Completed") {
      const combinedData: any[] = [];
      exportSource.forEach((record) => {
        const header = record.HEADER || {};
        const items = Array.isArray(record.ITEMS) ? record.ITEMS : [];
        if (items.length > 0) {
          items.forEach((item: any) => combinedData.push({ ...header, ...item }));
        } else {
          combinedData.push(header);
        }
      });

      headers = [[
        "SI.No", "Ref No", "Ref Item", "Invoice No", "Plant", "EWB App", "EWB Date", "EWB No", "EWB Exp", "Ins Scope", "Km", "Work Order", "LR No", "Trans", "Create Dt", "User", "User CH",
        "Line Item", "Sl No", "Req Dt", "Rep Dt", "Disp Dt", "Truck Type", "Trans Type", "Veh No", "No Veh", "Driver No", "Driver", "Cust Email", "Sales Email", "GPS Loc", "TAT Type", "TAT Days", "ETA",
      ]];

      data = combinedData.map((record, index) => ([
        index + 1, record.REFERENCE_NUMBER || "", record.REFERENCE_LINE_ITEM || "", record.ZINV_NO || "", record.ZPLANT || "", record.EWAY_BILL_APPLICABLE || "",
        record.EWAY_BILL_DATE ? new Date(record.EWAY_BILL_DATE).toLocaleDateString("en-GB") : "", record.EWAY_BILL_NUMBER || "",
        record.EWAY_BILL_EXPIRE_DATE ? new Date(record.EWAY_BILL_EXPIRE_DATE).toLocaleDateString("en-GB") : "", record.INSURANCE_SCOPE || "",
        record.KILLOMETERS || "", record.ZWORK_ORDER || "", record.ZLRNO || "", record.ZTRANSPORTER || "",
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "", record.ZUSER || "", record.ZUSER_CH || "",

        record.INVOICE_LINE_ITEM || "", record.SL_NO || "",
        record.REQUIRED_DATE_AND_TIME ? new Date(record.REQUIRED_DATE_AND_TIME).toLocaleString("en-GB") : "",
        record.REPORTED_DATE_AND_TIME ? new Date(record.REPORTED_DATE_AND_TIME).toLocaleString("en-GB") : "",
        record.PHYSICAL_DISPATCH_DATE_TIME ? new Date(record.PHYSICAL_DISPATCH_DATE_TIME).toLocaleString("en-GB") : "",
        record.TRUCK_TYPE || "", record.TYPE_OF_TRANSPORTER || "", record.VEHICLE_NUMBER || "", record.NO_OF_VEHICLES || "",
        record.DRIVER_NUMBER || "", record.DRIVER_NAME || "",
        Array.isArray(record.CUSTOMER_EMAIL_DETAILS) ? record.CUSTOMER_EMAIL_DETAILS.map((e: any) => e.CUSTOMER_EMAIL_ID).join(", ") : "",
        Array.isArray(record.SALESPERSON_EMAIL_DETAILS) ? record.SALESPERSON_EMAIL_DETAILS.map((e: any) => e.SALESPERSON_EMAIL_ID).join(", ") : "",
        record.GPS_LIVE_LOCATION || "", record.TAT_TYPE || "", record.TAT_DAYS || "",
        record.ETA ? new Date(record.ETA).toLocaleDateString("en-GB") : "",
      ]));
    } else {
      headers = [[
        "SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type",
        "No. of Trucks", "Work Order", "Vendor Code", "Transporter", "No. of LRs",
        "LR Number", "Loading Point", "Unloading Point", "No Of Invoices",
      ]];

      data = exportSource.map((record, index) => ([
        index + 1, record.ZREFNO || "", record.ZLINE_NO || "",
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        record.ZWERKS || "", record.ZDIVISION || "", record.ZVEH_TYPE || "", record.ZNO_TRUCKS || "",
        record.ZWORK_ORDER || "", record.ZVENDOR_CD || "", record.ZTRANSPORTER || "", record.ZNO_LRS || "",
        record.ZLR_NO || "", record.ZLOAD_PT || "", record.ZUNLOAD_PT || "", record.ZNO_INVOICES || "",
      ]));
    }

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      styles: { fontSize: 6, cellPadding: 1.5, overflow: "ellipsize", cellWidth: "wrap" },
      headStyles: { fillColor: [52, 152, 219], fontStyle: "bold", fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      theme: "grid",
    });

    doc.save(fileName);
    Swal.fire("Success", `PDF file downloaded: ${fileName}`, "success");
  };


  return (
    <div className="flex flex-col min-h-full">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "create" | "search")}
        className="w-full"
      >
        {/* Page Header */}
        <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  Gate In and Out
                </h1>
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
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">

          {/* ── Create Tab ── */}
          <TabsContent value="create" className="mt-0 space-y-2">

            {/* Direction + SAP Toggle + Pending/Completed counts */}
            <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio label="Outward" checked={direction === "outward"} onSelect={() => setDirection("outward")} />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block " />
                    <SapToggle
                      value={sap} onChange={setSap}
                    />
                  </>
                )}
                <div className="ml-auto flex items-center gap-1.5">
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

            {/* Gate In/Out Create Body */}
            {direction && sap && <GateInOutCreate key={`${sap}`} mode={sap} />}

          </TabsContent>

          {/* ── Filter & Download Tab ── */}
          <TabsContent value="search" className="mt-5 space-y-5">
            <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
              <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-accent" />
                  <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                    Filter Options
                  </h3>
                </div>
                <SearchSapToggle
                  value={searchSap}
                  onChange={(v) => {
                    setSearchSap(v);
                    setFromDate(undefined);
                    setToDate(undefined);
                    setFPlant("");
                    setFDivision("");
                    setFTransporter("");
                    setFVehicleType("");
                    setFStatus("");
                    setApplied(false);
                  }}
                />
              </div>

              {!searchSap && (
                <div className="p-6 text-center text-[12px] text-muted-foreground">
                  Select <span className="font-semibold">With SAP</span> or{" "}
                  <span className="font-semibold">Without SAP</span> to view filters.
                </div>
              )}

              {searchSap && (
                <>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <DateField label="From Date" value={fromDate} onChange={setFromDate} />
                    <DateField label="To Date" value={toDate} onChange={setToDate} />
                    <SelectField
                      label="Plant"
                      value={fPlant}
                      onChange={setFPlant}
                      options={fetchedPlants.length > 0 ? fetchedPlants : PLANTS}
                      placeholder="Select Plant"
                    />
                    <SelectField
                      label="Division"
                      value={fDivision}
                      onChange={setFDivision}
                      options={fetchedDivisions.length > 0 ? fetchedDivisions : DIVISIONS}
                      placeholder="Select Division"
                    />
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
                      options={[...STATUS_OPTIONS]}
                      placeholder="Select Status"
                    />
                  </div>

                  <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPdf} disabled={!applied || isFilterLoading}>
                      <FileText className="size-3.5" /> Download PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadExcel} disabled={!applied || isFilterLoading}>
                      <FileDown className="size-3.5 text-emerald-600" /> Download Excel
                    </Button>
                    <Button size="sm" onClick={onApply} className="gap-1.5" disabled={isFilterLoading}>
                      <Filter className="size-3.5" /> Apply Filter
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
            ) : fStatus === "Completed" ? (
              <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                      Gate-In-Out Results — Completed
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {orderInfoData.length} row{orderInfoData.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-8 max-h-[600px] overflow-y-auto">
                  {orderInfoData.length === 0 ? (
                    <div className="text-center py-10 text-[12px] text-muted-foreground">
                      No records found.
                    </div>
                  ) : (
                    (() => {
                      const allHeaders = orderInfoData.map(r => r.HEADER).filter(Boolean);
                      const allItems = orderInfoData.flatMap(r => r.ITEMS || []);

                      return (
                        <div className="space-y-8">
                          {/* ================= HEADERS TABLE ================= */}
                          <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                            <div className="px-4 py-3 border-b border-hairline bg-surface-2/60">
                              <h3 className="font-semibold text-[13px]">Header Records</h3>
                            </div>
                            <div className="overflow-x-auto max-h-[350px]">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground font-semibold uppercase tracking-[0.12em] text-[10px]">
                                  <tr>
                                    <th className="px-3 py-2.5 whitespace-nowrap">SI.No</th>
                                    {["Reference No", "Ref Line Item", "Invoice No", "Plant", "EWB App", "EWB Date", "EWB No", "EWB Exp", "Ins Scope", "Km", "Work Order", "LR No", "Transporter", "Created Date", "User", "User CH"].map((h) => (
                                      <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-hairline/70">
                                  {allHeaders.length === 0 ? (
                                    <tr>
                                      <td colSpan={17} className="px-3 py-10 text-center text-muted-foreground">
                                        No Header Records Found
                                      </td>
                                    </tr>
                                  ) : (
                                    allHeaders.map((header: any, index: number) => (
                                      <tr key={index} className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                                        <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono">{header.REFERENCE_NUMBER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.REFERENCE_LINE_ITEM || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono">{header.ZINV_NO || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.ZPLANT || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.EWAY_BILL_APPLICABLE || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.EWAY_BILL_DATE ? new Date(header.EWAY_BILL_DATE).toLocaleDateString("en-GB") : "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.EWAY_BILL_NUMBER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.EWAY_BILL_EXPIRE_DATE ? new Date(header.EWAY_BILL_EXPIRE_DATE).toLocaleDateString("en-GB") : "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.INSURANCE_SCOPE || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">{header.KILLOMETERS || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.ZWORK_ORDER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono">{header.ZLRNO || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.ZTRANSPORTER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {header.ZCREATED_DT ? new Date(header.ZCREATED_DT).toLocaleDateString("en-GB") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.ZUSER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{header.ZUSER_CH || "-"}</td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* ================= LINE ITEMS TABLE ================= */}
                          <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                            <div className="px-4 py-3 border-b border-hairline bg-surface-2/60">
                              <h3 className="font-semibold text-[13px]">Line Items</h3>
                            </div>
                            <div className="overflow-x-auto max-h-[350px]">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead className="sticky top-0 z-30 bg-gradient-primary text-primary-foreground font-semibold uppercase tracking-[0.12em] text-[10px]">
                                  <tr>
                                    <th className="px-3 py-2.5 whitespace-nowrap">SI.No</th>
                                    {["Invoice No", "Line Item", "Ref No", "Ref Item", "Sl No", "Req Date", "Reported Date", "Dispatch Date", "Truck Type", "Trans Type", "Vehicle No", "No Veh", "Driver No", "Driver", "Cust Emails", "Sales Emails", "GPS Loc", "TAT Type", "TAT Days", "ETA"].map((h) => (
                                      <th key={h} className="px-3 py-2.5 whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="bg-surface divide-y divide-hairline/70">
                                  {allItems.length === 0 ? (
                                    <tr>
                                      <td colSpan={21} className="px-3 py-10 text-center text-muted-foreground">
                                        No Line Items Found.
                                      </td>
                                    </tr>
                                  ) : (
                                    allItems.map((item: any, index: number) => (
                                      <tr key={index} className={index % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                                        <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_NO || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.INVOICE_LINE_ITEM || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono">{item.REFERENCE_NUMBER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.REFERENCE_LINE_ITEM || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.SL_NO || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {item.REQUIRED_DATE_AND_TIME ? new Date(item.REQUIRED_DATE_AND_TIME).toLocaleString("en-GB") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {item.REPORTED_DATE_AND_TIME ? new Date(item.REPORTED_DATE_AND_TIME).toLocaleString("en-GB") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {item.PHYSICAL_DISPATCH_DATE_TIME ? new Date(item.PHYSICAL_DISPATCH_DATE_TIME).toLocaleString("en-GB") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.TRUCK_TYPE || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.TYPE_OF_TRANSPORTER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap font-mono">{item.VEHICLE_NUMBER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.NO_OF_VEHICLES || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.DRIVER_NUMBER || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.DRIVER_NAME || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {Array.isArray(item.CUSTOMER_EMAIL_DETAILS) ? item.CUSTOMER_EMAIL_DETAILS.map((e: any) => e.CUSTOMER_EMAIL_ID).join(", ") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {Array.isArray(item.SALESPERSON_EMAIL_DETAILS) ? item.SALESPERSON_EMAIL_DETAILS.map((e: any) => e.SALESPERSON_EMAIL_ID).join(", ") : "-"}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.GPS_LIVE_LOCATION || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">{item.TAT_TYPE || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.TAT_DAYS || "-"}</td>
                                        <td className="px-3 py-2 whitespace-nowrap">
                                          {item.ETA ? new Date(item.ETA).toLocaleDateString("en-GB") : "-"}
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            ) : fStatus === "Pending" ? (
              <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                      Dispatch Results — Pending
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {dispatchData.length} row{dispatchData.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                        {["SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type",
                          "No. of Trucks", "Work Order", "Vendor Code", "Transporter", "No. of LRs",
                          "LR Number", "Loading Point", "Unloading Point", "No Of Invoices"].map((h) => (
                            <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/70">
                      {dispatchData.length === 0 ? (
                        <tr>
                          <td colSpan={16} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        dispatchData.map((item, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                            <td className="px-3 py-2 whitespace-nowrap">{i + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : ""}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZWERKS}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZNO_TRUCKS}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZVENDOR_CD}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZNO_LRS}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZLR_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZLOAD_PT}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZUNLOAD_PT}</td>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">{item.ZNO_INVOICES}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-surface border border-dashed border-hairline rounded-2xl p-10 text-center">
                <p className="text-[12px] text-muted-foreground">
                  Select <span className="font-semibold">Pending</span> or <span className="font-semibold">Completed</span> status and click Apply Filter to see results.
                </p>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Local Components ──

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
            "relative z-10 px-3 py-1 rounded-full font-medium transition-colors cursor-pointer",
            value === m ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "with" ? "With SAP" : "Without SAP"}
        </button>
      ))}
    </div>
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
            "relative z-10 px-3 py-1 rounded-full font-medium transition-colors cursor-pointer",
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
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
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

const GATE_COLUMNS = [
  "Required Date and Time",
  "Reported Date and Time",
  "Physical Dispatch Date and Time",
  "Truck Type",
  "Type of Transporter",
  "Vehicle Number",
  "No of Vehicles",
  "Driver Number",
  "Driver Name",
  "Customer Email Id",
  "Salesperson Email Id",
  "GPS Live Location",
  "TAT Type",
  "TAT Days",
  "ETA",
];

// ── Reference table + Invoice/Search bar — UI copied from OrderInfoSapCreate ──
// NOTE: presentational only. No API/service calls are wired up here.

type GateRefRow = {
  MAPID: string;
  REF_NO: string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: string;
  selected: boolean;
};

const EMPTY_GATE_REF_ROW = (): GateRefRow => ({
  MAPID: "",
  REF_NO: "",
  WORK_ORDER_NO: "",
  LR_NO: "",
  TRANSPORTER: "",
  LINE_NO: "",
  selected: false,
});

const GATE_SEARCH_OPTIONS = [
  { key: "ref_no", label: "Reference No" },
  { key: "inv_no", label: "Invoice No" },
  { key: "transporter", label: "Transporter" },
  { key: "vehicle_no", label: "Vehicle No" },
  { key: "lr_no", label: "LR No" },
];

const GATE_INPUT_NORMAL =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

const GATE_INPUT_READONLY =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";

const GATE_LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

/* Multi-select dropdown for the Invoice Number field — mirrors F4MultiSelect
   in ShipmentDetailsSapCreate. `value` stays a comma-joined string so existing
   handlers (invoiceNumber state) keep working unchanged. */
function GateF4MultiSelect({
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

type GateRow = {
  selected: boolean;
  mapId: string;
  invoiceNumber: string;
  invoiceLineNo: string;
  requiredDateTime: string;
  reportedDateTime: string;
  physicalDispatchDateTime: string;
  truckType: string;
  typeOfTransporter: string;
  vehicleNumber: string;
  noOfVehicles: string;
  driverNumber: string;
  driverName: string;
  customerEmailId: string;
  salespersonEmailId: string;
  gpsLiveLocation: string;
  tatType: string;
  tatDays: string;
  eta: string;
};

const EMPTY_GATE_ROW = (): GateRow => ({
  selected: false,
  mapId: "",
  invoiceNumber: "",
  invoiceLineNo: "",
  requiredDateTime: "",
  reportedDateTime: "",
  physicalDispatchDateTime: "",
  truckType: "",
  typeOfTransporter: "",
  vehicleNumber: "",
  noOfVehicles: "",
  driverNumber: "",
  driverName: "",
  customerEmailId: "",
  salespersonEmailId: "",
  gpsLiveLocation: "",
  tatType: "",
  tatDays: "",
  eta: "",
});

function getMinPhysicalDispatch(row: GateRow): string {
  const dates: string[] = [];
  if (row.requiredDateTime) dates.push(row.requiredDateTime);
  if (row.reportedDateTime) dates.push(row.reportedDateTime);
  if (dates.length === 0) return "";
  return dates.reduce((a, b) => (a > b ? a : b));
}

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
  } catch { return ""; }
}

type VehicleTypeOption = { code: string; label: string };

function GateInOutCreate({ mode }: { mode: SapMode }) {
  const navigate = useNavigate();
  const isSap = mode === "with";

  const [ewayDate, setEwayDate] = useState("");
  const [ewayExpireDate, setEwayExpireDate] = useState("");
  const [ewayNumber, setEwayNumber] = useState("");
  const [ewayApplicable, setEwayApplicable] = useState("");
  const [insuranceScope, setInsuranceScope] = useState("");
  const [kilometres, setKilometres] = useState("");
  const [dcReferenceNumber, setDcReferenceNumber] = useState(""); // DC reference (non-SAP)
  const [showDetails, setShowDetails] = useState(false); // Header/Item tables + Save actions gated behind GET
  const [zplant, setZplant] = useState(""); // ZPLANT — carried from FetchGateInOutInvoiceData for the Save payload

  const [searchResultHeader, setSearchResultHeader] = useState<any>({});
  const [searchResultItems, setSearchResultItems] = useState<any[]>([]);
  const [isGlobalSearch, setIsGlobalSearch] = useState(false);

  // ── Truck Type F4 (gettypeofvehicle) ──
  const [gateRows, setGateRows] = useState<GateRow[]>([EMPTY_GATE_ROW()]);
  const [truckTypeList, setTruckTypeList] = useState<VehicleTypeOption[]>([]);
  const [loadingTruckTypes, setLoadingTruckTypes] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingTruckTypes(true);
      try {
        const res: any = await service.gettypeofvehicle();

        // Actual response shape: a flat array of { ZTRUC_TYPE: "..." }
        const raw: any[] = Array.isArray(res) ? res : [];

        const options: VehicleTypeOption[] = raw
          .map((v: any) => ({
            code: v.ZTRUC_TYPE || "",
            label: v.ZTRUC_TYPE || "",
          }))
          .filter((o) => o.code);

        setTruckTypeList(options);
      } catch (err) {
        console.error("gettypeofvehicle failed:", err);
      } finally {
        setLoadingTruckTypes(false);
      }
    })();
  }, []);

  // ── Reference table state ──
  const [refTableData, setRefTableData] = useState<GateRefRow[]>([EMPTY_GATE_REF_ROW()]);
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceF4List, setInvoiceF4List] = useState<string[]>([]);

  // ── Invoice lookup + search bar state ──
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  // Recompute invoice options from the reference rows the user has checked
  // (mirrors ShipmentDetailsSapCreate.updateInvoiceListForSelectedItems).
  useEffect(() => {
    const selectedMapIds = refTableData
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
  }, [refTableData, fullReferenceData]);

  const handleRefRowChange = (index: number, field: keyof GateRefRow, value: string) =>
    setRefTableData((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  // ── Row blur → global reference fetch (mirrors ShipmentDetailsSapCreate.onFieldBlur) ──
  const fetchGlobalReferences = async (index: number, fieldKey: "REF_NO" | "WORK_ORDER_NO" | "LR_NO" | "TRANSPORTER") => {
    if (index !== 0) return;
    const row = refTableData[0];
    const value = ((row as any)[fieldKey] || "").trim();
    if (!value) return;

    const payload = {
      global_scr: "GATE IN OUT",
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

      setInvoiceF4List([]);
      setFullReferenceData([]);

      if (res?.STATUS === "FALSE") {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
          text: "No matching reference details were found.",
          timer: 1500,
          showConfirmButton: false,
        });
        setRefTableData([EMPTY_GATE_REF_ROW()]);
        return;
      }
      if (Array.isArray(res) && res.length > 0) {
        setFullReferenceData(res);
        setRefTableData(
          res.map((item: any) => ({
            MAPID: item.MAPID || "",
            REF_NO: item.REF_NO || "",
            WORK_ORDER_NO: item.WORK_ORDER_NO || "",
            LR_NO: item.LR_NO || "",
            TRANSPORTER: item.TRANSPORTER || "",
            LINE_NO: item.LINE_NO || "",
            selected: false,
          }))
        );
      } else {
        setRefTableData([EMPTY_GATE_REF_ROW()]);
      }
    } catch (err) {
      console.error("GlobalReference fetch error:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch reference details." });
    }
  };

  const toggleRefRowSelect = (index: number) =>
    setRefTableData((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));

  const removeRefRow = (index: number) => {
    if (refTableData.length === 1) return;
    setRefTableData((prev) => prev.filter((_, i) => i !== index));
  };

  // ── GET → FetchGateInOutInvoiceData (With SAP) ──
  const handleGet = async () => {
    setIsGlobalSearch(false);
    const refRow = refTableData[0];
    const payload = {
      SAP_INV: [
        {
          INV_NO: invoiceNumber,
          REFNO: refRow?.REF_NO || "",
          REF_LINE: refRow?.LINE_NO || "",
        },
      ],
    };

    try {
      const res: any = await service.FetchGateInOutInvoiceData(payload);

      if (!Array.isArray(res) || res.length === 0 || !res[0]?.HEADER) {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
          text: "No invoice details were found for the selected Invoice Number.",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      const { HEADER, ITEMS } = res[0];

      setEwayApplicable(HEADER.EWAY_BILL_APPLICABLE || "");
      setEwayDate(HEADER.EWAY_BILL_DATE || "");
      setEwayNumber(HEADER.EWAY_BILL_NUMBER || "");
      setEwayExpireDate(HEADER.EWAY_BILL_EXPIRE_DATE || "");
      setInsuranceScope(HEADER.INSURANCE_SCOPE || "");
      setKilometres(HEADER.KILLOMETERS != null ? String(HEADER.KILLOMETERS) : "");
      setZplant(HEADER.ZPLANT || "");

      const mappedRows: GateRow[] =
        Array.isArray(ITEMS) && ITEMS.length > 0
          ? ITEMS.map((item: any) => ({
            selected: false,
            mapId: "",
            invoiceNumber: item.ZINV_NO || "",
            invoiceLineNo: item.INVOICE_LINE_ITEM != null ? String(item.INVOICE_LINE_ITEM) : "",
            requiredDateTime: item.REQUIRED_DATE_AND_TIME || "",
            reportedDateTime: item.REPORTED_DATE_AND_TIME || "",
            physicalDispatchDateTime: item.PHYSICAL_DISPATCH_DATE_TIME || "",
            truckType: item.TRUCK_TYPE || "",
            typeOfTransporter: item.TYPE_OF_TRANSPORTER || "",
            vehicleNumber: item.VEHICLE_NUMBER || "",
            noOfVehicles: item.NO_OF_VEHICLES != null ? String(item.NO_OF_VEHICLES) : "",
            driverNumber: item.DRIVER_NUMBER || "",
            driverName: item.DRIVER_NAME || "",
            customerEmailId: Array.isArray(item.CUSTOMER_EMAIL_DETAILS) ? item.CUSTOMER_EMAIL_DETAILS.join(",") : "",
            salespersonEmailId: Array.isArray(item.SALESPERSON_EMAIL_DETAILS) ? item.SALESPERSON_EMAIL_DETAILS.join(",") : "",
            gpsLiveLocation: item.GPS_LIVE_LOCATION || "",
            tatType: item.TAT_TYPE || "",
            tatDays: item.TAT_DAYS != null ? String(item.TAT_DAYS) : "",
            eta: item.ETA || "",
          }))
          : [EMPTY_GATE_ROW()];

      setGateRows(mappedRows);
      setShowDetails(true);

      Swal.fire({
        icon: "success",
        title: "Invoice Details Loaded",
        text: "Invoice details have been fetched successfully.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("FetchGateInOutInvoiceData failed:", err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch invoice details." });
    }
  };

  const handleSearch = async () => {
    if (!isSap) {
      Swal.fire("Info", "Without SAP search is not implemented.", "info");
      return;
    }
    if (!searchValue.trim()) {
      Swal.fire("Warning", "Please enter a search value.", "warning");
      return;
    }

    const payload = {
      GLOBAL: "GATE IN OUT",
      ZUSER: getLoggedInUser(),
      DATA: {
        REF_NO: searchType === "ref_no" ? searchValue : "",
        INV_NO: searchType === "inv_no" ? searchValue : "",
        TRANSPORTER: searchType === "transporter" ? searchValue : "",
        LR_NO: searchType === "lr_no" ? searchValue : "",
        VEHICLE_NO: searchType === "vehicle_no" ? searchValue : "",
      },
    };

    try {
      const res: any = await service.SearchGateInOutWithSap(payload);
      const data = Array.isArray(res) && res.length > 0 ? res[0] : res;

      if (data?.HEADER) {
        const headerData = Array.isArray(data.HEADER) ? data.HEADER[0] : data.HEADER;

        if (headerData) {
          setSearchResultHeader({ ...headerData, isEdit: false });
          setSearchResultItems(
            Array.isArray(data.ITEMS)
              ? data.ITEMS.map((item: any) => ({ ...item, isEdit: false }))
              : []
          );
          setIsGlobalSearch(true);
          setShowDetails(false);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "Search results fetched successfully.",
            timer: 1500,
            showConfirmButton: false,
          });
          return;
        }
      }

      Swal.fire("No Results", "No matching records found.", "info");
      setIsGlobalSearch(false);
    } catch (err) {
      console.error("Search API error:", err);
      Swal.fire("Error", "Search failed.", "error");
    }
  };

  const addGateRow = () => setGateRows((prev) => [...prev, EMPTY_GATE_ROW()]);
  const removeGateRow = (index: number) => setGateRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  // ── Row select + Map ID (mirrors ShipmentDetailsSapCreate's toggleAllSelection / onRowCheckboxChange / onChangeMapId) ──
  const [isAllGateSelected, setIsAllGateSelected] = useState(false);

  const toggleAllGateSelection = (checked: boolean) => {
    setIsAllGateSelected(checked);
    setGateRows((prev) => prev.map((r) => ({ ...r, selected: checked })));
  };

  const onGateRowCheckboxChange = (index: number, checked: boolean) => {
    setGateRows((prev) => {
      const next = prev.map((r, i) => (i === index ? { ...r, selected: checked } : r));
      setIsAllGateSelected(next.length > 0 && next.every((r) => r.selected));
      return next;
    });
  };

  const onChangeGateMapId = (index: number, mapId: string) => {
    updateGateRow(index, "mapId", mapId);
  };

  const updateGateRow = (index: number, field: keyof GateRow, value: string) => {
    setGateRows((prev) =>
      prev.map((r, i) => {
        if (i !== index) return r;
        const next: GateRow = { ...r, [field]: value };
        if ((field === "requiredDateTime" || field === "reportedDateTime") && next.physicalDispatchDateTime) {
          const min = getMinPhysicalDispatch(next);
          if (min && next.physicalDispatchDateTime < min) {
            next.physicalDispatchDateTime = "";
          }
        }
        return next;
      })
    );
  };

  // ── TAT Type -> TAT Days / ETA (mirrors SegmentInfoSapCreate.onTatTypeChange) ──
  const onGateTatTypeChange = async (index: number, tatType: string) => {
    updateGateRow(index, "tatType", tatType);

    const row = gateRows[index];
    const invNo = row?.invoiceNumber || invoiceNumber || "";
    const payload: any = { BRANCH: "", BRANCH_ZONE: "", TAT_TYPE: tatType };
    if (isSap) payload.VBELN = invNo;
    else payload.INV_NO = invNo;

    try {
      const res: any = isSap ? await service.fetchTAT(payload) : await service.fetchNonSapTAT(payload);
      if (res?.TAT || res?.ETA) {
        updateGateRow(index, "tatDays", res.TAT || "");
        updateGateRow(index, "eta", res.ETA || "");
      } else {
        Swal.fire("No TAT data found for selected type", "", "info");
      }
    } catch {
      Swal.fire("Error fetching TAT details", "", "error");
    }
  };

  // ── Save → SaveGateInOutWithSap (With SAP) ──
  const handleSave = async (action: string) => {
    if (!isSap) {
      // TODO: integrate Without SAP save API when ready
      return;
    }

    const refRow = refTableData[0];
    const payload = {
      CREATE: "X",
      CHANGE: "",
      DELETE: "",
      DATA: [
        {
          HEADER: {
            ZINV_NO: invoiceNumber,
            REFERENCE_NUMBER: refRow?.REF_NO || "",
            REFERENCE_LINE_ITEM: refRow?.LINE_NO || "",
            ZPLANT: zplant,
            EWAY_BILL_APPLICABLE: ewayApplicable,
            EWAY_BILL_DATE: ewayDate,
            EWAY_BILL_NUMBER: ewayNumber,
            EWAY_BILL_EXPIRE_DATE: ewayExpireDate,
            INSURANCE_SCOPE: insuranceScope,
            KILLOMETERS: kilometres,
            ZWORK_ORDER: refRow?.WORK_ORDER_NO || "",
            ZLRNO: refRow?.LR_NO || "",
            ZTRANSPORTER: refRow?.TRANSPORTER || "",
            ZCREATED_DT: "",
            ZUSER: getLoggedInUser(),
            ZUSER_CH: "",
          },
          ITEMS: gateRows.map((row, i) => ({
            ZINV_NO: invoiceNumber,
            INVOICE_LINE_ITEM: row.invoiceLineNo || "",
            REFERENCE_NUMBER: refRow?.REF_NO || "",
            REFERENCE_LINE_ITEM: refRow?.LINE_NO || "",
            SL_NO: i + 1,
            REQUIRED_DATE_AND_TIME: row.requiredDateTime,
            REPORTED_DATE_AND_TIME: row.reportedDateTime,
            PHYSICAL_DISPATCH_DATE_TIME: row.physicalDispatchDateTime,
            TRUCK_TYPE: row.truckType,
            TYPE_OF_TRANSPORTER: row.typeOfTransporter,
            VEHICLE_NUMBER: row.vehicleNumber,
            NO_OF_VEHICLES: row.noOfVehicles,
            DRIVER_NUMBER: row.driverNumber,
            DRIVER_NAME: row.driverName,
            CUSTOMER_EMAIL_DETAILS: row.customerEmailId
              ? row.customerEmailId.split(",").filter(Boolean).map((email) => ({ CUSTOMER_EMAIL_ID: email }))
              : [],
            SALESPERSON_EMAIL_DETAILS: row.salespersonEmailId
              ? row.salespersonEmailId.split(",").filter(Boolean).map((email) => ({ SALESPERSON_EMAIL_ID: email }))
              : [],
            GPS_LIVE_LOCATION: row.gpsLiveLocation,
            TAT_TYPE: row.tatType,
            TAT_DAYS: row.tatDays,
            ETA: row.eta,
          })),
        },
      ],
    };

    setLoadingSave(true);
    try {
      const res: any = await service.SaveGateInOutWithSap(payload);

      if (res?.NUMBER === "200") {
        Swal.fire({
          title: "Success",
          text: res.MSG || "Record(s) Saved Successfully",
          icon: "success",
          timer: 3000,
          confirmButtonText: "Ok",
        });

        // Reset screen state
        setEwayDate("");
        setEwayExpireDate("");
        setEwayNumber("");
        setEwayApplicable("");
        setInsuranceScope("");
        setKilometres("");
        setDcReferenceNumber("");
        setShowDetails(false);
        setZplant("");
        setGateRows([EMPTY_GATE_ROW()]);
        setRefTableData([EMPTY_GATE_REF_ROW()]);
        setFullReferenceData([]);
        setInvoiceF4List([]);
        setInvoiceNumber("");
        setSearchType("");
        setSearchValue("");
        setIsAllGateSelected(false);
        
        if (action === "next") {
          navigate({ to: "/invoice-load-details" });
        } else if (action === "previous") {
          navigate({ to: "/order-info" });
        }
      } else {
        Swal.fire({
          title: "Error",
          text: res?.MSG || "Failed to save data",
          icon: "error",
          confirmButtonText: "Ok",
        });
      }
    } catch (err) {
      console.error("SaveGateInOutWithSap failed:", err);
      Swal.fire({ title: "Error", text: "Internal Server Error. Please try again later.", icon: "error" });
    } finally {
      setLoadingSave(false);
    }
  };
  const handleUpdateRecord = async (target: "header" | "item", itemIndex?: number) => {
    try {
      const { isEdit: hEdit, _backup: hBackup, ...cleanHeader } = searchResultHeader;
      
      let cleanItems: any[] = [];
      if (target === "item" && itemIndex !== undefined) {
        const { isEdit, _backup, ...cleanItem } = searchResultItems[itemIndex];
        // Parse email strings to arrays as required by payload
        const formattedItem = {
          ...cleanItem,
          CUSTOMER_EMAIL_DETAILS: cleanItem.CUSTOMER_EMAIL_DETAILS
            ? (typeof cleanItem.CUSTOMER_EMAIL_DETAILS === "string"
                ? cleanItem.CUSTOMER_EMAIL_DETAILS.split(",").filter(Boolean).map((e: string) => ({ CUSTOMER_EMAIL_ID: e.trim() }))
                : cleanItem.CUSTOMER_EMAIL_DETAILS)
            : [],
          SALESPERSON_EMAIL_DETAILS: cleanItem.SALESPERSON_EMAIL_DETAILS
            ? (typeof cleanItem.SALESPERSON_EMAIL_DETAILS === "string"
                ? cleanItem.SALESPERSON_EMAIL_DETAILS.split(",").filter(Boolean).map((e: string) => ({ SALESPERSON_EMAIL_ID: e.trim() }))
                : cleanItem.SALESPERSON_EMAIL_DETAILS)
            : []
        };
        cleanItems = [formattedItem];
      } else {
        cleanItems = [];
      }

      const payload = {
        CREATE: "",
        CHANGE: "X",
        DELETE: "",
        DATA: [
          {
            HEADER: { ...cleanHeader, ZUSER_CH: getLoggedInUser() },
            ITEMS: cleanItems,
          },
        ],
      };

      const res: any = await service.ChangeGateInOutWithSap(payload);

      if (res?.NUMBER === "200") {
        Swal.fire({
          title: "Success",
          text: res.MSG || "Record(s) Updated Successfully",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        
        if (target === "header") {
          setSearchResultHeader((prev: any) => ({ ...prev, isEdit: false }));
        } else if (target === "item" && itemIndex !== undefined) {
          const next = [...searchResultItems];
          next[itemIndex] = { ...next[itemIndex], isEdit: false };
          setSearchResultItems(next);
        }
      } else {
        Swal.fire("Error", res?.MSG || "Failed to update record.", "error");
      }
    } catch (err) {
      console.error("Change API failed:", err);
      Swal.fire("Error", "API Error occurred while updating.", "error");
    }
  };

  return (
    <div className="space-y-3">
      {/* ── Reference table (same UI/CSS as Shipment Details) ── */}
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
            {refTableData.map((row, i) => (
              <tr key={i}>
                <td className="px-3 py-0.5 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRefRowSelect(i)}
                    className="size-4 accent-sky-600"
                  />
                </td>
                <td className="px-3 py-0.5 text-center">{i + 1}</td>
                {(["REF_NO", "WORK_ORDER_NO", "LR_NO", "TRANSPORTER"] as const).map((field) => (
                  <td key={field} className="px-3 py-0.5">
                    <input
                      value={(row as any)[field] || ""}
                      readOnly={i !== 0}
                      onChange={(e) => handleRefRowChange(i, field, e.target.value)}
                      onBlur={() => fetchGlobalReferences(i, field)}
                      className={GATE_INPUT_NORMAL + " text-center"}
                    />
                  </td>
                ))}
                <td className="px-3 py-0.5 text-center">
                  {refTableData.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRefRow(i)}
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

      {/* ── Invoice lookup + search bar (same UI as Order Info) ── */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {isSap && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={GATE_LABEL}>Invoice Number</label>
                <GateF4MultiSelect
                  options={invoiceF4List}
                  value={invoiceNumber}
                  onChange={setInvoiceNumber}
                  placeholder="Select Invoice"
                  className={GATE_INPUT_NORMAL}
                />
              </div>
              <button
                onClick={handleGet}
                disabled={!invoiceNumber.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm flex items-center gap-1.5"
              >
                GET
              </button>
            </>
          )}

          <div className="min-w-[160px]">
            <label className={GATE_LABEL}>Search By</label>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
            >
              <option value="">Select</option>
              {GATE_SEARCH_OPTIONS.map((o) => (
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
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="Enter Reference / Invoice / Transporter / Vehicle Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button
              onClick={handleSearch}
              className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta disabled:opacity-50"
            >
              <Search className="size-4" />
            </button>
          </div>
        </div>

        {isSap && (
          <p className="mt-2 text-[12px] text-muted-foreground px-1">
            Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
          </p>
        )}
      </div>

      {/* ── Global Search Results (With SAP) ── */}
      {isSap && isGlobalSearch && Object.keys(searchResultHeader).length > 0 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-h-[500px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant">
            <div className="px-3 py-2 border-b border-hairline bg-surface-2/60 font-semibold text-[13px] flex items-center justify-between">
              Header Details
            </div>
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                  {[
                    "Ref No", "Line No", "Invoice No", "Plant", "E-way Bill App",
                    "E-Way Date", "E-Way No", "Expire Date", "Insurance Scope",
                    "Kilometres", "Work Order", "LR No", "Transporter", "Created Date", "Action"
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                <tr className="bg-surface hover:bg-muted/50">
                  {[
                    { field: "REFERENCE_NUMBER", type: "text", readonly: true },
                    { field: "REFERENCE_LINE_ITEM", type: "text", readonly: true },
                    { field: "ZINV_NO", type: "text", readonly: true },
                    { field: "ZPLANT", type: "text" },
                    { field: "EWAY_BILL_APPLICABLE", type: "select", options: ["Yes", "No"] },
                    { field: "EWAY_BILL_DATE", type: "date" },
                    { field: "EWAY_BILL_NUMBER", type: "text" },
                    { field: "EWAY_BILL_EXPIRE_DATE", type: "date" },
                    { field: "INSURANCE_SCOPE", type: "select", options: ["Buyer", "Supplier"] },
                    { field: "KILLOMETERS", type: "number" },
                    { field: "ZWORK_ORDER", type: "text", readonly: true },
                    { field: "ZLRNO", type: "text", readonly: true },
                    { field: "ZTRANSPORTER", type: "text" },
                    { field: "ZCREATED_DT", type: "date" },
                  ].map(({ field, type, options, readonly }: any) => (
                    <td key={field} className="px-3 py-2 whitespace-nowrap">
                      {searchResultHeader.isEdit && !readonly ? (
                        type === "select" ? (
                          <select
                            className="h-7 w-full rounded border border-input bg-white dark:bg-surface px-1 text-[11px] outline-none"
                            value={searchResultHeader[field] || ""}
                            onChange={(e) => setSearchResultHeader((prev: any) => ({ ...prev, [field]: e.target.value }))}
                          >
                            <option value="">Select</option>
                            {options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={type}
                            className="h-7 w-full min-w-[80px] rounded border border-input bg-white dark:bg-surface px-2 text-[11px] outline-none"
                            value={searchResultHeader[field] || ""}
                            onChange={(e) => setSearchResultHeader((prev: any) => ({ ...prev, [field]: e.target.value }))}
                          />
                        )
                      ) : (
                        <span>
                          {type === "date" && searchResultHeader[field]
                            ? new Date(searchResultHeader[field]).toLocaleDateString("en-GB")
                            : searchResultHeader[field] || "-"}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 text-center">
                    {!searchResultHeader.isEdit ? (
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => setSearchResultHeader((prev: any) => ({ ...prev, _backup: { ...prev }, isEdit: true }))}
                          className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            Swal.fire({
                              title: "Are you sure?",
                              text: "Do you want to delete this record?",
                              icon: "warning",
                              showCancelButton: true,
                            }).then(async (result) => {
                              if (result.isConfirmed) {
                                try {
                                  const { isEdit: hEdit, _backup: hBackup, ...cleanHeader } = searchResultHeader;
                                  
                                  const payload = {
                                    CREATE: "",
                                    CHANGE: "",
                                    DELETE: "X",
                                    DATA: [
                                      {
                                        HEADER: { ...cleanHeader, ZUSER: getLoggedInUser() },
                                        ITEMS: []
                                      }
                                    ]
                                  };

                                  const res: any = await service.DeleteGateInOutWithSap(payload);
                                  if (res?.MSG) {
                                    Swal.fire("Success", res.MSG, "success");
                                    setSearchResultHeader({});
                                    setSearchResultItems([]);
                                  } else {
                                    Swal.fire("Error", "Failed to delete the record.", "error");
                                  }
                                } catch (err) {
                                  console.error("Delete API failed:", err);
                                  Swal.fire("Error", "API Error occurred while deleting.", "error");
                                }
                              }
                            });
                          }}
                          className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 justify-center">
                        <button
                          onClick={() => handleUpdateRecord("header")}
                          className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check className="size-4" strokeWidth={3} />
                        </button>
                        <button
                          onClick={() => setSearchResultHeader((prev: any) => ({ ...prev._backup, isEdit: false }))}
                          className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          <X className="size-4" strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {searchResultItems.length > 0 && (
            <div className="max-h-[500px] overflow-auto rounded-xl border border-hairline bg-surface shadow-elegant">
              <div className="px-3 py-2 border-b border-hairline bg-surface-2/60 font-semibold text-[13px]">
                Line Items
              </div>
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                    {[
                      "Inv Line No", "SL No", "Invoice No", "Reference No", "Required Date Time", "Reported Date Time",
                      "Physical Dispatch Date Time", "Truck Type", "Transporter Type",
                      "Vehicle No", "No of Vehicles", "Driver Name", "Driver Number",
                      "Customer Email", "Salesperson Email",
                      "TAT Type", "TAT Days", "ETA", "Action"
                    ].map((h) => (
                      <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/70">
                  {searchResultItems.map((item, index) => (
                    <tr key={index} className="bg-surface hover:bg-muted/50">
                      {[
                        { field: "INVOICE_LINE_ITEM", type: "text", readonly: true },
                        { field: "SL_NO", type: "text", readonly: true },
                        { field: "ZINV_NO", type: "text", readonly: true },
                        { field: "REFERENCE_NUMBER", type: "text", readonly: true },
                        { field: "REQUIRED_DATE_AND_TIME", type: "datetime-local" },
                        { field: "REPORTED_DATE_AND_TIME", type: "datetime-local" },
                        { field: "PHYSICAL_DISPATCH_DATE_TIME", type: "datetime-local" },
                        { field: "TRUCK_TYPE", type: "select", options: truckTypeList.map(t => t.code) },
                        { field: "TYPE_OF_TRANSPORTER", type: "text" },
                        { field: "VEHICLE_NUMBER", type: "text" },
                        { field: "NO_OF_VEHICLES", type: "number" },
                        { field: "DRIVER_NAME", type: "text" },
                        { field: "DRIVER_NUMBER", type: "text" },
                        { field: "CUSTOMER_EMAIL_DETAILS", type: "text" },
                        { field: "SALESPERSON_EMAIL_DETAILS", type: "text" },
                        { field: "TAT_TYPE", type: "select", options: ["Direct Truck TAT(Vizag)", "Direct Truck TAT(Hyd)", "Revised TAT", "Safe Express TAT", "Delivery TAT", "GATI TAT"] },
                        { field: "TAT_DAYS", type: "number" },
                        { field: "ETA", type: "date" },
                      ].map(({ field, type, options, readonly }) => {
                        const getVal = (val: any) => {
                          if (Array.isArray(val)) {
                            return val.map(v => v?.CUSTOMER_EMAIL_ID || v?.SALESPERSON_EMAIL_ID || v).join(",");
                          }
                          return val || "";
                        };
                        const displayVal = getVal(item[field]);

                        return (
                          <td key={field} className="px-3 py-2 whitespace-nowrap">
                            {item.isEdit && !readonly ? (
                              type === "select" ? (
                                <select
                                  className="h-7 w-full min-w-[120px] rounded border border-input bg-white dark:bg-surface px-1 text-[11px] outline-none"
                                  value={displayVal}
                                  onChange={(e) => {
                                    const next = [...searchResultItems];
                                    next[index] = { ...next[index], [field]: e.target.value };
                                    setSearchResultItems(next);
                                  }}
                                >
                                  <option value="">Select</option>
                                  {options?.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              ) : (
                                <input
                                  type={type}
                                  className="h-7 w-full min-w-[120px] rounded border border-input bg-white dark:bg-surface px-2 text-[11px] outline-none"
                                  value={displayVal}
                                  onChange={(e) => {
                                    const next = [...searchResultItems];
                                    const rawVal = e.target.value;
                                    let newVal: any = rawVal;
                                    if (field === "CUSTOMER_EMAIL_DETAILS") {
                                      newVal = rawVal ? rawVal.split(",").map(v => ({ CUSTOMER_EMAIL_ID: v.trim() })) : [];
                                    } else if (field === "SALESPERSON_EMAIL_DETAILS") {
                                      newVal = rawVal ? rawVal.split(",").map(v => ({ SALESPERSON_EMAIL_ID: v.trim() })) : [];
                                    }
                                    next[index] = { ...next[index], [field]: newVal };
                                    setSearchResultItems(next);
                                  }}
                                />
                              )
                            ) : (
                              <span>
                                {type.includes("date") && displayVal
                                  ? new Date(displayVal).toLocaleString("en-GB")
                                  : displayVal || "-"}
                              </span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-center">
                        {!item.isEdit ? (
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => {
                                const next = [...searchResultItems];
                                next[index] = { ...next[index], _backup: { ...next[index] }, isEdit: true };
                                setSearchResultItems(next);
                              }}
                              className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                Swal.fire({
                                  title: "Are you sure?",
                                  text: "Do you want to delete this record?",
                                  icon: "warning",
                                  showCancelButton: true,
                                }).then(async (result) => {
                                  if (result.isConfirmed) {
                                    try {
                                      const { isEdit: hEdit, _backup: hBackup, ...cleanHeader } = searchResultHeader;
                                      const { isEdit: iEdit, _backup: iBackup, ...cleanItem } = item;

                                      const payload = {
                                        CREATE: "",
                                        CHANGE: "",
                                        DELETE: "X",
                                        DATA: [
                                          {
                                            HEADER: { ...cleanHeader, ZUSER: getLoggedInUser() },
                                            ITEMS: [cleanItem]
                                          }
                                        ]
                                      };

                                      const res = await service.DeleteGateInOutWithSap(payload);
                                      if (res?.MSG) {
                                        Swal.fire("Success", res.MSG, "success");
                                        setSearchResultItems(prev => prev.filter((_, i) => i !== index));
                                      } else {
                                        Swal.fire("Error", "Failed to delete the record.", "error");
                                      }
                                    } catch (err) {
                                      console.error("Delete API failed:", err);
                                      Swal.fire("Error", "API Error occurred while deleting.", "error");
                                    }
                                  }
                                });
                              }}
                              className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => handleUpdateRecord("item", index)}
                              className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                            >
                              <Check className="size-4" strokeWidth={3} />
                            </button>
                            <button
                              onClick={() => {
                                const next = [...searchResultItems];
                                next[index] = { ...next[index]._backup, isEdit: false };
                                setSearchResultItems(next);
                              }}
                              className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                            >
                              <X className="size-4" strokeWidth={3} />
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
        </div>
      )}

      {/* ── E-Way Bill / Insurance / Distance — Header table ── */}
      {/* Visibility gating (hidden until GET is clicked) applies to With SAP only */}
      {(!isSap || showDetails) && (
        <>
          <h3 className="px-1 text-[13px] font-bold text-foreground tracking-tight">Header</h3>
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                    <th className="px-3 py-0.5 text-center">Reference Number</th>
                    <th className="px-3 py-0.5 text-center">Reference Line No</th>
                    <th className="px-3 py-0.5 text-center">Invoice Number</th>
                    {!isSap && <th className="px-3 py-0.5 text-center">DC Reference Number</th>}
                    <th className="px-3 py-0.5 text-center">E-way Bill Applicable</th>
                    {ewayApplicable === "Yes" && (
                      <>
                        <th className="px-3 py-0.5 text-center">E-Way Bill Date</th>
                        <th className="px-3 py-0.5 text-center">E-Way Bill Number</th>
                        <th className="px-3 py-0.5 text-center">E-Way Bill Expire Date</th>
                      </>
                    )}
                    <th className="px-3 py-0.5 text-center">Insurance Scope</th>
                    <th className="px-3 py-0.5 text-center">Kilometres</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="px-3 py-0.5">
                      <input value={refTableData[0]?.REF_NO || ""} readOnly className={GATE_INPUT_READONLY + " text-center"} />
                    </td>
                    <td className="px-3 py-0.5">
                      <input value={refTableData[0]?.LINE_NO || ""} readOnly className={GATE_INPUT_READONLY + " text-center"} />
                    </td>
                    <td className="px-3 py-0.5">
                      <input value={invoiceNumber || ""} readOnly className={GATE_INPUT_READONLY + " text-center"} />
                    </td>
                    {!isSap && (
                      <td className="px-3 py-0.5">
                        <GateF4MultiSelect
                          options={invoiceF4List}
                          value={dcReferenceNumber}
                          onChange={setDcReferenceNumber}
                          placeholder="Select DC Reference"
                          className={GATE_INPUT_NORMAL}
                        />
                      </td>
                    )}
                    <td className="px-3 py-0.5">
                      <select
                        value={ewayApplicable}
                        onChange={(e) => setEwayApplicable(e.target.value)}
                        className="h-7 w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">Select</option>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </td>
                    {ewayApplicable === "Yes" && (
                      <>
                        <td className="px-3 py-0.5">
                          <Input type="date" value={ewayDate} onChange={(e) => setEwayDate(e.target.value)} />
                        </td>
                        <td className="px-3 py-0.5">
                          <Input
                            type="text"
                            placeholder="Enter E-Way Bill Number"
                            value={ewayNumber}
                            onChange={(e) => setEwayNumber(e.target.value)}
                          />
                        </td>
                        <td className="px-3 py-0.5">
                          <Input type="date" value={ewayExpireDate} onChange={(e) => setEwayExpireDate(e.target.value)} />
                        </td>
                      </>
                    )}
                    <td className="px-3 py-0.5">
                      <select
                        value={insuranceScope}
                        onChange={(e) => setInsuranceScope(e.target.value)}
                        className="h-7 w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                      >
                        <option value="">Select Insurance Scope</option>
                        <option value="Buyer">Buyer</option>
                        <option value="Supplier">Supplier</option>
                      </select>
                    </td>
                    <td className="px-3 py-0.5">
                      <Input
                        type="number"
                        placeholder="0"
                        value={kilometres}
                        onChange={(e) => setKilometres(e.target.value)}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <h3 className="px-1 text-[13px] font-bold text-foreground tracking-tight">Item</h3>
          <div className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-soft">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-8 text-center">
                      <input
                        type="checkbox"
                        checked={isAllGateSelected}
                        onChange={(e) => toggleAllGateSelection(e.target.checked)}
                        className="size-3.5 accent-white"
                      />
                    </TableHead>
                    <TableHead className="w-10">Sl.No</TableHead>
                    <TableHead className="whitespace-nowrap">Invoice Number</TableHead>
                    <TableHead className="whitespace-nowrap">Invoice Line No</TableHead>
                    {GATE_COLUMNS.map((c) => (
                      <TableHead key={c} className="whitespace-nowrap">
                        {c}
                      </TableHead>
                    ))}
                    <TableHead className="whitespace-nowrap text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gateRows.map((row, i) => {
                    const minPd = getMinPhysicalDispatch(row);
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={(e) => onGateRowCheckboxChange(i, e.target.checked)}
                            className="size-3.5 accent-sky-600"
                          />
                        </TableCell>
                        <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="p-1">
                          <select
                            value={row.invoiceNumber}
                            onChange={(e) => updateGateRow(i, "invoiceNumber", e.target.value)}
                            className="h-7 min-w-[140px] w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                          >
                            <option value="">Select</option>
                            {invoiceF4List.map((inv) => (
                              <option key={inv} value={inv}>
                                {inv}
                              </option>
                            ))}
                          </select>
                        </TableCell>
                        <TableCell className="p-1">
                          <Input
                            type="text"
                            className="h-7 min-w-[110px]"
                            value={row.invoiceLineNo}
                            onChange={(e) => updateGateRow(i, "invoiceLineNo", e.target.value)}
                          />
                        </TableCell>
                        {GATE_COLUMNS.map((c) => {
                          if (c === "Truck Type") {
                            return (
                              <TableCell key={c} className="p-1">
                                <select
                                  value={row.truckType}
                                  onChange={(e) => updateGateRow(i, "truckType", e.target.value)}
                                  disabled={loadingTruckTypes}
                                  className="h-7 min-w-[140px] w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
                                >
                                  <option value="">{loadingTruckTypes ? "Loading..." : "Select Truck Type"}</option>
                                  {truckTypeList.map((v) => (
                                    <option key={v.code} value={v.code}>
                                      {v.code}
                                    </option>
                                  ))}
                                </select>
                              </TableCell>
                            );
                          }
                          if (c === "TAT Type") {
                            return (
                              <TableCell key={c} className="p-1">
                                <select
                                  value={row.tatType}
                                  onChange={(e) => onGateTatTypeChange(i, e.target.value)}
                                  className="h-7 min-w-[140px] w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                                >
                                  <option value="">Select TAT Type</option>
                                  <option value="Direct Truck TAT(Vizag)">Direct Truck TAT(Vizag)</option>
                                  <option value="Direct Truck TAT(Hyd)">Direct Truck TAT(Hyd)</option>
                                  <option value="Revised TAT">Revised TAT</option>
                                  <option value="Safe Express TAT">Safe Express TAT</option>
                                  <option value="Delivery TAT">Delivery TAT</option>
                                  <option value="GATI TAT">GATI TAT</option>
                                </select>
                              </TableCell>
                            );
                          }
                          if (c === "ETA") {
                            return (
                              <TableCell key={c} className="p-1">
                                <Input
                                  type="date"
                                  className="h-7 min-w-[140px]"
                                  value={row.eta}
                                  onChange={(e) => updateGateRow(i, "eta", e.target.value)}
                                />
                              </TableCell>
                            );
                          }
                          const fieldMap: Record<string, Exclude<keyof GateRow, "selected" | "mapId">> = {
                            "Required Date and Time": "requiredDateTime",
                            "Reported Date and Time": "reportedDateTime",
                            "Physical Dispatch Date and Time": "physicalDispatchDateTime",
                            "Type of Transporter": "typeOfTransporter",
                            "Vehicle Number": "vehicleNumber",
                            "No of Vehicles": "noOfVehicles",
                            "Driver Number": "driverNumber",
                            "Driver Name": "driverName",
                            "Customer Email Id": "customerEmailId",
                            "Salesperson Email Id": "salespersonEmailId",
                            "GPS Live Location": "gpsLiveLocation",
                            "TAT Days": "tatDays",
                          };
                          const field = fieldMap[c];
                          if (!field) return <TableCell key={c} className="p-1" />;
                          const isPd = c === "Physical Dispatch Date and Time";
                          const isDateTime = c.toLowerCase().includes("date");
                          const val = row[field] || "";
                          return (
                            <TableCell key={c} className="p-1">
                              <Input
                                type={isDateTime ? "datetime-local" : "text"}
                                className={cn(
                                  "h-7 min-w-[140px]",
                                  isPd && minPd && val && val < minPd
                                    ? "border-red-400 focus:border-red-400 focus:ring-red-400/30"
                                    : ""
                                )}
                                value={val}
                                min={isPd ? minPd : undefined}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (isPd && minPd && v && v < minPd) return;
                                  updateGateRow(i, field, v);
                                }}
                              />
                            </TableCell>
                          );
                        })}
                        <TableCell className="p-1 text-center">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={addGateRow}
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition"
                              aria-label="Add row"
                            >
                              <Plus className="size-3.5" />
                            </button>
                            <button
                              onClick={() => removeGateRow(i)}
                              disabled={gateRows.length === 1}
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                              aria-label="Delete row"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

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