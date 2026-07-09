## Add Incoterms field to Order Info screen

Port the Incoterms dropdown from `src/components/shipment-details-sap-create.tsx` into `src/components/order-info-sap-create.tsx`, styled with a yellow theme.

### Changes to `src/components/order-info-sap-create.tsx`

1. **State + data**
   - Add `incotermsList` state (`any[]`).
   - Add `zinco` state (selected Incoterm code).
   - Add `Incoterms` to `FormState`, `EMPTY_FORM`, and any reset/save payload path so it persists like other fields.
   - Add `fetchIncoterms()` calling `service.Incoterms({ INCO1: "", BEZEI: "" })` and invoke it in a `useEffect` on mount (same pattern used in Shipment Details).

2. **Yellow field style constant**
   Add a new style near the other `INPUT_*` constants:
   ```
   const INPUT_YELLOW =
     "h-7 w-full rounded-md bg-yellow-50 border-2 border-yellow-400 px-2 text-[12px] text-yellow-900 font-semibold outline-none focus:border-yellow-500 focus:ring-2 focus:ring-yellow-300";
   ```
   Use a matching yellow label class for just this field (e.g. `text-yellow-700 font-semibold`).

3. **Render the field**
   Add an Incoterms cell inside the existing form grid (placed alongside the other top-row selects so it flows naturally in the 4-col layout):
   - In SAP mode: `<input value={zinco} readOnly className={INPUT_YELLOW} />`
   - In Non-SAP mode: `<select>` populated from `incotermsList`, options rendered as `{INCO1} - {BEZEI}`, using `INPUT_YELLOW`.
   - `onChange` updates both `zinco` and `form.Incoterms`.

4. **No changes** to Shipment Details, routing, or business logic elsewhere. Incoterms remains in Shipment Details as-is (the request is to also put it in Order Info, not to move it).

### Notes
- Reuses the existing `service.Incoterms` API already imported via `generalservice_service.js` — no new dependencies.
- Only presentation + a single new field; no schema, routing, or backend changes.
