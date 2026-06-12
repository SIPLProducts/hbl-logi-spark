## 1. Match SAP toggle to Outward pill (background + width)

The "Outward" pill (`PremiumRadio`) uses a compact, auto-width pill with `bg-accent/10` and no border. The current SAP toggle uses a wider `bg-muted` rounded container with `border-hairline`, a sliding white thumb, and `min-w-[96px]` per button — making it visually heavier and wider than Outward.

Update both SAP toggles to share Outward's look:

- `src/components/le-screen-shell.tsx` — `SapToggle` (around line 642) and `SearchSapToggle` (around line 713):
  - Container: replace `bg-muted border border-hairline shadow-inner` with `bg-accent/10` (drop border + inner shadow).
  - Sliding thumb: change `bg-surface ring-1 ring-hairline` to `bg-surface` only (subtle, no ring) so it blends like the Outward fill.
  - Buttons: remove `min-w-[96px]`, change `px-4 h-8` to `px-3 h-7` so width is content-driven and height matches the Outward pill.
- `src/routes/dispatch.tsx` — `SapToggle` (around line 388): apply the same three changes.

Text colors are unchanged. No other components reference these toggles.

## 2. Reduce height of Save / Save & Next / Save & Previous buttons

Footer action buttons currently render at `h-9` across all SAP-create panels and at `size="sm"` (h-8) in `dispatch.tsx`. Bring them all to `h-7` for a tighter, consistent footer.

Files (all use the same `inline-flex … px-4 h-9 …` pattern — change `h-9` → `h-7` and `px-4` → `px-3` on the Save / Save and Next / Save and Previous triad only):

- `src/components/vehicle-info-sap-create.tsx` (lines 423, 426, 429)
- `src/components/transit-info-sap-create.tsx` (lines 132–139)
- `src/components/transit-damage-info-sap-create.tsx` (lines 250–257)
- `src/components/insurance-claim-tracking-sap-create.tsx` (lines 287–294)
- `src/components/invoice-load-details-sap-create.tsx` (lines 384–391)
- `src/components/order-info-sap-create.tsx` (lines 206–213)
- `src/components/segment-info-sap-create.tsx` (lines 195–202)
- `src/components/shipment-details-sap-create.tsx` (lines 376–383)
- `src/components/service-level-sap-create.tsx` (Save triad in footer)
- `src/components/freight-billing-sap-create.tsx` (Save triad in footer)

In `src/routes/dispatch.tsx` (lines 368–380), change the Save and Save & Next `<Button size="sm" …>` to `size="xs"` equivalent by adding `h-7 px-3` overrides on the className (keeping the existing styling).

No color, label, icon, spacing-between, or layout changes outside height/padding. Colors of the buttons themselves remain as-is.