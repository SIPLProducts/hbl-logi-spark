import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
// @ts-ignore
import service from "../services/generalservice_service.js";
import {
  Filter,
  Play,
  RotateCcw,
  Download,
  Search,
  Loader2,
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

export const Route = createFileRoute("/dispatch-orders")({
  component: DispatchOrdersPage,
});

type Status = "idle" | "loading" | "ready" | "empty";
type SortDir = "asc" | "desc";
type SortKey = keyof DispatchOrderRow;

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

  // Pending/Completed counts from API
  const [counts, setCounts] = useState({ pending: 0, completed: 0 });

  // Fetch pending/completed counts on page load
  useEffect(() => {
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
    fetchCounts();
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
    };

    try {
      setStatus("loading");
      setRows([]);
      setPage(1);

      const response = await service.FetchDispatchOrderFlowData(payload);
      const raw = response?.data || response || [];

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
    }
  };

  const onClear = () => {
    setFromDate("");
    setToDate("");
    setSearch("");
    setRows([]);
    setStatus("idle");
    setError(null);
    setPage(1);
  };

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
      <div className="sticky top-0 z-10 bg-surface border-b border-hairline px-6 py-5">
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
        <section className="bg-surface border border-hairline rounded-lg shadow-xs overflow-hidden">
          <header className="px-4 py-2.5 border-b border-hairline bg-muted/50 flex items-center gap-2">
            <Filter className="size-3.5 text-accent" />
            <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground">
              Dispatch Order Filter
            </h2>
          </header>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  From Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  required
                  className="h-9 bg-surface border border-hairline rounded-md px-2.5 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  To Date <span className="text-destructive">*</span>
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  required
                  className="h-9 bg-surface border border-hairline rounded-md px-2.5 text-[12.5px] outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </div>

              {/* Counts from API */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-warning/15 text-warning-foreground border border-warning/30 text-[12px] font-medium">
                  <span className="size-1.5 rounded-full bg-warning" />
                  Pending:{" "}
                  <span className="font-mono font-bold">{counts.pending}</span>
                </span>
                <span className="inline-flex items-center gap-2 h-9 px-3 rounded-full bg-success/15 text-success border border-success/30 text-[12px] font-medium">
                  <span className="size-1.5 rounded-full bg-success" />
                  Completed:{" "}
                  <span className="font-mono font-bold">
                    {counts.completed}
                  </span>
                </span>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2 flex-wrap">
              <button
                onClick={onClear}
                className="inline-flex items-center gap-1.5 px-3 h-9 text-[12.5px] font-semibold text-foreground border border-hairline rounded-md bg-surface hover:bg-muted cursor-pointer"
              >
                <RotateCcw className="size-3.5" /> Clear Filters
              </button>
              <button
                onClick={onExecute}
                className="inline-flex items-center gap-1.5 px-4 h-9 text-[12.5px] font-semibold text-primary-foreground bg-primary rounded-md hover:bg-primary/90 shadow-sm cursor-pointer"
              >
                <Play className="size-3.5" /> Execute Report
              </button>
            </div>

            {error && (
              <div className="mt-3 text-[12px] text-destructive font-medium">
                {error}
              </div>
            )}
          </div>
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
                <Loader2 className="size-6 animate-spin text-accent mb-2" />
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
                  <thead className="sticky top-0 z-10">
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