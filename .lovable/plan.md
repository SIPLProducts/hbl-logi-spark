## Goal
Make the UI denser across the app: shorter inputs, tighter table rows, and less space between cards/sections.

## Changes

### 1. Input height (h-9 → h-7)
In all SAP-create components and shared inputs, drop input/select/button-in-row height from `h-9` to `h-7`, font from `text-[12.5px]` to `text-[12px]`, padding `px-2.5` → `px-2`, label margin `mb-1` → `mb-0.5`.

Files:
- `src/components/order-info-sap-create.tsx`
- `src/components/segment-info-sap-create.tsx`
- `src/components/transit-info-sap-create.tsx`
- `src/components/transit-damage-info-sap-create.tsx`
- `src/components/insurance-claim-tracking-sap-create.tsx`
- `src/components/freight-billing-sap-create.tsx`
- `src/components/shipment-details-sap-create.tsx`
- `src/components/invoice-load-details-sap-create.tsx`
- `src/components/service-level-sap-create.tsx`
- `src/components/vehicle-info-sap-create.tsx`
- `src/components/le-screen-shell.tsx` (any inline h-9 inputs/search bars)
- `src/components/ui/input.tsx` already h-7 — leave.

### 2. Table spacing
- `src/components/data-table.tsx`: header `py-1` → `py-0.5`, cells already `py-0.5` (leave).
- `src/components/ui/table.tsx`: `TableHead` `h-7` → `h-6`, `TableCell` `py-0.5` → `py-0` (keep `leading-tight`).
- In all `*-sap-create.tsx` selection tables: `py-1.5` header → `py-1`, `py-1` cell → `py-0.5`.

### 3. Card / section spacing
- Reduce vertical rhythm: `space-y-4` → `space-y-2` on the root wrappers of all SAP-create components and `le-screen-shell.tsx` main column.
- Card padding: `p-5` → `p-3` and `p-3` → `p-2` on the field-grid and lookup-bar containers across the same files.
- `pt-2` footer action bars unchanged.

## Out of scope
- No color changes, no grid-column changes, no logic changes.

## Verification
Screenshot `/order-info`, `/transit-info`, `/shipment-details` at current viewport — confirm shorter inputs, tighter rows, and smaller gaps between the selection table, lookup bar, and field grid cards.
