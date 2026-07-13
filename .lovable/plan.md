## Add radio option groups to two report screens

### 1. `src/routes/reports.business-share-matrix.tsx`
Inside the filters card, below the filter grid and above the Reset/Export XLS button row, add a horizontal group of 4 radio buttons (name=`view-mode`) with default selection on "All Records":
- All Records
- Header
- Header with Plant
- Header with Inward/Outward

Styling: small radio inputs paired with `text-[12.5px]` labels, using the app's `accent`/primary color, laid out with `flex flex-wrap gap-x-5 gap-y-2` and a top border/padding separator (`border-t border-hairline pt-4 mt-4`) to visually separate from filters.

### 2. `src/routes/reports.service-level-report.tsx`
Same treatment — add a group of 2 radio buttons (name=`report-mode`) in the same position, default "Detailed":
- Detailed
- Summary for Audit

### Out of scope
- No new export logic, no state wiring beyond native `defaultChecked` — purely a UI addition.
- No changes to other report screens.
