## Conditional Action column in Dispatch → Create

### Behavior
- The table starts with **one row** (no auto-added rows).
- A new **Action** column (header "Action") is rendered **only when** the maximum count among row 1's five trigger fields is greater than 1. Until then, no Action column header and no per-row Add/Delete buttons are shown.
- The five trigger fields and how each contributes a "count":
  - **No. of Trucks** → numeric value
  - **No. of Invoices** → numeric value
  - **No. of LRs** → numeric value
  - **Load Points** → number of comma-separated entries (trimmed, non-empty)
  - **Unload Points** → number of comma-separated entries (trimmed, non-empty)
- `maxAllowed = max(trucks, invoices, lrs, loadPtsCount, unloadPtsCount)` computed from **row 1**.
- When `maxAllowed > 1`:
  - Action column appears.
  - Each row gets an **Add** button (enabled while `rows.length < maxAllowed`) and a **Delete** button (disabled on row 1 when it is the only row, otherwise enabled).
  - Clicking Add appends a new blank row (slNo auto-incremented) up to `maxAllowed`.
  - Clicking Delete removes that row; slNos are renumbered.
- When `maxAllowed <= 1`: column is hidden entirely and the existing on-hover trash icon is removed so there is no delete control either.
- If the user reduces row 1 values back to ≤1 while extra rows exist, the Action column stays visible (rows.length > 1 keeps it on); Add becomes disabled because `rows.length >= maxAllowed`.

### Files touched
- `src/routes/dispatch.tsx` only.

### Technical notes
1. Derive `maxAllowed` via `useMemo` from `rows[0]`. Helper `countParts(str)` splits on `,`, trims, filters empty.
2. `showActionCol = maxAllowed > 1 || rows.length > 1`.
3. Header row: conditionally render the trailing `""` column header as "Action" only when `showActionCol`.
4. Body: replace the existing always-rendered trailing `<td>` (currently holding the hover-only trash) with a conditional `<td>` that, when `showActionCol`, renders both an Add (`Plus` icon) and Delete (`Trash2` icon) button side-by-side. Add is `disabled` when `rows.length >= maxAllowed`; Delete is `disabled` when `rows.length === 1`.
5. `addRow()` helper: append `emptyDispatchRow(rows.length + 1)` to state; cap at `maxAllowed`.
6. Keep existing `deleteRow` logic (already renumbers slNos).
7. No changes to data model, mock data, or other screens.
