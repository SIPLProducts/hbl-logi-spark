import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect, useRef } from "react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import {
  Filter,
  Play,
  RotateCcw,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Inbox,
  // ListFilter,
} from "lucide-react";
import { exportRowsToXls } from "@/lib/export-xls";
import type { DispatchOrderRow } from "@/lib/dispatch-orders-mock";
import Swal from "sweetalert2";
import { GateDatePicker } from "@/components/ui/date-picker";

export const Route = createFileRoute("/dispatch-orders")({
  component: DispatchOrdersPage,
});

type Status = "idle" | "loading" | "ready" | "empty";
type SortDir = "asc" | "desc";
type SortKey = keyof DispatchOrderRow;

type PlantData = {
  PLANT: string;
  PLANT_DESC: string;
  DIVISION: string;
  PLANT_TEXT: string;
  DIV_TEXT: string;
};

type ColDef = {
  key: SortKey;
  header: string;
  align?: "left" | "right";
  numeric?: boolean;
  render?: (r: DispatchOrderRow) => React.ReactNode;
};

function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

const INR = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const COLUMNS: ColDef[] = [
  {
    key: "invoiceNo",
    header: "Invoice No",
    render: (r) => <span className="font-mono">{r.invoiceNo}</span>,
  },
  {
    key: "invoiceDate",
    header: "Invoice Date",
    render: (r) => (
      <span className="font-mono">{formatDate(r.invoiceDate)}</span>
    ),
  },
  { key: "billingTransactionType", header: "Billing Transaction Type" },
  {
    key: "material",
    header: "Material",
    render: (r) => <span className="font-mono">{r.material}</span>,
  },
  { key: "description", header: "Description" },
  {
    key: "plant",
    header: "Plant",
    render: (r) => <span className="font-mono">{r.plant}</span>,
  },
  { key: "plantName", header: "Plant Name" },
  {
    key: "division",
    header: "Division",
    render: (r) => <span className="font-mono">{r.division}</span>,
  },
  { key: "divisionText", header: "Division Text" },
  {
    key: "basicShipmentValue",
    header: "Basic Shipment Value",
    align: "right",
    numeric: true,
    render: (r) => (
      <span className="font-mono">{INR.format(r.basicShipmentValue)}</span>
    ),
  },
  {
    key: "invoiceValueWithGst",
    header: "Invoice Value With GST",
    align: "right",
    numeric: true,
    render: (r) => (
      <span className="font-mono">{INR.format(r.invoiceValueWithGst)}</span>
    ),
  },
  { key: "incoterms", header: "Incoterms" },
];

