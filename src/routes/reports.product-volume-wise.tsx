import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Package,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Filter,
  ChevronDown,
} from "lucide-react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import { GateDatePicker } from "@/components/ui/date-picker";

/* ──────────────────────────────────────────────────────────────────────────────
 * Product Volume Wise
 * Same filter fields, options, radios, layout and styling as the Business Share
 * Matrix report. All code below is local to this screen.
 *
 * "Execute Report" validates the filters and calls the FetchProductWiseReports API.
 * Item Level sends mode "I", Header Level sends mode "H"; each level has its own columns.
 * ──────────────────────────────────────────────────────────────────────────── */

type Option = { label: string; value: string };

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

const INOUT_OPTIONS: Option[] = [
  { value: "INWARD", label: "Inward" },
  { value: "OUTWARD", label: "Outward" },
];

const SAP_TYPE_OPTIONS: Option[] = [
  { value: "SAP", label: "SAP" },
  { value: "NONSAP", label: "Non-SAP" },
];

const VEHICLE_TYPE_OPTIONS: Option[] = [
  { value: "FULL TRUCK LOAD", label: "FULL TRUCK LOAD" },
  { value: "CARGO", label: "CARGO" },
  { value: "RATECONTRACT", label: "RATE CONTRACT" },
  { value: "LOCALTRANSPORTATION", label: "LOCAL TRANSPORTATION" },
  { value: "CUSTOMERTRANSPORTER", label: "CUSTOMER TRANSPORTER" },
  { value: "COMPANYVEHICLE", label: "COMPANY VEHICLE" },
  { value: "COURIER", label: "COURIER" },
  { value: "BYHAND", label: "BY HAND" },
];

const MONTH_OPTIONS: Option[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
].map((month) => ({ value: month, label: month }));

