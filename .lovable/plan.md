Restructure the Dispatch Order Filter card layout in `src/routes/dispatch-orders.tsx`:

1. **Top row** — replace the current 4-column grid with a row containing only the inputs and status chips:
   - From Date input
   - To Date input
   - Pending and Completed chips side-by-side in a single flex group (same row, horizontally adjacent)

2. **Bottom row** — add a new flex row below, right-aligned, containing:
   - Clear Filters button
   - Execute Report button
   (both horizontally aligned at the bottom-right of the filter card)

No changes to behavior, colors, or button styles — only layout repositioning.