## Goal
Replace the current 3-filter placeholder strip in every Reports screen with the full 16-field filter grid from the reference image. Because all 8 report sub-screens share `src/components/report-placeholder.tsx`, this is a single-file change.

## Filter fields (4 columns × 4 rows)

| Row | Field 1 | Field 2 | Field 3 | Field 4 |
|---|---|---|---|---|
| 1 | Inward/Outward (select) | Sap/Nonsap (select) | From Date (`dd-mm-yyyy`) | To Date (`dd-mm-yyyy`) |
| 2 | Transporter Group (select) | Transporter (select) | Plant (select) | Product (select) |
| 3 | Division (select) | Customer Name (select) | Branch (select) | Branch Zone (select) |
| 4 | Destination Location (select) | Destination State (select) | Destination Zone (select) | Incoterms (select) |

## Changes

### `src/components/report-placeholder.tsx`
- Remove the current 3-filter row (Date Range / Plant / Division) and the right-column Export button slot.
- Render a 4-column responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-3.5`) inside the filters card with all 16 fields above. Use the existing `border border-input bg-background h-9 rounded-md text-[12.5px]` styling already used elsewhere in the app.
- Field types:
  - 14 dropdowns rendered as `<select>` with one disabled placeholder option (the field label). Down-chevron arrow matches existing selects.
  - From Date and To Date as `<input type="text" placeholder="dd-mm-yyyy">` with a trailing calendar icon. Plain text inputs keep the look matching the reference; no date-picker wiring (still visual-only).
- Move the **Export XLS** button out of the grid into a footer row below the filters card, right-aligned, alongside a secondary **Reset** button (visual only). Same gradient styling as today.
- Field labels stay as `block text-[11px] font-semibold text-foreground mb-1.5`.
- Helper component `Filter` is removed; replaced by a tiny `Field({ label, children })` wrapper for consistent label + control spacing.
- No prop changes — every existing report page (`/reports/*`) inherits the new filter set automatically. The empty-state card below the filters is unchanged.

### Not touched
No edits to the 8 report route files, the sidebar, the reports hub, or `routeTree.gen.ts`. No backend.
