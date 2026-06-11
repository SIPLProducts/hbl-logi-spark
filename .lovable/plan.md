## Goal

Replicate the Dispatch screen's top controls — **Direction** (Outward active, Inward commented out), **With SAP / Without SAP** segmented toggle, and a **Search filter row** (search-type select + value input + Search button) — on every LE screen from Order Info through Insurance Claim Tracking, while keeping each screen's existing fields/groups intact.

## Affected screens (10)

All render via `LeScreenShell`:
1. `/order-info`
2. `/shipment-details`
3. `/invoice-load-details`
4. `/segment-info`
5. `/vehicle-info`
6. `/transit-info`
7. `/freight-billing`
8. `/service-level`
9. `/transit-damage-info`
10. `/insurance-claim-tracking`

`/dispatch-orders` and `/dispatch` already have their own logic and are NOT touched.

## Approach

Add the controls **once** inside `LeScreenShell` (above the existing worklist) so all 10 screens get them automatically. No per-route edits required.

### Changes to `src/components/le-screen-shell.tsx`

1. **Add local state**
   - `direction: "outward" | "inward" | null` (default `"outward"`)
   - `sap: "with" | "without" | null` (default `"with"`)
   - `searchType: string` (default `"Reference"`)
   - `searchValue: string`

2. **New "Direction + SAP" toolbar card** (rendered just under the page header, before the existing mode/chips row):
   - Label `DIRECTION` + `PremiumRadio`-style Outward button (active).
   - Inward radio wrapped in `{/* ... */}` JSX comment (kept for future re-enable), matching the Dispatch pattern.
   - Pill-shaped segmented `With SAP / Without SAP` toggle with sliding thumb (reuse the same Tailwind classes used on `/dispatch`).

3. **New "Filter" row** inside the same card:
   - `Select` for search type: `Reference | Invoice | ODN | SO Number | Work Order | LR Number`.
   - Text `Input` with placeholder reflecting the chosen type.
   - Primary `Search` button (gradient, matches existing CTA style).
   - Ghost `Reset` button to clear `searchValue`.

4. **Wire filter to the existing worklist**
   - Filter `rows` by `searchValue` against the chosen `searchType` field (case-insensitive `includes`).
   - When `searchValue` is empty, show all rows unchanged.

5. **No changes** to: KPIs, sub-tabs, existing mode/chips row, field groups, line items, footer, or the bottom action bar.

### Visual style

Match Dispatch toolbar exactly:
- `bg-surface border border-hairline rounded-2xl p-5 shadow-elegant`
- Uppercase tracked `DIRECTION` / `MODE` / `FILTER` labels (`text-[10.5px] font-bold tracking-[0.14em] text-muted-foreground`).
- Segmented toggle: pill `rounded-full bg-muted p-1` with sliding `bg-surface shadow-sm` thumb.

## Out of scope

- No new routes, no data model changes, no backend.
- Inward radio stays commented out (per existing Dispatch convention).
- Dispatch / Dispatch Orders screens unchanged.

## Files to edit

- `src/components/le-screen-shell.tsx` (only file)
