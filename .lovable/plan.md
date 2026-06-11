## Goal

Make the **Search & Reports** tab in all 10 LE screens (Order Info → Insurance Claim Tracking) use the exact same premium filter layout as the Dispatch screen's "Filter Options" card — and add a new **Status** dropdown field.

## Scope

Single file: `src/components/le-screen-shell.tsx` (the shared shell rendered by every LE route). No route file changes, no data model changes.

## New filter layout (replaces current Search & Reports filter card)

A single card titled **Filter Options** (with a funnel icon in the header) and a `SapToggle` on the right of the header. Body shows a 3-column grid of fields, followed by an action bar.

Fields (7 total — adds Status as 7th):

1. **From Date** — date picker (calendar popover, same `DateField` as Dispatch)
2. **To Date** — date picker
3. **Plant** — Select (options from `PLANTS`)
4. **Division** — Select (options from `DIVISIONS`)
5. **Transporter** — Select (options from `TRANSPORTERS`)
6. **Vehicle Type** — Select (options from `VEHICLE_TYPES`)
7. **Status** — Select (`All`, `Pending`, `Completed`) — **new**

Action bar (right-aligned, on a muted strip below the grid):
- `Reset` (ghost)
- `Download PDF` (outline, FileText icon)
- `Download Excel` (outline, green FileDown icon)
- `Apply Filter` (primary, Filter icon)

Empty state (before Apply Filter is clicked): dashed-border card with funnel icon, heading "No results yet", and helper text — same pattern as Dispatch.

## Implementation notes

- Reuse the **`DateField`** and **`SelectField`** components from `src/routes/dispatch.tsx` by extracting them into the shell file (or duplicating locally — small components).
- Import `PLANTS, DIVISIONS, TRANSPORTERS, VEHICLE_TYPES` from `@/lib/dispatch-mock`.
- Keep the existing `SapToggle` (already in shell). Card body and action bar render only when `sap` is set.
- Add `STATUS_OPTIONS = ["Pending", "Completed"]` constant.
- Remove the old custom filter block (From/To/Search By/Value grid + status chips + Reset/Search row) in the Search tab — replace with the new card.
- Keep the existing **results table** below (rendered after Apply Filter), wired to the same `rows`/`columns` props.
- Create-tab layout is untouched.

## Result

All 10 LE screens (Order Info, Shipment Details, Invoice & Load Details, Segment Info, Vehicle Info, Transit Info, Freight Billing, Service Level, Transit Damage Info, Insurance Claim Tracking) automatically get the new Dispatch-style filter + Status field on their Search & Reports tab.
