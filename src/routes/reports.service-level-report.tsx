import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Settings,
  FileSpreadsheet,
  FileText,
  Calendar,
  RotateCcw,
  Search,
  ChevronDown,
  Check,
  Loader2,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

/* ------------------------------------------------------------------ */
/*  Shared style tokens (kept consistent with the rest of the app)     */
/* ------------------------------------------------------------------ */

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

/* ------------------------------------------------------------------ */
/*  Static option lists (mirrors the Angular component)                */
/* ------------------------------------------------------------------ */

type Option = { value: string; label: string };

const INOUT_OPTIONS: Option[] = [
  { value: "INWARD", label: "Inward" },
  { value: "OUTWARD", label: "Outward" },
];

const SAP_TYPE_OPTIONS: Option[] = [
  { value: "SAP", label: "SAP" },
  { value: "NONSAP", label: "Non-SAP" },
];

const TRANS_GROUP_OPTIONS: Option[] = [
  { value: "FULL TRUCK LOAD", label: "FULL TRUCK LOAD" },
  { value: "CARGO", label: "CARGO" },
  // { value: "RATECONTRACT", label: "RATE CONTRACT" },
  // { value: "LOCALTRANSPORTATION", label: "LOCAL TRANSPORTATION" },
  // { value: "CUSTOMERTRANSPORTER", label: "CUSTOMER TRANSPORTER" },
  // { value: "COMPANYVEHICLE", label: "COMPANY VEHICLE" },
  // { value: "COURIER", label: "COURIER" },
  // { value: "BYHAND", label: "BY HAND" },
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

const DETAILED_COLUMNS: { key: string; label: string }[] = [
  { key: "REFERENCE_NUMBER", label: "Reference No" },
  { key: "SAP_NONSAP", label: "SAP Type" },
  { key: "FINANCIAL_YEAR", label: "Financial Year" },
  { key: "MONTH", label: "Month" },
  { key: "PLANT", label: "Plant" },
  { key: "TRANSPORTER_GROUP", label: "Transporter Group" },
  { key: "TRANSPORTER", label: "Transporter" },
  { key: "LR_NUMBER", label: "LR Number" },
  { key: "LR_DATE", label: "LR Date" },
  { key: "DIVISION", label: "Division" },
  { key: "SUB_DIVISION", label: "Sub Division" },
  { key: "CUSTOMER_GROUP", label: "Customer Group" },
  { key: "CUSTOMER", label: "Customer" },
  { key: "NO_OF_VEHICLES_PLACED", label: "No Of Vehicles" },
  { key: "VEHICLE_TYPE", label: "Vehicle Type" },
  { key: "ON_TIME_PLACEMENT", label: "On Time Placement" },
  { key: "TRANSHIPMENT_IF_ANY", label: "Transhipment" },
  { key: "ON_TIME_DELIVERY", label: "On Time Delivery" },
  { key: "DAMAGE_IF_ANY", label: "Damage" },
  { key: "ACCIDENT_IF_ANY", label: "Accident" },
  { key: "TOTAL_SCORE", label: "Total Score" },
  { key: "FEEDBACK_SUBMITTED_DATE", label: "Feedback Date" },
  { key: "FEEDBACK_FROM_USER", label: "Feedback" },
];

const SUMMARY_COLUMNS: { key: string; label: string }[] = [
  { key: "TRANSPORTER_GROUP", label: "Transporter Group" },
  { key: "TRANSPORTER", label: "Transporter" },
  { key: "NO_OF_FEEDBACKS", label: "No Of Feedbacks" },
  { key: "NO_OF_VEHICLE_PLACED", label: "No Of Vehicles" },
  { key: "ON_TIME_PLACEMENT_PER", label: "On Time Placement %" },
  { key: "TRANSHIPMENT_IF_ANY_PER", label: "Transhipment %" },
  { key: "ON_TIME_DELIVERY_PER", label: "On Time Delivery %" },
  { key: "DAMAGE_IF_ANY_PER", label: "Damage %" },
  { key: "ACCIDENT_IF_ANY_PER", label: "Accident %" },
  { key: "PROB_MAT_LOAD_DURING_TRANS_PER", label: "Problem Material Load %" },
  { key: "OTH_MAT_LOAD_DURING_TRANS_PER", label: "Other Material Load %" },
  { key: "ON_TIME_POD_SUBMISSION_PER", label: "POD Submission %" },
  { key: "ON_TIME_FREIGHT_BILL_SUB_PER", label: "Freight Bill Submission %" },
  { key: "OVERALL_FEEDBACK_FROM_USER_PER", label: "Overall Feedback %" },
];

/* ------------------------------------------------------------------ */
/*  Form shape                                                         */
/* ------------------------------------------------------------------ */

interface ServiceLevelForm {
  INOUT: string[];
  SAPTYPE: string[];
  FROM_DATE: string;
  TO_DATE: string;
  TRANS_GROUP: string[];
  TRANSPORTER: string[];
  WERKS: string[];
  MATNR: string[];
  DIVISION: string[];
  CUSTOMER: string[];
  SEGMENT: string[];
  CUSTOMER_GROUP: string[];
  BRANCH: string[];
  BRANCH_ZONE: string[];
  DEST_LOCATION: string[];
  DEST_STATE: string[];
  DEST_ZONE: string[];
  INCOTERMS: string[];
  REPORT_TYPE: "Detailed" | "Summary" | "";
}

const EMPTY_FORM: ServiceLevelForm = {
  INOUT: [],
  SAPTYPE: [],
  FROM_DATE: "",
  TO_DATE: "",
  TRANS_GROUP: [],
  TRANSPORTER: [],
  WERKS: [],
  MATNR: [],
  DIVISION: [],
  CUSTOMER: [],
  SEGMENT: [],
  CUSTOMER_GROUP: [],
  BRANCH: [],
  BRANCH_ZONE: [],
  DEST_LOCATION: [],
  DEST_STATE: [],
  DEST_ZONE: [],
  INCOTERMS: [],
  REPORT_TYPE: "Detailed",
};

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/reports/service-level-report")({
  component: ServiceLevelReport,
});

