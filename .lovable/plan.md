## Goal

Make **Shipment Details → With SAP (outward)** match the look-and-feel of the Order Info With SAP screen shown in the reference image:

- Status chips (Pending / Completed)
- Selection table (Select, Sl.No, Map ID, Reference Number, Work Order Number, LR Number, Transporter, Action)
- Invoice lookup bar: **Invoice Number** input + **GET** button + Select dropdown + Search input
- After GET: reveal the **Incoterms / Insurance Scope / Kilometres** row and the **Line Items** table
- Footer actions: Save / Save and Next / Save and Previous

Without SAP and other tabs remain untouched.

## Scope

- New component: `src/components/shipment-details-sap-create.tsx` — encapsulates the entire Shipment Details "With SAP" create body (mirrors `OrderInfoSapCreate`, but with shipment-specific columns + line items + Map ID column in the selection table).
- `src/routes/shipment-details.tsx` — pass `renderCreateBody` to `LeScreenShell` that returns `<ShipmentDetailsSapCreate />` when `sap === "with"` and `direction === "outward"`; otherwise return `null` (fallback to existing default rendering using current `topFields` + `lineItems`).

No other screens, routes, or shared components change.

## Changes

### 1. New: `src/components/shipment-details-sap-create.tsx`

Adapted from `OrderInfoSapCreate`. Structure:

1. Status chips (Pending: 0 / Completed: 1) — same as Order Info.
2. **Selection table** with columns: Select | Sl.No | **Map ID** | Reference Number | Work Order Number | LR Number | Transporter | Action. One sample row (Map ID `101`, Reference `1000000001`, LR `1234`, empty Work Order / Transporter placeholders).
3. **Invoice lookup bar** (single card): Invoice Number input + green GET button + Select dropdown (Reference / Invoice / ODN / SO Number / Work Order / LR Number) + search input with icon button. Identical styles to Order Info.
4. State: `invoiceNumber`, `revealed`. GET disabled while empty; clicking sets `revealed = true`.
5. Empty-state hint when `!revealed`: "Enter an Invoice Number and click GET to load fields."
6. When `revealed`:
   - **Top fields row** (3 cols on lg): Incoterms (select: FOR / FOB / CIF / EXW / DAP), Insurance Scope (select: Buyer / Transit Insurance / Open Policy / Self Insured), Kilometres (number).
   - **Line Items table** card with header row + one empty row containing: checkbox, Sl.No (1), Map ID (select), Product (select), Type of Material (select), Material Description (text), No of Sets/No (Qty) (number), Ah Loaded (text), Shipment Weight (kg) (number, default 0), Battery Condition (select), Action (green + / red ×).
   - Footer action bar: Save (green), Save and Next (teal), Save and Previous (amber) — same styling as Order Info footer.

All inputs use the same `GREEN_INPUT` + `LABEL` classes used in `OrderInfoSapCreate`.

### 2. `src/routes/shipment-details.tsx`

Add import and wire renderer:

```tsx
import { ShipmentDetailsSapCreate } from "@/components/shipment-details-sap-create";

<LeScreenShell
  title="Shipment Details"
  columns={columns}
  topFields={[...]}      // kept for Without SAP / Inward fallback
  lineItems={{...}}      // kept for fallback
  renderCreateBody={({ sap, direction }) =>
    direction === "outward" && sap === "with"
      ? <ShipmentDetailsSapCreate />
      : null
  }
/>
```

Inward and Without SAP keep existing `LeScreenShell` default rendering.

## Result

- Shipment Details → Outward → With SAP: identical visual language to Order Info With SAP — status chips, selection table (with Map ID), Invoice + GET lookup bar, gated reveal of Incoterms/Insurance/Kilometres + Line Items table, matching footer buttons.
- Other modes/tabs unchanged.
