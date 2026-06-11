## Goal

Replace the current `/dispatch-orders` page with a filter-driven report screen that matches the reference screenshot and stays consistent with the Navy Trust design system already used across the app.

## Layout (matches reference image)

```
┌─ Page header: "Dispatch Orders" (screen 01) ───────────────────┐
│                                                                │
│ ┌─ Card: Dispatch Order Filter ───────────────────────────────┐│
│ │ [From Date]  [To Date]   [Pending: 32]  [Completed: 0]      ││
│ │                                  [Clear Filters][Execute ▶] ││
│ └─────────────────────────────────────────────────────────────┘│
│                                                                │
│ ┌─ Card: Dispatch Orders List ────────────────────────────────┐│
│ │ Show [10▾]    Export Excel        Search:[______]           ││
│ │ ┌────────── sticky header, horizontal scroll ─────────────┐ ││
│ │ │ Invoice No │ Inv Date │ Bill Tx Type │ Material │ ...   │ ││
│ │ └─────────────────────────────────────────────────────────┘ ││
│ │ Empty: "Fill filters and click execute to see results."     ││
│ │ Loading: spinner                                            ││
│ │ Pagination:  Showing X–Y of Z       [‹ 1 2 3 ›]             ││
│ └─────────────────────────────────────────────────────────────┘│
└────────────────────────────────────────────────────────────────┘
```

## Columns (in order)

Invoice No · Invoice Date · Billing Transaction Type · Material · Description · Plant · Plant Name · Division · Division Text · Basic Shipment Value · Invoice Value With GST · Incoterms

Values are right-aligned and number-formatted for the two amount columns; dates render as `dd-MM-yyyy`.

## Behavior

- **State**: `fromDate`, `toDate`, `status: 'idle' | 'loading' | 'ready' | 'empty'`, `rows`, `search`, `sortKey`, `sortDir`, `page`, `pageSize`.
- **Execute Report**: requires both dates; otherwise toast "Please select From and To date". Sets `loading`, simulates a fetch (300–600 ms), then populates rows from a local mock generator filtered by date range. (No real backend per "UI only" decision.)
- **Clear Filters**: resets dates, search, rows back to `idle`.
- **Search**: case-insensitive substring across all string columns.
- **Sort**: click header to toggle asc/desc; numeric vs string aware.
- **Pagination**: page size selector 10 / 25 / 50 / 100, prev/next + numbered pages.
- **Export Excel**: client-side CSV-as-`.xls` download (`application/vnd.ms-excel`) of the currently filtered (search-applied) rows — no new dependency.
- **Pending / Completed chips** in the filter bar are derived counts (pending = rows with no `Incoterms` populated for the date range / completed = rest) and shown as compact pill badges like the screenshot.
- **Empty state**: when `status==='idle'` show "Fill filters and click execute to see results."; when `status==='empty'` show "No Records Found".
- **Loading state**: centered `Loader2` spinner with text "Loading dispatch orders…".

## Responsiveness

- Filter row uses `grid-cols-1 md:grid-cols-2 lg:grid-cols-4` with action buttons wrapping to a new right-aligned row on small screens.
- Table wrapper has `overflow-x-auto` and sticky `<thead>` (`sticky top-0 z-10 bg-surface-2`).
- Status chips stack under the date inputs on mobile.

## Files

- **Edit** `src/routes/dispatch-orders.tsx` — full rewrite as the new screen (no longer uses `LeScreenShell`'s built-in worklist; uses `PageHeader` + two cards + a local results table). Keeps `head()` meta.
- **Add** `src/components/dispatch-orders/filter-card.tsx` — filter card UI.
- **Add** `src/components/dispatch-orders/results-table.tsx` — table with search/sort/paging/export/empty/loading.
- **Add** `src/lib/dispatch-orders-mock.ts` — typed `DispatchOrderRow` + 80-row mock generator with realistic Indian plant / material values; pure function (no Date.now/Math.random at module scope to avoid SSR hydration drift — uses a seeded PRNG so server and client render identical rows).
- **Add** `src/lib/export-xls.ts` — tiny helper that turns `rows + columns` into a downloadable `.xls` blob.

Reuses existing tokens (`bg-surface`, `border-hairline`, `text-muted-foreground`, primary/accent), `Button`, `Input`, lucide icons (`Filter`, `Play`, `RotateCcw`, `Download`, `Search`, `Loader2`, `ChevronLeft`, `ChevronRight`, `ChevronsUpDown`). No new npm packages.

## Out of scope

- Real Node.js / SAP wiring (UI-only project per earlier decision).
- Changes to sidebar / top bar / other 12 screens.
- Fixing the unrelated Segment Info SSR time-mismatch warning.
