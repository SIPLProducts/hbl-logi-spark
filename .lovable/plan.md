## Conditional Work Order & Remarks fields in Dispatch Creation

### Problem
In the Dispatch → Create screen table, the Work Order and Remarks fields currently appear and are editable regardless of the selected Vehicle Type. We need to make them conditional based on the row’s Vehicle Type value.

### Changes (all in `src/routes/dispatch.tsx`)

1. **Extend `CellInput` helper**  
   Add an optional `disabled?: boolean` prop and wire it to the underlying `<input>` element with visual disabled styling (`disabled:opacity-50 disabled:cursor-not-allowed`).

2. **Conditionally enable/disable Work Order**  
   For each table row, pass `disabled={row.vehicleType !== "FULL TRUCK LOAD"}` to the Work Order `CellInput`.  
   - When Vehicle Type is **FULL TRUCK LOAD** → Work Order input is enabled.  
   - For every other Vehicle Type → Work Order input is disabled (greyed-out, non-interactive).

3. **Conditionally hide Remarks**  
   For each table row, check `row.vehicleType`:  
   - If it is **FULL TRUCK LOAD** or **CARGO** → render an empty `<td className="px-1.5 py-1" />` so the table cell count stays correct and no Remarks input is shown.  
   - Otherwise → render the normal `CellInput` for Remarks.

### Behavior notes
- When Vehicle Type changes away from FTL, the Work Order value stays in state but becomes disabled.  
- When Vehicle Type becomes FTL or CARGO, the Remarks cell empties but the underlying `row.remarks` value is preserved in state; if the type changes back, the input re-appears with the previous value.  
- The table header columns remain static; only the per-row body cells change.

### Files touched
- `src/routes/dispatch.tsx` only.