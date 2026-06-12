Apply the specified blue gradient to every table header row across the entire application.

The gradient is already defined in `src/styles.css` as `--gradient-primary`:
```css
linear-gradient(135deg, oklch(0.24 0.07 262) 0%, oklch(0.4 0.11 258) 60%, oklch(0.56 0.1 252) 100%)
```

**Files to update** — replace table header row background classes with `bg-gradient-primary`:

1. `src/routes/dispatch.tsx` — 2 table header rows (lines 240, 785)
2. `src/routes/dispatch-orders.tsx` — 1 table header row (line 328, currently `bg-surface-2`)
3. `src/components/invoice-load-details-sap-create.tsx` — 2 table header rows (lines 75, 214)
4. `src/components/insurance-claim-tracking-sap-create.tsx` — 2 table header rows (lines 86, 214)
5. `src/components/shipment-details-sap-create.tsx` — 2 table header rows (lines 69, 222)
6. `src/components/freight-billing-sap-create.tsx` — 1 table header row (line 147)
7. `src/components/segment-info-sap-create.tsx` — 1 table header row (line 73)
8. `src/components/order-info-sap-create.tsx` — 1 table header row (line 92)
9. `src/components/transit-damage-info-sap-create.tsx` — 2 table header rows (lines 69, 197)
10. `src/components/service-level-sap-create.tsx` — 1 table header row (line 85)
11. `src/components/transit-info-sap-create.tsx` — 1 table header row (line 47)
12. `src/components/vehicle-info-sap-create.tsx` — 2 table header rows (lines 83, 222)

No other changes. Text colors (`text-primary-foreground`) remain unchanged.