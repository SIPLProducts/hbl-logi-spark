## Freight Billing — SAP-style Create (with/without identical)

Mirror Order Info / Transit Info look & feel. Both modes share the same layout per reference.

### Changes

**New `src/components/freight-billing-sap-create.tsx`** (based on `transit-info-sap-create.tsx`):

- Status chips (Pending / Completed)
- Top selection table: Select / Sl.No / Reference Number / Work Order Number / LR Number / Transporter / Action
- Lookup bar: Select dropdown + search input + icon button (no Invoice Number + GET)
- Field grid (3 cols, always visible):
  - Invoice Number (text)
  - Transportation Type (text) — with two checkboxes **Provision** and **Account** rendered inline to the right of this field (same row, third column area)
  - Freight Bill upload (file)
  - Unloading Charges Approval (file)
  - Detention Charges Uploading (file)
  - Work Order Uploading (file)
- Footer: Save / Save and Next / Save and Previous
- Emerald `GREEN_INPUT` styling, `LABEL` class
- `mode?: "with" | "without"` prop accepted for parity; both render identically

**`src/routes/freight-billing.tsx`**:
- Wire `renderCreateBody={({ sap, direction }) => direction === "outward" ? <FreightBillingSapCreate mode={sap === "with" ? "with" : "without"} /> : null}`. Keep existing groups intact.

No business logic or other screens touched.
