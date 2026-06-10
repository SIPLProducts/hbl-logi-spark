Logistics Execution (LE) Frontend for HBL Power Systems — Full Implementation Plan

## Summary
Build a complete frontend-only Logistics Execution desktop web application for HBL Power Systems (battery manufacturer), designed to consume a SAP HANA backend. The app uses a persistent sidebar navigation with Dashboard, Inbound, Outbound, Transportation, and Reports modules. Each module has list screens (dense data tables), detail screens (document header + line items + status timeline), and operator task views. Visual direction: Industrial Foundry — high-contrast enterprise, border-heavy aesthetic, Inter + JetBrains Mono typography, dark sidebar on light canvas.

## Design Tokens
- Fonts: Inter (400/500/600), JetBrains Mono (400/700)
- Colors: Deep zinc sidebar (#18181b), accent blue (#1d4ed8), status greens/reds/amber, clean white panels with subtle borders
- Density: High — compact tables, small status pills, minimal padding, uppercase micro-labels
- Border radius: Mostly sharp (2-4px) for industrial precision feel

## Route Architecture
All routes are file-based under `src/routes/`:

```
src/routes/
  __root.tsx          -> App shell with SidebarProvider, sidebar, top bar
  index.tsx           -> / (Dashboard: KPIs, exceptions, charts, worklist)
  inbound.tsx         -> /inbound layout (sidebar group active)
  inbound.index.tsx   -> /inbound (Inbound Deliveries worklist table)
  inbound.asn.tsx     -> /inbound/asn (ASN list)
  inbound.putaway.tsx -> /inbound/putaway (Putaway task list)
  inbound.delivery.$id.tsx -> /inbound/delivery/$id (Inbound Delivery detail)
  outbound.tsx        -> /outbound layout
  outbound.index.tsx  -> /outbound (Outbound Deliveries worklist)
  outbound.picking.tsx -> /outbound/picking (Picking operator task list)
  outbound.packing.tsx -> /outbound/packing (Packing list)
  outbound.goods-issue.tsx -> /outbound/goods-issue (Goods Issue list)
  outbound.delivery.$id.tsx -> /outbound/delivery/$id (Outbound Delivery detail)
  transportation.tsx  -> /transportation layout
  transportation.index.tsx -> /transportation (Shipments list)
  transportation.tracking.tsx -> /transportation/tracking (Freight tracking)
  transportation.shipment.$id.tsx -> /transportation/shipment/$id (Shipment detail)
  reports.index.tsx   -> /reports (Reports placeholder)
```

## Module Screens Detail

### Dashboard (`/`)
- 5 KPI tiles: Open GRs (142), Pending Putaway (89), Picks Due (312), In Transit (18), OTIF % (94.2)
- Throughput Volume bar chart (mock data, 24h bars)
- On-Time Delivery donut chart (94.2% actual vs 98% target)
- Exceptions Queue panel (2-3 exception cards: shortage, unassigned gate)
- Inbound Deliveries quick table (5-6 rows with status pills, priority, dock, actions)

### Inbound (`/inbound`)
- Worklist table: Delivery #, Vendor, Items, Dock, Status pill, Priority, ETA, Actions
- Filters: Plant, Date range, Status, Priority
- Action buttons: Confirm GR, Scan, View Detail
- Statuses: Arrived, Gate-In, Unloaded, Putaway Complete, Exception

### Inbound ASN (`/inbound/asn`)
- Table: ASN #, PO Reference, Vendor, Expected Date, Items, Status
- Statuses: Expected, Arrived, Cancelled

### Inbound Putaway (`/inbound/putaway`)
- Task table: Task ID, Source Bin, Destination Bin, Material, Batch, Qty, Status
- Statuses: Open, In Progress, Completed, Blocked
- Operator actions: Confirm, Reject, View HU

### Inbound Delivery Detail (`/inbound/delivery/$id`)
- Header card: Delivery #, Vendor, Plant, Dock, ETA, Overall Status
- Line items table: Item #, Material, Description, Batch, Order Qty, GR Qty, UoM, Status
- Status timeline: vertical stepper (Created -> Arrived -> GR Posted -> Putaway Complete)
- Action bar: Post GR, Reverse GR, Print

### Outbound (`/outbound`)
- Worklist table: Delivery #, Customer, Items, ETD, Status, Priority, Actions
- Statuses: Created, Picking, Picked, Packed, Goods Issued, Shipped

### Outbound Picking (`/outbound/picking`)
- Task table: Pick Task ID, Warehouse Task, Source Bin, Material, Batch, Qty, Confirmed Qty, Status
- Current task operator view: large location code, material info, quantity, scan input
- Batch confirm actions

### Outbound Packing (`/outbound/packing`)
- Table: Delivery #, HU (Handling Unit), Packed Qty, Gross Weight, Packing Status
- Statuses: Open, In Progress, Complete

### Outbound Goods Issue (`/outbound/goods-issue`)
- Table: Delivery #, GI Date, PGI Status, Material, Batch, Qty, Batch
- Post GI / Reverse GI actions

### Outbound Delivery Detail (`/outbound/delivery/$id`)
- Header: Delivery #, Customer, Ship-To, Plant, Shipping Point, Route, ETD
- Line items: Item, Material, Description, Order Qty, Pick Qty, GI Qty, UoM, Batch
- Status timeline: Created -> Picking -> Picked -> Packed -> Goods Issued -> Shipped
- Action bar: Pick, Pack, Post GI, Create Shipment

### Transportation (`/transportation`)
- Shipments table: Shipment #, Route, Carrier, Vehicle, Stops, Status, Departure, Arrival
- Statuses: Planned, Checked-In, Loaded, Departed, In Transit, Delivered

### Transportation Tracking (`/transportation/tracking`)
- Shipment search
- Tracking card: Shipment #, Route, Carrier, Vehicle Reg, Driver, Current Status
- Stops list: Location, Planned/Actual Arrival, Status
- Map placeholder area

### Shipment Detail (`/transportation/shipment/$id`)
- Header: Shipment #, Route, Carrier, Vehicle, Driver, Planned/Actual dates
- Stops table with ETAs
- Deliveries assigned to shipment
- Freight cost summary

### Reports (`/reports`)
- Placeholder with report categories: Inbound Summary, Outbound Summary, OTIF Analysis, Exception Log

## Component Reusables
- `AppSidebar` — persistent sidebar with nav groups, active route highlighting
- `TopBar` — plant selector, global search, notifications, user avatar
- `KpiTile` — compact stat card with label, value, micro-trend
- `StatusBadge` — colored pill badges for all LE statuses
- `DataTable` — shared table wrapper with sortable headers, row actions
- `DocumentHeader` — reusable document header for detail pages
- `StatusTimeline` — vertical stepper for document lifecycle
- `PageHeader` — page title + breadcrumb + action buttons

## Technical Details
- All data is mock/static — no backend calls
- Use `createFileRoute` from `@tanstack/react-router` for all routes
- Use shadcn/ui components: Table, Badge, Button, Card, Select, Input, Tabs, Separator
- Icons from `lucide-react`
- No additional packages needed beyond existing project dependencies
- Strict TypeScript: all mock data typed with interfaces (Delivery, Shipment, Task, etc.)
- Head metadata per route with title + description
- Active sidebar items highlighted via `useRouterState` pathname
- Route guards: none needed (frontend-only, auth handled separately)

## Files to Create/Modify
- Modify `src/routes/__root.tsx` — add SidebarProvider + AppSidebar + TopBar shell
- Modify `src/styles.css` — add custom tokens for LE theme (industrial foundry)
- Modify `src/routes/index.tsx` — replace placeholder with full Dashboard
- Create `src/components/app-sidebar.tsx`
- Create `src/components/top-bar.tsx`
- Create `src/components/kpi-tile.tsx`
- Create `src/components/status-badge.tsx`
- Create `src/components/data-table.tsx`
- Create `src/components/document-header.tsx`
- Create `src/components/status-timeline.tsx`
- Create `src/components/page-header.tsx`
- Create `src/lib/mock-data.ts` — all mock LE data
- Create `src/routes/inbound.tsx`
- Create `src/routes/inbound.index.tsx`
- Create `src/routes/inbound.asn.tsx`
- Create `src/routes/inbound.putaway.tsx`
- Create `src/routes/inbound.delivery.$id.tsx`
- Create `src/routes/outbound.tsx`
- Create `src/routes/outbound.index.tsx`
- Create `src/routes/outbound.picking.tsx`
- Create `src/routes/outbound.packing.tsx`
- Create `src/routes/outbound.goods-issue.tsx`
- Create `src/routes/outbound.delivery.$id.tsx`
- Create `src/routes/transportation.tsx`
- Create `src/routes/transportation.index.tsx`
- Create `src/routes/transportation.tracking.tsx`
- Create `src/routes/transportation.shipment.$id.tsx`
- Create `src/routes/reports.index.tsx`
