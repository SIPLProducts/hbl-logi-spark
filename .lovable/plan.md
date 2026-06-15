Make the browser tab title fixed as "HBL - LOGISTICS EXECUTION" on every screen, removing all per-route overrides.

### Files to change

1. **`src/routes/__root.tsx`**
   - Update the root `title` meta entry from `"HBL LOGISTICS EXECUTION"` to `"HBL - LOGISTICS EXECUTION"`.
   - Update `og:title` and `twitter:title` to the same fixed text for consistency.

2. **All child route files with `head:` overrides** (~22 files)
   - Remove the entire `head: () => ({ ... })` block from each child route so the root title is inherited and never overridden.
   - Affected files include: `src/routes/index.tsx`, `src/routes/dispatch.tsx`, `src/routes/dispatch-orders.tsx`, `src/routes/login.tsx`, `src/routes/vehicle-info.tsx`, `src/routes/transit-info.tsx`, `src/routes/freight-billing.tsx`, `src/routes/order-info.tsx`, `src/routes/shipment-details.tsx`, `src/routes/segment-info.tsx`, `src/routes/transit-damage-info.tsx`, `src/routes/insurance-claim-tracking.tsx`, `src/routes/service-level.tsx`, `src/routes/invoice-load-details.tsx`, `src/routes/user-creation.tsx`, `src/routes/reports.index.tsx`, `src/routes/reports.freight-bills.tsx`, `src/routes/reports.damage-list.tsx`, `src/routes/reports.business-share-matrix.tsx`, `src/routes/reports.service-level-report.tsx`, `src/routes/reports.pending-pods.tsx`, `src/routes/reports.insurance.tsx`, `src/routes/reports.transit-eway-bill.tsx`, `src/routes/reports.loading-factor-cost.tsx`.

No other behavior changes.