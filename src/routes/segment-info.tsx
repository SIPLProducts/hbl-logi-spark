import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Filter,
  FileText,
  FileDown,
  CalendarIcon,
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
import { SegmentInfoSapCreate } from "@/components/segment-info-sap-create";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { exportRowsToXls } from "@/lib/export-xls.js";
// @ts-ignore
import service from "../services/generalservice_service.js";

export const Route = createFileRoute("/segment-info")({
  component: SegmentInfoPage,
});

type SapMode = "with" | "without";
type Direction = "outward" | "inward";

const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;

function getLoggedInUser(): string {
  try {
    const raw = localStorage.getItem("currentUser") || "{}";
    const u = JSON.parse(raw) as Record<string, unknown>;
    return String(u?.USER ?? "");
  } catch {
    return "";
  }
}

// Segment Info's Angular source reads Plant/Division straight from the
// login payload (userData.PLANTS / userData.DIV), unlike Transporter which
// comes from the F4 vendor-code API — mirrored here rather than unified.
function getLoginPlantsDivisions(): { plants: any[]; divisions: any[] } {
  try {
    const raw = localStorage.getItem("currentUser") || "{}";
    const u = JSON.parse(raw) as Record<string, any>;
    return { plants: u?.PLANTS || [], divisions: u?.DIV || [] };
  } catch {
    return { plants: [], divisions: [] };
  }
}

