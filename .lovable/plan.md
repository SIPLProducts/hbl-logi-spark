# Progressive disclosure for Create tab — Order Info → Insurance Claim Tracking

All 10 affected screens (Order Info, Shipment Details, Invoice Load Details, Segment Info, Vehicle Info, Transit Info, Freight Billing, Service Level, Transit Damage Info, Insurance Claim Tracking) render through the shared `LeScreenShell` Create tab. The Reference Table + Invoice Number + GET button is already implemented inside each `*-sap-create.tsx` component for `mode="with"`. Today the shell defaults `direction="outward"` and `sap="with"`, so everything appears immediately and there's no step-by-step reveal like the Dispatch screen.

## Single file to change: `src/components/le-screen-shell.tsx`

1. **State init**
   - `direction` — change type to `"outward" | "inward" | null`, initial `null`.
   - `sap` — change type to `SapMode | null`, initial `null`.

2. **Direction + SAP toolbar** (currently around lines 207–238)
   - Always show the `Outward` PremiumRadio.
   - Show `SapToggle` only when `direction` is set (mirror Dispatch's `{direction && (...)}` block).
   - Keep status pills (`Pending` / `Completed`) and `renderDirectionExtras` aligned to the right as today.
   - Add small muted hints (same wording as Dispatch):
     - `!direction` → "Select a direction to continue."
     - `direction && !sap` → "Select **With SAP** or **Without SAP** to continue."

3. **Body rendering**
   - Wrap the `renderCreateBody` IIFE (around line 240) so it only runs when both `direction` and `sap` are set. When either is null, render nothing in the body area.
   - The default `kpis`/`topFields`/`groups`/`lineItems` fallback block should also be gated the same way (only when both are set), so screens without a custom `renderCreateBody` behave consistently.
   - The sticky action bar (Save / Save and Next) stays gated on the same condition.

4. **Callback types**
   - Update `renderCreateBody` and `renderDirectionExtras` prop signatures so `sap` and `direction` are the non-null narrowed types at call time (we only invoke them inside the `direction && sap` branch, so the existing `SapMode` / `"outward" | "inward"` types stay correct — no caller changes needed).

## Out of scope

- No changes to the 10 route files or the 10 `*-sap-create.tsx` components — the With-SAP screens already render the Reference Table + Invoice Number + GET internally.
- No changes to the Filter & Download (search) tab.
- No change to Dispatch screen — it already does this and is the reference.
