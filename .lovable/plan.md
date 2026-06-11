## Problem
In Transit Damage Info, switching the SAP toggle from With SAP to Without SAP doesn't show the field grid / secondary table / footer. Cause: `TransitDamageInfoSapCreate` initializes `revealed` with `useState(isWithout)`. The component instance is reused across SAP toggles, so the initializer only runs once (when `mode="with"`, giving `revealed=false`) and never updates when `mode` flips to `"without"`.

## Fix
Edit `src/components/transit-damage-info-sap-create.tsx` only:

- Replace the `revealed` gating with one that always honors the current `mode`:
  - Keep `const [revealed, setRevealed] = useState(false);` (only meaningful for with-SAP).
  - Compute `const showFields = isWithout || revealed;` so without-SAP always renders the field grid, secondary table, and footer regardless of toggle history.
- Leave the GET-button gate for with-SAP unchanged (`setRevealed(true)` on GET, helper text shown only when `!isWithout && !revealed`).

No other files touched. Pure UI fix.
