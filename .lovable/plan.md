## Plan: Clean slideshow — no padding, no backdrop

In `src/routes/login.tsx`, on the right `<aside>`:

1. Remove `bg-slate-100` from the `<aside>` (transparent, inherits page bg).
2. Remove the wrapper `<div className="absolute inset-0 p-6 pb-[140px]">` — render `<img>` elements directly inside `<aside>`.
3. On each `<img>`, drop `p-6 pb-[140px]` and keep `absolute inset-0 size-full object-contain` so the image fits the full slider area, preserving aspect ratio (no cropping, no distortion).
4. Keep the bottom branding band as-is; it sits above the images via z-order.
5. Keep dot indicators where they are (just above the branding band).

Result: images render at their native aspect ratio, filling the slider area as much as possible without cropping or stretching, and with no surrounding padding or colored backdrop.
