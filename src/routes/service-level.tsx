import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  Plus,
  RefreshCw,
  Trash2,
  Save,
  ChevronLeft,
  ChevronRight,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ServiceLevelSapCreate } from "@/components/service-level-sap-create";
// @ts-ignore
import service from "../services/generalservice_service.js";
import Swal from "sweetalert2";

export const Route = createFileRoute("/service-level")({
  component: ServiceLevelPage,
});

function ServiceLevelPage() {
  const [loadType, setLoadType] = useState<"ftl" | "cargo" | null>(null);
  return (
    <ServiceLevelScreenShell
      title="Service Level (Shipment Feedback)"
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
}) {
  const [direction, setDirection] = useState<"outward" | "inward" | null>(null);
  const [sap, setSap] = useState<SapMode | null>(null);

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
                     <SapToggle value={sap} onChange={setSap} />
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
                   Select <span className="font-semibold">With SAP</span> or <span className="font-semibold">Without SAP</span> to continue.
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

/* ────────────────────────────────────────────────────────────────────────────
 * Service Level (Shipment Feedback) — migrated from Angular
 * src/app/pages/dashboards/service-level/service-level.component.{ts,html}
 * ──────────────────────────────────────────────────────────────────────────── */

type SLRow = {
  referenceNumber: string;
  workOrderNumber: string;
  lrNumber: string;
  transporter: string;
  lineNumber: string;
  mapId: string;
};

const slEmptyRow = (): SLRow => ({
  referenceNumber: "",
  workOrderNumber: "",
  lrNumber: "",
  transporter: "",
  lineNumber: "",
  mapId: "",
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
  const [selectedItems, setSelectedItems] = useState<SLRow[]>([]);
  const [invoiceList, setInvoiceList] = useState<string[]>([]);
  const [invoicenumber, setInvoicenumber] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState<Record<SLFeedbackKey, string>>({
    ...SL_EMPTY_FEEDBACK,
  });
  const [disabledFields, setDisabledFields] = useState<SLFeedbackKey[]>([]);
  const [loading, setLoading] = useState(false);

  const loggedInUser = slLoggedInUser();

  const isItemSelected = (row: SLRow): boolean =>
    selectedItems.some((item) => slSameRow(item, row));

  const onCheckboxChange = (checked: boolean, row: SLRow): void => {
    if (checked) {
      setSelectedItems((prev) =>
        prev.some((item) => slSameRow(item, row)) ? prev : [...prev, row],
      );
    } else {
      setSelectedItems((prev) => prev.filter((item) => !slSameRow(item, row)));
    }
  };

  const updateRowField = (index: number, key: keyof SLRow, value: string): void => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: value } : r)),
    );
  };

  const populateRows = (data: any): void => {
    if (Array.isArray(data) && data.length > 0) {
      setRows(
        data.map((d: any) => ({
          referenceNumber: d.REF_NO || "",
          workOrderNumber: d.WORK_ORDER_NO || "",
          lrNumber: d.LR_NO || "",
          transporter: d.TRANSPORTER || "",
          lineNumber: d.LINE_NO || "",
          mapId: d.MAPID || "",
        })),
      );
      const invoices: string[] = [];
      data.forEach((d: any) => {
        if (d.INV_NO && d.INV_NO.length > 0) {
          d.INV_NO.forEach((inv: any) => invoices.push(inv.VBELN));
        }
      });
      if (invoices.length > 0) {
        setInvoiceList((prev) => [...prev, ...invoices]);
      }
    } else {
      Swal.fire({
        icon: "info",
        title: "No Records Found",
        text: "No matching reference details were found.",
        timer: 1500,
        showConfirmButton: false,
        width: "300px",
      });
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

      const obj = {
        INV_DEF: invoicenumber,
        ZREFNO: selected.referenceNumber,
        ZLINE_NO: selected.lineNumber || "",
      };

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

  const refreshScreen = (): void => {
    setInvoicenumber("");
    setInvoiceList([]);
    setShowFeedback(false);
    setSelectedItems([]);
    setFeedback({ ...SL_EMPTY_FEEDBACK });
    setDisabledFields([]);
    setRows([slEmptyRow()]);
    setLoading(false);
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

      ZTOT_SCORE: "",
      ZPALNT: "",
      ZDIVISION: "",
      ZUSER: loggedInUser,
      ZSUBMIT_DT: new Date().toISOString().slice(0, 10),
    }));

    console.log("📦 Payload:", payload);

    setLoading(true);
    try {
      const res: any = isSap
        ? await service.FeedbackCreationwithsap(payload)
        : await service.FeedbackCreationwithoutsap(payload);

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
    onBlur: () => void onFieldBlur(index, fieldKey),
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === "Tab") void onFieldBlur(index, fieldKey);
    },
  });

  return (
    <div className="space-y-2">
      {loading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30">
          <div className="size-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
        </div>
      )}

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
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/60">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-accent/[0.04]">
                      <td className="px-3 py-1 text-center">
                        <input
                          type="checkbox"
                          checked={isItemSelected(row)}
                          onChange={(e) => onCheckboxChange(e.target.checked, row)}
                        />
                      </td>
                      <td className="px-3 py-1 text-center">{i + 1}</td>
                      <td className="px-3 py-1">
                        <input
                          type="text"
                          value={row.referenceNumber}
                          placeholder="Enter Ref. No."
                          maxLength={10}
                          readOnly={i !== 0}
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
                          readOnly={i !== 0}
                          onChange={(e) =>
                            updateRowField(i, "workOrderNumber", e.target.value)
                          }
                          {...blurKeys(i, "WORK_ORDER_NO")}
                          className={SL_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-3 py-1">
                        <input
                          type="text"
                          value={row.lrNumber}
                          placeholder="Enter LR No."
                          readOnly={i !== 0}
                          onChange={(e) => updateRowField(i, "lrNumber", e.target.value)}
                          {...blurKeys(i, "LR_NO")}
                          className={SL_INPUT + " text-center"}
                        />
                      </td>
                      <td className="px-3 py-1">
                        <input
                          type="text"
                          value={row.transporter}
                          placeholder="Enter Transporter"
                          readOnly={i !== 0}
                          onChange={(e) =>
                            updateRowField(i, "transporter", e.target.value)
                          }
                          {...blurKeys(i, "TRANSPORTER")}
                          className={SL_INPUT + " text-center"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Number + GET */}
          <div className="bg-surface border border-hairline rounded-xl p-2 shadow-elegant max-w-md">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-[11px] font-semibold text-muted-foreground mb-0.5">
                  Invoice Number
                </label>
                <select
                  value={invoicenumber}
                  onChange={(e) => setInvoicenumber(e.target.value)}
                  className={SL_INPUT}
                >
                  <option value="">Select Invoice Number</option>
                  {invoiceList.map((inv, idx) => (
                    <option key={`${inv}-${idx}`} value={inv}>
                      {inv}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => void getForm("invoice")}
                disabled={!invoicenumber || invoicenumber.trim() === ""}
                className="h-8 px-4 rounded-md bg-[#8f1e42] hover:bg-[#7a1938] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-bold tracking-wider shadow-sm"
              >
                GET
              </button>
            </div>
          </div>

          {/* Shipment Feedback */}
          {showFeedback && (
            <div className="bg-surface border border-hairline rounded-xl shadow-elegant overflow-hidden">
              <div className="px-5 py-3 border-b border-hairline bg-surface-2/60">
                <h3 className="text-[13px] font-semibold text-sky-600 tracking-tight">
                  Shipment Feedback
                </h3>
              </div>
              <div className="divide-y divide-hairline/60">
                {SL_QUESTIONS.filter(
                  (q) => !q.ftlOnly || truckType === "FULL TRUCK LOAD",
                ).map((q, idx) => (
                  <div
                    key={q.key}
                    className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-accent/[0.03]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="inline-grid place-items-center size-6 shrink-0 rounded-full bg-sky-100 text-sky-700 text-[11px] font-bold">
                        {idx + 1}
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
                <div className="flex items-center justify-between gap-3 px-5 py-3">
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
