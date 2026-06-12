## Changes

1. **Upload the HBL "H" logo** (from the attached image) as a Lovable Asset → `src/assets/hbl-favicon.png.asset.json`.

2. **Update `src/routes/__root.tsx`**:
   - Change root `title` meta to `"HBL LOGISTICS EXECUTION"` (also update `og:title` and `twitter:title` for consistency).
   - Add favicon `link` entries in `links[]` pointing to the uploaded asset URL (rel `icon` and `apple-touch-icon`).

3. **Per-route title overrides** — child routes currently append their own suffix (e.g. `"Dispatch Orders · HBL LE"`). Leaving these as-is means non-root pages keep their existing titles. No changes to child route `head()` definitions.

No other files or behavior change.
