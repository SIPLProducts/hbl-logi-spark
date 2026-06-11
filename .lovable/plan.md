## Transit Info — SAP-style Create with With/Without modes

Mirror Order Info's look and feel for the Transit Info screen. Both modes share the same layout (the without-SAP reference is identical to with-SAP).

### Changes

**New `src/components/transit-info-sap-create.tsx`** (based on `order-info-sap-create.tsx`):

- Status chips (Pending / Completed)
- Top selection table: Select / Sl.No / Reference Number / Work Order Number / LR Number / Transporter / Action (single editable row with green inputs)
- Lookup bar: Select dropdown + search input with search icon button (no Invoice Number + GET — per reference, the lookup row only shows the Select + search bar)
- Field grid (always visible) with these fields rendered via `SapField`:
  - Invoice Number (text)
  - Physical arrived at destination date (datetime-local)
  - Unloading date and time (datetime-local)
  - POD scan received date (date)
  - SIT/SALE (text — shown as plain input matching reference placeholder)
  - POD Scan (file input)
- `mode?: "with" | "without"` prop accepted for API parity with other screens; both modes render the same layout
- Footer: Save / Save and Next / Save and Previous (emerald / teal / amber)
- Emerald `GREEN_INPUT` styling, `LABEL` class, static demo data

**`src/routes/transit-info.tsx`**:
- Import `TransitInfoSapCreate` and wire `renderCreateBody={({ sap, direction }) => direction === "outward" ? <TransitInfoSapCreate mode={sap === "with" ? "with" : "without"} /> : null}`
- Keep existing read-only `groups` and `lineItems` intact for the non-create view

No business logic or other screens touched.
