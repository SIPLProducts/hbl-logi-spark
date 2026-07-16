import { useState, useEffect, useRef, type ReactNode } from "react";
import { Search } from "lucide-react";
import { createFileRoute } from "@tanstack/react-router";
import Swal from "sweetalert2";
// @ts-ignore
import service from "@/services/generalservice_service";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
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
import { counts, type WorklistRow } from "@/lib/le-mock-data";
import { cn } from "@/lib/utils";
import { InsuranceClaimTrackingSapCreate } from "@/components/insurance-claim-tracking-sap-create";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";


export const Route = createFileRoute("/insurance-claim-tracking")({
  component: InsuranceClaimTrackingPage,
});

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SapMode = "with" | "without";

const SEARCH_TYPES = [
  "Reference",
  "Invoice",
  "ODN",
  "SO Number",
  "Work Order",
  "LR Number",
] as const;
const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;
const SEARCH_TYPE_TO_KEY: Record<(typeof SEARCH_TYPES)[number], keyof WorklistRow> = {
  Reference: "reference",
  Invoice: "reference",
  ODN: "reference",
  "SO Number": "reference",
  "Work Order": "workOrder",
  "LR Number": "lrNumber",
};

type FieldDef = {
  label: string;
  value?: string | number;
  type?: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  span?: 1 | 2 | 3 | 4;
};

type FieldGroup = {
  title: string;
  fields: FieldDef[];
};

type WorklistColumn = {
  key: keyof WorklistRow | string;
  header: string;
  render?: (r: WorklistRow) => ReactNode;
  className?: string;
};

const DEFAULT_COLUMNS: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "reference", header: "Reference", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

// ─────────────────────────────────────────────────────────────
// Page-specific static configuration
// ─────────────────────────────────────────────────────────────

const PAGE_TITLE = "Insurance Claim";
const PAGE_COLUMNS = DEFAULT_COLUMNS;
const PAGE_ROWS: WorklistRow[] = [];


const PAGE_GROUPS: FieldGroup[] = [
  {
    title: "Damage",
    fields: [
      { label: "Shipment No.", value: "SHP-2026-0042" },
      { label: "LR No.", value: "6756557" },
      { label: "Material", value: "OPTIMUZ SMF BATTERY_OI" },
      { label: "Damaged Qty", value: 3, type: "number" },
      { label: "Damage Type", value: "Leak", type: "select", options: ["Wet", "Crushed", "Broken", "Leak"] },
      { label: "Stage Detected", value: "Customer Receipt", type: "select", options: ["Loading", "In Transit", "Unloading", "Customer Receipt"] },
    ],
  },
  {
    title: "Reporting",
    fields: [
      { label: "Reported By", value: "Harshini Lingutla" },
      { label: "Reported Date", value: "2026-06-13T09:00", type: "date" },
      { label: "Photo / Evidence", value: "damage-shp-2026-0042-01.jpg" },
      { label: "Cost Estimate", value: 28500, type: "number" },
      { label: "Recovery From", value: "Transporter", type: "select", options: ["Transporter", "Insurance", "HBL"] },
    ],
  },
  {
    title: "Remarks",
    fields: [
      { label: "Remarks", value: "Top-layer crate dented; 3 cells leaking, isolated and replaced.", span: 4, type: "textarea" },
    ],
  },
];

function renderDirectionExtras(casesCount: number) {
  return (
    <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-indigo-300/60 bg-indigo-100 dark:bg-indigo-500/15 text-[11px] font-semibold text-indigo-800 dark:text-indigo-200">
      <ClipboardList className="size-3" />
      No. of Cases Reported
      <span className="font-mono">{casesCount}</span>
    </span>
  );
}

function renderCreateBody({ sap, direction }: { sap: SapMode; direction: "outward" | "inward" }) {
  return direction === "outward" ? (
    <InsuranceClaimTrackingSapCreate mode={sap === "with" ? "with" : "without"} />
  ) : null;
}

