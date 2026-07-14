import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Calendar,
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

type Option = { label: string; value: string; meta?: string };

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

// Static option lists (mirrors Angular LoadingFactorCostComponent's hard-coded dropdown values)
const INOUT_OPTIONS: Option[] = [
  { value: "INWARD", label: "Inward" },
  { value: "OUTWARD", label: "Outward" },
];

const SAPTYPE_OPTIONS: Option[] = [
  { value: "SAP", label: "SAP" },
  { value: "NONSAP", label: "Non-SAP" },
];

const TRANS_GROUP_OPTIONS: Option[] = [
  { value: "FULL TRUCK LOAD", label: "FULL TRUCK LOAD" },
  { value: "CARGO", label: "CARGO" },
  { value: "RATECONTRACT", label: "RATE CONTRACT" },
  { value: "LOCALTRANSPORTATION", label: "LOCAL TRANSPORTATION" },
  { value: "CUSTOMERTRANSPORTER", label: "CUSTOMER TRANSPORTER" },
  { value: "COMPANYVEHICLE", label: "COMPANY VEHICLE" },
  { value: "COURIER", label: "COURIER" },
  { value: "BYHAND", label: "BY HAND" },
];

const PRODUCT_OPTIONS: Option[] = [
  { value: "Batteries", label: "Batteries" },
  { value: "Electronics", label: "Electronics" },
  { value: "Fuze", label: "Fuze" },
  { value: "Cement Poles and Piles", label: "Cement Poles and Piles" },
  { value: "Raw Materials", label: "Raw Materials" },
  { value: "Job Work Material", label: "Job Work Material" },
  { value: "Machinery", label: "Machinery" },
  { value: "Others", label: "Others" },
];

// Shared column set/order for the HTML table and the PDF export (they match exactly in Angular).
// `pct: true` columns render as `${value}%`.
const TABLE_COLUMNS: { header: string; key: string; pct?: boolean }[] = [
  { header: "Reference No", key: "REFERENCE_NUMBER" },
  { header: "SAP Type", key: "SAP_NONSAP" },
  { header: "Financial Year", key: "FINANCIAL_YEAR" },
  { header: "Month", key: "MONTH" },
  { header: "Plant", key: "PLANT" },
  { header: "Division", key: "DIVISION" },
  { header: "Sub Division", key: "SUB_DIVISION" },
  { header: "Customer", key: "CUSTOMER" },
  { header: "Customer Group", key: "CUSTOMER_GROUP" },
  { header: "Destination Location", key: "DESTINATION_LOCATION" },
  { header: "Destination State", key: "DESTINATION_STATE" },
  { header: "Destination Zone", key: "DESTINATION_ZONE" },
  { header: "Product", key: "PRODUCT" },
  { header: "Type of Material", key: "TYPE_OF_MATERIAL" },
  { header: "Material Description", key: "MATERIAL_DESCRIPTION" },
  { header: "Battery Condition", key: "BATTERY_CONDITION" },
  { header: "Inco Terms", key: "INCO_TERMS" },
  { header: "Transporter Name", key: "TRANSPORTER_NAME" },
  { header: "Type of Vehicle", key: "TYPE_OF_VEHICLE" },
  { header: "GSTIN No", key: "GSTIN_NO" },
  { header: "ODN Number", key: "ODN_NUMBER" },
  { header: "Date", key: "DATE" },
  { header: "Basic Invoice Amount", key: "BASIC_INVOICE_AMOUNT" },
  { header: "Physical Dispatch Date", key: "PHYSICAL_DISPATCH_DATE" },
  { header: "Transporter Group", key: "TRANSPORTER_GROUP" },
  { header: "No of Vehicle", key: "NO_OF_VEHICLE" },
  { header: "Vehicle Passing Weight", key: "VEHICLE_PASSING_WEIGHT" },
  { header: "Actual Load", key: "ACTUAL_LOAD" },
  { header: "Loading Factor Weight", key: "LOADING_FACTOR_WEIGHT" },
  { header: "Vehicle Volume", key: "VEHICLE_VOLUME" },
  { header: "% of Volume Occupied", key: "%_OF_VOLUME_OCCUPIED", pct: true },
  { header: "Shipment Volume", key: "SHIPMENT_VOLUME" },
  { header: "Total Freight", key: "TOTAL_FREIGHT" },
  { header: "AH Loaded in Truck", key: "AH_LOADED_IN_THE_TRUCK" },
  { header: "Freight AH", key: "FREIGHT_AH" },
  { header: "Distance KM", key: "DISTANCE_KILLOMETER" },
  { header: "Cost KM", key: "COST_KM" },
  { header: "Cost Ton KM", key: "COST_TON_KM" },
  { header: "Freight Cost Over Sales", key: "FREIGHT_COST_OVER_SALES" },
  { header: "Cost Ton Passing Weight", key: "COST_TON_AS_PER_PASSING_WEIGHT" },
  { header: "Cost Ton Actual Load", key: "COST_TON_AS_PER_ACTUAL_LOAD" },
  { header: "Total Cost Passing Weight", key: "TOTAL_COST_PASSING_WEIGHT" },
  { header: "Total Cost Actual Load", key: "TOTAL_COST_AS_PER_ACTUAL_LOAD" },
  { header: "Percentage", key: "PERCENTAGE", pct: true },
];

