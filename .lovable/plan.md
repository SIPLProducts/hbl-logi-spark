## Goal
Add a "Finance Details" dropdown to the Freight Billing form that conditionally reveals four fields (JV Number, JV Date, UTR Number, UTR Date) when "Yes" is selected.

## Scope
Single file: `src/components/freight-billing-sap-create.tsx`

## Changes

1. **State management**
   - Add `financeDetails` state (string: `"" | "Yes" | "No"`) default `""`.
   - Add four new state variables: `jvNumber`, `jvDate`, `utrNumber`, `utrDate`.
   - Persist to `sessionStorage` alongside existing fields; clear them in `resetFormState`.

2. **Finance Details dropdown**
   - Render a labeled `<select>` in the main 4-column grid (same style as other form fields).
   - Options: blank placeholder, "Yes", "No".

3. **Conditional JV/UTR fields**
   - When `financeDetails === "Yes"`, render four additional inputs in the same grid:
     - JV Number (text)
     - JV Date (date)
     - UTR Number (text)
     - UTR Date (date)
   - Use existing `GREEN_INPUT` + `LABEL` styling and `animate-in fade-in slide-in-from-top-2` transition.
   - When "No" or blank, hide the four fields.

4. **No API changes**
   - The new fields are UI-only for now; `saveFreightBilling` payload is untouched.

## Out of scope
- Backend integration / `record` payload changes.
- Changes to `ChargesBreakdownDialog` or provision/freight popup logic.
- Any other screen or styling changes outside this component.