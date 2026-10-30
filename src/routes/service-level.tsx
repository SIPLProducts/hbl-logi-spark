import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type ReactNode } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileText,
  Eye,
  Search,
  Pencil,
  Check,
  X as XIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ServiceLevelSapCreate } from "@/components/service-level-sap-create";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";
import { getHandedOffDirection, getHandedOffSapMode, useConsumeSapModeHandOff } from "@/lib/sap-mode-handoff";

export const Route = createFileRoute("/service-level")({
  component: ServiceLevelPage,
});

function ServiceLevelPage() {
  const [loadType, setLoadType] = useState<"ftl" | "cargo" | null>(null);
  return (
    <ServiceLevelScreenShell
      title="Service Level (Shipment Feedback)"
      // Switching Supply / Other than Supply resets the Load Type selection
      onSapChange={() => setLoadType(null)}
      renderDirectionExtras={({ direction }) =>
        direction === "outward" ? (
          <>
            <div className="h-6 w-px bg-hairline mx-1 hidden sm:block" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Load Type
            </span>
            {([
              { id: "ftl", label: "Full Truck Load" },
              { id: "cargo", label: "Cargo" },
            ] as const).map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setLoadType((cur) => (cur === o.id ? null : o.id))}
                className={
                  "px-4 h-8 rounded-full text-[12px] font-semibold border transition-colors " +
                  (loadType === o.id
                    ? "bg-accent text-accent-foreground border-accent shadow-sm"
                    : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10")
                }
              >
                {o.label}
              </button>
            ))}
          </>
        ) : null
      }
      renderCreateBody={({ sap, direction }) =>
        direction === "outward" ? (
          <ServiceLevelFeedbackCreate
            key={`${sap}-${loadType ?? "none"}`}
            mode={sap === "with" ? "with" : "without"}
            loadType={loadType}
          />
        ) : null
      }
    />
  );
}

type SapMode = "with" | "without";

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

type KpiTile = {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
};