function getLoggedInUser(): any {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

// Mirrors Angular LoadingFactorCostComponent.createArray
function createArray(value: any, key: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((v) => ({ [key]: v }));
  }
  return [{ [key]: value }];
}

// Mirrors Angular LoadingFactorCostComponent.formatDate
function formatDate(date: string) {
  if (!date) return "";
  return date.split("-").join("");
}

// Mirrors the export functions' `(row[x] || row[x] === 0) ? row[x] + '%' : ''`
function pctOrEmpty(value: any) {
  return value || value === 0 ? `${value}%` : "";
}

export const Route = createFileRoute("/reports/loading-factor-cost")({
  component: LoadingFactorCostReport,
});

function LoadingFactorCostReport() {
  // Filter form state (mirrors Angular Pendingform controls)
  const [inout, setInout] = useState<string[]>([]);
  const [sapType, setSapType] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [transGroup, setTransGroup] = useState<string[]>([]);
  const [transporter, setTransporter] = useState<string[]>([]);
  const [werks, setWerks] = useState<string[]>([]);
  const [matnr, setMatnr] = useState<string[]>([]);
  const [division, setDivision] = useState<string[]>([]);
  const [customerGroup, setCustomerGroup] = useState<string[]>([]);
  const [customer, setCustomer] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [branchZone, setBranchZone] = useState<string[]>([]);
  const [destLocation, setDestLocation] = useState<string[]>([]);
  const [destState, setDestState] = useState<string[]>([]);
  const [segment, setSegment] = useState<string[]>([]);
  const [incoterms, setIncoterms] = useState<string[]>([]);

  const [touched, setTouched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);

  // Master dropdown data (mirrors Angular component properties)
  const [plantList, setPlantList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const [transporterList, setTransporterList] = useState<any[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [incotermsList, setIncotermsList] = useState<any[]>([]);
  const [destLocationList, setDestLocationList] = useState<any[]>([]);
  const [destStateZoneList, setDestStateZoneList] = useState<any[]>([]);
  const [segmentList, setSegmentList] = useState<any[]>([]);
  const [customergroupList, setCustomergroupList] = useState<any[]>([]);

  // ngOnInit equivalent
  useEffect(() => {
    // getTransporters()
    (async () => {
      try {
        const res: any = await service.fetchVendorCode();
        setTransporterList(res?.[0]?.VEND_CODE || []);
      } catch (err) {
        console.error("Error fetching transporters", err);
        setTransporterList([]);
      }
    })();

    // fetchpdb()
    (async () => {
      try {
        const res: any = await service.getpdb();
        const list = (res?.[0]?.CUSTOMER || []).map((item: any) => ({
          ...item,
          searchText: `${item.CUSTOMER} - ${item.CUSTOMER_NAME}`,
        }));
        setCustomerList(list);
      } catch (err) {
        console.error("PDB Fetch Error:", err);
      }
    })();

    // getBranches()
    (async () => {
      try {
        const res: any = await service.getssc();
        if (res && res.length > 0) {
          const data = res[0];
          setBranchList(data.BRANCH || []);
          setSegmentList(data.SEGMENTS || []);
          setDestLocationList(data.DEST_LOC || []);
          setDestStateZoneList(data.DEST_STZ || []);
          setCustomergroupList(data.CUSTGRP || []);
        }
      } catch (err) {
        console.error("F4 fetch error", err);
        Swal.fire("Error", "Failed to load master dropdown data (F4).", "error");
      }
    })();

    // fetchIncoterms()
    (async () => {
      try {
        const res: any = await service.Incoterms({ INCO1: "", BEZEI: "" });
        setIncotermsList(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error("Error fetching Incoterms:", err);
      }
    })();

    const userData = getLoggedInUser();
    setPlantList(userData.PLANTS || []);
    setDivisionList(userData.DIV || []);
  }, []);

  const plantOptions: Option[] = useMemo(
    () => plantList.map((p: any) => ({ label: p.PLANT_TEXT, value: p.PLANT_TEXT })),
    [plantList],
  );
  const divisionOptions: Option[] = useMemo(
    () => divisionList.map((d: any) => ({ label: d.DIV_TEXT, value: d.DIVISION })),
    [divisionList],
  );
  const transporterOptions: Option[] = useMemo(
    () => transporterList.map((t: any) => ({ label: t.TRANSPORTER, value: t.TRANSPORTER })),
    [transporterList],
  );
  const customerOptions: Option[] = useMemo(
    () => customerList.map((c: any) => ({ label: c.searchText, value: c.CUSTOMER })),
    [customerList],
  );
  const customerGroupOptions: Option[] = useMemo(
    () => customergroupList.map((c: any) => ({ label: c.ZCUST_GRP, value: c.ZCUST_GRP })),
    [customergroupList],
  );
  const branchOptions: Option[] = useMemo(
    () => branchList.map((b: any) => ({ label: b.BRANCH_DESC, value: b.BRANCH_DESC })),
    [branchList],
  );
  const branchZoneOptions: Option[] = useMemo(
    () => branchList.map((b: any) => ({ label: b.BZONE, value: b.BRANCH_ZONE })),
    [branchList],
  );
  const destStateOptions: Option[] = useMemo(
    () => destStateZoneList.map((d: any) => ({ label: d.DEST_STATE, value: d.DEST_STATE })),
    [destStateZoneList],
  );
  const destLocationOptions: Option[] = useMemo(
    () => destLocationList.map((d: any) => ({ label: d.DLOC, value: d.DLOC })),
    [destLocationList],
  );
  const segmentOptions: Option[] = useMemo(
    () => segmentList.map((s: any) => ({ label: s.SEGMENT_DESC, value: s.SEGMENT_DESC, meta: s.SEGMENT })),
    [segmentList],
  );
  const incotermsOptions: Option[] = useMemo(
    () => incotermsList.map((i: any) => ({ label: `${i.INCO1} - ${i.BEZEI}`, value: i.INCO1 })),
    [incotermsList],
  );

  const inoutInvalid = touched && inout.length === 0;
  const fromDateInvalid = touched && !fromDate;
  const toDateInvalid = touched && !toDate;

  // onSearch()
  const onSearch = async () => {
    setTouched(true);

    if (inout.length === 0 || !fromDate || !toDate) {
      Swal.fire({
        icon: "warning",
        title: "Validation Error",
        text: "Please fill all mandatory fields",
        confirmButtonText: "OK",
      });
      return;
    }

    const payload = {
      inward_outward: createArray(inout, "inout"),
      from_date: formatDate(fromDate),
      to_date: formatDate(toDate),
      sap_nonsap: createArray(sapType, "type"),
      // NOTE: case-sensitive keys preserved exactly as in the Angular source
      transporter_group: createArray(transGroup, "TRANSPORTER_GROUP"),
      transporter: createArray(transporter, "TRANSPORTER"),
      plant: createArray(werks, "plant"),
      product: createArray(matnr, "product"),
      division: createArray(division, "DIVISION"),
      customer_group: createArray(customerGroup, "CUSTOMER_GROUP"),
      branch: createArray(branch, "branch"),
      branch_zone: createArray(branchZone, "branch_zone"),
      destination_location: createArray(destLocation, "destination_location"),
      destination_state: createArray(destState, "destination_state"),
      segment: createArray(segment, "segment"),
      customer: createArray(customer, "CUSTOMER"),
      incoterms: createArray(incoterms, "incoterms"),
    };
    console.log("Payload:", payload);

    setIsSearching(true);

    try {
      const res: any = await service.FetchLoadingFactorandCost(payload);
      console.log("API Response:", res);

      // CASE 1: API returns error object
      if (res && res.ERROR_TYPE === "E") {
        setFilteredData([]);

        Swal.fire({
          icon: "warning",
          title: "No Data",
          text: res.MESSAGE,
          confirmButtonText: "OK",
        });

        return;
      }

      // CASE 2: API returns actual data (array)
      const data = res || [];
      setFilteredData(data);
      setOriginalData(data);

      if (data.length > 0) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Data Fetched Successfully",
          confirmButtonText: "OK",
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "No Data",
          text: res.MESSAGE,
          confirmButtonText: "OK",
        });
      }
    } catch (err) {
      console.error("API Error:", err);
      setFilteredData([]);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch data. Please try again.",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // onFilter()
  const onFilter = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value.toLowerCase();
    setFilteredData(
      originalData.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(value)),
      ),
    );
  };

  // resetForm()
  const resetForm = () => {
    setInout([]);
    setSapType([]);
    setFromDate("");
    setToDate("");
    setTransGroup([]);
    setTransporter([]);
    setWerks([]);
    setMatnr([]);
    setDivision([]);
    setCustomerGroup([]);
    setCustomer([]);
    setBranch([]);
    setBranchZone([]);
    setDestLocation([]);
    setDestState([]);
    setSegment([]);
    setIncoterms([]);
    setTouched(false);
    setFilteredData([]);
  };

  // downloadExcel()
  const downloadExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("Warning", "No data available to download.", "warning");
      return;
    }

    const exportData = filteredData.map((row: any) => ({
      "Reference No": row.REFERENCE_NUMBER || "",
      "SAP Type": row.SAP_NONSAP || "",
      "Financial Year": row.FINANCIAL_YEAR || "",
      Month: row.MONTH || "",
      Plant: row.PLANT || "",
      Division: row.DIVISION || "",
      "Sub Division": row.SUB_DIVISION || "",
      Customer: row.CUSTOMER || "",
      "Customer Group": row.CUSTOMER_GROUP || "",
      "Destination Location": row.DESTINATION_LOCATION || "",
      "Destination State": row.DESTINATION_STATE || "",
      "Destination Zone": row.DESTINATION_ZONE || "",
      Product: row.PRODUCT || "",
      "Type of Material": row.TYPE_OF_MATERIAL || "",
      "Material Description": row.MATERIAL_DESCRIPTION || "",
      "Battery Condition": row.BATTERY_CONDITION || "",
      "Inco Terms": row.INCO_TERMS || "",
      "Transporter Name": row.TRANSPORTER_NAME || "",
      "Transporter Group": row.TRANSPORTER_GROUP || "",
      Date: row.DATE || "",
      "Basic Invoice Amount": row.BASIC_INVOICE_AMOUNT || "",
      "Physical Dispatch Date": row.PHYSICAL_DISPATCH_DATE || "",
      "No of Vehicle": row.NO_OF_VEHICLE || "",
      "Vehicle Passing Weight": row.VEHICLE_PASSING_WEIGHT || "",
      "Actual Load": row.ACTUAL_LOAD || "",
      "Loading Factor Weight": row.LOADING_FACTOR_WEIGHT || "",
      "Vehicle Volume": row.VEHICLE_VOLUME || "",
      "% of Volume Occupied": pctOrEmpty(row["%_OF_VOLUME_OCCUPIED"]),
      "Shipment Volume": row.SHIPMENT_VOLUME || "",
      "Total Freight": row.TOTAL_FREIGHT || "",
      "AH Loaded in Truck": row.AH_LOADED_IN_THE_TRUCK || "",
      "Freight AH": row.FREIGHT_AH || "",
      "Distance KM": row.DISTANCE_KILLOMETER || "",
      "Cost KM": row.COST_KM || "",
      "Cost Ton KM": row.COST_TON_KM || "",
      "Freight Cost Over Sales": row.FREIGHT_COST_OVER_SALES || "",
      "Cost Ton Passing Weight": row.COST_TON_AS_PER_PASSING_WEIGHT || "",
      "Cost Ton Actual Load": row.COST_TON_AS_PER_ACTUAL_LOAD || "",
      "Total Cost Passing Weight": row.TOTAL_COST_PASSING_WEIGHT || "",
      "Total Cost Actual Load": row.TOTAL_COST_AS_PER_ACTUAL_LOAD || "",
      Percentage: pctOrEmpty(row.PERCENTAGE),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Loading Factor Report");
    XLSX.writeFile(wb, "Loading_Factor_Cost_Report.xlsx");

    Swal.fire("Success", "Excel downloaded successfully.", "success");
  };

  // downloadPDF()
  const downloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("Warning", "No data available to download.", "warning");
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");

    const tableColumn = TABLE_COLUMNS.map((c) => c.header);

    const tableRows = filteredData.map((row: any) =>
      TABLE_COLUMNS.map((c) => (c.pct ? pctOrEmpty(row[c.key]) : row[c.key] || "")),
    );

    doc.text("Loading Factor Cost Report", 14, 10);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 6,
        cellPadding: 1,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        fontSize: 6,
      },
      margin: { left: 5, right: 5 },
    });

    doc.save("Loading_Factor_Cost_Report.pdf");

    Swal.fire("Success", "PDF downloaded successfully.", "success");
  };

  return (
    <div className="flex flex-col h-full"><div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <BarChart3 className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Loading Factor &amp; Cost Report
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Vehicle loading factor and cost-per-ton trends.
          </p>
        </div>
      </div>

      {/* FILTER CARD */}
      </div><div className="flex-1 overflow-y-auto scrollbar-elegant px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-5">
            <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-5">
          <MultiSelectField
            label="Inward/Outward"
            options={INOUT_OPTIONS}
            value={inout}
            onChange={setInout}
            error={inoutInvalid ? "Inward/Outward is required" : undefined}
          />

          <MultiSelectField
            label="Sap/Nonsap"
            options={SAPTYPE_OPTIONS}
            value={sapType}
            onChange={setSapType}
          />

          <DateField
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
            error={fromDateInvalid ? "From Date is required" : undefined}
          />

          <DateField
            label="To Date"
            value={toDate}
            onChange={setToDate}
            error={toDateInvalid ? "To Date is required" : undefined}
          />

          <MultiSelectField
            label="Transporter Group"
            options={TRANS_GROUP_OPTIONS}
            value={transGroup}
            onChange={setTransGroup}
            searchable
          />

          <MultiSelectField
            label="Transporter"
            options={transporterOptions}
            value={transporter}
            onChange={setTransporter}
            searchable
          />

          <MultiSelectField
            label="Plant"
            options={plantOptions}
            value={werks}
            onChange={setWerks}
            searchable
          />

          <MultiSelectField
            label="Product"
            options={PRODUCT_OPTIONS}
            value={matnr}
            onChange={setMatnr}
            searchable
          />

          <MultiSelectField
            label="Division"
            options={divisionOptions}
            value={division}
            onChange={setDivision}
            searchable
            renderOption={(o) => `${o.value} - ${o.label}`}
          />

          <MultiSelectField
            label="Customer Group"
            options={customerGroupOptions}
            value={customerGroup}
            onChange={setCustomerGroup}
            searchable
          />

          <MultiSelectField
            label="Branch"
            options={branchOptions}
            value={branch}
            onChange={setBranch}
            searchable
          />

          <MultiSelectField
            label="Branch Zone"
            options={branchZoneOptions}
            value={branchZone}
            onChange={setBranchZone}
            searchable
          />

          <MultiSelectField
            label="Destination State"
            options={destStateOptions}
            value={destState}
            onChange={setDestState}
            searchable
          />

          <MultiSelectField
            label="Destination Location"
            options={destLocationOptions}
            value={destLocation}
            onChange={setDestLocation}
            searchable
          />

          <MultiSelectField
            label="Segment"
            options={segmentOptions}
            value={segment}
            onChange={setSegment}
            searchable
            renderOption={(o) => `${o.meta} - ${o.label}`}
          />

          <MultiSelectField
            label="Customer Name"
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
            searchable
          />

          <MultiSelectField
            label="Incoterms"
            options={incotermsOptions}
            value={incoterms}
            onChange={setIncoterms}
            searchable
          />
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={resetForm}
            className="h-9 px-4 rounded-md border border-input bg-background text-foreground text-[12.5px] font-semibold hover:bg-muted inline-flex items-center justify-center gap-2"
          >
            <RotateCcw className="size-3.5" />
            Clear Filters
          </button>
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearching}
            className="h-9 px-5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
          >
            <Filter className="size-3.5" />
            {isSearching ? "Executing..." : "Execute Report"}
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
        <div className="px-5 py-4 border-b border-hairline flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
            Loading Factor &amp; Cost Data
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-muted-foreground">Search:</label>
            <input
              type="text"
              onChange={onFilter}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              onClick={downloadExcel}
              className="h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5"
            >
              <FileSpreadsheet className="size-3.5" />
              Export Excel
            </button>
            <button
              onClick={downloadPDF}
              className="h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5"
            >
              <FileText className="size-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="p-12 grid place-items-center text-center">
            <div className="size-14 rounded-full bg-muted grid place-items-center mb-4">
              <BarChart3 className="size-7 text-muted-foreground" />
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              Fill filters and click execute to see results.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                  {TABLE_COLUMNS.map((c) => (
                    <th key={c.key} className="px-3 py-2.5 whitespace-nowrap text-left">
                      {c.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {filteredData.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                    {TABLE_COLUMNS.map((c) => (
                      <td key={c.key} className="px-3 py-2 whitespace-nowrap">
                        {c.pct ? `${row[c.key] ?? ""}%` : row[c.key]}
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
  );
}

function MultiSelectField({
  label,
  options,
  value,
  onChange,
  searchable = false,
  error,
  renderOption,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
  error?: string;
  renderOption?: (o: Option) => string;
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

  const filtered = searchable && search
    ? options.filter((o) => o.label?.toLowerCase().includes(search.toLowerCase()))
    : options;

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
                <input
                  type="checkbox"
                  checked={value.includes(o.value)}
                  onChange={() => toggle(o.value)}
                  className="size-3.5"
                />
                <span className="truncate">{renderOption ? renderOption(o) : o.label}</span>
              </label>
            ))
          )}
        </div>
      )}

      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}

function DateField({
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
      <label className={LABEL}>{label}</label>
      <div className="relative">
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(INPUT, "pr-9", error && "border-destructive")}
        />
        <Calendar className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
    </div>
  );
}
