# Plan: Strip Gate In & Out Process to design-only

## Scope
Rewrite `src/routes/gate-in-out-process.tsx` so it keeps only the visual structure/layout — no API calls, no data fetching, no mock-data wiring, no colored status/state styling.

## Changes to `src/routes/gate-in-out-process.tsx`
1. Remove all imports and usages of:
   - `sapExternalApi` / `backendNodejs` / any service in `src/services/*`
   - `le-mock-data`, dispatch mocks, or any data source
   - `useQuery`, `useMutation`, `useEffect`-based fetching, and loader data
2. Remove all handler logic (GET, Save, Save & Next, Delete, fetchInvoiceList, etc.) — replace with no-op buttons.
3. Remove colored styling:
   - Drop `bg-gradient-primary`, `bg-primary`, amber/emerald status chip colors, `#8f1e42` GET button color, and any `bg-*`/`text-*` color utilities on containers, chips, buttons, table header.
   - Keep only neutral defaults (`border`, `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`).
4. Keep intact (design only):
   - `LeScreenShell` wrapper with Outward radio, With/Without SAP toggle, Reference Table + Invoice Number + Get row
   - Tabs (Create / Filter & Download)
   - Form field grid layout (4 cols)
   - Table structure (headers + empty rows)
   - Save / Save & Next / Save & Previous button row
5. All inputs/selects rendered as empty static fields; table renders 1 empty row.

## Out of scope
- No changes to `LeScreenShell`, sidebar, routing, or other screens.
- No new files.

## Technical notes
- Route export and component name (`GateInOutProcessPage`) remain unchanged.
- File becomes a pure presentational component with local `useState` only where needed to keep controlled inputs from throwing React warnings.
