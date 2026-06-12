## Problem

The Logout button (and the dropdown's Logout item) in `src/components/top-bar.tsx` only shows a toast — it never navigates anywhere, so visually "nothing happens" beyond the toast.

## Change

In `src/components/top-bar.tsx`:

- Import `useNavigate` from `@tanstack/react-router`.
- Update `handleLogout` to show the "Signed out" toast and then `navigate({ to: "/login" })`.

That's it — single file, presentation-only change. No auth/state logic exists yet to clear (no Cloud/Supabase session in the project today), so this just routes the user back to the login screen, which matches the expected logout behavior.
