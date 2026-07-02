## Goal
Add RCM/FCM tax mode selection inside the "Detailed Freight Charges Input" popup on the Freight Billing screen, with a conditional GST Amount field and separate GST total when FCM is chosen.

## Scope
Single file: `src/components/freight-billing-sap-create.tsx` — specifically the `ChargesBreakdownDialog` component and its invocation for the freight charges dialog.

## Changes

1. **Radio group at top of dialog**
   - Add two radio buttons (RCM / FCM) inside `ChargesBreakdownDialog`, rendered above the existing 4-column field grid.
   - Local state `taxMode: "RCM" | "FCM"`, default `"RCM"`.
   - Only expose this UI when the dialog is used for freight charges (pass a new prop `showTaxMode?: boolean` so the provision popup is unaffected).

2. **Conditional GST Amount field (FCM only)**
   - When `taxMode === "FCM"`, render an extra numeric input labelled "GST Amount" inside the same grid, using the existing `GREEN_INPUT` / `LABEL` styles.
   - Store it in a separate `gstAmount` state (not inside the existing `Breakdown` object) so the base breakdown math is untouched.
   - When switching back to RCM, reset `gstAmount` to 0.

3. **Totals display**
   - Keep the existing `{totalLabel}: {total}` line unchanged (base freight total continues to exclude GST for both modes).
   - When FCM is active, render an additional line directly below it: `GST Amount: {gstAmount}` and `Grand Total: {total + gstAmount}`.

4. **Save wiring**
   - Extend `onSave` signature to optionally pass `{ taxMode, gstAmount }` back to the parent when `showTaxMode` is on.
   - In `FreightBillingSapCreate`, store `freightTaxMode` and `freightGstAmount` state; update them from the freight dialog's `onSave` callback. No changes to provision dialog behaviour.
   - No changes to the API payload in `saveFreightBilling` (kept out of scope since user only asked for UI display).

## Out of scope
- Provision Amount popup (unchanged).
- Backend `record` fields sent to `service.FreightBillingSave` / `FreightBillingNonSap`.
- Any styling changes outside the popup.