const QUARTER_OPTIONS: Option[] = ["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({ value: quarter, label: quarter }));
const YEAR_OPTIONS: Option[] = ["FY 26-27"].map((year) => ({ value: year, label: year }));

const REPORT_LEVEL_OPTIONS: Option[] = [
  { value: "Item", label: "Item Level" },
  { value: "Header", label: "Header Level" },
];

// Result columns (API response keys → table / Excel / PDF headings), in the API's order
type Col = { key: string; label: string };

// Item Level (mode "I")
const ITEM_LEVEL_COLUMNS: Col[] = [
  { key: "SL_NO", label: "Sl No" },
  { key: "PLANT", label: "Plant" },
  { key: "ORDER_TYPE", label: "Order Type" },
  { key: "DIVISION", label: "Division" },
  { key: "SUB_DIVISION", label: "Sub Division" },
  { key: "VEHICLE_TYPE", label: "Vehicle Type" },
  { key: "MONTH", label: "Month" },
  { key: "FINANCIAL_QUATOR", label: "Financial Quarter" },
  { key: "FINANCIAL_YEAR", label: "Financial Year" },
  { key: "PRODUCT", label: "Product" },
  { key: "MATERIAL_TYPE", label: "Material Type" },
  { key: "AH_LOADED", label: "AH Loaded" },
  { key: "SHIPMENT_WEIGHT", label: "Shipment Weight" },
  { key: "TRUCK_TYPE", label: "Truck Type" },
  { key: "NO_OF_INVOICES", label: "No of Invoices" },
  { key: "INVOICE_NO", label: "Invoice No" },
  { key: "INVOICE_DATE", label: "Invoice Date" },
  { key: "ODN_NO", label: "ODN No" },
  { key: "INVOICE_BASIC_VALUE", label: "Invoice Basic Value" },
  { key: "INVOICE_VALUE_WITH_GST", label: "Invoice Value With GST" },
  { key: "INCO_TERMS", label: "Incoterms" },
  { key: "SIT_SALE", label: "SIT Sale" },
  { key: "PROVISION_ACCOUNT", label: "Provision Account" },
  { key: "FREIGHT_AMOUNT", label: "Freight Amount" },
  { key: "DETENTION_AT_LOADING_POINT", label: "Detention At Loading Point" },
  { key: "DETENTION_AT_UNLOADING_POINT", label: "Detention At Unloading Point" },
  { key: "UNLOADING_CHARGES", label: "Unloading Charges" },
  { key: "COMMISSION_ON_UNLOADING_CHG", label: "Commission On Unloading Charges" },
  { key: "OTHERS", label: "Others" },
  { key: "TOTAL_FREIGHT_AMT", label: "Total Freight Amount" },
  { key: "PROVISION_ACCOUNTED_DATE", label: "Provision Accounted Date" },
  { key: "FREIGHT_COST_PER_AH", label: "Freight Cost Per AH" },
  { key: "FREIGHT_COST_TON", label: "Freight Cost Per Ton" },
  { key: "FREIGHT_COST_PCT_BASIC", label: "Freight Cost % Of Basic" },
  { key: "FREIGHT_COST_PCT_INCL", label: "Freight Cost % Incl GST" },
  { key: "REMARKS", label: "Remarks" },
];

// Header Level (mode "H")
const HEADER_LEVEL_COLUMNS: Col[] = [
  { key: "SL_NO", label: "Sl No" },
  { key: "REFERENCE_NO", label: "Reference No" },
  { key: "MAP_ID", label: "Map ID" },
  { key: "WORK_ORDER", label: "Work Order" },
  { key: "MONTH", label: "Month" },
  { key: "FINANCIAL_QUATOR", label: "Financial Quarter" },
  { key: "FINANCIAL_YEAR", label: "Financial Year" },
  { key: "PLANT", label: "Plant" },
  { key: "ORDER_TYPE", label: "Order Type" },
  { key: "DIVISION", label: "Division" },
  { key: "SUB_DIVISION", label: "Sub Division" },
  { key: "VEHICLE_TYPE", label: "Vehicle Type" },
  { key: "SO_NO", label: "SO No" },
  { key: "CUSTOMER_NAME", label: "Customer Name" },
  { key: "CUSTOMER_GROUP", label: "Customer Group" },
  { key: "SEGMENT", label: "Segment" },
  { key: "CONSIGNEE", label: "Consignee" },
  { key: "DESTINATION", label: "Destination" },
  { key: "DESTINATION_STATE", label: "Destination State" },
  { key: "DESTINATION_ZONE", label: "Destination Zone" },
  { key: "PRODUCT", label: "Product" },
  { key: "LINE_ITEM_NO", label: "Line Item No" },
  { key: "MATERIAL_TYPE", label: "Material Type" },
  { key: "MATERIAL_DESCRIPTION", label: "Material Description" },
  { key: "NO_OF_SETS", label: "No of Sets" },
  { key: "AH_LOADED", label: "AH Loaded" },
  { key: "SHIPMENT_WEIGHT", label: "Shipment Weight" },
  { key: "TRUCK_TYPE", label: "Truck Type" },
  { key: "NO_OF_INVOICES", label: "No of Invoices" },
  { key: "INVOICE_NO", label: "Invoice No" },
  { key: "INVOICE_DATE", label: "Invoice Date" },
  { key: "ODN_NO", label: "ODN No" },
  { key: "INVOICE_BASIC_VALUE", label: "Invoice Basic Value" },
  { key: "INVOICE_VALUE_WITH_GST", label: "Invoice Value With GST" },
  { key: "INCO_TERMS", label: "Incoterms" },
  { key: "BRANCH", label: "Branch" },
  { key: "BRANCH_ZONE", label: "Branch Zone" },
  { key: "SIT_SALE", label: "SIT Sale" },
  { key: "FREIGHT_AMOUNT", label: "Freight Amount" },
  { key: "DETENTION_AT_LOADING_POINT", label: "Detention At Loading Point" },
  { key: "DETENTION_AT_UNLOADING_POINT", label: "Detention At Unloading Point" },
  { key: "UNLOADING_CHARGES", label: "Unloading Charges" },
  { key: "COMMISSION_ON_UNLOADING_CHG", label: "Commission On Unloading Charges" },
  { key: "OTHERS", label: "Others" },
  { key: "TOTAL_FREIGHT_AMT", label: "Total Freight Amount" },
  { key: "PROVISION_ACCOUNTED_DATE", label: "Provision Accounted Date" },
  { key: "FREIGHT_COST_PER_AH", label: "Freight Cost Per AH" },
  { key: "FREIGHT_COST_TON", label: "Freight Cost Per Ton" },
  { key: "FREIGHT_COST_PCT_BASIC", label: "Freight Cost % Of Basic" },
  { key: "FREIGHT_COST_PCT_INCL", label: "Freight Cost % Incl GST" },
  { key: "REMARKS", label: "Remarks" },
];

// Logged-in user from the login response (PLANTS / DIV / USER)
function getLoggedInUser(): any {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("userData") || "{}");
  } catch {
    return {};
  }
}

