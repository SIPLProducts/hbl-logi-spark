import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  FileSpreadsheet,
  FileText,
  Calendar,
  RotateCcw,
  Filter,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

// Static option lists (mirrors Angular FreightbillsComponent's hard-coded dropdown values)
const INOUT_OPTIONS: Option[] = [
  { value: "INWARD", label: "Inward" },
  { value: "OUTWARD", label: "Outward" },
];

const SAPTYPE_OPTIONS: Option[] = [
  { value: "SAP", label: "SAP" },
  { value: "NONSAP", label: "Non-SAP" },
];

const PROVISION_ACCOUNT_OPTIONS: Option[] = [
  { label: "PROVISION", value: "PROVISION" },
  { label: "ACCOUNT", value: "ACCOUNT" },
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

function getLoggedInUser(): any {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

// Mirrors Angular FreightbillsComponent.createArray
function createArray(value: any, key: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((v) => ({ [key]: v }));
  }
  return [{ [key]: value }];
}

// Mirrors Angular FreightbillsComponent.formatDate
function formatDate(date: string) {
  if (!date) return "";
  return date.split("-").join("");
}

// Mirrors Angular's `{{ row.DELIVERY_DATE | date:'yyyy-MM-dd HH:mm' }}`
function formatDeliveryDate(value: any) {
  if (!value) return "";
  try {
    return format(new Date(value), "yyyy-MM-dd HH:mm");
  } catch {
    return value;
  }
}

export const Route = createFileRoute("/reports/freight-bills")({
  component: FreightBillsReport,
});

function FreightBillsReport() {
  // Filter form state (mirrors Angular filterForm controls)
  const [inout, setInout] = useState<string[]>([]);
  const [sapType, setSapType] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [provisionAccount, setProvisionAccount] = useState<string[]>([]);
  const [transGroup, setTransGroup] = useState<string[]>([]);
  const [transporter, setTransporter] = useState<string[]>([]);
  const [werks, setWerks] = useState<string[]>([]);
  const [matnr, setMatnr] = useState<string[]>([]);
  const [division, setDivision] = useState<string[]>([]);
  const [customer, setCustomer] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [destLocation, setDestLocation] = useState<string[]>([]);
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

  // ngOnInit equivalent
  useEffect(() => {
    const userData = getLoggedInUser();
    setPlantList(userData.PLANTS || []);
    setDivisionList(userData.DIV || []);

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

    // getBranches()
    (async () => {
      try {
        const res: any = await service.getssc();
        if (res && res.length > 0) {
          const data = res[0];
          setBranchList(data.BRANCH || []);
          setDestLocationList(data.DEST_LOC || []);
        }
      } catch (err) {
        console.error("F4 fetch error", err);
        Swal.fire("Error", "Failed to load master dropdown data (F4).", "error");
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

    // fetchIncoterms()
    (async () => {
      try {
        const res: any = await service.Incoterms({ INCO1: "", BEZEI: "" });
        setIncotermsList(Array.isArray(res) ? res : res?.data || []);
      } catch (err) {
        console.error("Error fetching Incoterms:", err);
      }
    })();
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
  const branchOptions: Option[] = useMemo(
    () => branchList.map((b: any) => ({ label: b.BRANCH_DESC, value: b.BRANCH_DESC })),
    [branchList],
  );
  const destLocationOptions: Option[] = useMemo(
    () => destLocationList.map((d: any) => ({ label: d.DLOC, value: d.DLOC })),
    [destLocationList],
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
      Swal.fire({ icon: "warning", title: "Validation", text: "Please fill required fields" });
      return;
    }

    const payload = {
      inward_outward: createArray(inout, "inout"),
      from_date: formatDate(fromDate),
      to_date: formatDate(toDate),
      sap_nonsap: createArray(sapType, "type"),
      provision_account: createArray(provisionAccount, "provision_account"),
      // NOTE: case-sensitive keys preserved exactly as in the Angular source
      transporter_group: createArray(transGroup, "TRANSPORTER_GROUP"),
      transporter: createArray(transporter, "TRANSPORTER"),
      plant: createArray(werks, "plant"),
      product: createArray(matnr, "product"),
      division: createArray(division, "DIVISION"),
      customer: createArray(customer, "CUSTOMER"),
      branch: createArray(branch, "branch"),
      destination_location: createArray(destLocation, "destination_location"),
      incoterms: createArray(incoterms, "incoterms"),
    };
    console.log("Payload:", payload);

    setIsSearching(true);

    try {
      const res: any = await service.FetchFreightBills(payload);

      // ERROR RESPONSE HANDLING
      if (res?.ERROR_TYPE === "E") {
        setFilteredData([]);
        setOriginalData([]);

        Swal.fire({ icon: "warning", title: "No Data", text: res?.MESSAGE });
        return;
      }

      // SAFE ARRAY CHECK
      if (!Array.isArray(res)) {
        setFilteredData([]);
        setOriginalData([]);
        return;
      }

      setFilteredData(res);
      setOriginalData(res);

      if (res.length > 0) {
        Swal.fire({ icon: "success", title: "Success", text: "Data fetched successfully!" });
      } else {
        Swal.fire({ icon: "warning", title: "No Data", text: "No records found" });
      }
    } catch (err) {
      console.error("API Error:", err);
      setFilteredData([]);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch data. Please try again." });
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
    setProvisionAccount([]);
    setTransGroup([]);
    setTransporter([]);
    setWerks([]);
    setMatnr([]);
    setDivision([]);
    setCustomer([]);
    setBranch([]);
    setDestLocation([]);
    setIncoterms([]);
    setTouched(false);
    setFilteredData([]);
  };

  // exportToExcel()
  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("No Data", "Nothing to export", "warning");
      return;
    }

    const exportData = filteredData.map((row) => ({
      "Reference No": row.REFERENCE_NUMBER,
      "In/Out": row.INWARD_OUTWARD,
      "SAP Type": row.SAP_NONSAP,
      Plant: row.PLANT,
      Division: row.DIVISION,
      Customer: row.CUSTOMER,
      Product: row.PRODUCT,
      "Product Description": row.PRODUCT_DESCRIPTION,
      "Invoice No": row.INVOICE_NUMBER,
      "Invoice Date": row.INVOICE_DATE,
      "Transporter Group": row.TRANSPORTER_GROUP,
      Transporter: row.TRANSPORTER,
      "LR No": row.LR_NO,
      "Delivery Date": row.DELIVERY_DATE,
      "POD Submitted Date": row.POD_SUBMITTED_DATE || "-",
      "Provision Account Status": row.PROVISION_ACCOUNT_STATUS,
      "Freight Bill Status": row.FREIGHT_BILL_STATUS,
      "Pending Days": row.PENDING_DAYS,
      "Age Group": row.POD_PENDING_AGE_GROUP,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { "Freight Bills": worksheet },
      SheetNames: ["Freight Bills"],
    };

    XLSX.writeFile(workbook, "Freight_Bills.xlsx");
  };

  // downloadPDF()
  const downloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("Warning", "No data available to download.", "warning");
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");

    doc.text("Freight Bills Report", 14, 10);

    const tableColumn = [
      "Reference No",
      "In/Out",
      "SAP Type",
      "Plant",
      "Division",
      "Customer",
      "Product",
      "Product Description",
      "Invoice No",
      "Invoice Date",
      "Transporter Group",
      "Transporter",
      "LR No",
      "Delivery Date",
      "POD Submitted Date",
      "Provision Account Status",
      "Freight Bill Status",
      "Pending Days",
      "Age Group",
    ];

    const tableRows = filteredData.map((row: any) => [
      row.REFERENCE_NUMBER || "",
      row.INWARD_OUTWARD || "",
      row.SAP_NONSAP || "",
      row.PLANT || "",
      row.DIVISION || "",
      row.CUSTOMER || "",
      row.PRODUCT || "",
      row.PRODUCT_DESCRIPTION || "",
      row.INVOICE_NUMBER || "",
      formatDate(row.INVOICE_DATE),
      row.TRANSPORTER_GROUP || "",
      row.TRANSPORTER || "",
      row.LR_NO || "",
      formatDate(row.DELIVERY_DATE),
      row.POD_SUBMITTED_DATE || "-",
      row.PROVISION_ACCOUNT_STATUS || "",
      row.FREIGHT_BILL_STATUS || "",
      row.PENDING_DAYS || "",
      row.POD_PENDING_AGE_GROUP || "",
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 15,
      styles: {
        fontSize: 7,
        cellWidth: "wrap",
      },
      headStyles: {
        fillColor: [41, 128, 185],
        fontSize: 7,
      },
    });

    doc.save(`Freight_Bills_Report_${Date.now()}.pdf`);

    Swal.fire("Success", "PDF downloaded successfully.", "success");
  };

  return (
    <div className="flex flex-col h-full"><div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <FileSpreadsheet className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Freight bills Reports
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Freight billing summary by carrier, plant, and period.
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
            label="Provision/Account"
            options={PROVISION_ACCOUNT_OPTIONS}
            value={provisionAccount}
            onChange={setProvisionAccount}
          />

          <MultiSelectField
            label="Transporter Group"
            options={TRANS_GROUP_OPTIONS}
            value={transGroup}
            onChange={setTransGroup}
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
          />

          <MultiSelectField
            label="Division"
            options={divisionOptions}
            value={division}
            onChange={setDivision}
            searchable
          />

          <MultiSelectField
            label="Customer Name"
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
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
            label="Destination Location"
            options={destLocationOptions}
            value={destLocation}
            onChange={setDestLocation}
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
            Freight Bills Detailed
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-muted-foreground">Search:</label>
            <input
              type="text"
              onChange={onFilter}
              className="h-8 rounded-md border border-input bg-background px-2.5 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            <button
              onClick={exportToExcel}
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
              <FileSpreadsheet className="size-7 text-muted-foreground" />
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
                  {[
                    "Reference No",
                    "In/Out",
                    "SAP Type",
                    "Plant",
                    "Division",
                    "Customer",
                    "Product",
                    "Product Description",
                    "Invoice No",
                    "Invoice Date",
                    "Transporter Group",
                    "Transporter",
                    "LR No",
                    "Delivery Date",
                    "POD Submitted Date",
                    "Provision Account Status",
                    "Freight Bill Status",
                    "Pending Days",
                    "Age Group",
                  ].map((h) => (
                    <th key={h} className="px-3 py-2.5 whitespace-nowrap text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {filteredData.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                    <td className="px-3 py-2 whitespace-nowrap">{row.REFERENCE_NUMBER}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.INWARD_OUTWARD}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.SAP_NONSAP}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.PLANT}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DIVISION}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.CUSTOMER}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.PRODUCT}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.PRODUCT_DESCRIPTION}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.INVOICE_NUMBER}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.INVOICE_DATE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSPORTER_GROUP}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSPORTER}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.LR_NO}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{formatDeliveryDate(row.DELIVERY_DATE)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.POD_SUBMITTED_DATE || "-"}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.PROVISION_ACCOUNT_STATUS}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.FREIGHT_BILL_STATUS}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.PENDING_DAYS}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.POD_PENDING_AGE_GROUP}</td>
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

function MultiSelectField({
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
