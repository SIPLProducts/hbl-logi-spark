Restyle only the Filter Options card JSX inside `InvoiceFilterDownload` in `src/routes/invoice-load-details.tsx` so it visually matches the uploaded reference. No logic, state, service, or export changes.

## Scope
File: `src/routes/invoice-load-details.tsx` — the Filter Options card block (~lines 1691–1743). Results tables (Completed / Pending) and helper functions stay untouched.

## Visual changes to mirror the reference image

1. Filter card header
   - Keep the funnel icon + "Filter Options" title on the left.
   - Add a pill-style "With SAP / Without SAP" toggle on the right side of the header, matching the geometry used elsewhere (rounded-full pill, `h-7`, thumb `w-1/2`, gradient-primary on active half). It reads/writes the same SAP mode state already exposed via `LeScreenShell` context — no new state, no new logic. If wiring through context is not trivial without touching logic, render a visual-only pill mirroring the current mode (read-only display) so the header matches the reference.
   - Card corners: keep `rounded-2xl`, header uses subtle `bg-surface-2/60` divider as today.

2. Filter fields grid
   - Keep the existing 3-column grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) and current fields in the same order: From Date, To Date, Plant, Division, Transporter, Vehicle Type, Status.
   - Increase vertical spacing between rows slightly to match reference (`gap-x-4 gap-y-3`).
   - Ensure each field uses the standard `h-9` rounded input styling already used in Order Info (labels uppercase, tracked, muted-foreground; inputs with calendar/chevron icons).

3. Action row
   - Keep Reset / Download PDF / Download Excel / Apply Filter buttons and their handlers unchanged. Only align to the same spacing as reference (right-aligned, `gap-2`).

4. Results tables
   - No changes. Leave Completed and Pending table blocks exactly as they are.

## Out of scope
- No changes to `applyFilter`, `downloadExcel`, `downloadPDF`, `reset`, state, service imports, payload shapes, or any other component/tab.
- No changes to `LeScreenShell` behavior; if the reference's header SAP pill cannot be wired to the existing SAP toggle without touching logic, it renders as a visual mirror of the current mode only.

## Verification
- `tsgo` typecheck passes.
- Visual check on `/invoice-load-details` → Filter & Download tab: header now shows the SAP pill on the right, fields match the reference spacing, empty and populated states render unchanged.
