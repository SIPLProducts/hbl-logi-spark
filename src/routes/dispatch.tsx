import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  ArrowUpDown,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Download,
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

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { LeFooter } from "@/components/le-footer";
import { cn } from "@/lib/utils";
import {
  DIVISIONS,
  PLANTS,
  SEARCH_TYPES,
  TRANSPORTERS,
  VEHICLE_TYPES,
  emptyDispatchRow,
  sampleDispatchRows,
  sampleResultRows,
  type DispatchResultRow,
  type DispatchRow,
} from "@/lib/dispatch-mock";

export const Route = createFileRoute("/dispatch")({
  head: () => ({
    meta: [
      { title: "Dispatch · HBL LE" },
      { name: "description", content: "Create, search, and export HBL dispatch records." },
    ],
  }),
  component: DispatchPage,
});

type SapMode = "with" | "without";

function DispatchPage() {
  const [tab, setTab] = useState<"create" | "search">("create");

  return (
    <div className="flex flex-col min-h-full bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-hairline px-4 sm:px-6 lg:px-8 pt-5 pb-4">
        <Breadcrumb className="mb-3">
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
            <div className="hidden sm:grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
              <Truck className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground truncate">
                Dispatch
              </h1>
              <p className="text-[12.5px] text-muted-foreground mt-0.5 max-w-2xl">
                Plan outbound shipments, allocate trucks against work orders, and search executed
                dispatch records.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-3.5" /> Refresh
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="size-3.5" /> Export
            </Button>
          </div>
        </div>

      </div>

      {/* Body */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
          <TabsList className="bg-surface border border-hairline rounded-lg p-1 h-auto">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-[12.5px] font-semibold gap-1.5"
            >
              <Plus className="size-3.5" /> Create Dispatch
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md px-4 py-2 text-[12.5px] font-semibold gap-1.5"
            >
              <Filter className="size-3.5" /> Search &amp; Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-5">
            <CreateDispatch />
          </TabsContent>
          <TabsContent value="search" className="mt-5">
            <SearchDispatch />
          </TabsContent>
        </Tabs>
      </div>

      <LeFooter />
    </div>
  );
}

/* ──────────────────────────────────── Mode 1 — Create ──────────────────────────────────── */

function CreateDispatch() {
  const [sap, setSap] = useState<SapMode | null>(null);
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [searchType, setSearchType] = useState<string>(SEARCH_TYPES[0]);
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState<DispatchRow[]>(sampleDispatchRows);

  const addRow = () =>
    setRows((r) => [...r, emptyDispatchRow(r.length + 1)]);
  const deleteRow = (id: string) =>
    setRows((r) => r.filter((x) => x.id !== id).map((x, i) => ({ ...x, slNo: i + 1 })));
  const updateRow = (id: string, patch: Partial<DispatchRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="bg-surface border border-hairline rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Direction
          </span>
          <label className={cn(
            "inline-flex items-center gap-2 text-[12.5px] font-medium cursor-pointer",
            direction === "outward" ? "text-foreground" : "text-muted-foreground",
          )}>
            <input
              type="radio"
              checked={direction === "outward"}
              onChange={() => setDirection("outward")}
              className="accent-accent"
            />
            Outward
          </label>
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
              <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                <SapToggle value={sap} onChange={setSap} />
              </div>
            </>
          )}

          {sap && (
            <>
              <div className="h-6 w-px bg-hairline mx-1 hidden lg:block" />
              <div className="flex flex-wrap items-center gap-2 ml-auto w-full lg:w-auto animate-in fade-in slide-in-from-top-1 duration-200">
            <Select value={searchType} onValueChange={setSearchType}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SEARCH_TYPES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={`Enter ${searchType}…`}
                className="pl-8 h-9"
              />
            </div>
            <Button size="sm" className="h-9 gap-1.5">
              <Search className="size-3.5" /> Search
            </Button>
              </div>
            </>
          )}
        </div>
        {!direction && (
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Select a direction to continue.
          </p>
        )}
        {direction && !sap && (
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span> to continue.
          </p>
        )}
      </div>

      {sap && (
      <>
      {/* Editable table card */}
      <div className="bg-surface border border-hairline rounded-xl shadow-xs overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-muted/40">
          <div>
            <h3 className="text-[13px] font-semibold text-foreground">Dispatch Lines</h3>
            <p className="text-[11.5px] text-muted-foreground">
              {rows.length} row{rows.length === 1 ? "" : "s"} · auto-numbered
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5">
            <Plus className="size-3.5" /> Add Row
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12.5px] border-collapse">
            <thead className="bg-muted/60 sticky top-0 z-10">
              <tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
                {[
                  "Sl.No",
                  "Vehicle Type",
                  "Work Order",
                  "No Of Trucks",
                  "No Of Invoices",
                  "Vendor Code",
                  "Transporter",
                  "Plant",
                  "Division",
                  "No Of LRs",
                  "LR Number",
                  "Loading Points",
                  "Unloading Points",
                  "Remarks",
                  "",
                ].map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-3 py-2.5 text-left whitespace-nowrap",
                      i === 0 && "w-14 text-center",
                      i === 14 && "w-14 text-right",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline/70">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-muted/40 transition-colors group">
                  <td className="px-3 py-1.5 text-center font-mono text-muted-foreground">
                    {row.slNo}
                  </td>
                  <CellSelect
                    value={row.vehicleType}
                    options={VEHICLE_TYPES}
                    onChange={(v) => updateRow(row.id, { vehicleType: v })}
                    placeholder="Select"
                    minWidth={160}
                  />
                  <CellInput
                    value={row.workOrder}
                    onChange={(v) => updateRow(row.id, { workOrder: v })}
                    placeholder="WO-…"
                    mono
                  />
                  <CellNumber
                    value={row.noOfTrucks}
                    onChange={(v) => updateRow(row.id, { noOfTrucks: v })}
                  />
                  <CellNumber
                    value={row.noOfInvoices}
                    onChange={(v) => updateRow(row.id, { noOfInvoices: v })}
                  />
                  <CellInput
                    value={row.vendorCode}
                    onChange={(v) => updateRow(row.id, { vendorCode: v })}
                    placeholder="V-…"
                    mono
                  />
                  <CellSelect
                    value={row.transporter}
                    options={TRANSPORTERS}
                    onChange={(v) => updateRow(row.id, { transporter: v })}
                    minWidth={160}
                  />
                  <CellSelect
                    value={row.plant}
                    options={PLANTS}
                    onChange={(v) => updateRow(row.id, { plant: v })}
                    minWidth={170}
                  />
                  <CellSelect
                    value={row.division}
                    options={DIVISIONS}
                    onChange={(v) => updateRow(row.id, { division: v })}
                    minWidth={150}
                  />
                  <CellNumber
                    value={row.noOfLRs}
                    onChange={(v) => updateRow(row.id, { noOfLRs: v })}
                  />
                  <CellInput
                    value={row.lrNumber}
                    onChange={(v) => updateRow(row.id, { lrNumber: v })}
                    placeholder="LR-…"
                    mono
                  />
                  <CellInput
                    value={row.loadingPoints}
                    onChange={(v) => updateRow(row.id, { loadingPoints: v })}
                    placeholder="Loading"
                  />
                  <CellInput
                    value={row.unloadingPoints}
                    onChange={(v) => updateRow(row.id, { unloadingPoints: v })}
                    placeholder="Unloading"
                  />
                  <CellInput
                    value={row.remarks}
                    onChange={(v) => updateRow(row.id, { remarks: v })}
                    placeholder="Remarks"
                  />
                  <td className="px-3 py-1.5 text-right">
                    <button
                      onClick={() => deleteRow(row.id)}
                      className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition"
                      aria-label="Delete row"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-6 py-10 text-center text-muted-foreground text-[12.5px]">
                    No dispatch lines. Click <span className="font-semibold">Add Row</span> to begin.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sticky footer actions */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 bg-surface/95 backdrop-blur border-t border-hairline px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-end gap-2 z-10">
        <Button variant="outline" size="sm" className="gap-1.5">
          <ChevronLeft className="size-3.5" /> Previous
        </Button>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Save className="size-3.5" /> Save
        </Button>
        <Button size="sm" className="gap-1.5">
          Save &amp; Next <ChevronRight className="size-3.5" />
        </Button>
      </div>
      </>
      )}
    </div>
  );
}

function SapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
  return (
    <div className="inline-flex items-center p-0.5 rounded-lg bg-muted border border-hairline text-[12px]">
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "px-3 h-8 rounded-md font-semibold transition-colors",
            value === m
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {m === "with" ? "With SAP" : "Without SAP"}
        </button>
      ))}
    </div>
  );
}

function CellInput({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <td className="px-2 py-1.5">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full min-w-[120px] h-8 bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md px-2 text-[12.5px] outline-none focus:ring-2 focus:ring-accent/20 transition",
          mono && "font-mono",
        )}
      />
    </td>
  );
}

function CellNumber({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <td className="px-2 py-1.5">
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full min-w-[80px] h-8 bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md px-2 text-[12.5px] font-mono tabular-nums outline-none focus:ring-2 focus:ring-accent/20 transition"
      />
    </td>
  );
}

function CellSelect({
  value,
  options,
  onChange,
  placeholder = "Select",
  minWidth = 140,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  placeholder?: string;
  minWidth?: number;
}) {
  return (
    <td className="px-2 py-1.5">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ minWidth }}
        className="w-full h-8 bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-md px-2 text-[12.5px] outline-none focus:ring-2 focus:ring-accent/20 transition"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </td>
  );
}

/* ──────────────────────────────────── Mode 2 — Search ──────────────────────────────────── */

