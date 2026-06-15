Replace the three dropdown fields for **Type of Shipment**, **Type of transporter**, and **Type of Vehicle** in the vehicle details table with plain `<input>` text fields.

### Changes
1. **Remove unused constants** `SHIPMENT_TYPES`, `TRANSPORTER_TYPES`, and `VEHICLE_TYPES` from `src/components/vehicle-info-sap-create.tsx`.
2. **Replace `<select>` blocks** for `shipmentType`, `transporterType`, and `vehicleType` with `<input>` blocks matching the existing plain input style (like the LR No field), keeping the `onChange` handlers and `value` binding intact.
3. **Clean up any now-unused imports** if applicable.

### File affected
- `src/components/vehicle-info-sap-create.tsx`