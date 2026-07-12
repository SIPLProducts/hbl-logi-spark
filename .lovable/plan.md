
# Replace Sales Person popover-search with a standard dropdown

## Scope
- File touched: `src/components/segment-info-sap-create.tsx` only.
- No API, payload, or state-shape changes. `form.SALE_PERSON` continues to hold the selected supplier name and flows into the existing save payload (`SALES_EMP: form.SALE_PERSON`) unchanged.

## What changes
Replace the current Sales Person block (the `Popover` + `Command`/`CommandInput`/`CommandItem` combobox with the `Search` icon) with a native `<select>`, mirroring the Segment field directly below it.

New shape:

```tsx
{isWithout || showF4.SALE_PERSON ? (
  <select
    value={form.SALE_PERSON}
    onChange={(e) => setField("SALE_PERSON", e.target.value)}
    className={GREEN_INPUT}
  >
    <option value="" disabled>Select Sales Person</option>
    {supplierList.map((s: any, idx: number) => (
      <option key={idx} value={s.SUPPLIER_NAME}>
        {s.SUPPLIER} - {s.SUPPLIER_NAME}
      </option>
    ))}
  </select>
) : (
  <input value={form.SALE_PERSON} readOnly className={READONLY_INPUT} />
)}
```

Notes on "new search behavior": a native `<select>` already supports type-ahead search (typing letters jumps to matching options) with no custom icon or popover, which matches the "standard input/dropdown while still supporting search" requirement.

## Cleanup in the same file
- Remove the now-unused `salePersonOpen` state and its `setSalePersonOpen` setter.
- Remove imports that are no longer used *only if* nothing else in the file still uses them:
  - `Popover`, `PopoverContent`, `PopoverTrigger`
  - `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`
  - `Search` from `lucide-react` — keep it if it's still used by the global search bar button (line ~817). Verify before removing.

## Out of scope
- The inlined shell in `src/routes/segment-info.tsx` (no Sales Person input there).
- Any other screen or field.
- Save/fetch logic, validation, styling tokens.
