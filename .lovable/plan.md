## Goal
Add a collapsible **Reports** group to the sidebar with 8 sub-items matching the reference image, and create a route + landing page for each so navigation works end-to-end.

## Sub-screens
1. Transit & E-way bill Report → `/reports/transit-eway-bill`
2. Pending PODs → `/reports/pending-pods`
3. Freight Bills → `/reports/freight-bills`
4. Loading Factor & Cost → `/reports/loading-factor-cost`
5. Business Share Matrix → `/reports/business-share-matrix`
6. Damage List → `/reports/damage-list`
7. Insurance → `/reports/insurance`
8. Service Level → `/reports/service-level-report` (suffix `-report` to avoid clashing with the existing `/service-level` operational screen)

## Changes

### 1. `src/components/app-sidebar.tsx` — collapsible Reports section
- Import `ChevronDown`, `FileBarChart`, `Layers`, `Clock`, `FileSpreadsheet`, `BarChart3`, `Grid3x3`, `ListChecks`, `Shield`, `Settings` from `lucide-react` (reusing existing icons where possible).
- Below the User Creation group, add a new "Reports" parent entry with a chevron toggle. Local state `const [reportsOpen, setReportsOpen] = useState(false);`. Header row renders an icon (FileBarChart) + label + chevron, styled like the existing nav items. When `collapsed`, render only the icon (clicking expands the sidebar then opens the group).
- When `reportsOpen && !collapsed`, render the 8 sub-items as an indented `<ul className="mt-1 ml-3 pl-3 border-l border-sidebar-border/60 space-y-1">` using the same Link styling pattern. Each sub-item gets its own icon from the list above.

### 2. New route files (one per sub-screen)
Create flat-named files under `src/routes/`:
- `reports.transit-eway-bill.tsx`
- `reports.pending-pods.tsx`
- `reports.freight-bills.tsx`
- `reports.loading-factor-cost.tsx`
- `reports.business-share-matrix.tsx`
- `reports.damage-list.tsx`
- `reports.insurance.tsx`
- `reports.service-level-report.tsx`

Plus an index route `reports.index.tsx` at `/reports` that shows a tile grid linking to all 8 sub-reports (acts as a hub when the user clicks the parent label).

Each route exports `Route = createFileRoute("/reports/...")({ head: () => ({ meta: [{ title: "... · HBL LE" }, { name: "description", content: "..." }] }), component: PageComponent })`.

### 3. New shared component `src/components/report-placeholder.tsx`
A reusable wrapper used by all 8 sub-screens so they look consistent and finished without duplicating layout:
- Props: `{ title: string; description: string; icon: LucideIcon }`
- Renders a page header with the icon in a gradient tile, title, description, then a filters row (Date Range, Plant, Division, "Export XLS" button — visual only, no logic) and an empty-state card: "Run the report to see data — connect Lovable Cloud to wire live data."
- Pure presentational; no backend.

Each `reports.<name>.tsx` simply imports `ReportPlaceholder` and passes its own title/description/icon. The index hub renders 8 large clickable tiles using `<Link>` with the same icons used in the sidebar.

### 4. No other files touched
No edits to `routeTree.gen.ts` (auto-generated), no backend, no schema. The existing `/service-level` operational screen is untouched; the report variant lives at `/reports/service-level-report`.
