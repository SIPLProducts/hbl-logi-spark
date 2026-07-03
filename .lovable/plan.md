## Plan: Relocate Row Controls in Gate In/Out Table

### Goal
Remove the standalone "Add Row" button below the Gate In/Out table and instead place **Add** and **Delete** row buttons inside the **Action** column of every table row, consistent with the Dispatch screen.

### Changes

#### File: `src/routes/gate-in-out-process.tsx`

1. **Remove standalone "Add Row" button**
   - Delete the button block currently rendered below the table (~lines 1300–1307).

2. **Update Action column to show Add + Delete per row**
   - Replace the current Action cell (which only shows a Delete icon when `gateRows.length > 1`) with an inline flex container holding both buttons:
     - **Add row** — `Plus` icon, calls `addGateRow()`, always enabled.
     - **Delete row** — `Trash2` icon, calls `removeGateRow(i)`, disabled when only one row remains.
   - Apply the same compact styling used in the Dispatch screen (`size-7` rounded buttons, muted foreground color, subtle hover backgrounds for accent/destructive).

3. **Ensure imports are present**
   - `Plus` and `Trash2` are already imported from `lucide-react`; no new imports needed.

### Not in scope
- No changes to row state logic (`addGateRow`, `removeGateRow`, `updateGateRow`).
- No changes to validation or date-min logic.
- No changes to other screens.