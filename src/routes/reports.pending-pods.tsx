import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Clock,
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

type Option = { label: string; value: string };

const INPUT =
  "h-9 w-full rounded-md border border-input bg-background px-3 text-[12.5px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent/20";
const LABEL = "block text-[11px] font-semibold text-foreground mb-1.5";

// Static option lists (mirrors Angular PendingPodComponent's hard-coded dropdown values)
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

const TABLE_COLUMNS: { header: string; key: string }[] = [
  { header: "Reference No", key: "REFERENCE_NUMBER" },
  { header: "Type", key: "INWARD_OUTWARD" },
  { header: "SAP Type", key: "SAP_NONSAP" },
  { header: "Plant", key: "PLANT" },
  { header: "Division", key: "DIVISION" },
  { header: "Customer", key: "CUSTOMER" },
  { header: "Product", key: "PRODUCT" },
  { header: "Description", key: "PRODUCT_DESCRIPTION" },
  { header: "Invoice No", key: "INVOICE_NUMBER" },
  { header: "Invoice Date", key: "INVOICE_DATE" },
  { header: "Transporter", key: "TRANSPORTER" },
  { header: "Transporter Group", key: "TRANSPORTER_GROUP" },
  { header: "LR No", key: "LR_NO" },
  { header: "Delivery Date", key: "DELIVERY_DATE" },
  { header: "POD Age", key: "POD_PENDING_AGE" },
  { header: "Age Group", key: "POD_PENDING_AGE_GROUP" },
];

function getLoggedInUser(): any {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

// Mirrors Angular PendingPodComponent.createArray
function createArray(value: any, key: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((v) => ({ [key]: v }));
  }
  return [{ [key]: value }];
}

// Mirrors Angular PendingPodComponent.formatDate
function formatDate(date: string) {
  if (!date) return "";
  return date.split("-").join("");
}

export const Route = createFileRoute("/reports/pending-pods")({
  component: PendingPodsReport,
});

function PendingPodsReport() {
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
  const [customer, setCustomer] = useState<string[]>([]);
  const [branch, setBranch] = useState<string[]>([]);
  const [branchZone, setBranchZone] = useState<string[]>([]);
  const [destLocation, setDestLocation] = useState<string[]>([]);
  const [destState, setDestState] = useState<string[]>([]);
  const [destZone, setDestZone] = useState<string[]>([]);
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
          setDestLocationList(data.DEST_LOC || []);
          setDestStateZoneList(data.DEST_STZ || []);
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
  const branchOptions: Option[] = useMemo(
    () => branchList.map((b: any) => ({ label: b.BRANCH_DESC, value: b.BRANCH_DESC })),
    [branchList],
  );
  const branchZoneOptions: Option[] = useMemo(
    () => branchList.map((b: any) => ({ label: b.BZONE, value: b.BRANCH_ZONE })),
    [branchList],
  );
  const destLocationOptions: Option[] = useMemo(
    () => destLocationList.map((d: any) => ({ label: d.DLOC, value: d.DLOC })),
    [destLocationList],
  );
  const destStateOptions: Option[] = useMemo(
    () => destStateZoneList.map((d: any) => ({ label: d.DEST_STATE, value: d.DEST_STATE })),
    [destStateZoneList],
  );
  const destZoneOptions: Option[] = useMemo(
    () => destStateZoneList.map((d: any) => ({ label: d.DZONE, value: d.DEST_ZONE })),
    [destStateZoneList],
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
      transporter_group: createArray(transGroup, "transporter_group"),
      transporter: createArray(transporter, "transporter"),
      plant: createArray(werks, "plant"),
      product: createArray(matnr, "product"),
      division: createArray(division, "division"),
      customer: createArray(customer, "customer"),
      branch: createArray(branch, "branch"),
      branch_zone: createArray(branchZone, "branch_zone"),
      destination_location: createArray(destLocation, "destination_location"),
      destination_state: createArray(destState, "destination_state"),
      destination_zone: createArray(destZone, "destination_zone"),
      incoterms: createArray(incoterms, "incoterms"),
    };
    console.log("Payload:", payload);

    setIsSearching(true);

    try {
      const res: any = await service.FetchPendingPodReport(payload);
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
    setCustomer([]);
    setBranch([]);
    setBranchZone([]);
    setDestLocation([]);
    setDestState([]);
    setDestZone([]);
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
      Type: row.INWARD_OUTWARD || "",
      "SAP Type": row.SAP_NONSAP || "",
      Plant: row.PLANT || "",
      Division: row.DIVISION || "",
      Customer: row.CUSTOMER || "",
      Product: row.PRODUCT || "",
      Description: row.PRODUCT_DESCRIPTION || "",
      "Invoice No": row.INVOICE_NUMBER || "",
      "Invoice Date": row.INVOICE_DATE || "",
      Transporter: row.TRANSPORTER || "",
      "Transporter Group": row.TRANSPORTER_GROUP || "",
      "LR No": row.LR_NO || "",
      "Delivery Date": row.DELIVERY_DATE || "",
      "POD Age": row.POD_PENDING_AGE || "",
      "Age Group": row.POD_PENDING_AGE_GROUP || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Pending PODs");

    XLSX.writeFile(wb, "Pending_PODs_Report.xlsx");

    Swal.fire("Success", "Excel downloaded successfully.", "success");
  };

  // downloadPDF()
  const downloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("Warning", "No data available to download.", "warning");
      return;
    }

    const doc = new jsPDF("l", "mm", "a3");

    const tableColumn = [
      "Reference No",
      "Type",
      "SAP Type",
      "Plant",
      "Division",
      "Customer",
      "Product",
      "Description",
      "Invoice No",
      "Invoice Date",
      "Transporter",
      "Transporter Group",
      "LR No",
      "Delivery Date",
      "POD Age",
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
      row.INVOICE_DATE || "",
      row.TRANSPORTER || "",
      row.TRANSPORTER_GROUP || "",
      row.LR_NO || "",
      row.DELIVERY_DATE || "",
      row.POD_PENDING_AGE || "",
      row.POD_PENDING_AGE_GROUP || "",
    ]);

    doc.text("Pending PODs Report", 14, 10);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: {
        fontSize: 8,
      },
      headStyles: {
        fillColor: [41, 128, 185],
      },
    });

    doc.save("Pending_PODs_Report.pdf");

    Swal.fire("Success", "PDF downloaded successfully.", "success");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <Clock className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Pending PODs
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Shipments awaiting Proof-of-Delivery confirmation.
          </p>
        </div>
      </div>

      {/* FILTER CARD */}
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
            label="Branch Zone"
            options={branchZoneOptions}
            value={branchZone}
            onChange={setBranchZone}
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
            label="Destination State"
            options={destStateOptions}
            value={destState}
            onChange={setDestState}
            searchable
          />

          <MultiSelectField
            label="Destination Zone"
            options={destZoneOptions}
            value={destZone}
            onChange={setDestZone}
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
            Pending PODs Data
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
              <Clock className="size-7 text-muted-foreground" />
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
                        {row[c.key]}
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
