## Remove dummy data from tables across all screens

Empty out the seeded table rows so each table shows an empty state instead of mock data. Table structure, columns, headers, filters, and Execute behavior remain unchanged.

### Files to update

1. **`src/routes/shipment-details.tsx`** — set `lineItems.rows: []` (remove the 3 sample battery rows).
2. **`src/routes/segment-info.tsx`** — set `lineItems.rows: []` (remove the 3 sample segment rows).
3. **`src/routes/transit-info.tsx`** — set `lineItems.rows: []` (remove the 5 sample stop rows).
4. **`src/routes/user-creation.tsx`** — remove the hardcoded admin `<tr>` from `<tbody>`; leave the empty `<tbody>` so headers still render. Keep `SEED_USER` removed/unused (delete the constant since it only seeded the edit button).
5. **`src/routes/dispatch.tsx`** — change `useState<DispatchRow[]>(sampleDispatchRows)` to `useState<DispatchRow[]>([])`, and replace both uses of `sampleResultRows` (filter source and fallback) with `[]`. Remove the now-unused imports.

### Not changed
- `src/lib/dispatch-mock.ts` (kept so types and helpers compile; arrays are simply no longer referenced).
- `src/routes/dispatch-orders.tsx` (already initializes with empty rows — Execute loads from `queryDispatchOrders`; out of scope unless asked).
- Reports screens (already use the empty `<ReportPlaceholder>` — no tables yet).
- Headers, columns, filters, dialogs, and styling.