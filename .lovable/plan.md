Restyle only the JSX/classes inside `InvoiceFilterDownload` in `src/routes/invoice-load-details.tsx` so its Filter & Download tab visually matches the Order Info version. All state, handlers, service calls, payloads, and export logic stay exactly as-is.

## Scope
File: `src/routes/invoice-load-details.tsx` — lines ~1689–1788 (JSX return of `InvoiceFilterDownload` + the `FilterResultsTable` helper it uses).

No changes to:
- `applyFilter`, `downloadExcel`, `downloadPDF`, `reset`
- State variables, service imports, payload shapes
- The outer `LeScreenShell` wrapper that already renders the SAP toggle above this component
- Any other component or the Create tab

## UI changes to mirror Order Info

1. Filter Options card
   - Keep the header (`Filter Options` title + Filter icon) unchanged since the SAP toggle already lives in the parent `LeScreenShell` header for this screen.
   - Change the field grid to Order Info's tighter spacing: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1` (was `gap-4`) and add `animate-in fade-in slide-in-from-top-1 duration-200`.
   - Keep the existing fields in the same order (From Date, To Date, Plant, Division, Transporter, Vehicle Type, Status) — no logic change.
   - Actions row stays: Reset (ghost), Download PDF, Download Excel, Apply Filter. Same classes as Order Info (already almost identical).

2. Empty state (`!applied`)
   - Already matches Order Info; keep as-is aside from any minor class alignment.

3. Results tables
   - Replace the shared `FilterResultsTable` render with inline tables that mirror Order Info's completed/pending blocks:
     - Wrapper: `bg-surface border border-hairline rounded shadow-elegant overflow-hidden`.
     - Header strip with status-specific title and row count:
       - Completed: `Invoice Load Details — Completed`
       - Pending: `Dispatch Results — Pending`
     - Scroll container: `overflow-x-auto max-h-[560px]` (drop the `min-w-[1600px]` in favor of Order Info's natural width).
     - Table head: sticky, `bg-gradient-primary text-[10px] font-bold uppercase tracking-[0.12em] text-primary-foreground`, cells `px-3 py-2.5 whitespace-nowrap text-left`.
     - Table body: `divide-y divide-hairline/70`, alternating `bg-surface` / `bg-surface-2/40` with `hover:bg-muted/50`; cells `px-3 py-2 whitespace-nowrap` (font-mono on ref/invoice/vendor/LR columns, `tabular-nums` on numeric columns) — same treatment Order Info uses.
   - Column sets stay the invoice-specific ones already defined (Completed: Map ID → Vehicle Type; Pending: Reference No → Unloading Point). Only the presentation wrapper changes.
   - `FilterResultsTable` helper becomes unused after this and can be removed (its only caller is this component).

## Verification
- Typecheck passes (`tsgo` runs automatically).
- Visual check on `/invoice-load-details` → Filter & Download tab, both With SAP and Without SAP, empty and populated states.
