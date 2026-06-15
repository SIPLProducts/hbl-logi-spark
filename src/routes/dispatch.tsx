import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
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

function DispatchPage() {
  const [tab, setTab] = useState<"create" | "search">("create");

  return (
    <div className="flex flex-col min-h-full bg-background">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
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
                className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
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

/* ──────────────────────────────────── Mode 1 — Create ──────────────────────────────────── */

function CreateDispatch() {
  const [sap, setSap] = useState<SapMode | null>(null);
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [searchType, setSearchType] = useState<string>(SEARCH_TYPES[0]);
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState<DispatchRow[]>([]);

  const addRow = () => setRows((r) => [...r, emptyDispatchRow(r.length + 1)]);
  const deleteRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id).map((x, i) => ({ ...x, slNo: i + 1 })));
  const updateRow = (id: string, patch: Partial<DispatchRow>) =>
    setRows((r) => r.map((x) => (x.id === id ? { ...x, ...patch } : x)));

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
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
                  <Input
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Enter ${searchType}…`}
                    className="pl-7 h-7 text-[11px]"
                  />
                </div>
                <Button size="sm" className="h-7 gap-1 text-[11px] px-2.5">
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
      </div>

      {sap && (
        <>
          {/* Editable table card */}
          <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
              <div>
                <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">
                  Dispatch Lines
                </h3>
                <p className="text-[11.5px] text-muted-foreground mt-0.5">
                  {rows.length} row{rows.length === 1 ? "" : "s"} · auto-numbered
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={addRow} className="gap-1.5 rounded-lg">
                <Plus className="size-3.5" /> Add Row
              </Button>
            </div>

            <div className="overflow-x-auto scrollbar-elegant">
              <table className="w-full text-[12.5px] border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground border-b border-hairline">
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
                      "Unload Points",
                      "Remarks",
                      "",
                    ].map((h, i) => (
                      <th
                        key={i}
                        className={cn(
                          "px-3 py-3 text-left whitespace-nowrap",
                          i === 0 && "w-14 text-center",
                          i === 14 && "w-14 text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/60">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-accent/[0.04] transition-colors group">
                      <td className="px-3 py-1.5 text-center font-mono text-muted-foreground">{row.slNo}</td>
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
                      <CellNumber value={row.noOfTrucks} onChange={(v) => updateRow(row.id, { noOfTrucks: v })} />
                      <CellNumber value={row.noOfInvoices} onChange={(v) => updateRow(row.id, { noOfInvoices: v })} />
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
                      <CellNumber value={row.noOfLRs} onChange={(v) => updateRow(row.id, { noOfLRs: v })} />
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
            >
              <Save className="size-3.5" /> Save
            </Button>
            <Button
              size="sm"
              className="gap-1.5 h-7 px-3 rounded-lg bg-gradient-primary text-primary-foreground shadow-cta hover:shadow-lg hover:-translate-y-0.5 transition-all border-0"
            >
              Save &amp; Next <ChevronRight className="size-3.5" />
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

function CellNumber({ value, onChange }: { value: number; onChange: (v: number) => void }) {
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
      <div className="relative" style={{ minWidth }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-8 appearance-none bg-transparent border border-transparent hover:border-hairline focus:border-accent focus:bg-surface rounded-lg pl-2.5 pr-7 text-[12.5px] outline-none focus:ring-2 focus:ring-accent/20 transition cursor-pointer"
        >
          <option value="">{placeholder}</option>
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
      <div className="bg-surface border border-hairline rounded-2xl shadow-elegant">
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-accent" />
            <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Filter Options</h3>
          </div>
          <SapToggle value={sap} onChange={setSap} />
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
    <div className="flex flex-col gap-1.5">
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn("h-10 justify-start text-left font-normal", !value && "text-muted-foreground")}
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
      <label className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</label>
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
    const base: DispatchResultRow[] = [];
    void q;
    const sorted = [...base].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      return sortDir === "asc" ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
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
        </div>
      </div>

      <div className="overflow-x-auto max-h-[560px]">
        <table className="w-full text-[12.5px] border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground border-b border-hairline">
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
                      "inline-flex items-center gap-1 hover:text-primary-foreground/80 transition",
                      sortKey === c.key && "underline underline-offset-2",
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
