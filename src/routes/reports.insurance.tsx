import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Shield,
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

// ⚠️ Adjust this import to wherever your generalService lives in this project.
// It should expose: FetchInsuranceReports, fetchVendorCode, getpdb, getssc, Incoterms

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

const DAMAGE_REMARK_OPTIONS: Option[] = [
  { value: "Packing material damage", label: "Packing material damage" },
  { value: "Pallet damage", label: "Pallet damage" },
  { value: "Cells damage", label: "Cells damage" },
  { value: "Cell Bank damage", label: "Cell Bank damage" },
  { value: "Can damage", label: "Can damage" },
  { value: "Accident", label: "Accident" },
  {
    value: "Prohibited material loading and seized by Police",
    label: "Prohibited material loading and seized by Police",
  },
  { value: "Damage during unloading", label: "Damage during unloading" },
  { value: "Material in wet condition", label: "Material in wet condition" },
  {
    value: "Damage due to other materials loaded",
    label: "Damage due to other materials loaded",
  },
];

const TABLE_COLUMNS: { key: string; label: string }[] = [
  { key: "REFERENCE_NUMBER", label: "Reference No" },
  { key: "INWARD_OUTWARD", label: "Inward / Outward" },
  { key: "SAP_NONSAP", label: "SAP Type" },
  { key: "INCIDENT_DATE", label: "Incident Date" },
  { key: "NATURE_OF_DAMAGE", label: "Nature of Damage" },
  { key: "PLANT", label: "Plant" },
  { key: "DIVISION", label: "Division" },
  { key: "CUSTOMER", label: "Customer" },
  { key: "PRODUCT", label: "Product" },
  { key: "PRODUCT_DESCRIPTION", label: "Product Description" },
  { key: "INVOICE_NUMBER", label: "Invoice Number" },
  { key: "INVOICE_DATE", label: "Invoice Date" },
  { key: "TRANSPORTER_GROUP", label: "Transporter Group" },
  { key: "TRANSPORTER", label: "Transporter" },
  { key: "LR_NO", label: "LR No" },
  { key: "FSR_REPORTED_DATE", label: "FSR Reported Date" },
  { key: "CLAIM_INFO_SENT", label: "Claim Info Sent" },
  { key: "CLAIM_REFERENCE", label: "Claim Reference" },
  { key: "LOSS_DECLARED", label: "Loss Declared" },
  { key: "SALVAGE_VALUE", label: "Salvage Value" },
  { key: "CLAIM_DOCUMENT_STATUS", label: "Claim Document Status" },
  { key: "COURIER_DETAILS", label: "Courier Details" },
  { key: "SETTLEMENT", label: "Settlement" },
  { key: "PAYMENT_STATUS", label: "Payment Status" },
  { key: "UTR_INFO", label: "UTR Info" },
  { key: "CLAIM_SETTLEMENT_DATE", label: "Claim Settlement Date" },
  { key: "CLAIM_STATUS", label: "Claim Status" },
];

/* ------------------------------------------------------------------ */
/*  Form shape                                                         */
/* ------------------------------------------------------------------ */

interface InsuranceForm {
  INOUT: string[];
  SAPTYPE: string[];
  FROM_DATE: string;
  TO_DATE: string;
  TRANS_GROUP: string[];
  TRANSPORTER: string[];
  WERKS: string[];
  DAMAGE_RMK: string[];
  INCIDENT_DATE: string;
  MATNR: string[];
  DIVISION: string[];
  CUSTOMER: string[];
  DEST_LOCATION: string[];
  INCOTERMS: string[];
}

const EMPTY_FORM: InsuranceForm = {
  INOUT: [],
  SAPTYPE: [],
  FROM_DATE: "",
  TO_DATE: "",
  TRANS_GROUP: [],
  TRANSPORTER: [],
  WERKS: [],
  DAMAGE_RMK: [],
  INCIDENT_DATE: "",
  MATNR: [],
  DIVISION: [],
  CUSTOMER: [],
  DEST_LOCATION: [],
  INCOTERMS: [],
};

/* ------------------------------------------------------------------ */
/*  Route                                                              */
/* ------------------------------------------------------------------ */

export const Route = createFileRoute("/reports/insurance")({
  component: InsuranceReport,
});

