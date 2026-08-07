## Goal
In Invoice Load Details > Filter & Download, keep the filter fields in the same 6-across grid layout when the window narrows, instead of reflowing to 3 / 2 / 1 columns.

## Change
File: `src/routes/invoice-load-details.tsx` — the filter grid only (presentation, no logic).

Replace the breakpoint-based grid:

```text
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6
```

with a fixed 6-column grid that has a minimum width, inside a horizontally scrollable wrapper:

```text
<div className="overflow-x-auto scrollbar-elegant">
  <div className="p-4 grid grid-cols-6 min-w-[1100px] gap-x-3 gap-y-2">
    ...same 7 fields, unchanged...
  </div>
</div>
```

Result: alignment stays identical at every width — From Date, To Date, Plant, Division, Transporter, Vehicle Type on row 1 and Status on row 2. On narrow screens the filter card scrolls sideways instead of re-stacking.

## Notes
- No state, data-binding, or filter logic changes.
- The action bar (Reset / Download PDF / Download Excel / Apply Filter) stays as-is.
