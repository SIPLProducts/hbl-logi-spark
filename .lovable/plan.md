## Vehicle Info — SAP-style Create with With/Without modes

Mirror Order Info's look and feel for the Vehicle Info screen with a second dynamic detail table.

### Changes

**New `src/components/vehicle-info-sap-create.tsx`** (based on `invoice-load-details-sap-create.tsx` + `order-info-sap-create.tsx`):

- Status chips (Pending / Completed)
- Top selection table: Select / Sl.No / Map ID / Reference Number / Work Order Number / LR Number / Transporter / Action
- Lookup bar:
  - `with` mode: Invoice Number input + GET button + Select dropdown + search input (gated reveal)
  - `without` mode: hide Invoice Number + GET; always reveal; add a full-width **DC Reference Number** field below the lookup row
- Second dynamic vehicle details table with columns:
  Select / Sl.No / Map ID / Type of Shipment / Type of transporter / LR No / Type of Vehicle / Passing Weight (Tons) / Volume of Truck / Vehicle Number / No of Vehicles / Driver Name / Driver Mobile No / salesperson E-mail ID / Customer e-mail ID / GPS live location / Action (+ / ×)
- `+` adds a row, `×` deletes that row (same pattern as invoice-load-details-sap-create)
- Footer: Save / Save and Next / Save and Previous
- Emerald `GREEN_INPUT` styling, `LABEL` class, static demo data

**`src/routes/vehicle-info.tsx`**:
- Wire `LeScreenShell` to render the new component via `renderCreateBody` for outward direction, passing `mode={sap === "with" ? "with" : "without"}`. Keep existing read-only `groups` intact for the non-create view.

No business logic or other screens touched.
