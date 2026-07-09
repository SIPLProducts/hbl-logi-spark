import { useState, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import {
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Pencil,
  FileText,
  FileDown,
  MoreVertical,
  CalendarIcon,
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
import { PLANTS, DIVISIONS, TRANSPORTERS, VEHICLE_TYPES } from "@/lib/dispatch-mock";
import { counts, type WorklistRow } from "@/lib/le-mock-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/segment-info")({
  component: SegmentInfoPage,
});

// ─────────────── Local types & constants ───────────────
type SapMode = "with" | "without";
type Direction = "outward" | "inward";

type FieldDef = {
  label: string;
  value?: string | number;
  type?: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  span?: 1 | 2 | 3 | 4;
};

type FieldGroup = { title: string; fields: FieldDef[] };

type WorklistColumn = {
  key: keyof WorklistRow | string;
  header: string;
  render?: (r: WorklistRow) => ReactNode;
  className?: string;
};

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

const DEFAULT_COLUMNS: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "reference", header: "Reference", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

const GROUPS: FieldGroup[] = [
  {
    title: "Segment",
    fields: [
      { label: "Segment No.", value: "SEG-001" },
      { label: "Mode", value: "Road", type: "select", options: ["Road", "Rail", "Air", "Sea"] },
      { label: "Origin", value: "Shameerpet WH" },
      { label: "Destination", value: "Solapur Hub" },
      { label: "Distance (km)", value: 525, type: "number" },
      { label: "Carrier", value: "SAFEXPRESS PRIVATE LTD" },
      { label: "Vehicle / Container No.", value: "TS09EE4521" },
      { label: "Stage Cost", value: 18500, type: "number" },
    ],
  },
  {
    title: "Schedule",
    fields: [
      { label: "Planned Departure", value: "2026-06-10T08:00", type: "date" },
      { label: "Planned Arrival", value: "2026-06-11T06:00", type: "date" },
      { label: "Actual Departure", value: "2026-06-10T08:25", type: "date" },
      { label: "Actual Arrival", value: "", type: "date" },
      { label: "Remarks", value: "Driver change at Pune", span: 4, type: "textarea" },
    ],
  },
];

const LINE_ITEM_COLUMNS = [
  "Sl.No",
  "Origin",
  "Destination",
  "Mode",
  "Distance (km)",
  "Planned Dep.",
  "Planned Arr.",
  "Status",
];

// ─────────────── Page ───────────────
function SegmentInfoPage() {
  const rows: WorklistRow[] = [];
  const columns = DEFAULT_COLUMNS;
  const title = "Segment Info";

  const [tab, setTab] = useState<"create" | "search">("create");
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id ?? "");
  const [direction, setDirection] = useState<Direction | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);
  const [searchType] = useState<(typeof SEARCH_TYPES)[number]>("Reference");
  const [searchValue] = useState("");

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

  const filteredRows = searchValue.trim()
    ? rows.filter((r) => {
        const key = SEARCH_TYPE_TO_KEY[searchType];
        const v = String((r as Record<string, unknown>)[key] ?? "").toLowerCase();
        return v.includes(searchValue.trim().toLowerCase());
      })
    : rows;

  return (
    <div className="flex flex-col min-h-full">
      <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
        {/* Page header */}
        <div className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                  {title}
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
                  onSelect={() => setDirection("outward")}
                />
                {direction && (
                  <>
                    <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
                    <SapToggle value={sap} onChange={setSap} />
                  </>
                )}
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-amber-300/60 bg-amber-100 dark:bg-amber-500/15 text-[11px] font-semibold text-amber-800 dark:text-amber-200">
                    <span className="size-1.5 rounded-full bg-warning" />
                    Pending
                    <span className="font-mono">{counts.pending}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-emerald-300/60 bg-emerald-100 dark:bg-emerald-500/15 text-[11px] font-semibold text-emerald-800 dark:text-emerald-200">
                    <span className="size-1.5 rounded-full bg-success" />
                    Completed
                    <span className="font-mono">{counts.completed}</span>
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

            {direction === "outward" && sap && (
              <SegmentInfoSapCreateInline mode={sap} />
            )}

            {direction === "inward" && sap && (
              <>
                {GROUPS.map((g) => (
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

                <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                  <div className="px-3 py-2 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                      Line Items
                    </h3>
                    <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent/10 rounded-md">
                      <Plus className="size-3" /> Add Row
                    </button>
                  </div>
                  <div className="overflow-x-auto scrollbar-elegant">
                    <table className="w-full text-[11.5px]">
                      <thead>
                        <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground">
                          {LINE_ITEM_COLUMNS.map((c) => (
                            <th key={c} className="px-2 py-1 text-left">
                              {c}
                            </th>
                          ))}
                          <th className="px-2 py-1 w-12 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline/60" />
                    </table>
                  </div>
                </div>

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
              </>
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
                <SearchSapToggle value={searchSap} onChange={setSearchSap} />
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
                    <SelectField label="Plant" value={fPlant} onChange={setFPlant} options={PLANTS} placeholder="Select Plant" />
                    <SelectField label="Division" value={fDivision} onChange={setFDivision} options={DIVISIONS} placeholder="Select Division" />
                    <SelectField label="Transporter" value={fTransporter} onChange={setFTransporter} options={TRANSPORTERS} placeholder="Select Transporter" />
                    <SelectField label="Vehicle Type" value={fVehicleType} onChange={setFVehicleType} options={VEHICLE_TYPES} placeholder="Select Vehicle Type" />
                    <SelectField label="Status" value={fStatus} onChange={setFStatus} options={[...STATUS_OPTIONS]} placeholder="Select Status" />
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
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">No results yet</h3>
                <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
                  Choose your filters above and click <span className="font-semibold">Apply Filter</span> to load records.
                </p>
              </div>
            ) : (
              <div className="bg-surface border border-hairline rounded shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <div>
                    <h3 className="font-display text-[14px] font-semibold text-foreground tracking-tight">Results</h3>
                    <p className="text-[11.5px] text-muted-foreground mt-0.5">
                      {filteredRows.length} row{filteredRows.length === 1 ? "" : "s"}
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
                        {columns.map((c) => (
                          <th key={c.key as string} className={"px-2 py-1.5 whitespace-nowrap " + (c.className ?? "")}>
                            {c.header}
                          </th>
                        ))}
                        <th className="px-2 py-1.5 w-28 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/60">
                      {filteredRows.map((r) => (
                        <tr
                          key={r.id}
                          className={
                            "group cursor-pointer transition-colors " +
                            (selectedId === r.id ? "bg-accent/[0.06]" : "hover:bg-accent/[0.04]")
                          }
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
                          {columns.map((c) => (
                            <td key={c.key as string} className="px-2 py-1 whitespace-nowrap">
                              {c.render ? c.render(r) : ((r as Record<string, unknown>)[c.key as string] as ReactNode)}
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
                      {filteredRows.length === 0 && (
                        <tr>
                          <td colSpan={columns.length + 2} className="px-3 py-10 text-center text-[12px] text-muted-foreground">
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

// ─────────────── Inlined SAP create body ───────────────
const GREEN_INPUT =
  "h-7 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";
const LABEL = "block text-[11px] font-semibold text-muted-foreground mb-0.5";

const SAP_SEARCH_OPTIONS = ["Reference", "Invoice", "ODN", "SO Number", "Work Order", "LR Number"];

const BASE_FIELDS: FieldDef[] = [
  { label: "Sales Person", value: "", type: "select", options: ["Ravi Kumar", "Suresh Reddy", "Anita Sharma"] },
  { label: "Segment", value: "", type: "select", options: ["Industrial", "Defence", "Telecom", "Retail"] },
  { label: "Application Type", value: "", type: "select", options: ["UPS", "Solar", "Telecom Tower", "Railway"] },
  { label: "Customer Profile", value: "PVT INDUSTRY" },
  { label: "Branch", value: "", type: "select", options: ["Hyderabad", "Mumbai", "Delhi", "Chennai"] },
  { label: "Branch Zone", value: "" },
  { label: "Destination State", value: "" },
  { label: "Destination Zone", value: "North" },
  {
    label: "TAT Type",
    value: "",
    type: "select",
    options: [
      "Direct Truck TAT(Vizag)",
      "Direct Truck TAT(Hyd)",
      "Revised TAT",
      "Safe Express TAT",
      "Delivery TAT",
      "GATI TAT",
    ],
  },
  { label: "TAT (Days)", value: "0", type: "number" },
  { label: "ETA", value: "", type: "date" },
];

function SegmentInfoSapCreateInline({ mode }: { mode: SapMode }) {
  const isWithout = mode === "without";
  const [checked, setChecked] = useState(true);
  const [searchType, setSearchType] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [revealed, setRevealed] = useState(false);
  const showFields = isWithout || revealed;
  const fields = isWithout
    ? ([{ label: "Invoice Number", value: "" }, ...BASE_FIELDS] as FieldDef[])
    : BASE_FIELDS;

  return (
    <div className="space-y-2">
      {/* Selection table */}
      <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
              <th className="px-3 py-0.5 text-center w-16">Select</th>
              <th className="px-3 py-0.5 text-center w-16">Sl.No</th>
              <th className="px-3 py-0.5 text-center">Reference Number</th>
              <th className="px-3 py-0.5 text-center">Work Order Number</th>
              <th className="px-3 py-0.5 text-center">LR Number</th>
              <th className="px-3 py-0.5 text-center">Transporter</th>
              <th className="px-3 py-0.5 text-center w-20">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-0.5 text-center">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setChecked(e.target.checked)}
                  className="size-4 accent-sky-600"
                />
              </td>
              <td className="px-3 py-0.5 text-center">1</td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Ref. No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Work Order No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter LR No." className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5">
                <input placeholder="Enter Transporter" className={GREEN_INPUT + " text-center"} />
              </td>
              <td className="px-3 py-0.5 text-center">
                <button className="inline-grid place-items-center size-7 rounded-md text-muted-foreground hover:bg-muted">
                  <MoreVertical className="size-4" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lookup bar */}
      <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
        <div className="flex flex-wrap items-end gap-3">
          {!isWithout && (
            <>
              <div className="flex-1 min-w-[220px]">
                <label className={LABEL}>Invoice Number</label>
                <input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className={GREEN_INPUT}
                />
              </div>
              <button
                onClick={() => {
                  if (invoiceNumber.trim()) setRevealed(true);
                }}
                disabled={!invoiceNumber.trim()}
                className="h-7 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </>
          )}
          <div className="min-w-[160px]">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="h-7 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
            >
              <option value="">Select</option>
              {SAP_SEARCH_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Enter Reference / Invoice / ODN / SO Number"
              className="h-7 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
            />
            <button className="h-7 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta">
              <Search className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {!isWithout && !revealed && (
        <p className="text-[12px] text-muted-foreground px-1">
          Enter an Invoice Number and click <span className="font-semibold">GET</span> to load fields.
        </p>
      )}

      {showFields && (
        <>
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2">
              {fields.map((f) => (
                <SapField key={f.label} field={f} />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm">
              <Save className="size-3.5" /> Save
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-teal-500 hover:bg-teal-600 text-white text-[12px] font-semibold shadow-sm">
              Save and Next <ChevronRight className="size-3.5" />
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-7 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold shadow-sm">
              <ChevronLeft className="size-3.5" /> Save and Previous
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function SapField({ field }: { field: FieldDef }) {
  const { label, value, type = "text", options } = field;
  return (
    <div>
      <label className={LABEL}>{label}</label>
      {type === "select" ? (
        <select defaultValue={value as string} className={GREEN_INPUT}>
          <option value="" disabled>
            Select {label}
          </option>
          {(options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      ) : type === "date" ? (
        <input type="datetime-local" defaultValue={value as string} className={GREEN_INPUT} />
      ) : type === "number" ? (
        <input type="number" defaultValue={value as string | number} className={GREEN_INPUT} />
      ) : (
        <input defaultValue={value as string} placeholder={`Enter ${label}`} className={GREEN_INPUT} />
      )}
    </div>
  );
}

// ─────────────── Helpers ───────────────
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