function SearchDispatch() {
  const [sap, setSap] = useState<SapMode | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [plant, setPlant] = useState("");
  const [division, setDivision] = useState("");
  const [transporter, setTransporter] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [applied, setApplied] = useState(false);

  const onApply = () => setApplied(true);
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

  return (
    <div className="space-y-5">
      <div className="bg-surface border border-hairline rounded-xl shadow-xs">
        <div className="px-4 py-3 border-b border-hairline flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-accent" />
            <h3 className="text-[13px] font-semibold text-foreground">Filter Options</h3>
          </div>
          <SapToggle value={sap} onChange={setSap} />
        </div>

        {!sap && (
          <div className="p-6 text-center text-[12.5px] text-muted-foreground">
            Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span> to view filters.
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
            options={PLANTS}
            placeholder="Select Plant"
          />
          <SelectField
            label="Division"
            value={division}
            onChange={setDivision}
            options={DIVISIONS}
            placeholder="Select Division"
          />
          <SelectField
            label="Transporter"
            value={transporter}
            onChange={setTransporter}
            options={TRANSPORTERS}
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
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileText className="size-3.5" /> Download PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <FileDown className="size-3.5 text-emerald-600" /> Download Excel
          </Button>
          <Button size="sm" onClick={onApply} className="gap-1.5">
            <Filter className="size-3.5" /> Apply Filter
          </Button>
        </div>
        </>
        )}
      </div>

      {applied ? (
        <ResultsTable />
      ) : (
        <div className="bg-surface border border-dashed border-hairline rounded-xl p-10 text-center">
          <div className="mx-auto size-12 grid place-items-center rounded-full bg-muted text-muted-foreground">
            <Filter className="size-5" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
            No results yet
          </h3>
          <p className="mt-1 text-[12.5px] text-muted-foreground max-w-md mx-auto">
            Choose your filters above and click <span className="font-semibold">Apply Filter</span>{" "}
            to load dispatch records.
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
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "h-10 justify-start text-left font-normal",
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
        <SelectTrigger className="h-10">
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

function ResultsTable() {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? sampleResultRows.filter((r) =>
          Object.values(r).join(" ").toLowerCase().includes(q),
        )
      : sampleResultRows;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc"
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });
    return sorted;
  }, [query, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  const cols: { key: SortKey; label: string; align?: "right"; mono?: boolean }[] = [
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
      <div className="px-4 py-3 border-b border-hairline flex flex-wrap items-center gap-3 justify-between bg-muted/40">
        <div>
          <h3 className="text-[13px] font-semibold text-foreground">Dispatch Results</h3>
          <p className="text-[11.5px] text-muted-foreground">
            Showing {paged.length} of {filtered.length} records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search records…"
              className="pl-8 h-9 w-[260px]"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="size-3.5" /> Export
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[560px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="bg-muted/70 sticky top-0 z-10">
            <tr className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
              {cols.map((c) => (
                <th
                  key={c.key}
                  className={cn(
                    "px-3 py-2.5 whitespace-nowrap select-none",
                    c.align === "right" ? "text-right" : "text-left",
                  )}
                >
                  <button
                    onClick={() => toggleSort(c.key)}
                    className={cn(
                      "inline-flex items-center gap-1 hover:text-foreground transition",
                      sortKey === c.key && "text-accent",
                    )}
                  >
                    {c.label}
                    <ArrowUpDown className="size-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/70">
            {paged.map((r, idx) => (
              <tr
                key={r.id}
                className={cn(
                  "hover:bg-accent/5 transition-colors",
                  idx % 2 === 1 && "bg-muted/20",
                )}
              >
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
                  No records match your filters.
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