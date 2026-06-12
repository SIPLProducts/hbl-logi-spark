## Scope

Four UI tweaks across the app — presentation only, no logic changes.

### 1. Background colors on Pending / Completed chips
File: `src/components/le-screen-shell.tsx` (lines ~227–236, inside the Direction card — the only remaining location after the earlier dedupe).

- Pending chip: replace `bg-surface-2/60` with amber background (`bg-amber-100 dark:bg-amber-500/15`), border `border-amber-300/60`, text `text-amber-800 dark:text-amber-200`.
- Completed chip: replace `bg-surface-2/60` with emerald background (`bg-emerald-100 dark:bg-emerald-500/15`), border `border-emerald-300/60`, text `text-emerald-800 dark:text-emerald-200`.
- Keep the existing dot, count, size, and layout intact.

### 2. Reduce table row spacing
Tighten vertical padding on data-row cells everywhere.

- `src/components/data-table.tsx`: change body `td` padding `px-2 py-1` → `px-2 py-0.5`; header `px-2 py-1.5` → `px-2 py-1`.
- `src/components/ui/table.tsx`: reduce `<TableRow>` / `<TableCell>` vertical padding by one step (e.g. `py-2` → `py-1`, `h-12` → `h-9`) — exact tokens confirmed when editing.
- All 10 `*-sap-create.tsx` table bodies: change row `<td className="px-N py-2 …">` → `px-N py-1` (header rows `py-2.5` → `py-1.5`). Applied with a single `sed` pass across the matching files.

### 3. Four input fields per row
Update the SAP-create form grids so md+ breakpoints render 4 columns instead of 2/3.

Files & current → new className on the form grid wrapper:
- `order-info-sap-create.tsx` (L197), `segment-info-sap-create.tsx` (L186), `transit-info-sap-create.tsx` (L123), `transit-damage-info-sap-create.tsx` (L186), `insurance-claim-tracking-sap-create.tsx` (L203), `freight-billing-sap-create.tsx` (L223): `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2`.
- `shipment-details-sap-create.tsx` (L178), `freight-billing-sap-create.tsx` (L79): `grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-4` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-2`.
- `le-screen-shell.tsx` topFields grid (L255): `grid-cols-2 md:grid-cols-4 gap-2.5` → `grid-cols-2 md:grid-cols-4 gap-2`.

### 4. Minimize spacing between input fields
Handled by the same grid edits in step 3 (`gap-x-2 gap-y-2` instead of `gap-x-5 gap-y-4`). No changes to the inputs themselves — heights, borders, and label spacing stay as is.

## Out of scope

- No changes to table header colors (already navy from prior turn).
- No changes to colors, fonts, or any other layout.
- No edits to inline tables inside `vehicle-info-sap-create.tsx` column widths — only row padding.

## Verification

Screenshot `/order-info`, `/shipment-details`, `/invoice-load-details`, and `/freight-billing` to confirm: chips are colored, tables are denser, forms render 4 fields per row with tight gaps.
