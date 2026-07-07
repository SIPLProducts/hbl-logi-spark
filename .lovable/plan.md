# Plan: Self-contained Shipment Details screen

Make `src/routes/shipment-details.tsx` fully standalone — no dependency on `LeScreenShell` — while preserving the current visible behavior for this screen.

## Scope

- Only `src/routes/shipment-details.tsx` is modified.
- `LeScreenShell` and its file remain untouched (other routes still use it).
- `ShipmentDetailsSapCreate` continues to be used as-is (it already holds the Outward/With-SAP create body).

## What the new single file contains

All of the following lives in `src/routes/shipment-details.tsx`:

1. `createFileRoute("/shipment-details")` export.
2. Local page component with the same shell UX currently rendered via `LeScreenShell`:
   - Sticky page header with title "Shipment Details", Create / Filter & Download tabs, Refresh button.
   - Create tab:
     - Direction selector (Outward) + With SAP / Without SAP toggle.
     - Pending / Completed count chips (from `counts` in `@/lib/le-mock-data`).
     - When Outward + a SAP mode are chosen, render `<ShipmentDetailsSapCreate mode={sap} />`.
     - Inward selection shows nothing (matches current behavior).
   - Filter & Download tab:
     - With SAP / Without SAP toggle.
     - Filter grid: From Date, To Date, Plant, Division, Transporter, Vehicle Type, Status (using `PLANTS`, `DIVISIONS`, `TRANSPORTERS`, `VEHICLE_TYPES` from `@/lib/dispatch-mock`).
     - Apply / Reset buttons, results table using the current columns (Sl.No, Map ID, Reference Number, Work Order Number, LR Number, Transporter) driven by mock `WorklistRow` data.
3. All small helpers previously imported from `LeScreenShell` (`PremiumRadio`, `SapToggle`, `SearchSapToggle`, `DateField`, `SelectField`, `FieldInput`, `spanClass`, `KpiCard` as needed) are redefined locally in the same file — copied only to the extent this screen actually uses them. Unused ones are dropped.
4. Local `SEARCH_TYPES`, `STATUS_OPTIONS`, and any constants used only here.

## Removed

- `import { LeScreenShell, type WorklistColumn } from "@/components/le-screen-shell"` — deleted from this route.
- The `columns`, `topFields`, `lineItems` props previously passed to `LeScreenShell` (topFields/lineItems were unused because `renderCreateBody` overrode them).

## Verification

- `bun run build` (or dev server) succeeds.
- `/shipment-details` renders: header + tabs, direction+SAP flow shows `ShipmentDetailsSapCreate`, Filter & Download tab shows filters and results table.
- Other routes (dispatch, order-info, etc.) still compile — `LeScreenShell` file is unchanged.

## Technical notes

- Keep styling classes identical to the shell (`bg-surface`, `border-hairline`, `bg-gradient-primary`, `shadow-elegant`, etc.) so the visual output matches today's screen.
- Keep the file under ~500 lines by only porting the pieces this screen uses (no KPI cards, no grouped field sections, no line-items shell block — the SAP create body already handles line items).
