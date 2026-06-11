## Summary
Make the **Provision** and **Account** checkboxes mutually exclusive so that only one can be selected at a time.

## What will change
In `src/components/freight-billing-sap-create.tsx`, update the `onChange` handlers for both checkboxes:

- When **Provision** is checked → uncheck **Account** (`setAccount(false)`).
- When **Account** is checked → uncheck **Provision** (`setProvision(false)`).

This keeps the existing conditional field display logic intact: whichever checkbox is active will still reveal its associated fields (Provision Amount + Provision Date, or the four Account fields), while the other set collapses.

No other files are touched.