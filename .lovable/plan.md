## Invoice Load Details — SAP-style Create with With/Without modes

Mirror Shipment Details' look-and-feel for Invoice Load Details, matching the reference screenshots.

### Changes

**New `src/components/invoice-load-details-sap-create.tsx`**
Same layout as `shipment-details-sap-create.tsx`:
- Status chips (Pending / Completed)
- Selection table: Select / Sl.No / Map ID / Reference Number / Work Order Number / LR Number / Transporter / Action
- Lookup bar
- Second table ("Load details") with columns from the reference:
  Select · Sl.No · Map ID · Truck Type · Passing Weight (Tons) · Actual Load (Tons) · Loading factor % (w.r.t weight) · Actual Volume Occupied · Loading Factor w.r.t Volume · Week Wise Shipment Flow · Eway Bill Number · Eway Bill Expiry Date · Action (+ / ×)
- Footer: Save / Save and Next / Save and Previous
- `mode?: "with" | "without"` prop:
  - `with`: show Invoice Number input + GET button; gated reveal of the load-details section
  - `without`: hide Invoice Number + GET; always reveal; add a **DC Reference Number** field under the lookup bar
- Dynamic row add/delete via + and × in the Action column (same pattern just added to shipment)

**`src/routes/invoice-load-details.tsx`**
- Wire `LeScreenShell` to render the new component via `renderCreateBody` for outward direction, passing `mode={sap === "with" ? "with" : "without"}`. Keep existing `groups` for the read-only display.

No business logic or other screens touched.