function ServiceLevelReport() {
  const [form, setForm] = useState<ServiceLevelForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  // Master data (mirrors Angular's F4 lookups)
  const [plantList, setPlantList] = useState<Option[]>([]);
  const [divisionList, setDivisionList] = useState<Option[]>([]);
  const [transporterList, setTransporterList] = useState<Option[]>([]);
  const [branchList, setBranchList] = useState<any[]>([]);
  const [segmentList, setSegmentList] = useState<Option[]>([]);
  const [destLocationList, setDestLocationList] = useState<Option[]>([]);
  const [destStateZoneList, setDestStateZoneList] = useState<any[]>([]);
  const [customerGroupList, setCustomerGroupList] = useState<Option[]>([]);
  const [customerList, setCustomerList] = useState<Option[]>([]);
  const [incotermsList, setIncotermsList] = useState<Option[]>([]);

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [selectedReportType, setSelectedReportType] = useState<"Detailed" | "Summary" | "">("");
  const [loading, setLoading] = useState(false);

  /* ---------------------------- lookups ---------------------------- */

  useEffect(() => {
    fetchTransportersPlantsDivisions();
    fetchBranches();
    fetchCustomers();
    fetchIncoterms();
  }, []);

  // Transporter F4 — also derives Plant F4 + Division F4 from the same payload
  // (mirrors Insurance Report's fetchTransportersPlantsDivisions())
  async function fetchTransportersPlantsDivisions() {
    setLoading(true);
    try {
      const res: any = await service.fetchVendorCode();
      const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

      const transporters = data?.VEND_CODE || [];
      setTransporterList(
        transporters.map((t: any) => ({ value: t.TRANSPORTER, label: t.TRANSPORTER }))
      );

      const plants = Array.isArray(data.PLANT)
        ? data.PLANT.map((p: any) => ({
            PLANT: p.WERKS || p.PLANT,
            PLANT_TEXT: p.PLANT_DESC || p.PLANT_TEXT || p.PLANT,
          }))
        : [];

      // Plant option label shows "CODE - Description", value stays as description text
      setPlantList(
        plants.map((p: any) => ({
          value: p.PLANT_TEXT,
          label: `${p.PLANT} - ${p.PLANT_TEXT}`,
        }))
      );

      const divisions = Array.isArray(data.PLANT)
        ? Array.from(
            new Map(
              data.PLANT.map((p: any) => [
                p.DIVISION,
                { DIVISION: p.DIVISION, DIV_TEXT: p.DIV_TEXT || p.DIVISION },
              ]),
            ).values(),
          )
        : [];

      // Division label mirrors Insurance Report's current divisionOptions
      setDivisionList(
        divisions.map((d: any) => ({
          value: d.DIVISION,
          label: d.DIVISION,
        }))
      );
    } catch (e) {
      console.error("Error fetching transporters/plant/division", e);
      setTransporterList([]);
      setPlantList([]);
      setDivisionList([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBranches() {
    try {
      const res: any = await service.getssc();
      if (res && res.length > 0) {
        const data = res[0];

        setBranchList(data.BRANCH || []);

        setSegmentList(
          (data.SEGMENTS || []).map((s: any) => ({
            value: s.SEGMENT_DESC,
            label: s.SEGMENT ? `${s.SEGMENT} - ${s.SEGMENT_DESC}` : s.SEGMENT_DESC,
          }))
        );

        setDestLocationList(
          (data.DEST_LOC || []).map((d: any) => ({ value: d.DLOC, label: d.DLOC }))
        );

        setDestStateZoneList(data.DEST_STZ || []);

        setCustomerGroupList(
          (data.CUSTGRP || []).map((c: any) => ({
            value: c.ZCUST_GRP,
            label: c.ZCUST_GRP,
          }))
        );
      }
    } catch (e) {
      console.error("F4 fetch error", e);
      showToast("error", "Error", "Failed to load master dropdown data (F4).");
    }
  }

  async function fetchCustomers() {
    try {
      const res: any = await service.getpdb();
      const list = res?.[0]?.CUSTOMER || [];
      setCustomerList(
        list.map((c: any) => ({
          value: c.CUSTOMER,
          label: `${c.CUSTOMER} - ${c.CUSTOMER_NAME}`,
        }))
      );
    } catch (e) {
      console.error("PDB fetch error", e);
    }
  }

  async function fetchIncoterms() {
    try {
      const res: any = await service.Incoterms({ INCO1: "", BEZEI: "" });
      const list = Array.isArray(res) ? res : res?.data || [];
      setIncotermsList(
        list.map((i: any) => ({ value: i.INCO1, label: `${i.INCO1} - ${i.BEZEI}` }))
      );
    } catch (e) {
      console.error("Error fetching Incoterms:", e);
    }
  }

  // destStateZoneList carries both DEST_STATE and DZONE fields; derive a
  // dedicated options list for the "Destination Zone" dropdown (value = DEST_ZONE, label = DZONE)
  const destStateOptions: Option[] = useMemo(
    () =>
      destStateZoneList.map((d: any) => ({
        value: d.DEST_STATE,
        label: d.DEST_STATE,
      })),
    [destStateZoneList]
  );

  const destZoneOptions: Option[] = useMemo(
    () =>
      destStateZoneList.map((d: any) => ({
        value: d.DEST_ZONE,
        label: d.DZONE,
      })),
    [destStateZoneList]
  );

  /* ---------------------------- helpers ---------------------------- */

  function createArray(value: string | string[] | undefined, key: string) {
    if (!value || (Array.isArray(value) && value.length === 0)) return [];
    if (Array.isArray(value)) return value.map((v) => ({ [key]: v }));
    return [{ [key]: value }];
  }

  function formatDate(date: string) {
    if (!date) return "";
    return date.split("-").join("");
  }

  function showToast(type: "success" | "warning" | "error", title: string, message: string) {
    Swal.fire({ icon: type, title, text: message });
  }

  function setField<K extends keyof ServiceLevelForm>(key: K, value: ServiceLevelForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isInvalid =
    form.INOUT.length === 0 || !form.FROM_DATE || !form.TO_DATE || !form.REPORT_TYPE;

  /* ---------------------------- actions ---------------------------- */

  async function onSearch() {
    setSubmitted(true);

    if (isInvalid) {
      showToast("warning", "Validation", "Please fill required fields");
      return;
    }

    setSelectedReportType(form.REPORT_TYPE as "Detailed" | "Summary");

    const payload = {
      inward_outward: createArray(form.INOUT, "inout"),
      from_date: formatDate(form.FROM_DATE),
      to_date: formatDate(form.TO_DATE),
      sap_nonsap: createArray(form.SAPTYPE, "type"),
      transporter_group: createArray(form.TRANS_GROUP, "transporter_group"),
      transporter: createArray(form.TRANSPORTER, "transporter"),
      plant: createArray(form.WERKS, "plant"),
      product: createArray(form.MATNR, "product"),
      division: createArray(form.DIVISION, "division"),
      customer_group: createArray(form.CUSTOMER_GROUP, "customer_group"),
      segment: createArray(form.SEGMENT, "segment"),
      customer: createArray(form.CUSTOMER, "customer"),
      destination_location: createArray(form.DEST_LOCATION, "destination_location"),
      destination_state: createArray(form.DEST_STATE, "destination_state"),
      destination_zone: createArray(form.DEST_ZONE, "destination_zone"),
      incoterms: createArray(form.INCOTERMS, "incoterms"),
      vehicle: createArray(form.TRANS_GROUP, "vehicle"),
      mode: form.REPORT_TYPE,
    };

    setLoading(true);
    try {
      const res: any = await service.FetchServiceLevelReports(payload);

      if (res?.ERROR_TYPE === "E") {
        setFilteredData([]);
        setOriginalData([]);
        showToast("warning", "No Data", res?.MESSAGE || "No records found");
        return;
      }

      if (!Array.isArray(res)) {
        setFilteredData([]);
        setOriginalData([]);
        return;
      }

      setFilteredData(res);
      setOriginalData(res);

      if (res.length > 0) {
        showToast("success", "Success", "Data fetched successfully!");
      } else {
        showToast("warning", "No Data", "No records found");
      }
    } catch (e) {
      console.error("API Error:", e);
      setFilteredData([]);
      setOriginalData([]);
      showToast("error", "Error", "Failed to fetch data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setSubmitted(false);
    setFilteredData([]);
    setOriginalData([]);
    setSelectedReportType("");
  }

  function onFilter(value: string) {
    const v = value.toLowerCase();
    if (!v) {
      setFilteredData(originalData);
      return;
    }
    setFilteredData(
      originalData.filter((item) =>
        Object.values(item).some((val) => String(val).toLowerCase().includes(v))
      )
    );
  }

  function exportToExcel() {
    if (!filteredData || filteredData.length === 0) {
      showToast("warning", "No Data", "Nothing to export");
      return;
    }

    let exportData: any[] = [];
    let fileName = "";

    if (selectedReportType === "Detailed") {
      fileName = "Service_Level_Detailed_Report";
      exportData = filteredData.map((row) => {
        const obj: Record<string, any> = {};
        DETAILED_COLUMNS.forEach((c) => (obj[c.label] = row[c.key]));
        return obj;
      });
    } else if (selectedReportType === "Summary") {
      fileName = "Service_Level_Summary_Audit_Report";
      exportData = filteredData.map((row) => {
        const obj: Record<string, any> = {};
        SUMMARY_COLUMNS.forEach((c) => (obj[c.label] = row[c.key]));
        return obj;
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = { Sheets: { Report: worksheet }, SheetNames: ["Report"] };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  function downloadPDF() {
    if (!filteredData || filteredData.length === 0) {
      showToast("warning", "Warning", "No data available to download.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");

    const columns = selectedReportType === "Detailed" ? DETAILED_COLUMNS : SUMMARY_COLUMNS;
    const fileName =
      selectedReportType === "Detailed"
        ? "Service_Level_Detailed_Report"
        : "Service_Level_Summary_Audit_Report";

    const tableColumn = columns.map((c) => c.label);
    const tableRows = filteredData.map((row) => columns.map((c) => row[c.key]));

    doc.text(fileName, 14, 10);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 15,
      styles: { fontSize: 6, cellWidth: "wrap" },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save(`${fileName}.pdf`);
    showToast("success", "Success", "PDF downloaded successfully.");
  }

  const activeColumns = selectedReportType === "Summary" ? SUMMARY_COLUMNS : DETAILED_COLUMNS;

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
          <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
            <Settings className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
              Service Level
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              On-time delivery and service-level adherence by lane.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-elegant px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-5">
        {/* FILTER CARD */}
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3.5">
            <MultiSelectField
              label="Inward/Outward"
              options={INOUT_OPTIONS}
              value={form.INOUT}
              onChange={(v) => setField("INOUT", v)}
              required
              error={submitted && form.INOUT.length === 0 ? "Inward/Outward is required" : undefined}
            />

            <MultiSelectField
              label="SAP/Non-SAP"
              options={SAP_TYPE_OPTIONS}
              value={form.SAPTYPE}
              onChange={(v) => setField("SAPTYPE", v)}
            />

            <DateField
              label="From Date"
              value={form.FROM_DATE}
              onChange={(v) => setField("FROM_DATE", v)}
              error={submitted && !form.FROM_DATE ? "From Date is required" : undefined}
            />

            <DateField
              label="To Date"
              value={form.TO_DATE}
              onChange={(v) => setField("TO_DATE", v)}
              error={submitted && !form.TO_DATE ? "To Date is required" : undefined}
            />

            <MultiSelectField
              label="Transporter Group"
              options={TRANS_GROUP_OPTIONS}
              value={form.TRANS_GROUP}
              onChange={(v) => setField("TRANS_GROUP", v)}
            />

            <MultiSelectField
              label="Transporter"
              options={transporterList}
              value={form.TRANSPORTER}
              onChange={(v) => setField("TRANSPORTER", v)}
              searchable
            />

            <MultiSelectField
              label="Plant"
              options={plantList}
              value={form.WERKS}
              onChange={(v) => setField("WERKS", v)}
              searchable
            />

            <MultiSelectField
              label="Product"
              options={PRODUCT_OPTIONS}
              value={form.MATNR}
              onChange={(v) => setField("MATNR", v)}
              searchable
            />

            <MultiSelectField
              label="Division"
              options={divisionList}
              value={form.DIVISION}
              onChange={(v) => setField("DIVISION", v)}
              searchable
            />

            <MultiSelectField
              label="Customer Group"
              options={customerGroupList}
              value={form.CUSTOMER_GROUP}
              onChange={(v) => setField("CUSTOMER_GROUP", v)}
              searchable
            />

            <MultiSelectField
              label="Segment"
              options={segmentList}
              value={form.SEGMENT}
              onChange={(v) => setField("SEGMENT", v)}
              searchable
            />

            <MultiSelectField
              label="Customer Name"
              options={customerList}
              value={form.CUSTOMER}
              onChange={(v) => setField("CUSTOMER", v)}
              searchable
            />

            <MultiSelectField
              label="Destination Location"
              options={destLocationList}
              value={form.DEST_LOCATION}
              onChange={(v) => setField("DEST_LOCATION", v)}
              searchable
            />

            <MultiSelectField
              label="Destination State"
              options={destStateOptions}
              value={form.DEST_STATE}
              onChange={(v) => setField("DEST_STATE", v)}
              searchable
            />

            <MultiSelectField
              label="Destination Zone"
              options={destZoneOptions}
              value={form.DEST_ZONE}
              onChange={(v) => setField("DEST_ZONE", v)}
              searchable
            />

            <MultiSelectField
              label="Incoterms"
              options={incotermsList}
              value={form.INCOTERMS}
              onChange={(v) => setField("INCOTERMS", v)}
              searchable
            />
          </div>

          <div className="mt-4 pt-4 border-t border-hairline">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {(["Detailed", "Summary"] as const).map((opt) => (
                <label
                  key={opt}
                  className="inline-flex items-center gap-2 text-[12.5px] text-foreground cursor-pointer"
                >
                  <input
                    type="radio"
                    name="report-mode"
                    checked={form.REPORT_TYPE === opt}
                    onChange={() => setField("REPORT_TYPE", opt)}
                    className="size-3.5 accent-primary"
                  />
                  {opt === "Detailed" ? "Detailed" : "Summary for Audit"}
                </label>
              ))}
              {submitted && !form.REPORT_TYPE && (
                <span className="text-red-500 text-[11px]">Please select report type</span>
              )}
            </div>
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
              disabled={loading}
              className="h-9 px-5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              Execute Report
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
              Service Level Reports {selectedReportType && `— ${selectedReportType}`}
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[12px] text-muted-foreground">Search:</label>
              <input
                type="text"
                placeholder="Search..."
                onChange={(e) => onFilter(e.target.value)}
                className="h-8 w-48 rounded-md border border-input bg-background px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
              <button
                onClick={exportToExcel}
                className="h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileSpreadsheet className="size-3.5" />
                Export Excel
              </button>
              <button
                onClick={downloadPDF}
                className="h-8 px-3 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12px] font-semibold shadow-cta inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <FileText className="size-3.5" />
                Export PDF
              </button>
            </div>
          </div>

          <div>
            {filteredData.length === 0 ? (
              <div className="p-12 grid place-items-center text-center">
                <div className="size-14 rounded-full bg-muted grid place-items-center mb-4">
                  <Settings className="size-7 text-muted-foreground" />
                </div>
                <h3 className="font-display text-[15px] font-semibold text-foreground">
                  No data to display
                </h3>
                <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-md">
                  Fill filters and click{" "}
                  <span className="font-semibold text-foreground">Execute Report</span> to see
                  results.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[560px]">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                      {activeColumns.map((c) => (
                        <th key={c.key} className="px-3 py-2.5 whitespace-nowrap text-left">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {filteredData.map((row, idx) => (
                      <tr
                        key={idx}
                        className={
                          idx % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"
                        }
                      >
                        {activeColumns.map((c) => (
                          <td key={c.key} className="px-3 py-2 whitespace-nowrap text-foreground">
                            {row[c.key] ?? "-"}
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
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable multi-select (checkbox dropdown), replaces ng-select      */
/* ------------------------------------------------------------------ */

function MultiSelectField({
  label,
  options,
  value,
  onChange,
  searchable = false,
  required = false,
  error,
}: {
  label: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  searchable?: boolean;
  required?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchable || !query) return options;
    const q = query.toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v));
    } else {
      onChange([...value, v]);
    }
  }

  const summary =
    value.length === 0
      ? ""
      : value.length === 1
        ? options.find((o) => o.value === value[0])?.label || value[0]
        : `${value.length} Selected`;

  return (
    <div className="relative">
      <label className={LABEL}>
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          INPUT + " flex items-center justify-between text-left " + (value.length ? "" : "text-muted-foreground")
        }
      >
        <span className="truncate">{summary || "Select..."}</span>
        <ChevronDown className="size-3.5 shrink-0 opacity-60" />
      </button>

      {error && <span className="text-red-500 text-[11px] mt-1 block">{error}</span>}

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-md border border-input bg-background shadow-lg">
            {searchable && (
              <div className="p-2 sticky top-0 bg-background border-b border-hairline">
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search..."
                  className={INPUT}
                />
              </div>
            )}
            {filteredOptions.length === 0 && (
              <div className="px-3 py-2 text-[12px] text-muted-foreground">No options</div>
            )}
            {filteredOptions.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 text-[12.5px] text-foreground hover:bg-muted cursor-pointer"
              >
                <span
                  className={
                    "size-4 shrink-0 rounded border flex items-center justify-center " +
                    (value.includes(opt.value) ? "bg-accent border-accent text-white" : "border-input")
                  }
                >
                  {value.includes(opt.value) && <Check className="size-3" />}
                </span>
                <input
                  type="checkbox"
                  className="hidden"
                  checked={value.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                />
                <span className="truncate">{opt.label}</span>
              </label>
            ))}
          </div>
        </>
      )}
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
          className={INPUT + " pr-9"}
        />
        <Calendar className="size-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
      </div>
      {error && <span className="text-red-500 text-[11px] mt-1 block">{error}</span>}
    </div>
  );
}