function DispatchOrdersPage() {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [rows, setRows] = useState<DispatchOrderRow[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("invoiceDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [error, setError] = useState<string | null>(null);
  // Multi-select (search + tick several) — same behaviour as the Reports screens' Plant
  // field. A single selection behaves exactly as the old single-select did (see payload
  // build below); this only adds the ability to tick more than one.
  const [plant, setPlant] = useState<string[]>([]);
  const [division, setDivision] = useState("");
  const [fetchedPlants, setFetchedPlants] = useState<string[]>([]);
  const [fetchedDivisions, setFetchedDivisions] = useState<string[]>([]);

  // Pending/Completed counts from API
  const [counts, setCounts] = useState<{ pending: number | string; completed: number | string }>({
    pending: 0,
    completed: 0,
  });

  const fetchCounts = async () => {
    try {
      const response = await service.FetchDispatchOrderPendingCounts();
      setCounts({
        pending: response?.PENDING ?? 0,
        completed: response?.COMPLETED ?? 0,
      });
    } catch (err) {
      console.error("Failed to fetch counts:", err);
    }
  };

  // Fetch pending/completed counts on page load
  useEffect(() => {
    void fetchCounts();
  }, []);

  const onExecute = async () => {
    setError(null);

    if (!fromDate || !toDate) {
      setError("Please select both From Date and To Date.");
      return;
    }

    if (fromDate > toDate) {
      setError("From Date must be on or before To Date.");
      return;
    }

    const payload = {
      from_date: fromDate,
      to_date: toDate,
      // Options are stored as "<code>_<description>" (see fetchedPlants below); the API
      // wants only the plant code, as [{ plant: "1300" }, ...] — one entry per selection.
      plants: plant.map((p) => ({ plant: p.split("_")[0].trim() })),
      spart: division || " ", // division
    };

    try {
      setStatus("loading");
      setRows([]);
      setPage(1);

      const response = await service.FetchDispatchOrderFlowData(payload);

      if (response && response.MESSAGE) {
        Swal.fire({
          icon: "info",
          title: "No Data",
          text: response.MESSAGE,
        });
        setStatus("empty");
        if (response.PENDING !== undefined || response.COMPLETED !== undefined) {
          setCounts({
            pending: response.PENDING ?? 0,
            completed: response.COMPLETED ?? 0,
          });
        } else {
          void fetchCounts();
        }
        return;
      }

      if (!response) {
        void fetchCounts();
        setStatus("empty");
        return;
      }

      // Update Pending and Completed counts from the response
      if (response.PENDING !== undefined || response.COMPLETED !== undefined) {
        setCounts({
          pending: response.PENDING ?? 0,
          completed: response.COMPLETED ?? 0,
        });
      }

      const raw = Array.isArray(response?.LIST)
        ? response.LIST
        : Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

      // Map API UPPERCASE keys to camelCase DispatchOrderRow shape
      const data: DispatchOrderRow[] = raw.map((item: any, index: number) => ({
        id: String(index),
        invoiceNo: item.INVOICE_NUMBER,
        invoiceDate: item.INVOICE_DATE,
        billingTransactionType: item.BILLING_TRANSACTION_TYPE,
        material: item.MATERIAL,
        description: item.DESCRIPTION,
        plant: item.PLANT,
        plantName: item.PLANT_NAME,
        division: item.DIVISION,
        divisionText: item.DIVISION_TEXT,
        basicShipmentValue: item.BASIC_SHIPMENT_VALUE,
        invoiceValueWithGst: item.INVOICE_VALUE_WITH_GST,
        incoterms: item.INCOTERMS,
      }));

      setRows(data);
      setStatus(data.length === 0 ? "empty" : "ready");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch data.");
      setStatus("empty");
      void fetchCounts();
    }
  };

  const onClear = () => {
    setFromDate("");
    setToDate("");
    setPlant([]);
    setDivision("");
    setSearch("");
    setRows([]);
    setStatus("idle");
    setError(null);
    setPage(1);
    void fetchCounts();
  };

  useEffect(() => {
    const loadF4 = async () => {
      try {
        const res: any = await service.fetchVendorCode();
        const data = Array.isArray(res) ? res[0] ?? {} : res ?? {};

        // F4 returns one row per plant + division, so the same plant can repeat (leading
        // zeros / spacing can differ between rows too, e.g. "1101" vs "01101") — dedupe on
        // the normalized plant code BEFORE building the dropdown's display strings, so a
        // plant like 1101 is kept only once regardless of which of its rows came first.
        const seenPlantCodes = new Set<string>();
        const dedupedPlantRecords: PlantData[] = Array.isArray(data.PLANT)
          ? data.PLANT.filter((p: PlantData) => {
            const code = String(p.PLANT ?? "").trim().replace(/^0+(?=\d)/, "");
            if (!code || seenPlantCodes.has(code)) return false;
            seenPlantCodes.add(code);
            return true;
          })
          : [];

        const plants: string[] = dedupedPlantRecords.map((p: PlantData) => {
          const desc = String(p.PLANT_DESC || "").split("_")[0].trim();
          return `${p.PLANT}_${desc}`;
        });

        const divisions: string[] = Array.isArray(data.PLANT)
          ? Array.from(
            new Set(data.PLANT.map((p: PlantData) => String(p.DIVISION || "")).filter(Boolean))
          )
          : [];

        setFetchedPlants(plants);
        setFetchedDivisions(divisions);
      } catch (err) {
        console.error("F4 fetch failed:", err);
      }
    };
    void loadF4();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      COLUMNS.some((c) => String(r[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const col = COLUMNS.find((c) => c.key === sortKey);
    const numeric = col?.numeric ?? false;
    const out = [...filtered].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      let cmp = 0;
      if (numeric) cmp = Number(av) - Number(bv);
      else cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  // const toggleSort = (key: SortKey) => {
  //   if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  //   else {
  //     setSortKey(key);
  //     setSortDir("asc");
  //   }
  // };

  const onExport = () => {
    if (sorted.length === 0) return;
    exportRowsToXls(
      `dispatch-orders-${fromDate}_to_${toDate}.xls`,
      COLUMNS.map((c) => ({
        header: c.header,
        value: (r: DispatchOrderRow) =>
          c.key === "invoiceDate"
            ? formatDate(r.invoiceDate)
            : (r[c.key] as string | number),
      })),
      sorted
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="sticky top-0 z-50 bg-surface border-b border-hairline px-6 py-5">
        <h1 className="font-display text-2xl font-semibold text-foreground tracking-tight">
          Dispatch Orders
        </h1>
        <p className="mt-1 text-[12.5px] text-muted-foreground max-w-2xl">
          Filter dispatch invoices by date range and execute the SAP report to
          review shipment values, plants, and incoterms.
        </p>
      </div>

      <div className="p-6 space-y-5 flex-1">
        {/* Filter Card */}
        {/* Filter Card */}
        <section className="bg-surface border border-hairline rounded-lg shadow-xs">
          {/* rounded-t-lg here (section no longer clips via overflow-hidden) so the Plant
              dropdown below can open over the Status row instead of being cut off */}
          <header className="px-4 py-2.5 border-b border-hairline bg-muted/50 rounded-t-lg flex items-center gap-2">
            <Filter className="size-3.5 text-accent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
              Dispatch Order Filter
            </h2>
          </header>

          <div className="p-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1 w-[190px]">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  From Date <span className="text-destructive">*</span>
                </label>
                <GateDatePicker
                  value={fromDate}
                  onChange={(_, str) => setFromDate(str)}
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1 w-[190px]">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  To Date <span className="text-destructive">*</span>
                </label>
                <GateDatePicker
                  value={toDate}
                  onChange={(_, str) => setToDate(str)}
                  className="h-9"
                />
              </div>

              <div className="flex flex-col gap-1 w-[190px]">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Plant
                </label>
                <MultiSelectField
                  options={fetchedPlants.map((p) => ({ label: p, value: p }))}
                  value={plant}
                  onChange={setPlant}
                  placeholder="Select plant…"
                  searchable
                />
              </div>

              {/* <div className="flex flex-col gap-1 w-[190px]">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Division
                </label>
                <select
                  value={division}
                  onChange={(e) => setDivision(e.target.value)}
                  className="h-9 bg-surface border border-hairline rounded-md px-2.5 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select division…</option>
                  {fetchedDivisions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div> */}
            </div>

            {error && (
              <div className="mt-3 text-[12px] text-destructive font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Status row — left: status pills, right: Execute/Reset */}
          <div className="px-4 py-3 border-t border-hairline rounded-b-lg flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Status
              </span>
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 text-[12px] font-medium">
                <span className="size-1.5 rounded-full bg-warning" />
                Pending: <span className="font-mono font-bold">{counts.pending}</span>
              </span>
              <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-success/15 text-success border border-success/30 text-[12px] font-medium">
                <span className="size-1.5 rounded-full bg-success" />
                Completed: <span className="font-mono font-bold">{counts.completed}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onExecute}
                className="inline-flex items-center gap-1.5 px-4 h-9 text-[12.5px] font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 shadow-sm cursor-pointer"
              >
                <Play className="size-3.5" /> Execute
              </button>
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 px-3 h-9 text-[12.5px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Reset
              </button>
            </div>
          </div>

          {/* Status / counts row — separated by a divider, like the screenshot */}
          {/* <div className="px-4 py-3 border-t border-hairline flex items-center gap-3 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Status
            </span>
            <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 text-[12px] font-medium">
              <span className="size-1.5 rounded-full bg-warning" />
              Pending: <span className="font-mono font-bold">{counts.pending}</span>
            </span>
            <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-success/15 text-success border border-success/30 text-[12px] font-medium">
              <span className="size-1.5 rounded-full bg-success" />
              Completed: <span className="font-mono font-bold">{counts.completed}</span>
            </span>
          </div> */}
        </section>

        {/* Results Card */}
        <section className="bg-surface border border-hairline rounded-lg shadow-xs overflow-hidden">
          <header className="px-4 py-2.5 border-b border-hairline bg-muted/50 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {/* <ListFilter className="size-3.5 text-accent" /> */}
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
                Dispatch Orders List
              </h2>
              {status === "ready" && (
                <span className="text-[11px] font-mono text-muted-foreground">
                  · {sorted.length} record{sorted.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                Show
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-7 bg-surface border border-hairline rounded-md px-1.5 text-[12px]"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>

              <button
                onClick={onExport}
                disabled={status !== "ready"}
                className="inline-flex items-center gap-1.5 px-3 h-7 text-[11.5px] font-semibold border border-hairline rounded-md bg-surface hover:bg-muted text-foreground disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Download className="size-3.5" /> Export Excel
              </button>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search..."
                  className="h-7 w-56 bg-surface border border-hairline rounded-md pl-8 pr-3 text-[12px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </header>

          <div className="relative">
            {status === "loading" && (
              <div className="py-20 grid place-items-center text-muted-foreground">
                <div className="text-[12.5px]">Loading dispatch orders…</div>
              </div>
            )}

            {status === "idle" && (
              <div className="py-20 grid place-items-center text-muted-foreground">
                <Inbox className="size-7 mb-2 opacity-60" />
                <div className="text-[12.5px]">
                  Fill filters and click execute to see results.
                </div>
              </div>
            )}

            {status === "empty" && (
              <div className="py-20 grid place-items-center text-muted-foreground">
                <Inbox className="size-7 mb-2 opacity-60" />
                <div className="text-[12.5px] font-semibold text-foreground">
                  No Records Found
                </div>
                <div className="text-[11.5px] mt-1">
                  Try widening your date range.
                </div>
              </div>
            )}

            {status === "ready" && (
              <div className="max-h-[560px] overflow-auto">
                <table className="w-full text-left border-collapse text-[12.5px]">
                  <thead className="sticky top-0 z-30">
                    <tr className="bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground border-b border-hairline">
                      {COLUMNS.map((c) => {
                        const active = sortKey === c.key;
                        const Icon = active
                          ? sortDir === "asc"
                            ? ChevronUp
                            : ChevronDown
                          : ChevronsUpDown;
                        return (
                          <th
                            key={c.key}
                            className={
                              "px-3 py-2.5 whitespace-nowrap " +
                              (c.align === "right" ? "text-right" : "")
                            }
                          // onClick={() => toggleSort(c.key)}
                          >
                            <span
                              className={
                                "inline-flex items-center gap-1 " +
                                (c.align === "right" ? "justify-end w-full" : "")
                              }
                            >
                              {c.header}
                            </span>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/70">
                    {paged.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={
                          idx % 2 === 0
                            ? "bg-surface hover:bg-muted/50"
                            : "bg-surface-2/40 hover:bg-muted/50"
                        }
                      >
                        {COLUMNS.map((c) => (
                          <td
                            key={c.key}
                            className={
                              "px-3 py-2 whitespace-nowrap " +
                              (c.align === "right" ? "text-right" : "")
                            }
                          >
                            {c.render
                              ? c.render(r)
                              : (r[c.key] as React.ReactNode)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {status === "ready" && sorted.length > 0 && (
            <footer className="border-t border-hairline bg-muted/40 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11.5px] text-muted-foreground">
                Showing{" "}
                <span className="font-mono font-semibold text-foreground">
                  {start + 1}
                </span>
                –
                <span className="font-mono font-semibold text-foreground">
                  {Math.min(start + pageSize, sorted.length)}
                </span>{" "}
                of{" "}
                <span className="font-mono font-semibold text-foreground">
                  {sorted.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="size-7 grid place-items-center rounded-md border border-hairline bg-surface text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                {buildPageList(safePage, totalPages).map((p, i) =>
                  p === "…" ? (
                    <span
                      key={i}
                      className="px-1.5 text-[11.5px] text-muted-foreground"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={i}
                      onClick={() => setPage(p)}
                      className={
                        "min-w-[28px] h-7 px-2 rounded-md text-[12px] font-mono border transition-colors " +
                        (p === safePage
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-surface border-hairline text-muted-foreground hover:text-foreground hover:bg-muted")
                      }
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="size-7 grid place-items-center rounded-md border border-hairline bg-surface text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Next page"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </footer>
          )}
        </section>
      </div>
    </div>
  );
}

// Search + multi-select dropdown for the Plant filter — same design as the Reports
// screens' MultiSelectField (e.g. reports.freight-bills.tsx): tick one or many, an
// optional search box, and a "N Selected" summary label.
type MultiSelectOption = { label: string; value: string };

function MultiSelectField({
  options,
  value,
  onChange,
  placeholder = "Select",
  searchable = false,
}: {
  options: MultiSelectOption[];
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  searchable?: boolean;
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
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={
          // Same box as GateDatePicker (border-input, bg-white/dark:surface, text-[12px],
          // rounded-md, focus ring) so From Date / To Date / Plant line up visually.
          "h-9 w-full bg-white dark:bg-surface border border-input rounded-md px-2.5 text-[12px] outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 flex items-center justify-between gap-2 text-left " +
          (value.length === 0 ? "text-muted-foreground" : "text-foreground")
        }
      >
        <span className="truncate">{displayLabel() || placeholder}</span>
        <ChevronDown
          className={"size-3.5 shrink-0 transition-transform" + (open ? " rotate-180" : "")}
        />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 min-w-full w-max max-w-[420px] rounded-md border border-hairline bg-surface shadow-elegant max-h-60 overflow-y-auto">
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
                <span className="whitespace-normal break-words">{o.label}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function buildPageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("…");
  pages.push(total);
  return pages;
}