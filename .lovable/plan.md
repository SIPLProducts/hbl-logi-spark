## Goal
Remove the numeric index labels (e.g., "01", "02") displayed beside each screen name in the application sidebar.

## Scope
- **File:** `src/components/app-sidebar.tsx`

## Changes
1. Remove the `<span>` element that renders `String(item.index).padStart(2, "0")` inside each nav item row (currently lines 142-151).
2. Update the `title` attribute on the nav `<Link>` to remove the `${item.index}. ` prefix (currently line 131).
3. Remove the unused `index` field from the `NavItem` type and from every item in the `groups` array, since it will no longer serve any purpose.

## Result
- Sidebar nav items will show only the icon and the screen title — no leading number.
- Collapsed sidebar tooltips will show only the title without a number prefix.
- No visual or behavioral impact on any other part of the application.