import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Truck,
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
 * SIT Report
 * Same filter fields, options, radios, layout and styling as the Business Share
 * Matrix report. All code below is local to this screen.
 *
 * "Execute Report" validates the filters and calls the FetchSitReports API.
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
  { value: "ALL", label: "ALL" },
  ...[
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ].map((month) => ({ value: month, label: month })),
];

const QUARTER_OPTIONS: Option[] = [
  { value: "ALL", label: "ALL" },
  ...["Q1", "Q2", "Q3", "Q4"].map((quarter) => ({ value: quarter, label: quarter })),
];

const YEAR_OPTIONS: Option[] = [
  { value: "ALL", label: "ALL" },
  ...["FY 26-27"].map((year) => ({ value: year, label: year })),
];

// Result columns (API response keys → table / Excel / PDF headings), in the API's order
type Col = { key: string; label: string };

const REPORT_COLUMNS: Col[] = [
  { key: "SL_NO", label: "Sl No" },
  { key: "REF_NO", label: "Reference No" },
  { key: "MAP_ID", label: "Map ID" },
  { key: "WORK_ORDER", label: "Work Order" },
  { key: "MONTH", label: "Month" },
  { key: "FIN_QTR", label: "Financial Quarter" },
  { key: "FIN_YEAR", label: "Financial Year" },
  { key: "PLANT", label: "Plant" },
  { key: "DIVISION", label: "Division" },
  { key: "SUB_DIVISION", label: "Sub Division" },
  { key: "VEHICLE_TYPE", label: "Vehicle Type" },
  { key: "SO_NO", label: "SO No" },
  { key: "CUST_NAME", label: "Customer Name" },
  { key: "CUST_GROUP", label: "Customer Group" },
  { key: "CONSIGNEE", label: "Consignee" },
  { key: "DESTINATION", label: "Destination" },
  { key: "DEST_STATE", label: "Destination State" },
  { key: "DEST_ZONE", label: "Destination Zone" },
  { key: "PRODUCT", label: "Product" },
  { key: "LINE_ITEM", label: "Line Item" },
  { key: "MAT_TYPE", label: "Material Type" },
  { key: "MAT_DESC", label: "Material Description" },
  { key: "NO_OF_SETS", label: "No Of Sets" },
  { key: "AH_LOADED", label: "AH Loaded" },
  { key: "SHIP_WEIGHT", label: "Shipment Weight" },
  { key: "ORDER_TYPE", label: "Order Type" },
  { key: "TRUCK_TYPE", label: "Truck Type" },
  { key: "NO_OF_TRUCKS", label: "No Of Trucks" },
  { key: "TRANSPORTER", label: "Transporter" },
  { key: "LR_NO", label: "LR No" },
  { key: "LR_DATE", label: "LR Date" },
  { key: "PHY_DISPATCH", label: "Physical Dispatch Date" },
  { key: "INVOICE_NO", label: "Invoice No" },
  { key: "INVOICE_DATE", label: "Invoice Date" },
  { key: "ODN_NO", label: "ODN No" },
  { key: "INV_BASIC", label: "Invoice Basic Amount" },
  { key: "INV_WITH_GST", label: "Invoice Amount With GST" },
  { key: "VEHICLE_NO", label: "Vehicle No" },
  { key: "DRIVER_NAME", label: "Driver Name" },
  { key: "DRIVER_NO", label: "Driver No" },
  { key: "INCO_TERMS", label: "Incoterms" },
  { key: "EWAY_APPL", label: "E-Way Bill Applicable" },
  { key: "EWAY_NO", label: "E-Way Bill No" },
  { key: "EWAY_DATE", label: "E-Way Bill Date" },
  { key: "EWAY_VALID", label: "E-Way Bill Validity" },
  { key: "KMS", label: "Distance (KMs)" },
  { key: "LIVE_EXPIRED", label: "Live / Expired" },
  { key: "TRANSIT_ST", label: "Transit Status" },
  { key: "UNLOAD_ST", label: "Unloading Status" },
  { key: "TAT_TYPE", label: "TAT Type" },
  { key: "TAT_DAYS", label: "TAT Days" },
  { key: "ETA", label: "ETA" },
  { key: "PHY_ARRIVED", label: "Physical Arrived Date" },
  { key: "SIT", label: "SIT" },
  { key: "SHIP_AGE", label: "Shipment Age" },
];

