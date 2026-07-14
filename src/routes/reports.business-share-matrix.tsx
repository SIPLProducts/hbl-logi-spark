import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Grid3x3,
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

// Static option lists (mirrors Angular BusinessShareMatrixComponent's hard-coded dropdown values)
const INOUT_OPTIONS: Option[] = [
  { value: "INWARD", label: "Inward" },
  { value: "OUTWARD", label: "Outward" },
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

const REPORT_TYPE_OPTIONS = [
  { value: "All", label: "ALL Records" },
  { value: "Header", label: "Header" },
  { value: "HeaderWithPlant", label: "Header with Plant" },
  { value: "HeaderWithInOut", label: "Header with Inward/Outward" },
];

function getLoggedInUser(): any {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "{}");
  } catch {
    return {};
  }
}

// Mirrors Angular BusinessShareMatrixComponent.createArray
function createArray(value: any, key: string) {
  if (!value || (Array.isArray(value) && value.length === 0)) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.map((v) => ({ [key]: v }));
  }
  return [{ [key]: value }];
}

// Mirrors Angular BusinessShareMatrixComponent.formatDate
function formatDate(date: string) {
  if (!date) return "";
  return date.split("-").join("");
}

type Totals = {
  TOTAL_VEHICLES?: number;
  TOTAL_FREIGHT_AMOUNT?: number;
  TOTAL_BASIC_CHARGE?: number;
  TOTAL_DETENTION_LOADING?: number;
  TOTAL_DETENTION_UNLOADING?: number;
  TOTAL_LOADING_CHARGE?: number;
  TOTAL_UNLOADING_CHARGE?: number;
  TOTAL_ROUTING_CHARGES?: number;
  TOTAL_TRANSHIPMENT_CHARGES?: number;
  TOTAL_OTHER_CHARGES?: number;
  TOTAL_DEDUCTION_CHARGES?: number;
};

export const Route = createFileRoute("/reports/business-share-matrix")({
  component: BusinessShareMatrixReport,
});

