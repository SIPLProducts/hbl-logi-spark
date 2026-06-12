# Compact UI Density Pass

Goal: reduce visual weight across every screen — smaller fonts, tighter inputs, denser tables, slimmer scrollbars, fewer redundant scroll containers — without changing any business logic, routes, or data shapes.

## Approach

Make the change centrally in tokens + shared primitives so every screen inherits it. No per-route restyling.

## Changes

### 1. `src/styles.css` — base density tokens
- Base `body` font size: `13px` → `12px`; line-height `1.45`.
- Slim global scrollbar: `scrollbar-elegant` width/height `8px` → `6px`; apply to `html, body, *` via a single rule (keep existing utility for opt-in too).
- Tighten heading tracking unchanged; reduce default `--radius` from `0.75rem` to `0.5rem` for a tighter feel.
- Add compact-table utility class for `<td>/<th>` overrides (`h-7`, `px-1.5`, `text-[11.5px]`).

### 2. `src/components/ui/input.tsx`
- Height `h-9` → `h-7`; padding `px-3 py-1` → `px-2 py-0.5`; text `text-base md:text-sm` → `text-[12px]`.

### 3. `src/components/ui/textarea.tsx`
- `min-h` reduced; padding `px-3 py-2` → `px-2 py-1`; text `text-[12px]`.

### 4. `src/components/ui/select.tsx` (trigger)
- Height `h-9` → `h-7`; px `px-3` → `px-2`; text `text-[12px]`.

### 5. `src/components/ui/button.tsx`
- `default` size `h-9 px-4` → `h-8 px-3 text-[12px]`; `sm` → `h-7 px-2 text-[11.5px]`; `lg` → `h-9 px-4`.

### 6. `src/components/ui/label.tsx`
- `text-sm` → `text-[11.5px]`; tighter `leading-none`.

### 7. `src/components/ui/table.tsx`
- `Table`: wrapper `overflow-auto` kept but add `scrollbar-elegant`; base `text-sm` → `text-[12px]`.
- `TableHead`: `h-10 px-2` → `h-7 px-1.5 text-[11px] uppercase tracking-wide`.
- `TableCell`: `p-2` → `px-1.5 py-1`.
- `TableRow`: tighter hover row, no extra height.

### 8. `src/components/ui/tabs.tsx`
- TabsList: `h-10 p-1` → `h-8 p-0.5`.
- TabsTrigger: `px-3 py-1.5 text-sm` → `px-2 py-0.5 text-[12px]`.

### 9. `src/components/ui/dialog.tsx`, `sheet.tsx`, `popover.tsx`, `dropdown-menu.tsx`, `command.tsx`
- Item padding `py-1.5 px-2` → `py-1 px-2`; text `text-sm` → `text-[12px]`.

### 10. `src/components/ui/badge.tsx`
- `px-2.5 py-0.5 text-xs` → `px-2 py-0 text-[10.5px]`.

### 11. `src/components/app-shell.tsx`
- Root `text-[13px]` → `text-[12px]`.
- `<main>` keep single scroll container; remove nested page-level `overflow-auto` wrappers (see #12).

### 12. `src/components/le-screen-shell.tsx`
- Audit nested `overflow-y-auto` / `max-h-*` wrappers that duplicate the main scroll. Keep at most one scroller per region (table region only). Tighten group padding `p-4` → `p-2.5`, field gap `gap-3` → `gap-2`, section heading `text-sm` → `text-[11px] uppercase`.
- Form grid row min-height reduced via new compact Input/Label.

### 13. `src/components/top-bar.tsx`, `app-sidebar.tsx`
- Top bar height reduced (e.g. `h-14` → `h-11`), nav item `text-sm` → `text-[12px]`, icon size 18 → 16.
- Sidebar item padding `px-3 py-2` → `px-2 py-1.5`, group label `text-xs` → `text-[10.5px]`.

### 14. `src/components/data-table.tsx`, `kpi-tile.tsx`, `page-header.tsx`, `document-header.tsx`, `status-badge.tsx`, `status-timeline.tsx`
- Apply matching compact paddings and font sizes consistent with tokens above. No structural changes.

## Out of scope
- No route, data, validation, auth, or business-logic changes.
- No new design language — same Navy Trust palette and fonts.
- No changes to `src/routes/login.tsx` styling (kept as-is per recent redesign work).
- No changes to mock data or server functions.

## Risk / verification
- Visual regression: spot-check `/`, `/order-info`, `/shipment-details`, `/dispatch`, `/reports`, `/user-creation` at 1187px and 1440px viewports after the change.
- Confirm no double scrollbars and that tables, forms, and dialogs render without clipped controls.
