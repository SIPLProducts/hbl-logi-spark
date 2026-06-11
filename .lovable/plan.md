## Shipment Details — Without SAP variant

Mirror the With SAP layout but adapt for Without SAP per the reference image.

### Changes

**`src/components/shipment-details-sap-create.tsx`**
- Add `mode?: "with" | "without"` prop (default `"with"`).
- When `mode === "without"`:
  - Hide the Invoice Number input + GET button (keep the Select dropdown + search input row).
  - Always render the fields section (no gated reveal, no helper hint).
  - In the top fields row, after Kilometres add a 4th field **DC Reference Number** (text input) — placed below as a second row item using the same grid.
- When `mode === "with"`: behavior unchanged.

**`src/routes/shipment-details.tsx`**
- Update `renderCreateBody` so outward + Without SAP also renders `<ShipmentDetailsSapCreate mode="without" />`. Outward + With SAP keeps `mode="with"`. Inward unchanged.

No other screens or business logic touched.
