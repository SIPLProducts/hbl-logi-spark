1. **Sidebar (`src/components/app-sidebar.tsx`)**
   - Remove the group label headings ("Dispatch", "Shipment", "Transit", "Billing & Claims").
   - Keep the nav items themselves and the Dashboard link; only the uppercase section headers are removed.
   - Simplify the `groups` data structure to no longer need the `label` field.

2. **Top bar (`src/components/top-bar.tsx`)**
   - Remove the `no` field from `ROUTE_LABELS` and delete the numbered badge rendering (the small pill showing "01", "02", etc. next to the breadcrumb label).
   - Keep the breadcrumb label text unchanged.