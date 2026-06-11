## Redesign: Dispatch Screen

Rebuild `src/routes/dispatch.tsx` as a self-contained modern enterprise page with two modes — **Create Dispatch** and **Search / Filter** — switchable via a segmented tab control at the top. All existing fields, columns, and actions are preserved; only the presentation changes.

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Breadcrumb: Logistics Execution / Dispatch                  │
│ Page Header: "Dispatch"  + subtitle  ·  [Refresh][Export][+]│
├─────────────────────────────────────────────────────────────┤
│ KPI row (4 tiles): Total Dispatches · Pending · In Transit ·│
│                    Completed Today                           │
├─────────────────────────────────────────────────────────────┤
│ Tabs:  [ Create Dispatch ]  [ Search & Reports ]            │
├─────────────────────────────────────────────────────────────┤
│  …mode content (card)…                                      │
└─────────────────────────────────────────────────────────────┘
```

### Mode 1 — Create Dispatch (card)

- Top toolbar inside card:
  - Outward radio (kept)
  - With SAP / Without SAP segmented toggle
  - Search Type dropdown + Search input + Search icon button
- Editable dispatch table (sticky header, horizontal scroll, column resizing via inline-grid widths):
  - Sl.No · Vehicle Type · Work Order · No Of Trucks · No Of Invoices · Vendor Code · Transporter · Plant · Division · No Of LRs · LR Number · Loading Points · Unloading Points · Remarks · row Delete
- "+ Add Row" link above the table.
- Sticky footer action bar: `Save` (secondary) · `Save & Next` (primary).

### Mode 2 — Search & Reports (card)

- With SAP / Without SAP segmented toggle.
- Filter Options card grid (responsive 1/2/3 cols):
  - From Date, To Date (modern date pickers)
  - Plant, Division, Transporter, Vehicle Type (searchable selects)
- Action row: `Apply Filter` (primary) · `Download Excel` · `Download PDF`.
- Results table (rendered after Apply Filter; uses mocked sample rows for now):
  - Search box, column sort indicators, sticky header, pagination (Prev / page x of n / Next), row count.
  - Columns: Invoice No · Invoice Date · Billing Transaction Type · Material · Description · Plant · Plant Name · Division · Division Text · Basic Shipment Value · Invoice Value With GST · Incoterms.

### Files Changed

1. **`src/routes/dispatch.tsx`** — replace `LeScreenShell` usage with a new bespoke page composed of:
   - `PageHeader` (existing) + breadcrumb (Shadcn `Breadcrumb`).
   - `KpiTile` row (existing component).
   - Shadcn `Tabs` for mode switch.
   - Shadcn `Card`, `Input`, `Select`, `Button`, `Table`, `Calendar`/`Popover` for date picker, `Badge`.
   - Local `useState` for tab, mode toggles, filter form values, applied-filter results, table pagination & sort.
2. **`src/lib/dispatch-mock.ts`** (new) — sample rows for the create grid and for the filter results table (12 columns), plus dropdown option lists (plants, divisions, transporters, vehicle types).

No other routes, sidebar, top bar, or shared shell components are touched. Business workflows (mode toggle, search, add/delete rows, save, filter, export buttons) are wired with local state and stubbed handlers matching today's behaviour.

### Design tokens

- Headings: Space Grotesk · Body: DM Sans (load via `<link>` in `__root.tsx` head if not already present; otherwise add `@import` to `src/styles.css`).
- Professional blue enterprise theme — reuse existing `--primary`, `--accent`, `--surface`, `--hairline` tokens (already blue-leaning); add a `--primary-soft` background tint for hovered rows and active chips. Rounded `rounded-lg`, soft `shadow-xs` / `shadow-sm`, generous padding, hairline borders.
- Fully responsive: KPI row 2→4 cols, filter grid 1→2→3 cols, tables horizontally scroll with sticky first/last columns where appropriate.

### Out of scope

- No backend/API wiring (filters operate on mock rows).
- No changes to other screens, sidebar, or top bar.
- Hydration mismatch from the synced-time label is incidentally removed because the new page doesn't render a client-only time string in SSR markup.
