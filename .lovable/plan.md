## Global UX/UI polish — Cloud White, comfortable density

Scope is intentionally narrow: refine shared design tokens and shared components so every screen inherits the new look. No per-screen rewrites, no business-logic changes, no routing changes.

### 1. Repalette to Cloud White (`src/styles.css`)

Swap Navy Trust tokens for a Linear/Vercel-style light SaaS palette while keeping every existing token *name* (so all consumers keep working). Key shifts:
- `--background` → near-white `#FAFBFC`; `--surface` pure white; `--surface-2` `#F4F6F9`; `--hairline` `#E8ECF1`.
- `--foreground` → near-black slate `#0B0F19`; `--muted-foreground` slate-500.
- `--primary` → `#3B82F6` (blue-500) with white foreground (replaces deep navy as primary CTA color).
- `--accent` aligned to primary; `--ring` matches primary.
- `--sidebar` switches from midnight slate to white surface with slate-900 text and primary blue active state (the whole app reads as one light surface; sidebar no longer fights the page).
- Shadows softened (lighter, smaller `--shadow-soft`/`--shadow-elegant`; recolor `--shadow-cta` to blue).
- Gradient `--gradient-primary` → blue-500 → blue-600.
- Dark-mode tokens kept, lightly retuned to match the new accent.
- Status tokens (`success`, `warning`, `info`, `destructive`) kept but harmonized to match the cooler palette.

### 2. Typography pass
- Keep Space Grotesk display / DM Sans body / JetBrains Mono — already on-brand for Cloud White.
- Tighten base body to 14px with 1.5 line-height for comfortable enterprise density; bump h1 tracking.

### 3. Shared component polish (no API changes)

`src/components/le-screen-shell.tsx`:
- Header: lighter background (no gradient tile), smaller icon chip, cleaner divider.
- Tabs: pill style with subtle active shadow instead of heavy border.
- Filters bar: align controls to a 4-col grid, consistent 32px control height, single "Apply / Reset" cluster on the right.
- Worklist table: zebra via `--surface-2`, sticky header, hairline borders, hover row highlight, compact-but-comfortable 40px row height; empty state component when `rows=[]`.
- Footer summary row alignment tightened.

`src/components/app-sidebar.tsx`:
- Adopt new light sidebar tokens; active item = blue tinted background + blue text + 2px leading bar; collapsed state preserves icons.

`src/components/top-bar.tsx`, `page-header.tsx`, `document-header.tsx`:
- Unified 56px height, consistent left/right padding, single elevation token.

`src/components/kpi-tile.tsx`:
- Card with hairline border, label (uppercase 11px tracked), value (display font 28px), delta chip using `success`/`destructive` tokens, optional sparkline slot preserved.

`src/components/status-badge.tsx`, `data-table.tsx`, `report-placeholder.tsx`:
- Badge: pill with token-mapped tonal background (`success/10`, `warning/10`, etc.).
- Data-table: consistent header styling, sortable caret affordance, sticky header, horizontal scroll with `scrollbar-elegant`, empty/loading states.
- Report placeholder: friendlier empty state illustration block + primary CTA.

`src/components/ui/button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `sheet.tsx`, `card.tsx`, `tabs.tsx`, `badge.tsx`:
- Unify radius to `--radius-md`, focus ring to 2px primary with 2px offset, 32–36px control height, consistent disabled state, consistent dialog header/footer padding.

### 4. Feedback & states
- Wire Sonner (`src/components/ui/sonner.tsx`) with success/error/info variants using token colors and a single top-right position.
- Add a small `<Skeleton>` row pattern to the worklist table and KPI strip for loading.
- Standard empty-state component used by tables when `rows.length === 0`.

### 5. Responsiveness sanity pass
- Header, filters, KPI strip switch to `grid-cols-[minmax(0,1fr)_auto]` → flex at `sm:` per the responsive-layout rule.
- Tables wrap in `overflow-x-auto scrollbar-elegant` and stick the header.
- Sidebar collapses to icons on `<lg`, off-canvas on `<md` (already supported by shadcn sidebar — just confirm trigger placement in top bar).

### What is NOT in scope
- No per-screen redesign of Dispatch, Shipment, Segment, Transit, Reports, User Creation — they inherit visuals via the shared shell/components.
- No new charts, no new dashboards, no new routes.
- No data, API, validation, or business-logic edits.
- No motion-heavy effects beyond existing fade/scale utilities.

### Technical notes
- All color edits stay inside `src/styles.css` token blocks; no component swaps a `text-foreground` for an arbitrary color.
- Tailwind v4 rules respected: tokens via `@theme inline`, utilities via `@utility`, no `tailwind.config.js`.
- After edits I'll spot-check Dispatch, Shipment Details, Reports, and User Creation in the preview at desktop + tablet widths.