## Goal
1. Make every table header use the same solid deep navy as the Create button (`bg-primary`) instead of the current cyan-tinted `bg-gradient-primary`.
2. Remove the duplicate Pending/Completed chips that appear inside each SAP-create body — keep only the ones already rendered inside the Direction card (in `le-screen-shell.tsx`).

## Changes

### 1. Table headers → solid navy (`bg-primary`)
Swap `bg-gradient-primary` → `bg-primary` on table headers in:
- `src/components/ui/table.tsx` — `TableHeader`
- `src/components/data-table.tsx` — `<thead> <tr>`
- `src/components/le-screen-shell.tsx` — Line Items `<thead>` and Search Results `<thead>`

Text color stays `text-primary-foreground` / `text-primary-foreground/90`. No other style changes (padding, height, typography untouched).

### 2. Remove duplicate Pending/Completed chips
The Direction card in `le-screen-shell.tsx` already shows `Pending 18 / Completed 16`. Each SAP-create form re-renders its own `Pending: N / Completed: N` row, producing the duplicate visible at `/order-info` and every other module. Remove the chip row (the small `flex items-center gap-3` block with the amber + emerald dots) from:

- `src/components/order-info-sap-create.tsx`
- `src/components/shipment-details-sap-create.tsx`
- `src/components/invoice-load-details-sap-create.tsx`
- `src/components/segment-info-sap-create.tsx`
- `src/components/vehicle-info-sap-create.tsx`
- `src/components/transit-info-sap-create.tsx`
- `src/components/transit-damage-info-sap-create.tsx`
- `src/components/freight-billing-sap-create.tsx`
- `src/components/service-level-sap-create.tsx`
- `src/components/insurance-claim-tracking-sap-create.tsx`

Only the chip row is removed; the surrounding container/header bar and any other content stay intact. If removing the chips leaves an empty wrapper, drop the wrapper too.

## Out of scope
- No changes to color tokens in `styles.css`.
- No changes to the Direction card chips themselves (they remain the single source of truth).
- No row height, padding, or form-layout changes beyond what's described.

## Verification
- `/order-info`, `/shipment-details`, `/invoice-load-details`, `/segment-info`, `/vehicle-info`, `/transit-info`, `/transit-damage-info`, `/freight-billing`, `/service-level`, `/insurance-claim-tracking`: only one Pending/Completed pair visible (inside Direction card); table header is solid navy matching the Create button.
- `/reports/*` listings using the shadcn `Table` primitive: header is solid navy.
- No console errors; no horizontal overflow at 1187px.
