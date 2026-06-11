## Goal

On Order Info → **Without SAP** (outward), show the same SAP-style layout used for With SAP, but:
- Remove the Invoice Number input and GET button (and the empty-state hint / reveal gating).
- Rename the first field **Tax Invoice** → **DC Reference Number**.
- Fields are visible immediately (no GET gate).

Selection table, search-type dropdown + search input remain (same as With SAP). All other fields stay identical and empty.

## Scope

- `src/components/order-info-sap-create.tsx` — refactor to accept a `mode: "with" | "without"` prop and conditionally render the Invoice Number + GET block and the reveal gating.
- `src/routes/order-info.tsx` — wire the component for `sap === "without"` as well, passing the mode.

No other screens or routes are affected.

## Changes

### 1. `src/components/order-info-sap-create.tsx`

- Add prop: `export function OrderInfoSapCreate({ mode = "with" }: { mode?: "with" | "without" })`.
- Compute `const isWithout = mode === "without"`.
- `FIELDS[0].label` stays "Tax Invoice" in the array; when rendering, if `isWithout`, replace the first field's label with **"DC Reference Number"** (map over FIELDS and override label for index 0 when `isWithout`).
- Invoice lookup bar block (the `<div>` containing Invoice Number input + GET button + Select + Search): wrap in `{!isWithout && (...) }`.
- Empty-state hint paragraph: wrap in `{!isWithout && !revealed && ...}`.
- Reveal gating: when `isWithout`, force fields + footer to always render. Implement via `const showFields = isWithout || revealed;` and use `{showFields && (<>...field grid + footer...</>)}`.
- Keep the selection table and the (now-standalone for Without SAP) Search bar untouched. Note: for With SAP the Search dropdown + search input live inside the lookup bar; for Without SAP we still want them visible. Approach: split the lookup bar into two rows/blocks — (a) Invoice Number + GET (with-only), (b) Select dropdown + Search input (always shown). Both stay inside one card for visual consistency; if `isWithout`, the card only contains row (b).

### 2. `src/routes/order-info.tsx`

Change the `renderCreateBody` to:

```tsx
renderCreateBody={({ sap, direction }) =>
  direction === "outward"
    ? <OrderInfoSapCreate mode={sap === "with" ? "with" : "without"} />
    : null
}
```

Inward behavior is unchanged (falls back to default group rendering).

## Result

- With SAP (outward): unchanged behavior — Invoice Number + GET gate fields, first field labeled "Tax Invoice".
- Without SAP (outward): same visual layout, no Invoice Number / GET, fields visible immediately, first field labeled "DC Reference Number".
- Inward and other screens unchanged.
