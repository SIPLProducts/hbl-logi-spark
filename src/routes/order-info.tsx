import { useState, useEffect, type ReactNode } from "react";
import { format } from "date-fns";
// @ts-ignore
import service from "../services/generalservice_service.js";
import { createFileRoute } from "@tanstack/react-router";
import {
  Plus,
  RefreshCw,
  Filter,
  FileText,
  FileDown,
  CalendarIcon,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
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
import { cn } from "@/lib/utils";
import { PLANTS, DIVISIONS, TRANSPORTERS, VEHICLE_TYPES } from "@/lib/dispatch-mock";
import { counts, type WorklistRow } from "@/lib/le-mock-data";
import { OrderInfoSapCreate } from "@/components/order-info-sap-create";

type SapMode = "with" | "without";

const STATUS_OPTIONS = ["All", "Pending", "Completed"] as const;

const DEFAULT_COLUMNS = [
  { key: "slNo", header: "Sl.No", render: (r: WorklistRow) => r.slNo },
  { key: "reference", header: "Reference", render: (r: WorklistRow) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r: WorklistRow) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r: WorklistRow) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r: WorklistRow) => r.transporter },
];

export const Route = createFileRoute("/order-info")({
  component: OrderInfoPage,
});

function OrderInfoPage() {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [direction, setDirection] = useState<"outward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [selectedId, setSelectedId] = useState<string>("");
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);

  // Filter & Download state
  const [searchSap, setSearchSap] = useState<SapMode | null>(null);
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [fPlant, setFPlant] = useState("");
  const [fDivision, setFDivision] = useState("");
  const [fTransporter, setFTransporter] = useState("");
  const [fVehicleType, setFVehicleType] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [applied, setApplied] = useState(false);

  const rows: WorklistRow[] = [];

  const resetFilters = () => {
    setFromDate(undefined);
    setToDate(undefined);
    setFPlant("");
    setFDivision("");
    setFTransporter("");
    setFVehicleType("");
    setFStatus("");
    setApplied(false);
    setSearchSap(null);
  };

  useEffect(() => {
    if (!sap) return;
    (async () => {
      try {
        const res: any = await service.OutwardCountGlobalWithSap({
          INOUT: "OUTWARD",
          TRANS_TYPE: sap === "with" ? "WITHSAP" : "WITHOUTSAP",
          SCREEN: "ORDER INFO",
        });
        setPendingCount(res?.ZPEND_CNT ?? 0);
        setCompletedCount(res?.ZCONF_CNT ?? 0);
      } catch (err) {
        console.error("Count fetch failed:", err);
      }
    })();
  }, [sap]);


  return (
    <div className="flex flex-col min-h-full">
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "create" | "search")}
        className="w-full"
      >
        {/* Page Header */}
        <div className="sticky top-0 z-50 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  Order Info
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

        {/* Tab Content */}
        <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2">

          {/* ── Create Tab ── */}
          <TabsContent value="create" className="mt-0 space-y-2">

            {/* Direction + SAP Toggle + Pending/Completed counts */}
            <div className="bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio label="Outward" checked={direction === "outward"} onSelect={() => setDirection("outward")} />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block " />
                    <SapToggle
                     value={sap} onChange={setSap}
                    />
                  </>
                )}
                <div className="ml-auto flex items-center gap-1.5">
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
                  Select <span className="font-semibold">With SAP</span> or{" "}
                  <span className="font-semibold">Without SAP</span> to continue.
                </p>
              )}
            </div>

            {/* Order Info Create Body */}
           {direction && sap && <OrderInfoSapCreate key={`${sap}`} mode={sap} />}

          </TabsContent>

          {/* ── Filter & Download Tab ── */}
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
                  onChange={(v) => {
                    setSearchSap(v);
                    setFromDate(undefined);
                    setToDate(undefined);
                    setFPlant("");
                    setFDivision("");
                    setFTransporter("");
                    setFVehicleType("");
                    setFStatus("");
                    setApplied(false);
                  }}
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
                    <SelectField
                      label="Plant"
                      value={fPlant}
                      onChange={setFPlant}
                      options={PLANTS}
                      placeholder="Select Plant"
                    />
                    <SelectField
                      label="Division"
                      value={fDivision}
                      onChange={setFDivision}
                      options={DIVISIONS}
                      placeholder="Select Division"
                    />
                    <SelectField
                      label="Transporter"
                      value={fTransporter}
                      onChange={setFTransporter}
                      options={TRANSPORTERS}
                      placeholder="Select Transporter"
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
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FileText className="size-3.5" /> Download PDF
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <FileDown className="size-3.5 text-emerald-600" /> Download Excel
                    </Button>
                    <Button size="sm" onClick={() => setApplied(true)} className="gap-1.5">
                      <Filter className="size-3.5" /> Apply Filter
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
                      {rows.length} row{rows.length === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-elegant">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.14em] text-primary-foreground">
                        <th className="px-2 py-1.5 w-10 text-center">
                          <input type="checkbox" className="accent-accent" />
                        </th>
                        {DEFAULT_COLUMNS.map((c) => (
                          <th key={c.key} className="px-2 py-1.5 whitespace-nowrap">
                            {c.header}
                          </th>
                        ))}
                        <th className="px-2 py-1.5 w-28 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/60">
                      {rows.map((r) => (
                        <tr
                          key={r.id}
                          className={cn(
                            "group cursor-pointer transition-colors",
                            selectedId === r.id ? "bg-accent/[0.06]" : "hover:bg-accent/[0.04]",
                          )}
                          onClick={() => setSelectedId(r.id)}
                        >
                          <td className="px-2 py-1 text-center">
                            <input
                              type="radio"
                              checked={selectedId === r.id}
                              onChange={() => setSelectedId(r.id)}
                              className="accent-accent"
                            />
                          </td>
                          {DEFAULT_COLUMNS.map((c) => (
                            <td key={c.key} className="px-2 py-1 whitespace-nowrap">
                              {c.render ? c.render(r) : (r as Record<string, unknown>)[c.key] as ReactNode}
                            </td>
                          ))}
                          <td className="px-2 py-1 text-right">
                            <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="View">
                                <Eye className="size-3.5" />
                              </button>
                              <button className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Edit">
                                <Pencil className="size-3.5" />
                              </button>
                              <button className="size-6 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {rows.length === 0 && (
                        <tr>
                          <td
                            colSpan={DEFAULT_COLUMNS.length + 2}
                            className="px-3 py-10 text-center text-[12px] text-muted-foreground"
                          >
                            No records match your filters.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// ── Local Components ──

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