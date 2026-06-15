## Remove Add Row button and auto-initialize first row in Dispatch Create screen

### Problem
In the Dispatch → Create screen, users currently see an empty table with an "Add Row" button. They must click the button before entering any dispatch data. We want to remove the button and show one empty row by default so data entry can begin immediately.

### Changes (all in `src/routes/dispatch.tsx`)

1. **Auto-initialize rows state with one empty row**  
   Change `useState<DispatchRow[]>([])` to `useState<DispatchRow[]>([emptyDispatchRow(1)])` so the table always renders a single blank row on load.

2. **Remove the "Add Row" button**  
   Delete the `<Button size="sm" variant="outline" onClick={addRow} …>` block in the card header (next to the "Dispatch Lines" title).

3. **Remove the empty-state fallback row**  
   Delete the `rows.length === 0` conditional block inside `<tbody>` that shows the "No dispatch lines. Click Add Row to begin." message, since rows will never be empty now.

4. **Clean up unused `addRow` function**  
   Remove the `addRow` helper function declaration (optional — harmless to keep, but cleaner to remove since there is no UI that triggers it).

### Behavior notes
- The table will show one blank row with slNo = 1 as soon as the user selects Direction + SAP mode.
- The delete-row button per row will still work; if the user deletes the only row, the table becomes empty until the screen is reloaded or the tab is switched. No "Add Row" button will be present to restore it.
- Existing conditional logic for Work Order (enabled only for FTL) and Remarks (hidden for FTL/CARGO) remains unchanged and will apply to the auto-created row once a Vehicle Type is selected.

### Files touched
- `src/routes/dispatch.tsx` only.