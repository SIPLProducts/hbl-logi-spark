import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import { Link } from "@tanstack/react-router";
import Swal from "sweetalert2";
import { format } from "date-fns";
import {
  ArrowUpDown,
  CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileText,
  Filter,
  Home,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  Truck,
} from "lucide-react";
import { exportRowsToXls } from "@/lib/export-xls";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { Badge } from "@/components/ui/badge";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { cn } from "@/lib/utils";
import {
  DIVISIONS,
  PLANTS,
  SEARCH_TYPES,
  TRANSPORTERS,
  VEHICLE_TYPES,
  emptyDispatchRow,
  type DispatchResultRow,
  type DispatchRow,
} from "@/lib/dispatch-mock";


export const Route = createFileRoute("/dispatch")({
  component: DispatchPage,
});

type SapMode = "with" | "without";

// Columns in the Dispatch Lines table that must be filled in before the row can be saved.
const MANDATORY_HEADERS = new Set([
  "Vehicle Type",
  "Trucks",
  "Invoices",
  "Plant",
  "Division",
  "LRs QTY",
  "LR No",
  "Load Pts",
  "Unload Pts",
]);

// Matching keys on DispatchRow for the same mandatory columns above.
const MANDATORY_KEYS: (keyof DispatchRow)[] = [
  "vehicleType",
  "noOfTrucks",
  "noOfInvoices",
  "plant",
  "division",
  "noOfLRs",
  "lrNumber",
  "loadingPoints",
  "unloadingPoints",
];

function isFieldEmpty(row: DispatchRow, key: keyof DispatchRow) {
  const v = row[key];
  if (typeof v === "number") return Number.isNaN(v);
  return !v || String(v).trim() === "";
}

function getMissingFields(row: DispatchRow) {
  return MANDATORY_KEYS.filter((k) => isFieldEmpty(row, k));
}

function getLoggedInUser() {
  try {
    const raw = localStorage.getItem("currentUser") || localStorage.getItem("userData");
    if (!raw) return "";
    const user = JSON.parse(raw) as Record<string, unknown>;
    return String(
      user?.USER ??
      user?.USERNAME ??
      user?.USER_ID ??
      user?.EMP_ID ??
      user?.EMAIL ??
      `${user?.FIRST_NAME ?? ""} ${user?.LAST_NAME ?? ""}`.trim() ??
      "",
    );
  } catch {
    return "";
  }
}

