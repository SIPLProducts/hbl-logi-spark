import { useState, useEffect, type ReactNode } from "react";
import { format } from "date-fns";
import { createFileRoute } from "@tanstack/react-router";
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
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pendingCount] = useState(0);
  const [completedCount] = useState(0);
  // Filter results — mirrors Angular's orderInfoData / dispatchData
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

  const onApply = async () => {
    if (!fromDate || !toDate) {
      Swal.fire("Warning", "Please select From Date and To Date", "warning");
      return;
    }
    setApplied(true);
    setOrderInfoData([]);
    setDispatchData([]);
  };

  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      exportSource = orderInfoData;
      fileName = searchSap === "with" ? "Order_Info_Completed_SAP.xls" : "Order_Info_Completed_NonSAP.xls";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;
      fileName = searchSap === "with" ? "Dispatch_Pending_SAP.xls" : "Dispatch_Pending_NonSAP.xls";
    } else {
      Swal.fire("Warning", "Please select valid status before download", "warning");
      return;
    }

    if (!exportSource || exportSource.length === 0) {
      Swal.fire("Warning", "No data available to download", "warning");
      return;
    }

    if (fStatus === "Completed") {
      exportRowsToXls(
        fileName,
        [
          { header: "Reference No", value: (r: any) => r.ZREFNO || "" },
          { header: "Invoice No", value: (r: any) => r.ZINV_NO || "" },
          { header: "Line No", value: (r: any) => r.ZLINE_NO || "" },
          { header: "ODN No", value: (r: any) => r.ZODN_NO || "" },
          { header: "Invoice Date", value: (r: any) => (r.ZINV_DATE ? new Date(r.ZINV_DATE).toLocaleDateString("en-GB") : "") },
          { header: "Basic Value", value: (r: any) => r.ZBASIC_VALUE || "" },
          { header: "Invoice Value (GST)", value: (r: any) => r.ZINV_VALUE_GST || "" },
          { header: "Physical Dispatch", value: (r: any) => r.ZPHY_DISPATCH || "" },
          { header: "Fiscal Year", value: (r: any) => r.ZFYEAR || "" },
          { header: "Fiscal Quarter", value: (r: any) => r.ZFIS_QUARTER || "" },
          { header: "Fiscal Month", value: (r: any) => r.ZFIS_MONTH || "" },
          { header: "Plant", value: (r: any) => r.ZPLANT || "" },
          { header: "Transaction Type", value: (r: any) => r.ZTRX_TYPE || "" },
          { header: "Billing Text", value: (r: any) => r.ZBILL_TRX_TEXT || "" },
          { header: "Division", value: (r: any) => r.ZDIVISION || "" },
          { header: "Sub Division", value: (r: any) => r.ZSUB_DIVISION || "" },
          { header: "SO Ref No", value: (r: any) => r.ZSO_NO || "" },
          { header: "Customer Name", value: (r: any) => r.ZCUST_NAME || "" },
          { header: "Customer Group", value: (r: any) => r.ZCUST_GRP || "" },
          { header: "Consignee Name", value: (r: any) => r.ZCONSIGN_NAME || "" },
          { header: "Destination Location", value: (r: any) => r.ZDES_LOC || "" },
          { header: "State", value: (r: any) => r.ZSTATE || "" },
          { header: "Zone", value: (r: any) => r.ZZONE || "" },
          { header: "Work Order", value: (r: any) => r.ZWORK_ORDER || "" },
          { header: "LR No", value: (r: any) => r.ZLRNO || "" },
          { header: "Transporter", value: (r: any) => r.ZTRANSPORTER || "" },
          { header: "Vehicle Type", value: (r: any) => r.ZVEH_TYPE || "" },
          { header: "Created Date", value: (r: any) => r.ZCREATED_DT || "" },
        ],
        exportSource,
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
      fileName = searchSap === "with" ? "Order_Info_Completed_SAP.pdf" : "Order_Info_Completed_NonSAP.pdf";
      reportTitle = "Order Info Records (Completed)";
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

    const doc = new jsPDF("landscape", "mm", [420, 297]);

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    let headers: any[] = [];
    let data: any[] = [];

    if (fStatus === "Completed") {
      headers = [[
        "SI.No", "REFNO", "Invoice No", "Line No", "ODN No", "Invoice Date", "Basic Value",
        "Invoice Value (GST)", "Physical Dispatch", "Fiscal Year", "System Date", "Fiscal Quarter",
        "Fiscal Month", "Plant", "Transaction Type", "Bill Text", "Division", "Sub Division",
        "SO Ref No", "Customer Name", "Customer Group", "Consignee Name", "Destination Location",
        "State", "Zone", "Work Order", "LR No", "Transporter", "Created date", "Vehicle Type",
      ]];

      data = exportSource.map((record, index) => ([
        index + 1, record.ZREFNO || "", record.ZINV_NO || "", record.ZLINE_NO || "", record.ZODN_NO || "",
        record.ZINV_DATE ? new Date(record.ZINV_DATE).toLocaleDateString("en-GB") : "",
        record.ZBASIC_VALUE || "", record.ZINV_VALUE_GST || "", record.ZPHY_DISPATCH || "",
        record.ZFYEAR || "", record.ZSYS_DATE ? new Date(record.ZSYS_DATE).toLocaleDateString("en-GB") : "",
        record.ZFIS_QUARTER || "", record.ZFIS_MONTH || "", record.ZPLANT || "", record.ZTRX_TYPE || "",
        record.ZBILL_TRX_TEXT || "", record.ZDIVISION || "", record.ZSUB_DIVISION || "", record.ZSO_NO || "",
        record.ZCUST_NAME || "", record.ZCUST_GRP || "", record.ZCONSIGN_NAME || "", record.ZDES_LOC || "",
        record.ZSTATE || "", record.ZZONE || "", record.ZWORK_ORDER || "", record.ZLRNO || "",
        record.ZTRANSPORTER || "", record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        record.ZVEH_TYPE || "",
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
      styles: { fontSize: 6, cellPadding: 1.5 },
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
                      options={PLANTS}   // ← was: PLANTS
                      placeholder="Select Plant"
                    />
                    <SelectField
                      label="Division"
                      value={fDivision}
                      onChange={setFDivision}
                      options={DIVISIONS}  // ← was: DIVISIONS
                      placeholder="Select Division"
                    />
                    <SelectField
                      label="Transporter"
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={TRANSPORTERS}  // ← was: TRANSPORTERS
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
                      Order Info Results — Completed
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {orderInfoData.length} row{orderInfoData.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                        {["SI.No", "REFNO", "Invoice No", "Line No", "ODN No", "Invoice Date", "Basic Value",
                          "Invoice Value (GST)", "Physical Dispatch", "Fiscal Year", "System Date", "Fiscal Quarter",
                          "Fiscal Month", "Plant", "Transaction Type", "Bill Text", "Division", "Sub Division",
                          "SO Ref No", "Customer Name", "Customer Group", "Consignee Name", "Destination Location",
                          "State", "Zone", "Work Order", "LR No", "Transporter", "Created Date", "Vehicle Type"].map((h) => (
                            <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/70">
                      {orderInfoData.length === 0 ? (
                        <tr>
                          <td colSpan={30} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        orderInfoData.map((item, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                            <td className="px-3 py-2 whitespace-nowrap">{i + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZINV_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZODN_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {item.ZINV_DATE ? new Date(item.ZINV_DATE).toLocaleDateString("en-GB") : ""}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                              {item.ZBASIC_VALUE ? Number(item.ZBASIC_VALUE).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                              {item.ZINV_VALUE_GST ? Number(item.ZINV_VALUE_GST).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ""}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZPHY_DISPATCH}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZFYEAR}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              {item.ZSYS_DATE ? new Date(item.ZSYS_DATE).toLocaleDateString("en-GB") : ""}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZFIS_QUARTER}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZFIS_MONTH}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZPLANT}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZTRX_TYPE}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZBILL_TRX_TEXT}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSUB_DIVISION}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSO_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZCUST_NAME}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZCUST_GRP}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZCONSIGN_NAME}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZDES_LOC}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSTATE}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZZONE}</td>
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
  REF_NO: string;
  WORK_ORDER_NO: string;
  LR_NO: string;
  TRANSPORTER: string;
  LINE_NO: string;
  selected: boolean;
};

const EMPTY_GATE_REF_ROW = (): GateRefRow => ({
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
  { key: "odn_no", label: "ODN No" },
  { key: "so_no", label: "SO No" },
  { key: "lr_no", label: "LR No" },
];

const GATE_INPUT_NORMAL =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

const GATE_INPUT_READONLY =
  "h-7 w-full rounded-md bg-muted/60 border border-input px-2 text-[12px] text-foreground font-medium outline-none cursor-not-allowed";

const GATE_LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

type GateRow = {
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

type VehicleTypeOption = { code: string; label: string };

function GateInOutCreate({ mode }: { mode: SapMode }) {
  const isSap = mode === "with";

  const [ewayDate, setEwayDate] = useState("");
  const [ewayExpireDate, setEwayExpireDate] = useState("");
  const [ewayNumber, setEwayNumber] = useState("");
  const [ewayApplicable, setEwayApplicable] = useState("");

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

  // ── Invoice lookup + search bar state ──
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const handleRefRowChange = (index: number, field: keyof GateRefRow, value: string) =>
    setRefTableData((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));

  const toggleRefRowSelect = (index: number) =>
    setRefTableData((prev) => prev.map((r, i) => (i === index ? { ...r, selected: !r.selected } : r)));

  const removeRefRow = (index: number) => {
    if (refTableData.length === 1) return;
    setRefTableData((prev) => prev.filter((_, i) => i !== index));
  };

  // Placeholder handlers — no API wired up per requirement, UI only.
  const handleGet = () => {
    // TODO: integrate API when ready
  };

  const handleSearch = () => {
    // TODO: integrate API when ready
  };

  const addGateRow = () => setGateRows((prev) => [...prev, EMPTY_GATE_ROW()]);
  const removeGateRow = (index: number) => setGateRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
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

  function handleSave(arg0: string): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="space-y-3">
      {/* ── Reference table (same UI as Order Info) ── */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              {["Select", "Sl.No", "Reference Number", "Work Order Number", "LR Number", "Transporter", "Action"].map((h) => (
                <th key={h} className="px-3 py-1 text-center">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {refTableData.map((row, i) => (
              <tr key={i} className="border-t border-hairline/60">
                <td className="px-3 py-1 text-center">
                  <input
                    type="checkbox"
                    checked={row.selected}
                    onChange={() => toggleRefRowSelect(i)}
                    className="size-4 accent-sky-600"
                  />
                </td>
                <td className="px-3 py-1 text-center">{i + 1}</td>
                {(["REF_NO", "WORK_ORDER_NO", "LR_NO", "TRANSPORTER"] as const).map((field) => (
                  <td key={field} className="px-3 py-1">
                    <input
                      value={(row as any)[field] || ""}
                      readOnly={i !== 0}
                      onChange={(e) => handleRefRowChange(i, field, e.target.value)}
                      className={i !== 0 ? GATE_INPUT_READONLY : GATE_INPUT_NORMAL}
                    />
                  </td>
                ))}
                <td className="px-3 py-1 text-center">
                  {refTableData.length > 1 && (
                    <button
                      onClick={() => removeRefRow(i)}
                      className="size-6 grid place-items-center rounded-md text-red-500 hover:bg-red-50"
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
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleGet();
                  }}
                  className={GATE_INPUT_NORMAL}
                  placeholder="Enter invoice number"
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
              placeholder="Enter Reference / Invoice / ODN / SO Number"
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

      {/* ── E-Way Bill fields ── */}
      <div className="bg-surface border border-hairline rounded-lg p-3 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label>E-way Bill Applicable</Label>
            <select
              value={ewayApplicable}
              onChange={(e) => setEwayApplicable(e.target.value)}
              className="h-7 w-full rounded-md border border-input bg-white dark:bg-surface px-2 text-[12px] text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            >
              <option value="">Select</option>
              <option value="No">No</option>
              <option value="Yes">Yes</option>
            </select>
          </div>
          {ewayApplicable === "Yes" && (
            <>
              <div className="space-y-1">
                <Label>E-Way Bill Date</Label>
                <Input type="date" value={ewayDate} onChange={(e) => setEwayDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>E-Way Bill Number</Label>
                <Input
                  type="text"
                  placeholder="Enter E-Way Bill Number"
                  value={ewayNumber}
                  onChange={(e) => setEwayNumber(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>E-Way Bill Expire Date</Label>
                <Input type="date" value={ewayExpireDate} onChange={(e) => setEwayExpireDate(e.target.value)} />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-surface border border-hairline rounded-lg overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">Sl.No</TableHead>
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
                    <TableCell className="text-center text-muted-foreground">{i + 1}</TableCell>
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
                              onChange={(e) => updateGateRow(i, "tatType", e.target.value)}
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
                      const fieldMap: Record<string, keyof GateRow> = {
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
    </div>
  );
}