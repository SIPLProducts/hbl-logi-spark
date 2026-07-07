## Freight Billing — Add Conditional Finance Details Section

### Objective
Add a dropdown field "Finance Details" with options "Yes" / "No" on the Freight Billing screen. When "Yes", show four fields: JV Number, JV Date, UTR Number, UTR Date. When "No", hide those four fields and keep the existing layout intact.

### Scope
This change is limited to `src/components/freight-billing-sap-create.tsx`. No backend or API changes.

### Implementation Steps

1. **Add state**  
   Introduce `financeDetails` state (value `"" | "Yes" | "No"`), plus four string/date states: `jvNumber`, `jvDate`, `utrNumber`, `utrDate`. Persist them in `sessionStorage` alongside existing fields.

2. **Wire reset / clear**  
   Extend `resetFormState()` and the `useEffect(mode)` cleanup to clear the new five states and their sessionStorage keys.

3. **Add dropdown to the form grid**  
   Place the "Finance Details" `<select>` in the existing field grid (line ~860+) using the same `GREEN_INPUT` / `LABEL` styling. Options: `""` (placeholder), `"Yes"`, `"No"`.

4. **Conditionally render the four fields**  
   Immediately after the Finance Details dropdown, render JV Number, JV Date, UTR Number, UTR Date only when `financeDetails === "Yes"`. Use the same grid column layout (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) so the layout stays consistent when they appear/disappear.

5. **Include in save payload**  
   Add the five new fields to the `record` object sent in `saveFreightBilling` so they are submitted with the save call.

### Files Changed
- `src/components/freight-billing-sap-create.tsx` (single file)

### Verification
- Build passes (`bun run build`).
- Preview shows the Finance Details dropdown.
- Selecting "Yes" reveals the four fields; "No" hides them.
