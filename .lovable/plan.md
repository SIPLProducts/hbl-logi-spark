## Remove dummy data from the Reference/Worklist tables

Every screen built on `LeScreenShell` (Order Info, Shipment Details, Invoice Load Details, Segment Info, Vehicle Info, Transit Info, Freight Billing, Service Level, Transit Damage Info, Insurance Claim Tracking) defaults its worklist/reference table to `sampleRows` from `src/lib/le-mock-data.ts`. We will make that default empty.

### Change
In **`src/components/le-screen-shell.tsx`**:
- Remove the `sampleRows` import from `@/lib/le-mock-data` (keep `counts` and `type WorklistRow`).
- Change the prop default from `rows = sampleRows` to `rows = []`.

This single edit empties the Reference table across every screen that uses the shell, without touching individual route files. Table headers, search, filters, pagination, and styling remain intact — empty state will render automatically.

### Not changed
- `src/lib/le-mock-data.ts` (left in place so types/counts still resolve).
- Individual route files (none pass a custom `rows` prop today).