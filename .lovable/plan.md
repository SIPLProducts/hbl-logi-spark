## Dispatch — progressive disclosure flow

Make both Dispatch modes reveal content step-by-step instead of showing everything by default.

### 1. Create Dispatch (`CreateDispatch` in `src/routes/dispatch.tsx`)

Current: Outward is pre-selected, SAP toggle is always visible, and the editable Dispatch Lines table is always shown.

New flow:
- Initial state: only the **Direction** chooser is visible (Outward / Inward, both unselected).
- After the user picks Outward (or Inward) → reveal the **With SAP / Without SAP** toggle (no default selection).
- After the user picks With SAP or Without SAP → reveal the **Search Type + Search field + Search button** row AND the **Dispatch Lines** editable table + sticky Save / Save & Next footer.
- Each newly revealed section animates in (simple `animate-in fade-in slide-in-from-top-1`) and shows a subtle helper line above it (e.g. "Select SAP mode to continue").
- State: change `outward` to `"outward" | "inward" | null` (default `null`); change `sap` to `SapMode | null` (default `null`). Gate the search row + table on `sap !== null`.

### 2. Search Dispatch (`SearchDispatch` in `src/routes/dispatch.tsx`)

Current: Filter card with SAP toggle in header is always shown; all filter fields render immediately.

New flow:
- Initial state: Filter card header shows only the title and a **With SAP / Without SAP** chooser (no default). Body shows a small helper: "Select SAP mode to view filters."
- After the user picks With SAP or Without SAP → reveal the **filter fields grid** (From Date, To Date, Plant, Division, Transporter, Vehicle Type) and the **action footer** (Reset, Download PDF, Download Excel, Apply Filter).
- Results area below the filter card is unchanged: empty-state until Apply Filter is clicked, then `ResultsTable`.
- State: change `sap` to `SapMode | null` (default `null`). Gate the fields grid + footer on `sap !== null`. Reset also clears `sap` back to `null`.

### Out of scope
- No changes to table columns, mock data, styling tokens, header, tabs, or `ResultsTable`.
- No changes to other screens or shared shell.

### Technical notes
- Only `src/routes/dispatch.tsx` changes.
- Keep all existing handlers, columns, and components; only gate rendering and adjust two `useState` initial values + types.
