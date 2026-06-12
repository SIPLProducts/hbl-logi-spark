## Goal
Restyle every data table so its header bar uses the same deep navy as the Create button (the `bg-gradient-primary` token), and tighten body row spacing for a denser, more scannable feel. Applies app-wide via shared table primitives + the two inline tables inside `le-screen-shell`.

## Changes

### 1. `src/components/ui/table.tsx` (shadcn primitive — used across reports, data-table, etc.)
- `TableHeader`: add navy background + sticky styling
  - `[&_tr]:border-b` → `[&_tr]:border-b [&_tr]:border-primary/40 bg-gradient-primary text-primary-foreground`
- `TableHead`:
  - text color: `text-muted-foreground` → `text-primary-foreground/90`
  - keep `h-7 px-1.5 text-[11px] font-semibold uppercase tracking-wide`
- `TableCell`: tighten body density
  - `px-1.5 py-1` → `px-1.5 py-0.5 leading-tight`
- `TableRow`: keep hover state, but lower the base row separator so dense rows don't look heavy
  - `border-b` → `border-b border-hairline/60`

### 2. `src/components/le-screen-shell.tsx` (raw `<table>` markup used on /order-info, /dispatch, etc.)
Two inline tables — **Line Items** (~line 277) and **Search Results** (~line 440). For each:
- `<thead> <tr>` background: `bg-surface-2/80 text-muted-foreground` → `bg-gradient-primary text-primary-foreground` (keep `text-[10px] font-bold uppercase tracking-[0.12em]` / `tracking-[0.14em]`, drop the `border-b border-hairline` since the colored header already separates).
- `<th>` cells: remove the muted color override; padding stays.
- Body `<td>` padding tightened:
  - Line Items: `px-2 py-1` → `px-2 py-0.5`
  - Search Results: `px-3 py-2.5` → `px-2 py-1` (header `px-3 py-3` → `px-2 py-1.5` to match).
- Action-icon buttons in results table: shrink from `size-7` → `size-6` so the row can compress without clipping the hover targets.

### 3. `src/components/data-table.tsx`
Quick read-through to confirm it composes the shadcn primitives (no bespoke header markup). If it renders its own `<thead>` styling, mirror the navy header + tightened padding there too. No other behavior changes.

## Out of scope
- No color-token edits in `styles.css` — we reuse the existing `--gradient-primary` so light/dark themes both work.
- No changes to KPI tiles, cards, forms, sidebar, top bar, or login.
- No data, route, or business-logic changes.

## Verification
- `/order-info` Search & Reports tab → results table header is navy, rows visibly tighter.
- `/order-info` Create tab with Line Items → same navy header treatment, denser rows.
- `/reports/*` listings (which use the shadcn Table primitive) → headers navy, body padding reduced.
- Spot-check `/dispatch`, `/shipment-details` for visual regressions and that hover/selected row states still read clearly against the lighter body.
- Confirm no console errors and no horizontal overflow at 1187px width.
