## Segment Info — SAP-style Create with With/Without modes

Mirror Order Info's look and feel for the Segment Info screen.

### Changes

**New `src/components/segment-info-sap-create.tsx`** (based on `order-info-sap-create.tsx`):
- Status chips (Pending / Completed)
- Selection table: Select / Sl.No / Reference Number / Work Order Number / LR Number / Transporter / Action
- Lookup bar
- Field grid with these fields (from reference):
  - Sales Person (select)
  - Segment (select)
  - Application Type (select)
  - Customer Profile
  - Branch (select)
  - Branch Zone
  - Destination State
  - Destination Zone
  - TAT Type (select)
  - TAT (Days) (number)
  - ETA (date)
- Footer: Save / Save and Next / Save and Previous
- `mode?: "with" | "without"` prop:
  - `with`: show Invoice Number input + GET button; gated reveal of fields
  - `without`: hide Invoice Number + GET; always reveal; add an **Invoice Number** field as the first field in the grid (before Sales Person)

**`src/routes/segment-info.tsx`**:
- Wire `LeScreenShell` to render the new component via `renderCreateBody` for outward direction, passing `mode={sap === "with" ? "with" : "without"}`. Keep existing read-only `groups`/`lineItems` intact.

No business logic or other screens touched.
