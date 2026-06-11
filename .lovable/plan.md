## Goal
Tighten the Transit Damage Info create screen:
1. **With SAP** — keep the Invoice Number + GET lookup, but the field grid and bottom (secondary) table must stay hidden until the user types an Invoice Number and clicks GET. Today it renders revealed by default.
2. **Without SAP** — drop the "DC Reference Number" lookup row and its GET button entirely. Instead, surface **DC Reference Number** as a regular field inside the emerald field grid, placed right next to **Invoice Date**. Without-SAP no longer has a GET gate, so its fields and secondary table render immediately.

No other screens, no logic/data changes — UI-only edits inside `src/components/transit-damage-info-sap-create.tsx`.

## Files

### `src/components/transit-damage-info-sap-create.tsx`
- Initial state:
  - `revealed` starts `true` for without-SAP, `false` for with-SAP (`useState(isWithout)`).
  - `lookupValue` only meaningful for with-SAP; default `""` so GET is disabled until typed.
- Lookup bar:
  - With SAP: render the Invoice Number label + input + GET button (unchanged behaviour, but GET is the only way to reveal fields). Keep the Select + search input row.
  - Without SAP: remove the lookup label/input/GET block entirely. Keep just the Select dropdown + search input row (so the search bar still exists for filtering refs).
- Field grid `FIELDS` array:
  - For without-SAP, insert a new entry `{ label: "DC Reference Number" }` immediately AFTER `Invoice Date` (so it sits beside it in the 3-col grid). With-SAP keeps the original 13-field list unchanged. Compute the field list at render time based on `isWithout`.
- "Enter a … GET to load fields" helper text: only show for with-SAP when `!revealed`. Remove for without-SAP.
- Secondary table + footer: continue to render together with the field grid (i.e. inside the `showFields` block), so with-SAP hides them until GET, without-SAP shows them immediately.

## Result
- With SAP: clean lookup-first flow — chips + reference table + Invoice Number/GET bar are visible; only after a valid Invoice Number + GET do the field grid, secondary table, and footer appear.
- Without SAP: no extra lookup row; field grid (now including DC Reference Number beside Invoice Date), secondary table, and footer are always visible under the chips + reference table + search bar.
