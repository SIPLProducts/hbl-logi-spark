Comment out the elements visible in the screenshot from `src/components/top-bar.tsx`:

- Left side: breadcrumb nav ("LE Module / Order Info")
- Right side: search input, DEV status pill, plant selector (HYD-PLANT-04), ThemeToggle, Help button, Notifications bell

Approach: wrap the inner contents of the `<header>` in `{/* ... */}` JSX comments so the header bar (with its height, border, sticky positioning) remains in place but renders empty. This is fully reversible by removing the comment markers.

No other files touched.