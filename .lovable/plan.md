## Goal
On every Reports screen, keep the title/header card fixed at the top and make only the filters + results area scrollable.

## Affected files
All 8 report route files:
- reports.index.tsx
- reports.business-share-matrix.tsx
- reports.damage-list.tsx
- reports.freight-bills.tsx
- reports.insurance.tsx
- reports.loading-factor-cost.tsx
- reports.pending-pods.tsx
- reports.service-level-report.tsx
- reports.transit-eway-bill.tsx

## Change
Replace each screen's outer `<div className="p-4 sm:p-6 lg:p-8 space-y-5">` wrapper with a flex column that fills the parent height:

```
<div className="flex flex-col h-full">
  <div className="px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 pb-3 shrink-0">
    {/* title/header card — stays fixed */}
  </div>
  <div className="flex-1 overflow-y-auto scrollbar-elegant px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8 space-y-5">
    {/* filters card + empty-state / results card — scrolls */}
  </div>
</div>
```

No logic changes; presentation only. Relies on `main` in `app-shell.tsx` already providing a bounded scroll container.
