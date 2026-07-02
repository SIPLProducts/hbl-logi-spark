## Goal
In the "Detailed Freight Charges Input" popup: reset all inputs whenever the user switches between RCM/FCM, and include the GST Amount (FCM) in the final Freight Charges value shown on the form.

## Scope
Single file: `src/components/freight-billing-sap-create.tsx`

## Changes

1. **Reset on RCM/FCM toggle** (inside `ChargesBreakdownDialog`)
   - When the user clicks the RCM or FCM radio, reset `draft` to an empty `Breakdown` (all zeroes via `BREAKDOWN_FIELDS`) and reset `gstAmount` to `0`.
   - Applies in both directions (RCM→FCM and FCM→RCM).

2. **Include GST in Freight Charges** (Save handler)
   - In the dialog's Save button, compute `finalTotal = taxMode === "FCM" ? total + gstAmount : total` and pass that as the `total` argument to `onSave`.
   - Update the on-screen "Grand Total" line to reflect this same value (already correct).
   - Parent `onSave` for the freight dialog already assigns `total` to `setFreightTotal`, so the "Freight Charges" input will automatically show the GST-inclusive value.

3. **Persist tax mode state consistency**
   - Keep passing `{ taxMode, gstAmount }` via `extra` so parent state (`freightTaxMode`, `freightGstAmount`) stays in sync for re-opens.

## Out of scope
- Any changes to other dialogs (provision/account) — `showTaxMode` is only enabled for freight.
- Backend payload changes.
- Styling changes.