function InsuranceReport() {
  const [form, setForm] = useState<InsuranceForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);

  const [transporterList, setTransporterList] = useState<Option[]>([]);
  const [customerList, setCustomerList] = useState<Option[]>([]);
  const [plantList, setPlantList] = useState<Option[]>([]);
  const [divisionList, setDivisionList] = useState<Option[]>([]);
  const [destLocationList, setDestLocationList] = useState<Option[]>([]);
  const [incotermsList, setIncotermsList] = useState<Option[]>([]);

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------------------- lookups ---------------------------- */

  useEffect(() => {
    fetchTransportersPlantsDivisions();
    fetchCustomers();
    fetchBranchesAndLocations();
    fetchIncoterms();
  }, []);

  // Transporter F4 — also derives Plant F4 + Division F4 from the same payload
  // (mirrors Transit Eway Bill Report's getTransporters())
  async function fetchTransportersPlantsDivisions() {
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

      // Division label mirrors Transit Eway Bill Report's current divisionOptions
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

  async function fetchBranchesAndLocations() {
    try {
      const res: any = await service.getssc();
      if (res && res.length > 0) {
        const data = res[0];
        const destLoc = data.DEST_LOC || [];
        setDestLocationList(
          destLoc.map((d: any) => ({ value: d.DLOC, label: d.DLOC }))
        );
      }
    } catch (e) {
      console.error("F4 fetch error", e);
      showToast("error", "Error", "Failed to load master dropdown data (F4).");
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

  function showToast(
    type: "success" | "warning" | "error",
    title: string,
    message: string
  ) {
    Swal.fire({
      icon: type,
      title: title,
      text: message,
      timer: 2500,
      showConfirmButton: false,
      timerProgressBar: true,
    });
  }

  function setField<K extends keyof InsuranceForm>(
    key: K,
    value: InsuranceForm[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const isInvalid =
    form.INOUT.length === 0 || !form.FROM_DATE || !form.TO_DATE;

  /* ---------------------------- actions ---------------------------- */

  async function onSearch() {
    setSubmitted(true);

    if (isInvalid) {
      showToast("warning", "Validation Error", "Please fill all mandatory fields");
      return;
    }

    const payload = {
      inward_outward: createArray(form.INOUT, "inout"),
      from_date: formatDate(form.FROM_DATE),
      to_date: formatDate(form.TO_DATE),
      sap_nonsap: createArray(form.SAPTYPE, "type"),
      transporter_group: createArray(form.TRANS_GROUP, "TRANSPORTER_GROUP"),
      transporter: createArray(form.TRANSPORTER, "TRANSPORTER"),
      plant: createArray(form.WERKS, "plant"),
      damage_remarks: createArray(form.DAMAGE_RMK, "damage_remarks"),
      incident_date: createArray(form.INCIDENT_DATE, "incident_date"),
      product: createArray(form.MATNR, "product"),
      division: createArray(form.DIVISION, "DIVISION"),
      destination_location: createArray(form.DEST_LOCATION, "destination_location"),
      customer: createArray(form.CUSTOMER, "CUSTOMER"),
      incoterms: createArray(form.INCOTERMS, "incoterms"),
    };

    setLoading(true);
    try {
      const res: any = await service.FetchInsuranceReports(payload);

      if (res && res.ERROR_TYPE === "E") {
        setFilteredData([]);
        Swal.fire({
          icon: "warning",
          title: "No Data",
          text: res.MESSAGE,
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      const data = res || [];
      setFilteredData(data);
      setOriginalData(data);

      if (data.length > 0) {
        showToast("success", "Success", "Data Fetched Successfully");
      } else {
        showToast("warning", "No Data", res?.MESSAGE || "No records found.");
      }
    } catch (e) {
      console.error("API Error:", e);
      setFilteredData([]);
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

  function downloadExcel() {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "No data available to download.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const exportData = filteredData.map((row: any) => ({
      "Reference No": row.REFERENCE_NUMBER || "",
      "Inward / Outward": row.INWARD_OUTWARD || "",
      "SAP Type": row.SAP_NONSAP || "",
      "Incident Date": row.INCIDENT_DATE || "",
      "Nature of Damage": row.NATURE_OF_DAMAGE || "",
      Plant: row.PLANT || "",
      Division: row.DIVISION || "",
      Customer: row.CUSTOMER || "",
      Product: row.PRODUCT || "",
      "Product Description": row.PRODUCT_DESCRIPTION || "",
      "Invoice Number": row.INVOICE_NUMBER || "",
      "Invoice Date": row.INVOICE_DATE || "",
      "Transporter Group": row.TRANSPORTER_GROUP || "",
      Transporter: row.TRANSPORTER || "",
      "LR No": row.LR_NO || "",
      "FSR Reported Date": row.FSR_REPORTED_DATE || "",
      "Claim Info Sent": row.CLAIM_INFO_SENT || "",
      "Claim Reference": row.CLAIM_REFERENCE || "",
      "Loss Declared": row.LOSS_DECLARED || "",
      "Salvage Value": row.SALVAGE_VALUE || "",
      "Claim Document Status": row.CLAIM_DOCUMENT_STATUS || "",
      "Courier Details": row.COURIER_DETAILS || "",
      Settlement: row.SETTLEMENT || "",
      "Payment Status": row.PAYMENT_STATUS || "",
      "UTR Info": row.UTR_INFO || "",
      "Claim Settlement Date": row.CLAIM_SETTLEMENT_DATE || "",
      "Claim Status": row.CLAIM_STATUS || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Insurance Report");
    XLSX.writeFile(wb, "Insurance_Report.xlsx");

    Swal.fire({
      icon: "success",
      title: "Success",
      text: "Excel downloaded successfully.",
      confirmButtonColor: "#3085d6",
    });
  }

  function downloadPDF() {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "No data available to download.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");
    const tableColumn = TABLE_COLUMNS.map((c) => c.label);
    const tableRows = filteredData.map((row: any) =>
      TABLE_COLUMNS.map((c) => row[c.key] || "")
    );

    doc.text("Insurance Report", 14, 10);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [41, 128, 185], fontSize: 6 },
      margin: { left: 5, right: 5 },
    });

    doc.save("Insurance_Report.pdf");
    Swal.fire({
      icon: "success",
      title: "Success",
      text: "PDF downloaded successfully.",
      confirmButtonColor: "#3085d6",
    });
  }

  /* ------------------------------------------------------------------ */
  /*  Render                                                             */
  /* ------------------------------------------------------------------ */

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
          <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
            <Shield className="size-6" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
              Insurance Report
            </h1>
            <p className="text-[12.5px] text-muted-foreground mt-1">
              Insurance coverage, claims raised, and settlement status.
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
              label="Sap/Nonsap"
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
              searchable
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
              label="Damage Remarks"
              options={DAMAGE_REMARK_OPTIONS}
              value={form.DAMAGE_RMK}
              onChange={(v) => setField("DAMAGE_RMK", v)}
              searchable
            />

            <DateField
              label="Incident Date"
              value={form.INCIDENT_DATE}
              onChange={(v) => setField("INCIDENT_DATE", v)}
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
              label="Incoterms"
              options={incotermsList}
              value={form.INCOTERMS}
              onChange={(v) => setField("INCOTERMS", v)}
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
              disabled={loading}
              className="h-9 px-5 rounded-md bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-[12.5px] font-semibold shadow-cta hover:-translate-y-0.5 transition-transform inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Execute Report
            </button>
          </div>
        </div>

        {/* TABLE CARD */}
        <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
          <div className="px-5 py-4 border-b border-hairline flex items-center justify-between">
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
              Insurance Data
            </h3>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-[12px] text-muted-foreground">
                Search:
              </label>

              <input
                type="text"
                placeholder="Search..."
                onChange={(e) => onFilter(e.target.value)}
                className="h-8 w-48 rounded-md border border-input bg-background px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />

              <button
                onClick={downloadExcel}
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
                  <Shield className="size-7 text-muted-foreground" />
                </div>

                <h3 className="font-display text-[15px] font-semibold text-foreground">
                  No data to display
                </h3>

                <p className="text-[12.5px] text-muted-foreground mt-1.5">
                  Fill filters and click{" "}
                  <span className="font-semibold text-foreground">
                    Execute Report
                  </span>{" "}
                  to see results.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[560px]">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                      {TABLE_COLUMNS.map((c) => (
                        <th
                          key={c.key}
                          className="px-3 py-2.5 whitespace-nowrap text-left"
                        >
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
                          idx % 2 === 0
                            ? "bg-surface hover:bg-muted/50"
                            : "bg-surface-2/40 hover:bg-muted/50"
                        }
                      >
                        {TABLE_COLUMNS.map((c) => (
                          <td
                            key={c.key}
                            className="px-3 py-2 whitespace-nowrap text-foreground"
                          >
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
          INPUT +
          " flex items-center justify-between text-left " +
          (value.length ? "" : "text-muted-foreground")
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
                    (value.includes(opt.value)
                      ? "bg-accent border-accent text-white"
                      : "border-input")
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