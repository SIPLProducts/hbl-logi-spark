## Remove space between nav groups in sidebar

The sidebar navigation currently uses `space-y-5` on the `<nav>` container, creating a 20px vertical gap between the Dashboard link, each nav group, and the Reports section.

### Change
In `src/components/app-sidebar.tsx`, replace `space-y-5` with `space-y-0` on the `<nav>` element to collapse all inter-group spacing. Optionally keep `py-4` top/bottom padding on the nav so content doesn't touch the edges.

No other files touched.