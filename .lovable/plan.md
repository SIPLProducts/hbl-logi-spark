## Summary
Three cross-app UI polish updates: replace blue focus rings with a neutral dark-gray focus, tighten table corner radii to 2–5px, and switch all table headers to the same blue gradient used by the Create button, Search icon, Admin icon, and Invoice Load Details icon.

## Changes

### 1. Neutral dark-gray focus on inputs / selects / textareas / shell filters
Today `--ring` resolves to the blue accent (`oklch(0.56 0.1 252)`), so every shadcn `focus-visible:ring-ring` and the shell's `focus:ring-accent/20` renders blue.

- **`src/styles.css`** — Add a dedicated neutral focus token instead of repointing `--ring` (keeps charts/sidebar accents untouched):
  - Light: `--focus-ring: oklch(0.45 0.01 240)` (dark gray).
  - Dark: `--focus-ring: oklch(0.7 0.01 240)` (light gray on dark surface).
  - Register `--color-focus-ring: var(--focus-ring)` inside `@theme inline` so `ring-focus-ring` / `border-focus-ring` utilities exist.
- **`src/components/ui/input.tsx`** — replace `focus-visible:ring-ring` with `focus-visible:ring-focus-ring focus-visible:border-focus-ring`.
- **`src/components/ui/textarea.tsx`** — same swap.
- **`src/components/ui/select.tsx`** (trigger ~line 22) — replace `focus:ring-ring` with `focus:ring-focus-ring focus:border-focus-ring`.
- **`src/components/le-screen-shell.tsx`** (3 custom filter fields ~lines 585/595/601) — replace `focus:border-accent focus:ring-2 focus:ring-accent/20` with `focus:border-focus-ring focus:ring-2 focus:ring-focus-ring/30`.

### 2. Tighter table radii (2–5px)
Reduce outer card / header corner rounding so tables read cleaner. Target ~4px (`rounded` = 4px is in the 2–5px range).

- **`src/components/le-screen-shell.tsx`**
  - Worklist card wrapper (~line 289) and Create-mode worklist wrapper (~line 450): `rounded-xl` / `rounded-2xl` → `rounded`.
  - Tab-recent panel wrapper (~line 271): `rounded-xl` → `rounded`.
- **`src/components/data-table.tsx`** — outer wrapper: `rounded-sm` (already 2px) stays as-is; no change needed.
- **`src/routes/user-creation.tsx`** — table card wrapper `rounded-2xl` → `rounded` so the user table matches.
- Header cells already have no independent radius; the wrapper's `overflow-hidden` clips the gradient header to the new 4px corners.

Out of scope for radius: KPI tiles, dialog cards, empty-state panels, tabs, pills, buttons — those are not tables.

### 3. Blue-gradient table headers (match Create button / Search / Admin / Invoice icons)
The Create button, top-bar icon tiles, and the Invoice Load Details title-icon all use `bg-gradient-primary` (navy→blue gradient defined in `src/styles.css`). Table headers currently use the flat `bg-primary`. Switch them to the gradient.

- **`src/components/le-screen-shell.tsx`** — both `<tr class="bg-primary ...">` rows (~lines 301 and 464): `bg-primary` → `bg-gradient-primary`.
- **`src/components/data-table.tsx`** — `<tr class="bg-primary ...">` (~line 56): `bg-primary` → `bg-gradient-primary`.
- **`src/components/ui/table.tsx`** — `TableHeader`'s `bg-primary` → `bg-gradient-primary`; keep `text-primary-foreground` for contrast.
- **`src/routes/user-creation.tsx`** — `<tr class="bg-primary ...">` → `bg-gradient-primary`.

Text stays `text-primary-foreground` (white) so contrast remains AA on the gradient.

## Out of scope
- KPI tiles, status badges, pills, toasts, dialog/card radii, button radii.
- Sidebar, top-bar icon styling (already on the gradient).
- The Create-User dialog's own indigo/violet/purple Create button in `user-creation.tsx` (separate brand accent, not a table header).
- Chart colors and `--accent` token (unchanged so non-form accents keep their current blue).

## Verification
After the change:
- Click into any input / select / textarea / shell filter → focus outline is a soft dark-gray ring, no blue.
- All table outer corners measure ~4px.
- Every table header (worklist, Create-mode worklist, recent activity, Invoice Load Details lists, User Management) shows the same navy→blue gradient as the Create button and Invoice Load Details title icon.