function getRowValue(row: any, key: string): any {
  if (!row) return "";
  const val =
    row[key] ??
    (key === "REF_NO" ? row.REFERENCE_NO : undefined) ??
    (key === "FIN_QTR" ? row.FINANCIAL_QUARTER : undefined) ??
    (key === "FIN_YEAR" ? row.FINANCIAL_YEAR : undefined) ??
    (key === "CUST_NAME" ? row.CUSTOMER_NAME : undefined) ??
    (key === "CUST_GROUP" ? row.CUSTOMER_GROUP : undefined);

  if (val === null || val === undefined) return "";
  return val;
}

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

export const Route = createFileRoute("/reports/sit-report")({
  component: SitReport,
});

function SitReport() {
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
  const [touched, setTouched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Results (filled once the report API is available)
  const [results, setResults] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

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
        console.log("Sit Report - fetchVendorCode Response:", res);
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
    if (inout.length === 0 || !fromDate || !toDate) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please fill required fields" });
      return;
    }

    // Payload — keys and shapes as defined by the SIT Report API
    const payload = {
      inward_outward: toPayloadArray(inout, "inout"),
      sap_nonsap: toPayloadArray(sapType, "type"),
      from_date: fromDate, // YYYY-MM-DD
      to_date: toDate, // YYYY-MM-DD
      // Plant → PLANT_DESC only (e.g. "HBL NCPP-SHPT")
      plant: toPayloadArray(
        Array.from(new Set(plant.map((v) => plantList.find((p: any) => p.PLANT_TEXT === v)?.PLANT_DESC ?? v))),
        "plant",
      ),
      // Division → division code (e.g. "NCPP")
      division: toPayloadArray(Array.from(new Set(division)), "division"),
      transaction_type: toPayloadArray(vehicleType, "transaction_type"),
      transporter: toPayloadArray(transporter, "transporter"),
      vendor_code: toPayloadArray(transporterCode, "vendor_code"),
      month: monthWise.includes("ALL") ? "ALL" : (monthWise[0] || "").toUpperCase(),
      quarter: quarterWise.includes("ALL") ? "ALL" : quarterWise[0] || "",
      year: yearWise.includes("ALL") ? "ALL" : yearWise[0] || "",
    };

    setIsSearching(true);
    try {
      console.log("Sit Report - FetchSitReports Payload:", payload);
      const res: any = await service.FetchSitReports(payload);
      console.log("Sit Report - FetchSitReports Response:", res);

      // ERROR RESPONSE HANDLING (API returns an object with a MESSAGE instead of rows)
      if (!Array.isArray(res)) {
        setResults([]);
        Swal.fire({
          icon: "warning",
          title: "No Data",
          text: res?.MESSAGE || res?.MSG || "No records found",
        });
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
      console.error("Sit Report API Error:", err);
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
    setTouched(false);
  };

  const onExportExcel = () => {
    if (visibleResults.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
      return;
    }

    const exportData: any[] = visibleResults.map((row: any) =>
      Object.fromEntries(REPORT_COLUMNS.map((c) => [c.label, getRowValue(row, c.key)])),
    );
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { "SIT Report": worksheet },
      SheetNames: ["SIT Report"],
    };
    XLSX.writeFile(workbook, "SIT_Report.xlsx");

    Swal.fire("Success", "Excel exported successfully.", "success");
  };

  const onExportPdf = () => {
    if (visibleResults.length === 0) {
      Swal.fire({ icon: "info", title: "No Data", text: "There is no data to export." });
      return;
    }

    // A0 landscape keeps all 55 columns on one page horizontally
    const doc = new jsPDF("l", "mm", "a0");
    doc.text("SIT Report", 14, 10);

    const tableColumn: string[] = REPORT_COLUMNS.map((c) => c.label);
    const tableRows: any[] = visibleResults.map((row: any) =>
      REPORT_COLUMNS.map((c) => String(getRowValue(row, c.key))),
    );

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 15,
      margin: { left: 6, right: 6 },
      tableWidth: "auto",
      styles: { fontSize: 4.5, cellPadding: 0.8, overflow: "linebreak" },
      headStyles: { fillColor: [41, 128, 185], fontSize: 4.5 },
      bodyStyles: { fontSize: 4.5 },
    });

    doc.save("SIT_Report.pdf");
    Swal.fire("Success", "PDF exported successfully.", "success");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft shrink-0">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
            <Truck className="size-4" />
          </div>
          <div className="min-w-0">
            <h1
              className="text-[22px] leading-tight font-semibold tracking-tight text-[#1E293B] dark:text-slate-100 truncate"
              style={{ fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif' }}
            >
              SIT Report
            </h1>
            <p className="text-[11.5px] text-muted-foreground mt-1">Stock-in-Transit (SIT) shipments by transporter and plant.</p>
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
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">SIT Report Detailed</h3>
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
                <Truck className="size-7 text-muted-foreground" />
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
                          {String(getRowValue(row, c.key))}
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
