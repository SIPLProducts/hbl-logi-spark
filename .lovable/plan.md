## Add Insurance Scope + Kilometres to Gate In/Out screen

Add two new fields into `src/routes/gate-in-out-process.tsx`, placed right after the existing E-Way Bill fields block (~line 1161).

### Changes in `src/routes/gate-in-out-process.tsx`

1. **State** — add alongside the existing `eway*` state (~line 910):
   ```ts
   const [insuranceScope, setInsuranceScope] = useState("");
   const [kilometres, setKilometres] = useState("");
   ```

2. **Constant** — add near the top of the file (module scope), mirroring Shipment Details:
   ```ts
   const INSURANCE_SCOPE = ["Buyer", "Supplier"];
   ```

3. **Render** — inside the same card that holds the E-Way Bill fields (the `grid ... lg:grid-cols-4` at line 1126), append two grid cells after the E-Way Bill Expire Date cell so the 4-column flow stays intact:

   - **Insurance Scope** — `<select>` using `INSURANCE_SCOPE` options, styled with the same class already used for the E-way applicable select (`h-7 w-full rounded-md border border-input …`) and wrapped in `<Label>` like the neighbours.
   - **Kilometres** — `<Input type="number" placeholder="0" />` bound to `kilometres`.

   Both cells always visible (not gated by the E-Way "Yes" toggle) so they appear on load, immediately after the E-way section.

### Out of scope
- No changes to Shipment Details (fields remain there too).
- No table/column edits, no persistence/API wiring — matches how the sibling `eway*` fields are currently kept in local state only.
