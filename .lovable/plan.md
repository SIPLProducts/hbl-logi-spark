## Shipment Details — Add/Delete Line Items

Make the **Line Items** table (second table) in `shipment-details-sap-create.tsx` dynamic by wiring the **+** and **×** action buttons.

### Changes

**`src/components/shipment-details-sap-create.tsx`**
- Replace the single hardcoded `<tr>` row with an array of line-item objects in state.
- Each line item tracks its own `checked` flag and field values.
- **+ button**: appends a new empty line item to the array.
- **× button**: removes that specific row from the array.
- Re-render the `<tbody>` by mapping over the line-items array so Sl.No auto-updates.

No other screens or business logic touched.