## Reduce scrolling on Invoice Load Details — Filter & Download tab

### Objective
Make the Filter & Download section fit within the visible screen with minimal scrolling. Keep all existing CSS/design tokens in `src/styles.css` untouched — only adjust Tailwind utility classes already in use in the JSX.

### Scope
Single file: `src/routes/invoice-load-details.tsx`, inside the `InvoiceFilterDownload` component (lines ~1722–1786 for the filter card, ~1788–1866 for the empty/results container).

### Changes

1. **Compact the Filter Options card**
   - Header row: `px-5 py-4` → `px-4 py-2`.
   - Body grid: `p-4 … gap-x-4 gap-y-3` → `p-3 … gap-x-3 gap-y-2`.
   - Bump grid density on wide screens: `lg:grid-cols-3` → `lg:grid-cols-4 xl:grid-cols-6` so all 7 filter fields fit in ~2 rows on desktop, 1 row on wide.
   - Footer action bar: `px-4 py-3` → `px-3 py-2`.
   - Card rounding stays (`rounded-2xl`) — no token changes.

2. **Shrink the "Select With/Without SAP" placeholder**
   - `p-6` → `p-3`, text stays `text-[12px]`.

3. **Shrink the "No results yet" empty state**
   - Outer padding: `p-10` → `p-5`.
   - Icon circle: `size-12` → `size-9`, inner icon `size-5` → `size-4`.
   - Heading: `mt-4 text-lg` → `mt-2 text-sm`.
   - Helper text: `mt-1` → `mt-0.5`.

4. **Cap results table to available viewport instead of fixed 560px**
   - Both results tables (`Completed` at ~line 1810 and `Pending` at ~line 1878): `max-h-[560px]` → `max-h-[calc(100vh-320px)]`. Sticky header still works because the `overflow-x-auto` wrapper owns the scroll container.
   - Results card header padding: `px-5 py-3` → `px-4 py-2` on both blocks so the table area gets more vertical room.

5. **Tab container spacing**
   - `TabsContent value="search"` currently uses `mt-5 space-y-5` (line 2154). Change to `mt-2 space-y-2` so the filter card starts higher and the results card sits closer beneath it.

### Non-goals
- No edits to `src/styles.css`, theme tokens, or any global CSS.
- No changes to filter logic, payloads, download handlers, or the Create tab.
- No layout restructuring outside the two blocks above.

### Verification
- Build passes.
- On a standard desktop viewport (~1188×724 as in the current preview), the Filter Options card + action bar + either empty state or a short results list fit without page-level scroll; only the table body scrolls when rows exceed the capped height.
