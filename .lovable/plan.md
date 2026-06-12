# Changes

## 1. Rename "Search & Reports" → "Filter & Download"
Update the tab label in both shells where it appears:
- `src/components/le-screen-shell.tsx` (line 188) — tab trigger text
- `src/routes/dispatch.tsx` (line 109) — tab trigger text

Also update related comments referring to the tab name (cosmetic).

## 2. Recolor GET button to `#8f1e42`
The "GET" button (next to Invoice/Reference number lookup) currently uses `bg-emerald-500 hover:bg-emerald-600`. Change only this specific button across all SAP-create components.

Approach: add a custom utility color via inline style or arbitrary Tailwind classes. Use `bg-[#8f1e42] hover:bg-[#7a1938]` on the GET button only (the one with `font-bold tracking-wider` — that uniquely identifies the GET button vs other emerald action buttons like Save/Export).

Files to update (only the GET button line in each — identified by `font-bold tracking-wider`):
- `src/components/insurance-claim-tracking-sap-create.tsx` (line 159)
- `src/components/invoice-load-details-sap-create.tsx` (line 152)
- `src/components/order-info-sap-create.tsx` (line 153)
- `src/components/segment-info-sap-create.tsx` (line 142)
- `src/components/service-level-sap-create.tsx` (line 144)
- `src/components/shipment-details-sap-create.tsx`
- `src/components/transit-damage-info-sap-create.tsx`
- `src/components/vehicle-info-sap-create.tsx`
- `src/components/transit-info-sap-create.tsx` (if present)
- `src/components/freight-billing-sap-create.tsx` (if a GET button exists)

Other emerald buttons (Save, Export, row-action icons) are left unchanged.

## Out of scope
- The hint text "click GET to load fields" stays as-is.
- Input field green border styling stays as-is.