// Divisions (login DIV) that belong to the selected plant(s); all of them when no plant is chosen
function divisionsForSelectedPlants(divisions: any[], plantValues: string[], plants: any[]): any[] {
  const selected = plantValues.map((v) => String(v ?? "").trim()).filter(Boolean);
  if (selected.length === 0) return divisions;
  const plantCodes = selected
    .map((value) => {
      const match = plants.find((p) => p?.WERKS === value || p?.PLANT_DESC === value || p?.PLANT_TEXT === value);
      if (match?.WERKS) return String(match.WERKS);
      const codePrefix = value.match(/^(\d+)(?:_|$)/);
      return codePrefix ? codePrefix[1] : "";
    })
    .filter(Boolean);
  if (plantCodes.length === 0) return divisions;
  return divisions.filter((d) => plantCodes.includes(String(d?.PLANT ?? "").trim()));
}

// [{ key: value }, …] from a selection (same payload shape as the other report screens)
function toPayloadArray(value: string[] | string, key: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) return [];
  if (Array.isArray(value)) return value.map((v) => ({ [key]: v }));
  return [{ [key]: value }];
}

// "2026-10-21" → "20261021"
function toPayloadDate(date: string) {
  return date ? date.split("-").join("") : "";
}

export const Route = createFileRoute("/reports/product-volume-wise")({
  component: ProductVolumeWiseReport,
});

