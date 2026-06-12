## Goal
The Create button in the screenshot reads as a solid deep navy (the `--primary` token, `oklch(0.24 0.07 262)` / ~#0f1b3d). Table headers across the app currently use `bg-gradient-primary` (navy→mid-blue gradient), which makes their right side noticeably lighter than the Create button. Switch every table header to the same solid navy so they match the Create button exactly.

## Changes

Replace `bg-gradient-primary` with `bg-primary` on table header rows / `TableHeader` only. Keep `text-primary-foreground` for contrast. No other components change.

- **`src/components/ui/table.tsx`** — `TableHeader`: `bg-gradient-primary` → `bg-primary`.
- **`src/components/data-table.tsx`** — `<tr className="bg-gradient-primary ...">` → `bg-primary`.
- **`src/components/le-screen-shell.tsx`** — both worklist `<tr className="bg-gradient-primary ...">` rows → `bg-primary`.
- **`src/routes/user-creation.tsx`** — User Management `<tr className="bg-gradient-primary ...">` → `bg-primary`.

## Out of scope
- The Create button itself, top-bar icon tiles, Invoice Load Details title icon, and any other non-table use of `bg-gradient-primary` stay as-is.
- No changes to focus rings, border colors, radii, or text colors.
- No token changes in `src/styles.css`.

## Verification
Every table header (worklist, Create-mode worklist, recent activity, Invoice Load Details lists, User Management, generic `DataTable`, shadcn `Table`) renders the same solid deep navy as the Create button, with white text preserved.
