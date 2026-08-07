## Goal
In Invoice Load Details > Filter & Download, lock the filter fields to a fixed 3-per-row grid that does not change alignment when the screen size is reduced.

## Change
File: `src/routes/invoice-load-details.tsx` — filter grid only (presentation, no logic).

Replace the current fixed 6-column grid with a fixed 3-column grid and a smaller minimum width:

```text
<div className="overflow-x-auto scrollbar-elegant">
  <div className="p-4 grid grid-cols-3 min-w-[620px] gap-x-3 gap-y-2">
    ...same 7 fields, unchanged...
  </div>
</div>
```

Resulting fixed layout at every width:

```text
Row 1: From Date      | To Date       | Plant
Row 2: Division       | Transporter   | Vehicle Type
Row 3: Status         |               |
```

Below ~620px the card scrolls sideways instead of restacking, so alignment never shifts.

## Notes
- No state, data-binding, or filter logic changes.
- Action bar (Reset / Download PDF / Download Excel / Apply Filter) untouched.