// ─────────────── Page ───────────────
function SegmentInfoPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

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
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  const [plantList, setPlantList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const [transporterList, setTransporterList] = useState<any[]>([]);

  // Filter results — mirrors Angular's SegmentData / dispatchData
  const [segmentData, setSegmentData] = useState<any[]>([]);
  const [dispatchData, setDispatchData] = useState<any[]>([]);

  // Plant/Division from login payload, Transporter from F4 vendor-code API —
  // fetched once on mount, matching Angular's ngOnInit (not gated by mode toggles)
  useEffect(() => {
    const { plants, divisions } = getLoginPlantsDivisions();
    setPlantList(plants);
    setDivisionList(divisions);

    (async () => {
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) && res.length > 0 ? res[0] : {};
        setTransporterList(data.VEND_CODE || []);
      } catch (err) {
        console.error("Transporter fetch error:", err);
      }
    })();
  }, []);

  // Pending/Completed counts once Outward + SAP mode chosen
  useEffect(() => {
    if (!(direction === "outward" && sap)) return;
    (async () => {
      try {
        const res: any = await service.OutwardCountGlobalWithSap({
          INOUT: "OUTWARD",
          TRANS_TYPE: sap === "with" ? "WITHSAP" : "WITHOUTSAP",
          SCREEN: "SEGMENT INFO",
        });
        setPendingCount(res?.ZPEND_CNT || 0);
        setCompletedCount(res?.ZCONF_CNT || 0);
      } catch (err) {
        console.error("Error fetching counts:", err);
        setPendingCount(0);
        setCompletedCount(0);
      }
    })();
  }, [direction, sap]);

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setApplied(false);
    setSegmentData([]);
    setDispatchData([]);
  };

  const onApply = async () => {
    if (!fromDate || !toDate) {
      Swal.fire("Warning", "Please select From Date and To Date", "warning");
      return;
    }

    setApplied(false);
    setIsFilterLoading(true);

    const payload = {
      GLOBAL: "SEGMENT INFO",
      ZUSER: getLoggedInUser(),
      DATE_FROM: format(fromDate, "yyyy-MM-dd"),
      DATE_TO: format(toDate, "yyyy-MM-dd"),
      PLANT: fPlant || "",
      DIVISION: fDivision || "",
      TRANSPORTER: fTransporter || "",
      VEHICLE_TYPE: fVehicleType || "",
      STATUS: fStatus || "",
    };

    try {
      const res: any =
        searchSap === "with"
          ? await service.fetchOrderInfoFiltered(payload)
          : await service.fetchGlobalFilteredNonSap(payload);

      if (res?.STATUS === "FALSE") {
        setSegmentData([]);
        setDispatchData([]);
        Swal.fire({ icon: "info", title: "No Data Found", text: res.MSG || "No records available for selected filters" });
        return;
      }

      let records: any[] = [];
      if (Array.isArray(res)) records = res;
      else if (res?.HEADER) records = res.HEADER;
      else if (res?.DATA) records = res.DATA;

      setApplied(true);

      if (fStatus === "Completed") {
        setSegmentData(records);
        setDispatchData([]);
        Swal.fire("Success", `SegmentInfo records: ${records.length}`, "success");
      } else if (fStatus === "Pending") {
        setDispatchData(records);
        setSegmentData([]);
        Swal.fire("Success", `Dispatch records: ${records.length}`, "success");
      } else {
        setSegmentData([]);
        setDispatchData([]);
        Swal.fire("Info", "Please select valid status", "info");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch filtered data", "error");
    } finally {
      setIsFilterLoading(false);
    }
  };

  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      exportSource = segmentData;
      fileName = searchSap === "with" ? "SegmentData_Completed_SAP.xls" : "SegmentData_Completed_NonSAP.xls";
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
          { header: "Line No", value: (r: any) => r.ZLINE_NO || "" },
          { header: "REFNO", value: (r: any) => r.ZREFNO || "" },
          { header: "Invoice No", value: (r: any) => r.ZINV_NUM || "" },
          { header: "ODN Number", value: (r: any) => r.ZODN_NO || "" },
          { header: "SO Number", value: (r: any) => r.ZSO_NO || "" },
          { header: "Sales Person", value: (r: any) => r.ZSALE_PERSON || "" },
          { header: "Segment", value: (r: any) => r.ZSEGMENT || "" },
          { header: "Application Type", value: (r: any) => r.ZAPPTYP || "" },
          { header: "Customer Profile", value: (r: any) => r.ZCUST_PROFILE || "" },
          { header: "Branch", value: (r: any) => r.ZBRANCH || "" },
          { header: "Branch Zone", value: (r: any) => r.ZBRANCH_ZONE || "" },
          { header: "TAT Type", value: (r: any) => r.ZTAT_TYPE || "" },
          { header: "TAT Days", value: (r: any) => r.ZTAT || "" },
          { header: "ETA", value: (r: any) => r.ZETA || "" },
          { header: "Plant", value: (r: any) => r.ZPLANT || "" },
          { header: "Division", value: (r: any) => r.ZDIVISION || "" },
          { header: "Work Order", value: (r: any) => r.ZWORK_ORDER || "" },
          { header: "LR No", value: (r: any) => r.ZLRNO || "" },
          { header: "Transporter", value: (r: any) => r.ZTRANSPORTER || "" },
          { header: "Created Date", value: (r: any) => r.ZCREATED_DT || "" },
          { header: "Vehicle Type", value: (r: any) => r.ZVEH_TYPE || "" },
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
        ],
        exportSource,
      );
    }

    Swal.fire("Success", `Excel file downloaded: ${fileName}`, "success");
  };

  const downloadPDF = () => {
    let exportSource: any[] = [];
    let fileName = "";
    let reportTitle = "";

    if (fStatus === "Completed") {
      exportSource = segmentData;
      fileName = searchSap === "with" ? "SegmentData_Completed_SAP.pdf" : "SegmentData_Completed_NonSAP.pdf";
      reportTitle = "Segment Data Records (Completed)";
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
    doc.text(`Generated on: ${new Date().toLocaleDateString("en-GB")}`, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    let headers: any[] = [];
    let data: any[] = [];

    if (fStatus === "Completed") {
      headers = [[
        "SI.No", "Line No", "REFNO", "Invoice No", "ODN Number", "SO Number", "Sales Person", "Segment",
        "Application Type", "Customer Profile", "Branch", "Branch Zone", "TAT Type", "TAT Days", "ETA",
        "Plant", "Division", "Work Order", "LR No", "Transporter", "Created Date", "Vehicle Type",
      ]];

      data = exportSource.map((item, index) => ([
        index + 1, item.ZLINE_NO || "", item.ZREFNO || "", item.ZINV_NUM || "", item.ZODN_NO || "",
        item.ZSO_NO || "", item.ZSALE_PERSON || "", item.ZSEGMENT || "", item.ZAPPTYP || "",
        item.ZCUST_PROFILE || "", item.ZBRANCH || "", item.ZBRANCH_ZONE || "", item.ZTAT_TYPE || "",
        item.ZTAT || "", item.ZETA || "", item.ZPLANT || "", item.ZDIVISION || "", item.ZWORK_ORDER || "",
        item.ZLRNO || "", item.ZTRANSPORTER || "",
        item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        item.ZVEH_TYPE || "",
      ]));
    } else {
      headers = [[
        "SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type", "No. of Trucks",
        "Work Order", "Vendor Code", "Transporter", "No. of LRs", "LR Number", "Loading Point", "Unloading Point",
      ]];

      data = exportSource.map((item, index) => ([
        index + 1, item.ZREFNO || "", item.ZLINE_NO || "",
        item.ZCREATED_DT ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        item.ZWERKS || "", item.ZDIVISION || "", item.ZVEH_TYPE || "", item.ZNO_TRUCKS || "",
        item.ZWORK_ORDER || "", item.ZVENDOR_CD || "", item.ZTRANSPORTER || "", item.ZNO_LRS || "",
        item.ZLR_NO || "", item.ZLOAD_PT || "", item.ZUNLOAD_PT || "",
      ]));
    }

    autoTable(doc, {
      head: headers,
      body: data,
      startY: 25,
      theme: "grid",
      styles: { fontSize: 6, cellPadding: 1.5 },
      headStyles: { fillColor: [52, 152, 219], fontStyle: "bold", fontSize: 6 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(fileName);
    Swal.fire("Success", `PDF downloaded: ${fileName}`, "success");
  };

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
                  Segment Info
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

            {direction === "outward" && sap && <SegmentInfoSapCreate mode={sap} />}
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
                <SearchSapToggle
                  value={searchSap}
                  onChange={(v) => {
                    setSearchSap(v);
                    resetFilters();
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
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                    <DateField label="From Date" value={fromDate} onChange={setFromDate} />
                    <DateField label="To Date" value={toDate} onChange={setToDate} />
                    <SelectField
                      label="Plant"
                      value={fPlant}
                      onChange={setFPlant}
                      options={plantList.map((p: any) => ({ value: p.PLANT_DESC, label: p.PLANT_TEXT }))}
                      placeholder="Select Plant"
                    />
                    <SelectField
                      label="Division"
                      value={fDivision}
                      onChange={setFDivision}
                      options={divisionList.map((d: any) => ({ value: d.DIVISION, label: d.DIV_TEXT }))}
                      placeholder="Select Division"
                    />
                    <SelectField
                      label="Transporter"
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={transporterList.map((t: any) => ({ value: t.TRANSPORTER, label: t.TRANSPORTER }))}
                      placeholder="Select Transporter"
                    />
                    <SelectField
                      label="Vehicle Type"
                      value={fVehicleType}
                      onChange={setFVehicleType}
                      options={VEHICLE_TYPES.map((v) => ({ value: v, label: v }))}
                      placeholder="Select Vehicle Type"
                    />
                    <SelectField
                      label="Status"
                      value={fStatus}
                      onChange={setFStatus}
                      options={[...STATUS_OPTIONS].map((v) => ({ value: v, label: v }))}
                      placeholder="Select Status"
                    />
                  </div>

                  <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={resetFilters}>
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF} disabled={!applied || isFilterLoading}>
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
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No results yet</h3>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
                  Choose your filters above and click <span className="font-semibold">Apply Filter</span> to load records.
                </p>
              </div>
            ) : fStatus === "Completed" ? (
              <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                      Segment Info Results — Completed
                    </h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {segmentData.length} row{segmentData.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[560px]">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="sticky top-0 z-30">
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                        {["SI.No", "Line No", "REFNO", "Invoice No", "Odn Number", "SO Number", "Sales Person", "Segment",
                          "Application Type", "Customer Profile", "Branch", "Branch Zone", "TAT Type", "TAT Days", "ETA",
                          "Plant", "Division", "Work Order", "LR No", "Transporter", "Created date", "Vehicle Type"].map((h) => (
                            <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/70">
                      {segmentData.length === 0 ? (
                        <tr>
                          <td colSpan={22} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                            No records found.
                          </td>
                        </tr>
                      ) : (
                        segmentData.map((item, i) => (
                          <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                            <td className="px-3 py-2 whitespace-nowrap">{i + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZLINE_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                            <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZINV_NUM}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZODN_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSO_NO}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSALE_PERSON}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZSEGMENT}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZAPPTYP}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZCUST_PROFILE}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZBRANCH}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZBRANCH_ZONE}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZTAT_TYPE}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZTAT}</td>
                            <td className="px-3 py-2 whitespace-nowrap">{item.ZETA}</td>
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
                        {["SI.No", "Reference No", "Line No", "Date", "Plant", "Division", "Vehicle Type", "No. of Trucks",
                          "Work Order", "Vendor Code", "Transporter", "No. of LRs", "LR Number", "Loading Point", "Unloading Point"].map((h) => (
                            <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">{h}</th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/70">
                      {dispatchData.length === 0 ? (
                        <tr>
                          <td colSpan={15} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
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

// ─────────────── Helpers ───────────────
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
            className={cn("h-10 justify-start text-left font-normal", !value && "text-muted-foreground")}
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
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
