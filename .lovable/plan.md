# Plan: Replace HBL Text Logo with Uploaded HBL Image

## Change
In `src/components/app-sidebar.tsx`, replace the gradient box containing the "HBL" text (lines 83-85) with the uploaded HBL logo image.

## Steps
1. Upload `/mnt/user-uploads/hbl.png` via `lovable-assets` CLI → `src/assets/hbl-logo.png.asset.json`
2. Import the pointer JSON in `app-sidebar.tsx`
3. Replace the gradient `<div>HBL</div>` with an `<img>` using the asset URL, sized `size-9`, with a white rounded background so the dark maroon logo stays legible on the dark sidebar (e.g. `bg-white rounded-xl p-1 object-contain`)
4. Keep the "Logistics Execution" / "HBL Power Systems" text block unchanged

## Files
- `src/assets/hbl-logo.png.asset.json` (new)
- `src/components/app-sidebar.tsx` (edited)