function ServiceLevelScreenShell({
  title,
  description,
  kpis,
  groups,
  topFields,
  lineItems,
  children,
  renderCreateBody,
  renderDirectionExtras,
  onSapChange,
}: {
  title: string;
  description?: string;
  kpis?: KpiTile[];
  groups?: FieldGroup[];
  topFields?: FieldDef[];
  lineItems?: { columns: string[]; rows: (string | number)[][] };
  children?: ReactNode;
  renderCreateBody?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
  renderDirectionExtras?: (ctx: { sap: SapMode; direction: "outward" | "inward" }) => ReactNode;
  /** Called when the user switches Supply / Other than Supply (used to reset Load Type). */
  onSapChange?: (v: SapMode) => void;
}) {
  const [direction, setDirection] = useState<"outward" | "inward" | null>(() => getHandedOffDirection());
  const [sap, setSap] = useState<SapMode | null>(() => getHandedOffSapMode());
  // Save & Next / Previous from the neighbouring screen opens this one in the same mode.
  useConsumeSapModeHandOff();

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="sticky top-0 z-30 bg-surface border-b border-hairline px-3 sm:px-4 lg:px-6 pt-2 pb-2 shadow-soft">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="hidden sm:grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-primary text-white shadow-cta">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-[18px] leading-none font-bold tracking-tight text-foreground truncate">
                {title}
              </h1>
              {description && (
                <p className="text-[11.5px] text-muted-foreground mt-1 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-1.5 px-3 h-8 text-[12px] font-semibold text-foreground border border-hairline rounded-lg bg-surface hover:bg-muted"
            >
              <RefreshCw className="size-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Create content */}
      <div className="flex-1 px-3 sm:px-4 lg:px-6 py-2 space-y-2">
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
                <SapToggle
                  value={sap}
                  onChange={(v) => {
                    if (v !== sap) onSapChange?.(v);
                    setSap(v);
                  }}
                />
              </>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              {direction && sap && renderDirectionExtras?.({ sap, direction })}
            </div>
          </div>
          {!direction && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">Select a direction to continue.</p>
          )}
          {direction && !sap && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Select <span className="font-semibold">Supply</span> or <span className="font-semibold">Other than Supply</span> to continue.
            </p>
          )}
        </div>

        {direction && sap && (() => {
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
                <div className="bg-surface border border-hairline rounded-xl p-2.5 grid grid-cols-2 md:grid-cols-4 gap-2 shadow-elegant">
                  {topFields.map((f) => (
                    <FieldInput key={f.label} field={f} />
                  ))}
                </div>
              )}

              {groups?.map((g) => (
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

              {lineItems && (
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
                          {lineItems.columns.map((c) => (
                            <th key={c} className="px-2 py-1 text-left">
                              {c}
                            </th>
                          ))}
                          <th className="px-2 py-1 w-12 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-hairline/60">
                        {lineItems.rows.map((row, i) => (
                          <tr key={i} className="hover:bg-accent/[0.04]">
                            {row.map((cell, j) => (
                              <td key={j} className="px-2 py-0.5">
                                {typeof cell === "number" ? (
                                  <span className="font-mono">{cell}</span>
                                ) : (
                                  cell
                                )}
                              </td>
                            ))}
                            <td className="px-2 py-0.5 text-right">
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
        {direction && sap && !(renderCreateBody && renderCreateBody({ sap, direction })) && (
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
      </div>
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

function SapToggle({ value, onChange }: { value: SapMode | null; onChange: (v: SapMode) => void }) {
  return (
    <div className="relative inline-flex items-center p-0 rounded-full bg-accent/10 text-[12px]">
      {(["with", "without"] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={cn(
            "relative z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-colors",
            value === m ? "bg-[#2E86C1] text-white shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
          role="radio"
          aria-checked={value === m}
        >
          <span
            className={cn(
              "grid place-items-center size-3.5 rounded-full border-2 transition-colors",
              value === m ? "border-white" : "border-muted-foreground/40",
            )}
            aria-hidden
          >
            <span
              className={cn(
                "size-1.5 rounded-full transition-all",
                value === m ? "bg-white scale-100" : "bg-transparent scale-0",
              )}
            />
          </span>
          {m === "with" ? "Supply" : "Other than Supply"}
        </button>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * Service Level (Shipment Feedback) — migrated from Angular
 * src/app/pages/dashboards/service-level/service-level.component.{ts,html}
 * ──────────────────────────────────────────────────────────────────────────── */

// Table Multi-Select Dropdown for LR Numbers
function TableMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select LR No",
  className,
  disabled = false,
  readOnly = false,
  allowManualEntry = false,
  onKeyDown,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  allowManualEntry?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = value
    ? value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    if (disabled || readOnly) return;
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    onChange(next.join(","));
  };

  const selectAll = () => {
    if (disabled || readOnly) return;
    onChange(options.join(","));
  };

  const clearAll = () => {
    if (disabled || readOnly) return;
    onChange("");
  };

  const displayLabel = () => {
    if (selected.length === 0) return "";
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  };

  return (
    <Popover open={disabled ? false : open} onOpenChange={disabled ? undefined : setOpen}>
      {allowManualEntry ? (
        <div
          className={
            (className ? className + " " : "") +
            "relative flex items-center !px-0 overflow-hidden focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30" +
            (disabled ? " cursor-not-allowed opacity-60 pointer-events-none" : "")
          }
        >
          <input
            type="text"
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            title={value}
            className="h-full w-full bg-transparent pl-2 pr-6 text-center text-[12px] font-mono font-medium text-foreground outline-none border-none placeholder:text-muted-foreground"
          />
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={disabled}
              tabIndex={-1}
              title="Select from dropdown"
              className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer shrink-0"
            >
              <ChevronDown className={"size-3.5 transition-transform" + (open ? " rotate-180" : "")} />
            </button>
          </PopoverTrigger>
        </div>
      ) : (
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            title={selected.join(", ")}
            className={
              (className ? className + " " : "") +
              "flex items-center justify-between gap-1 text-left truncate cursor-pointer" +
              (disabled ? " cursor-not-allowed opacity-60 pointer-events-none" : "") +
              (selected.length === 0 ? " text-muted-foreground" : "")
            }
          >
            <span className="truncate font-mono">{displayLabel() || placeholder}</span>
            <ChevronDown className={"size-3.5 shrink-0 transition-transform" + (open ? " rotate-180" : "")} />
          </button>
        </PopoverTrigger>
      )}
      <PopoverContent className="w-56 p-0 bg-white dark:bg-surface border border-hairline shadow-elegant" align="start">
        <div className="p-1.5 border-b border-hairline flex items-center justify-between text-[10.5px]">
          <span className="font-semibold text-muted-foreground">Select LR ({options.length})</span>
          {options.length > 1 && !readOnly && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={selectAll}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={clearAll}
                className="text-muted-foreground hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {options.length > 5 && (
          <div className="p-1.5 border-b border-hairline">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search LR..."
              className="h-6 w-full rounded border border-input bg-background px-2 text-[11px] text-foreground outline-none focus:border-accent"
            />
          </div>
        )}
        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-muted-foreground">No LR found</div>
          ) : (
            filtered.map((o) => (
              <label
                key={o}
                className={
                  "flex items-center gap-2 px-2 py-1 rounded text-[11.5px] transition-colors " +
                  (readOnly
                    ? "cursor-not-allowed opacity-60 text-muted-foreground"
                    : "cursor-pointer hover:bg-muted/60")
                }
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  disabled={readOnly}
                  onChange={() => toggle(o)}
                  className={
                    "size-3.5 accent-primary rounded " +
                    (readOnly ? "cursor-not-allowed opacity-70" : "cursor-pointer")
                  }
                />
                <span className="font-mono text-foreground">{o}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Multi-select dropdown for the Invoice Number field (same behaviour as the F4 invoice
// multi-select used in the other screens): tick one or many, All / Clear, search.
// Value is the selected invoices joined with ",".
function SLInvoiceMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select Invoice Number",
  className,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = value
    ? value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    : [];

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const toggle = (v: string) => {
    const next = selected.includes(v)
      ? selected.filter((x) => x !== v)
      : [...selected, v];
    onChange(next.join(","));
  };

  const displayLabel = () => {
    if (selected.length === 0) return "";
    if (selected.length === 1) return selected[0];
    return `${selected.length} Selected`;
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title={selected.join(", ")}
          className={
            (className ? className + " " : "") +
            "flex items-center justify-between gap-1 text-left truncate cursor-pointer" +
            (selected.length === 0 ? " text-muted-foreground" : "")
          }
        >
          <span className="truncate font-mono">{displayLabel() || placeholder}</span>
          <ChevronDown className={"size-3.5 shrink-0 transition-transform" + (open ? " rotate-180" : "")} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 bg-white dark:bg-surface border border-hairline shadow-elegant" align="start">
        <div className="p-1.5 border-b border-hairline flex items-center justify-between text-[10.5px]">
          <span className="font-semibold text-muted-foreground">Select Invoice ({options.length})</span>
          {options.length > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onChange(options.join(","))}
                className="text-primary hover:underline font-medium cursor-pointer"
              >
                All
              </button>
              <span className="text-muted-foreground">|</span>
              <button
                type="button"
                onClick={() => onChange("")}
                className="text-muted-foreground hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          )}
        </div>
        {options.length > 5 && (
          <div className="p-1.5 border-b border-hairline">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Invoice..."
              className="h-6 w-full rounded border border-input bg-background px-2 text-[11px] text-foreground outline-none focus:border-accent"
            />
          </div>
        )}
        <div className="max-h-48 overflow-y-auto p-1 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-2 text-center text-[11px] text-muted-foreground">No invoice found</div>
          ) : (
            filtered.map((o) => (
              <label
                key={o}
                className="flex items-center gap-2 px-2 py-1 rounded text-[11.5px] hover:bg-muted/60 transition-colors cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(o)}
                  onChange={() => toggle(o)}
                  className="size-3.5 accent-primary rounded"
                />
                <span className="font-mono text-foreground">{o}</span>
              </label>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

type SLRow = {
  referenceNumber: string;
  workOrderNumber: string;
  lrNumber: string;
  transporter: string;
  lineNumber: string;
  mapId: string;
  lrOptions?: string[];
  compInvoices?: string[];
  notAllowed?: boolean;
};

const slEmptyRow = (): SLRow => ({
  referenceNumber: "",
  workOrderNumber: "",
  lrNumber: "",
  transporter: "",
  lineNumber: "",
  mapId: "",
  lrOptions: [],
  compInvoices: [],
  notAllowed: false,
});

type SLFeedbackKey =
  | "onTimePlacement"
  | "transhipment"
  | "delivery"
  | "damage"
  | "accident"
  | "probiated"
  | "othermaterials"
  | "pod"
  | "freight"
  | "overall";

const SL_EMPTY_FEEDBACK: Record<SLFeedbackKey, string> = {
  onTimePlacement: "",
  transhipment: "",
  delivery: "",
  damage: "",
  accident: "",
  probiated: "",
  othermaterials: "",
  pod: "",
  freight: "",
  overall: "",
};

// Mirrors Validators.required on the Angular feedbackForm
const SL_REQUIRED_KEYS: SLFeedbackKey[] = [
  "delivery",
  "damage",
  "accident",
  "pod",
  "freight",
  "overall",
];

// Question rows in Angular template order; ftlOnly rows render for FULL TRUCK LOAD only.
// reverse mirrors the Angular "feedback-row reverse" class: NO → green, YES → red.
const SL_QUESTIONS: {
  key: SLFeedbackKey;
  label: string;
  ftlOnly?: boolean;
  reverse?: boolean;
}[] = [
    { key: "onTimePlacement", label: "On time placement", ftlOnly: true },
    { key: "transhipment", label: "Transhipment if any", ftlOnly: true, reverse: true },
    { key: "delivery", label: "On time delivery" },
    { key: "damage", label: "Damage if any", reverse: true },
    { key: "accident", label: "Accident if any", reverse: true },
    {
      key: "probiated",
      label: "Prohibited materials loaded along with battery",
      ftlOnly: true,
      reverse: true,
    },
    {
      key: "othermaterials",
      label: "Other materials loaded during transit",
      ftlOnly: true,
      reverse: true,
    },
    { key: "pod", label: "On time POD submission" },
    { key: "freight", label: "On time freight bill submission" },
  ];

// Search bar options (same list and payload keys as the other screens' global search)
const SL_SEARCH_OPTIONS = [
  { key: "ref_no", label: "Reference No" },
  { key: "inv_no", label: "Invoice No" },
  { key: "workorder_no", label: "Work Order" },
  { key: "lr_no", label: "LR No" },
  { key: "transporter", label: "Transporter" },
];

// Search results table: one column per field of the search response (in response order),
// header name + value side by side. MANDT / ZLOCALFILES / ZLOCALFILE_URLS are internal.
// `edit` (optional) makes the column editable when the row's Edit button is used:
//   score / scoreReverse → YES / NO buttons (reverse questions: YES red, NO green), value kept as chosen
//   yesno → YES / NO dropdown · rating → Overall Feedback dropdown · text → text box
// "Vehicle Rejected Due To" options — saved in ZVREJ_REASON (Create and Change/Edit)
const SL_VEHICLE_REJECTED_REASONS = [
  "Vehicle Quality Issue",
  "Driver Documents Issue",
  "Vehicle Document Expired or Validity",
  "Driver Refused to Load the Material",
  "Order Cancelled",
  "Others",
];

type SLSearchEdit = { field: string; type: "score" | "scoreReverse" | "yesno" | "rating" | "text" | "rejectReason" };
// True when a search result row is a CARGO load (ZVEH_TYPE = "CARGO").
const slIsCargoRow = (row: any): boolean =>
  String(row?.ZVEH_TYPE ?? "").trim().toUpperCase() === "CARGO";

// notForCargo: On Time Placement, Transhipment, Prohibited Materials and Other Materials
// don't apply to CARGO loads (same as the Create form, where they are Full Truck Load only).
const SL_SEARCH_COLUMNS: { label: string; value: (item: any) => unknown; edit?: SLSearchEdit; notForCargo?: boolean }[] = [
  { label: "Ref No", value: (i) => i.ZREFNO },
  { label: "Line No", value: (i) => i.ZLINE_NO },
  { label: "Invoice No", value: (i) => i.VBELN || i.ZINV_NO || i.ZINV_NUM },
  { label: "LR No", value: (i) => i.ZLRNO },
  { label: "Map Id", value: (i) => i.ZMAPID },
  { label: "Transporter", value: (i) => i.ZTRANSPORTER },
  { label: "Work Order", value: (i) => i.ZWORK_ORDER },
  { label: "Vehicle Type", value: (i) => i.ZVEH_TYPE },
  { label: "Vehicle Rejected", value: (i) => i.ZVEH_REJ, edit: { field: "ZVEH_REJ", type: "yesno" } },
  { label: "Vehicle Reason", value: (i) => i.ZVREJ_REASON, edit: { field: "ZVREJ_REASON", type: "rejectReason" } },
  { label: "On Time Placement", value: (i) => i.ZONTIME, edit: { field: "ZONTIME", type: "score" }, notForCargo: true },
  { label: "Transhipment If Any", value: (i) => i.ZTRNSMNT, edit: { field: "ZTRNSMNT", type: "scoreReverse" }, notForCargo: true },
  { label: "On Time Delivery", value: (i) => i.ZONDELV, edit: { field: "ZONDELV", type: "score" } },
  { label: "Damage If Any", value: (i) => i.ZDAMAGE, edit: { field: "ZDAMAGE", type: "scoreReverse" } },
  { label: "Accident If Any", value: (i) => i.ZACCIDENT, edit: { field: "ZACCIDENT", type: "scoreReverse" } },
  { label: "Prohibited Materials", value: (i) => i.ZPROBIATED, edit: { field: "ZPROBIATED", type: "scoreReverse" }, notForCargo: true },
  { label: "Other Materials in Transit", value: (i) => i.ZLOADTRANSIT, edit: { field: "ZLOADTRANSIT", type: "scoreReverse" }, notForCargo: true },
  { label: "On Time POD Submission", value: (i) => i.ZONPOD, edit: { field: "ZONPOD", type: "score" } },
  { label: "On Time Freight Bill Submission", value: (i) => i.ZONFREIGHT, edit: { field: "ZONFREIGHT", type: "score" } },
  { label: "Overall Feedback", value: (i) => i.ZFEEDBACK, edit: { field: "ZFEEDBACK", type: "rating" } },
  { label: "Total Score", value: (i) => i.ZTOT_SCORE },
  { label: "Plant", value: (i) => i.ZPLANT },
  { label: "Division", value: (i) => i.ZDIVISION },
  { label: "Remarks", value: (i) => i.ZREMARKS, edit: { field: "ZREMARKS", type: "text" } },
  { label: "Created By", value: (i) => i.ZUSER },
  { label: "Changed By", value: (i) => i.ZUSER_CH },
  { label: "Submitted Date", value: (i) => i.ZSUBMIT_DT },
  { label: "Changed Date", value: (i) => i.ZCHANGE_DT },
];

// ── Search results colours — same colours as the Create form's Yes/No and rating buttons ──
const SL_GOOD_COLOUR = "bg-emerald-100 text-emerald-700 border-emerald-400"; // green
const SL_BAD_COLOUR = "bg-rose-100 text-rose-700 border-rose-400"; // red
const SL_RATING_COLOURS: Record<string, string> = {
  POOR: "bg-rose-100 text-rose-700 border-rose-400",
  AVG: "bg-amber-100 text-amber-700 border-amber-400",
  GOOD: "bg-emerald-100 text-emerald-700 border-emerald-400",
  EXCELLENT: "bg-blue-100 text-blue-700 border-blue-400",
};
const SL_RATINGS = ["POOR", "AVG", "GOOD", "EXCELLENT"];

/**
 * Colour for a value shown in the search results table (view mode), or "" for no colour.
 *   score (normal questions)         → YES green / NO red
 *   scoreReverse (reverse questions) → YES red / NO green
 *     (when the answer comes as a score: 10 is always the good answer → green, 0 → red)
 *   yesno (Vehicle Rejected) → YES red, NO green
 *   rating (Overall Feedback) → POOR red, AVG amber, GOOD green, EXCELLENT blue
 */
function slSearchValueColour(type: string, value: string): string {
  const v = value.trim().toUpperCase();
  if (type === "score" || type === "scoreReverse") {
    const reverse = type === "scoreReverse";
    if (v === "YES") return reverse ? SL_BAD_COLOUR : SL_GOOD_COLOUR;
    if (v === "NO") return reverse ? SL_GOOD_COLOUR : SL_BAD_COLOUR;
    if (v === "10") return SL_GOOD_COLOUR;
    if (v === "0") return SL_BAD_COLOUR;
  }
  if (type === "yesno") {
    if (v === "YES") return SL_BAD_COLOUR;
    if (v === "NO") return SL_GOOD_COLOUR;
  }
  if (type === "rating") {
    return SL_RATING_COLOURS[v] || "";
  }
  return "";
}

const SL_INPUT =
  "h-8 w-full rounded-md bg-white dark:bg-surface border border-input px-2 text-[12px] text-foreground font-medium outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 read-only:bg-muted read-only:text-muted-foreground";

function slLoggedInUser(): string {
  try {
    const userData = JSON.parse(localStorage.getItem("currentUser") || "{}");
    return userData.USER || "";
  } catch {
    return "";
  }
}

function slSameRow(a: SLRow, b: SLRow): boolean {
  return (
    a.referenceNumber === b.referenceNumber &&
    a.workOrderNumber === b.workOrderNumber &&
    a.lrNumber === b.lrNumber &&
    a.transporter === b.transporter
  );
}

function SLYesNo({
  value,
  disabled,
  reverse,
  onChange,
}: {
  value: string;
  disabled?: boolean;
  reverse?: boolean;
  onChange: (v: "YES" | "NO") => void;
}) {
  const base =
    "px-4 h-7 rounded-full text-[11.5px] font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed";
  return (
    <div className="flex items-center gap-2">
      {(["YES", "NO"] as const).map((v) => {
        // Angular .reverse rows flip the colours: NO is the good (green) answer
        const selectedGreen = reverse ? v === "NO" : v === "YES";
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              base,
              value === v
                ? selectedGreen
                  ? "bg-emerald-100 text-emerald-700 border-emerald-400"
                  : "bg-rose-100 text-rose-700 border-rose-400"
                : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10",
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function ServiceLevelFeedbackCreate({
  mode,
  loadType,
}: {
  mode: SapMode;
  loadType: "ftl" | "cargo" | null;
}) {
  const isSap = mode === "with"; // Angular: sapType === 'SAP'
  const truckType =
    loadType === "ftl" ? "FULL TRUCK LOAD" : loadType === "cargo" ? "CARGO" : "";

  const [rows, setRows] = useState<SLRow[]>([slEmptyRow()]);
  // Last (fieldKey, value) pair that actually triggered a reference lookup —
  // guards against refiring the API when a field merely loses focus (e.g.
  // clicking the row checkbox or the Invoice Number select) without its
  // value having changed.
  const lastFetchedRef = useRef<{ fieldKey: string; value: string } | null>(null);
  const [selectedItems, setSelectedItems] = useState<SLRow[]>([]);
  // Raw reference-fetch response (mirrors SegmentInfoSapCreate's fullReferenceData) —
  // used to recompute invoiceList from just the rows the user has checked.
  const [fullReferenceData, setFullReferenceData] = useState<any[]>([]);
  const [invoiceList, setInvoiceList] = useState<string[]>([]);
  const [invoicenumber, setInvoicenumber] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Record<SLFeedbackKey, string>>({
    ...SL_EMPTY_FEEDBACK,
  });
  const [disabledFields, setDisabledFields] = useState<SLFeedbackKey[]>([]);
  // Feedback item 1: Vehicle Rejected ("YES" → Reason is required)
  const [vehicleRejected, setVehicleRejected] = useState("NO");
  const [rejectReason, setRejectReason] = useState("");
  // Overall Feedback remarks — shown once a rating is picked; required for POOR / AVG
  const [overallRemarks, setOverallRemarks] = useState("");
  // Search bar (next to Invoice Number) — same global search as the other screens
  const [slSearchType, setSlSearchType] = useState("");
  const [slSearchValue, setSlSearchValue] = useState("");
  const [slSearchResults, setSlSearchResults] = useState<any[]>([]);
  const [slSearchLoading, setSlSearchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [compInvoicesModalOpen, setCompInvoicesModalOpen] = useState(false);
  const [compInvoicesModalData, setCompInvoicesModalData] = useState<{
    refNo: string;
    invoices: string[];
  }>({ refNo: "", invoices: [] });

  const openCompletedInvoicesModal = (row: SLRow) => {
    setCompInvoicesModalData({
      refNo: row.referenceNumber || "-",
      invoices: row.compInvoices || [],
    });
    setCompInvoicesModalOpen(true);
  };

  const loggedInUser = slLoggedInUser();

  const isItemSelected = (row: SLRow): boolean =>
    selectedItems.some((item) => slSameRow(item, row));

  // Recompute invoiceList from just the selected reference rows (mirrors
  // SegmentInfoSapCreate.recomputeInvoiceList).
  const recomputeInvoiceList = (selected: SLRow[]): void => {
    if (selected.length === 0) {
      setInvoiceList([]);
      setInvoicenumber("");
      return;
    }
    const invoices: string[] = [];
    selected.forEach((sel) => {
      const match = fullReferenceData.find(
        (d: any) =>
          String(d.REF_NO ?? "") === sel.referenceNumber &&
          String(d.LINE_NO ?? "") === sel.lineNumber,
      );
      if (match && Array.isArray(match.INV_NO)) {
        match.INV_NO.forEach((inv: any) => {
          if (inv.VBELN && !invoices.includes(inv.VBELN)) {
            invoices.push(inv.VBELN);
          }
        });
      }
    });
    setInvoiceList(invoices);
    // Keep the chosen invoices that still belong to a ticked row; drop the rest.
    setInvoicenumber((prev) =>
      prev
        .split(",")
        .map((s) => s.trim())
        .filter((inv) => inv && invoices.includes(inv))
        .join(","),
    );
  };

  const onCheckboxChange = (checked: boolean, row: SLRow): void => {
    if (row.notAllowed) return;
    // Work out the next selection here (not inside a state updater) so recomputeInvoiceList's
    // own state updates don't run from within an updater function.
    const next = checked
      ? (selectedItems.some((item) => slSameRow(item, row)) ? selectedItems : [...selectedItems, row])
      : selectedItems.filter((item) => !slSameRow(item, row));
    setSelectedItems(next);
    recomputeInvoiceList(next);
  };

  const removeRow = (index: number): void => {
    if (rows.length === 1) return;
    const removedRow = rows[index];
    setRows((prev) => prev.filter((_, i) => i !== index));
    setSelectedItems((prev) => {
      const next = prev.filter((item) => !slSameRow(item, removedRow));
      recomputeInvoiceList(next);
      return next;
    });
  };

  const updateRowField = (index: number, key: keyof SLRow, value: string): void => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  };

  // Mirrors SegmentInfoSapCreate.populateReferenceRows: stash the raw fetch
  // response and seed invoiceList from every row just returned, then let
  // recomputeInvoiceList() narrow it down as the user checks rows.
  const populateRows = (data: any): void => {
    if (Array.isArray(data) && data.length > 0) {
      setFullReferenceData(data);
      const invoices: string[] = [];
      setRows(
        data.map((d: any) => {
          if (Array.isArray(d.INV_NO)) {
            d.INV_NO.forEach((inv: any) => {
              if (inv.VBELN && !invoices.includes(inv.VBELN)) invoices.push(inv.VBELN);
            });
          }

          let lrOptions: string[] = [];
          if (Array.isArray(d.LR_NO)) {
            lrOptions = d.LR_NO.map((x: any) =>
              typeof x === "object" && x !== null
                ? x.LR || x.LR_NO || x.lr_no || ""
                : String(x)
            ).filter(Boolean);
          } else if (typeof d.LR_NO === "string" && d.LR_NO.trim()) {
            lrOptions = d.LR_NO.split(",").map((x: string) => x.trim()).filter(Boolean);
          } else if (d.LR_NO != null && String(d.LR_NO).trim()) {
            lrOptions = [String(d.LR_NO).trim()];
          }
          lrOptions = Array.from(new Set(lrOptions));

          let compInvoices: string[] = [];
          if (Array.isArray(d.COMP_INV_NO)) {
            compInvoices = d.COMP_INV_NO.map((x: any) =>
              typeof x === "object" && x !== null
                ? x.VBELN || x.INV_NO || x.INVOICE || x.inv_no
                : String(x)
            ).filter(Boolean);
          } else if (typeof d.COMP_INV_NO === "string" && d.COMP_INV_NO.trim()) {
            compInvoices = [d.COMP_INV_NO.trim()];
          }
          compInvoices = Array.from(new Set(compInvoices));

          const isNotAllowed = String(d.ZNOT_ALLOWED || "").trim().toUpperCase() === "X";

          let initialLr = "";
          if (Array.isArray(d.LR_NO)) {
            initialLr = lrOptions.join(",");
          } else if (typeof d.LR_NO === "string") {
            initialLr = d.LR_NO;
          } else if (d.LR_NO != null) {
            initialLr = String(d.LR_NO);
          }

          if (lrOptions.length === 0 && initialLr && initialLr.trim()) {
            lrOptions = initialLr.split(",").map((x: string) => x.trim()).filter(Boolean);
          }

          return {
            referenceNumber: d.REF_NO ? String(d.REF_NO) : "",
            workOrderNumber: d.WORK_ORDER_NO ? String(d.WORK_ORDER_NO) : "",
            lrNumber: initialLr || (lrOptions.length > 0 ? lrOptions.join(",") : "") || (typeof d.LR_NO === "string" ? d.LR_NO : ""),
            transporter: d.TRANSPORTER ? String(d.TRANSPORTER) : "",
            lineNumber: d.LINE_NO ? String(d.LINE_NO) : "",
            mapId: d.MAPID ? String(d.MAPID) : "",
            lrOptions,
            compInvoices,
            notAllowed: isNotAllowed,
          };
        }),
      );
      setInvoiceList(invoices);
      setInvoicenumber("");
    } else {
      setFullReferenceData([]);
      if (data?.STATUS === "FALSE") {
        Swal.fire({ icon: "error", title: "Error", text: data?.MESSAGE || "No matching reference details found." });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
          text: "No matching reference details were found.",
          timer: 1500,
          showConfirmButton: false,
          width: "300px",
        });
      }
      setRows([slEmptyRow()]);
    }
  };

  const onFieldBlur = async (index: number, fieldKey: string): Promise<void> => {
    if (rows.length === 0) return;
    if (index !== 0) return;

    const values = rows[0];

    if (
      !values.referenceNumber &&
      !values.workOrderNumber &&
      !values.lrNumber &&
      !values.transporter
    ) {
      setRows([slEmptyRow()]);
      lastFetchedRef.current = null;
      return;
    }

    // String(...) here — after a fetch repopulates the row, populateRows()
    // carries the API's raw value through (e.g. REF_NO can come back as a
    // number), so comparing without normalizing types would never match the
    // string value captured before the fetch, defeating the guard below.
    const fieldValue = String(
      fieldKey === "REF_NO" ? values.referenceNumber :
        fieldKey === "WORK_ORDER_NO" ? values.workOrderNumber :
          fieldKey === "LR_NO" ? values.lrNumber :
            fieldKey === "TRANSPORTER" ? values.transporter : ""
    );

    // Field merely lost focus (e.g. checkbox click, Invoice Number select) —
    // its value hasn't changed since the last successful lookup, so skip.
    if (
      lastFetchedRef.current &&
      lastFetchedRef.current.fieldKey === fieldKey &&
      lastFetchedRef.current.value === fieldValue
    ) {
      return;
    }

    const obj = {
      global_scr: "SERVICE LEVEL",
      TYPE_OPTION: truckType,
      REF_NO: fieldKey === "REF_NO" ? values.referenceNumber : "",
      WORK_ORDER_NO: fieldKey === "WORK_ORDER_NO" ? values.workOrderNumber : "",
      LR_NO: fieldKey === "LR_NO" ? values.lrNumber : "",
      TRANSPORTER: fieldKey === "TRANSPORTER" ? values.transporter : "",
      LINE_NO: values.lineNumber || "",
      ZUSER: loggedInUser,
    };

    setLoading(true);
    try {
      const res = isSap
        ? await service.GlobalReferenceNoFetch(obj) // POST
        : await service.GlobalReferenceNoFetchwithoutsap(obj); // PUT
      populateRows(res);
      lastFetchedRef.current = { fieldKey, value: fieldValue };
    } catch (err) {
      console.error("❌ Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getForm = async (type: string): Promise<void> => {
    if (
      type === "invoice" &&
      invoicenumber &&
      truckType &&
      selectedItems.length > 0
    ) {
      const selected = selectedItems[0]; // take first selected row

      // Request body is an array: one { INV_DEF, ZREFNO, ZLINE_NO } entry per selected
      // invoice, using the ticked reference row(s) that own that invoice (falls back to the
      // first ticked row when the invoice can't be matched to a row).
      const invoicesToFetch = invoicenumber
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const obj = invoicesToFetch.flatMap((inv) => {
        const owners = selectedItems.filter((item) => {
          const match = fullReferenceData.find(
            (d: any) =>
              String(d.REF_NO ?? "") === item.referenceNumber &&
              String(d.LINE_NO ?? "") === item.lineNumber,
          );
          return (
            Array.isArray(match?.INV_NO) &&
            match.INV_NO.some((x: any) => String(x?.VBELN ?? "").trim() === inv)
          );
        });
        return (owners.length > 0 ? owners : [selected]).map((row) => ({
          INV_DEF: inv,
          ZREFNO: row.referenceNumber,
          ZLINE_NO: row.lineNumber || "",
        }));
      });

      setLoading(true);
      try {
        const res: any = isSap
          ? await service.FeedBackInvoiceDetailsfetchwithsap(obj)
          : await service.FeedBackInvoiceDetailsfetchwithoutsap(obj);

        setLoading(false);

        // ❌ NO DATA CASE
        if (res?.STATUS === "FALSE") {
          setDisabledFields([]); // feedbackForm.enable()
          setShowFeedback(false);
          Swal.fire({
            icon: "warning",
            title: "No Data Found",
            text: res.MESSAGE,
            confirmButtonText: "OK",
          });
          return;
        }

        // ✅ SUCCESS CASE
        if (res && res.length > 0) {
          const data = res[0];
          setFeedback((prev) => ({
            ...prev,
            onTimePlacement: data.ZONTIME ?? "",
            transhipment: data.ZTRNSMNT ?? "",
            delivery: data.ZONDELV ?? "",
            damage: data.ZDAMAGE ?? "",
            accident: data.ZACCIDENT ?? "",
            probiated: data.ZPROBIATED ?? "",
            othermaterials: data.ZLOADTRANSIT ?? "",
            pod: data.ZONPOD ?? "",
            freight: data.ZONFREIGHT ?? "",
            overall: data.ZFEEDBACK ?? "",
          }));
          // setVehicleRejected(
          //   ["YES", "NO"].includes(String(data.ZVEH_REJ ?? "").toUpperCase())
          //     ? String(data.ZVEH_REJ).toUpperCase()
          //     : "",
          // );
          setVehicleRejected(
            String(data.ZVEH_REJ ?? "NO").trim().toUpperCase() || "NO"
          );
          setRejectReason(data.ZVREJ_REASON ?? "");
          setOverallRemarks(data.ZREMARKS ?? "");
          setShowFeedback(true);
          setDisabledFields(["onTimePlacement", "delivery", "pod", "freight"]);
          Swal.fire({
            icon: "success",
            title: "Invoice Details Loaded Successfully",
            timer: 3000,
            confirmButtonText: "Ok",
          });
        }
      } catch {
        setLoading(false);
        Swal.fire({
          icon: "error",
          timer: 3000,
          confirmButtonText: "Ok",
        });
      }
    } else {
      alert("Select row + Invoice + Truck Type");
    }
  };

  // Search results columns: when every result row is CARGO, the not-for-cargo columns
  // (ZONTIME, ZTRNSMNT, ZPROBIATED, ZLOADTRANSIT) are hidden from the table.
  const allSearchResultsAreCargo = slSearchResults.length > 0 && slSearchResults.every(slIsCargoRow);
  const slVisibleSearchColumns = allSearchResultsAreCargo
    ? SL_SEARCH_COLUMNS.filter((col) => !col.notForCargo)
    : SL_SEARCH_COLUMNS;

  // ── Search bar → global search (same payload / handling as the other screens) ──
  const handleSlSearch = async () => {
    if (!slSearchValue.trim()) {
      Swal.fire("Please enter a value", "", "warning");
      return;
    }
    if (!slSearchType) {
      Swal.fire("Please select a search type", "", "info");
      return;
    }

    const payload: any = {
      global: "SERVICE LEVEL",
      ZUSER: loggedInUser,
      data: {
        ref_no: "",
        inv_no: "",
        // so_no: "",
        transporter: "",
        lr_no: "",
        workorder_no: ""
        // sales_person: "",
        // location: "",
        // odn_no: "",
        // vehicle_no: "",
        // freight_billno: "",
        // nature_damage: "",
        // claim_status: "",
      },
    };
    payload.data[slSearchType] = slSearchValue.trim();

    setSlSearchLoading(true);
    try {
      const res: any = isSap
        ? await service.global_Fields_SearchOption(payload)
        : await service.global_Fields_SearchOption_WithoutSap(payload);

      if (res?.NUMBER === "100" && res?.STATUS === "FALSE") {
        setSlSearchResults([]);
        Swal.fire("", res.MESSAGE, "warning");
      } else if (!res?.HEADER || res.HEADER.length === 0) {
        setSlSearchResults([]);
        Swal.fire("No records found", "", "info");
      } else {
        setSlSearchResults(res.HEADER);
        setShowFeedback(false);
        Swal.fire("Data fetched successfully!", "", "success");
      }
    } catch (err) {
      console.error(err);
      Swal.fire("Error fetching data", "", "error");
    } finally {
      setSlSearchLoading(false);
    }
  };

  // ── Search results row Edit / Update / Delete (same UI flow as the other screens) ──
  // The Service Level Change / Delete APIs are not available yet — the confirm dialogs are
  // in place and the API calls get wired into slUpdateSearchRow / slDeleteSearchRow later.
  const slEditSearchRow = (index: number) => {
    setSlSearchResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r, _backup: { ...r }, isEdit: true } : r)),
    );
  };
  const slCancelSearchEdit = (index: number) => {
    setSlSearchResults((prev) =>
      prev.map((r, i) => (i === index ? { ...r._backup, isEdit: false } : r)),
    );
  };
  const slPatchSearchRow = (index: number, field: string, value: string) => {
    setSlSearchResults((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  };
  const slUpdateSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to update this record?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, Update",
      cancelButtonText: "Cancel",
    });
    if (!result.isConfirmed) return;

    // Vehicle Rejected = YES needs a Reason (same rule as the feedback form)
    const vehicleRejectedValue = String(row.ZVEH_REJ ?? "").trim().toUpperCase();
    if (vehicleRejectedValue === "YES" && !String(row.ZVREJ_REASON ?? "").trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reason Missing",
        text: "Please enter the reason for Vehicle Rejected",
      });
      return;
    }

    // Change payload — the edited row, in the format the Change API expects
    const changeRecord = {
      ZREFNO: row.ZREFNO,
      ZLINE_NO: row.ZLINE_NO,
      VBELN: row.VBELN,
      ZLRNO: row.ZLRNO,
      ZMAPID: row.ZMAPID,
      ZTRANSPORTER: row.ZTRANSPORTER,
      ZWORK_ORDER: row.ZWORK_ORDER,
      ZVEH_TYPE: row.ZVEH_TYPE,
      ZVEH_REJ: vehicleRejectedValue,
      // Feedback answers — sent exactly as they are in the row (no conversion)
      ZONTIME: row.ZONTIME,
      ZTRNSMNT: row.ZTRNSMNT,
      ZONDELV: row.ZONDELV,
      ZDAMAGE: row.ZDAMAGE,
      ZACCIDENT: row.ZACCIDENT,
      ZPROBIATED: row.ZPROBIATED,
      ZLOADTRANSIT: row.ZLOADTRANSIT,
      ZONPOD: row.ZONPOD,
      ZONFREIGHT: row.ZONFREIGHT,
      ZFEEDBACK: row.ZFEEDBACK,
      ZTOT_SCORE: row.ZTOT_SCORE,
      ZPLANT: row.ZPLANT,
      ZDIVISION: row.ZDIVISION,
      ZUSER: row.ZUSER,
      ZUSER_CH: loggedInUser, // user making the change
      ZSUBMIT_DT: row.ZSUBMIT_DT,
      ZCHANGE_DT: row.ZCHANGE_DT,
      ZVREJ_REASON: vehicleRejectedValue === "YES" ? String(row.ZVREJ_REASON ?? "").trim() : "",
      ZREMARKS: String(row.ZREMARKS ?? "").trim(),
    };
    const payload = { CHANGE: [changeRecord] };

    try {
      const res: any = isSap
        ? await service.FeedBackChangewithsap(payload)
        : await service.FeedBackChangewithoutsap(payload);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE" || res?.NUMBER === "200";

      if (isSuccess) {
        // Leave edit mode, keeping the edited values in the row
        setSlSearchResults((prev) =>
          prev.map((r, i) => {
            if (i !== index) return r;
            const { _backup, ...rest } = r;
            return { ...rest, isEdit: false };
          }),
        );
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res?.MESSAGE || "Feedback updated successfully",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res?.MESSAGE || "Failed to update feedback",
        });
      }
    } catch (err) {
      console.error("Feedback change failed:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Internal Server Error. Please try again later.",
      });
    }
  };
  const slDeleteSearchRow = async (row: any, index: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this record? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
    });
    if (!result.isConfirmed) return;

    // Delete payload — the keys that identify the feedback record
    const deleteRecord = {
      ZREFNO: String(row.ZREFNO ?? ""),
      ZLINE_NO: String(row.ZLINE_NO ?? ""),
      VBELN: String(row.VBELN ?? ""),
      ZLRNO: String(row.ZLRNO ?? ""),
    };
    const payload = { DELETE: [deleteRecord] };

    try {
      const res: any = isSap
        ? await service.FeedBackDeletewithsap(payload)
        : await service.FeedBackDeletewithoutsap(payload);

      const isSuccess = String(res?.STATUS ?? "").toUpperCase() === "TRUE" || res?.NUMBER === "200";
      // The API can return a blank MESSAGE, so fall back to a default text
      const message = String(res?.MESSAGE ?? "").trim();

      if (isSuccess) {
        // Remove the deleted record from the search results table
        setSlSearchResults((prev) => prev.filter((_, i) => i !== index));
        Swal.fire({
          icon: "success",
          title: "Deleted",
          text: message || "Feedback deleted successfully",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: message || "Failed to delete feedback",
        });
      }
    } catch (err) {
      console.error("Feedback delete failed:", err);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while deleting.",
      });
    }
  };

  const refreshScreen = (): void => {
    setInvoicenumber("");
    setInvoiceList([]);
    setShowFeedback(false);
    setSelectedItems([]);
    setFeedback({ ...SL_EMPTY_FEEDBACK });
    setVehicleRejected("NO");
    setRejectReason("");
    setOverallRemarks("");
    setSlSearchType("");
    setSlSearchValue("");
    setSlSearchResults([]);
    setDisabledFields([]);
    setRows([slEmptyRow()]);
    setFullReferenceData([]);
    setLoading(false);
    lastFetchedRef.current = null;
  };

  const submitFeedback = async (): Promise<void> => {
    // 1️⃣ Check reference selection
    if (selectedItems.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No Reference Selected",
        text: "Please select at least one reference row",
        timer: 2000,
      });
      return;
    }

    // 2️⃣ Check invoice
    if (!invoicenumber) {
      Swal.fire({
        icon: "warning",
        title: "Invoice Missing",
        text: "Please enter Invoice Number",
        timer: 2000,
      });
      return;
    }

    // 3️⃣ Check feedback form (disabled controls are excluded, as in Angular)
    const feedbackInvalid = SL_REQUIRED_KEYS.some(
      (k) => !disabledFields.includes(k) && !feedback[k],
    );
    if (feedbackInvalid) {
      Swal.fire({
        icon: "warning",
        title: "Feedback Missing",
        text: "Please fill all required feedback fields",
        timer: 2000,
      });
      return;
    }

    // Vehicle Rejected is required; "YES" also needs a Reason
    if (!vehicleRejected) {
      Swal.fire({
        icon: "warning",
        title: "Feedback Missing",
        text: "Please select Vehicle Rejected (Yes / No)",
        timer: 2000,
      });
      return;
    }
    if (vehicleRejected === "YES" && !rejectReason.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Reason Missing",
        text: "Please enter the reason for Vehicle Rejected",
        timer: 2000,
      });
      return;
    }

    // Overall Feedback POOR / AVG needs Remarks (optional for the other ratings)
    if (["POOR", "AVG"].includes(feedback.overall) && !overallRemarks.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Remarks Missing",
        text: "Please enter Remarks for Poor / Average feedback",
        timer: 2000,
      });
      return;
    }

    // 4️⃣ Payload (getRawValue equivalent — includes disabled field values)
    const payload = selectedItems.map((item) => ({
      ZREFNO: item.referenceNumber,
      ZLINE_NO: item.lineNumber || "",
      VBELN: invoicenumber,
      ZLRNO: item.lrNumber,
      ZMAPID: item.mapId,
      ZTRANSPORTER: item.transporter,
      ZWORK_ORDER: item.workOrderNumber,
      ZVEH_TYPE: truckType,

      ZONTIME: feedback.onTimePlacement,
      ZTRNSMNT: feedback.transhipment,
      ZONDELV: feedback.delivery,
      ZDAMAGE: feedback.damage,
      ZACCIDENT: feedback.accident,
      ZPROBIATED: feedback.probiated,
      ZLOADTRANSIT: feedback.othermaterials,
      ZONPOD: feedback.pod,
      ZONFREIGHT: feedback.freight,
      ZFEEDBACK: feedback.overall,
      // Vehicle Rejected (+ Reason only when YES)
      ZVEH_REJ: vehicleRejected,
      ZVREJ_REASON: vehicleRejected === "YES" ? rejectReason.trim() : "",
      // Overall Feedback remarks
      ZREMARKS: overallRemarks.trim(),

      ZTOT_SCORE: "",
      ZPALNT: "",
      ZDIVISION: "",
      ZUSER: loggedInUser,
      ZSUBMIT_DT: new Date().toISOString().slice(0, 10),
    }));

    // Several invoices selected → one separate record per invoice (each with the ticked
    // reference row(s) that own it) in the same array. One invoice → payload unchanged.
    const invoicesSelected = invoicenumber
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const invoicesOfItem = (item: SLRow): string[] => {
      const match = fullReferenceData.find(
        (d: any) =>
          String(d.REF_NO ?? "") === item.referenceNumber &&
          String(d.LINE_NO ?? "") === item.lineNumber,
      );
      return Array.isArray(match?.INV_NO)
        ? match.INV_NO.map((x: any) => String(x?.VBELN ?? "").trim()).filter(Boolean)
        : [];
    };
    const finalPayload =
      invoicesSelected.length > 0 &&
        (invoicesSelected.length > 1 || selectedItems.length > 1)
        ? invoicesSelected.flatMap((inv) => {
          const owned = selectedItems
            .map((item, i) => (invoicesOfItem(item).includes(inv) ? i : -1))
            .filter((i) => i >= 0);
          const idxs = owned.length > 0 ? owned : selectedItems.map((_, i) => i);
          return idxs.map((i) => ({ ...payload[i], VBELN: inv }));
        })
        : payload;

    console.log("📦 Payload:", finalPayload);

    setLoading(true);
    try {
      const res: any = isSap
        ? await service.FeedbackCreationwithsap(finalPayload)
        : await service.FeedbackCreationwithoutsap(finalPayload);

      setLoading(false);

      // ❌ Already Submitted / Error from backend
      if (res?.STATUS === "FALSE") {
        Swal.fire({
          icon: "warning",
          title: "Warning",
          text: res.MESSAGE,
          confirmButtonText: "OK",
        });
        return;
      }

      // ✅ Success
      Swal.fire({
        icon: "success",
        title: "Feedback Submitted Successfully",
        timer: 3000,
        confirmButtonText: "OK",
      });

      refreshScreen();
    } catch (err) {
      setLoading(false);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "Something went wrong",
        timer: 2000,
      });
      console.error(err);
    }
  };

  const blurKeys = (index: number, fieldKey: string) => ({
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") void onFieldBlur(index, fieldKey);
    },
  });

  return (
    <div className="space-y-2">
      {!loadType && (
        <p className="text-[12px] text-muted-foreground px-1">
          Select <span className="font-semibold">Full Truck Load</span> or{" "}
          <span className="font-semibold">Cargo</span> to continue.
        </p>
      )}

      {loadType && (
        <>
          {/* Reference Number table */}
          <div className="rounded-xl overflow-hidden border border-hairline shadow-elegant bg-surface">
            <div className="overflow-x-auto scrollbar-elegant">
              <table className="w-full text-[12px]">
                <thead>
                  <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                    <th className="px-3 py-1 text-center w-16">Select</th>
                    <th className="px-3 py-1 text-center w-16">Sl.No</th>
                    <th className="px-3 py-1 text-center">Reference Number</th>
                    <th className="px-3 py-1 text-center">Work Order Number</th>
                    <th className="px-3 py-1 text-center">LR Number</th>
                    <th className="px-3 py-1 text-center">Transporter</th>
                    <th className="px-3 py-1 text-center whitespace-nowrap">Completed Invoices</th>
                    <th className="px-3 py-1 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/60">
                  {rows.map((row, i) => {
                    const isRowDisabled = Boolean(row.notAllowed);
                    return (
                      <tr
                        key={i}
                        className={cn(
                          "hover:bg-accent/[0.04]",
                          isRowDisabled && "bg-slate-100/90 dark:bg-zinc-800/80 text-muted-foreground"
                        )}
                      >
                        <td className="px-3 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={!isRowDisabled && isItemSelected(row)}
                            disabled={isRowDisabled}
                            onChange={(e) => onCheckboxChange(e.target.checked, row)}
                            onMouseDown={(e) => e.preventDefault()}
                            className={cn(isRowDisabled && "cursor-not-allowed opacity-50")}
                          />
                        </td>
                        <td className="px-3 py-1 text-center">{i + 1}</td>
                        <td className="px-3 py-1">
                          <input
                            type="text"
                            value={row.referenceNumber}
                            placeholder="Enter Ref. No."
                            maxLength={10}
                            readOnly={i !== 0 || isRowDisabled}
                            onChange={(e) =>
                              updateRowField(i, "referenceNumber", e.target.value)
                            }
                            {...blurKeys(i, "REF_NO")}
                            className={SL_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-3 py-1">
                          <input
                            type="text"
                            value={row.workOrderNumber}
                            placeholder="Enter Work Order No."
                            readOnly={i !== 0 || isRowDisabled}
                            onChange={(e) =>
                              updateRowField(i, "workOrderNumber", e.target.value)
                            }
                            {...blurKeys(i, "WORK_ORDER_NO")}
                            className={SL_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-3 py-1">
                          {row.lrOptions && row.lrOptions.length > 0 ? (
                            <TableMultiSelect
                              options={row.lrOptions}
                              value={row.lrNumber || ""}
                              readOnly={isRowDisabled}
                              allowManualEntry={i === 0 && !isRowDisabled}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") void onFieldBlur(i, "LR_NO");
                              }}
                              onChange={(val) => updateRowField(i, "lrNumber", val)}
                              placeholder="Select LR No"
                              className={
                                (isRowDisabled
                                  ? "h-8 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-pointer"
                                  : SL_INPUT) + " text-center"
                              }
                            />
                          ) : (
                            <input
                              type="text"
                              value={row.lrNumber}
                              placeholder="Enter LR No."
                              readOnly={i !== 0 || isRowDisabled}
                              onChange={(e) => updateRowField(i, "lrNumber", e.target.value)}
                              {...blurKeys(i, "LR_NO")}
                              className={
                                (isRowDisabled
                                  ? "h-8 w-full rounded-md bg-slate-200/50 dark:bg-zinc-900/60 border border-slate-300 dark:border-zinc-700 px-2 text-[12px] text-muted-foreground font-medium outline-none cursor-not-allowed"
                                  : SL_INPUT) + " text-center"
                              }
                            />
                          )}
                        </td>
                        <td className="px-3 py-1">
                          <input
                            type="text"
                            value={row.transporter}
                            placeholder="Enter Transporter"
                            readOnly={i !== 0 || isRowDisabled}
                            onChange={(e) =>
                              updateRowField(i, "transporter", e.target.value)
                            }
                            {...blurKeys(i, "TRANSPORTER")}
                            className={SL_INPUT + " text-center"}
                          />
                        </td>
                        <td className="px-3 py-1 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => openCompletedInvoicesModal(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800 transition-colors shadow-xs"
                            title="View Completed Invoices"
                          >
                            <Eye className="size-3" />
                            <span>View</span>
                            {row.compInvoices && row.compInvoices.length > 0 && (
                              <span className="ml-0.5 px-1 py-0.2 rounded-full text-[9px] bg-sky-200/70 text-sky-800 dark:bg-sky-800 dark:text-sky-100 font-bold">
                                {row.compInvoices.length}
                              </span>
                            )}
                          </button>
                        </td>
                        <td className="px-3 py-1 text-center">
                          {rows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(i)}
                              aria-label="Remove row"
                              className="inline-grid place-items-center size-7 rounded-md text-red-500 hover:bg-red-50"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Number + GET + Search bar */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                  Invoice Number
                </label>
                <SLInvoiceMultiSelect
                  options={invoiceList}
                  value={invoicenumber}
                  onChange={setInvoicenumber}
                  placeholder="Select Invoice Number"
                  className={SL_INPUT}
                />
              </div>
              <button
                type="button"
                onClick={() => void getForm("invoice")}
                disabled={!invoicenumber || invoicenumber.trim() === ""}
                className="h-8 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>

              {/* Search bar — same UI as the other screens */}
              <div className="min-w-[160px]">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                  Search By
                </label>
                <select
                  value={slSearchType}
                  onChange={(e) => setSlSearchType(e.target.value)}
                  className="h-8 w-full rounded-md border border-hairline bg-surface px-2 text-[12px] outline-none focus:border-accent"
                >
                  <option value="">Select</option>
                  {SL_SEARCH_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex-[2] min-w-[260px] flex items-stretch gap-0">
                <input
                  value={slSearchValue}
                  onChange={(e) => setSlSearchValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleSlSearch();
                  }}
                  placeholder="Enter Reference / Invoice / Work Order / LR / Transporter"
                  className="h-8 flex-1 rounded-l-md border border-hairline border-r-0 bg-surface px-3 text-[12px] outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => void handleSlSearch()}
                  disabled={slSearchLoading}
                  className="h-8 px-3 rounded-r-md bg-gradient-primary text-primary-foreground grid place-items-center shadow-cta disabled:opacity-50"
                >
                  <Search className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Search results (view only — Service Level has no change / delete API) */}
          {slSearchResults.length > 0 && !showFeedback && (
            <div className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden">
              <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
                <h3 className="text-[13px] font-semibold text-sky-600 tracking-tight">Search Results</h3>
              </div>
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                      {slVisibleSearchColumns.map((col) => (
                        <th key={col.label} className="px-3 py-2.5 whitespace-nowrap text-left">{col.label}</th>
                      ))}
                      <th className="px-3 py-2.5 whitespace-nowrap text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {slSearchResults.map((item: any, i: number) => (
                      <tr
                        key={i}
                        className={i % 2 === 0 ? "bg-surface hover:bg-muted/50" : "bg-surface-2/40 hover:bg-muted/50"}
                      >
                        {slVisibleSearchColumns.map((col) => {
                          // CARGO row in a mixed result: these questions don't apply → "-" (not editable)
                          if (col.notForCargo && slIsCargoRow(item)) {
                            return (
                              <td key={col.label} className="px-3 py-2 whitespace-nowrap text-muted-foreground">
                                -
                              </td>
                            );
                          }
                          const raw = col.value(item);
                          const v = typeof raw === "string" ? raw.trim() : raw;
                          if (item.isEdit && col.edit) {
                            const { field, type } = col.edit;
                            const current = String(item[field] ?? "").trim();
                            const cellCls =
                              "h-7 min-w-[110px] rounded border border-input bg-white dark:bg-surface px-1 text-[11px] text-foreground outline-none focus:border-accent";
                            // Yes / No questions — same YES / NO buttons and colours as the Create form
                            if (type === "score" || type === "scoreReverse") {
                              return (
                                <td key={col.label} className="px-2 py-1 whitespace-nowrap">
                                  <SLYesNo
                                    value={current.toUpperCase()}
                                    reverse={type === "scoreReverse"}
                                    onChange={(answer) => slPatchSearchRow(i, field, answer)}
                                  />
                                </td>
                              );
                            }

                            // Vehicle Rejected — YES red / NO green, same as the Create form
                            if (type === "yesno") {
                              return (
                                <td key={col.label} className="px-2 py-1 whitespace-nowrap">
                                  <SLYesNo
                                    value={current.toUpperCase()}
                                    reverse
                                    onChange={(answer) => {
                                      slPatchSearchRow(i, field, answer);
                                      if (answer === "NO") slPatchSearchRow(i, "ZVREJ_REASON", "");
                                    }}
                                  />
                                </td>
                              );
                            }

                            // Vehicle Rejected Due To — same options as the Create form (enabled only when Vehicle Rejected = YES)
                            if (type === "rejectReason") {
                              const isVehicleRejected = String(item.ZVEH_REJ ?? "").trim().toUpperCase() === "YES";
                              return (
                                <td key={col.label} className="px-2 py-1 whitespace-nowrap">
                                  <select
                                    value={current}
                                    onChange={(e) => slPatchSearchRow(i, field, e.target.value)}
                                    disabled={!isVehicleRejected}
                                    className={cellCls + " min-w-[220px] disabled:opacity-60 disabled:cursor-not-allowed"}
                                  >
                                    <option value="">Select Reason</option>
                                    {/* Keep a previously saved reason visible even if it's not in the list */}
                                    {current && !SL_VEHICLE_REJECTED_REASONS.includes(current) && (
                                      <option value={current}>{current}</option>
                                    )}
                                    {SL_VEHICLE_REJECTED_REASONS.map((reason) => (
                                      <option key={reason} value={reason}>
                                        {reason}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                              );
                            }

                            // Overall Feedback — same coloured rating buttons as the Create form
                            if (type === "rating") {
                              return (
                                <td key={col.label} className="px-2 py-1 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    {SL_RATINGS.map((rating) => (
                                      <button
                                        key={rating}
                                        type="button"
                                        onClick={() => slPatchSearchRow(i, field, rating)}
                                        className={cn(
                                          "px-3 h-7 rounded-full text-[11px] font-semibold border transition-colors",
                                          current.toUpperCase() === rating
                                            ? SL_RATING_COLOURS[rating]
                                            : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10",
                                        )}
                                      >
                                        {rating}
                                      </button>
                                    ))}
                                  </div>
                                </td>
                              );
                            }
                            return (
                              <td key={col.label} className="px-2 py-1 whitespace-nowrap">
                                <input
                                  value={String(item[field] ?? "")}
                                  onChange={(e) => slPatchSearchRow(i, field, e.target.value)}
                                  disabled={field === "ZVREJ_REASON" && String(item.ZVEH_REJ ?? "").trim().toUpperCase() !== "YES"}
                                  className={cellCls + " min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"}
                                />
                              </td>
                            );
                          }
                          // View mode — Yes/No answers and ratings shown in a coloured pill (value unchanged)
                          const displayValue = v === undefined || v === null || v === "" ? "-" : String(v);
                          const colour = col.edit ? slSearchValueColour(col.edit.type, displayValue) : "";
                          return (
                            <td key={col.label} className="px-3 py-2 whitespace-nowrap">
                              {colour ? (
                                <span
                                  className={cn(
                                    "inline-flex items-center justify-center min-w-[2.5rem] px-2.5 h-6 rounded-full text-[11px] font-semibold border",
                                    colour,
                                  )}
                                >
                                  {displayValue}
                                </span>
                              ) : (
                                displayValue
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1 text-center">
                          {!item.isEdit ? (
                            <div className="flex items-center gap-1 justify-center">
                              <button onClick={() => slEditSearchRow(i)} className="size-6 grid place-items-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                                <Pencil className="size-3.5" />
                              </button>
                              <button onClick={() => void slDeleteSearchRow(item, i)} className="size-6 grid place-items-center rounded bg-red-50 text-red-600 hover:bg-red-100">
                                <Trash2 className="size-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1">
                              <button onClick={() => void slUpdateSearchRow(item, i)} className="size-6 grid place-items-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                                <Check className="size-3.5" />
                              </button>
                              <button onClick={() => slCancelSearchEdit(i)} className="size-6 grid place-items-center rounded bg-gray-100 text-gray-600 hover:bg-gray-200">
                                <XIcon className="size-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Shipment Feedback */}
          {showFeedback && (
            <div className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden">
              <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
                <h3 className="text-[13px] font-semibold text-sky-600 tracking-tight">
                  Shipment Feedback
                </h3>
              </div>
              <div className="divide-y divide-hairline/60">
                {/* 1. Vehicle Rejected — YES (red) shows a Reason field right below; NO (green) hides it */}
                <div className="px-5 py-3 hover:bg-accent/[0.03]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-grid place-items-center size-6 shrink-0 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                        1
                      </span>
                      <span className="text-[13px] font-medium text-foreground">
                        Vehicle Rejected
                        <span className="text-destructive ml-0.5">*</span>
                      </span>
                    </div>
                    <SLYesNo
                      value={vehicleRejected}
                      reverse
                      onChange={(v) => {
                        setVehicleRejected(v);
                        if (v === "NO") setRejectReason("");
                      }}
                    />
                  </div>
                  {vehicleRejected === "YES" && (
                    <div className="mt-2.5 pl-9 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                        Vehicle Rejected Due To <span className="text-destructive">*</span>
                      </label>
                      <select
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className={SL_INPUT}
                      >
                        <option value="">Select Reason</option>
                        {/* Keep a previously saved reason visible even if it's not in the list */}
                        {rejectReason && !SL_VEHICLE_REJECTED_REASONS.includes(rejectReason) && (
                          <option value={rejectReason}>{rejectReason}</option>
                        )}
                        {SL_VEHICLE_REJECTED_REASONS.map((reason) => (
                          <option key={reason} value={reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                {SL_QUESTIONS.filter(
                  (q) => !q.ftlOnly || truckType === "FULL TRUCK LOAD",
                ).map((q, idx) => (
                  <div
                    key={q.key}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-grid place-items-center size-6 shrink-0 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                        {idx + 2}
                      </span>
                      <span className="text-[13px] font-medium text-foreground">
                        {q.label}
                        {SL_REQUIRED_KEYS.includes(q.key) && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </span>
                    </div>
                    <SLYesNo
                      value={feedback[q.key]}
                      disabled={disabledFields.includes(q.key)}
                      reverse={q.reverse}
                      onChange={(v) => setFeedback((f) => ({ ...f, [q.key]: v }))}
                    />
                  </div>
                ))}

                {/* Overall */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="inline-grid place-items-center size-6 shrink-0 rounded-full bg-violet-100 text-violet-700 text-[12px] font-bold">
                      ★
                    </span>
                    <span className="text-[13px] font-medium text-foreground">
                      Overall Feedback from User
                      <span className="text-destructive ml-0.5">*</span>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {(
                      [
                        // Selected colours mirror the Angular .check.poor/.avg/.good/.excellent rules
                        { r: "POOR", cls: "bg-rose-100 text-rose-700 border-rose-400" },
                        { r: "AVG", cls: "bg-amber-100 text-amber-700 border-amber-400" },
                        { r: "GOOD", cls: "bg-emerald-100 text-emerald-700 border-emerald-400" },
                        { r: "EXCELLENT", cls: "bg-blue-100 text-blue-700 border-blue-400" },
                      ] as const
                    ).map(({ r, cls }) => (
                      <button
                        key={r}
                        type="button"
                        disabled={disabledFields.includes("overall")}
                        onClick={() => setFeedback((f) => ({ ...f, overall: r }))}
                        className={cn(
                          "px-4 h-7 rounded-full text-[11.5px] font-semibold border transition-colors disabled:opacity-60 disabled:cursor-not-allowed",
                          feedback.overall === r
                            ? cls
                            : "bg-muted text-muted-foreground border-hairline hover:bg-accent/10",
                        )}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  {/* Remarks — shown once a rating is chosen; required for POOR / AVG */}
                  {feedback.overall && (
                    <div className="basis-full pl-9 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                        Remarks
                        {["POOR", "AVG"].includes(feedback.overall) && (
                          <span className="text-destructive ml-0.5">*</span>
                        )}
                      </label>
                      <input
                        value={overallRemarks}
                        onChange={(e) => setOverallRemarks(e.target.value)}
                        placeholder={
                          ["POOR", "AVG"].includes(feedback.overall)
                            ? "Enter remarks (required for Poor / Average)"
                            : "Enter remarks (optional)"
                        }
                        maxLength={255}
                        disabled={disabledFields.includes("overall")}
                        className={SL_INPUT + " disabled:opacity-60 disabled:cursor-not-allowed"}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="flex items-center justify-end px-5 py-3 border-t border-hairline">
                <button
                  type="button"
                  onClick={() => void submitFeedback()}
                  className="inline-flex items-center gap-1.5 px-5 h-9 rounded-md bg-emerald-500 hover:bg-emerald-600 text-white text-[12px] font-semibold shadow-sm"
                >
                  Submit
                </button>
              </div>
            </div>
          )}

          {!showFeedback && (
            <p className="text-[12px] text-muted-foreground px-1">
              Select a reference row, choose an Invoice Number and click{" "}
              <span className="font-semibold">GET</span> to load the feedback form.
            </p>
          )}
        </>
      )}

      {/* Completed Invoices Modal */}
      <Dialog open={compInvoicesModalOpen} onOpenChange={setCompInvoicesModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border border-hairline shadow-soft bg-surface">
          <div className="px-5 py-3.5 border-b border-hairline bg-surface-2/60 flex items-center justify-between">
            <div>
              <DialogTitle className="text-[14px] font-bold text-foreground">
                Completed Invoices
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Reference No: <span className="font-semibold text-foreground">{compInvoicesModalData.refNo}</span>
              </p>
            </div>
            <span className="px-2 py-0.5 text-[10.5px] font-bold rounded-full bg-accent/10 text-accent">
              {compInvoicesModalData.invoices.length} {compInvoicesModalData.invoices.length === 1 ? "Invoice" : "Invoices"}
            </span>
          </div>

          <div className="p-4 max-h-80 overflow-y-auto scrollbar-elegant">
            {compInvoicesModalData.invoices.length > 0 ? (
              <div className="border border-hairline rounded-lg overflow-hidden">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="bg-gradient-primary text-primary-foreground text-[11px] font-semibold">
                      <th className="px-3 py-1.5 text-center w-14">#</th>
                      <th className="px-3 py-1.5 text-left">Invoice Number</th>
                      <th className="px-3 py-1.5 text-center w-24">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/60">
                    {compInvoicesModalData.invoices.map((inv, idx) => (
                      <tr key={idx} className="hover:bg-accent/[0.04] transition-colors">
                        <td className="px-3 py-1.5 text-center font-mono text-[11px] text-muted-foreground">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-1.5 font-mono font-medium text-foreground">
                          {inv}
                        </td>
                        <td className="px-3 py-1.5 text-center">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            Completed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground text-[12px]">
                No completed invoices available for this reference.
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-hairline bg-surface-2/40 flex justify-end">
            <button
              type="button"
              onClick={() => setCompInvoicesModalOpen(false)}
              className="px-3.5 py-1.5 text-[12px] font-semibold rounded-md bg-accent text-accent-foreground hover:bg-accent/90 transition-colors shadow-xs"
            >
              Close
            </button>
          </div>
        </DialogContent>
      </Dialog>
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
