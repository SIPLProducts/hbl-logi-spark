import { useEffect, useState, type ReactNode } from "react";
import { format } from "date-fns";
import {
  Plus,
  Download,
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
import { sampleRows, counts, type WorklistRow } from "@/lib/le-mock-data";
import { LeFooter } from "./le-footer";
import { cn } from "@/lib/utils";

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

export type FieldDef = {
  label: string;
  value?: string | number;
  type?: "text" | "select" | "date" | "number" | "textarea";
  options?: string[];
  span?: 1 | 2 | 3 | 4;
};

export type FieldGroup = {
  title: string;
  fields: FieldDef[];
};

export type WorklistColumn = {
  key: keyof WorklistRow | string;
  header: string;
  render?: (r: WorklistRow) => ReactNode;
  className?: string;
};

export type KpiTile = {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

const DEFAULT_COLUMNS: WorklistColumn[] = [
  { key: "slNo", header: "Sl.No", render: (r) => r.slNo },
  { key: "reference", header: "Reference", render: (r) => <span className="font-mono">{r.reference}</span> },
  { key: "workOrder", header: "Work Order", render: (r) => <span className="font-mono">{r.workOrder}</span> },
  { key: "lrNumber", header: "LR Number", render: (r) => <span className="font-mono">{r.lrNumber}</span> },
  { key: "transporter", header: "Transporter", render: (r) => r.transporter },
];

export function LeScreenShell({
  title,
  description,
  kpis,
  columns = DEFAULT_COLUMNS,
  rows = sampleRows,
  groups,
  topFields,
  lineItems,
  children,
  renderCreateBody,
  renderDirectionExtras,
}: {
  title: string;
  description?: string;
  kpis?: KpiTile[];
  columns?: WorklistColumn[];
  rows?: WorklistRow[];
  groups?: FieldGroup[];
  topFields?: FieldDef[];
  lineItems?: { columns: string[]; rows: (string | number)[][] };
  extraTabs?: { label: string; active?: boolean }[];
  children?: ReactNode;
  renderCreateBody?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
  renderDirectionExtras?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
}) {
  const [tab, setTab] = useState<"create" | "search">("create");
  const [selectedId, setSelectedId] = useState<string>(rows[0]?.id ?? "");
  const [direction, setDirection] = useState<"outward" | "inward">("outward");
  const [sap, setSap] = useState<SapMode>("with");
  const [searchType, setSearchType] = useState<(typeof SEARCH_TYPES)[number]>("Reference");
  const [searchValue, setSearchValue] = useState("");

  // Search & Reports filter state (Dispatch-style)
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

  // Avoid SSR/CSR hydration mismatch on the live clock
  const [syncedAt, setSyncedAt] = useState<string>("—");
  useEffect(() => {
    setSyncedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const filteredRows = searchValue.trim()
    ? rows.filter((r) => {
        const key = SEARCH_TYPE_TO_KEY[searchType];
        const v = String((r as Record<string, unknown>)[key] ?? "").toLowerCase();
        return v.includes(searchValue.trim().toLowerCase());
      })
    : rows;

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="bg-surface/80 backdrop-blur border-b border-hairline px-4 sm:px-6 lg:px-8 pt-6 pb-5 shadow-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden sm:grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-white shadow-cta">
              <FileText className="size-5" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[26px] leading-none font-bold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {description && (
                <p className="text-[12.5px] text-muted-foreground mt-1.5 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-[11px] font-mono text-muted-foreground">
              Synced · {syncedAt}
            </span>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
            <button className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted">
              <Download className="size-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-7">
        <Tabs value={tab} onValueChange={(v) => setTab(v as "create" | "search")} className="w-full">
          <TabsList className="bg-surface border border-hairline rounded-xl p-1 h-auto shadow-soft">
            <TabsTrigger
              value="create"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-lg px-4 py-2 text-[12.5px] font-semibold gap-1.5 transition-all"
            >
              <Plus className="size-3.5" /> Create
            </TabsTrigger>
            <TabsTrigger
              value="search"
              className="data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-cta rounded-lg px-4 py-2 text-[12.5px] font-semibold gap-1.5 transition-all"
            >
              <Filter className="size-3.5" /> Search &amp; Reports
            </TabsTrigger>
          </TabsList>

          {/* ───────── Create tab ───────── */}
          <TabsContent value="create" className="mt-5 space-y-5">
            {/* Direction + SAP */}
            <div className="bg-surface border border-hairline rounded-2xl p-5 shadow-elegant">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Direction
                </span>
                <PremiumRadio
                  label="Outward"
                  checked={direction === "outward"}
                  onSelect={() => setDirection("outward")}
                />
                {/* <PremiumRadio
                  label="Inward"
                  checked={direction === "inward"}
                  onSelect={() => setDirection("inward")}
                /> */}
                <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
                <SapToggle value={sap} onChange={setSap} />
                {renderDirectionExtras?.({ sap, direction })}
              </div>
            </div>

            {(() => {
              const override = renderCreateBody?.({ sap, direction });
              if (override) return override;
              return (
                <>
            {kpis && kpis.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {kpis.map((k) => (
                  <KpiCard key={k.label} {...k} />
                ))}
              </div>
            )}

            {topFields && topFields.length > 0 && (
              <div className="bg-surface border border-hairline rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 shadow-elegant">
                {topFields.map((f) => (
                  <FieldInput key={f.label} field={f} />
                ))}
              </div>
            )}

            {groups?.map((g) => (
              <div
                key={g.title}
                className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden"
              >
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                    {g.title}
                  </h3>
                </div>
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {g.fields.map((f) => (
                    <div key={f.label} className={spanClass(f.span)}>
                      <FieldInput field={f} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {lineItems && (
              <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
                <div className="px-5 py-3 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                    Line Items
                  </h3>
                  <button className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-accent hover:bg-accent/10 rounded-md">
                    <Plus className="size-3" /> Add Row
                  </button>
                </div>
                <div className="overflow-x-auto scrollbar-elegant">
                  <table className="w-full text-[12.5px]">
                    <thead>
                      <tr className="bg-surface-2/80 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground border-b border-hairline">
                        {lineItems.columns.map((c) => (
                          <th key={c} className="px-3 py-2 text-left">
                            {c}
                          </th>
                        ))}
                        <th className="px-3 py-2 w-16 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline/60">
                      {lineItems.rows.map((row, i) => (
                        <tr key={i} className="hover:bg-accent/[0.04]">
                          {row.map((cell, j) => (
                            <td key={j} className="px-3 py-2">
                              {typeof cell === "number" ? (
                                <span className="font-mono">{cell}</span>
                              ) : (
                                cell
                              )}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-right">
                            <button className="text-muted-foreground hover:text-destructive">
                              <Trash2 className="size-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
                </>
              );
            })()}

            {children}

            {/* Action bar */}
            {!(renderCreateBody && renderCreateBody({ sap, direction })) && (
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

          {/* ───────── Search & Reports tab ───────── */}
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
                <div className="p-6 text-center text-[12.5px] text-muted-foreground">
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
                <p className="mt-1 text-[12.5px] text-muted-foreground max-w-md mx-auto">
                  Choose your filters above and click{" "}
                  <span className="font-semibold">Apply Filter</span> to load records.
                </p>
              </div>
            ) : (
            <div className="bg-surface border border-hairline rounded-2xl shadow-elegant overflow-hidden">
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
              <div className="overflow-x-auto scrollbar-elegant">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead>
                    <tr className="bg-surface-2/80 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground border-b border-hairline">
                      <th className="px-3 py-3 w-10 text-center">
                        <input type="checkbox" className="accent-accent" />
                      </th>
                      {columns.map((c) => (
                        <th
                          key={c.key as string}
                          className={"px-3 py-3 whitespace-nowrap " + (c.className ?? "")}
                        >
                          {c.header}
                        </th>
                      ))}
                      <th className="px-3 py-3 w-28 text-right">Actions</th>
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
                        <td className="px-3 py-2.5 text-center">
                          <input
                            type="radio"
                            checked={selectedId === r.id}
                            onChange={() => setSelectedId(r.id)}
                            className="accent-accent"
                          />
                        </td>
                        {columns.map((c) => (
                          <td key={c.key as string} className="px-3 py-2.5 whitespace-nowrap">
                            {c.render
                              ? c.render(r)
                              : ((r as Record<string, unknown>)[c.key as string] as ReactNode)}
                          </td>
                        ))}
                        <td className="px-3 py-2.5 text-right">
                          <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="View"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                              aria-label="Edit"
                            >
                              <Pencil className="size-3.5" />
                            </button>
                            <button
                              className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={columns.length + 2}
                          className="px-3 py-10 text-center text-[12.5px] text-muted-foreground"
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
        </Tabs>
      </div>

      <LeFooter />
    </div>
  );
}

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

function LabeledField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
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
          className="bg-surface border border-hairline rounded-md px-2 h-9 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        >
          {(options ?? [String(value ?? "Select")]).map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          defaultValue={value as string}
          rows={2}
          className="bg-surface border border-hairline rounded-md px-2 py-1.5 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      ) : (
        <input
          type={type === "date" ? "datetime-local" : type}
          defaultValue={value as string | number}
          className="bg-surface border border-hairline rounded-md px-2 h-9 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 font-mono"
        />
      )}
    </div>
  );
}

function KpiCard({ label, value, delta, tone = "default" }: KpiTile) {
  const toneClasses: Record<NonNullable<KpiTile["tone"]>, string> = {
    default: "text-foreground",
    success: "text-success",
    warning: "text-warning",
    danger: "text-destructive",
    info: "text-info",
  };
  const dotClasses: Record<NonNullable<KpiTile["tone"]>, string> = {
    default: "bg-muted-foreground",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-destructive",
    info: "bg-info",
  };
  return (
    <div className="bg-surface border border-hairline rounded-2xl p-4 shadow-elegant hover:border-accent/40 transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        <span className={"size-1.5 rounded-full " + dotClasses[tone]} />
        {label}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <div className={"font-display text-2xl font-semibold tabular-nums " + toneClasses[tone]}>
          {value}
        </div>
        {delta && <div className="text-[11px] font-mono text-muted-foreground">{delta}</div>}
      </div>
    </div>
  );
}

function SapToggle({ value, onChange }: { value: SapMode; onChange: (v: SapMode) => void }) {
  const idx = value === "with" ? 0 : 1;
  return (
    <div className="relative inline-flex items-center p-1 rounded-full bg-muted border border-hairline text-[12px] shadow-inner">
      <span
        className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-sm ring-1 ring-hairline transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${idx * 100}%)` }}
        aria-hidden
      />
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 px-4 h-8 rounded-full font-semibold transition-colors min-w-[96px]",
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
        "inline-flex items-center gap-2 text-[12.5px] font-medium cursor-pointer rounded-full pl-1.5 pr-3 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
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
    <div className="relative inline-flex items-center p-1 rounded-full bg-muted border border-hairline text-[12px] shadow-inner">
      {idx >= 0 && (
        <span
          className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-surface shadow-sm ring-1 ring-hairline transition-transform duration-300 ease-out"
          style={{ transform: `translateX(${idx * 100}%)` }}
          aria-hidden
        />
      )}
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 px-4 h-8 rounded-full font-semibold transition-colors min-w-[96px]",
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
