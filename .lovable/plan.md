Remove the number badge and "Logistics Execution" label that appear at the top of every screen.

Changes:
1. `src/components/le-screen-shell.tsx`
   - Remove the `screenNo` prop from the component signature.
   - Delete the rendered number badge (`{String(screenNo).padStart(2, "0")}`) and the "Logistics Execution" `<span>` from the page header.

2. Update all route files using `LeScreenShell` to stop passing `screenNo`:
   - `src/routes/dispatch.tsx`
   - `src/routes/order-info.tsx`
   - `src/routes/shipment-details.tsx`
   - `src/routes/invoice-load-details.tsx`
   - `src/routes/segment-info.tsx`
   - `src/routes/vehicle-info.tsx`
   - `src/routes/transit-info.tsx`
   - `src/routes/freight-billing.tsx`
   - `src/routes/service-level.tsx`
   - `src/routes/transit-damage-info.tsx`
   - `src/routes/insurance-claim-tracking.tsx`

3. `src/routes/dispatch-orders.tsx`
   - Remove the inline number badge (`01`) and the "Logistics Execution" `<span>` from the page header (keeps the `<h1>` and description unchanged).