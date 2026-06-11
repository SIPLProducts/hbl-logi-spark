# HBL Logistics Execution — UI/UX Redesign Plan

A full visual + interaction overhaul of the existing 12-screen app. No backend changes (Node.js + SAP stays untouched). Mock data and routes remain as-is; only presentation, components, tokens, and micro-interactions change.

## Design direction

- **Palette — Navy Trust**: deep navy `#0f1b3d` (primary), `#1e3a5f` (surface-2), `#3b6fa0` (accent/interactive), `#e8edf3` (page bg), white cards. Functional colors: success emerald, warning amber, danger rose, info sky — all desaturated for an enterprise feel.
- **Typography**: Space Grotesk (headings, numerics, table headers) + DM Sans (body, labels, inputs). Loaded via `<link>` in `__root.tsx`; registered in `@theme` (no `@import` URLs).
- **Density 4 (compact data-grid)**: 32px row height, 13px table text, 12px labels, condensed paddings, sticky table headers + first column.
- **Aesthetic**: enterprise-grade "command center" — flat surfaces, 1px hairline borders, subtle elevation on hover, no heavy shadows, no gradients in chrome (one accent gradient reserved for KPI hero strip).

## Global shell

```text
┌─────────────────────────────────────────────────────────────┐
│ TopBar: logo · breadcrumbs · global search · env · user    │
├──────────┬──────────────────────────────────────────────────┤
│          │ Page header (title, screen #, actions)           │
│ Sidebar  ├──────────────────────────────────────────────────┤
│ 12 items │ Mode tabs · Status chips · Filters · Density tgl │
│ numbered ├──────────────────────────────────────────────────┤
│ + icons  │ Worklist table (sticky head, zebra, row-select)  │
│ collapse ├──────────────────────────────────────────────────┤
│ to icons │ Detail drawer / inline panel · Line items        │
│          ├──────────────────────────────────────────────────┤
│          │ Sticky action bar · Footer                       │
└──────────┴──────────────────────────────────────────────────┘
```

- **Sidebar**: collapsible (icon mini-rail), numbered 1–12, grouped under "Dispatch", "Shipment", "Transit", "Billing & Claims" with subtle dividers. Active item: left accent bar + filled icon.
- **Top bar**: global search (Cmd-K), environment badge (DEV/PROD), notifications bell, user menu.
- **Breadcrumbs**: Screen # · Screen name · Record ID.

## Screen-level patterns (applies to all 12)

1. **Page header**: screen number chip + title + short description + primary actions (`+ New`, `Export`, `Refresh`). Right side: last-sync timestamp.
2. **KPI strip** (new): 3–5 compact KPI tiles per screen (Pending / Completed / In-Transit / Damaged / Claimed — screen-specific). Click to filter table.
3. **Mode tabs**: Outward · With SAP · Without SAP — segmented control, not browser tabs.
4. **Filter rail**: chips for status, date range, plant, vendor, transporter; saved-view dropdown; clear-all.
5. **Lookup bar**: Invoice / Reference / ODN / LR / Vehicle — unified search with type prefix (e.g. `inv:`, `lr:`).
6. **Worklist table**:
   - Column show/hide, reorder, resize, sticky first column, multi-sort.
   - Inline status badges (filled, not outlined) with icon.
   - Row hover reveals quick actions (view, edit, copy ID).
   - Bulk-select with floating action bar (Approve / Reject / Export selected).
   - Empty state + skeleton loader.
7. **Detail panel**: right-side drawer (desktop) / full-screen (mobile) — tabbed sections (Overview · Line Items · Documents · Timeline · Audit).
8. **Status timeline**: horizontal stepper showing screen 1→12 progression for any record so users see where a shipment sits in the lifecycle.
9. **Sticky action bar**: Save / Submit / Approve / Print — always visible at viewport bottom of the panel.
10. **Toasts** (sonner) for all mutations, with undo where possible.

## Cross-app additions

- **Command palette (Cmd-K)**: jump to any of the 12 screens, search records by ID, run quick actions.
- **Global lifecycle tracker**: enter any LR/Invoice → modal shows the 12-step pipeline with the current stage highlighted.
- **Dashboard home (`/`)**: replaces redirect — bento layout with KPIs per screen, recent activity feed, shipments-in-transit map placeholder, pending-approvals queue.
- **Dark mode**: full token coverage; toggle in user menu.
- **Keyboard shortcuts**: `g d` go dispatch, `/` focus search, `n` new record, `e` export.
- **Accessibility**: focus rings, ARIA on table, 4.5:1 contrast minimum.

## Technical changes

- `src/styles.css`: rewrite `@theme` with Navy Trust OKLCH tokens, font tokens, semantic surface/border/text tokens for light + dark, table tokens (row-h, header-bg, zebra), elevation tokens. Map shadcn tokens via `@theme inline`.
- `src/routes/__root.tsx`: add Google Fonts `<link>` for Space Grotesk + DM Sans; mount `<Toaster />`, `<CommandPalette />`, `<TooltipProvider />`.
- `src/components/app-sidebar.tsx`: regroup 12 items into 4 sections, add numbered badges, mini-rail mode, active-state accent bar.
- `src/components/top-bar.tsx`: rebuild with search, env badge, notifications, user menu, breadcrumbs slot.
- `src/components/le-screen-shell.tsx`: extend with KPI strip slot, filter rail, density toggle, saved views, drawer-based detail panel.
- `src/components/data-table.tsx`: upgrade with sticky headers, column controls, row selection, bulk action bar, skeleton + empty states.
- `src/components/status-badge.tsx`, `status-timeline.tsx`, `kpi-tile.tsx`: restyled to match new tokens.
- New: `src/components/command-palette.tsx`, `src/components/lifecycle-tracker.tsx`, `src/components/filter-rail.tsx`, `src/components/detail-drawer.tsx`, `src/components/theme-toggle.tsx`.
- `src/routes/index.tsx`: replace redirect with a real dashboard home.
- Each of the 12 route files: minor updates to pass KPI data and use the new shell slots — no route additions/removals.
- No changes to `src/lib/le-mock-data.ts` shape (may add a few derived KPI helpers).

## Out of scope

- Real SAP/Node.js wiring (mock data only).
- New screens beyond the existing 12 (+ new dashboard home).
- Auth / user management (item 13 from the PDF).
- Filter & download modal from PDF pages 41–43.

## Deliverable

A cohesive, modern, dense-but-readable enterprise UI that feels like a real logistics command center — consistent across all 12 screens, with a lifecycle-aware dashboard home, a Cmd-K palette, and full light/dark support.