function DispatchPage() {
  const [tab, setTab] = useState<"create" | "search">("create");

  return (
    <div className="flex flex-col min-h-full bg-background">
      <Tabs value={tab} onValueChange={(v: string) => setTab(v as "create" | "search")} className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <Breadcrumb className="mb-1.5">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="inline-flex items-center gap-1.5">
                    <Home className="size-3.5" />
                    Logistics Execution
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Dispatch</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <Truck className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  Dispatch
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
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted cursor-pointer"
              >
                <RefreshCw className="size-3.5" /> Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">
          <TabsContent value="create" className="mt-0">
            <CreateDispatch />
          </TabsContent>
          <TabsContent value="search" className="mt-0">
            <SearchDispatch />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

type VendorData = {
  VENDOR_CODE: number;
  TRANSPORTER: string;
};

type PlantData = {
  PLANT: string;
  PLANT_DESC: string;
  DIVISION: string;
  PLANT_TEXT: string;
  DIV_TEXT: string;
};

/* ──────────────────────────────────── Mode 1 — Create ──────────────────────────────────── */

function CreateDispatch() {
  const [sap, setSap] = useState<SapMode | null>(null);
  const [fetchedVendors, setFetchedVendors] = useState<{ vendorCode: string; transporter: string }[]>([]);
  const [fetchedPlants, setFetchedPlants] = useState<string[]>([]);
  const [fetchedDivisions, setFetchedDivisions] = useState<string[]>([]);
  const [fetchedTransporters, setFetchedTransporters] = useState<string[]>([]);
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [searchType, setSearchType] = useState<string>(SEARCH_TYPES[1]);
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState<DispatchRow[]>([emptyDispatchRow(1)]);
  const [showErrors, setShowErrors] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchReference, setSearchReference] = useState<string>("");
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const isLockedRow = (index: number) => index !== 0;
  const [originalTotals, setOriginalTotals] = useState({
    trucks: 0,
    invoices: 0,
    lrs: 0,
    loadPts: 0,
    unloadPts: 0,
  });
  function formatCreatedDate(d?: string) {
    if (!d) return "";
    try {
      return format(new Date(d), "dd-MMM-yyyy");
    } catch {
      return d;
    }
  }
  const deleteRow = (id: string) => {
    setRows((prev) => {
      const filtered = prev.filter((r) => r.id !== id);

      if (filtered.length === 0) {
        return [emptyDispatchRow(1)];
      }

      return redistributeRows(filtered.length, filtered);
    });
  };
  const updateRow = (id: string, patch: Partial<DispatchRow>) => {
    setRows((prev) => {
      const updated = prev.map((row) =>
        row.id === id ? { ...row, ...patch } : row
      );

      if (updated[0]?.id === id) {
        setOriginalTotals({
          trucks: updated[0].noOfTrucks || 0,
          invoices: updated[0].noOfInvoices || 0,
          lrs: updated[0].noOfLRs || 0,
          loadPts: Number(updated[0].loadingPoints || 0),
          unloadPts: Number(updated[0].unloadingPoints || 0),
        });
      }

      return updated;
    });
  };

  const redistributeRows = (
    rowCount: number,
    existingRows: DispatchRow[]
  ) => {
    const firstRow = existingRows[0];

    return Array.from({ length: rowCount }, (_, index) => ({
      ...(existingRows[index] ??
        emptyDispatchRow(index + 1)),

      slNo: index + 1,

      vehicleType: firstRow.vehicleType,
      workOrder: firstRow.workOrder,
      vendorCode: firstRow.vendorCode,
      transporter: firstRow.transporter,
      plant: firstRow.plant,
      division: firstRow.division,
      // lrNumber:
      //   originalTotals.lrs > 1
      //     ? index === 0
      //       ? firstRow.lrNumber
      //       : ""
      //     : firstRow.lrNumber,
      lrNumber: index === 0 ? firstRow.lrNumber : "",
      remarks: firstRow.remarks,

      noOfTrucks: splitValue(
        originalTotals.trucks,
        rowCount,
        index
      ),

      noOfInvoices: splitValue(
        originalTotals.invoices,
        rowCount,
        index
      ),

      noOfLRs: splitValue(
        originalTotals.lrs,
        rowCount,
        index
      ),

      loadingPoints: String(
        splitValue(
          originalTotals.loadPts,
          rowCount,
          index
        )
      ),

      unloadingPoints: String(
        splitValue(
          originalTotals.unloadPts,
          rowCount,
          index
        )
      ),
    }));
  };

  const countParts = (s: string) =>
    s.split(",").map((p) => p.trim()).filter(Boolean).length;

  const maxAllowed = useMemo(() => {
    const totalTrucks = rows.reduce((sum, row) => sum + (row.noOfTrucks || 0), 0);
    const totalInvoices = rows.reduce((sum, row) => sum + (row.noOfInvoices || 0), 0);
    const totalLrs = rows.reduce((sum, row) => sum + (row.noOfLRs || 0), 0);
    const totalLoadPoints = rows.reduce((sum, row) => sum + countParts(row.loadingPoints), 0);
    const totalUnloadPoints = rows.reduce((sum, row) => sum + countParts(row.unloadingPoints), 0);

    const positiveTotals = [totalTrucks, totalInvoices, totalLrs, totalLoadPoints, totalUnloadPoints].filter((value) => value > 0);
    return positiveTotals.length > 0 ? Math.max(...positiveTotals) : 1;
  }, [rows]);

  const showActionCol = maxAllowed > 1 || rows.length > 1;

  const distributeNumber = (total: number, count: number) => {
    const base = Math.floor(total / count);
    const remainder = total - base * count;
    return Array.from({ length: count }, (_, index) => base + (index < remainder ? 1 : 0));
  };

  // const collectParts = (field: keyof Pick<DispatchRow, "loadingPoints" | "unloadingPoints">) =>
  //   rows.flatMap((row) => row[field].split(",").map((part) => part.trim()).filter(Boolean));

  const distributeParts = (parts: string[], count: number) => {
    const counts = distributeNumber(parts.length, count);
    const distributed: string[] = [];
    let offset = 0;
    for (let i = 0; i < count; i += 1) {
      distributed.push(parts.slice(offset, offset + counts[i]).join(", "));
      offset += counts[i];
    }
    return distributed;
  };

  const splitValue = (total: number, totalRows: number, index: number) => {
    const perRow = Math.floor(total / totalRows);
    const remainder = total % totalRows;

    return perRow + (index < remainder ? 1 : 0);
  };

  const addRow = () => {
    setRows((prev) => {
      const rowCount = prev.length + 1;
      return redistributeRows(rowCount, prev);
    });
  };

  // Looks up an existing dispatch entry (mock data for now — swap for the real F4/search
  // API later) and loads it straight into the same Dispatch Lines table below, which also
  // switches the footer buttons into "Update" mode.
  const SEARCH_TYPE_TO_API_KEY: Record<string, keyof Omit<Record<string, string>, "zuser">> = {
    "Reference Number": "RNO",
    "LR Number": "LR_NO",
    Transporter: "TRANSPORTER",
    "Work Order": "WORK_ORDER",
  };

  const handleSearch = async () => {
    setIsLoading(true);

    try {
      if (!searchValue.trim()) {
        Swal.fire({
          text: "Please enter a search value.",
          icon: "warning",
        });
        return;
      }

      const field = SEARCH_TYPE_TO_API_KEY[searchType];

      if (!field) {
        Swal.fire({
          text: "Please select a valid search type.",
          icon: "warning",
        });
        return;
      }

      const payload = {
        RNO: "",
        LR_NO: "",
        TRANSPORTER: "",
        WORK_ORDER: "",
        zuser: getLoggedInUser(),   // ← lowercase, matches Angular
        [field]: searchValue.trim(),
      };

      console.log("Search Payload:", payload);

      const res =
        sap === "with"
          ? await service.fetchReferencenumber(payload)
          : await service.fetchReferencenumberWithoutSap(payload);

      console.log("Search Response:", res);

      if (res?.STATUS === "FALSE" || res?.NUMBER === "100") {
        Swal.fire({
          text: res?.MSG || "No records found.",
          icon: "warning",
        });
        return;
      }

      const data = Array.isArray(res)
        ? res
        : res?.DATA || res?.data || [];

      if (!data.length) {
        Swal.fire({
          text: "No records found for the search criteria.",
          icon: "info",
        });
        return;
      }

      const mapped: DispatchRow[] = data.map(
        (item: any, index: number) => ({
          id: String(index + 1),
          slNo: index + 1,
          zMapId: item.ZMAPID || 0,
          lrSpec: item.ZLRSPEC || "",
          referenceNo: item.REFNO || "",
          lineNo: item.LINE_NO || "",
          plant: item.WERKS || "",
          division: item.DIVISION || "",
          vehicleType: item.VEH_TYPE || "",
          noOfTrucks: Number(item.NO_TRUCKS || 0),
          workOrder: item.WORK_ORDER || "",
          vendorCode: String(item.VENDOR_CD || ""),
          transporter: item.TRANSPORTER || "",
          noOfLRs: Number(item.NO_LRS || 0),
          lrNumber: item.LR_NO || "",
          loadingPoints: item.LOAD_PT || "",
          unloadingPoints: item.UNLOAD_PT || "",
          noOfInvoices: Number(item.NO_INVOICES || 0),
          createdDate: item.CREATED_DT || "",
        })
      );

      setRows(mapped);
      setSearchReference(String(mapped[0]?.referenceNo || ""));
      setIsEditMode(true);

      Swal.fire({
        text: `${mapped.length} record${mapped.length > 1 ? "s" : ""} found successfully.`,
        icon: "success",
      });
    } catch (error) {
      console.error("Search API Error:", error);

      Swal.fire({
        text: "Failed to fetch data. Please try again.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updates an existing dispatch entry (loaded via Search) using the Edit API.
  // Kept fully separate from handleSave so the original create/save flow is untouched.
  const handleUpdate = async () => {
    try {
      const loggedInUser = getLoggedInUser();

      // ← plain array, no DISPATCH wrapper
      const payload = rows.map((row) => ({
        ZMAPID: row.zMapId || 0,
        REFNO: Number(searchReference) || Number(row.referenceNo) || 0,  // ← use searchReference
        LINE_NO: Number(row.lineNo) || 0,
        CREATED_DT: row.createdDate || "",
        VEH_TYPE: row.vehicleType || "",
        NO_TRUCKS: Number(row.noOfTrucks) || 0,
        NO_INVOICES: Number(row.noOfInvoices) || 0,
        WORK_ORDER: row.workOrder || "",
        VENDOR_CD: Number(row.vendorCode) || 0,
        TRANSPORTER: row.transporter || "",
        WERKS: row.plant || "",
        DIVISION: row.division || "",
        NO_LRS: Number(row.noOfLRs) || 0,
        LR_NO: row.lrNumber || "",
        ZLRSPEC: row.lrSpec || "0",
        LOAD_PT: row.loadingPoints || "",
        UNLOAD_PT: row.unloadingPoints || "",
        ZDIS_RM: row.remarks || "",
        ZUSER_CH: loggedInUser,
      }));

      console.log("🟡 Update Payload:", JSON.stringify(payload, null, 2));

      const res = await service.fetchReferencenumberEdit(payload);

      console.log("🟡 Update Response:", res);

      if (res?.STATUS === "TRUE" || res?.NUMBER === "200") {
        Swal.fire({
          text: res.MSG || "Dispatch data updated successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          resetForm();
          setSearchReference("");
        });
      } else {
        Swal.fire({
          text: res?.MSG || "Dispatch update failed!",
          icon: "error",
        });
      }
    } catch (err: any) {
      Swal.fire({
        text: err?.response?.data?.MSG || "Failed to update Dispatch!",
        icon: "error",
      });
    }
  };

  // Fetch F4 lookup data (vendor codes, plants, divisions, transporters) when SAP selection changes
  useEffect(() => {
    resetForm();

    const loadF4 = async () => {
      if (!sap) return;
      try {
        const res: any = await service.fetchVendorCode();
        // Response may be an array with a single object or an object directly
        const data = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        const vend: { vendorCode: string; transporter: string }[] = Array.isArray(data.VEND_CODE)
          ? data.VEND_CODE.map((v: VendorData) => ({
            vendorCode: String(v.VENDOR_CODE),
            transporter: v.TRANSPORTER,
          }))
          : [];

        // In BOTH CreateDispatch and SearchDispatch useEffect
        const plants: string[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: PlantData) => {
            const desc = String(p.PLANT_DESC || "").split("_")[0].trim();
            return `${p.PLANT}_${desc}`;
          })
          : [];

        const divisions: string[] = Array.isArray(data.PLANT)
          ? Array.from(new Set(data.PLANT.map((p: PlantData) => String(p.DIVISION || "")).filter(Boolean)))
          : [];

        const transporters: string[] = Array.from(new Set(vend.map((v) => v.transporter).filter(Boolean)));

        setFetchedVendors(vend);
        setFetchedPlants(plants);
        setFetchedDivisions(divisions.map((d) => d));
        setFetchedTransporters(transporters);
      } catch (err) {
        // ignore failures for now — leave defaults in place
        // console.error('F4 fetch failed', err);
      }
    };
    void loadF4();
    // only when sap toggles
  }, [sap]);

  // Rows that are still missing one or more mandatory fields.
  const invalidRowIds = useMemo(
    () => new Set(rows.filter((r) => getMissingFields(r).length > 0).map((r) => r.id)),
    [rows],
  );

  function resetForm() {
    setRows([emptyDispatchRow(1)]);
    setIsEditMode(false);
    setShowErrors(false);
    setSearchValue("");
    setSearchNotice(null);
    setSearchReference("");
  }

  const handleVehicleTypeChange = (
    vehicleType: string,
    rowId: string
  ) => {
    let vendorCode = "";

    switch (vehicleType) {
      case "RATE CONTRACT":
        vendorCode = "111111";
        break;
      case "LOCAL TRANSPORTATION":
        vendorCode = "222222";
        break;
      case "CUSTOMER TRANSPORTER":
        vendorCode = "333333";
        break;
      case "COMPANY VEHICLE":
        vendorCode = "444444";
        break;
      case "COURIER":
        vendorCode = "555555";
        break;
      case "BY HAND":
        vendorCode = "666666";
        break;
      default:
        break;
    }

    const vendor = fetchedVendors.find(
      (v) => v.vendorCode === vendorCode
    );

    updateRow(rowId, {
      vehicleType,
      vendorCode: vendor?.vendorCode || "",
      transporter: vendor?.transporter || "",
    });
  };

  const handleSave = async (action?: "next" | "previous") => {
    try {
      const loggedInUser = getLoggedInUser();

      const payload = {
        DISPATCH: rows.map((row) => ({
          NO_TRUCKS: Number(row.noOfTrucks) || 0,
          NO_INVOICES: Number(row.noOfInvoices) || 0,
          VEH_TYPE: row.vehicleType,
          WORK_ORDER: row.workOrder,
          VENDOR_CD: Number(row.vendorCode) || 0,
          TRANSPORTER: row.transporter,
          WERKS: row.plant,
          DIVISION: row.division,
          NO_LRS: Number(row.noOfLRs) || 0,
          LR_NO: row.lrNumber,
          LOAD_PT: row.loadingPoints,
          UNLOAD_PT: row.unloadingPoints,
          ZLRSPEC: row.lrSpec || "0",
          ZDIS_RM: row.remarks,
          ZUSER: loggedInUser,
          ZUSER_CH: "",
        })),
      };

      console.log("🔵 Save Payload:", JSON.stringify(payload, null, 2));

      let res;

      if (sap === "with") {
        res = await service.DispatchSave(payload);
      } else if (sap === "without") {
        res = await service.DispatchNonSapSave(payload);
      } else {
        Swal.fire({
          text: "Invalid SAP Type selected. Please choose With SAP or Without SAP.",
          icon: "error",
        });
        return;
      }

      console.log("🔵 Save Response:", res);

      if (res?.STATUS === "TRUE" || res?.NUMBER === "200") {
        Swal.fire({
          text: res.MSG || "Dispatch data saved successfully!",
          icon: "success",
          confirmButtonText: "OK",
        }).then(() => {
          resetForm();
          if (action === "next") {
            // navigate("/order-info");
          } else if (action === "previous") {
            // navigate("/dashboard");
          }
        });
      } else {
        Swal.fire({
          text: res?.MSG || "Dispatch saving failed!",
          icon: "error",
        });
      }
    } catch (err: any) {
      Swal.fire({
        text: err?.response?.data?.MSG || "Failed to save Dispatch!",
        icon: "error",
      });
    }
  };



  // Runs `next` only if every row satisfies the mandatory fields; otherwise reveals the
  // inline error states/banner without touching any existing save logic.
  const validateAndRun = (next: () => void) => {
    if (invalidRowIds.size > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    next();
  };

  return (
    <div className="space-y-2">
      {/* Toolbar */}
      <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Direction</span>
          <PremiumRadio label="Outward" checked={direction === "outward"} onSelect={() => setDirection("outward")} />
          {/* <label className={cn(
            "inline-flex items-center gap-2 text-[12.5px] font-medium cursor-pointer",
            direction === "inward" ? "text-foreground" : "text-muted-foreground",
          )}>
            <input
              type="radio"
              checked={direction === "inward"}
              onChange={() => setDirection("inward")}
              className="accent-accent"
            />
            Inward
          </label> */}

          {direction && (
            <>
              <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
              <SapToggle value={sap} onChange={setSap} />
            </>
          )}

          {sap && (
            <>
              <div className="h-6 w-px bg-hairline mx-1 hidden lg:block" />
              <div className="flex flex-wrap items-center gap-1.5 ml-auto w-full lg:w-auto animate-in fade-in slide-in-from-top-1 duration-200">
                <Select value={searchType} onValueChange={setSearchType}>
                  <SelectTrigger className="w-[150px] h-7 text-[11px]">
                    <SelectValue placeholder="Select Search Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEARCH_TYPES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Enter ${searchType}…`}
                    // placeholder={searchType ? `Enter ${searchType}…` : "Enter Search..."}
                    className="pl-7 h-7 text-[11px]"
                  />
                </div>
                <Button size="sm" className="h-7 gap-1 text-[11px] px-2.5" onClick={handleSearch}>
                  <Search className="size-3" /> Search
                </Button>
              </div>
            </>
          )}
        </div>
        {!direction && <p className="mt-1.5 text-[11px] text-muted-foreground">Select a direction to continue.</p>}
        {direction && !sap && (
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span>{" "}
            to continue.
          </p>
        )}
        {sap && searchNotice && (
          <p className="mt-1.5 text-[11px] text-amber-600">{searchNotice}</p>
        )}
      </div>

      {sap && (
        <>
          {showErrors && invalidRowIds.size > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-[11.5px] font-medium text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
              Please fill all mandatory fields (marked with *) before saving.
            </div>
          )}

          {/* Editable table card */}
          <div className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-3 py-2 border-b border-hairline bg-surface-2/60">
              <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                Dispatch Lines
              </h3>
              <p className="text-[11.5px] text-muted-foreground mt-0.5">
                {rows.length} row{rows.length === 1 ? "" : "s"} · auto-numbered
              </p>
            </div>

            <div className="overflow-x-auto scrollbar-elegant">
              <table className="w-full text-[12.5px] border-collapse">
                <thead className="sticky top-0 z-30">
                  <tr className="bg-gradient-primary text-[9px] font-bold uppercase tracking-widest text-primary-foreground border-b border-hairline">
                    {[
                      "Sl.No",
                      "Vehicle Type",
                      "Work Order",
                      "No of Trucks",
                      "No of Invoices",
                      "Transporter",
                      "Vendor",
                      "Plant",
                      "Division",
                      "LRs QTY",
                      "LR No",
                      "Load Pts",
                      "Unload Pts",
                      "Remarks",
                      ...(isEditMode ? ["Created Date"] : []),
                      ...(showActionCol ? ["Action"] : []),
                    ].map((h, i, arr) => (
                      <th
                        key={i}
                        className={cn(
                          "px-2 py-2 text-left whitespace-normal break-words align-middle", // Added whitespace-nowrap and align-middle
                          i === 0 && "w-10 text-center",
                          i === arr.length - 1 && showActionCol && "w-20 text-right",
                        )}
                      >
                        {/* Wrap in an inline-flex container to keep label and asterisk rigidly together */}
                        <span className="inline-flex items-center gap-0.5">
                          {h}
                          {MANDATORY_HEADERS.has(h) && <span className="text-destructive font-bold text-[12px]">{"*"}</span>}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/60">
                  {rows.map((row, index) => (
                    <tr key={row.id} className="hover:bg-accent/[0.04] transition-colors group text-[11.5px]">
                      <td className="px-1 py-0.5 text-center font-mono text-muted-foreground text-[11px]">{row.slNo}</td>
                      <CellSelect
                        value={row.vehicleType}
                        options={VEHICLE_TYPES}
                        onChange={(v) => handleVehicleTypeChange(v, row.id)}
                        placeholder="Select"
                        minWidth={100}
                        disabled={isLockedRow(index)}
                        invalid={showErrors && isFieldEmpty(row, "vehicleType")}
                      />
                      <CellInput
                        value={row.workOrder}
                        onChange={(v) => updateRow(row.id, { workOrder: v })}
                        placeholder="WO-…"

                        mono
                        disabled={row.vehicleType !== "FULL TRUCK LOAD"}
                      />
                      <CellNumber
                        value={row.noOfTrucks}
                        onChange={(v) => updateRow(row.id, { noOfTrucks: v })}

                        invalid={showErrors && isFieldEmpty(row, "noOfTrucks")}
                      />
                      <CellNumber
                        value={row.noOfInvoices}
                        onChange={(v) => updateRow(row.id, { noOfInvoices: v })}
                        invalid={showErrors && isFieldEmpty(row, "noOfInvoices")}
                      />
                      <CellSelect
                        value={row.transporter}
                        options={fetchedTransporters.length > 0 ? fetchedTransporters : TRANSPORTERS}
                        // disabled={isLockedRow(index)}
                        onChange={(v) => {
                          const selected = fetchedVendors.find(
                            (item) => item.transporter === v
                          );

                          updateRow(row.id, {
                            transporter: v,
                            vendorCode: selected?.vendorCode || "",
                          });
                        }}
                        minWidth={100}
                      />
                      {fetchedVendors.length > 0 ? (
                        <CellSelect
                          value={row.vendorCode}
                          options={fetchedVendors.map((v) => `${v.vendorCode}`)}
                          // disabled={isLockedRow(index)}
                          onChange={(v) => {
                            const selected = fetchedVendors.find(
                              (item) => item.vendorCode === v
                            );

                            updateRow(row.id, {
                              vendorCode: v,
                              transporter: selected?.transporter || "",
                            });
                          }}
                          minWidth={100}
                        />
                      ) : (
                        <CellInput
                          value={row.vendorCode}
                          onChange={(v) => updateRow(row.id, { vendorCode: v })}

                          placeholder="V-…"
                          mono
                        />
                      )}

                      <CellSelect
                        value={row.plant}
                        options={fetchedPlants.length > 0 ? fetchedPlants : PLANTS}
                        onChange={(v) => updateRow(row.id, { plant: v })}
                        minWidth={110}
                        invalid={showErrors && isFieldEmpty(row, "plant")}
                      />
                      <CellSelect
                        value={row.division}
                        options={fetchedDivisions.length > 0 ? fetchedDivisions : DIVISIONS}
                        onChange={(v) => updateRow(row.id, { division: v })}
                        minWidth={100}
                        invalid={showErrors && isFieldEmpty(row, "division")}
                      />
                      <CellNumber
                        value={row.noOfLRs}
                        onChange={(v) => updateRow(row.id, { noOfLRs: v })}
                        invalid={showErrors && isFieldEmpty(row, "noOfLRs")}
                      />
                      <CellInput
                        value={row.lrNumber}
                        onChange={(v) => updateRow(row.id, { lrNumber: v })}
                        placeholder="LR-…"
                        mono
                        invalid={showErrors && isFieldEmpty(row, "lrNumber")}
                      />
                      <CellInput
                        value={row.loadingPoints}
                        onChange={(v) => updateRow(row.id, { loadingPoints: v })}
                        placeholder="Loading"
                        invalid={showErrors && isFieldEmpty(row, "loadingPoints")}
                      />
                      <CellInput
                        value={row.unloadingPoints}
                        onChange={(v) => updateRow(row.id, { unloadingPoints: v })}
                        placeholder="Unloading"
                        invalid={showErrors && isFieldEmpty(row, "unloadingPoints")}
                      />
                      {row.vehicleType === "FULL TRUCK LOAD" || row.vehicleType === "CARGO" ? (
                        <td className="px-1.5 py-1" />
                      ) : (
                        <CellInput
                          value={row.remarks}
                          onChange={(v) => updateRow(row.id, { remarks: v })}
                          placeholder="Remarks"
                        />
                      )}

                      {isEditMode && (
                        <td className="px-2 py-1 font-mono text-[12.5px] whitespace-nowrap">{formatCreatedDate(row.createdDate)}</td>
                      )}
                      {showActionCol && (
                        <td className="px-1 py-0.5 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={addRow}
                              disabled={rows.length >= maxAllowed}
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-accent hover:bg-accent/10 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                              aria-label="Add row"
                            >
                              <Plus className="size-3.5" />
                            </button>
                            <button
                              onClick={() => deleteRow(row.id)}
                              disabled={rows.length === 1}
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
                              aria-label="Delete row"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sticky footer actions */}
          <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface/90 backdrop-blur border-t border-hairline px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-end gap-2.5 z-10">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 rounded-lg text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="size-3.5" /> Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 px-3 rounded-lg border-accent/30 text-accent hover:bg-accent/10 hover:text-accent"
              onClick={() => validateAndRun(() => (isEditMode ? handleUpdate() : handleSave()))}
            >
              <Save className="size-3.5" /> {isEditMode ? "Update" : "Save"}
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-7 px-3 rounded-lg bg-gradient-primary text-primary-foreground shadow-cta hover:shadow-lg hover:-translate-y-0.5 transition-all border-0"
              onClick={() => validateAndRun(() => (isEditMode ? handleUpdate() : handleSave("next")))}
            >
              {isEditMode ? "Update & Next" : "Save & Next"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
  const idx = value === "with" ? 0 : value === "without" ? 1 : -1;
  return (
    <div className="relative inline-flex items-center p-0 rounded-full bg-accent/10 text-[12px]">
      {idx >= 0 && (
        <span
          className="absolute top-0 bottom-0 left-0 w-1/2 rounded-full bg-surface shadow-soft transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${idx * 100}%)` }}
          aria-hidden
        />
      )}
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 px-3 py-1 rounded-full font-medium transition-colors cursor-pointer",
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
        "inline-flex items-center gap-2 text-[12.5px] font-medium cursor-pointer rounded-full pl-1.5 pr-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        checked ? "text-foreground bg-accent/8" : "text-muted-foreground hover:text-foreground",
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

function CellInput({
  value,
  onChange,
  placeholder,
  mono,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <td className="px-0.5 py-0.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "w-full min-w-[80px] h-7 bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md px-1.5 text-[12.5px] outline-none focus:ring-2 focus:ring-accent/20 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-transparent",
          mono && "font-mono",
          invalid && "border-destructive hover:border-destructive focus:border-destructive ring-1 ring-destructive/30",
        )}
      />
    </td>
  );
}

function CellNumber({
  value,
  onChange,
  invalid,
}: {
  value: number | "";
  onChange: (v: number | "") => void;
  invalid?: boolean;
}) {
  return (
    <td className="px-1.5 py-1">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className={cn(
          "w-16 min-w-[56px] h-7 bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md px-1.5 text-[12.5px] font-mono tabular-nums outline-none focus:ring-2 focus:ring-accent/20 transition",
          invalid && "border-destructive hover:border-destructive focus:border-destructive ring-1 ring-destructive/30",
        )}
      />
    </td>
  );
}

function CellSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  minWidth = 50,
  invalid,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const showCurrentOption = value !== "" && !options.includes(value);

  return (
    <td className="px-1.5 py-1">
      <div className="relative" style={{ minWidth }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full h-7 appearance-none bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md pl-2 pr-6 text-[12.5px] outline-none focus:ring-2 focus:ring-accent/20 transition cursor-pointer",
            invalid && "border-destructive hover:border-destructive focus:border-destructive ring-1 ring-destructive/30",
          )}
        >
          <option value="">{placeholder}</option>
          {showCurrentOption && (
            <option key="current-value" value={value}>
              {value}
            </option>
          )}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground/70" />
      </div>
    </td>
  );
}

/* ──────────────────────────────────── Mode 2 — Search ──────────────────────────────────── */

function SearchDispatch() {
  const [sap, setSap] = useState<SapMode | null>(null);
  const [fetchedPlants, setFetchedPlants] = useState<string[]>([]);
  const [fetchedDivisions, setFetchedDivisions] = useState<string[]>([]);
  const [fetchedTransporters, setFetchedTransporters] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [plant, setPlant] = useState("");
  const [division, setDivision] = useState("");
  const [transporter, setTransporter] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [applied, setApplied] = useState(false);
  const [results, setResults] = useState<DispatchResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const downloadExcel = () => {
    if (results.length === 0) return;

    exportRowsToXls(
      `dispatch-results-${format(new Date(), "yyyyMMdd_HHmmss")}.xls`,
      [
        { header: "Sl.No", value: (row: DispatchResultRow) => row.slNo },
        { header: "Reference No", value: (row: DispatchResultRow) => row.referenceNo },
        { header: "Line No", value: (row: DispatchResultRow) => row.lineNo },
        { header: "Date", value: (row: DispatchResultRow) => row.date },
        { header: "Plant", value: (row: DispatchResultRow) => row.plant },
        { header: "Division", value: (row: DispatchResultRow) => row.division },
        { header: "Vehicle Type", value: (row: DispatchResultRow) => row.vehicleType },
        { header: "No. of Trucks", value: (row: DispatchResultRow) => row.noOfTrucks },
        { header: "Work Order", value: (row: DispatchResultRow) => row.workOrder },
        { header: "Vendor Code", value: (row: DispatchResultRow) => row.vendorCode },
        { header: "Transporter", value: (row: DispatchResultRow) => row.transporter },
        { header: "No. of LRs", value: (row: DispatchResultRow) => row.noOfLRs },
        { header: "LR Number", value: (row: DispatchResultRow) => row.lrNumber },
        { header: "Loading Point", value: (row: DispatchResultRow) => row.loadingPoint },
        { header: "Unloading Point", value: (row: DispatchResultRow) => row.unloadingPoint },
        { header: "No of Invoices", value: (row: DispatchResultRow) => row.noOfInvoices },
        { header: "Created Date", value: (row: DispatchResultRow) => row.createdDate },
      ],
      results,
    );
  };

  const downloadPdf = () => {
    if (results.length === 0) return;

    const doc = new jsPDF("landscape", "mm", "a3");

    doc.setFontSize(16);
    doc.text("Dispatch Report", 14, 15);

    autoTable(doc, {
      startY: 25,

      head: [[
        "Sl.No",
        "Reference No",
        "Line No",
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
        "No. Invoices",
        "Created Date",
      ]],

      body: results.map((row) => [
        row.slNo,
        row.referenceNo,
        row.lineNo,
        row.date,
        row.plant,
        row.division,
        row.vehicleType,
        row.noOfTrucks,
        row.workOrder,
        row.vendorCode,
        row.transporter,
        row.noOfLRs,
        row.lrNumber,
        row.loadingPoint,
        row.unloadingPoint,
        row.noOfInvoices,
        row.createdDate,
      ]),

      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: "linebreak",
      },

      headStyles: {
        fillColor: [52, 115, 170],
        textColor: 255,
        fontSize: 8,
      },

      theme: "grid",
    });

    doc.save("Dispatch_Report.pdf");
  };

  const onApply = async () => {
    try {
      setIsLoading(true);

      const payload = {
        ZUSER: getLoggedInUser(),
        DATE_FROM: fromDate ? format(fromDate, "yyyy-MM-dd") : "",
        DATE_TO: toDate ? format(toDate, "yyyy-MM-dd") : "",
        PLANT: plant || "",
        DIVISION: division || "",
        TRANSPORTER: transporter || "",
        VEHICLE_TYPE: vehicleType || "",
      };

      const res =
        sap === "with"
          ? await service.fetchDispatchFiltered(payload)
          : await service.fetchDispatchFilteredNonSap(payload);

      if (res?.STATUS === "FALSE" || res?.NUMBER === "100") {
        Swal.fire({
          text: res?.MSG || "No records found for the selected filters.",
          icon: "info",
        });
        setResults([]);
        setApplied(true);
        return;
      }

      const data = Array.isArray(res) ? res : res?.data || [];

      if (data.length === 0) {
        Swal.fire({
          text: "No records found for the selected filters.",
          icon: "info",
        });
        setResults([]);
        setApplied(true);
        return;
      }

      const mapped = data.map((item: any, index: number) => ({
        id: `${item.ZREFNO}-${item.ZLINE_NO}-${index}`,
        slNo: index + 1,
        referenceNo: item.ZREFNO,
        lineNo: item.ZLINE_NO,
        date: item.ZCREATED_DT,
        plant: item.ZWERKS,
        division: item.ZDIVISION,
        vehicleType: item.ZVEH_TYPE,
        noOfTrucks: Number(item.ZNO_TRUCKS || 0),
        workOrder: item.ZWORK_ORDER,
        vendorCode: String(item.ZVENDOR_CD || ""),
        transporter: item.ZTRANSPORTER,
        noOfLRs: Number(item.ZNO_LRS || 0),
        lrNumber: item.ZLR_NO,
        loadingPoint: item.ZLOAD_PT,
        unloadingPoint: item.ZUNLOAD_PT,
        noOfInvoices: Number(item.ZNO_INVOICES || 0),
        createdDate: item.ZCREATED_DT,
      }));

      setResults(mapped);
      setApplied(true);

      Swal.fire({
        text: `${mapped.length} record${mapped.length === 1 ? "" : "s"} found successfully.`,
        icon: "success",
      });
    } catch (err) {
      console.error("Filter fetch failed:", err);
      Swal.fire({
        text: "An error occurred while fetching filtered records. Please try again.",
        icon: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onReset = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setPlant("");
    setDivision("");
    setTransporter("");
    setVehicleType("");
    setApplied(false);
    setSap(null);
  };

  useEffect(() => {
    const loadF4 = async () => {
      if (!sap) return;
      try {
        const res: any = await service.fetchVendorCode();
        const data: any = Array.isArray(res) ? res[0] ?? {} : res ?? {};
        // In BOTH CreateDispatch and SearchDispatch useEffect
        const plants: string[] = Array.isArray(data.PLANT)
          ? data.PLANT.map((p: PlantData) => {
            const desc = String(p.PLANT_DESC || "").split("_")[0].trim();
            return `${p.PLANT}_${desc}`;
          })
          : [];
        const divisions: string[] = Array.isArray(data.PLANT)
          ? Array.from(new Set(data.PLANT.map((p: PlantData) => String(p.DIVISION || "")).filter(Boolean)))
          : [];
        const transporters: string[] = Array.isArray(data.VEND_CODE)
          ? Array.from(new Set(data.VEND_CODE.map((v: VendorData) => String(v.TRANSPORTER)).filter(Boolean)))
          : [];
        setFetchedPlants(plants);
        setFetchedDivisions(divisions.map((d) => d));
        setFetchedTransporters(transporters);
      } catch (err) {
        // ignore
      }
    };
    void loadF4();
  }, [sap]);

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-accent" />
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Filter Options</h3>
          </div>
          {/* <SapToggle value={sap} onChange={setSap} /> */}
          <SapToggle
            value={sap}
            onChange={(v) => {
              setSap(v);
              setResults([]);
              setApplied(false);
              setFromDate(undefined);
              setToDate(undefined);
              setPlant("");
              setDivision("");
              setTransporter("");
              setVehicleType("");
            }}
          />
        </div>

        {!sap && (
          <div className="p-6 text-center text-[12.5px] text-muted-foreground">
            Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span>{" "}
            to view filters.
          </div>
        )}

        {sap && (
          <>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
              <DateField label="From Date" value={fromDate} onChange={setFromDate} />
              <DateField label="To Date" value={toDate} onChange={setToDate} />
              <SelectField
                label="Plant"
                value={plant}
                onChange={setPlant}
                options={fetchedPlants.length > 0 ? fetchedPlants : PLANTS}
                placeholder="Select Plant"
              />
              <SelectField
                label="Division"
                value={division}
                onChange={setDivision}
                options={fetchedDivisions.length > 0 ? fetchedDivisions : DIVISIONS}
                placeholder="Select Division"
              />
              <SelectField
                label="Transporter"
                value={transporter}
                onChange={setTransporter}
                options={fetchedTransporters.length > 0 ? fetchedTransporters : TRANSPORTERS}
                placeholder="Select Transporter"
              />
              <SelectField
                label="Vehicle Type"
                value={vehicleType}
                onChange={setVehicleType}
                options={VEHICLE_TYPES}
                placeholder="Select Vehicle Type"
              />
            </div>

            <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={onReset}>
                Reset
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={downloadPdf}
                disabled={results.length === 0 || isLoading}
              >
                <FileText className="size-3.5" /> Download PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={downloadExcel}
                disabled={results.length === 0 || isLoading}
              >
                <FileDown className="size-3.5 text-emerald-600" /> Download Excel
              </Button>
              <Button size="sm" onClick={onApply} className="gap-1.5" disabled={isLoading}>
                <Filter className="size-3.5" /> Apply Filter
              </Button>
            </div>
          </>
        )}
      </div>

      {applied ? (
        <ResultsTable data={results} />
      ) : (
        <div className="bg-surface border border-dashed border-hairline rounded-xl p-10 text-center">
          <div className="mx-auto size-12 grid place-items-center rounded-full bg-muted text-muted-foreground">
            <Filter className="size-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No results yet</h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground max-w-md mx-auto">
            Choose your filters above and click <span className="font-semibold">Apply Filter</span> to load dispatch
            records.
          </p>
        </div>
      )}
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
    <div className="flex flex-col gap-1">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("h-8 justify-start text-left font-normal", !value && "text-muted-foreground")}
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
    <div className="flex flex-col gap-1">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
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

/* ──────────────────────────────────── Results table ──────────────────────────────────── */

type SortKey = keyof DispatchResultRow;

function ResultsTable({ data }: { data: DispatchResultRow[] }) {
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const totalPages = Math.max(1, Math.ceil((data || []).length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = (data || []).slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const cols: { key: keyof DispatchResultRow; label: string; align?: "right"; mono?: boolean }[] = [
    { key: "slNo", label: "Sl.No", align: "right", mono: true },
    { key: "referenceNo", label: "Reference No", mono: true },
    { key: "lineNo", label: "Line No", align: "right", mono: true },
    { key: "date", label: "Date", mono: true },
    { key: "plant", label: "Plant" },
    { key: "division", label: "Division" },
    { key: "vehicleType", label: "Vehicle Type" },
    { key: "noOfTrucks", label: "No. of Trucks", align: "right", mono: true },
    { key: "workOrder", label: "Work Order", mono: true },
    { key: "vendorCode", label: "Vendor Code", mono: true },
    { key: "transporter", label: "Transporter" },
    { key: "noOfLRs", label: "No. of LRs", align: "right", mono: true },
    { key: "lrNumber", label: "LR Number", mono: true },
    { key: "loadingPoint", label: "Loading Point" },
    { key: "unloadingPoint", label: "Unloading Point" },
    { key: "noOfInvoices", label: "No of Invoices", align: "right", mono: true },
    { key: "createdDate", label: "Created Date", mono: true },
  ];

  return (
    <div className="bg-surface border border-hairline rounded-xl shadow-xs overflow-hidden">
      <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-muted/40">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Dispatch Results</h3>
          <p className="text-[11.5px] text-muted-foreground">
            Showing {paged.length} of {(data || []).length} records
          </p>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[560px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 z-30">
            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground border-b border-hairline">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 whitespace-nowrap",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {paged.map((r, idx) => (
              <tr key={r.id} className={cn("hover:bg-accent/5 transition-colors", idx % 2 === 1 && "bg-muted/20")}>
                {cols.map((c) => {
                  const v = r[c.key];
                  if (c.key === "vehicleType") {
                    return (
                      <td key={c.key} className="px-3 py-2.5 whitespace-nowrap">
                        <Badge variant="secondary" className="font-mono text-[10.5px]">
                          {String(v)}
                        </Badge>
                      </td>
                    );
                  }
                  return (
                    <td
                      key={c.key}
                      className={cn(
                        "px-3 py-2.5 whitespace-nowrap",
                        c.align === "right" && "text-right tabular-nums",
                        c.mono && "font-mono",
                      )}
                    >
                      {String(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={cols.length} className="px-6 py-10 text-center text-muted-foreground">
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-hairline bg-muted/30 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[11.5px] text-muted-foreground">
          Page <span className="font-semibold text-foreground">{currentPage}</span> of {totalPages}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="gap-1"
          >
            <ChevronLeft className="size-3.5" /> Prev
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="gap-1"
          >
            Next <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}