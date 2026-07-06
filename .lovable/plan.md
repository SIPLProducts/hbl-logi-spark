## Problem

On the Invoice Load Details screen, when scrolling the results table body, the rows appear to "overlap" the sticky header. This happens because the tables use `border-collapse` with the gradient background applied to the `<tr>` inside the sticky `<thead>`. With collapsed borders, browsers don't reliably paint the row background on the sticky header, so scrolling rows show through.

## Fix (visual only, no logic changes)

In `src/routes/invoice-load-details.tsx`, for each results table (Completed table around line 1811 and Pending table around line 1879):

1. Move the `bg-gradient-primary` background from the header `<tr>` onto each `<th>` cell so the sticky cells paint their own opaque gradient background while scrolling.
2. Keep `sticky top-0 z-30` on the `<thead>` and add `shadow-soft` under the header cells so the boundary reads cleanly against scrolling rows.
3. Leave everything else — column list, classes, ordering, data, filter/download logic — untouched.

No changes to the filter card, buttons, state, services, exports, or the other tables/routes.
