# Replace green field styling with gray

The green borders and text in inputs/dropdowns/search bars come from two shared constants (`INPUT_BASE`/`INPUT` and `LABEL`) duplicated at the top of every `*-sap-create.tsx` file, plus a couple of related field accents. Action buttons (GET = `#8f1e42`, Save = emerald) and status badges/KPIs stay as they are — this change is scoped to field chrome only.

## Changes (10 files)

In each of:
- `src/components/order-info-sap-create.tsx`
- `src/components/shipment-details-sap-create.tsx`
- `src/components/invoice-load-details-sap-create.tsx`
- `src/components/segment-info-sap-create.tsx`
- `src/components/vehicle-info-sap-create.tsx`
- `src/components/transit-info-sap-create.tsx`
- `src/components/freight-billing-sap-create.tsx`
- `src/components/service-level-sap-create.tsx`
- `src/components/transit-damage-info-sap-create.tsx`
- `src/components/insurance-claim-tracking-sap-create.tsx`

Replace the field-chrome classes:

- `border-emerald-400/70` → `border-input`
- `text-emerald-700 dark:text-emerald-300` (inside INPUT and LABEL) → `text-foreground` for input value, `text-muted-foreground` for LABEL
- `focus:border-emerald-500` → `focus:border-ring`
- `focus:ring-emerald-400/30` → `focus:ring-ring/30`

This covers every text input, select/dropdown, textarea, and the "Enter Reference / Invoice / ODN / SO Number" search input that uses `INPUT_BASE`.

Also fix small green accents tied to fields:
- `invoice-load-details-sap-create.tsx` line 351: calendar icon `text-emerald-600` → `text-muted-foreground`.

## Out of scope (intentionally unchanged)

- GET button (`#8f1e42`)
- Save / Save and Next buttons (green)
- KPI tiles, status badges, "Completed" pill, success toasts
- `le-screen-shell.tsx` SAP-mode pill (line 230) and Download Excel icon (line 426)
- `service-level-sap-create.tsx` selected-state pill colors for the load-type toggles
- `freight-billing-sap-create.tsx` checkbox accent and label colors for the "Freight calculated by" radios (these are label decorations, not field chrome)