function ProductVolumeWiseReport() {
  // Filter fields
  const [inout, setInout] = useState<string[]>([]);
  const [sapType, setSapType] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [vehicleType, setVehicleType] = useState<string[]>([]);
  const [transporter, setTransporter] = useState<string[]>([]);
  const [transporterCode, setTransporterCode] = useState<string[]>([]);
  const [monthWise, setMonthWise] = useState<string[]>([]);
  const [quarterWise, setQuarterWise] = useState<string[]>([]);
  const [yearWise, setYearWise] = useState<string[]>([]);
  const [plant, setPlant] = useState<string[]>([]);
  const [division, setDivision] = useState<string[]>([]);
  const [reportLevel, setReportLevel] = useState("");
  const [touched, setTouched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Results (filled once the report API is available)
  const [results, setResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  // Level of the rows currently in the table (set when the report is executed)
  const [resultLevel, setResultLevel] = useState("");
  const REPORT_COLUMNS: Col[] = resultLevel === "Header" ? HEADER_LEVEL_COLUMNS : ITEM_LEVEL_COLUMNS;

  // Dropdown data: plants / divisions from the login response, transporters from the vendor-code F4
  const [plantList, setPlantList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const [transporterList, setTransporterList] = useState<any[]>([]);

  useEffect(() => {
    const user = getLoggedInUser();
    setPlantList(Array.isArray(user?.PLANTS) ? user.PLANTS : []);
    setDivisionList(Array.isArray(user?.DIV) ? user.DIV : []);

    (async () => {
      try {
        const res: any = await service.fetchVendorCode();
        console.log("Product Volume Wise - fetchVendorCode Response:", res);
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};
        setTransporterList(Array.isArray(data?.VEND_CODE) ? data.VEND_CODE : []);
      } catch (err) {
        console.error("Error fetching transporters", err);
        setTransporterList([]);
      }
    })();
  }, []);

  const plantOptions: Option[] = useMemo(
    () => plantList.map((p: any) => ({ label: p.PLANT_TEXT, value: p.PLANT_TEXT })),
    [plantList],
  );
  const divisionOptions: Option[] = useMemo(
    () =>
      divisionsForSelectedPlants(divisionList, plant, plantList).map((d: any) => ({
        label: d.DIV_TEXT,
        value: d.DIVISION,
      })),
    [divisionList, plant, plantList],
  );
  const transporterOptions: Option[] = useMemo(
    () => transporterList.map((t: any) => ({ label: t.TRANSPORTER, value: t.TRANSPORTER })),
    [transporterList],
  );
  const transporterCodeOptions: Option[] = useMemo(() => {
    const codes = Array.from(
      new Set(transporterList.map((t: any) => String(t?.VENDOR_CODE ?? "").trim()).filter(Boolean)),
    );
    return codes.map((code) => ({ label: code, value: code }));
  }, [transporterList]);

  const inoutInvalid = touched && inout.length === 0;
  const fromDateInvalid = touched && !fromDate;
  const toDateInvalid = touched && !toDate;
  const reportLevelInvalid = touched && !reportLevel;

  const visibleResults = useMemo(() => {
    const text = searchText.trim().toLowerCase();
    if (!text) return results;
    return results.filter((row) =>
      Object.values(row || {}).some((v) => String(v ?? "").toLowerCase().includes(text)),
    );
  }, [results, searchText]);

  // Execute Report
  const onExecute = async () => {
    setTouched(true);
    if (inout.length === 0 || !fromDate || !toDate || !reportLevel) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please fill required fields" });
      return;
    }

    // Payload — keys and shapes as defined by the Product Volume Wise API
    const payload = {
      inward_outward: toPayloadArray(inout, "inout"),
      sap_nonsap: toPayloadArray(sapType, "type"),
      from_date: fromDate, // API expects YYYY-MM-DD (with dashes)
      to_date: toDate,
      // Plant → PLANT_DESC only (e.g. "HBL PE-SHPT")
      plant: toPayloadArray(
        Array.from(new Set(plant.map((v) => plantList.find((p: any) => p.PLANT_TEXT === v)?.PLANT_DESC ?? v))),
        "plant",
      ),
      // Division → division code (e.g. "PE")
      division: toPayloadArray(Array.from(new Set(division)), "division"),
      transaction_type: toPayloadArray(vehicleType, "transaction_type"),
      transporter: toPayloadArray(transporter, "transporter"),
      vendor_code: toPayloadArray(transporterCode, "vendor_code"),
      month: (monthWise[0] || "").toUpperCase(), // OCTOBER / ALL / ""
      quarter: quarterWise[0] || "", // Q3 / ALL / ""
      year: yearWise[0] || "", // FY 26-27 / ALL / ""
      mode: reportLevel === "Header" ? "H" : "I", // I = Item level, H = Header level
    };

    setIsSearching(true);
    try {
      console.log("Product Volume Wise - FetchProductWiseReports Payload:", payload);
      const res: any = await service.FetchProductWiseReports(payload);
      console.log("Product Volume Wise - FetchProductWiseReports Response:", res);

      // Table columns follow the level that was executed
      setResultLevel(reportLevel);

      // ERROR RESPONSE HANDLING (API returns an object with a MESSAGE instead of rows)
      if (!Array.isArray(res)) {
        setResults([]);
        Swal.fire({ icon: "warning", title: "No Data", text: res?.MESSAGE || "No records found" });
        return;
      }

      // Rows may come nested ([[{...}]]) — flatten to a plain list of rows
      const data = (res as any[]).flat(Infinity).filter((r) => r && typeof r === "object");
      setResults(data);
      setSearchText("");

      if (data.length > 0) {
        Swal.fire({ icon: "success", title: "Success", text: "Data fetched successfully!" });
      } else {
        Swal.fire({ icon: "warning", title: "No Data", text: "No records found" });
      }
    } catch (err) {
      console.error("Product Volume Wise API Error:", err);
      setResults([]);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch data. Please try again." });
    } finally {
      setIsSearching(false);
    }
  };

  const onClearFilters = () => {
    setInout([]);
    setSapType([]);
    setFromDate("");
    setToDate("");
    setVehicleType([]);
    setTransporter([]);
    setTransporterCode([]);
    setMonthWise([]);
    setQuarterWise([]);
    setYearWise([]);
    setPlant([]);
    setDivision([]);
    setReportLevel("");
    setTouched(false);
  };

  const onExportExcel = () => {
    if (visibleResults.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
      return;
    }

    const exportData: any[] = visibleResults.map((row: any) =>
      Object.fromEntries(REPORT_COLUMNS.map((c) => [c.label, row?.[c.key] ?? ""])),
    );
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { "Product Volume Wise": worksheet },
      SheetNames: ["Product Volume Wise"],
    };
    XLSX.writeFile(workbook, "Product_Volume_Wise.xlsx");

    Swal.fire("Success", "Excel exported successfully.", "success");
  };

  const onExportPdf = () => {
    if (visibleResults.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");
    doc.text("Product Volume Wise", 14, 10);

    const tableColumn: string[] = REPORT_COLUMNS.map((c) => c.label);
    const tableRows: any[] = visibleResults.map((row: any) => REPORT_COLUMNS.map((c) => row?.[c.key] ?? ""));

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 15,
      styles: { fontSize: 7, cellWidth: "wrap" },
      headStyles: { fillColor: [41, 128, 185], fontSize: 7 },
      bodyStyles: { fontSize: 7 },
    });

    doc.save("Product_Volume_Wise.pdf");
    Swal.fire("Success", "PDF exported successfully.", "success");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
            <Package className="size-4" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-[22px] leading-tight font-semibold tracking-tight text-[#1E293B] dark:text-slate-100 truncate"
              style={{ fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif' }}
            >
              Product Volume Wise
            </h1>
            <p className="text-[11.5px] text-muted-foreground mt-1">Shipment volumes by product, plant and period.</p>
          </div>
        </div>
      </div>
      {/* Gap between the header and the filter card */}
      <div className="h-3 sm:h-4 shrink-0" />

      <div className="flex-1 overflow-y-auto scrollbar-elegant px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-5">
        {/* FILTER CARD */}
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">
            <ReportMultiSelect
              label="Inward/Outward"
              options={INOUT_OPTIONS}
              value={inout}
              onChange={setInout}
              error={inoutInvalid ? "Inward/Outward is required" : undefined}
            />

            <ReportMultiSelect label="SAP/Non-SAP" options={SAP_TYPE_OPTIONS} value={sapType} onChange={setSapType} />

            <ReportDateField
              label="From Date"
              value={fromDate}
              onChange={setFromDate}
              error={fromDateInvalid ? "From Date is required" : undefined}
            />

            <ReportDateField
              label="To Date"
              value={toDate}
              onChange={setToDate}
              error={toDateInvalid ? "To Date is required" : undefined}
            />

            <ReportMultiSelect label="Vehicle Type" options={VEHICLE_TYPE_OPTIONS} value={vehicleType} onChange={setVehicleType} />

            <ReportMultiSelect
              label="Transporter"
              options={transporterOptions}
              value={transporter}
              onChange={setTransporter}
              searchable
            />

            <ReportMultiSelect
              label="Transporter Code"
              options={transporterCodeOptions}
              value={transporterCode}
              onChange={setTransporterCode}
              searchable
            />

            <ReportMultiSelect label="Month Wise" options={MONTH_OPTIONS} value={monthWise} onChange={setMonthWise} />

            <ReportMultiSelect label="Quarter Wise" options={QUARTER_OPTIONS} value={quarterWise} onChange={setQuarterWise} />
            <ReportMultiSelect label="Year Wise" options={YEAR_OPTIONS} value={yearWise} onChange={setYearWise} />

            {/* <div>
              <label className={LABEL}>Year Wise</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                value={yearWise}
                // Year: digits only, e.g. 2026
                onChange={(e) => setYearWise(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter Year (e.g. 2026)"
                className={INPUT}
              />
            </div> */}

            <ReportMultiSelect label="Plant" options={plantOptions} value={plant} onChange={setPlant} searchable />

            <ReportMultiSelect label="Division" options={divisionOptions} value={division} onChange={setDivision} searchable />
          </div>

          {/* REPORT LEVEL (radio) — only one can be selected */}
          <div className="mt-4 pt-4 border-t border-hairline space-y-2">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {REPORT_LEVEL_OPTIONS.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-[12.5px] text-foreground cursor-pointer">
                  <input
                    type="radio"
                    name="product-volume-wise-report-level"
                    checked={reportLevel === opt.value}
                    onChange={() => setReportLevel(opt.value)}
                    className="size-3.5 accent-primary"
                  />
                  {opt.label}
                </label>
              ))}
              {reportLevelInvalid && <span className="text-[11px] text-destructive">Please select report type</span>}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClearFilters}
              className="h-9 px-4 rounded-md border border-input bg-background text-foreground text-[12.5px] font-semibold hover:bg-muted inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Clear Filters
            </button>
            <button
              type="button"
              onClick={() => void onExecute()}
              disabled={isSearching}
              className="h-9 px-5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              <Filter className="size-3.5" />
              {isSearching ? "Executing..." : "Execute Report"}
            </button>
          </div>
        </div>

        {/* RESULTS CARD */}
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Product Volume Wise Detailed</h3>
            <div className="flex items-center gap-2">
              <label className="text-[12px] text-muted-foreground">Search:</label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={onExportExcel}
                // Excel — green
                className="h-8 px-3 rounded-md bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="size-3.5" />
                Export Excel
              </button>
              <button
                type="button"
                onClick={onExportPdf}
                // PDF — red
                className="h-8 px-3 rounded-md bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="size-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          {visibleResults.length === 0 ? (
            <div className="p-12 grid place-items-center text-center">
              <div className="size-14 rounded-full bg-muted grid place-items-center mb-4">
                <Package className="size-7 text-muted-foreground" />
              </div>
              <p className="text-[12.5px] text-muted-foreground">Fill filters and click execute to see results.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left border-collapse text-[12px]">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                    {REPORT_COLUMNS.map((c) => (
                      <th key={c.key} className="px-3 py-2.5 whitespace-nowrap text-left">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/70">
                  {visibleResults.map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                      {REPORT_COLUMNS.map((c) => (
                        <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                          {String(row?.[c.key] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Multi-select dropdown (local to this screen) ── */
function ReportMultiSelect({
  label,
  options,
  value,
  onChange,
  searchable = false,
  error,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

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

  const filtered =
    searchable && search ? options.filter((o) => o.label?.toLowerCase().includes(search.toLowerCase())) : options;

  const toggle = (v: string) => {
    if (value.includes(v)) onChange(value.filter((x) => x !== v));
    else onChange([...value, v]);
  };

  const displayLabel = () => {
    if (value.length === 0) return "";
    if (value.length === 1) {
      const opt = options.find((o) => o.value === value[0]);
      return opt?.label ?? value[0];
    }
    return `${value.length} Selected`;
  };

  return (
    <div className="relative" ref={ref}>
      <label className={LABEL}>{label}</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          INPUT,
          "flex items-center justify-between gap-2 text-left",
          value.length === 0 && "text-muted-foreground",
          error && "border-destructive",
        )}
      >
        <span className="truncate">{displayLabel() || "Select"}</span>
        <ChevronDown className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-hairline bg-surface shadow-elegant max-h-60 overflow-y-auto">
          {searchable && (
            <div className="p-1.5 sticky top-0 bg-surface border-b border-hairline">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="h-7 w-full rounded border border-input bg-background px-2 text-[12px] text-foreground outline-none focus:border-accent"
              />
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-[12px] text-muted-foreground">No options</div>
          ) : (
            filtered.map((o) => (
              <label
                key={o.value}
                className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted cursor-pointer"
              >
                <input type="checkbox" checked={value.includes(o.value)} onChange={() => toggle(o.value)} className="size-3.5" />
                <span className="truncate">{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

/* ── Date field (local to this screen) ── */
function ReportDateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div>
      <GateDatePicker label={label} value={value} onChange={(_, str) => onChange(str)} className="h-9" />
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
