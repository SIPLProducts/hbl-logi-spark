# Plan: Sticky Top Bar + Page Header

## Current state
- `TopBar` is already `sticky top-0 z-20` inside the flex column, so it stays fixed when the page body scrolls (scroll container is `<main className="overflow-y-auto">`).
- Each screen's page header (title, description, Refresh button) scrolls away with the body.

## Change
Make the per-screen page header `sticky top-0 z-10` so it pins to the top of the scroll area (directly below the TopBar). Body content scrolls underneath.

Apply to every page that renders its own header bar:

1. **`src/components/le-screen-shell.tsx`** (line ~155) — shared header used by Order Info → Insurance Claim Tracking. Add `sticky top-0 z-10`.
2. **`src/routes/dispatch.tsx`** (line ~75) — same header pattern. Add `sticky top-0 z-10`.
3. **`src/routes/dispatch-orders.tsx`** (line ~169) — add `sticky top-0 z-10` and ensure background is opaque (`bg-surface` already is).
4. **`src/routes/index.tsx`** (line ~88) — dashboard header. Add `sticky top-0 z-10`.

## Notes
- TopBar already uses `bg-surface/90 backdrop-blur` so it remains opaque while content scrolls under it. The page-header div in le-screen-shell/dispatch uses `bg-surface/80 backdrop-blur` — fine. The dispatch-orders and index headers use solid `bg-surface` — also fine.
- Existing internal `sticky top-0` thead/footer elements inside scroll regions are scoped to their own table containers and unaffected.

## Out of scope
- No layout, sidebar, or visual restyling beyond adding sticky positioning.
- No changes to the login page (no scroll there).