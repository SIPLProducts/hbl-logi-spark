## Goal
Free vertical space at the top of every LE screen by:
1. Moving the **Create** / **Search & Reports** tabs from below the page header up beside the **Refresh** button.
2. Shrinking the **Direction** card and embedding the **Pending** / **Completed** counts inside it.

All work is in `src/components/le-screen-shell.tsx` (used by every LE route). No data, route, or business-logic changes.

## Changes — `src/components/le-screen-shell.tsx`

### 1. Lift Tabs to the page header row
- Wrap the entire screen body in a single `<Tabs value={tab} onValueChange={...}>` that spans both the header and content (instead of starting `<Tabs>` below the header).
- In the header's right-aligned action cluster (currently just the Refresh button), render the `<TabsList>` immediately before Refresh:
  - Compact styling: `h-7 p-0.5`, triggers `px-2 py-0.5 text-[11px]` with the same active gradient.
  - Order: `[Create] [Search & Reports]` then a thin `h-5 w-px bg-hairline` divider, then Refresh.
- Remove the standalone `<TabsList>` that currently sits at the top of the body.
- Reduce header vertical padding (`pt-3 pb-2.5` → `pt-2 pb-2`) now that tabs no longer push content down.

### 2. Slim Direction card + inline counts
- Import `counts` (already imported) and surface `pending` / `completed` inside the Direction card.
- Reduce card chrome: `p-3` → `px-2.5 py-1.5`, `rounded-xl` → `rounded-lg`, drop `shadow-elegant` to `shadow-soft`.
- Single row layout (`flex flex-wrap items-center gap-2`):
  - `Direction` label (existing micro-caps style)
  - `Outward` radio (existing `PremiumRadio`, sized down via `h-6 px-2 text-[11px]` override)
  - vertical divider
  - `SapToggle` (unchanged component, already compact)
  - `renderDirectionExtras?.(...)` slot (unchanged)
  - **Spacer** (`ml-auto`) pushes counts to the right
  - Two count chips:
    ```
    [• Pending  18]   [• Completed  16]
    ```
    Styling: `inline-flex items-center gap-1.5 h-6 px-2 rounded-md border border-hairline bg-surface-2/60 text-[11px] font-semibold`, with a 6px dot — amber (`bg-warning`) for Pending, emerald (`bg-success`) for Completed, and the number in `font-mono text-foreground`.
- Reduce the `TabsContent value="create"` top margin (`mt-3` → `mt-2`) and the inner `space-y-3` → `space-y-2` so the tighter Direction card actually shows the saved space.

### 3. No other visual changes
- Search & Reports tab body, groups, line items, action bar, footer — untouched.
- No changes to routes, mock data, or any `*-sap-create.tsx` component.

## Out of scope
- Login page, sidebar, other shells.
- Renaming or reordering tabs.
- Wiring counts to live data — keep the existing `counts` constant.

## Verification
- Visit `/order-info`, `/shipment-details`, `/dispatch`, `/reports` at 1187×723 and 1440×900:
  - Tabs appear inline with Refresh in the header bar; no second tab row below.
  - Direction card is a single compact row with Pending/Completed chips on the right.
  - Switching tabs still works; Search & Reports content renders unchanged.
  - No new console errors; no layout overflow at narrow widths (tabs + Refresh wrap gracefully).
