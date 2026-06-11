# Plan: Add Profile + Logout to Top-Right of App

## Approach
Restore the empty `TopBar` with a minimal right-aligned area containing a Profile avatar dropdown and a Logout button. UI-only — no real auth backend.

## Change in `src/components/top-bar.tsx`
- Render a thin `<header>` (h-12, surface bg, bottom hairline border, sticky) with `justify-end`
- Right side:
  - Avatar dropdown (shadcn `DropdownMenu`) showing initials "AD" / "Admin User · admin@hbl.com"
    - Menu items: **Profile** (navigates to `/profile`), Divider, **Logout** (navigates to `/login`)
  - Standalone **Logout** icon button next to it (`LogOut` lucide icon) for one-click sign out
- Use TanStack `useNavigate` for navigation; both `/profile` and `/login` are placeholder routes that don't exist yet — clicking will hit the root 404 boundary. Since user picked "Just UI buttons", that's acceptable; no new route files are created.

## Files
- `src/components/top-bar.tsx` — rewritten with the dropdown + logout button

## Out of scope
- No `/profile` or `/login` page implementation
- No auth state, no Lovable Cloud
- Sidebar untouched