function BusinessShareMatrixReport() {
  // Filter form state (mirrors Angular filterForm controls)
  const [inout, setInout] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [transGroup, setTransGroup] = useState<string[]>([]);
  const [transporter, setTransporter] = useState<string[]>([]);
  const [werks, setWerks] = useState<string[]>([]);
  const [matnr, setMatnr] = useState<string[]>([]);
  const [division, setDivision] = useState<string[]>([]);
  const [customer, setCustomer] = useState<string[]>([]);
  const [destLocation, setDestLocation] = useState<string[]>([]);
  const [segment, setSegment] = useState<string[]>([]);
  const [incoterms, setIncoterms] = useState<string[]>([]);
  const [reportType, setReportType] = useState("");

  const [touched, setTouched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Captured only on a successful onSearch — mirrors Angular's `selectedReportType`,
  // which stays independent of the live `REPORT_TYPE` radio control (resetForm doesn't touch it).
  const [selectedReportType, setSelectedReportType] = useState("");

  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [originalData, setOriginalData] = useState<any[]>([]);
  const [totals, setTotals] = useState<Totals>({});

  // Master dropdown data (mirrors Angular component properties)
  const [plantList, setPlantList] = useState<any[]>([]);
  const [divisionList, setDivisionList] = useState<any[]>([]);
  const [transporterList, setTransporterList] = useState<any[]>([]);
  const [customerList, setCustomerList] = useState<any[]>([]);
  const [incotermsList, setIncotermsList] = useState<any[]>([]);
  const [destLocationList, setDestLocationList] = useState<any[]>([]);
  const [segmentList, setSegmentList] = useState<any[]>([]);

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
          setSegmentList(data.SEGMENTS || []);
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
  const reportTypeInvalid = touched && !reportType;

  // onSearch()
  const onSearch = async () => {
    setTouched(true);

    if (inout.length === 0 || !fromDate || !toDate || !reportType) {
      Swal.fire({ icon: "warning", title: "Validation", text: "Please fill required fields" });
      return;
    }

    setSelectedReportType(reportType);

    const payload = {
      inward_outward: createArray(inout, "inout"),
      from_date: formatDate(fromDate),
      to_date: formatDate(toDate),
      // SAPTYPE has no rendered control in the Angular template, so this is always empty
      sap_nonsap: [] as { type: string }[],
      transporter_group: createArray(transGroup, "TRANSPORTER_GROUP"),
      transporter: createArray(transporter, "TRANSPORTER"),
      plant: createArray(werks, "plant"),
      product: createArray(matnr, "product"),
      division: createArray(division, "DIVISION"),
      // CUSTOMER_GROUP is read from the form but never declared as a control, so it's always empty
      customer_group: [] as { CUSTOMER_GROUP: string }[],
      customer: createArray(customer, "CUSTOMER"),
      // BRANCH has no rendered control in the Angular template, so this is always empty
      branch: [] as { branch: string }[],
      destination_location: createArray(destLocation, "destination_location"),
      segment: createArray(segment, "segment"),
      incoterms: createArray(incoterms, "incoterms"),
      mode:
        reportType === "All"
          ? "A"
          : reportType === "Header"
            ? "H"
            : reportType === "HeaderWithPlant"
              ? "P"
              : reportType === "HeaderWithInOut"
                ? "S"
                : "",
    };
    console.log("Payload:", payload);

    setIsSearching(true);

    try {
      const res: any = await service.FetchBusinessShareMatrix(payload);

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

      // Mode "All" ("A") returns the rows as a flat top-level array, while the
      // other modes wrap them as [{ DATA: [...], TOTAL_* }].
      const hasDataWrapper = Array.isArray(res?.[0]?.DATA);
      const data = hasDataWrapper ? res[0].DATA : reportType === "All" ? res : [];
      setFilteredData(data);
      setOriginalData(data);
      setTotals(hasDataWrapper ? res[0] : {});

      if (data.length > 0) {
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

  // resetForm() — resets the filter form only; `selectedReportType`/totals/originalData
  // are component state outside the form and are left untouched, matching Angular.
  const resetForm = () => {
    setInout([]);
    setFromDate("");
    setToDate("");
    setTransGroup([]);
    setTransporter([]);
    setWerks([]);
    setMatnr([]);
    setDivision([]);
    setCustomer([]);
    setDestLocation([]);
    setSegment([]);
    setIncoterms([]);
    setReportType("");
    setTouched(false);
    setFilteredData([]);
  };

  // exportToExcel()
  const exportToExcel = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("No Data", "Nothing to export", "warning");
      return;
    }

    let exportData: any[] = [];

    if (selectedReportType === "All") {
      exportData = filteredData.map((row: any) => ({
        "Reference No": row.REFERENCE_NUMBER || "",
        "In/Out": row.INWARD_OUTWARD || "",
        "SAP Type": row.SAP_NONSAP || "",
        Plant: row.PLANT || "",
        "Transporter Group": row.TRANSPORTER_GROUP || "",
        Transporter: row.TRANSPORTER || "",
        "No. of Vehicles": row.NO_OF_VEHICLES_PLACED || 0,
        "Basic Charge": row.BASIC_CHARGE || 0,
        "Detention Loading": row.DETENTION_LOADING || 0,
        "Detention Unloading": row.DETENTION_UNLOADING || 0,
        "Loading Charge": row.LOADING_CHARGE || 0,
        "Unloading Charge": row.UNLOADING_CHARGE || 0,
        "Routing Charges": row.ROUTING_CHARGES || 0,
        "Transshipment Charges": row.TRANSHIPMENT_CHARGES || 0,
        "Other Charges": row.OTHER_CHARGES || 0,
        "Deduction Charges": row.DEDUCTION_CHARGES || 0,
        "Total Amount": row.FREIGHT_AMOUNT || 0,
      }));

      exportData.push({
        "Reference No": "TOTAL",
        "In/Out": "",
        "SAP Type": "",
        Plant: "",
        "Transporter Group": "",
        Transporter: "",
        "No. of Vehicles": totals.TOTAL_VEHICLES || 0,
        "Basic Charge": totals.TOTAL_BASIC_CHARGE || 0,
        "Detention Loading": totals.TOTAL_DETENTION_LOADING || 0,
        "Detention Unloading": totals.TOTAL_DETENTION_UNLOADING || 0,
        "Loading Charge": totals.TOTAL_LOADING_CHARGE || 0,
        "Unloading Charge": totals.TOTAL_UNLOADING_CHARGE || 0,
        "Routing Charges": totals.TOTAL_ROUTING_CHARGES || 0,
        "Transshipment Charges": totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        "Other Charges": totals.TOTAL_OTHER_CHARGES || 0,
        "Deduction Charges": totals.TOTAL_DEDUCTION_CHARGES || 0,
        "Total Amount": totals.TOTAL_FREIGHT_AMOUNT || 0,
      });
    } else if (selectedReportType === "Header") {
      exportData = filteredData.map((row: any) => ({
        Transporter: row.TRANSPORTER || "",
        "No. of Vehicles": row.NO_OF_VEHICLES_PLACED || 0,
        "Basic Charge": row.BASIC_CHARGE || 0,
        "Detention Loading": row.DETENTION_LOADING || 0,
        "Detention Unloading": row.DETENTION_UNLOADING || 0,
        "Loading Charge": row.LOADING_CHARGE || 0,
        "Unloading Charge": row.UNLOADING_CHARGE || 0,
        "Routing Charges": row.ROUTING_CHARGES || 0,
        "Transshipment Charges": row.TRANSHIPMENT_CHARGES || 0,
        "Other Charges": row.OTHER_CHARGES || 0,
        "Deduction Charges": row.DEDUCTION_CHARGES || 0,
        "Total Amount": row.FREIGHT_AMOUNT || 0,
      }));

      exportData.push({
        Transporter: "TOTAL",
        "No. of Vehicles": totals.TOTAL_VEHICLES || 0,
        "Basic Charge": totals.TOTAL_BASIC_CHARGE || 0,
        "Detention Loading": totals.TOTAL_DETENTION_LOADING || 0,
        "Detention Unloading": totals.TOTAL_DETENTION_UNLOADING || 0,
        "Loading Charge": totals.TOTAL_LOADING_CHARGE || 0,
        "Unloading Charge": totals.TOTAL_UNLOADING_CHARGE || 0,
        "Routing Charges": totals.TOTAL_ROUTING_CHARGES || 0,
        "Transshipment Charges": totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        "Other Charges": totals.TOTAL_OTHER_CHARGES || 0,
        "Deduction Charges": totals.TOTAL_DEDUCTION_CHARGES || 0,
        "Total Amount": totals.TOTAL_FREIGHT_AMOUNT || 0,
      });
    } else if (selectedReportType === "HeaderWithPlant") {
      exportData = filteredData.map((row: any) => ({
        Transporter: row.TRANSPORTER || "",
        Plant: row.PLANT || "",
        "No. of Vehicles": row.NO_OF_VEHICLES_PLACED || 0,
        "Basic Charge": row.BASIC_CHARGE || 0,
        "Detention Loading": row.DETENTION_LOADING || 0,
        "Detention Unloading": row.DETENTION_UNLOADING || 0,
        "Loading Charge": row.LOADING_CHARGE || 0,
        "Unloading Charge": row.UNLOADING_CHARGE || 0,
        "Routing Charges": row.ROUTING_CHARGES || 0,
        "Transshipment Charges": row.TRANSHIPMENT_CHARGES || 0,
        "Other Charges": row.OTHER_CHARGES || 0,
        "Deduction Charges": row.DEDUCTION_CHARGES || 0,
        "Total Amount": row.FREIGHT_AMOUNT || 0,
      }));

      exportData.push({
        Transporter: "TOTAL",
        Plant: "",
        "No. of Vehicles": totals.TOTAL_VEHICLES || 0,
        "Basic Charge": totals.TOTAL_BASIC_CHARGE || 0,
        "Detention Loading": totals.TOTAL_DETENTION_LOADING || 0,
        "Detention Unloading": totals.TOTAL_DETENTION_UNLOADING || 0,
        "Loading Charge": totals.TOTAL_LOADING_CHARGE || 0,
        "Unloading Charge": totals.TOTAL_UNLOADING_CHARGE || 0,
        "Routing Charges": totals.TOTAL_ROUTING_CHARGES || 0,
        "Transshipment Charges": totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        "Other Charges": totals.TOTAL_OTHER_CHARGES || 0,
        "Deduction Charges": totals.TOTAL_DEDUCTION_CHARGES || 0,
        "Total Amount": totals.TOTAL_FREIGHT_AMOUNT || 0,
      });
    } else if (selectedReportType === "HeaderWithInOut") {
      exportData = filteredData.map((row: any) => ({
        Transporter: row.TRANSPORTER || "",
        "Inward/Outward": row.INWARD_OUTWARD || "",
        "No. of Vehicles": row.NO_OF_VEHICLES_PLACED || 0,
        "Basic Charge": row.BASIC_CHARGE || 0,
        "Detention Loading": row.DETENTION_LOADING || 0,
        "Detention Unloading": row.DETENTION_UNLOADING || 0,
        "Loading Charge": row.LOADING_CHARGE || 0,
        "Unloading Charge": row.UNLOADING_CHARGE || 0,
        "Routing Charges": row.ROUTING_CHARGES || 0,
        "Transshipment Charges": row.TRANSHIPMENT_CHARGES || 0,
        "Other Charges": row.OTHER_CHARGES || 0,
        "Deduction Charges": row.DEDUCTION_CHARGES || 0,
        "Total Amount": row.FREIGHT_AMOUNT || 0,
      }));

      exportData.push({
        Transporter: "TOTAL",
        "Inward/Outward": "",
        "No. of Vehicles": totals.TOTAL_VEHICLES || 0,
        "Basic Charge": totals.TOTAL_BASIC_CHARGE || 0,
        "Detention Loading": totals.TOTAL_DETENTION_LOADING || 0,
        "Detention Unloading": totals.TOTAL_DETENTION_UNLOADING || 0,
        "Loading Charge": totals.TOTAL_LOADING_CHARGE || 0,
        "Unloading Charge": totals.TOTAL_UNLOADING_CHARGE || 0,
        "Routing Charges": totals.TOTAL_ROUTING_CHARGES || 0,
        "Transshipment Charges": totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        "Other Charges": totals.TOTAL_OTHER_CHARGES || 0,
        "Deduction Charges": totals.TOTAL_DEDUCTION_CHARGES || 0,
        "Total Amount": totals.TOTAL_FREIGHT_AMOUNT || 0,
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook: XLSX.WorkBook = {
      Sheets: { "Business Share Matrix": worksheet },
      SheetNames: ["Business Share Matrix"],
    };

    XLSX.writeFile(workbook, `Business_Share_Matrix_${selectedReportType}.xlsx`);

    Swal.fire("Success", "Excel exported successfully.", "success");
  };

  // downloadPDF()
  const downloadPDF = () => {
    if (!filteredData || filteredData.length === 0) {
      Swal.fire("Warning", "No data available to download.", "warning");
      return;
    }

    const doc = new jsPDF("l", "mm", "a2");

    doc.text(`Business Share Matrix Report - ${selectedReportType}`, 14, 10);

    let tableColumn: string[] = [];
    let tableRows: any[] = [];

    if (selectedReportType === "All") {
      tableColumn = [
        "Reference No",
        "In/Out",
        "SAP Type",
        "Plant",
        "Transporter Group",
        "Transporter",
        "No. of Vehicles",
        "Basic Charge",
        "Detention Loading",
        "Detention Unloading",
        "Loading Charge",
        "Unloading Charge",
        "Routing Charges",
        "Transshipment Charges",
        "Other Charges",
        "Deduction Charges",
        "Total Amount",
      ];

      tableRows = filteredData.map((row: any) => [
        row.REFERENCE_NUMBER || "",
        row.INWARD_OUTWARD || "",
        row.SAP_NONSAP || "",
        row.PLANT || "",
        row.TRANSPORTER_GROUP || "",
        row.TRANSPORTER || "",
        row.NO_OF_VEHICLES_PLACED || 0,
        row.BASIC_CHARGE || 0,
        row.DETENTION_LOADING || 0,
        row.DETENTION_UNLOADING || 0,
        row.LOADING_CHARGE || 0,
        row.UNLOADING_CHARGE || 0,
        row.ROUTING_CHARGES || 0,
        row.TRANSHIPMENT_CHARGES || 0,
        row.OTHER_CHARGES || 0,
        row.DEDUCTION_CHARGES || 0,
        row.FREIGHT_AMOUNT || 0,
      ]);

      tableRows.push([
        "TOTAL",
        "",
        "",
        "",
        "",
        "",
        totals.TOTAL_VEHICLES || 0,
        totals.TOTAL_BASIC_CHARGE || 0,
        totals.TOTAL_DETENTION_LOADING || 0,
        totals.TOTAL_DETENTION_UNLOADING || 0,
        totals.TOTAL_LOADING_CHARGE || 0,
        totals.TOTAL_UNLOADING_CHARGE || 0,
        totals.TOTAL_ROUTING_CHARGES || 0,
        totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        totals.TOTAL_OTHER_CHARGES || 0,
        totals.TOTAL_DEDUCTION_CHARGES || 0,
        totals.TOTAL_FREIGHT_AMOUNT || 0,
      ]);
    } else if (selectedReportType === "Header") {
      tableColumn = [
        "Transporter",
        "No. of Vehicles",
        "Basic Charge",
        "Detention Loading",
        "Detention Unloading",
        "Loading Charge",
        "Unloading Charge",
        "Routing Charges",
        "Transshipment Charges",
        "Other Charges",
        "Deduction Charges",
        "Total Amount",
      ];

      tableRows = filteredData.map((row: any) => [
        row.TRANSPORTER || "",
        row.NO_OF_VEHICLES_PLACED || 0,
        row.BASIC_CHARGE || 0,
        row.DETENTION_LOADING || 0,
        row.DETENTION_UNLOADING || 0,
        row.LOADING_CHARGE || 0,
        row.UNLOADING_CHARGE || 0,
        row.ROUTING_CHARGES || 0,
        row.TRANSHIPMENT_CHARGES || 0,
        row.OTHER_CHARGES || 0,
        row.DEDUCTION_CHARGES || 0,
        row.FREIGHT_AMOUNT || 0,
      ]);

      tableRows.push([
        "TOTAL",
        totals.TOTAL_VEHICLES || 0,
        totals.TOTAL_BASIC_CHARGE || 0,
        totals.TOTAL_DETENTION_LOADING || 0,
        totals.TOTAL_DETENTION_UNLOADING || 0,
        totals.TOTAL_LOADING_CHARGE || 0,
        totals.TOTAL_UNLOADING_CHARGE || 0,
        totals.TOTAL_ROUTING_CHARGES || 0,
        totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        totals.TOTAL_OTHER_CHARGES || 0,
        totals.TOTAL_DEDUCTION_CHARGES || 0,
        totals.TOTAL_FREIGHT_AMOUNT || 0,
      ]);
    } else if (selectedReportType === "HeaderWithPlant") {
      tableColumn = [
        "Transporter",
        "Plant",
        "No. of Vehicles",
        "Basic Charge",
        "Detention Loading",
        "Detention Unloading",
        "Loading Charge",
        "Unloading Charge",
        "Routing Charges",
        "Transshipment Charges",
        "Other Charges",
        "Deduction Charges",
        "Total Amount",
      ];

      tableRows = filteredData.map((row: any) => [
        row.TRANSPORTER || "",
        row.PLANT || "",
        row.NO_OF_VEHICLES_PLACED || 0,
        row.BASIC_CHARGE || 0,
        row.DETENTION_LOADING || 0,
        row.DETENTION_UNLOADING || 0,
        row.LOADING_CHARGE || 0,
        row.UNLOADING_CHARGE || 0,
        row.ROUTING_CHARGES || 0,
        row.TRANSHIPMENT_CHARGES || 0,
        row.OTHER_CHARGES || 0,
        row.DEDUCTION_CHARGES || 0,
        row.FREIGHT_AMOUNT || 0,
      ]);

      tableRows.push([
        "TOTAL",
        "",
        totals.TOTAL_VEHICLES || 0,
        totals.TOTAL_BASIC_CHARGE || 0,
        totals.TOTAL_DETENTION_LOADING || 0,
        totals.TOTAL_DETENTION_UNLOADING || 0,
        totals.TOTAL_LOADING_CHARGE || 0,
        totals.TOTAL_UNLOADING_CHARGE || 0,
        totals.TOTAL_ROUTING_CHARGES || 0,
        totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        totals.TOTAL_OTHER_CHARGES || 0,
        totals.TOTAL_DEDUCTION_CHARGES || 0,
        totals.TOTAL_FREIGHT_AMOUNT || 0,
      ]);
    } else if (selectedReportType === "HeaderWithInOut") {
      tableColumn = [
        "Transporter",
        "Inward/Outward",
        "No. of Vehicles",
        "Basic Charge",
        "Detention Loading",
        "Detention Unloading",
        "Loading Charge",
        "Unloading Charge",
        "Routing Charges",
        "Transshipment Charges",
        "Other Charges",
        "Deduction Charges",
        "Total Amount",
      ];

      tableRows = filteredData.map((row: any) => [
        row.TRANSPORTER || "",
        row.INWARD_OUTWARD || "",
        row.NO_OF_VEHICLES_PLACED || 0,
        row.BASIC_CHARGE || 0,
        row.DETENTION_LOADING || 0,
        row.DETENTION_UNLOADING || 0,
        row.LOADING_CHARGE || 0,
        row.UNLOADING_CHARGE || 0,
        row.ROUTING_CHARGES || 0,
        row.TRANSHIPMENT_CHARGES || 0,
        row.OTHER_CHARGES || 0,
        row.DEDUCTION_CHARGES || 0,
        row.FREIGHT_AMOUNT || 0,
      ]);

      tableRows.push([
        "TOTAL",
        "",
        totals.TOTAL_VEHICLES || 0,
        totals.TOTAL_BASIC_CHARGE || 0,
        totals.TOTAL_DETENTION_LOADING || 0,
        totals.TOTAL_DETENTION_UNLOADING || 0,
        totals.TOTAL_LOADING_CHARGE || 0,
        totals.TOTAL_UNLOADING_CHARGE || 0,
        totals.TOTAL_ROUTING_CHARGES || 0,
        totals.TOTAL_TRANSHIPMENT_CHARGES || 0,
        totals.TOTAL_OTHER_CHARGES || 0,
        totals.TOTAL_DEDUCTION_CHARGES || 0,
        totals.TOTAL_FREIGHT_AMOUNT || 0,
      ]);
    }

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
      bodyStyles: {
        fontSize: 7,
      },
    });

    doc.save(`Business_Share_Matrix_${selectedReportType}_${Date.now()}.pdf`);

    Swal.fire("Success", "PDF downloaded successfully.", "success");
  };

  return (
    <div className="flex flex-col h-full"><div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">__HEADER_START__</div><div className="flex-1 overflow-y-auto scrollbar-elegant px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-5">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant p-5 flex items-start gap-4">
        <div className="size-12 rounded-xl bg-gradient-to-br from-sky-500 to-teal-500 grid place-items-center text-white shadow-cta shrink-0">
          <Grid3x3 className="size-6" />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-[18px] font-bold tracking-tight text-indigo-700 dark:text-indigo-300">
            Business Share Matrix Reports
          </h1>
          <p className="text-[12.5px] text-muted-foreground mt-1">
            Share of business by transporter, lane, and division.
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
            label="Incoterms"
            options={incotermsOptions}
            value={incoterms}
            onChange={setIncoterms}
            searchable
          />
        </div>

        {/* REPORT TYPE (radio) */}
        <div className="mt-4 pt-4 border-t border-hairline space-y-2">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {REPORT_TYPE_OPTIONS.slice(0, 2).map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 text-[12.5px] text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="report-type"
                  checked={reportType === opt.value}
                  onChange={() => setReportType(opt.value)}
                  className="size-3.5 accent-primary"
                />
                {opt.label}
              </label>
            ))}
            {reportTypeInvalid && (
              <span className="text-[11px] text-destructive">Please select report type</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {REPORT_TYPE_OPTIONS.slice(2, 4).map((opt) => (
              <label key={opt.value} className="inline-flex items-center gap-2 text-[12.5px] text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="report-type"
                  checked={reportType === opt.value}
                  onChange={() => setReportType(opt.value)}
                  className="size-3.5 accent-primary"
                />
                {opt.label}
              </label>
            ))}
            {reportTypeInvalid && (
              <span className="text-[11px] text-destructive">Please select report type</span>
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
            Business Share Matrix Detailed
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
              <Grid3x3 className="size-7 text-muted-foreground" />
            </div>
            <p className="text-[12.5px] text-muted-foreground">
              Fill filters and click execute to see results.
            </p>
          </div>
        ) : selectedReportType === "All" ? (
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                  {[
                    "Reference No",
                    "In/Out",
                    "SAP Type",
                    "Plant",
                    "Transporter Group",
                    "Transporter",
                    "No. of Vehicles",
                    "Basic Charge",
                    "Detention Loading",
                    "Detention Unloading",
                    "Loading Charge",
                    "Unloading Charge",
                    "Routing Charges",
                    "Transshipment Charges",
                    "Other Charges",
                    "Deduction Charges",
                    "Total Amount",
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
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSPORTER_GROUP}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSPORTER}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.NO_OF_VEHICLES_PLACED}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.BASIC_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DETENTION_LOADING}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DETENTION_UNLOADING}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.LOADING_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.UNLOADING_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.ROUTING_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSHIPMENT_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.OTHER_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DEDUCTION_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.FREIGHT_AMOUNT}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60 font-semibold">
                  <td colSpan={6} className="px-3 py-2 whitespace-nowrap">Total</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_VEHICLES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_BASIC_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DETENTION_LOADING}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DETENTION_UNLOADING}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_LOADING_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_UNLOADING_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_ROUTING_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_TRANSHIPMENT_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_OTHER_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DEDUCTION_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_FREIGHT_AMOUNT}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[560px]">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Transporter</th>
                  {selectedReportType === "HeaderWithPlant" && (
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Plant</th>
                  )}
                  {selectedReportType === "HeaderWithInOut" && (
                    <th className="px-3 py-2.5 whitespace-nowrap text-left">Inward/Outward</th>
                  )}
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">No Of Vehicles Placed</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Basic Charge</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Detention Loading</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Detention Unloading</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Loading Charge</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Unloading Charge</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Routing Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Transhipment Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Other Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Deduction Charges</th>
                  <th className="px-3 py-2.5 whitespace-nowrap text-left">Total Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hairline/70">
                {filteredData.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSPORTER}</td>
                    {selectedReportType === "HeaderWithPlant" && (
                      <td className="px-3 py-2 whitespace-nowrap">{row.PLANT}</td>
                    )}
                    {selectedReportType === "HeaderWithInOut" && (
                      <td className="px-3 py-2 whitespace-nowrap">{row.INWARD_OUTWARD}</td>
                    )}
                    <td className="px-3 py-2 whitespace-nowrap">{row.NO_OF_VEHICLES_PLACED}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.BASIC_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DETENTION_LOADING}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DETENTION_UNLOADING}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.LOADING_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.UNLOADING_CHARGE}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.ROUTING_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.TRANSHIPMENT_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.OTHER_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.DEDUCTION_CHARGES}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{row.FREIGHT_AMOUNT}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/60 font-semibold">
                  <td className="px-3 py-2 whitespace-nowrap">Total</td>
                  {selectedReportType === "HeaderWithPlant" && <td className="px-3 py-2 whitespace-nowrap" />}
                  {selectedReportType === "HeaderWithInOut" && <td className="px-3 py-2 whitespace-nowrap" />}
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_VEHICLES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_BASIC_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DETENTION_LOADING}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DETENTION_UNLOADING}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_LOADING_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_UNLOADING_CHARGE}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_ROUTING_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_TRANSHIPMENT_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_OTHER_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_DEDUCTION_CHARGES}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{totals.TOTAL_FREIGHT_AMOUNT}</td>
                </tr>
              </tfoot>
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
