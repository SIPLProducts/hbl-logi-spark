## Problem

The table headers on the main screens (Invoice Load Details, Order Info, etc.) use a hardcoded teal/sky gradient (`bg-gradient-to-r from-sky-500 to-teal-500 text-white`) directly on the `<thead>` rows. The earlier change only updated the shared table components, so these screens kept the old teal color.

## Fix

Replace every `bg-gradient-to-r from-sky-500 to-teal-500 text-white` with the solid navy `bg-primary text-primary-foreground` (the exact same color as the Create button) in these 13 files:

- src/components/order-info-sap-create.tsx
- src/components/shipment-details-sap-create.tsx (2 tables)
- src/components/invoice-load-details-sap-create.tsx (2 tables)
- src/components/segment-info-sap-create.tsx
- src/components/vehicle-info-sap-create.tsx (2 tables)
- src/components/transit-info-sap-create.tsx
- src/components/transit-damage-info-sap-create.tsx (2 tables)
- src/components/freight-billing-sap-create.tsx
- src/components/service-level-sap-create.tsx
- src/components/insurance-claim-tracking-sap-create.tsx (2 tables)
- src/components/report-placeholder.tsx
- src/routes/reports.index.tsx
- src/routes/user-creation.tsx

No other styling changes — padding, row spacing, and everything else stays as is.

## Verification

Screenshot /invoice-load-details and a couple of other screens to confirm every table header is now solid navy matching the Create button.