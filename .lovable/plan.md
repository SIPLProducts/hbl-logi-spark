# Self-contain the Segment Info screen

Mirror the approach already used for Shipment Details: inline everything the Segment Info route needs so it no longer imports `LeScreenShell` or `SegmentInfoSapCreate`.

## Scope
- File touched: `src/routes/segment-info.tsx` (only).
- No changes to `LeScreenShell`, `SegmentInfoSapCreate`, or any other screen.
- Existing files remain in place (other screens still use them); we simply stop importing them here.

## What goes into `src/routes/segment-info.tsx`
1. Route definition (unchanged export).
2. Inlined shell:
   - Sticky header with title, Refresh button, and the Create / Filter & Download tab strip.
   - Direction card (Inward / Outward radios) with the Pending / Completed count chips embedded, matching the current shared shell.
   - Progressive disclosure: on Outward, reveal the With SAP / Without SAP toggle; on With SAP, reveal the reference table, Invoice Number field, and the `#8f1e42` GET button; then reveal the field grid and Save / Save & Next / Save & Previous buttons.
   - Filter & Download tab reusing the same layout currently rendered by the shared shell.
   - Line items table section using the existing `segment-info` groups/rows definition.
3. Inlined SAP create body (current `SegmentInfoSapCreate`) with its selection table, lookup bar, 4-column field grid, and footer action buttons — Outward only, as today.
4. Local styling constants (`GREEN_INPUT`, `LABEL`, gradient header classes) copied in so no shared UI helpers beyond shadcn primitives and lucide icons are needed.

## Behaviour parity checklist
- Same title, tabs, direction gating, SAP gating, GET button color, table header gradient, and button heights as today.
- Same field list and line-items columns already defined in `segment-info.tsx`.
- Inward direction renders no create body (unchanged).
- No logic or visual regressions elsewhere — other routes keep using `LeScreenShell`.

## Out of scope
- Backend/service changes.
- Refactoring other screens to follow the same pattern.
