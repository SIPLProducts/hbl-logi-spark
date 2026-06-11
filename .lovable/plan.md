## Goal
Give Transit Damage Info the same create-screen design as Order Info (status chips → reference table → invoice/DC lookup bar → GET-gated field grid → footer actions). With SAP uses "Invoice Number"; Without SAP swaps that label to "DC Reference Number". Match the fields shown in the two reference screenshots.

## Files

### 1. New: `src/components/transit-damage-info-sap-create.tsx`
Clone the structure of `order-info-sap-create.tsx`:
- Status chips: add a third chip "No. of Cases Reported: 0" (indigo/violet) before Pending and Completed.
- Reference table columns: Select, Sl.No, **Map ID**, Reference Number, Work Order Number, LR Number, Transporter, Action. With-SAP seed row: Map ID `101`, Ref `1000000001`, LR `1234`, checkbox checked. Without-SAP: empty placeholders, unchecked.
- Lookup bar:
  - With SAP: label "Invoice Number" + GET button (gates field reveal), then Select dropdown + search input with magnifier.
  - Without SAP: label "DC Reference Number" + GET button (gates reveal), then Select dropdown + search input with magnifier.
  - Same narrow-width treatment as recently applied (compact input).
- Field grid (3-col, emerald inputs) — both modes show the same fields, matching screenshots:
  - Invoice Date (date), FSR Report Date (date), Invoice Basic Value (text)
  - Incident Date (date), Customer (text), C/nee Name (text)
  - Damage Remarks (select: "Select Damage Remarks", options TBD basic list), Settlement (select: "Select Settlement"), Closing Date (date)
  - Images (file), FSR Report (file), FIR Report (file)
  - COF (file) — spans 1 col on its own row
- Bottom secondary table: columns Select, Sl.No, Map ID (select default "101" with-sap / "Select" without-sap), Vehicle Number, LR Number, Transporter, Action (green + and red ×).
- Footer: Save / Save and Next / Save and Previous (same gradient buttons as Order Info).

### 2. Edit: `src/routes/transit-damage-info.tsx`
- Add `renderCreateBody={({ sap, direction }) => direction === "outward" ? <TransitDamageInfoSapCreate mode={sap === "with" ? "with" : "without"} /> : null}` to the `LeScreenShell`.
- Keep existing `groups` for the read view.

## Result
Transit Damage Info create flow visually matches Order Info (chips, table, lookup, emerald field grid, footer) with the damage-specific fields and the with/without-SAP label swap (Invoice Number ↔ DC Reference Number).
