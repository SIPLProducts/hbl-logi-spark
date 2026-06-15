# Optimize Dispatch creation table layout

Goal: Reduce excessive horizontal scrolling on the Dispatch → Create screen by tightening cell sizes, shortening headers, and letting the table fit the viewport while still allowing scroll only when truly needed.

## Changes (all in `src/routes/dispatch.tsx`)

1. **Reduce cell minimum widths** in helper cells:
   - `CellInput`: `min-w-[120px]` → `min-w-[80px]`
   - `CellNumber`: `min-w-[80px]` → `min-w-[56px]`, also `w-16` so number cells don't take a full flex share
   - `CellSelect`: default `minWidth` 140 → 110; reduce per-call values (160→130, 170→140, 150→125)
   - Inputs/selects height: `h-8` → `h-7` and padding `px-2`/`pl-2.5 pr-7` slimmed to match the rest of the app's compact tables

2. **Tighten table chrome**:
   - `<table>` cell padding `px-3 py-3` (header) → `px-2 py-2`; body `px-3 py-1.5` → `px-2 py-1`
   - Header font already `text-[10px]`; shorten labels: "No Of Trucks"→"Trucks", "No Of Invoices"→"Invoices", "Vendor Code"→"Vendor", "Load Points"→"Load Pts", "Unload Points"→"Unload Pts", "LR Number"→"LR No"
   - Add `table-fixed`-like behavior by removing `whitespace-nowrap` from header so long labels wrap if ever needed
   - Sl.No column `w-14` → `w-10`; action column `w-14` → `w-10`

3. **Card chrome compaction** so the table area gets more horizontal room:
   - Card header `px-5 py-4` → `px-3 py-2`
   - Card uses `rounded-xl` instead of `rounded-2xl` (matches other screens)

4. **Scroll container**: keep `overflow-x-auto` so very narrow viewports still scroll, but the new widths let the full table fit on typical desktop widths (≈1280+).

No behavior, data, or route changes — purely presentational tightening of the existing table.

## Files touched
- `src/routes/dispatch.tsx` (table markup + `CellInput`, `CellNumber`, `CellSelect` helpers)
