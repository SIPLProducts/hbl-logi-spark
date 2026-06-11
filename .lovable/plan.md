## Goal
Refresh the Dispatch screen (and shared shell) to a Linear / Stripe / Tailwind UI level of polish — softer surfaces, larger radii, refined sidebar, premium controls, and an elegant data grid — without changing any data, routing, or business logic.

## Scope
Visual-only changes. No edits to mock data, server functions, or route structure.

Files touched:
- `src/styles.css` — design tokens (page bg, radii, sidebar palette, hairlines, shadows, segmented-control + status-dot utilities)
- `src/components/app-sidebar.tsx` — sidebar polish (spacing, icons, active indicator, profile block)
- `src/components/top-bar.tsx` — header typography + search/select refinement
- `src/components/le-screen-shell.tsx` — page title, "+ Create Dispatch" button, footer connection pill
- `src/components/le-footer.tsx` — premium Previous / Save / Save & Next buttons
- `src/routes/dispatch.tsx` — segmented SAP toggle, polished radios, table styling, in-row selects with chevrons, scrollbar refinement

No new dependencies.

## Design direction
- Background: soft slate `#F8FAFC` (oklch ≈ 0.985 0.005 240)
- Sidebar: deep midnight slate (oklch ≈ 0.20 0.035 260) with a vibrant accent rail
- Radius scale bumped: base `--radius` 0.5rem → 0.75rem (12px), inputs/buttons land at 10–12px
- Hairlines lightened; cards get a soft elevation shadow (`--shadow-elegant`)
- Active nav: 3px left accent bar + soft tinted pill background + accent-colored icon
- Primary CTA: subtle gradient `linear-gradient(135deg, primary → accent)` with soft shadow + hover lift
- Status dot: small green disc with an animated `ping` halo

## Detailed changes

### 1. Tokens (`src/styles.css`)
- `--background` → softer near-white slate (`#F8FAFC` equivalent)
- `--radius` → 0.75rem; ensure derived sm/md/lg cascade
- `--hairline` / `--border` slightly lighter for airier separators
- Add: `--shadow-elegant`, `--shadow-soft`, `--gradient-primary`
- Sidebar tokens → deeper midnight slate, accent stays vibrant
- Add `@utility status-dot` (pulsing green) and `@utility segmented-thumb` (smooth slide bg)

### 2. Sidebar (`src/components/app-sidebar.tsx`)
- Increase vertical padding between items; group label gets uppercase tracking
- Each item: icon (lucide) + label; active state = left 3px accent bar + soft `bg-sidebar-accent/60` pill + accent icon color
- Smooth `transition-colors` on hover
- Bottom profile block: avatar circle, name in semibold, role in muted xs, divider hairline above

### 3. Top bar (`src/components/top-bar.tsx`)
- Title uses `font-display` (Space Grotesk), bigger + tighter tracking
- Search input: thin 1px border, rounded-xl, leading search icon, refined placeholder
- Selects: same minimalist treatment + chevron icon

### 4. Screen shell (`src/components/le-screen-shell.tsx`)
- "+ Create Dispatch": gradient bg, white text, `shadow-soft`, hover translate-y/scale
- Page title styled as premium display heading
- Footer "SAP S/4HANA Connected" → pill with `status-dot` (animated)

### 5. SAP toggle + radios (`src/routes/dispatch.tsx`)
- "With SAP / Without SAP" → pill-shaped segmented control: rounded-full track, sliding white thumb with shadow, animated via `transition-transform`
- Direction radios restyled: custom circle with accent-colored inner dot, focus ring

### 6. Dispatch lines table
- Remove vertical borders; keep soft horizontal hairlines
- Header row: uppercase, tracking-wider, text-xs, muted-foreground
- Row hover: `bg-surface-2/60`; zebra optional via even rows
- In-row selects wrapped in a styled container with chevron icon (lucide `ChevronDown`), thin border, rounded-lg
- Horizontal scrollbar: thin custom scrollbar (webkit) — slim track, rounded thumb

### 7. Footer buttons (`src/components/le-footer.tsx`)
- Previous: ghost / outline, muted text
- Save: outline with accent text
- Save & Next: primary gradient CTA with shadow + hover lift

## Out of scope
- No layout restructuring or new sections
- No copy changes
- No changes to data flow, routes, or table data shape
- Dark mode kept consistent but not redesigned in detail

Ready to switch to build mode to apply these changes.
