## Dispatch screen alignment with Order Info

All changes are scoped to `src/routes/dispatch.tsx`. No business logic changes.

### 1. Header bar — move Tabs + Refresh together, remove Export

Replace the current top header block (lines ~68–110) and the standalone `<TabsList>` block (lines ~115–128) with the Order Info pattern:

- Wrap the page in `<Tabs>` so the `TabsList` can live in the header.
- In the sticky header right-side cluster, render in this order:
  - Compact `TabsList` with `Create` and `Search & Reports` triggers (same compact styling as `le-screen-shell.tsx` lines 177–190: `h-7`, `px-2 py-0.5`, `text-[11px]`).
  - A `h-5 w-px bg-hairline` divider.
  - The existing `Refresh` button, restyled to the compact pill used in `le-screen-shell` (lines 192–197).
- Delete the `Export` button entirely (and the unused `Download` import).
- Drop the now-redundant large `TabsList` that previously sat above the tab content.

### 2. Direction card — match Order Info sizing

Replace the Create tab's `Toolbar` block (lines ~159–225) with the same compact Direction strip used in `le-screen-shell.tsx` (lines 207–238):

- Container: `bg-surface border border-hairline rounded-lg px-2.5 py-1.5 shadow-soft` (instead of `rounded-2xl p-5 shadow-elegant`).
- Inline row: `Direction` label → `PremiumRadio Outward` → vertical divider → `SapToggle` → (when `sap` is set) the search-type `Select` + search `Input` + `Search` button, all at `h-7`/`text-[11px]` to match Order Info density.
- Keep the existing state (`direction`, `sap`, `searchType`, `searchValue`) and handlers; only the markup/classes change.
- Keep the helper hint text but tighten to `text-[11px]` and `mt-1.5`.

`PremiumRadio` is already exported from `le-screen-shell` patterns — reuse the local copy already present further down in `dispatch.tsx` (no new component needed).

### 3. Table header color

Both tables in `dispatch.tsx` currently use `bg-surface-2/80` / `bg-muted/70` headers:

- Create-tab editable table `<thead>` at line 247.
- Search-tab results `<thead>` at line 795.

Update both `<thead>`'s `<tr>` to match the shared `DataTable` style (`src/components/data-table.tsx` line 39):

```
className="bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground border-b border-hairline"
```

Remove the now-conflicting `text-muted-foreground` on the header `<tr>` and drop the `backdrop-blur` on `<thead>` so the solid primary color reads cleanly. Sticky behavior (`sticky top-0 z-10`) stays.

### 4. Cleanup

- Remove unused imports after the edits (`Download`, possibly `FileDown` if it becomes unused).
- No changes to `Save` / `Save & Next` footer, mock data, or any other route.

### Verification

After edits, load `/dispatch` in the preview and confirm:
- Header shows: title · (right) Create / Search&Reports tabs · divider · Refresh. No Export.
- Direction card is the slim Order-Info style strip.
- Both tables render with the blue primary-colored header row.
