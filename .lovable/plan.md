## Summary
Darken the gray borders on all input fields, dropdowns, and search bars across the application for a cleaner, more professional appearance. Text colors remain unchanged.

## Changes

### 1. Update the --input design token in src/styles.css
The `--input` variable drives `border-input` used by shadcn/ui components and every `*-sap-create.tsx` form. It is currently very light (`oklch(0.93 ...)`) in light mode, making borders nearly invisible.
- **Light mode:** change `--input` from `oklch(0.93 0.008 240)` to `oklch(0.75 0.01 240)` — a clearly visible but still clean medium gray.
- **Dark mode:** change `--input` from `oklch(0.3 0.04 260)` to `oklch(0.38 0.04 260)` — slightly lighter against the dark surface for better definition without looking washed out.

### 2. Align filter/search inputs in le-screen-shell.tsx
Three custom filter fields in the shell currently use `border-hairline` instead of the shared `border-input` token:
- Search input (line ~585)
- Status select trigger (line ~595)
- Reference/Invoice input (line ~601)
Replace `border-hairline` with `border-input` on these elements so they inherit the updated darker gray and stay consistent with the rest of the app.

## Out of scope
- Text colors inside inputs (kept as-is).
- Focus ring colors (`focus:border-ring`, `focus:ring-ring/30`).
- Buttons, KPI tiles, status badges, pills, toasts, and card borders (`border-hairline`).
- `service-level-sap-create.tsx` load-type toggle pills.
- `freight-billing-sap-create.tsx` checkbox decorations.

## Verification
After the change, all form inputs, shadcn Select triggers, and the shell filter bar should show a noticeably darker border in both light and dark themes, while text and focus states remain exactly as they are now.