// ─────────────────────────────────────────────────────────────
// Page component
// ─────────────────────────────────────────────────────────────


function InsuranceClaimTrackingPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [selectedId, setSelectedId] = useState<string>(PAGE_ROWS[0]?.id ?? "");
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [searchType, setSearchType] = useState<(typeof SEARCH_TYPES)[number]>("Reference");
  const [searchValue, setSearchValue] = useState("");

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

  const [dispatchData, setDispatchData] = useState<any[]>([]);
  const [insuranceTrackingHeader, setInsuranceTrackingHeader] = useState<any[]>([]);
  const [insuranceTrackingItems, setInsuranceTrackingItems] = useState<any[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [casesCount, setCasesCount] = useState(0);
  type PlantData = { PLANT: string; PLANT_DESC: string };
  type DivData = { DIVISION: string; DIV_TEXT: string };
  type TransporterData = { code: string; name: string };

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

  const clearSearchData = () => {
    setApplied(false);
    setDispatchData([]);
    setInsuranceTrackingHeader([]);
    setInsuranceTrackingItems([]);
    setLoading(false);
  };

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");

    setDispatchData([]);
    setInsuranceTrackingHeader([]);
    setInsuranceTrackingItems([]);

    setApplied(false);
  };

  const handleDirectionChange = (dir: "outward" | "inward") => {
    setDirection(dir);
    setSap(null);

    setPendingCount(0);
    setCompletedCount(0);
    setCasesCount(0);
  };

  const filteredRows = searchValue.trim()
    ? PAGE_ROWS.filter((r) => {
      const key = SEARCH_TYPE_TO_KEY[searchType];
      const v = String((r as Record<string, unknown>)[key] ?? "").toLowerCase();
      return v.includes(searchValue.trim().toLowerCase());
    })
    : PAGE_ROWS;

  const handleSearchSapChange = (value: SapMode) => {
    setSearchSap(value);

    setDispatchData([]);
    setInsuranceTrackingHeader([]);
    setInsuranceTrackingItems([]);

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

  useEffect(() => {
    const loadF4Data = async () => {
      setTransporterLoading(true);
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        // Plant
        const plants: PlantData[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: any) => ({
            PLANT: p.PLANT,
            PLANT_DESC: p.PLANT_DESC,
          }))
          : [];

        // Division (de-duped from PLANT array)
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

        // Transporter — from VEND_CODE array
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

  const transporterDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchTransporterList = async (search: string) => {
    try {
      setTransporterLoading(true);

      const payload = { ZUSER: getLoggedInUser(), SEARCH: search };
      const res = await service.fetchTransporterF4(payload); // adjust to your real endpoint name

      const list = Array.isArray(res) ? res : res?.DATA || res?.ITEMS || [];

      setTransporterOptions(
        list.map((t: any) => ({
          code: t.ZTRANSPORTER || t.LIFNR || t.CODE || "",
          name: t.ZTRANS_NAME || t.NAME1 || t.NAME || "",
        }))
      );
    } catch (err) {
      console.error("Transporter F4 fetch error:", err);
      setTransporterOptions([]);
    } finally {
      setTransporterLoading(false);
    }
  };

  const onTransporterSearch = (query: string) => {
    if (transporterDebounce.current) clearTimeout(transporterDebounce.current);
    transporterDebounce.current = setTimeout(() => fetchTransporterList(query), 300);
  };

  const applyFilter = async () => {
    if (!fromDate || !toDate) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select From Date and To Date",
      });
      return;
    }

    setApplied(false);

    setDispatchData([]);
    setInsuranceTrackingHeader([]);
    setInsuranceTrackingItems([]);

    const payload = {
      GLOBAL: "INSURANCE CLAIM STATUS",
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

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Invalid SAP Type selected",
        });

        return;
      }

      setLoading(false);

      if (res?.STATUS === "FALSE") {
        setInsuranceTrackingHeader([]);
        setInsuranceTrackingItems([]);
        setDispatchData([]);

        Swal.fire({
          icon: "info",
          title: "No Data Found",
          text: res?.MSG || "No records available for selected filters",
        });

        return;
      }

      setApplied(true);

      if (fStatus === "Completed") {
        const headers = res?.HEADER || [];
        const items = res?.ITEMS || [];

        setInsuranceTrackingHeader(headers);
        setInsuranceTrackingItems(items);
        setDispatchData([]);

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Headers: ${headers.length}, Items: ${items.length}`,
        });
      } else if (fStatus === "Pending") {
        let records = [];

        if (Array.isArray(res)) {
          records = res;
        } else if (res?.HEADER) {
          records = res.HEADER;
        } else if (res?.DATA) {
          records = res.DATA;
        }

        setDispatchData(records);
        setInsuranceTrackingHeader([]);
        setInsuranceTrackingItems([]);

        Swal.fire({
          icon: "success",
          title: "Success",
          text: `Dispatch Records: ${records.length}`,
        });
      } else {
        setInsuranceTrackingHeader([]);
        setInsuranceTrackingItems([]);
        setDispatchData([]);

        Swal.fire({
          icon: "info",
          title: "Info",
          text: "Please select valid status",
        });
      }
    } catch (error) {
      console.error("Filter Error:", error);

      setLoading(false);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to fetch data",
      });
    }
  };

  // ---------------------------------------------------------------------
  // Excel export — Insurance Claim field set
  // ---------------------------------------------------------------------

  const downloadExcel = () => {
    let exportSource: any[] = [];
    let fileName = "";

    if (fStatus === "Completed") {
      const combinedData: any[] = [];

      insuranceTrackingItems.forEach((item) => {
        const header = insuranceTrackingHeader.find(
          (h: any) => h.ZREFNO === item.ZREFNO
        );

        combinedData.push({
          ...(header || {}),
          ...item,
        });
      });

      exportSource = combinedData;

      fileName =
        searchSap === "with"
          ? "InsuranceClaimTracking_Completed_SAP.xlsx"
          : "InsuranceClaimTracking_Completed_NonSAP.xlsx";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;

      fileName =
        searchSap === "with"
          ? "Dispatch_Pending_SAP.xlsx"
          : "Dispatch_Pending_NonSAP.xlsx";
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select valid status before download.",
      });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "No data available to download.",
      });
      return;
    }

    let exportData: any[] = [];

    // ================= COMPLETED =================
    if (fStatus === "Completed") {
      exportData = exportSource.map((record) => ({
        "Map ID": record.ZMAPID || "",
        REFNO: record.ZREFNO || "",
        "Invoice No": record.ZINV_NO || "",
        "ODN Number": record.ZODN_NO || "",
        "SO Number": record.ZSO_NO || "",
        "Fiscal Year": record.ZFI || "",

        "Reported Date": record.ZREP_DATE || "",
        "Claim Reference": record.ZCLAIM_REF || "",
        "Invoice Date": record.ZINV_DATE || "",
        "Invoice Base Value": record.ZINV_BV || "",
        "Supporting Document": record.ZSUPT_DOC || "",
        "Approve Document": record.ZAPP_DOC || "",
        "Loss Declared": record.ZLOSS_DCL || "",
        "Claim Received": record.ZCLM_RF || "",
        "Salvage Value": record.ZSOL_VAL || "",
        Customer: record.ZCUSTOMER || "",
        Location: record.ZLOCATION || "",
        "Damage Remarks": record.ZDAMAGE_RMK || "",
        "Claim Info Sent": record.ZCLM_INF || "",
        "Claim Status": record.ZCLM_ST || "",
        "Claim Document Status": record.ZCLM_DOC_ST || "",
        "Courier Details": record.ZCOURIER_DET || "",
        "Payment Status": record.ZPAY_ST || "",
        "Payment Info": record.ZPAY_INFO || "",
        UTR: record.ZUTR || "",

        "Claim Settlement Date": record.ZCLM_SET_DT
          ? new Date(record.ZCLM_SET_DT).toLocaleDateString("en-GB")
          : "",

        "Sale Person": record.ZSALE_PERSON || "",
        Plant: record.ZPLANT || "",
        Division: record.ZDIVISION || "",

        "Created Date": record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB")
          : "",

        "Vehicle Type": record.ZVEH_TYPE || "",

        // Line Items
        "Vehicle Line": record.ZVEH_LINE || "",
        "Vehicle Number": record.ZTRUCK_NO || "",
        AH: record.ZAH || "",
        "No of Sets": record.ZNO_SETS || "",
        "LR No": record.ZLRNO || "",
        "Work Order Number": record.ZWORK_ORDER || "",
        Transporter: record.ZTRANSPORTER || "",
        "Bill No": record.ZBILLNO || "",
      }));
    }
    // ================= PENDING =================
    else {
      exportData = exportSource.map((record) => ({
        "Reference No": record.ZREFNO || "",

        Date: record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB")
          : "",

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

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Records");

    worksheet["!cols"] = Object.keys(exportData[0]).map((key) => ({
      wch: Math.max(key.length + 5, 18),
    }));

    XLSX.writeFile(workbook, fileName);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: `${fileName} downloaded successfully.`,
    });
  };

  // ---------------------------------------------------------------------
  // PDF export — Insurance Claim field set
  // ---------------------------------------------------------------------

  const downloadPDF = () => {
    let exportSource: any[] = [];
    let fileName = "";
    let reportTitle = "";

    if (fStatus === "Completed") {
      const combinedData: any[] = [];

      insuranceTrackingItems.forEach((item) => {
        const header = insuranceTrackingHeader.find(
          (h: any) => h.ZREFNO === item.ZREFNO
        );

        combinedData.push({
          ...(header || {}),
          ...item,
        });
      });

      exportSource = combinedData;

      fileName =
        searchSap === "with"
          ? "InsuranceClaimTracking_Completed_SAP.pdf"
          : "InsuranceClaimTracking_Completed_NonSAP.pdf";

      reportTitle = "Insurance Claim Tracking Records (Completed)";
    } else if (fStatus === "Pending") {
      exportSource = dispatchData;

      fileName =
        searchSap === "with"
          ? "Dispatch_Pending_SAP.pdf"
          : "Dispatch_Pending_NonSAP.pdf";

      reportTitle = "Dispatch Records (Pending)";
    } else {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select valid status.",
      });
      return;
    }

    if (!exportSource.length) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "No data available.",
      });
      return;
    }

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a2",
    });

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");

    doc.text(reportTitle, doc.internal.pageSize.getWidth() / 2, 12, {
      align: "center",
    });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      doc.internal.pageSize.getWidth() / 2,
      18,
      { align: "center" }
    );

    let headers: any[] = [];
    let rows: any[] = [];

    // ================= COMPLETED =================
    if (fStatus === "Completed") {
      headers = [[
        "SI.No",
        "Map ID",
        "REFNO",
        "Invoice No",
        "ODN Number",
        "SO Number",
        "Fiscal Year",
        "Reported Date",
        "Claim Reference",
        "Invoice Date",
        "Invoice Base Value",
        "Loss Declared",
        "Claim Received",
        "Salvage Value",
        "Customer",
        "Location",
        "Damage Remarks",
        "Claim Info Sent",
        "Claim Status",
        "Claim Document Status",
        "Courier Details",
        "Payment Status",
        "Payment Info",
        "UTR",
        "Claim Settlement Date",
        "Sale Person",
        "Plant",
        "Division",
        "Created Date",
        "Vehicle Type",
        "Vehicle Line",
        "Vehicle Number",
        "AH",
        "No of Sets",
        "LR No",
        "Work Order",
        "Transporter",
        "Bill No",
      ]];

      rows = exportSource.map((record, index) => [
        index + 1,
        record.ZMAPID || "",
        record.ZREFNO || "",
        record.ZINV_NO || "",
        record.ZODN_NO || "",
        record.ZSO_NO || "",
        record.ZFI || "",
        record.ZREP_DATE || "",
        record.ZCLAIM_REF || "",
        record.ZINV_DATE || "",
        record.ZINV_BV || "",
        record.ZLOSS_DCL || "",
        record.ZCLM_RF || "",
        record.ZSOL_VAL || "",
        record.ZCUSTOMER || "",
        record.ZLOCATION || "",
        record.ZDAMAGE_RMK || "",
        record.ZCLM_INF || "",
        record.ZCLM_ST || "",
        record.ZCLM_DOC_ST || "",
        record.ZCOURIER_DET || "",
        record.ZPAY_ST || "",
        record.ZPAY_INFO || "",
        record.ZUTR || "",
        record.ZCLM_SET_DT
          ? new Date(record.ZCLM_SET_DT).toLocaleDateString("en-GB")
          : "",
        record.ZSALE_PERSON || "",
        record.ZPLANT || "",
        record.ZDIVISION || "",
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB")
          : "",
        record.ZVEH_TYPE || "",
        record.ZVEH_LINE || "",
        record.ZTRUCK_NO || "",
        record.ZAH || "",
        record.ZNO_SETS || "",
        record.ZLRNO || "",
        record.ZWORK_ORDER || "",
        record.ZTRANSPORTER || "",
        record.ZBILLNO || "",
      ]);
    }
    // ================= PENDING =================
    else {
      headers = [[
        "SI.No",
        "Reference No",
        "Date",
        "Plant",
        "Division",
        "Vehicle Type",
        "No. Trucks",
        "Work Order",
        "Vendor Code",
        "Transporter",
        "No. LRs",
        "LR Number",
        "Loading Point",
        "Unloading Point",
      ]];

      rows = exportSource.map((record, index) => [
        index + 1,
        record.ZREFNO || "",
        record.ZCREATED_DT
          ? new Date(record.ZCREATED_DT).toLocaleDateString("en-GB")
          : "",
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
      body: rows,
      startY: 25,
      theme: "grid",

      styles: {
        fontSize: 6,
        cellPadding: 1.5,
      },

      headStyles: {
        fillColor: [52, 152, 219],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 6,
      },

      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    doc.save(fileName);

    Swal.fire({
      icon: "success",
      title: "Success",
      text: `${fileName} downloaded successfully.`,
    });
  };

  // ---------------------------------------------------------------------
  // Optional: view uploaded Supporting / Approve documents from header table
  // ---------------------------------------------------------------------

  const viewCertificate = (item: any, kind: "supporting" | "approve") => {
    const path = kind === "supporting" ? item.ZSUPT_PATH || item.ZSUPT_DOC : item.ZAPP_PATH || item.ZAPP_DOC;
    if (!path) return;
    window.open(path, "_blank");
  };

  const fetchPendingAndCompletedCounts = async (sapMode: SapMode) => {
    try {
      const payload = {
        INOUT: "OUTWARD",
        TRANS_TYPE: sapMode === "with" ? "WITHSAP" : "WITHOUTSAP",
        SCREEN: "INSURANCE CLAIM STATUS",
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

  return (
    <div className="flex flex-col min-h-full">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "create" | "search")}
        className="w-full"
      >
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
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tab content */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">
          {/* ───────── Create tab ───────── */}
          <TabsContent value="create" className="mt-0 space-y-2">
            {/* Direction + SAP */}
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

            {direction && sap && (() => {
              const override = renderCreateBody({ sap, direction });
              if (override) return override;
              return (
                <>
                  {PAGE_GROUPS.map((g) => (
                    <div
                      key={g.title}
                      className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-hairline bg-surface-2/60">
                        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                          {g.title}
                        </h3>
                      </div>
                      <div className="p-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5">
                        {g.fields.map((f) => (
                          <div key={f.label} className={spanClass(f.span)}>
                            <FieldInput field={f} />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}

            {/* Action bar */}
            {direction && sap && !renderCreateBody({ sap, direction }) && (
              <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface/95 backdrop-blur border-t border-hairline px-6 py-3 flex items-center justify-end gap-2 z-10">
                <button className="inline-flex items-center gap-1.5 px-3 h-9 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted">
                  <ChevronLeft className="size-3.5" /> Save and Previous
                </button>
                <button className="inline-flex items-center gap-1.5 px-3 h-9 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted">
                  <Save className="size-3.5" /> Save
                </button>
                <button className="inline-flex items-center gap-1.5 px-4 h-9 text-[12px] font-semibold text-primary-foreground bg-gradient-primary rounded-lg shadow-cta hover:-translate-y-0.5 transition-transform">
                  Save and Next <ChevronRight className="size-3.5" />
                </button>
              </div>
            )}
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
                <SearchSapToggle
                  value={searchSap}
                  onChange={handleSearchSapChange}
                />
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
                          (insuranceTrackingHeader.length === 0 ||
                            insuranceTrackingItems.length === 0)) ||
                        (fStatus === "Pending" &&
                          dispatchData.length === 0)
                      }
                    >
                      <FileText className="size-3.5 text-red-600" />
                      Download PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={downloadExcel}
                      disabled={
                        !applied ||
                        (fStatus === "Completed" &&
                          (insuranceTrackingHeader.length === 0 ||
                            insuranceTrackingItems.length === 0)) ||
                        (fStatus === "Pending" &&
                          dispatchData.length === 0)
                      }
                    >
                      <FileDown className="size-3.5 text-emerald-600" />
                      Download Excel
                    </Button>
                    <Button
                      size="sm"
                      onClick={applyFilter}
                      disabled={loading}
                      className="gap-1.5"
                    >
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
                      {filteredRows.length} row{filteredRows.length === 1 ? "" : "s"}
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
                              <th className="px-3 py-2.5 whitespace-nowrap">REFNO</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Odn Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">SO Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Fiscal Year</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Reported Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Reference</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice Base Value</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Supporting Document</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Approve Document</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Loss Declared</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Received</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Salvage Value</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Customer</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Location</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Damage Remarks</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Info Sent</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Status</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Document Status</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Courier Details</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Payment Status</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Payment Info</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">UTR</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Claim Settlement Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Sale Person</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Plant</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Division</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Created Date</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Type</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-hairline/70">
                            {insuranceTrackingHeader.length === 0 ? (
                              <tr>
                                <td colSpan={31} className="px-3 py-10 text-center text-muted-foreground">
                                  No Header Records Found
                                </td>
                              </tr>
                            ) : (
                              insuranceTrackingHeader.map((item: any, index: number) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-surface hover:bg-muted/50"
                                      : "bg-surface-2/40 hover:bg-muted/50"
                                  }
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_NO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZODN_NO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZSO_NO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZFI}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZREP_DATE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCLAIM_REF}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_DATE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_BV}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZSUPT_DOC ? (
                                      <button
                                        onClick={() => viewCertificate(item, "supporting")}
                                        className="text-accent underline hover:no-underline"
                                      >
                                        {item.ZSUPT_DOC}
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZAPP_DOC ? (
                                      <button
                                        onClick={() => viewCertificate(item, "approve")}
                                        className="text-accent underline hover:no-underline"
                                      >
                                        {item.ZAPP_DOC}
                                      </button>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZLOSS_DCL}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCLM_RF}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZSOL_VAL}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCUSTOMER}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZLOCATION}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZDAMAGE_RMK}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCLM_INF}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCLM_ST}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCLM_DOC_ST}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZCOURIER_DET}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZPAY_ST}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZPAY_INFO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZUTR}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZCLM_SET_DT
                                      ? new Date(item.ZCLM_SET_DT).toLocaleDateString("en-GB")
                                      : ""}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZSALE_PERSON}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZPLANT}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZDIVISION}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    {item.ZCREATED_DT
                                      ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB")
                                      : ""}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_TYPE}</td>
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
                              <th className="px-3 py-2.5 whitespace-nowrap">Map ID</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">REFNO</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Invoice No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Line</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Type</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Vehicle Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">AH</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">No of Sets</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">LR No</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Work Order Number</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Transporter</th>
                              <th className="px-3 py-2.5 whitespace-nowrap">Bill No</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-hairline/70">
                            {insuranceTrackingItems.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={13}
                                  className="px-3 py-10 text-center text-[12px] text-muted-foreground"
                                >
                                  No Line Items Found.
                                </td>
                              </tr>
                            ) : (
                              insuranceTrackingItems.map((item: any, index: number) => (
                                <tr
                                  key={index}
                                  className={
                                    index % 2 === 0
                                      ? "bg-surface hover:bg-muted/50"
                                      : "bg-surface-2/40 hover:bg-muted/50"
                                  }
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">{index + 1}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZMAPID}</td>
                                  <td className="px-3 py-2 whitespace-nowrap font-mono">{item.ZREFNO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZINV_NO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZVEH_LINE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZVEHICLE}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZTRUCK_NO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZAH}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZNO_SETS}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZLRNO}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZWORK_ORDER}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZTRANSPORTER}</td>
                                  <td className="px-3 py-2 whitespace-nowrap">{item.ZBILLNO}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}

                {applied &&
                  fStatus === "Pending" &&
                  dispatchData.length > 0 && (
                    <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                      <div className="px-4 py-3 border-b border-hairline bg-surface-2/60">
                        <h3 className="font-semibold">
                          Pending Dispatch Records
                        </h3>
                      </div>

                      <div className="overflow-x-auto max-h-[550px]">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead className="sticky top-0 z-30">
                            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                              <th className="px-3 py-2">SI.No</th>
                              <th className="px-3 py-2">Reference No</th>
                              <th className="px-3 py-2">Date</th>
                              <th className="px-3 py-2">Plant</th>
                              <th className="px-3 py-2">Division</th>
                              <th className="px-3 py-2">Vehicle Type</th>
                              <th className="px-3 py-2">No. of Trucks</th>
                              <th className="px-3 py-2">Work Order</th>
                              <th className="px-3 py-2">Vendor Code</th>
                              <th className="px-3 py-2">Transporter</th>
                              <th className="px-3 py-2">No. of LRs</th>
                              <th className="px-3 py-2">LR Number</th>
                              <th className="px-3 py-2">Loading Point</th>
                              <th className="px-3 py-2">Unloading Point</th>
                              <th className="px-3 py-2">No Of Invoices</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-hairline/70">
                            {dispatchData.map((item: any, index: number) => (
                              <tr
                                key={index}
                                className={
                                  index % 2 === 0
                                    ? "bg-surface hover:bg-muted/50"
                                    : "bg-surface-2/40 hover:bg-muted/50"
                                }
                              >
                                <td className="px-3 py-2">{index + 1}</td>
                                <td className="px-3 py-2 font-mono">{item.ZREFNO}</td>
                                <td className="px-3 py-2">
                                  {item.ZCREATED_DT
                                    ? new Date(item.ZCREATED_DT).toLocaleDateString("en-GB")
                                    : ""}
                                </td>
                                <td className="px-3 py-2">{item.ZWERKS}</td>
                                <td className="px-3 py-2">{item.ZDIVISION}</td>
                                <td className="px-3 py-2">{item.ZVEH_TYPE}</td>
                                <td className="px-3 py-2">{item.ZNO_TRUCKS}</td>
                                <td className="px-3 py-2">{item.ZWORK_ORDER}</td>
                                <td className="px-3 py-2">{item.ZVENDOR_CD}</td>
                                <td className="px-3 py-2">{item.ZTRANSPORTER}</td>
                                <td className="px-3 py-2">{item.ZNO_LRS}</td>
                                <td className="px-3 py-2">{item.ZLR_NO}</td>
                                <td className="px-3 py-2">{item.ZLOAD_PT}</td>
                                <td className="px-3 py-2">{item.ZUNLOAD_PT}</td>
                                <td className="px-3 py-2">{item.ZNO_INVOICES}</td>
                              </tr>
                            ))}
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

function spanClass(span?: 1 | 2 | 3 | 4) {
  switch (span) {
    case 2:
      return "md:col-span-2";
    case 3:
      return "md:col-span-2 lg:col-span-3";
    case 4:
      return "md:col-span-2 lg:col-span-4";
    default:
      return "";
  }
}

function FieldInput({ field }: { field: FieldDef }) {
  const { label, value, type = "text", options } = field;
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      {type === "select" ? (
        <select
          defaultValue={value as string}
          className="bg-surface border border-input rounded-md px-2 h-9 text-[12px] outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/30"
        >
          {(options ?? [String(value ?? "Select")]).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          defaultValue={value as string}
          rows={2}
          className="bg-surface border border-input rounded-md px-2 py-1.5 text-[12px] outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/30"
        />
      ) : (
        <input
          type={type === "date" ? "datetime-local" : type}
          defaultValue={value as string | number}
          className="bg-surface border border-input rounded-md px-2 h-9 text-[12px] outline-none focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/30 font-mono"
        />
      )}
    </div>
  );
}

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

function PremiumRadio({
  label,
  checked,
  onSelect,
}: {
  label: string;
  checked: boolean;
  onSelect: () => void;
}) {
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
        <span
          className={cn(
            "size-1.5 rounded-full transition-all",
            checked ? "bg-accent scale-100" : "bg-transparent scale-0",
          )}
        />
      </span>
      {label}
    </button>
  );
}

function SearchSapToggle({
  value,
  onChange,
}: {
  value: SapMode | null;
  onChange: (v: SapMode) => void;
}) {
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
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 justify-start text-left font-normal",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="size-4 mr-2 text-muted-foreground" />
            {value ? format(value, "dd-MM-yyyy") : <span>dd-mm-yyyy</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
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
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function PlantF4Field({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { PLANT: string; PLANT_DESC: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.PLANT === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Plant
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("h-8 justify-between font-normal", !value && "text-muted-foreground")}
          >
            <span className="truncate">
              {selected ? `${selected.PLANT} - ${selected.PLANT_DESC}` : "Select Plant"}
            </span>
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
                  onClick={() => {
                    onChange(o.PLANT);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-muted",
                    value === o.PLANT && "bg-accent/10 font-semibold",
                  )}
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

function DivisionF4Field({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { DIVISION: string; DIV_TEXT: string }[];
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.DIVISION === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Division
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 justify-between font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected ? selected.DIVISION : "Select Division"}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <div className="max-h-56 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                No divisions available
              </div>
            ) : (
              options.map((o) => (
                <button
                  key={o.DIVISION}
                  type="button"
                  onClick={() => {
                    onChange(o.DIVISION);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-muted",
                    value === o.DIVISION && "bg-accent/10 font-semibold"
                  )}
                >
                  {o.DIVISION}
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
  value,
  onChange,
  options,
  loading,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
  loading: boolean;
}) {
  const [open, setOpen] = useState(false);

  const selected = options.find((o) => o.code === value);

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Transporter
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-8 justify-between font-normal w-full",
              !value && "text-muted-foreground"
            )}
          >
            <span className="truncate">
              {selected ? selected.name : "Select Transporter"}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80 p-0" align="start">
          <div className="max-h-60 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                Loading…
              </div>
            ) : options.length === 0 ? (
              <div className="px-3 py-4 text-center text-[12px] text-muted-foreground">
                No transporters found
              </div>
            ) : (
              options.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => {
                    onChange(o.code);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-[12px] hover:bg-muted",
                    value === o.code && "bg-accent/10 font-semibold"
                  )}
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