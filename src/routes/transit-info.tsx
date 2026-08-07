import { useState, useEffect, type ReactNode } from "react";
import { Search } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import Swal from "sweetalert2";
// @ts-ignore
import service from "@/services/generalservice_service";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Save,
  ChevronLeft,
  ChevronRight,
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
import { TransitInfoSapCreate } from "@/components/transit-info-sap-create";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const Route = createFileRoute("/transit-info")({
  component: TransitInfoPage,
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SapMode = "with" | "without";

const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;

type PlantData = { PLANT: string; PLANT_DESC: string };
type DivData = { DIVISION: string; DIV_TEXT: string };
type TransporterData = { code: string; name: string };

const PAGE_TITLE = "Transit Info";

function renderDirectionExtras(casesCount: number) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-indigo-300/60 bg-indigo-100 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
      <ClipboardList className="size-3" />
      No. of Shipments In Transit
      <span className="font-mono">{casesCount}</span>
    </span>
  );
}

function renderCreateBody({ sap, direction }: { sap: SapMode; direction: "outward" | "inward" }) {
  return direction === "outward" ? (
    <TransitInfoSapCreate mode={sap === "with" ? "with" : "without"} />
  ) : null;
}

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────

function TransitInfoPage() {
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
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transitInfoHeader, setTransitInfoHeader] = useState<any[]>([]);
  const [transitInfoItems, setTransitInfoItems] = useState<any[]>([]);
  const [dispatchData, setDispatchData] = useState<any[]>([]);



  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [casesCount, setCasesCount] = useState(0);

  const [plantList, setPlantList] = useState<PlantData[]>([]);
  const [divisionList, setDivisionList] = useState<DivData[]>([]);
  const [transporterOptions, setTransporterOptions] = useState<TransporterData[]>([]);
  const [transporterLoading, setTransporterLoading] = useState(false);

  function getLoggedInUser(): string {
    try {
      const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}";
      const u = JSON.parse(raw) as Record<string, unknown>;
      return String(u?.USER ?? u?.USERNAME ?? u?.USER_ID ?? "");
    } catch { return ""; }
  }

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");

    setDispatchData([]);
    setTransitInfoHeader([]);
    setTransitInfoItems([]);

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

    setDispatchData([]);
    setTransitInfoHeader([]);
    setTransitInfoItems([]);

    setApplied(false);
    setLoading(false);

    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
  };

  // ── Plant / Division / Transporter F4 (single call, same pattern as Insurance Claim) ──
  useEffect(() => {
    const loadF4Data = async () => {
      setTransporterLoading(true);
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        const plants: PlantData[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: any) => ({
            PLANT: p.PLANT,
            PLANT_DESC: p.PLANT_DESC,
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
        setTransporterLoading(false);
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
        SCREEN: "TRANSIT INFO",
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
  const applyFilter = async () => {
    if (!fromDate || !toDate) {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select From Date and To Date" });
      return;
    }

    setApplied(false);

    setDispatchData([]);
    setTransitInfoHeader([]);
    setTransitInfoItems([]);

    const payload = {
      GLOBAL: "TRANSIT INFO",
      ZUSER: getLoggedInUser(),
      DATE_FROM: format(fromDate, "yyyyMMdd"),
      DATE_TO: format(toDate, "yyyyMMdd"),
      PLANT: fPlant || "",
      DIVISION: fDivision || "",
      TRANSPORTER: fTransporter || "",
      VEHICLE_TYPE: fVehicleType || "",
      STATUS: fStatus || "",
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
        setTransitInfoHeader([]);
        setTransitInfoItems([]);
        setDispatchData([]);
        Swal.fire({ icon: "info", title: "No Data Found", text: res?.MSG || "No records available for selected filters" });
        return;
      }

      setApplied(true);

      if (fStatus === "Completed") {
        const headers = res?.HEADER || [];
        const items = res?.ITEMS || [];
        setTransitInfoHeader(headers);   // ✅ fixed
        setTransitInfoItems(items);      // ✅ fixed
        setDispatchData([]);
        Swal.fire({ icon: "success", title: "Success", text: `Headers: ${headers.length}, Items: ${items.length}` });
      } else if (fStatus === "Pending") {
        let records: any[] = [];
        if (Array.isArray(res)) records = res;
        else if (res?.HEADER) records = res.HEADER;
        else if (res?.DATA) records = res.DATA;

        setDispatchData(records);
        setTransitInfoHeader([]);
        setTransitInfoItems([]);
        Swal.fire({ icon: "success", title: "Success", text: `Records: ${records.length}` });
      } else {
        setTransitInfoHeader([]);
        setTransitInfoItems([]);
        setDispatchData([]);
        Swal.fire({ icon: "info", title: "Info", text: "Please select valid status" });
      }
    } catch (error) {
      console.error("Filter Error:", error);
      setLoading(false);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch data" });
    }
  };

  // ── Excel export ──
  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      const combinedData: any[] = [];
      transitInfoItems.forEach((item) => {
        const header = transitInfoHeader.find(
          (h: any) => h.ZREFNO === item.ZREFNO
        );

        combinedData.push({
          ...(header || {}),
          ...item,
        });
      });
      exportSource = combinedData;
      fileName = searchSap === "with" ? "TransitInfo_Completed_SAP.xlsx" : "TransitInfo_Completed_NonSAP.xlsx";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;
      fileName = searchSap === "with" ? "TransitInfo_Pending_SAP.xlsx" : "TransitInfo_Pending_NonSAP.xlsx";
    } else {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select valid status before download." });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({ icon: "warning", title: "Warning", text: "No data available to download." });
      return;
    }

    const exportData = exportSource.map((record) => ({
      "Reference No": record.ZREFNO || "",
      Plant: record.ZWERKS || record.ZPLANT || "",
      Division: record.ZDIVISION || "",
      "Vehicle Type": record.ZVEH_TYPE || "",
      "Current Location": record.ZCURR_LOC || "",
      "Last Ping": record.ZLAST_PING || "",
      "Next Stop": record.ZNEXT_STOP || "",
      ETA: record.ZETA || "",
      "Delay (hrs)": record.ZDELAY || "",
      Transporter: record.ZTRANSPORTER || "",
      "Created Date": record.ZCREATED_DT
        ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB")
        : "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");
    worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length + 5, 18) }));
    XLSX.writeFile(workbook, fileName);

    Swal.fire({ icon: "success", title: "Success", text: `${fileName} downloaded successfully.` });
  };

  // ── PDF export ──
  const downloadPDF = () => {
    let exportSource: any[] = [];
    let fileName = "";
    let reportTitle = "";

    if (fStatus === "Completed") {
      const combinedData: any[] = [];
      transitInfoItems.forEach((item) => {
        const header = transitInfoHeader.find(
          (h: any) => h.ZREFNO === item.ZREFNO
        );

        combinedData.push({
          ...(header || {}),
          ...item,
        });
      });
      exportSource = combinedData;
      fileName = searchSap === "with" ? "TransitInfo_Completed_SAP.pdf" : "TransitInfo_Completed_NonSAP.pdf";
      reportTitle = "Transit Info Records (Completed)";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;
      fileName = searchSap === "with" ? "TransitInfo_Pending_SAP.pdf" : "TransitInfo_Pending_NonSAP.pdf";
      reportTitle = "Transit Info Records (Pending)";
    } else {
      Swal.fire({ icon: "warning", title: "Warning", text: "Please select valid status." });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({ icon: "warning", title: "Warning", text: "No data available." });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a2" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 18, { align: "center" });

    const headers = [[
      "SI.No", "Reference No", "Plant", "Division", "Vehicle Type",
      "Current Location", "Last Ping", "Next Stop", "ETA", "Delay (hrs)",
      "Transporter", "Created Date",
    ]];

    const rows = exportSource.map((record, index) => [
      index + 1,
      record.ZREFNO || "",
      record.ZWERKS || record.ZPLANT || "",
      record.ZDIVISION || "",
      record.ZVEH_TYPE || "",
      record.ZCURR_LOC || "",
      record.ZLAST_PING || "",
      record.ZNEXT_STOP || "",
      record.ZETA || "",
      record.ZDELAY || "",
      record.ZTRANSPORTER || "",
      record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
    ]);

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
  const resultCount =
    fStatus === "Completed"
      ? transitInfoHeader.length + transitInfoItems.length
      : dispatchData.length;

  const viewCertificate = (item: any) => {
    if (!item?.ZPODFILE) {
      Swal.fire({
        icon: "info",
        title: "No File",
        text: "POD file not available.",
      });
      return;
    }

    window.open(item.ZPODFILE, "_blank");
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
                  {direction && sap && renderDirectionExtras(casesCount)}
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
                    <PlantF4Field value={fPlant} onChange={setFPlant} options={plantList} />
                    <DivisionF4Field value={fDivision} onChange={setFDivision} options={divisionList} />
                    <TransporterF4Field
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={transporterOptions}
                      loading={transporterLoading}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={downloadPDF}
                      disabled={
                        !applied ||
                        (fStatus === "Completed" &&
                          (transitInfoHeader.length === 0 ||
                            transitInfoItems.length === 0)) ||
                        (fStatus === "Pending" && dispatchData.length === 0)
                      }
                    >
                      <FileText className="size-3.5 text-red-600" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={
                        !applied ||
                        (fStatus === "Completed" &&
                          (transitInfoHeader.length === 0 ||
                            transitInfoItems.length === 0)) ||
                        (fStatus === "Pending" && dispatchData.length === 0)
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
                  <>
                    {/* ================= HEADER TABLE ================= */}
                    <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden mb-5">
                      <div className="px-4 py-3 border-b border-hairline bg-surface-2/60">
                        <h3 className="font-semibold">Header Items</h3>
                      </div>

                      <div className="overflow-x-auto max-h-[560px]">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead className="sticky top-0 z-30">
                            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                              <th className="px-3 py-2.5 whitespace-nowrap">SI.No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">REF No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">ODN Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">SO Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Sales Person</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Physical Arrived</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Unloading DT</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">POD Scan File</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">POD Scan Received Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">SIT/SALE</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Location</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Plant</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Division</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Created Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Type</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-hairline/70">
                            {transitInfoHeader.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={16}
                                  className="px-3 py-10 text-center text-muted-foreground"
                                >
                                  No Header Records Found
                                </td>
                              </tr>
                            ) : (
                              transitInfoHeader.map((item: any, index: number) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-surface hover:bg-muted/50"
                                      : "bg-surface-2/40 hover:bg-muted/50"
                                  }
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZREFNO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZINV_NO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZODN_NO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZSONO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZSALE_PERSON}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZPY_ARRIVED_DEST}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZUNLOADING_DT}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZPODNAME ? (
                                      <button
                                        type="button"
                                        className="text-blue-600 underline"
                                        onClick={() => viewCertificate(item)}
                                      >
                                        {item.ZPODNAME}
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZPOD_SCAN}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZSIT_SALE}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZLOCATION}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZPLANT}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZDIVISION}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZCREATED_DT
                                      ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB")
                                      : ""}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZVEH_TYPE}
                                  </td>
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
                        <h3 className="font-semibold">Line Items</h3>
                      </div>

                      <div className="overflow-x-auto max-h-[560px]">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead className="sticky top-0 z-30">
                            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                              <th className="px-3 py-2.5 whitespace-nowrap">SI.No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">REF No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Line</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">LR No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Work Order</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Transporter</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-hairline/70">
                            {transitInfoItems.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={8}
                                  className="px-3 py-10 text-center text-muted-foreground"
                                >
                                  No Line Items Found
                                </td>
                              </tr>
                            ) : (
                              transitInfoItems.map((item: any, index: number) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-surface hover:bg-muted/50"
                                      : "bg-surface-2/40 hover:bg-muted/50"
                                  }
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZREFNO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZINV_NO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZVEH_LINE}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZVEH_NUM}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZLRNO}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZWORK_ORDER}
                                  </td>

                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZTRANSPORTER}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                {applied && fStatus === "Pending" && (
                  <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                    <div className="px-4 py-3 border-b border-hairline bg-surface-2/60">
                      <h3 className="font-semibold">Pending Dispatch Records</h3>
                    </div>

                    <div className="overflow-x-auto max-h-[550px]">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead className="sticky top-0 z-30">
                          <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                            <th className="px-3 py-2 whitespace-nowrap">SI.No</th>
                            <th className="px-3 py-2 whitespace-nowrap">Reference No</th>
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
                          {dispatchData.length === 0 ? (
                            <tr>
                              <td
                                colSpan={15}
                                className="px-3 py-10 text-center text-muted-foreground"
                              >
                                No Pending Records Found
                              </td>
                            </tr>
                          ) : (
                            dispatchData.map((item, index) => (
                              <tr
                                key={index}
                                className={
                                  index % 2 === 0
                                    ? "bg-surface hover:bg-muted/50"
                                    : "bg-surface-2/40 hover:bg-muted/50"
                                }
                              >
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {index + 1}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap font-mono">
                                  {item.ZREFNO}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZCREATED_DT
                                    ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB")
                                    : ""}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZWERKS}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZDIVISION}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZVEH_TYPE}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZNO_TRUCKS}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZWORK_ORDER}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZVENDOR_CD}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZTRANSPORTER}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZNO_LRS}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZLR_NO}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZLOAD_PT}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZUNLOAD_PT}
                                </td>

                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.ZNO_INVOICES}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
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

function PlantF4Field({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: PlantData[] }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.PLANT === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Plant</label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-8 justify-between font-normal", !value && "text-muted-foreground")}>
            <span className="truncate">{selected ? `${selected.PLANT} - ${selected.PLANT_DESC}` : "Select Plant"}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">No plants available</div>
            ) : (
              options.map((o) => (
                <button
                  key={o.PLANT}
                  type="button"
                  onClick={() => { onChange(o.PLANT); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-[12px] hover:bg-muted", value === o.PLANT && "bg-accent/10 font-semibold")}
                >
                  <span className="font-mono">{o.PLANT}</span> — {o.PLANT_DESC}
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function DivisionF4Field({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: DivData[] }) {
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
            {options.length === 0 ? (
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

function TransporterF4Field({
  value, onChange, options, loading,
}: {
  value: string; onChange: (v: string) => void; options: TransporterData[]; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((o) => o.code === value);

  const filtered = search.trim()
    ? options.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || o.code.toLowerCase().includes(search.toLowerCase()))
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
                  onClick={() => { onChange(o.code); setOpen(false); }}
                  className={cn("w-full text-left px-3 py-2 text-[12px] hover:bg-muted", value === o.code && "bg-accent/10 font-semibold")}
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