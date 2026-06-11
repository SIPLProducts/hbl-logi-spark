## Goal

On Order Info → With SAP, hide the 3-column field grid until the user enters an Invoice Number and clicks **GET**. When revealed, all fields render empty (no dummy values).

## Scope

Single file: `src/components/order-info-sap-create.tsx`. No other screens or routes are affected.

## Changes

1. **Gate the field grid** behind a new `revealed` state.
   - `const [revealed, setRevealed] = useState(false)`
   - The "Field grid" card and the "Footer action bar" only render when `revealed === true`.
   - The selection table and invoice lookup bar always render.

2. **GET button behavior**
   - On click, if `invoiceNumber.trim()` is non-empty → `setRevealed(true)`.
   - If empty → do nothing (button stays disabled-looking via `disabled` attr when input is blank).

3. **Strip dummy data** from every field in the `FIELDS` array — set each `value` to an empty string `""`. Keep `label`, `type`, and `options` (so dropdowns still list valid choices but show the placeholder).
   - For `select` fields, render with `defaultValue=""` and prepend a placeholder `<option value="" disabled>Select</option>`.
   - For `date` fields, no default value.
   - For text fields, no default; add a subtle `placeholder` of the label (e.g. `Enter Tax Invoice`).

4. **Empty-state hint** (optional, small): when `!revealed`, show a thin muted line under the lookup bar: "Enter an Invoice Number and click GET to load fields."

5. **Reset behavior**: clearing the Invoice Number does NOT auto-hide; only the GET click toggles `revealed`. Keeps it simple and matches the requested flow.

## Result

The form fields are hidden until GET is pressed with a valid Invoice Number. Once shown, every field is empty for the user to fill in. Selection table and lookup bar remain visible at all times. Other screens unchanged.
