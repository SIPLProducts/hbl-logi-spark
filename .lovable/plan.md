# Give each Report screen its own self-contained file

## Current state
All 8 report routes (`src/routes/reports.*.tsx`) render a shared `src/components/report-placeholder.tsx`. They differ only in title/description/icon, so every screen looks identical and any change to one requires editing the shared file.

## Goal
Each report screen owns its full implementation in its own route file — no shared `ReportPlaceholder` import. Screens remain independent and can diverge later without touching siblings.

## Files touched

Rewrite each of these route files to inline the full page (header card + filters card + empty-state card), keeping the current visual design and filter set:

1. `src/routes/reports.transit-eway-bill.tsx`
2. `src/routes/reports.pending-pods.tsx`
3. `src/routes/reports.freight-bills.tsx`
4. `src/routes/reports.loading-factor-cost.tsx`
5. `src/routes/reports.business-share-matrix.tsx`
6. `src/routes/reports.damage-list.tsx`
7. `src/routes/reports.insurance.tsx`
8. `src/routes/reports.service-level-report.tsx`

Delete after migration:
- `src/components/report-placeholder.tsx` (no longer imported anywhere)

Unchanged:
- `src/routes/reports.index.tsx` (hub page)
- `src/lib/reports-nav.ts` (nav metadata)

## Per-file shape

Each route file will contain:
- `createFileRoute(...)` with its current path
- A local `Page` component rendering the same three cards (header, filters, empty state) currently produced by `ReportPlaceholder`
- Local `SelectField` and `DateField` helpers (or inline JSX) — kept file-local so each screen is truly independent
- Its own filter list constant (currently identical across screens: Inward/Outward, SAP/Non-SAP, From/To Date, Transporter Group, Transporter, Plant, Product, Division, Customer Name, Branch, Branch Zone, Destination Location, Destination State, Destination Zone, Incoterms)

Yes, this duplicates markup across 8 files by design — that's the point of the request (independence over DRY). Screens can now diverge freely.

## Out of scope
- No logic changes, no new fields, no API wiring
- Reports hub (`reports.index.tsx`) and `REPORTS_NAV` untouched
- No styling changes beyond what's already in `ReportPlaceholder`
