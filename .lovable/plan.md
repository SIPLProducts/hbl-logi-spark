## Plan: Gate In/Out Date Validation

### Goal
Prevent users from selecting a **Physical Dispatch Date and Time** that is earlier than both the **Required Date and Time** and the **Reported Date and Time**. Validation must be real-time and work for every row.

### Current State
The Gate In/Out table in `src/routes/gate-in-out-process.tsx` renders a single static `<TableRow>` with uncontrolled `<input type="datetime-local">` fields. There is no per-row state, so real-time cross-field comparison is impossible.

### Changes Required

#### 1. Convert table row to state-managed rows
- Replace the hardcoded single `<TableRow>` with a `useState` array (`gateRows`) that starts with one empty row object.
- Each row object tracks:
  - `requiredDateTime`
  - `reportedDateTime`
  - `physicalDispatchDateTime`
  - `truckType`, `tatType`, `eta`, and all other text fields currently in `GATE_COLUMNS`.
- Wire every `<Input>` and `<select>` in the table to the corresponding row state via `onChange`.

#### 2. Real-time validation logic
- Create a helper `getMinPhysicalDispatch(row)` that returns the **later** of `requiredDateTime` and `reportedDateTime`.
- On the **Physical Dispatch Date and Time** input:
  - Set the HTML `min` attribute to the value returned by `getMinPhysicalDispatch(row)` (formatted as `YYYY-MM-DDTHH:mm`). This blocks selection of earlier datetimes natively.
  - If the current `physicalDispatchDateTime` becomes invalid because one of the other two dates is moved forward, clear it or flag it with an inline error.
- Add a per-row `error` state that shows a small red message (e.g., "Must be on or after Required and Reported dates") when validation fails.

#### 3. Add / remove rows
- Add an **Add Row** button below the table.
- Add a **Delete** button in the Action column (already present in the reference table UI; replicate that pattern).
- Validation rules apply to every row independently.

#### 4. Styling
- Keep existing compact styling (h-7 inputs, py-0 cells, 12px font).
- Error message: 11px red text beneath the Physical Dispatch cell.
- No changes to colors, gradients, or other screens.

### Files to modify
- `src/routes/gate-in-out-process.tsx` — state, validation, row management

### Not in scope
- Server-side validation (client-side only).
- Changes to other screens.
- API integration.