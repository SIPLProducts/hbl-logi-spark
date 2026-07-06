import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import Swal from "sweetalert2";
// @ts-ignore
import service from "../services/generalservice_service.js";
import * as XLSX from "xlsx";
// @ts-ignore
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
import { cn } from "@/lib/utils";
import { ShipmentDetailsSapCreate } from "@/components/shipment-details-sap-create";

export const Route = createFileRoute("/shipment-details")({
  component: ShipmentDetailsPage,
});

type SapMode = "with" | "without";

const VEHICLE_TYPES = [
  "Cargo",
  "Rate Contract",
  "Local Transportation",
  "Customer Transporter",
  "Company Vehicle",
  "Courier",
  "By Hand",
  "Full Truck Load",
];
const STATUS_OPTIONS = ["Pending", "Completed"] as const;

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

function ShipmentDetailsPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

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

  const [shipmentData, setShipmentData] = useState<any[]>([]); // Completed
  const [dispatchData, setDispatchData] = useState<any[]>([]); // Pending
  const [transporterList, setTransporterList] = useState<any[]>([]);

  const currentUser = getCurrentUser();
  const loggedInUser = currentUser.USER || "";
  const plantList: any[] = currentUser.PLANTS || [];
  const divisionList: any[] = currentUser.DIV || [];

  const fetchCounts = async (sapMode: SapMode) => {
    try {
      const res = await service.OutwardCountGlobalWithSap({
        INOUT: "OUTWARD",
        TRANS_TYPE: sapMode === "with" ? "WITHSAP" : "WITHOUTSAP",
        SCREEN: "SHIPMENT DETAILS",
      });
      setPendingCount(res?.ZPEND_CNT || 0);
      setCompletedCount(res?.ZCONF_CNT || 0);
    } catch (err) {
      console.error("Error fetching counts:", err);
      setPendingCount(0);
      setCompletedCount(0);
    }
  };

  const handleSapChange = (v: SapMode) => {
    setSap(v);
    fetchCounts(v);
  };

  const fetchTransporters = async () => {
    try {
      const res = await service.fetchVendorCode();
      if (res && res.length > 0 && res[0].VEND_CODE) {
        setTransporterList(res[0].VEND_CODE);
      } else {
        Swal.fire({ title: "No Transporter Found", icon: "warning" });
      }
    } catch (err) {
      console.error("Transporter fetch error:", err);
    }
  };

  const handleSearchSapChange = (v: SapMode) => {
    setSearchSap(v);
    resetFilters(v);
    if (transporterList.length === 0) fetchTransporters();
  };

  const resetFilters = (keepSap?: SapMode) => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setApplied(false);
    setShipmentData([]);
    setDispatchData([]);
    if (keepSap === undefined) setSearchSap(null);
  };

  const applyFilter = async () => {
    if (!fromDate || !toDate) {
      Swal.fire({ title: "Warning", text: "Please select From Date and To Date", icon: "warning" });
      return;
    }
    if (!fStatus) {
      Swal.fire({ title: "Warning", text: "Please select a Status", icon: "warning" });
      return;
    }

    const payload = {
      GLOBAL: "SHIPMENT DETAILS",
      ZUSER: loggedInUser,
      DATE_FROM: format(fromDate, "yyyy-MM-dd"),
      DATE_TO: format(toDate, "yyyy-MM-dd"),
      PLANT: fPlant || "",
      DIVISION: fDivision || "",
      TRANSPORTER: fTransporter || "",
      VEHICLE_TYPE: fVehicleType || "",
      STATUS: fStatus || "",
    };

    setLoading(true);
    setApplied(false);
    try {
      const res =
        searchSap === "with"
          ? await service.fetchOrderInfoFiltered(payload)
          : await service.fetchGlobalFilteredNonSap(payload);

      if (res?.STATUS === "FALSE") {
        setShipmentData([]);
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
        setShipmentData(records);
        setDispatchData([]);
        Swal.fire({ title: "Success", text: `Shipment records: ${records.length}`, icon: "success" });
      } else {
        setDispatchData(records);
        setShipmentData([]);
        Swal.fire({ title: "Success", text: `Dispatch records: ${records.length}`, icon: "success" });
      }
    } catch (err) {
      console.error("Filter error:", err);
      Swal.fire({ title: "Error", text: "Failed to fetch filtered data", icon: "error" });
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = () => {
    const exportSource = fStatus === "Completed" ? shipmentData : dispatchData;
    const sapSuffix = searchSap === "with" ? "SAP" : "NonSAP";
    const fileName =
      fStatus === "Completed" ? `ShipmentData_Completed_${sapSuffix}.xlsx` : `Dispatch_Pending_${sapSuffix}.xlsx`;

    if (!fStatus) {
      Swal.fire({ title: "Warning", text: "Please select valid status before download", icon: "warning" });
      return;
    }
    if (!exportSource || exportSource.length === 0) {
      Swal.fire({ title: "Warning", text: "No data available to download", icon: "warning" });
      return;
    }

    let exportData: any[] = [];
    if (fStatus === "Completed") {
      exportData = exportSource.map((record) => ({
        "Reference No": record.ZREFNO || "",
        "Invoice No": record.VBELN || "",
        "Map ID": record.ZMAPID || "",
        "ODN No": record.ZODN_NO || "",
        "SO No": record.ZSO_NO || "",
        Incoterms: record.ZINCO || "",
        "Insurance Scope": record.ZINS_SCPOE || "",
        KM: record.ZKM || "",
        "Product Code": record.ZPRODUCT || "",
        "Type of Material": record.MTART || "",
        "Material Description": record.MAKTX || "",
        "No. of Sets": record.ZSETS || "",
        "AH Truck Load": record.ZAH || "",
        "Weight (in Kg)": record.ZSHIP_WT || "",
        "Battery Condition": record.ZBATCOND || "",
        Plant: record.ZWERKS || "",
        Division: record.ZDIVISION || "",
        "Work Order": record.ZWORK_ORDER || "",
        "LR No": record.ZLRNO || "",
        Transporter: record.ZTRANSPORTER || "",
        "Vehicle Type": record.ZVEH_TYPE || "",
        "Created Date": record.ZCREATED_DT || "",
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
      }));
    }

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Records");
    ws["!cols"] = Object.keys(exportData[0]).map((key) => ({ wch: Math.max(key.length + 5, 18) }));
    XLSX.writeFile(wb, fileName);

    Swal.fire({ title: "Success", text: `Excel file downloaded: ${fileName}`, icon: "success" });
  };

  const downloadPDF = () => {
    const exportSource = fStatus === "Completed" ? shipmentData : dispatchData;
    const sapSuffix = searchSap === "with" ? "SAP" : "NonSAP";
    const fileName =
      fStatus === "Completed" ? `Shipmentdata_Completed_${sapSuffix}.pdf` : `Dispatch_Pending_${sapSuffix}.pdf`;
    const reportTitle = fStatus === "Completed" ? "Shipment Data Records (Completed)" : "Dispatch Records (Pending)";

    if (!fStatus) {
      Swal.fire({ title: "Warning", text: "Please select valid status before download", icon: "warning" });
      return;
    }
    if (!exportSource || exportSource.length === 0) {
      Swal.fire({ title: "Warning", text: "No data available to download", icon: "warning" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [420, 297] });

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
          "SI.No",
          "REFNO",
          "Invoice No",
          "Map ID",
          "ODN No",
          "SO No",
          "Incoterms",
          "Insurance Scope",
          "KM",
          "Product",
          "Type of Material",
          "Material Description",
          "No. of Sets",
          "AH Truck Load",
          "Weight (in Kg)",
          "Battery Condition",
          "Plant",
          "Division",
          "Work Order",
          "LR No",
          "Transporter",
          "Created date",
          "Vehicle Type",
        ],
      ];
      data = exportSource.map((record, index) => [
        index + 1,
        record.ZREFNO || "",
        record.VBELN || "",
        record.ZMAPID || "",
        record.ZODN_NO || "",
        record.ZSO_NO || "",
        record.ZINCO || "",
        record.ZINS_SCPOE || "",
        record.ZKM || "",
        record.ZPRODUCT || "",
        record.MTART || "",
        record.MAKTX || "",
        record.ZSETS || "",
        record.ZAH || "",
        record.ZSHIP_WT || "",
        record.ZBATCOND || "",
        record.ZWERKS || "",
        record.ZDIVISION || "",
        record.ZWORK_ORDER || "",
        record.ZLRNO || "",
        record.ZTRANSPORTER || "",
        record.ZCREATED_DT ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB") : "",
        record.ZVEH_TYPE || "",
      ]);
    } else {
      headers = [
        [
          "SI.No",
          "Reference No",
          "Line No",
          "Date",
          "Plant",
          "Division",
          "Vehicle Type",
          "No. of Trucks",
          "Work Order",
          "Vendor Code",
          "Transporter",
          "No. of LRs",
          "LR Number",
          "Loading Point",
          "Unloading Point",
        ],
      ];
      data = exportSource.map((record, index) => [
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
    Swal.fire({ title: "Success", text: `PDF file downloaded: ${fileName}`, icon: "success" });
  };

  const refreshScreen = () => {
    setDirection(null);
    setSap(null);
    setPendingCount(0);
    setCompletedCount(0);
    resetFilters();
    Swal.fire({ text: "Screen refreshed successfully", icon: "success", confirmButtonText: "Ok", timer: 4000 });
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
                  Shipment Details
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
                onClick={refreshScreen}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">
          {/* Create tab */}
          <TabsContent value="create" className="mt-0 space-y-2">
            <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio label="Outward" checked={direction === "outward"} onSelect={() => setDirection("outward")} />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
                    <SapToggle value={sap} onChange={handleSapChange} />
                  </>
                )}
                {direction && sap && (
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
                )}
              </div>
              {!direction && <p className="mt-1.5 text-[11px] text-muted-foreground">Select a direction to continue.</p>}
              {direction && !sap && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  Select <span className="font-semibold">With SAP</span> or{" "}
                  <span className="font-semibold">Without SAP</span> to continue.
                </p>
              )}
            </div>

            {direction === "outward" && sap && <ShipmentDetailsSapCreate mode={sap} />}
          </TabsContent>

          {/* Filter & Download tab */}
          <TabsContent value="search" className="mt-5 space-y-5">
            <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
              <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
                <div className="flex items-center gap-2">
                  <Filter className="size-4 text-accent" />
                  <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Filter Options</h3>
                </div>
                <SapToggle value={searchSap} onChange={handleSearchSapChange} />
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
                      options={plantList.map((p) => ({ value: p.PLANT_DESC, label: p.PLANT_TEXT }))}
                      placeholder="Select Plant"
                    />
                    <SelectField
                      label="Division"
                      value={fDivision}
                      onChange={setFDivision}
                      options={divisionList.map((d) => ({ value: d.DIVISION, label: d.DIV_TEXT }))}
                      placeholder="Select Division"
                    />
                    <SelectField
                      label="Transporter"
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={transporterList.map((t) => ({ value: t.TRANSPORTER, label: t.TRANSPORTER }))}
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
                      options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                      placeholder="Select Status"
                    />
                  </div>

                  <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
                    <Button variant="ghost" size="sm" onClick={() => resetFilters(searchSap)}>
                      Reset
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadPDF} disabled={!applied}>
                      <FileText className="size-3.5" /> Download PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadExcel} disabled={!applied}>
                      <FileDown className="size-3.5 text-emerald-600" /> Download Excel
                    </Button>
                    <Button size="sm" onClick={applyFilter} disabled={loading} className="gap-1.5">
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
              <CompletedTable rows={shipmentData} />
            ) : (
              <PendingTable rows={dispatchData} />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function CompletedTable({ rows }: { rows: any[] }) {
  return (
    <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
      <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
        <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Results (Completed)</h3>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="overflow-x-auto scrollbar-elegant">
        <table className="w-full text-left border-collapse text-[11.5px]">
          <thead>
            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
              {[
                "SI.No",
                "REFNO",
                "Invoice No",
                "Map ID",
                "ODN No",
                "SO No",
                "Incoterms",
                "Insurance Scope",
                "KM",
                "Product",
                "Material Type",
                "Description",
                "Sets",
                "AH",
                "Weight (kg)",
                "Battery Cond.",
                "Plant",
                "Division",
                "Work Order",
                "LR No",
                "Transporter",
                "Vehicle Type",
                "Created date",
              ].map((h) => (
                <th key={h} className="px-2 py-1.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-accent/[0.04]">
                <td className="px-2 py-1">{i + 1}</td>
                <td className="px-2 py-1 font-mono whitespace-nowrap">{r.ZREFNO}</td>
                <td className="px-2 py-1 font-mono whitespace-nowrap">{r.VBELN}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZMAPID}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZODN_NO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZSO_NO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZINCO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZINS_SCPOE}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZKM}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZPRODUCT}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.MTART}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.MAKTX}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZSETS}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZAH}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZSHIP_WT}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZBATCOND}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZWERKS}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZDIVISION}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZWORK_ORDER}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZLRNO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZTRANSPORTER}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZVEH_TYPE}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {r.ZCREATED_DT ? new Date(r.ZCREATED_DT).toLocaleDateString("en-GB") : "-"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={22} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                  No records match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PendingTable({ rows }: { rows: any[] }) {
  return (
    <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
      <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
        <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Results (Pending)</h3>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          {rows.length} row{rows.length === 1 ? "" : "s"}
        </p>
      </div>
      <div className="overflow-x-auto scrollbar-elegant">
        <table className="w-full text-left border-collapse text-[11.5px]">
          <thead>
            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.1em] text-primary-foreground">
              {[
                "SI.No",
                "Reference No",
                "Line No",
                "Date",
                "Plant",
                "Division",
                "Vehicle Type",
                "No. of Trucks",
                "Work Order",
                "Vendor Code",
                "Transporter",
                "No. of LRs",
                "LR Number",
                "Loading Point",
                "Unloading Point",
              ].map((h) => (
                <th key={h} className="px-2 py-1.5 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/60">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-accent/[0.04]">
                <td className="px-2 py-1">{i + 1}</td>
                <td className="px-2 py-1 font-mono whitespace-nowrap">{r.ZREFNO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZLINE_NO}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {r.ZCREATED_DT ? new Date(r.ZCREATED_DT).toLocaleDateString("en-GB") : "-"}
                </td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZWERKS}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZDIVISION}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZVEH_TYPE}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZNO_TRUCKS}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZWORK_ORDER}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZVENDOR_CD}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZTRANSPORTER}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZNO_LRS}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZLR_NO}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZLOAD_PT}</td>
                <td className="px-2 py-1 whitespace-nowrap">{r.ZUNLOAD_PT}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={15} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
                  No records match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
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
      <span
        className={cn(
          "grid place-items-center size-4 rounded-full border-2 transition-all",
          checked ? "border-accent" : "border-hairline",
        )}
      >
        <span className={cn("size-1.5 rounded-full transition-all", checked ? "bg-accent scale-100" : "bg-transparent scale-0")} />
      </span>
      {label}
    </button>
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
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("h-10 justify-start text-left font-normal", !value && "text-muted-foreground")}>
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
  options: { value: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
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