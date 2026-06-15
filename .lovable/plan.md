## Goal
On the Dispatch Creation screen (`/dispatch` → Create tab), the form currently forces the whole page to scroll vertically. Make it fit within the viewport so only the data table area scrolls internally, not the entire page.

## Changes (single file: `src/routes/dispatch.tsx`)

1. **Make the page a fixed-height flex column**
   - Change the outer wrapper from `flex flex-col min-h-full` to `flex flex-col h-full overflow-hidden` so the page owns the viewport height instead of growing.
   - Make the `<Tabs>` container `flex flex-col flex-1 min-h-0` so its content can shrink.
   - Change the body wrapper (currently `flex-1 px-… py-2`) to `flex-1 min-h-0 overflow-hidden` and give each `TabsContent` `h-full` so the Create panel fills remaining height.

2. **Tighten the sticky header**
   - Drop breadcrumb bottom margin (`mb-1.5` → `mb-1`) and reduce header vertical padding (`pt-2 pb-2` → `pt-1.5 pb-1.5`).
   - Keep title/tabs/refresh on a single row (already are at sm+).

3. **Make `CreateDispatch` a height-bounded column**
   - Wrap in `flex flex-col h-full min-h-0 gap-2` (replacing `space-y-2`).
   - Toolbar card: reduce padding (`px-2.5 py-1.5` → `px-2 py-1`) and helper text margins.
   - Dispatch Lines card: add `flex-1 min-h-0 flex flex-col` so it absorbs remaining height.
     - Card header: shrink padding (`px-5 py-4` → `px-3 py-2`), title size (`text-[14px]` → `text-[13px]`), drop the "x rows · auto-numbered" line to a single inline span.
     - Table scroll container: change `overflow-x-auto` → `flex-1 min-h-0 overflow-auto` so the table scrolls inside the card, not the page.
     - Reduce header `th` padding (`px-3 py-3` → `px-2 py-1.5`) and body `td` padding (`py-1.5` → `py-1`).
     - Empty-state row: shrink `py-10` → `py-6`.

4. **Slim the sticky footer**
   - Reduce `py-3.5` → `py-2`, drop the negative margins that aren't needed inside the bounded card area, keep buttons at `h-7`.

## Out of scope
- No changes to fields, columns, business logic, mock data, or the Search tab beyond what's needed for the shared body wrapper to be height-bounded.
- No restyling of colors, fonts, or component variants.

## Verification
- At the current preview viewport (≈889×528), with Outward + With SAP selected and 0–5 rows added, the page should not scroll; only the table area scrolls horizontally and (if needed) vertically inside its card. Sticky footer remains visible.
